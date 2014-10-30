goog.provide('olcs.core.OlLayerPrimitive');


/**
 * Context for feature conversion.
 * @typedef {{
 *  projection: (!(ol.proj.Projection|string)),
 *  primitives: (!Cesium.PrimitiveCollection),
 *  featureToCesiumMap: (Object.<
 *    number,
 *    !Cesium.Primitive|!Cesium.Billboard>),
 *  billboards: (!Cesium.BillboardCollection)
 * }}
 * @api
 */
olcs.core.OlFeatureToCesiumContext;



/**
 * Result of the conversion of an OpenLayers layer to Cesium.
 * @constructor
 * @param {!(ol.proj.Projection|string)} layerProjection
 * @extends {Cesium.PrimitiveCollection}
 */
olcs.core.OlLayerPrimitive = function(layerProjection) {
  goog.base(this);

  var billboards = new Cesium.BillboardCollection();
  var primitives = new Cesium.PrimitiveCollection();

  /**
   * @type {!olcs.core.OlFeatureToCesiumContext}
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


