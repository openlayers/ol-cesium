goog.provide('olcs.core');

goog.require('goog.array');

goog.require('olcs.OLImageryProvider');


/**
 * Rotate the camera so that its direction goes through the target point.
 * If a globe is given, the target height is first interpolated from terrain.
 * @param {!Cesium.Camera} camera
 * @param {!Cesium.Cartographic} target
 * @param {Cesium.Globe=} opt_globe
 * @api
 */
olcs.core.lookAt = function(camera, target, opt_globe) {
  if (goog.isDef(opt_globe)) {
    var height = opt_globe.getHeight(target);
    target.height = goog.isDef(height) ? height : 0;
  }

  var ellipsoid = Cesium.Ellipsoid.WGS84;
  target = ellipsoid.cartographicToCartesian(target);

  var position = camera.position;
  var up = new Cesium.Cartesian3();
  ellipsoid.geocentricSurfaceNormal(position, up);

  camera.lookAt(position, target, up);
};


/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer.
 * Only supports raster layers
 * @param {!ol.layer.Layer} olLayer
 * @param {?ol.proj.Projection} viewProj Projection of the view.
 * @return {?Cesium.ImageryLayer} null if not possible (or supported)
 * @api
 */
olcs.core.createCorrespondingLayer = function(olLayer, viewProj) {
  if (!(olLayer instanceof ol.layer.Tile)) {
    return null;
  }

  var provider = null;

  var source = olLayer.getSource();
  // handle special cases before the general synchronization
  if (source instanceof ol.source.WMTS) {
    // WMTS uses different TileGrid which is not currently supported
    return null;
  }
  if (source instanceof ol.source.TileImage) {
    var projection = source.getProjection();

    if (goog.isNull(projection)) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    } else if (projection !== viewProj) {
      return null; // do not sync layers with projections different than view
    }

    var is3857 = projection === ol.proj.get('EPSG:3857');
    var is4326 = projection === ol.proj.get('EPSG:4326');
    if (is3857 || is4326) {
      provider = new olcs.OLImageryProvider(source, viewProj);
    } else {
      return null;
    }
  } else {
    // sources other than TileImage are currently not supported
    return null;
  }

  // the provider is always non-null if we got this far

  var layerOptions = {};

  var ext = olLayer.getExtent();
  if (goog.isDefAndNotNull(ext) && !goog.isNull(viewProj)) {
    var llExt = ol.proj.transformExtent(ext, viewProj, 'EPSG:4326');
    layerOptions.rectangle = Cesium.Rectangle.fromDegrees(llExt[0], llExt[1],
                                                          llExt[2], llExt[3]);
  }

  var cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
};


/**
 * Synchronizes the layer rendering properties (brightness, contrast, hue,
 * opacity, saturation, visible) to the given Cesium ImageryLayer.
 * @param {!ol.layer.Layer} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 * @api
 */
olcs.core.updateCesiumLayerProperties = function(olLayer, csLayer) {
  var opacity = olLayer.getOpacity();
  if (goog.isDef(opacity)) {
    csLayer.alpha = opacity;
  }
  var visible = olLayer.getVisible();
  if (goog.isDef(visible)) {
    csLayer.show = visible;
  }

  // saturation and contrast are working ok
  var saturation = olLayer.getSaturation();
  if (goog.isDef(saturation)) {
    csLayer.saturation = saturation;
  }
  var contrast = olLayer.getContrast();
  if (goog.isDef(contrast)) {
    csLayer.contrast = contrast;
  }

  // Cesium actually operates in YIQ space -> hard to emulate
  // The following values are only a rough approximations:

  // The hue in Cesium has different meaning than the OL equivalent.
  // var hue = olLayer.getHue();
  // if (goog.isDef(hue)) {
  //   csLayer.hue = hue;
  // }

  var brightness = olLayer.getBrightness();
  if (goog.isDef(brightness)) {
    // rough estimation
    csLayer.brightness = Math.pow(1 + parseFloat(brightness), 2);
  }
};
