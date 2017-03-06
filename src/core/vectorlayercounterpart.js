goog.provide('olcs.core.VectorLayerCounterpart');

goog.require('ol.Observable');



/**
 * Result of the conversion of an OpenLayers layer to Cesium.
 * @constructor
 * @param {!(ol.proj.Projection|string)} layerProjection
 * @param {!Cesium.Scene} scene
 */
olcs.core.VectorLayerCounterpart = function(layerProjection, scene) {
  const billboards = new Cesium.BillboardCollection({scene});
  const primitives = new Cesium.PrimitiveCollection();

  /**
   * @type {!Array.<ol.EventsKey>}
   */
  this.olListenKeys = [];

  this.rootCollection_ = new Cesium.PrimitiveCollection();
  /**
   * @type {!olcsx.core.OlFeatureToCesiumContext}
   */
  this.context = {
    projection: layerProjection,
    billboards,
    featureToCesiumMap: {},
    primitives
  };

  this.rootCollection_.add(billboards);
  this.rootCollection_.add(primitives);
};


/**
 * Unlisten.
 */
olcs.core.VectorLayerCounterpart.prototype.destroy = function() {
  this.olListenKeys.forEach(ol.Observable.unByKey);
  this.olListenKeys.length = 0;
};


/**
 * @return {!Cesium.Primitive}
 */
olcs.core.VectorLayerCounterpart.prototype.getRootPrimitive = function() {
  return this.rootCollection_;
};
