goog.provide('olcs.AbstractSynchronizer');

goog.require('goog.events');



/**
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 * @template T
 */
olcs.AbstractSynchronizer = function(map, scene) {
  /**
   * @type {!ol.Map}
   * @protected
   */
  this.map = map;

  /**
   * @type {?ol.View}
   * @protected
   */
  this.view = null;

  /**
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;

  /**
   * @type {?ol.Collection.<ol.layer.Base>}
   * @protected
   */
  this.olLayers = null;

  /**
   * @type {!Array}
   * @private
   */
  this.olLayersListenKeys_ = [];

  /**
   * Map of ol3 layer ids (from goog.getUid) to the Cesium ImageryLayers.
   * null value means, that we are unable to create equivalent layer.
   * @type {Object.<number, ?T>}
   * @protected
   */
  this.layerMap = {};

  /**
   * @type {?Object.<?T, number>}
   * @private
   */
  this.unusedCesiumObjects_ = null;

  this.map.on('change:view', function(e) {
    this.setView_(this.map.getView());
  }, this);
  this.setView_(this.map.getView());

  this.map.on('change:layergroup', function(e) {
    this.setLayers_(this.map.getLayers());
  }, this);
  this.setLayers_(this.map.getLayers());
};


/**
 * @param {?ol.View} view New view to use.
 * @private
 */
olcs.AbstractSynchronizer.prototype.setView_ = function(view) {
  this.view = view;

  // destroy all, the change of view can affect which layers are synced
  this.destroyAll();
  this.synchronize();
};


/**
 * @param {ol.Collection.<ol.layer.Base>} layers New layers to use.
 * @private
 */
olcs.AbstractSynchronizer.prototype.setLayers_ = function(layers) {
  if (!goog.isNull(this.olLayers)) {
    goog.array.forEach(this.olLayersListenKeys_, this.olLayers.unByKey);
  }

  this.olLayers = layers;
  if (!goog.isNull(layers)) {
    var handleCollectionEvent_ = goog.bind(function(e) {
      this.synchronize();
    }, this);

    this.olLayersListenKeys_ = [
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
 * Performs complete synchronization of the layers.
 */
olcs.AbstractSynchronizer.prototype.synchronize = function() {
  if (goog.isNull(this.view) || goog.isNull(this.olLayers)) {
    return;
  }
  this.unusedCesiumObjects_ = goog.object.transpose(this.layerMap);
  this.removeAllCesiumObjects(false);

  this.olLayers.forEach(function(el, i, arr) {
    this.synchronizeSingle(el);
  }, this);

  // destroy unused Cesium Objects
  goog.array.forEach(goog.object.getValues(this.unusedCesiumObjects_),
      function(el, i, arr) {
        var layerId = el;
        var object = this.layerMap[layerId];
        if (goog.isDef(object)) {
          delete this.layerMap[layerId];
          if (!goog.isNull(object)) {
            this.destroyCesiumObject(object);
          }
        }
      }, this);
  this.unusedCesiumObjects_ = null;
};


/**
 * Synchronizes single layer.
 * @param {!ol.layer.Base} olLayer
 * @protected
 */
olcs.AbstractSynchronizer.prototype.synchronizeSingle = function(olLayer) {
  // handle layer groups
  if (olLayer instanceof ol.layer.Group) {
    var sublayers = olLayer.getLayers();
    if (goog.isDef(sublayers)) {
      sublayers.forEach(function(el, i, arr) {
        this.synchronizeSingle(el);
      }, this);
    }

    var listenAddRemove = goog.bind(function() {
      var sublayers = olLayer.getLayers();
      if (goog.isDef(sublayers)) {
        sublayers.on(['add', 'remove'], function(e) {
          this.synchronize();
        }, this);
      }
    }, this);
    listenAddRemove();

    olLayer.on('change:layers', function(e) {
      listenAddRemove();
    });

    return;
  } else if (!(olLayer instanceof ol.layer.Layer)) {
    return;
  }

  var olLayerId = goog.getUid(olLayer);
  var cesiumObject = this.layerMap[olLayerId];

  // no mapping -> create new layer and set up synchronization
  if (!goog.isDef(cesiumObject)) {
    cesiumObject = this.createSingleCounterpart(olLayer);
    this.layerMap[olLayerId] = cesiumObject;
  }

  // add Cesium layers
  if (goog.isDefAndNotNull(cesiumObject)) {
    this.addCesiumObject(cesiumObject);
    delete this.unusedCesiumObjects_[cesiumObject];
  }
};


/**
 * Destroys all the created Cesium objects.
 * @protected
 */
olcs.AbstractSynchronizer.prototype.destroyAll = function() {
  this.removeAllCesiumObjects(true); // destroy
  this.layerMap = {};
};


/**
 * Adds a single Cesium object to the collection.
 * @param {!T} object
 * @protected
 */
olcs.AbstractSynchronizer.prototype.addCesiumObject = goog.abstractMethod;


/**
 * @param {!T} object
 * @protected
 */
olcs.AbstractSynchronizer.prototype.destroyCesiumObject = goog.abstractMethod;


/**
 * Remove all Cesium objects from the collection.
 * @param {boolean} destroy
 * @protected
 */
olcs.AbstractSynchronizer.prototype.removeAllCesiumObjects =
    goog.abstractMethod;


/**
 * @param {!ol.layer.Layer} olLayer
 * @return {?T}
 * @protected
 */
olcs.AbstractSynchronizer.prototype.createSingleCounterpart =
    goog.abstractMethod;
