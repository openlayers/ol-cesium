/**
 * @module olcs.AbstractSynchronizer
 */
import {unByKey as olObservableUnByKey} from 'ol/Observable.js';
import olLayerGroup from 'ol/layer/Group.js';
import {olcsListen, getUid} from './util.js';


class AbstractSynchronizer {
  /**
   * @param {!ol.Map} map
   * @param {!Cesium.Scene} scene
   * @template T
   * @abstract
   * @api
   */
  constructor(map, scene) {
    /**
     * @type {!ol.Map}
     * @protected
     */
    this.map = map;

    /**
     * @type {ol.View}
     * @protected
     */
    this.view = map.getView();

    /**
     * @type {!Cesium.Scene}
     * @protected
     */
    this.scene = scene;

    /**
     * @type {ol.Collection.<ol.layer.Base>}
     * @protected
     */
    this.olLayers = map.getLayerGroup().getLayers();

    /**
     * @type {ol.layer.Group}
     */
    this.mapLayerGroup = map.getLayerGroup();

    /**
     * Map of OpenLayers layer ids (from getUid) to the Cesium ImageryLayers.
     * Null value means, that we are unable to create equivalent layers.
     * @type {Object.<string, ?Array.<T>>}
     * @protected
     */
    this.layerMap = {};

    /**
     * Map of listen keys for OpenLayers layer layers ids (from getUid).
     * @type {!Object.<string, Array<ol.EventsKey>>}
     * @protected
     */
    this.olLayerListenKeys = {};

    /**
     * Map of listen keys for OpenLayers layer groups ids (from getUid).
     * @type {!Object.<string, !Array.<ol.EventsKey>>}
     * @private
     */
    this.olGroupListenKeys_ = {};
  }

  /**
   * Destroy all and perform complete synchronization of the layers.
   * @api
   */
  synchronize() {
    this.destroyAll();
    this.addLayers_(this.mapLayerGroup);
  }

  /**
   * Order counterparts using the same algorithm as the Openlayers renderer:
   * z-index then original sequence order.
   * @protected
   */
  orderLayers() {
    // Ordering logics is handled in subclasses.
  }

  /**
   * Add a layer hierarchy.
   * @param {ol.layer.Base} root
   * @private
   */
  addLayers_(root) {
    /** @type {Array<import('olsc/core.js').LayerWithParents>} */
    const fifo = [{
      layer: root,
      parents: []
    }];
    while (fifo.length > 0) {
      const olLayerWithParents = fifo.splice(0, 1)[0];
      const olLayer = olLayerWithParents.layer;
      const olLayerId = getUid(olLayer).toString();
      this.olLayerListenKeys[olLayerId] = [];
      console.assert(!this.layerMap[olLayerId]);

      let cesiumObjects = null;
      if (olLayer instanceof olLayerGroup) {
        this.listenForGroupChanges_(olLayer);
        if (olLayer !== this.mapLayerGroup) {
          cesiumObjects = this.createSingleLayerCounterparts(olLayerWithParents);
        }
        if (!cesiumObjects) {
          olLayer.getLayers().forEach((l) => {
            if (l) {
              const newOlLayerWithParents = {
                layer: l,
                parents: olLayer === this.mapLayerGroup ?
                  [] :
                  [olLayerWithParents.layer].concat(olLayerWithParents.parents)
              };
              fifo.push(newOlLayerWithParents);
            }
          });
        }
      } else {
        cesiumObjects = this.createSingleLayerCounterparts(olLayerWithParents);
        if (!cesiumObjects) {
          // keep an eye on the layers that once failed to be added (might work when the layer is updated)
          // for example when a source is set after the layer is added to the map
          const layerId = olLayerId;
          const layerWithParents = olLayerWithParents;
          const onLayerChange = (e) => {
            const cesiumObjs = this.createSingleLayerCounterparts(layerWithParents);
            if (cesiumObjs) {
              // unsubscribe event listener
              layerWithParents.layer.un('change', onLayerChange);
              this.addCesiumObjects_(cesiumObjs, layerId, layerWithParents.layer);
              this.orderLayers();
            }
          };
          this.olLayerListenKeys[olLayerId].push(olcsListen(layerWithParents.layer, 'change', onLayerChange));
        }
      }
      // add Cesium layers
      if (cesiumObjects) {
        this.addCesiumObjects_(cesiumObjects, olLayerId, olLayer);
      }
    }

    this.orderLayers();
  }

  /**
   * Add Cesium objects.
   * @param {Array.<T>} cesiumObjects
   * @param {string} layerId
   * @param {ol.layer.Base} layer
   * @private
   */
  addCesiumObjects_(cesiumObjects, layerId, layer) {
    this.layerMap[layerId] = cesiumObjects;
    this.olLayerListenKeys[layerId].push(olcsListen(layer, 'change:zIndex', () => this.orderLayers()));
    cesiumObjects.forEach((cesiumObject) => {
      this.addCesiumObject(cesiumObject);
    });
  }

  /**
   * Remove and destroy a single layer.
   * @param {ol.layer.Layer} layer
   * @return {boolean} counterpart destroyed
   * @private
   */
  removeAndDestroySingleLayer_(layer) {
    const uid = getUid(layer).toString();
    const counterparts = this.layerMap[uid];
    if (!!counterparts) {
      counterparts.forEach((counterpart) => {
        this.removeSingleCesiumObject(counterpart, false);
        this.destroyCesiumObject(counterpart);
      });
      this.olLayerListenKeys[uid].forEach(olObservableUnByKey);
      delete this.olLayerListenKeys[uid];
    }
    delete this.layerMap[uid];
    return !!counterparts;
  }

  /**
   * Unlisten a single layer group.
   * @param {ol.layer.Group} group
   * @private
   */
  unlistenSingleGroup_(group) {
    if (group === this.mapLayerGroup) {
      return;
    }
    const uid = getUid(group).toString();
    const keys = this.olGroupListenKeys_[uid];
    keys.forEach((key) => {
      olObservableUnByKey(key);
    });
    delete this.olGroupListenKeys_[uid];
    delete this.layerMap[uid];
  }

  /**
   * Remove layer hierarchy.
   * @param {ol.layer.Base} root
   * @private
   */
  removeLayer_(root) {
    if (!!root) {
      const fifo = [root];
      while (fifo.length > 0) {
        const olLayer = fifo.splice(0, 1)[0];
        const done = this.removeAndDestroySingleLayer_(olLayer);
        if (olLayer instanceof olLayerGroup) {
          this.unlistenSingleGroup_(olLayer);
          if (!done) {
            // No counterpart for the group itself so removing
            // each of the child layers.
            olLayer.getLayers().forEach((l) => {
              fifo.push(l);
            });
          }
        }
      }
    }
  }

  /**
   * Register listeners for single layer group change.
   * @param {ol.layer.Group} group
   * @private
   */
  listenForGroupChanges_(group) {
    const uuid = getUid(group).toString();

    console.assert(this.olGroupListenKeys_[uuid] === undefined);

    const listenKeyArray = [];
    this.olGroupListenKeys_[uuid] = listenKeyArray;

    // only the keys that need to be relistened when collection changes
    let contentKeys = [];
    const listenAddRemove = (function() {
      const collection = group.getLayers();
      if (collection) {
        contentKeys = [
          collection.on('add', (event) => {
            this.addLayers_(event.element);
          }),
          collection.on('remove', (event) => {
            this.removeLayer_(event.element);
          })
        ];
        listenKeyArray.push(...contentKeys);
      }
    }).bind(this);

    listenAddRemove();

    listenKeyArray.push(group.on('change:layers', (e) => {
      contentKeys.forEach((el) => {
        const i = listenKeyArray.indexOf(el);
        if (i >= 0) {
          listenKeyArray.splice(i, 1);
        }
        olObservableUnByKey(el);
      });
      listenAddRemove();
    }));
  }

  /**
   * Destroys all the created Cesium objects.
   * @protected
   */
  destroyAll() {
    this.removeAllCesiumObjects(true); // destroy
    let objKey;
    for (objKey in this.olGroupListenKeys_) {
      const keys = this.olGroupListenKeys_[objKey];
      keys.forEach(olObservableUnByKey);
    }
    for (objKey in this.olLayerListenKeys) {
      this.olLayerListenKeys[objKey].forEach(olObservableUnByKey);
    }
    this.olGroupListenKeys_ = {};
    this.olLayerListenKeys = {};
    this.layerMap = {};
  }

  /**
   * Adds a single Cesium object to the collection.
   * @param {!T} object
   * @abstract
   * @protected
   */
  addCesiumObject(object) {}

  /**
   * @param {!T} object
   * @abstract
   * @protected
   */
  destroyCesiumObject(object) {}

  /**
   * Remove single Cesium object from the collection.
   * @param {!T} object
   * @param {boolean} destroy
   * @abstract
   * @protected
   */
  removeSingleCesiumObject(object, destroy) {}

  /**
   * Remove all Cesium objects from the collection.
   * @param {boolean} destroy
   * @abstract
   * @protected
   */
  removeAllCesiumObjects(destroy) {}

  /**
   * @param {import('olsc/core.js').LayerWithParents} olLayerWithParents
   * @return {?Array.<T>}
   * @abstract
   * @protected
   */
  createSingleLayerCounterparts(olLayerWithParents) {}
}


export default AbstractSynchronizer;
