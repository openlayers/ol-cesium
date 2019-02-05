/**
 * @module olcs.VectorSynchronizer
 */
import olSourceVector from 'ol/source/Vector.js';
import olLayerLayer from 'ol/layer/Layer.js';
import olSourceCluster from 'ol/source/Cluster.js';
import olLayerImage from 'ol/layer/Image.js';
import {olcsListen, getUid} from './util.js';
import olLayerVector from 'ol/layer/Vector.js';
import olLayerVectorTile from 'ol/layer/VectorTile.js';
import olcsAbstractSynchronizer from './AbstractSynchronizer.js';
import olcsFeatureConverter from './FeatureConverter.js';

class VectorSynchronizer extends olcsAbstractSynchronizer {
  /**
   * Unidirectionally synchronize OpenLayers vector layers to Cesium.
   * @param {!ol.Map} map
   * @param {!Cesium.Scene} scene
   * @param {olcs.FeatureConverter=} opt_converter
   * @extends {olcs.AbstractSynchronizer.<olcs.core.VectorLayerCounterpart>}
   * @api
   */
  constructor(map, scene, opt_converter) {
    super(map, scene);

    /**
     * @protected
     */
    this.converter = opt_converter || new olcsFeatureConverter(scene);

    /**
     * @private
     */
    this.csAllPrimitives_ = new Cesium.PrimitiveCollection();
    scene.primitives.add(this.csAllPrimitives_);
    this.csAllPrimitives_.destroyPrimitives = false;
  }

  /**
   * @inheritDoc
   */
  addCesiumObject(counterpart) {
    console.assert(counterpart);
    counterpart.getRootPrimitive()['counterpart'] = counterpart;
    this.csAllPrimitives_.add(counterpart.getRootPrimitive());
  }

  /**
   * @inheritDoc
   */
  destroyCesiumObject(object) {
    object.getRootPrimitive().destroy();
  }

  /**
   * @inheritDoc
   */
  removeSingleCesiumObject(object, destroy) {
    object.destroy();
    this.csAllPrimitives_.destroyPrimitives = destroy;
    this.csAllPrimitives_.remove(object.getRootPrimitive());
    this.csAllPrimitives_.destroyPrimitives = false;
  }

  /**
   * @inheritDoc
   */
  removeAllCesiumObjects(destroy) {
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
   * @param {import('olsc/core.js').LayerWithParents} olLayerWithParents
   * @param {!Cesium.Primitive} csPrimitive
   */
  updateLayerVisibility(olLayerWithParents, csPrimitive) {
    let visible = true;
    [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayer) => {
      const layerVisible = olLayer.getVisible();
      if (layerVisible !== undefined) {
        visible &= layerVisible;
      } else {
        visible = false;
      }
    });
    csPrimitive.show = visible;
  }

  /**
   * @inheritDoc
   */
  createSingleLayerCounterparts(olLayerWithParents) {
    const olLayer = olLayerWithParents.layer;
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
    const featurePrimitiveMap = {};
    const counterpart = this.converter.olVectorLayerToCesium(olLayer, view,
        featurePrimitiveMap);
    const csPrimitives = counterpart.getRootPrimitive();
    const olListenKeys = counterpart.olListenKeys;

    [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayerItem) => {
      olListenKeys.push(olcsListen(olLayerItem, 'change:visible', () => {
        this.updateLayerVisibility(olLayerWithParents, csPrimitives);
      }));
    });
    this.updateLayerVisibility(olLayerWithParents, csPrimitives);

    const onAddFeature = (function(feature) {
      console.assert(
          (olLayer instanceof olLayerVector) ||
          (olLayer instanceof olLayerImage)
      );
      const context = counterpart.context;
      const prim = this.converter.convert(olLayer, view, feature, context);
      if (prim) {
        featurePrimitiveMap[getUid(feature)] = prim;
        csPrimitives.add(prim);
      }
    }).bind(this);

    const onRemoveFeature = (function(feature) {
      const id = getUid(feature);
      const context = counterpart.context;
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

    olListenKeys.push(olcsListen(source, 'addfeature', (e) => {
      console.assert(e.feature);
      onAddFeature(e.feature);
    }, this));

    olListenKeys.push(olcsListen(source, 'removefeature', (e) => {
      console.assert(e.feature);
      onRemoveFeature(e.feature);
    }, this));

    olListenKeys.push(olcsListen(source, 'changefeature', (e) => {
      const feature = e.feature;
      console.assert(feature);
      onRemoveFeature(feature);
      onAddFeature(feature);
    }, this));

    return counterpart ? [counterpart] : null;
  }
}

export default VectorSynchronizer;
