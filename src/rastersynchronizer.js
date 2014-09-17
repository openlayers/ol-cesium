goog.provide('olcs.RasterSynchronizer');

goog.require('goog.events');

goog.require('olcs.core');



/**
 * This object takes care of one-directional synchronization of
 * ol3 raster layers to the given Cesium globe.
 * @param {!ol.Map} map
 * @param {!Cesium.ImageryLayerCollection} cesiumLayers
 * @constructor
 */
olcs.RasterSynchronizer = function(map, cesiumLayers) {
  /**
   * @type {!ol.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {?ol.View}
   * @private
   */
  this.view_ = null;

  /**
   * @type {?ol.Collection.<ol.layer.Base>}
   * @private
   */
  this.olLayers_ = null;

  /**
   * @type {!Array}
   * @private
   */
  this.olLayersListenKeys_ = [];

  /**
   * @type {!Cesium.ImageryLayerCollection}
   * @private
   */
  this.cesiumLayers_ = cesiumLayers;

  /**
   * Map of ol3 layer ids (from goog.getUid) to the Cesium ImageryLayers.
   * null value means, that we are unable to create equivalent layer.
   * @type {Object.<number, ?Cesium.ImageryLayer>}
   * @private
   */
  this.layerMap_ = {};

  this.map_.on('change:view', function(e) {
    this.setView_(this.map_.getView());
  }, this);
  this.setView_(this.map_.getView());

  this.map_.on('change:layergroup', function(e) {
    this.setLayers_(this.map_.getLayers());
  }, this);
  this.setLayers_(this.map_.getLayers());
};


/**
 * @param {?ol.View} view New view to use.
 * @private
 */
olcs.RasterSynchronizer.prototype.setView_ = function(view) {
  this.view_ = view;

  // destroy all, the change of view can affect which layers are synced
  this.destroyAll();
  this.synchronize();
};


/**
 * @param {ol.Collection.<ol.layer.Base>} layers New layers to use.
 * @private
 */
olcs.RasterSynchronizer.prototype.setLayers_ = function(layers) {
  if (!goog.isNull(this.olLayers_)) {
    goog.array.forEach(this.olLayersListenKeys_, this.olLayers_.unByKey);
  }

  this.olLayers_ = layers;
  if (!goog.isNull(layers)) {
    var handleCollectionEvent_ = goog.bind(function(e) {
      this.synchronize();
    }, this);

    this.olLayersListenKeys_ = [
      layers.on('change', handleCollectionEvent_),
      layers.on('add', handleCollectionEvent_),
      layers.on('remove', handleCollectionEvent_)
    ];
  } else {
    this.olLayersListenKeys_ = [];
  }

  this.destroyAll();
  this.synchronize();
};


/**
 * Performs complete synchronization of the raster layers.
 */
olcs.RasterSynchronizer.prototype.synchronize = function() {
  if (goog.isNull(this.view_) || goog.isNull(this.olLayers_)) {
    return;
  }
  var unusedCesiumLayers = goog.object.transpose(this.layerMap_);
  this.cesiumLayers_.removeAll(false);

  var viewProj = this.view_.getProjection();

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
    } else if (!(olLayer instanceof ol.layer.Tile)) {
      return;
    }

    var olLayerId = goog.getUid(olLayer);
    var cesiumLayer = this.layerMap_[olLayerId];

    // no mapping -> create new layer and set up synchronization
    if (!goog.isDef(cesiumLayer)) {
      cesiumLayer = olcs.core.tileLayerToImageryLayer(olLayer, viewProj);
      if (!goog.isNull(cesiumLayer)) {
        olLayer.on(
            ['change:brightness', 'change:contrast', 'change:hue',
             'change:opacity', 'change:saturation', 'change:visible'],
            function(e) {
              // the compiler does not seem to be able to infer this
              if (!goog.isNull(cesiumLayer)) {
                olcs.core.updateCesiumLayerProperties(olLayer, cesiumLayer);
              }
            });
        olcs.core.updateCesiumLayerProperties(olLayer, cesiumLayer);

        // there is no way to modify Cesium layer extent,
        // we have to recreate when ol3 layer extent changes:
        olLayer.on('change:extent', function(e) {
          this.cesiumLayers_.remove(cesiumLayer, true); // destroy
          delete this.layerMap_[olLayerId]; // invalidate the map entry
          this.synchronize();
        }, this);
      }
      this.layerMap_[olLayerId] = cesiumLayer;
    }

    // add Cesium layers
    if (cesiumLayer) {
      this.cesiumLayers_.add(cesiumLayer);
      delete unusedCesiumLayers[cesiumLayer];
    }
  }, this);

  this.olLayers_.forEach(function(el, i, arr) {
    synchronizeLayer(el);
  });

  // destroy unused Cesium ImageryLayers
  goog.array.forEach(goog.object.getValues(unusedCesiumLayers),
      function(el, i, arr) {
        var layerId = el;
        var layer = this.layerMap_[layerId];
        if (goog.isDef(layer)) {
          delete this.layerMap_[layerId];
          if (!goog.isNull(layer)) {
            layer.destroy();
          }
        }
      }, this);
};


/**
 * Destroys all the create Cesium layers.
 */
olcs.RasterSynchronizer.prototype.destroyAll = function() {
  this.cesiumLayers_.removeAll(); // destroy
  this.layerMap_ = {};
};
