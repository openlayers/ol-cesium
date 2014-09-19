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
   * @type {!Cesium.PrimitiveCollection}
   * @private
   */
  this.csAllPrimitives_ = scene.primitives.add(
      new Cesium.PrimitiveCollection());

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
  this.layerMap_ = {};
  var layers = map.getLayers(); // FIXME: listen for changes
  layers.on(['change', 'add', 'remove'], function(e) {
    this.synchronize();
  }, this);
};


/**
 * Performs complete synchronization of the vector layers.
 */
olcs.VectorSynchronizer.prototype.synchronize = function() {
  var view = this.map_.getView(); // view reference might change
  if (!goog.isDefAndNotNull(view)) {
    return;
  }
  var olLayers = this.map_.getLayers();
  var unusedCesiumPrimitives = goog.object.transpose(this.layerMap_);
  this.csAllPrimitives_.destroyPrimitives = false;
  this.csAllPrimitives_.removeAll();


  var synchronizeLayer = goog.bind(function(olLayer) {
    // handle layer groups
    if (olLayer instanceof ol.layer.Group) {
      var sublayers = olLayer.getLayers();
      if (goog.isDef(sublayers)) {
        sublayers.forEach(function(el, i, arr) {
          synchronizeLayer(el);
        });
      }
      return;
    } else if (!(olLayer instanceof ol.layer.Vector)) {
      return;
    }

    var olLayerId = goog.getUid(olLayer);
    var csPrimitives = this.layerMap_[olLayerId];

    // no mapping -> create new layer and set up synchronization
    if (!goog.isDef(csPrimitives)) {
      view = /** @type {!ol.View} */ (view);
      csPrimitives = olcs.core.olVectorLayerToCesium(olLayer, view);

      olLayer.on('change:visible', function(e) {
        csPrimitives.show = olLayer.getVisible();
      });

      olLayer.once('change', function(e) {
        this.csAllPrimitives_.remove(csPrimitives);
        csPrimitives.destroy(); // from now on, do not use csPrimitives
        delete this.layerMap_[olLayerId];
        synchronizeLayer(olLayer);
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
    synchronizeLayer(el);
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
