import type Projection from 'ol/proj/Projection.js';
import type { Billboard, BillboardCollection, Primitive, PrimitiveCollection, Scene } from 'cesium';
import type { EventsKey } from 'ol/events.js';
/**
 * Context for feature conversion.
 */
export type OlFeatureToCesiumContext = {
    projection: Projection | string;
    billboards: BillboardCollection;
    featureToCesiumMap: Record<number, Array<Primitive | Billboard>>;
    primitives: PrimitiveCollection;
};
export type PrimitiveCollectionCounterpart = PrimitiveCollection & {
    counterpart: VectorLayerCounterpart;
};
declare class VectorLayerCounterpart {
    olListenKeys: EventsKey[];
    context: OlFeatureToCesiumContext;
    private rootCollection_;
    /**
    * Result of the conversion of an OpenLayers layer to Cesium.
    */
    constructor(layerProjection: Projection | string, scene: Scene);
    /**
    * Unlisten.
    */
    destroy(): void;
    getRootPrimitive(): PrimitiveCollection;
}
export default VectorLayerCounterpart;
