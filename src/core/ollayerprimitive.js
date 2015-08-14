goog.provide('olcs.core.OlLayerPrimitive');



/**
 * Result of the conversion of an OpenLayers layer to Cesium.
 * @constructor
 * @param {!(ol.proj.Projection|string)} layerProjection
 * @param {!Cesium.Scene} scene
 * @extends {Cesium.PrimitiveCollection}
 */
olcs.core.OlLayerPrimitive = function(layerProjection, scene) {
  if (!olcs.core.OlLayerPrimitive.initialized_) {
    olcs.core.OlLayerPrimitive.initialized_ = true;
    goog.inherits(olcs.core.OlLayerPrimitive, Cesium.PrimitiveCollection);
  }

  // Directly call the super constructor instead of using
  // goog.base to avoid a check for goog.inherits() by the compiler.
  // This matches the code produced by the compiler.
  Cesium.PrimitiveCollection.call(this);

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
