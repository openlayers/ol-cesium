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
