/**
 * @module olcs.core.VectorLayerCounterpart
 */
import { unByKey as olObservableUnByKey } from 'ol/Observable.js';
class VectorLayerCounterpart {
    olListenKeys = [];
    context;
    rootCollection_;
    /**
    * Result of the conversion of an OpenLayers layer to Cesium.
    */
    constructor(layerProjection, scene) {
        const billboards = new Cesium.BillboardCollection({ scene });
        const primitives = new Cesium.PrimitiveCollection();
        this.rootCollection_ = new Cesium.PrimitiveCollection();
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
    getRootPrimitive() {
        return this.rootCollection_;
    }
}
export default VectorLayerCounterpart;
