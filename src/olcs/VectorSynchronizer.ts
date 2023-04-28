/**
 * @module olcs.VectorSynchronizer
 */
import olSourceVector, {VectorSourceEvent} from 'ol/source/Vector.js';
import olLayerLayer from 'ol/layer/Layer.js';
import olSourceCluster from 'ol/source/Cluster.js';
import {olcsListen, getUid} from './util.js';
import olLayerVector from 'ol/layer/Vector.js';
import olLayerVectorTile from 'ol/layer/VectorTile.js';
import olcsAbstractSynchronizer from './AbstractSynchronizer';
import olcsFeatureConverter from './FeatureConverter.js';
import VectorLayerCounterpart, {
  OlFeatureToCesiumContext,
  PrimitiveCollectionCounterpart
} from './core/VectorLayerCounterpart';
import type Map from 'ol/Map'
import {LayerWithParents} from './core';
import Feature from 'ol/Feature';
import BaseLayer from 'ol/layer/Base';
import {Billboard, Primitive, PrimitiveCollection, Scene} from 'cesium';

class VectorSynchronizer extends olcsAbstractSynchronizer<VectorLayerCounterpart> {
  protected converter: olcsFeatureConverter;
  private csAllPrimitives_: PrimitiveCollection
  /**
   * Unidirectionally synchronize OpenLayers vector layers to Cesium.
   */
  constructor(map: Map, scene: Scene, opt_converter?: olcsFeatureConverter) {
    super(map, scene);

    this.converter = opt_converter || new olcsFeatureConverter(scene);
    this.csAllPrimitives_ = new Cesium.PrimitiveCollection();
    scene.primitives.add(this.csAllPrimitives_);
    this.csAllPrimitives_.destroyPrimitives = false;
  }

  addCesiumObject(counterpart: VectorLayerCounterpart) {
    console.assert(counterpart);
    const collection = <PrimitiveCollectionCounterpart>counterpart.getRootPrimitive()
    collection.counterpart = counterpart;
    this.csAllPrimitives_.add(counterpart.getRootPrimitive());
  }

  destroyCesiumObject(object: VectorLayerCounterpart) {
    object.getRootPrimitive().destroy();
  }

  removeSingleCesiumObject(object: VectorLayerCounterpart, destroy: boolean) {
    object.destroy();
    this.csAllPrimitives_.destroyPrimitives = destroy;
    this.csAllPrimitives_.remove(object.getRootPrimitive());
    this.csAllPrimitives_.destroyPrimitives = false;
  }

  removeAllCesiumObjects(destroy: boolean) {
    this.csAllPrimitives_.destroyPrimitives = destroy;
    if (destroy) {
      for (let i = 0; i < this.csAllPrimitives_.length; ++i) {
        this.csAllPrimitives_.get(i)['counterpart'].destroy();
      }
    }
    this.csAllPrimitives_.removeAll();
    this.csAllPrimitives_.destroyPrimitives = false;
  }

  /**
   * Synchronizes the layer visibility properties
   * to the given Cesium Primitive.
   */
  updateLayerVisibility(olLayerWithParents: LayerWithParents, csPrimitive: PrimitiveCollection) {
    let visible = true;
    [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayer) => {
      const layerVisible = olLayer.getVisible();
      if (layerVisible !== undefined) {
        visible = visible && layerVisible;
      } else {
        visible = false;
      }
    });
    csPrimitive.show = visible;
  }

  createSingleLayerCounterparts(olLayerWithParents: LayerWithParents): VectorLayerCounterpart[] {
    const olLayer: BaseLayer = olLayerWithParents.layer;
    if (!(olLayer instanceof olLayerVector) || olLayer instanceof olLayerVectorTile) {
      return null;
    }
    console.assert(olLayer instanceof olLayerLayer);

    let source = olLayer.getSource();
    if (source instanceof olSourceCluster) {
      source = source.getSource();
    }

    if (!source) {
      return null;
    }

    console.assert(source instanceof olSourceVector);
    console.assert(this.view);

    const view = this.view;
    const featurePrimitiveMap: Record<number, Primitive> = {};
    const counterpart: VectorLayerCounterpart = this.converter.olVectorLayerToCesium(olLayer, view,
        featurePrimitiveMap);
    const csPrimitives = counterpart.getRootPrimitive();
    const olListenKeys = counterpart.olListenKeys;

    [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayerItem) => {
      olListenKeys.push(olcsListen(olLayerItem, 'change:visible', () => {
        this.updateLayerVisibility(olLayerWithParents, csPrimitives);
      }));
    });
    this.updateLayerVisibility(olLayerWithParents, csPrimitives);

    const onAddFeature = (function(feature: Feature) {
      const context = counterpart.context;
      const prim: Primitive = this.converter.convert(olLayer, view, feature, context);
      if (prim) {
        featurePrimitiveMap[getUid(feature)] = prim;
        csPrimitives.add(prim);
      }
    }).bind(this);

    const onRemoveFeature = (function(feature: Feature) {
      const id = getUid(feature);
      const context: OlFeatureToCesiumContext = counterpart.context;
      const bbs = context.featureToCesiumMap[id];
      if (bbs) {
        delete context.featureToCesiumMap[id];
        bbs.forEach((bb) => {
          if (bb instanceof Cesium.Billboard) {
            context.billboards.remove(bb);
          }
        });
      }
      const csPrimitive = featurePrimitiveMap[id];
      delete featurePrimitiveMap[id];
      if (csPrimitive) {
        csPrimitives.remove(csPrimitive);
      }
    }).bind(this);

    olListenKeys.push(olcsListen(source, 'addfeature', (e: VectorSourceEvent) => {
      console.assert(e.feature);
      onAddFeature(e.feature);
    }));

    olListenKeys.push(olcsListen(source, 'removefeature', (e: VectorSourceEvent) => {
      console.assert(e.feature);
      onRemoveFeature(e.feature);
    }));

    olListenKeys.push(olcsListen(source, 'changefeature', (e: VectorSourceEvent) => {
      const feature = e.feature;
      console.assert(feature);
      onRemoveFeature(feature);
      onAddFeature(feature);
    }));

    return counterpart ? [counterpart] : null;
  }
}

export default VectorSynchronizer;
