goog.provide('olcs.core.OlLayerPrimitive');



/**
 * Result of the conversion of an OpenLayers layer to Cesium.
 * @constructor
 * @extends {Cesium.PrimitiveCollection}
 */
olcs.core.OlLayerPrimitive = function() {
  goog.base(this);

  /**
   * @type {!Cesium.BillboardCollection}
   */
  this.billboards = new Cesium.BillboardCollection();

  /**
    * @type {!Object.<!ol.Feature, !Cesium.Primitive>}
    */
  this.featurePrimitiveMap = {};
};
goog.inherits(olcs.core.OlLayerPrimitive, Cesium.PrimitiveCollection);



