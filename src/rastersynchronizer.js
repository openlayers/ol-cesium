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
 * Creates a Cesium.ImageryLayer.
 * May be overriden by child classes to implement custom behavior.
 * The default implementation handles tiled imageries in EPSG:4326 or
 * EPSG:3859.
 * @param {!ol.layer.Layer} olLayer
 * @param {?ol.proj.Projection} viewProj Projection of the view.
 * @return {?Cesium.ImageryLayer} null if not possible (or supported)
 * @protected
 */
olcs.RasterSynchronizer.prototype.convertLayerToCesiumImagery =
    olcs.core.tileLayerToImageryLayer;


/**
 * @inheritDoc
 */
olcs.RasterSynchronizer.prototype.createSingleCounterpart = function(olLayer) {
  var viewProj = this.view.getProjection();
  var cesiumObject = this.convertLayerToCesiumImagery(olLayer, viewProj);
  if (!goog.isNull(cesiumObject)) {
    olLayer.on(
        ['change:brightness', 'change:contrast', 'change:hue',
         'change:opacity', 'change:saturation', 'change:visible'],
        function(e) {
          // the compiler does not seem to be able to infer this
          if (!goog.isNull(cesiumObject)) {
            olcs.core.updateCesiumLayerProperties(olLayer, cesiumObject);
          }
        });
    olcs.core.updateCesiumLayerProperties(olLayer, cesiumObject);

    // there is no way to modify Cesium layer extent,
    // we have to recreate when ol3 layer extent changes:
    olLayer.on('change:extent', function(e) {
      this.cesiumLayers_.remove(cesiumObject, true); // destroy
      this.ourLayers_.remove(cesiumObject, false);
      delete this.layerMap[goog.getUid(olLayer)]; // invalidate the map entry
      this.synchronize();
    }, this);

    olLayer.on('change', function(e) {
      // when the source changes, re-add the layer to force update
      var position = this.cesiumLayers_.indexOf(cesiumObject);
      if (position >= 0) {
        this.cesiumLayers_.remove(cesiumObject, false);
        this.cesiumLayers_.add(cesiumObject, position);
      }
    }, this);
  }

  return cesiumObject;
};
