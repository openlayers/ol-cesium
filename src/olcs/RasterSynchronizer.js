/**
 * @module olcs.RasterSynchronizer
 */
import olLayerGroup from 'ol/layer/Group.js';
import googAsserts from 'goog/asserts.js';
import * as olArray from 'ol/array.js';
import * as olBase from 'ol/index.js';
import olcsAbstractSynchronizer from './AbstractSynchronizer.js';
import olcsCore from './core.js';

/**
 * This object takes care of one-directional synchronization of
 * Openlayers raster layers to the given Cesium globe.
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 * @extends {olcs.AbstractSynchronizer.<Cesium.ImageryLayer>}
 * @api
 * @struct
 */
const exports = function(map, scene) {
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

  olcsAbstractSynchronizer.call(this, map, scene);
};

olBase.inherits(exports, olcsAbstractSynchronizer);


/**
 * @inheritDoc
 */
exports.prototype.addCesiumObject = function(object) {
  this.cesiumLayers_.add(object);
  this.ourLayers_.add(object);
};


/**
 * @inheritDoc
 */
exports.prototype.destroyCesiumObject = function(object) {
  object.destroy();
};


/**
 * @inheritDoc
 */
exports.prototype.removeSingleCesiumObject = function(object, destroy) {
  this.cesiumLayers_.remove(object, destroy);
  this.ourLayers_.remove(object, false);
};


/**
 * @inheritDoc
 */
exports.prototype.removeAllCesiumObjects = function(destroy) {
  for (let i = 0; i < this.ourLayers_.length; ++i) {
    this.cesiumLayers_.remove(this.ourLayers_.get(i), destroy);
  }
  this.ourLayers_.removeAll(false);
};


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
exports.prototype.convertLayerToCesiumImageries = function(olLayer, viewProj) {
  const result = olcsCore.tileLayerToImageryLayer(olLayer, viewProj);
  return result ? [result] : null;
};


/**
 * @inheritDoc
 */
exports.prototype.createSingleLayerCounterparts = function(olLayerWithParents) {
  const olLayer = olLayerWithParents.layer;
  const uid = olBase.getUid(olLayer).toString();
  const viewProj = this.view.getProjection();
  googAsserts.assert(viewProj);
  const cesiumObjects = this.convertLayerToCesiumImageries(olLayer, viewProj);
  if (cesiumObjects) {
    const listenKeyArray = [];
    [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayerItem) => {
      listenKeyArray.push(olLayerItem.on(['change:opacity', 'change:visible'], () => {
        // the compiler does not seem to be able to infer this
        googAsserts.assert(cesiumObjects);
        for (let i = 0; i < cesiumObjects.length; ++i) {
          olcsCore.updateCesiumLayerProperties(olLayerWithParents, cesiumObjects[i]);
        }
      }));
    });

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
      delete this.layerMap[olBase.getUid(olLayer)]; // invalidate the map entry
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
};


/**
 * Order counterparts using the same algorithm as the Openlayers renderer:
 * z-index then original sequence order.
 * @override
 * @protected
 */
exports.prototype.orderLayers = function() {
  const layers = [];
  const zIndices = {};
  const queue = [this.mapLayerGroup];

  while (queue.length > 0) {
    const olLayer = queue.splice(0, 1)[0];
    layers.push(olLayer);
    zIndices[olBase.getUid(olLayer)] = olLayer.getZIndex();

    if (olLayer instanceof olLayerGroup) {
      const sublayers = olLayer.getLayers();
      if (sublayers) {
        // Prepend queue with sublayers in order
        queue.unshift(...sublayers.getArray());
      }
    }
  }

  olArray.stableSort(layers, (layer1, layer2) =>
    zIndices[olBase.getUid(layer1)] - zIndices[olBase.getUid(layer2)]
  );

  layers.forEach((olLayer) => {
    const olLayerId = olBase.getUid(olLayer).toString();
    const cesiumObjects = this.layerMap[olLayerId];
    if (cesiumObjects) {
      cesiumObjects.forEach((cesiumObject) => { this.raiseToTop(cesiumObject); });
    }
  });
};


/**
 * @param {Cesium.ImageryLayer} counterpart
 */
exports.prototype.raiseToTop = function(counterpart) {
  this.cesiumLayers_.raiseToTop(counterpart);
};


export default exports;
