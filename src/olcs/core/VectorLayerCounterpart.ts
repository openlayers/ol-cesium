import {unByKey as olObservableUnByKey} from 'ol/Observable.js';
import type Projection from 'ol/proj/Projection.js';
import type {Billboard, BillboardCollection, Primitive, PrimitiveCollection, Scene} from 'cesium';
import type {EventsKey} from 'ol/events.js';


/**
 * Context for feature conversion.
 */
export type OlFeatureToCesiumContext = {
  projection: Projection | string,
  billboards: BillboardCollection,
  featureToCesiumMap: Record<number, Array<Primitive | Billboard>>,
  primitives: PrimitiveCollection
};


export default class VectorLayerCounterpart {
  olListenKeys: EventsKey[] = [];
  context: OlFeatureToCesiumContext;
  private rootCollection_: PrimitiveCollection;
  /**
  * Result of the conversion of an OpenLayers layer to Cesium.
  */
  constructor(layerProjection: Projection | string, scene: Scene) {
    const billboards = new Cesium.BillboardCollection({scene});
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

  getRootPrimitive(): PrimitiveCollection {
    return this.rootCollection_;
  }
}


export type PrimitiveCollectionCounterpart = PrimitiveCollection & {counterpart: VectorLayerCounterpart};
