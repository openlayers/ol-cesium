goog.provide('olcs.RasterSynchronizer');

goog.require('goog.events');



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
      olcs.RasterSynchronizer.syncLayerProperties(el, cesiumLayer);
      goog.events.listen(el,
          ['change:brightness', 'change:contrast', 'change:hue',
           'change:opacity', 'change:saturation', 'change:visible'],
          function(e) {
            olcs.RasterSynchronizer.syncLayerProperties(el, cesiumLayer);
          });
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

  var source = olLayer.getSource(),
      tileGrid = source.getTileGrid();
  if (source instanceof ol.source.OSM) {
    provider = new Cesium.OpenStreetMapImageryProvider({
      //TODO: url, fileExtension, rectangle, credit, maximumLevel
      minimumLevel: !goog.isNull(tileGrid) ? tileGrid.getMinZoom() : undefined
    });
  } else if (source instanceof ol.source.BingMaps) {
    //TODO: url, key, tileProtocol, mapStyle
    provider = new Cesium.BingMapsImageryProvider({
      url: '//dev.virtualearth.net'
    });
  } else if (source instanceof ol.source.TileWMS) {
    //TODO: url, layers, parameters, rectangle, maximumLevel, credit
    provider = new Cesium.WebMapServiceImageryProvider({});
  } else if (source instanceof ol.source.XYZ) {
    //TODO: url, fileExtension, credit, rectangle, tilingScheme, maximumLevel

    // The tile size should be the same for all the zoom levels in this case
    var tileSize = !goog.isNull(tileGrid) ? tileGrid.getTileSize(0) : undefined;
    provider = new Cesium.TileMapServiceImageryProvider({
      minimumLevel: !goog.isNull(tileGrid) ? tileGrid.getMinZoom() : undefined,
      tileWidth: tileSize,
      tileHeight: tileSize
    });
  }

  return goog.isNull(provider) ? null : new Cesium.ImageryLayer(provider);
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
