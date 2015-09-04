goog.provide('olcs.AbstractSynchronizer');

goog.require('ol.Observable');
goog.require('ol.layer.Group');
goog.require('ol.layer.Layer');



/**
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 * @template T
 * @api
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
  this.view = map.getView();

  /**
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;

  /**
   * @type {ol.Collection.<ol.layer.Base>}
   * @protected
   */
  this.olLayers = map.getLayerGroup().getLayers();

  /**
   * @type {ol.layer.Group}
   */
  this.mapLayerGroup = map.getLayerGroup();

  /**
   * Map of ol3 layer ids (from goog.getUid) to the Cesium ImageryLayers.
   * null value means, that we are unable to create equivalent layer.
   * @type {Object.<number, ?T>}
   * @protected
   */
  this.layerMap = {};

  /**
   * Map of listen keys for ol3 layer groups ids (from goog.getUid).
   * @type {!Object.<number, !Array.<goog.events.Key>>}
   * @private
   */
  this.olGroupListenKeys_ = {};
};


/**
 * Remove all and perform complete synchronization of the layers.
 * @api
 */
olcs.AbstractSynchronizer.prototype.synchronize = function() {
  this.destroyAll();
  this.synchronize_();
};


/**
 * @param {ol.layer.Base} layer
 * @param {Array.<ol.layer.Layer>} foundLayers
 * @param {Array.<ol.layer.Group>} foundGroups
 * @private
 */
olcs.AbstractSynchronizer.flattenLayers_ =
    function(layer, foundLayers, foundGroups) {
  if (layer instanceof ol.layer.Group) {
    foundGroups.push(layer);
    var sublayers = layer.getLayers();
    if (goog.isDef(sublayers)) {
      sublayers.forEach(function(el) {
        olcs.AbstractSynchronizer.flattenLayers_(el, foundLayers, foundGroups);
      });
    }
  } else {
    foundLayers.push(layer);
  }
};


/**
 * Perform complete synchronization of the layers.
 * @private
 */
olcs.AbstractSynchronizer.prototype.synchronize_ = function() {
  var layers = [];
  var groups = [];
  olcs.AbstractSynchronizer.flattenLayers_(this.mapLayerGroup, layers, groups);

  layers.forEach(function(el) {
    this.synchronizeSingle(el);
  }, this);

  groups.forEach(function(el) {
    this.listenForGroupChanges_(el);
  }, this);
};


/**
 * Destroy single layer.
 * @param {ol.layer.Layer} layer
 * @private
 */
olcs.AbstractSynchronizer.prototype.removeAndDestroySingleLayer_ =
    function(layer) {
  var uid = goog.getUid(layer);
  var counterpart = this.layerMap[uid];
  if (!!counterpart) {
    this.removeSingleCesiumObject(counterpart, false);
    this.destroyCesiumObject(counterpart);
  }
  delete this.layerMap[uid];
};


/**
 * Destroy single group.
 * @param {ol.layer.Group} group
 * @private
 */
olcs.AbstractSynchronizer.prototype.unlistenSingleGroup_ =
    function(group) {
  if (group === this.mapLayerGroup) {
    return;
  }
  var uid = goog.getUid(group);
  var keys = this.olGroupListenKeys_[uid];
  keys = keys || []; // FIXME: why+
  keys.forEach(function(key) {
    ol.Observable.unByKey(key);
  });
  delete this.olGroupListenKeys_[uid];
};


/**
 * Remove layer.
 * @param {ol.layer.Base} removeRoot
 * @private
 */
olcs.AbstractSynchronizer.prototype.removeLayer_ = function(removeRoot) {
  if (!removeRoot) {
    return;
  }
  var layers = [];
  var groups = [];
  olcs.AbstractSynchronizer.flattenLayers_(removeRoot, layers, groups);

  layers.forEach(function(el) {
    this.removeAndDestroySingleLayer_(el);
  }, this);

  groups.forEach(function(el) {
    this.unlistenSingleGroup_(el);
  }, this);
};


/**
 * Synchronizes single layer.
 * @param {ol.layer.Group} group
 * @private
 */
olcs.AbstractSynchronizer.prototype.listenForGroupChanges_ = function(group) {
  var uuid = goog.getUid(group);

  if (!goog.isDef(this.olGroupListenKeys_[uuid])) {
    var listenKeyArray = [];
    this.olGroupListenKeys_[uuid] = listenKeyArray;

    // only the keys that need to be relistened when collection changes
    var contentKeys = [];
    var listenAddRemove = goog.bind(function() {
      var collection = group.getLayers();
      if (goog.isDef(collection)) {
        var handleContentChange_ = goog.bind(function(e) {
          // TODO: should remove the subtree
          // should synchronize the subtree
          this.synchronize_();
        }, this);
        contentKeys = [
          collection.on('add', handleContentChange_),
          collection.on('remove', function(event) {
            this.removeAndDestroySingleLayer_(event.element);
          }, this)
        ];
        listenKeyArray.push.apply(listenKeyArray, contentKeys);
      }
    }, this);
    listenAddRemove();

    listenKeyArray.push(group.on('change:layers', function(e) {
      goog.array.forEach(contentKeys, function(el) {
        goog.array.remove(listenKeyArray, el);
        ol.Observable.unByKey(el);
      });
      listenAddRemove();
    }));
  }

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
  goog.asserts.assert(!(olLayer instanceof ol.layer.Group));
  goog.asserts.assert(olLayer instanceof ol.layer.Layer);

  var cesiumObject = this.layerMap[olLayerId];

  // no mapping -> create new layer and set up synchronization
  if (!goog.isDef(cesiumObject)) {
    cesiumObject = this.createSingleCounterpart(olLayer);
    this.layerMap[olLayerId] = cesiumObject;
  }

  // add Cesium layers
  if (goog.isDefAndNotNull(cesiumObject)) {
    this.addCesiumObject(cesiumObject);
  }
};


/**
 * Destroys all the created Cesium objects.
 * @protected
 */
olcs.AbstractSynchronizer.prototype.destroyAll = function() {
  this.removeLayer_(this.mapLayerGroup);
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
 * Remove single Cesium object from the collection.
 * @param {!T} object
 * @param {boolean} destroy
 * @protected
 */
olcs.AbstractSynchronizer.prototype.removeSingleCesiumObject =
    goog.abstractMethod;


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
