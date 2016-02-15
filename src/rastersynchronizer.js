goog.provide('olcs.RasterSynchronizer');

goog.require('olcs.AbstractSynchronizer');
goog.require('olcs.core');



/**
 * This object takes care of one-directional synchronization of
 * ol3 raster layers to the given Cesium globe.
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

  goog.base(this, map, scene);
};
goog.inherits(olcs.RasterSynchronizer, olcs.AbstractSynchronizer);


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
olcs.RasterSynchronizer.prototype.removeSingleCesiumObject =
    function(object, destroy) {
  this.cesiumLayers_.remove(object, destroy);
  this.ourLayers_.remove(object, false);
};


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.removeAllCesiumObjects = function(destroy) {
  for (var i = 0; i < this.ourLayers_.length; ++i) {
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
olcs.RasterSynchronizer.prototype.convertLayerToCesiumImageries =
    function(olLayer, viewProj) {
  var result = olcs.core.tileLayerToImageryLayer(olLayer, viewProj);
  return result ? [result] : null;
};


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.createSingleLayerCounterparts =
    function(olLayer) {
  var viewProj = this.view.getProjection();
  var cesiumObjects = this.convertLayerToCesiumImageries(olLayer, viewProj);
  if (!goog.isNull(cesiumObjects)) {
    olLayer.on(['change:opacity', 'change:visible'],
        function(e) {
          // the compiler does not seem to be able to infer this
          goog.asserts.assert(!goog.isNull(cesiumObjects));
          for (var i = 0; i < cesiumObjects.length; ++i) {
            olcs.core.updateCesiumLayerProperties(olLayer, cesiumObjects[i]);
          }
        });

    for (var i = 0; i < cesiumObjects.length; ++i) {
      olcs.core.updateCesiumLayerProperties(olLayer, cesiumObjects[i]);
    }

    // there is no way to modify Cesium layer extent,
    // we have to recreate when ol3 layer extent changes:
    olLayer.on('change:extent', function(e) {
      for (var i = 0; i < cesiumObjects.length; ++i) {
        this.cesiumLayers_.remove(cesiumObjects[i], true); // destroy
        this.ourLayers_.remove(cesiumObjects[i], false);
      }
      delete this.layerMap[goog.getUid(olLayer)]; // invalidate the map entry
      this.synchronize();
    }, this);

    olLayer.on('change', function(e) {
      // when the source changes, re-add the layer to force update
      for (var i = 0; i < cesiumObjects.length; ++i) {
        var position = this.cesiumLayers_.indexOf(cesiumObjects[i]);
        if (position >= 0) {
          this.cesiumLayers_.remove(cesiumObjects[i], false);
          this.cesiumLayers_.add(cesiumObjects[i], position);
        }
      }
    }, this);
  }

  return goog.isArray(cesiumObjects) ? cesiumObjects : null;
};


/**
 * Order counterparts using the same algorithm as the Openlayers renderer:
 * z-index then original sequence order.
 * @protected
 */
olcs.RasterSynchronizer.prototype.orderLayers = function() {
  var layers = [];
  var zIndices = {};
  var fifo = [this.mapLayerGroup];

  while (fifo.length > 0) {
    var olLayer = fifo.splice(0, 1)[0];
    layers.push(olLayer);
    zIndices[goog.getUid(olLayer)] = olLayer.getZIndex();

    if (olLayer instanceof ol.layer.Group) {
      var sublayers = olLayer.getLayers();
      if (goog.isDef(sublayers)) {
        sublayers.forEach(function(el) {
          fifo.push(el);
        });
      }
    }
  }

  goog.array.stableSort(layers, function(layer1, layer2) {
    return zIndices[goog.getUid(layer1)] - zIndices[goog.getUid(layer2)];
  });

  layers.forEach(function(olLayer) {
    var olLayerId = goog.getUid(olLayer);
    var cesiumObjects = this.layerMap[olLayerId];
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
