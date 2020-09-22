/**
 * @module olcs.RasterSynchronizer
 */
import olLayerGroup from 'ol/layer/Group.js';
import {getUid, stableSort} from './util.js';
import olcsAbstractSynchronizer from './AbstractSynchronizer.js';
import olcsCore from './core.js';

class RasterSynchronizer extends olcsAbstractSynchronizer {
  /**
   * This object takes care of one-directional synchronization of
   * Openlayers raster layers to the given Cesium globe.
   * @param {!ol.Map} map
   * @param {!Cesium.Scene} scene
   * @constructor
   * @extends {olcsAbstractSynchronizer.<Cesium.ImageryLayer>}
   * @api
   */
  constructor(map, scene) {
    super(map, scene);

    /**
     * @type {!Cesium.ImageryLayerCollection}
     * @private
     */
    this.cesiumLayers_ = scene.imageryLayers;

    /**
     * @type {!Cesium.ImageryLayerCollection}
     * @private
     */
    this.ourLayers_ = new Cesium.ImageryLayerCollection();
  }

  /**
   * @inheritDoc
   */
  addCesiumObject(object) {
    this.cesiumLayers_.add(object);
    this.ourLayers_.add(object);
  }

  /**
   * @inheritDoc
   */
  destroyCesiumObject(object) {
    object.destroy();
  }

  /**
   * @inheritDoc
   */
  removeSingleCesiumObject(object, destroy) {
    this.cesiumLayers_.remove(object, destroy);
    this.ourLayers_.remove(object, false);
  }

  /**
   * @inheritDoc
   */
  removeAllCesiumObjects(destroy) {
    for (let i = 0; i < this.ourLayers_.length; ++i) {
      this.cesiumLayers_.remove(this.ourLayers_.get(i), destroy);
    }
    this.ourLayers_.removeAll(false);
  }

  /**
   * Creates an array of Cesium.ImageryLayer.
   * May be overriden by child classes to implement custom behavior.
   * The default implementation handles tiled imageries in EPSG:4326 or
   * EPSG:3859.
   * @param {!ol.layer.Base} olLayer
   * @param {!ol.proj.Projection} viewProj Projection of the view.
   * @return {?Array.<!Cesium.ImageryLayer>} array or null if not possible
   * (or supported)
   * @protected
   */
  convertLayerToCesiumImageries(olLayer, viewProj) {
    const result = olcsCore.tileLayerToImageryLayer(this.map, olLayer, viewProj);
    return result ? [result] : null;
  }

  /**
   * @inheritDoc
   */
  createSingleLayerCounterparts(olLayerWithParents) {
    const olLayer = olLayerWithParents.layer;
    const uid = getUid(olLayer).toString();
    const viewProj = this.view.getProjection();
    console.assert(viewProj);
    const cesiumObjects = this.convertLayerToCesiumImageries(olLayer, viewProj);
    if (cesiumObjects) {
      const listenKeyArray = [];
      [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayerItem) => {
        listenKeyArray.push(olLayerItem.on(['change:opacity', 'change:visible'], () => {
          // the compiler does not seem to be able to infer this
          console.assert(cesiumObjects);
          for (let i = 0; i < cesiumObjects.length; ++i) {
            olcsCore.updateCesiumLayerProperties(olLayerWithParents, cesiumObjects[i]);
          }
        }));
      });

      if (olLayer.getStyleFunction) {
        let previousStyleFunction = olLayer.getStyleFunction();
        // there is no convenient way to detect a style function change in OL
        listenKeyArray.push(olLayer.on('change', () => {
          const currentStyleFunction = olLayer.getStyleFunction();
          if (previousStyleFunction === currentStyleFunction) {
            return;
          }
          previousStyleFunction = currentStyleFunction;
          for (let i = 0; i < cesiumObjects.length; ++i) {
            const csObj = cesiumObjects[i];
            // clear cache and set new style
            if (csObj._imageryCache && csObj.imageryProvider.cache_) {
              csObj._imageryCache = {};
              csObj.imageryProvider.cache_ = {};
              csObj.imageryProvider.styleFunction_ = currentStyleFunction;
            }
          }
          this.scene.requestRender();
        }));
      }

      for (let i = 0; i < cesiumObjects.length; ++i) {
        olcsCore.updateCesiumLayerProperties(olLayerWithParents, cesiumObjects[i]);
      }

      // there is no way to modify Cesium layer extent,
      // we have to recreate when OpenLayers layer extent changes:
      listenKeyArray.push(olLayer.on('change:extent', (e) => {
        for (let i = 0; i < cesiumObjects.length; ++i) {
          this.cesiumLayers_.remove(cesiumObjects[i], true); // destroy
          this.ourLayers_.remove(cesiumObjects[i], false);
        }
        delete this.layerMap[getUid(olLayer)]; // invalidate the map entry
        this.synchronize();
      }));

      listenKeyArray.push(olLayer.on('change', (e) => {
        // when the source changes, re-add the layer to force update
        for (let i = 0; i < cesiumObjects.length; ++i) {
          const position = this.cesiumLayers_.indexOf(cesiumObjects[i]);
          if (position >= 0) {
            this.cesiumLayers_.remove(cesiumObjects[i], false);
            this.cesiumLayers_.add(cesiumObjects[i], position);
          }
        }
      }));

      this.olLayerListenKeys[uid].push(...listenKeyArray);
    }

    return Array.isArray(cesiumObjects) ? cesiumObjects : null;
  }

  /**
   * Order counterparts using the same algorithm as the Openlayers renderer:
   * z-index then original sequence order.
   * @override
   * @protected
   */
  orderLayers() {
    const layers = [];
    const zIndices = {};
    const queue = [this.mapLayerGroup];

    while (queue.length > 0) {
      const olLayer = queue.splice(0, 1)[0];
      layers.push(olLayer);
      zIndices[getUid(olLayer)] = olLayer.getZIndex() || 0;

      if (olLayer instanceof olLayerGroup) {
        const sublayers = olLayer.getLayers();
        if (sublayers) {
          // Prepend queue with sublayers in order
          queue.unshift(...sublayers.getArray());
        }
      }
    }

    stableSort(layers, (layer1, layer2) =>
      zIndices[getUid(layer1)] - zIndices[getUid(layer2)]
    );

    layers.forEach((olLayer) => {
      const olLayerId = getUid(olLayer).toString();
      const cesiumObjects = this.layerMap[olLayerId];
      if (cesiumObjects) {
        cesiumObjects.forEach((cesiumObject) => { this.raiseToTop(cesiumObject); });
      }
    });
  }

  /**
   * @param {Cesium.ImageryLayer} counterpart
   */
  raiseToTop(counterpart) {
    this.cesiumLayers_.raiseToTop(counterpart);
  }
}


export default RasterSynchronizer;
