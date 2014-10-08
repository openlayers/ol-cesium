goog.provide('olcs.AbstractSynchronizer');

goog.require('goog.events');
goog.require('ol.layer.Group');
goog.require('ol.layer.Layer');



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
   * @type {ol.View}
   * @protected
   */
  this.view = null;

  /**
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;

  /**
   * @type {ol.Collection.<ol.layer.Base>}
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
   * Map of listen keys for ol3 layer groups ids (from goog.getUid).
   * @type {!Object.<number, !Array>}
   * @private
   */
  this.olGroupListenKeys_ = {};

  /**
   * @type {Object.<number, !Array>}
   * @private
   */
  this.unusedGroups_ = null;

  /**
   * @type {Object.<?T, number>}
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
 * @param {ol.View} view New view to use.
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
  this.unusedGroups_ = goog.object.clone(this.olGroupListenKeys_);
  this.unusedCesiumObjects_ = goog.object.transpose(this.layerMap);
  this.removeAllCesiumObjects(false); // only remove, don't destroy

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

  // unlisten unused ol layer groups
  goog.object.forEach(this.unusedGroups_, function(keys, groupId, obj) {
    goog.array.forEach(keys, this.map.unByKey);
    delete this.olGroupListenKeys_[groupId];
  }, this);
  this.unusedGroups_ = null;
};


/**
 * Synchronizes single layer.
 * @param {ol.layer.Base} olLayer
 * @protected
 */
olcs.AbstractSynchronizer.prototype.synchronizeSingle = function(olLayer) {
  if (goog.isNull(olLayer)) {
    return;
  }
  var olLayerId = goog.getUid(olLayer);

  // handle layer groups
  if (olLayer instanceof ol.layer.Group) {
    var sublayers = olLayer.getLayers();
    if (goog.isDef(sublayers)) {
      sublayers.forEach(function(el, i, arr) {
        this.synchronizeSingle(el);
      }, this);
    }

    if (!goog.isDef(this.olGroupListenKeys_[olLayerId])) {
      var listenKeyArray = [];
      this.olGroupListenKeys_[olLayerId] = listenKeyArray;

      // only the keys that need to be relistened when collection changes
      var collection, contentKeys = [];
      var listenAddRemove = goog.bind(function() {
        collection = /** @type {ol.layer.Group} */ (olLayer).getLayers();
        if (goog.isDef(collection)) {
          var handleContentChange_ = goog.bind(function(e) {
            this.synchronize();
          }, this);
          contentKeys = [
            collection.on('add', handleContentChange_),
            collection.on('remove', handleContentChange_)
          ];
          listenKeyArray.push.apply(listenKeyArray, contentKeys);
        }
      }, this);
      listenAddRemove();

      listenKeyArray.push(olLayer.on('change:layers', function(e) {
        goog.array.forEach(contentKeys, function(el, i, arr) {
          goog.array.remove(listenKeyArray, el);
          collection.unByKey(el);
        });
        listenAddRemove();
      }));
    }

    delete this.unusedGroups_[olLayerId];

    return;
  } else if (!(olLayer instanceof ol.layer.Layer)) {
    return;
  }

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
 * @return {T}
 * @protected
 */
olcs.AbstractSynchronizer.prototype.createSingleCounterpart =
    goog.abstractMethod;
