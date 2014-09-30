goog.provide('olcs.VectorSynchronizer');

goog.require('goog.events');

goog.require('olcs.core');



/**
 * Unidirectionally synchronize OpenLayers vector layers to Cesium.
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 */
olcs.VectorSynchronizer = function(map, scene) {

  /**
   * @type {!Cesium.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!Cesium.PrimitiveCollection}
   * @private
   */
  this.csAllPrimitives_;

  // Initialize core library
  olcs.core.glAliasedLineWidthRange = scene.maximumAliasedLineWidth;

  /**
   * @type {!ol.Map}
   * @private
   */
  this.map_ = map;

  /**
   * Map of ol3 layer ids (from goog.getUid) to the Cesium PrimitiveCollection.
   * null value means, that we are unable to create equivalent layer.
   * @type {Object.<number, ?Cesium.PrimitiveCollection>}
   * @private
   */
  this.layerMap_;
};


/**
 * Enable synchronization of the vector layers.
 */
olcs.VectorSynchronizer.prototype.synchronize = function() {
  if (this.csAllPrimitives_) {
    return; // already active
  }

  // Do not handle add / remove here but in synchronizeLayer
  var layers = this.map_.getLayers();
  layers.on(['add', 'remove'], function(e) {
    this.synchronize_();
  }, this);

  var createRootPrimitive = goog.bind(function() {
    if (this.csAllPrimitives_) {
      this.csAllPrimitives_.destroyPrimitives = true;
      this.scene_.primitives.remove(this.csAllPrimitives_);
    }
    this.csAllPrimitives_ = new Cesium.PrimitiveCollection();
    this.scene_.primitives.add(this.csAllPrimitives_);
    this.csAllPrimitives_.destroyPrimitives = false;
    this.layerMap_ = {};
    this.synchronize_();
  }, this);

  this.map_.on('change:view', function(e) {
    createRootPrimitive();
  }, this);

  createRootPrimitive();
};


/**
 * Performs complete synchronization of the vector layers.
 * @private
 */
olcs.VectorSynchronizer.prototype.synchronize_ = function() {
  var view = this.map_.getView(); // reference might change
  if (!view) {
    return;
  }
  var olLayers = this.map_.getLayers();
  var unusedCesiumPrimitives = goog.object.transpose(this.layerMap_);
  this.csAllPrimitives_.removeAll();


  /**
   * @param {!ol.layer.Layer} olLayer
   * @param {!ol.View} view
   */
  var synchronizeLayer = goog.bind(function(olLayer, view) {
    // handle layer groups
    if (olLayer instanceof ol.layer.Group) {
      var sublayers = olLayer.getLayers();
      if (goog.isDef(sublayers)) {
        sublayers.forEach(function(el, i, arr) {
          synchronizeLayer(el, view);
        });
        // FIXME handle add/remove of layer here
      }
      return;
    } else if (!(olLayer instanceof ol.layer.Vector)) {
      return;
    }

    var olLayerId = goog.getUid(olLayer);
    var csPrimitives = this.layerMap_[olLayerId];

    // no mapping -> create new layer and set up synchronization
    if (!goog.isDef(csPrimitives)) {
      var source = olLayer.getSource();
      csPrimitives = olcs.core.olVectorLayerToCesium(olLayer, view);

      olLayer.on('change:visible', function(e) {
        csPrimitives.show = olLayer.getVisible();
      });

      var onAddFeature = function(feature) {
        var primitive = olcs.core.olFeatureToCesiumUsingView(olLayer, view,
            feature);
        if (primitive) {
          csPrimitives.add(primitive);
        }
      };

      var onRemoveFeature = function(feature) {
        csPrimitives.remove(feature.csPrimitive);
      };

      source.on('addfeature', function(e) {
        goog.isDefAndNotNull(e.feature);
        onAddFeature(e.feature);
      }, this);

      source.on('removefeature', function(e) {
        goog.isDefAndNotNull(e.feature);
        onRemoveFeature(e.feature);
      }, this);

      source.on('changefeature', function(e) {
        var feature = e.feature;
        goog.isDefAndNotNull(feature);
        onRemoveFeature(feature);
        onAddFeature(feature);
      }, this);

      this.layerMap_[olLayerId] = csPrimitives;
    }

    // add Cesium layers
    if (csPrimitives) {
      this.csAllPrimitives_.add(csPrimitives);
      delete unusedCesiumPrimitives[csPrimitives];
    }
  }, this);


  olLayers.forEach(function(el, i, arr) {
    goog.asserts.assert(!goog.isNull(view));
    synchronizeLayer(el, view);
  });

  // destroy unused Cesium primitives
  goog.array.forEach(goog.object.getValues(unusedCesiumPrimitives),
      function(el, i, arr) {
        var layerId = el;
        var primitives = this.layerMap_[layerId];
        if (goog.isDef(primitives)) {
          delete this.layerMap_[layerId];
          primitives.destroy();
        }
      }, this);
};
