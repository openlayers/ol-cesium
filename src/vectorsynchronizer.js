goog.provide('olcs.VectorSynchronizer');

goog.require('goog.events');

goog.require('olcs.core');



/**
 * Unidirectionally synchronize OpenLayers vector layers to Cesium.
 * @param {!ol.View} view
 * @param {!ol.Collection} olLayers
 * @param {!Cesium.PrimitiveCollection} csPrimitives
 * @constructor
 */
olcs.VectorSynchronizer = function(view, olLayers, csPrimitives) {
  /**
   * @type {!ol.View}
   * @private
   */
  this.view_ = view;

  /**
   * @type {!ol.Collection}
   * @private
   */
  this.olLayers_ = olLayers;

  /**
   * @type {!Cesium.PrimitiveCollection}
   * @private
   */
  this.csAllPrimitives_ = csPrimitives;

  /**
   * Map of ol3 layer ids (from goog.getUid) to the Cesium PrimitiveCollection.
   * null value means, that we are unable to create equivalent layer.
   * @type {Object.<number, ?Cesium.PrimitiveCollection>}
   * @private
   */
  this.layerMap_ = {};

  goog.events.listen(/** @type {!goog.events.EventTarget} */(this.olLayers_),
      [goog.events.EventType.CHANGE, 'add', 'remove'], function(e) {
        this.synchronize();
      }, false, this);
};


/**
 * Performs complete synchronization of the raster layers.
 */
olcs.VectorSynchronizer.prototype.synchronize = function() {
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
    }

    var olLayerId = goog.getUid(olLayer);
    var csPrimitives = this.layerMap_[olLayerId];

    // no mapping -> create new layer and set up synchronization
    if (!goog.isDef(csPrimitives)) {
      csPrimitives = olcs.core.olVectorLayerToCesium(olLayer, this.view_);

      if (!goog.isNull(csPrimitives)) {
        goog.events.listen(olLayer,
            ['change:visible'],
            function(e) {
              csPrimitives.show = olLayer.getVisible();
            });
      }
      this.layerMap_[olLayerId] = csPrimitives;
    }

    // add Cesium layers
    if (csPrimitives) {
      this.csAllPrimitives_.add(csPrimitives);
      delete unusedCesiumPrimitives[csPrimitives];
    }
  }, this);

  this.olLayers_.forEach(function(el, i, arr) {
    if (el instanceof ol.layer.Vector)
      synchronizeLayer(el);
  });

  // destroy unused Cesium ImageryLayers
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
