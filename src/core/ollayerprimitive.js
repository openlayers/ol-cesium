goog.provide('olcs.core.OlLayerPrimitive');



/**
 * Result of the conversion of an OpenLayers layer to Cesium.
 * @constructor
 * @param {!(ol.proj.Projection|string)} layerProjection
 * @param {!Cesium.Scene} scene
 * @extends {Cesium.PrimitiveCollection}
 */
olcs.core.OlLayerPrimitive = function(layerProjection, scene) {
  goog.base(this);

  var billboards = new Cesium.BillboardCollection({scene: scene});
  var primitives = new Cesium.PrimitiveCollection();

  /**
   * @type {!olcsx.core.OlFeatureToCesiumContext}
   */
  this.context = {
    projection: layerProjection,
    billboards: billboards,
    featureToCesiumMap: {},
    primitives: primitives
  };

  this.add(billboards);
};
goog.inherits(olcs.core.OlLayerPrimitive, Cesium.PrimitiveCollection);


/**
 * Convert an OpenLayers feature to Cesium primitive collection.
 * @param {!ol.layer.Vector} layer
 * @param {!ol.View} view
 * @param {!ol.Feature} feature
 * @return {Cesium.Primitive}
 * @api
 */
olcs.core.OlLayerPrimitive.prototype.convert = function(layer, view, feature) {
  var proj = view.getProjection();
  var resolution = view.getResolution();

  if (!goog.isDef(resolution) || !proj) {
    return null;
  }

  var layerStyle = layer.getStyleFunction();
  var style = olcs.core.computePlainStyle(feature, layerStyle, resolution);

  if (!style) {
    // only 'render' features with a style
    return null;
  }

  this.context.projection = proj;
  return olcs.core.olFeatureToCesium(feature, style, this.context);
};


