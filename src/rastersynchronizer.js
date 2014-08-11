goog.provide('olcs.RasterSynchronizer');

goog.require('goog.events');

goog.require('olcs.OLImageryProvider');



/**
 * This object takes care of one-directional synchronization of
 * ol3 raster layers to the given Cesium globe.
 * @param {!ol.Collection} olLayers
 * @param {!Cesium.ImageryLayerCollection} cesiumLayers
 * @constructor
 */
olcs.RasterSynchronizer = function(olLayers, cesiumLayers) {
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
      goog.events.EventType.CHANGE, function(e) {
        this.synchronize_();
      }, false, this);

  this.synchronize_();
};


/**
 * @private
 */
olcs.RasterSynchronizer.prototype.synchronize_ = function() {
  var unusedCesiumLayers = goog.object.transpose(this.layerMap_);
  this.cesiumLayers_.removeAll(false);

  this.olLayers_.forEach(function(el, i, arr) {
    var olLayerId = goog.getUid(el);
    var cesiumLayer = this.layerMap_[olLayerId];

    // no mapping -> create new layer and set up synchronization
    if (!goog.isDef(cesiumLayer)) {
      cesiumLayer = olcs.RasterSynchronizer.createCorrespondingLayer(el);
      if (!goog.isNull(cesiumLayer)) {
        goog.events.listen(el,
            ['change:brightness', 'change:contrast', 'change:hue',
             'change:opacity', 'change:saturation', 'change:visible'],
            function(e) {
              olcs.RasterSynchronizer.syncLayerProperties(el, cesiumLayer);
            });

        // there is no way to modify Cesium layer extent,
        // we have to recreate when ol3 layer extent changes:
        goog.events.listen(el, 'change:extent', function(e) {
          this.cesiumLayers_.remove(cesiumLayer, true); // destroy
          delete this.layerMap_[olLayerId]; // invalidate the map entry
          this.synchronize_();
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

  // destroy unused Cesium ImageryLayers
  goog.object.forEach(unusedCesiumLayers, function(val, key, obj) {
    if (goog.isDefAndNotNull(val)) {
      delete this.layerMap_[key];
      val.destroy();
    }
  }, this);
};


/**
 * @param {!ol.layer.Layer} olLayer
 * @return {?Cesium.ImageryLayer}
 */
olcs.RasterSynchronizer.createCorrespondingLayer = function(olLayer) {
  if (!(olLayer instanceof ol.layer.Tile)) {
    return null;
  }

  var provider = null;

  var source = olLayer.getSource();
  // handle special cases before this general synchronization
  if (source instanceof ol.source.TileImage) {
    var projection = source.getProjection();
    var is3857 = projection === ol.proj.get('EPSG:3857');
    var is4326 = projection === ol.proj.get('EPSG:4326');
    if (is3857 || is4326) {
      provider = new olcs.OLImageryProvider(source);
    }
  }

  if (goog.isNull(provider)) {
    return null;
  } else {
    var ext = olLayer.getExtent();
    var rectangle = goog.isDefAndNotNull(ext) ?
        new Cesium.Rectangle(ext[0], ext[1], ext[2], ext[3]) : undefined;
    var cesiumLayer = new Cesium.ImageryLayer(provider, {
      rectangle: rectangle
    });
    olcs.RasterSynchronizer.syncLayerProperties(olLayer, cesiumLayer);
    return cesiumLayer;
  }
};


/**
 * Synchronizes the layer rendering properties (brightness, contrast, hue,
 * opacity, saturation, visible) to the given Cesium ImageryLayer.
 * @param {!ol.layer.Layer} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 */
olcs.RasterSynchronizer.syncLayerProperties = function(olLayer, csLayer) {
  var brightness = olLayer.getBrightness();
  if (goog.isDef(brightness)) {
    csLayer.brightness = 1 + brightness;
  }

  var contrast = olLayer.getContrast();
  if (goog.isDef(contrast)) {
    csLayer.contrast = contrast;
  }

  var hue = olLayer.getHue();
  if (goog.isDef(hue)) {
    csLayer.hue = hue;
  }

  var opacity = olLayer.getOpacity();
  if (goog.isDef(opacity)) {
    csLayer.alpha = opacity;
  }

  var saturation = olLayer.getSaturation();
  if (goog.isDef(saturation)) {
    csLayer.saturation = saturation;
  }

  var visible = olLayer.getVisible();
  if (goog.isDef(visible)) {
    csLayer.show = visible;
  }
};
