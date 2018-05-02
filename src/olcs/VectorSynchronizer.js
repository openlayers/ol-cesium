/**
 * @module olcs.VectorSynchronizer
 */
import olSourceVector from 'ol/source/Vector.js';
import olLayerLayer from 'ol/layer/Layer.js';
import olSourceCluster from 'ol/source/Cluster.js';
import olLayerImage from 'ol/layer/Image.js';
import googAsserts from 'goog/asserts.js';
import * as olBase from 'ol/index.js';
import * as olEvents from 'ol/events.js';
import olLayerVector from 'ol/layer/Vector.js';
import olcsAbstractSynchronizer from './AbstractSynchronizer.js';
import olcsFeatureConverter from './FeatureConverter.js';

/**
 * Unidirectionally synchronize OpenLayers vector layers to Cesium.
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @param {olcs.FeatureConverter=} opt_converter
 * @constructor
 * @extends {olcs.AbstractSynchronizer.<olcs.core.VectorLayerCounterpart>}
 * @api
 * @struct
 */
const exports = function(map, scene, opt_converter) {

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

  olcsAbstractSynchronizer.call(this, map, scene);
};

olBase.inherits(exports, olcsAbstractSynchronizer);


/**
 * @inheritDoc
 */
exports.prototype.addCesiumObject = function(counterpart) {
  googAsserts.assert(counterpart);
  counterpart.getRootPrimitive()['counterpart'] = counterpart;
  this.csAllPrimitives_.add(counterpart.getRootPrimitive());
};


/**
 * @inheritDoc
 */
exports.prototype.destroyCesiumObject = function(object) {
  object.getRootPrimitive().destroy();
};


/**
 * @inheritDoc
 */
exports.prototype.removeSingleCesiumObject = function(object, destroy) {
  object.destroy();
  this.csAllPrimitives_.destroyPrimitives = destroy;
  this.csAllPrimitives_.remove(object.getRootPrimitive());
  this.csAllPrimitives_.destroyPrimitives = false;
};


/**
 * @inheritDoc
 */
exports.prototype.removeAllCesiumObjects = function(destroy) {
  this.csAllPrimitives_.destroyPrimitives = destroy;
  if (destroy) {
    for (let i = 0; i < this.csAllPrimitives_.length; ++i) {
      this.csAllPrimitives_.get(i)['counterpart'].destroy();
    }
  }
  this.csAllPrimitives_.removeAll();
  this.csAllPrimitives_.destroyPrimitives = false;
};

/**
 * Synchronizes the layer visibility properties
 * to the given Cesium Primitive.
 * @param {olcsx.LayerWithParents} olLayerWithParents
 * @param {!Cesium.Primitive} csPrimitive
 */
exports.prototype.updateLayerVisibility = function(olLayerWithParents, csPrimitive) {
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
};
/**
 * @inheritDoc
 */
exports.prototype.createSingleLayerCounterparts = function(olLayerWithParents) {
  const olLayer = olLayerWithParents.layer;
  if (!(olLayer instanceof olLayerVector)) {
    return null;
  }
  googAsserts.assertInstanceof(olLayer, olLayerLayer);

  let source = olLayer.getSource();
  if (source instanceof olSourceCluster) {
    source = source.getSource();
  }

  googAsserts.assertInstanceof(source, olSourceVector);
  googAsserts.assert(this.view);

  const view = this.view;
  const featurePrimitiveMap = {};
  const counterpart = this.converter.olVectorLayerToCesium(olLayer, view,
      featurePrimitiveMap);
  const csPrimitives = counterpart.getRootPrimitive();
  const olListenKeys = counterpart.olListenKeys;

  [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayerItem) => {
    olListenKeys.push(olEvents.listen(olLayerItem, 'change:visible', () => {
      this.updateLayerVisibility(olLayerWithParents, csPrimitives);
    }));
  });
  this.updateLayerVisibility(olLayerWithParents, csPrimitives);

  const onAddFeature = (function(feature) {
    googAsserts.assert(
        (olLayer instanceof olLayerVector) ||
        (olLayer instanceof olLayerImage)
    );
    const context = counterpart.context;
    const prim = this.converter.convert(olLayer, view, feature, context);
    if (prim) {
      featurePrimitiveMap[olBase.getUid(feature)] = prim;
      csPrimitives.add(prim);
    }
  }).bind(this);

  const onRemoveFeature = (function(feature) {
    const id = olBase.getUid(feature);
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

  olListenKeys.push(olEvents.listen(source, 'addfeature', (e) => {
    googAsserts.assert(e.feature);
    onAddFeature(e.feature);
  }, this));

  olListenKeys.push(olEvents.listen(source, 'removefeature', (e) => {
    googAsserts.assert(e.feature);
    onRemoveFeature(e.feature);
  }, this));

  olListenKeys.push(olEvents.listen(source, 'changefeature', (e) => {
    const feature = e.feature;
    googAsserts.assert(feature);
    onRemoveFeature(feature);
    onAddFeature(feature);
  }, this));

  return counterpart ? [counterpart] : null;
};


export default exports;
