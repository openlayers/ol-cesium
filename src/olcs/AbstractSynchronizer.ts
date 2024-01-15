import {unByKey as olObservableUnByKey} from 'ol/Observable.js';
import LayerGroup from 'ol/layer/Group.js';
import {getUid} from './util';
import type Map from 'ol/Map.js';
import type {Scene, ImageryLayer} from 'cesium';
import type View from 'ol/View.js';
import type Collection from 'ol/Collection.js';
import type BaseLayer from 'ol/layer/Base.js';
import type {EventsKey} from 'ol/events.js';
import type {LayerWithParents} from './core';
import type VectorLayerCounterpart from './core/VectorLayerCounterpart';


export default abstract class AbstractSynchronizer<T extends ImageryLayer | VectorLayerCounterpart> {
  protected map: Map;
  protected view: View;
  protected scene: Scene;
  protected olLayers: Collection<BaseLayer>;
  mapLayerGroup: LayerGroup;
  /**
   * Map of OpenLayers layer ids (from getUid) to the Cesium ImageryLayers.
   * Null value means, that we are unable to create equivalent layers.
   */
  protected layerMap: Record<string, Array<T>> = {};
  /**
   * Map of listen keys for OpenLayers layer layers ids (from getUid).
   */
  protected olLayerListenKeys: Record<string, Array<EventsKey>> = {};
  /**
   * Map of listen keys for OpenLayers layer groups ids (from getUid).
   */
  private olGroupListenKeys_: Record<string, Array<EventsKey>> = {};

  protected constructor(map: Map, scene: Scene) {
    this.map = map;
    this.view = map.getView();
    this.scene = scene;
    this.olLayers = map.getLayerGroup().getLayers();
    this.mapLayerGroup = map.getLayerGroup();
  }

  /**
   * Destroy all and perform complete synchronization of the layers.
   */
  synchronize() {
    this.destroyAll();
    this.addLayers_(this.mapLayerGroup);
  }

  /**
   * Order counterparts using the same algorithm as the Openlayers renderer:
   * z-index then original sequence order.
   */
  protected orderLayers() {
    // Ordering logics is handled in subclasses.
  }

  /**
   * Add a layer hierarchy.
   */
  private addLayers_(root: BaseLayer) {
    const fifo: LayerWithParents[] = [{
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
      if (olLayer instanceof LayerGroup) {
        this.listenForGroupChanges_(olLayer);
        if (olLayer !== this.mapLayerGroup) {
          cesiumObjects = this.createSingleLayerCounterparts(olLayerWithParents);
        }
        if (!cesiumObjects) {
          olLayer.getLayers().forEach((l) => {
            if (l) {
              const newOlLayerWithParents: LayerWithParents = {
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
          const onLayerChange = () => {
            const cesiumObjs = this.createSingleLayerCounterparts(layerWithParents);
            if (cesiumObjs) {
              // unsubscribe event listener
              layerWithParents.layer.un('change', onLayerChange);
              this.addCesiumObjects_(cesiumObjs, layerId, layerWithParents.layer);
              this.orderLayers();
            }
          };
          this.olLayerListenKeys[olLayerId].push(layerWithParents.layer.on('change', onLayerChange));
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
   */
  private addCesiumObjects_(cesiumObjects: Array<T>, layerId: string, layer: BaseLayer) {
    this.layerMap[layerId] = cesiumObjects;
    this.olLayerListenKeys[layerId].push(layer.on('change:zIndex', () => this.orderLayers()));
    cesiumObjects.forEach((cesiumObject) => {
      this.addCesiumObject(cesiumObject);
    });
  }

  /**
   * Remove and destroy a single layer.
   * @param {ol.layer.Layer} layer
   * @return {boolean} counterpart destroyed
   */
  private removeAndDestroySingleLayer_(layer: BaseLayer): boolean {
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
   */
  private unlistenSingleGroup_(group: LayerGroup) {
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
   */
  private removeLayer_(root: BaseLayer) {
    if (!!root) {
      const fifo = [root];
      while (fifo.length > 0) {
        const olLayer = fifo.splice(0, 1)[0];
        const done = this.removeAndDestroySingleLayer_(olLayer);
        if (olLayer instanceof LayerGroup) {
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
   */
  private listenForGroupChanges_(group: LayerGroup) {
    const uuid = getUid(group).toString();

    console.assert(this.olGroupListenKeys_[uuid] === undefined);

    const listenKeyArray: EventsKey[] = [];
    this.olGroupListenKeys_[uuid] = listenKeyArray;

    // only the keys that need to be relistened when collection changes
    let contentKeys: EventsKey[] = [];
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
   */
  public destroyAll() {
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
   */
  protected abstract addCesiumObject(object: T): void;

  protected abstract destroyCesiumObject(object: T): void;

  /**
   * Remove single Cesium object from the collection.
   */
  protected abstract removeSingleCesiumObject(object: T, destroy: boolean): void;

  protected abstract removeAllCesiumObjects(destroy: boolean): void;

  protected abstract createSingleLayerCounterparts(olLayerWithParents: LayerWithParents): Array<T>;
}
