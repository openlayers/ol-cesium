/**
 * @module olcs.core.VectorLayerCounterpart
 */
import {unByKey as olObservableUnByKey} from 'ol/Observable.js';


/**
 * Context for feature conversion.
 * @typedef {Object} OlFeatureToCesiumContext
 * @property {!(import('ol/Projection.js').default|string)} projection
 * @property {!Cesium.PrimitiveCollection} primitives
 * @property {Object<number, Array<!Cesium.Primitive|!Cesium.Billboard>>} featureToCesiumMap
 * @property {!Cesium.BillboardCollection} billboards
 */


class VectorLayerCounterpart {
  /**
  * Result of the conversion of an OpenLayers layer to Cesium.
  * @param {!(ol.proj.Projection|string)} layerProjection
  * @param {!Cesium.Scene} scene
  */
  constructor(layerProjection, scene) {
    const billboards = new Cesium.BillboardCollection({scene});
    const primitives = new Cesium.PrimitiveCollection();

    /**
    * @type {!Array.<ol.EventsKey>}
    */
    this.olListenKeys = [];

    this.rootCollection_ = new Cesium.PrimitiveCollection();
    /**
    * @type {!OlFeatureToCesiumContext}
    */
    this.context = {
      projection: layerProjection,
      billboards,
      featureToCesiumMap: {},
      primitives
    };

    this.rootCollection_.add(billboards);
    this.rootCollection_.add(primitives);
  }

  /**
  * Unlisten.
  */
  destroy() {
    this.olListenKeys.forEach(olObservableUnByKey);
    this.olListenKeys.length = 0;
  }

  /**
  * @return {!Cesium.Primitive}
  */
  getRootPrimitive() {
    return this.rootCollection_;
  }
}


export default VectorLayerCounterpart;
