goog.provide('olcs.RasterSynchronizer');

goog.require('goog.events');

goog.require('olcs.core');



/**
 * This object takes care of one-directional synchronization of
 * ol3 raster layers to the given Cesium globe.
 * @param {!ol.View} view
 * @param {!ol.Collection} olLayers
 * @param {!Cesium.ImageryLayerCollection} cesiumLayers
 * @constructor
 */
olcs.RasterSynchronizer = function(view, olLayers, cesiumLayers) {
  /**
   * @type {!ol.View}
   * @private
   */
  this.view_ = view;

  /**
   * @type {!ol.Collection}
   * @private
   */
  this.olLayers_ = olLayers;

  /**
   * @type {!Cesium.ImageryLayerCollection}
   * @private
   */
  this.cesiumLayers_ = cesiumLayers;

  /**
   * Map of ol3 layer ids (from goog.getUid) to the Cesium ImageryLayers.
   * null value means, that we are unable to create equivalent layer.
   * @type {Object.<number, ?Cesium.ImageryLayer>}
   * @private
   */
  this.layerMap_ = {};

  goog.events.listen(/** @type {!goog.events.EventTarget} */(this.olLayers_),
      [goog.events.EventType.CHANGE, 'add', 'remove'], function(e) {
        this.synchronize();
      }, false, this);
};


/**
 * Performs complete synchronization of the raster layers.
 */
olcs.RasterSynchronizer.prototype.synchronize = function() {
  var unusedCesiumLayers = goog.object.transpose(this.layerMap_);
  this.cesiumLayers_.removeAll(false);

  var viewProj = this.view_.getProjection();

  var synchronizeLayer = goog.bind(function(olLayer) {
    // handle layer groups
    if (olLayer instanceof ol.layer.Group) {
      var sublayers = olLayer.getLayers();
      if (goog.isDef(sublayers)) {
        sublayers.forEach(function(el, i, arr) {
          synchronizeLayer(el);
        });
      }
      return;
    }

    var olLayerId = goog.getUid(olLayer);
    var cesiumLayer = this.layerMap_[olLayerId];

    // no mapping -> create new layer and set up synchronization
    if (!goog.isDef(cesiumLayer)) {
      cesiumLayer = olcs.core.tileLayerToImageryLayer(olLayer, viewProj);
      if (!goog.isNull(cesiumLayer)) {
        goog.events.listen(olLayer,
            ['change:brightness', 'change:contrast', 'change:hue',
             'change:opacity', 'change:saturation', 'change:visible'],
            function(e) {
              olcs.core.updateCesiumLayerProperties(olLayer, cesiumLayer);
            });
        olcs.core.updateCesiumLayerProperties(olLayer, cesiumLayer);

        // there is no way to modify Cesium layer extent,
        // we have to recreate when ol3 layer extent changes:
        goog.events.listen(olLayer, 'change:extent', function(e) {
          this.cesiumLayers_.remove(cesiumLayer, true); // destroy
          delete this.layerMap_[olLayerId]; // invalidate the map entry
          this.synchronize();
        }, false, this);
      }
      this.layerMap_[olLayerId] = cesiumLayer;
    }

    // add Cesium layers
    if (cesiumLayer) {
      this.cesiumLayers_.add(cesiumLayer);
      delete unusedCesiumLayers[cesiumLayer];
    }
  }, this);

  this.olLayers_.forEach(function(el, i, arr) {
    synchronizeLayer(el);
  });

  // destroy unused Cesium ImageryLayers
  goog.array.forEach(goog.object.getValues(unusedCesiumLayers),
      function(el, i, arr) {
        var layerId = el;
        var layer = this.layerMap_[layerId];
        if (goog.isDef(layer)) {
          delete this.layerMap_[layerId];
          layer.destroy();
        }
      }, this);
};
