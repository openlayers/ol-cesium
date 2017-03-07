goog.provide('olcs.RasterSynchronizer');

goog.require('goog.asserts');
goog.require('ol.array');
goog.require('ol');
goog.require('olcs.AbstractSynchronizer');
goog.require('olcs.core');



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
olcs.RasterSynchronizer = function(map, scene) {
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

  olcs.AbstractSynchronizer.call(this, map, scene);
};
ol.inherits(olcs.RasterSynchronizer, olcs.AbstractSynchronizer);


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.addCesiumObject = function(object) {
  this.cesiumLayers_.add(object);
  this.ourLayers_.add(object);
};


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.destroyCesiumObject = function(object) {
  object.destroy();
};


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.removeSingleCesiumObject = function(object, destroy) {
  this.cesiumLayers_.remove(object, destroy);
  this.ourLayers_.remove(object, false);
};


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.removeAllCesiumObjects = function(destroy) {
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
 * @param {?ol.proj.Projection} viewProj Projection of the view.
 * @return {?Array.<!Cesium.ImageryLayer>} array or null if not possible
 * (or supported)
 * @protected
 */
olcs.RasterSynchronizer.prototype.convertLayerToCesiumImageries = function(olLayer, viewProj) {
  const result = olcs.core.tileLayerToImageryLayer(olLayer, viewProj);
  return result ? [result] : null;
};


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.createSingleLayerCounterparts = function(olLayer) {
  const viewProj = this.view.getProjection();
  const cesiumObjects = this.convertLayerToCesiumImageries(olLayer, viewProj);
  if (cesiumObjects) {
    olLayer.on(['change:opacity', 'change:visible'],
        (e) => {
          // the compiler does not seem to be able to infer this
          goog.asserts.assert(cesiumObjects);
          for (let i = 0; i < cesiumObjects.length; ++i) {
            olcs.core.updateCesiumLayerProperties(olLayer, cesiumObjects[i]);
          }
        });

    for (let i = 0; i < cesiumObjects.length; ++i) {
      olcs.core.updateCesiumLayerProperties(olLayer, cesiumObjects[i]);
    }

    // there is no way to modify Cesium layer extent,
    // we have to recreate when OpenLayers layer extent changes:
    olLayer.on('change:extent', function(e) {
      for (let i = 0; i < cesiumObjects.length; ++i) {
        this.cesiumLayers_.remove(cesiumObjects[i], true); // destroy
        this.ourLayers_.remove(cesiumObjects[i], false);
      }
      delete this.layerMap[ol.getUid(olLayer)]; // invalidate the map entry
      this.synchronize();
    }, this);

    olLayer.on('change', function(e) {
      // when the source changes, re-add the layer to force update
      for (let i = 0; i < cesiumObjects.length; ++i) {
        const position = this.cesiumLayers_.indexOf(cesiumObjects[i]);
        if (position >= 0) {
          this.cesiumLayers_.remove(cesiumObjects[i], false);
          this.cesiumLayers_.add(cesiumObjects[i], position);
        }
      }
    }, this);
  }

  return Array.isArray(cesiumObjects) ? cesiumObjects : null;
};


/**
 * Order counterparts using the same algorithm as the Openlayers renderer:
 * z-index then original sequence order.
 * @override
 * @protected
 */
olcs.RasterSynchronizer.prototype.orderLayers = function() {
  const layers = [];
  const zIndices = {};
  const queue = [this.mapLayerGroup];

  while (queue.length > 0) {
    const olLayer = queue.splice(0, 1)[0];
    layers.push(olLayer);
    zIndices[ol.getUid(olLayer)] = olLayer.getZIndex();

    if (olLayer instanceof ol.layer.Group) {
      const sublayers = olLayer.getLayers();
      if (sublayers) {
        // Prepend queue with sublayers in order
        queue.unshift(...sublayers.getArray());
      }
    }
  }

  ol.array.stableSort(layers, (layer1, layer2) =>
     zIndices[ol.getUid(layer1)] - zIndices[ol.getUid(layer2)]
  );

  layers.forEach(function(olLayer) {
    const olLayerId = ol.getUid(olLayer).toString();
    const cesiumObjects = this.layerMap[olLayerId];
    if (cesiumObjects) {
      cesiumObjects.forEach(this.raiseToTop, this);
    }
  }, this);
};


/**
 * @param {Cesium.ImageryLayer} counterpart
 */
olcs.RasterSynchronizer.prototype.raiseToTop = function(counterpart) {
  this.cesiumLayers_.raiseToTop(counterpart);
};
