goog.provide('olcs.AbstractSynchronizer');

goog.require('goog.object');

goog.require('ol.Observable');
goog.require('ol.layer.Group');



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
   * Map of listen keys for ol3 layer layers ids (from goog.getUid).
   * @type {!Object.<number, !goog.events.Key>}
   * @private
   */
  this.olLayerListenKeys_ = {};

  /**
   * Map of listen keys for ol3 layer groups ids (from goog.getUid).
   * @type {!Object.<number, !Array.<goog.events.Key>>}
   * @private
   */
  this.olGroupListenKeys_ = {};
};


/**
 * Destroy all and perform complete synchronization of the layers.
 * @api
 */
olcs.AbstractSynchronizer.prototype.synchronize = function() {
  this.destroyAll();
  this.addLayers_(this.mapLayerGroup);
};


/**
 * Populate the foundLayers and foundGroups using a breadth-first algorithm.
 * A map of layer uid to z-index is also populated.
 * @param {ol.layer.Base} layer
 * @param {Array.<ol.layer.Layer>} foundLayers Found leaves.
 * @param {Array.<ol.layer.Group>} foundGroups Found nodes.
 * @param {Object.<number, number>=} opt_zIndices Map of layer uid to z-index.
 * @protected
 */
olcs.AbstractSynchronizer.flattenLayers =
    function(layer, foundLayers, foundGroups, opt_zIndices) {
  if (layer instanceof ol.layer.Group) {
    foundGroups.push(layer);
    var sublayers = layer.getLayers();
    if (goog.isDef(sublayers)) {
      sublayers.forEach(function(el) {
        olcs.AbstractSynchronizer.flattenLayers(el, foundLayers, foundGroups,
            opt_zIndices);
      });
    }
  } else {
    foundLayers.push(layer);
    if (opt_zIndices) {
      opt_zIndices[goog.getUid(layer)] = layer.getZIndex();
    }
  }
};


/**
 * Order counterparts using the same algorithm as the Openlayers renderer:
 * z-index then original sequence order.
 * @protected
 */
olcs.AbstractSynchronizer.prototype.orderLayers = function() {
  // Ordering logics is handled in subclasses.
};


/**
 * Add a layer hierarchy.
 * @param {ol.layer.Base} root
 * @private
 */
olcs.AbstractSynchronizer.prototype.addLayers_ = function(root) {
  var layers = [];
  var groups = [];
  olcs.AbstractSynchronizer.flattenLayers(root, layers, groups);

  layers.forEach(function(olLayer) {
    if (goog.isNull(olLayer)) {
      return;
    }
    var olLayerId = goog.getUid(olLayer);

    // create new layer and set up synchronization
    goog.asserts.assert(!goog.isDef(this.layerMap[olLayerId]));
    var cesiumObject = this.createSingleCounterpart(olLayer);

    // add Cesium layers
    if (!goog.isNull(cesiumObject)) {
      cesiumObject.zIndex = olLayer.getZIndex();
      this.addCesiumObject(cesiumObject);
      this.layerMap[olLayerId] = cesiumObject;
      this.olLayerListenKeys_[olLayerId] = olLayer.on('change:zIndex',
          this.orderLayers, this);
    }
  }, this);

  groups.forEach(function(el) {
    this.listenForGroupChanges_(el);
  }, this);

  this.orderLayers();
};


/**
 * Remove and destroy a single layer.
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
    ol.Observable.unByKey(this.olLayerListenKeys_[uid]);
    delete this.olLayerListenKeys_[uid];
  }
  delete this.layerMap[uid];
};


/**
 * Unlisten a single layer group.
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
  keys.forEach(function(key) {
    ol.Observable.unByKey(key);
  });
  delete this.olGroupListenKeys_[uid];
};


/**
 * Remove layer hierarchy.
 * @param {ol.layer.Base} root
 * @private
 */
olcs.AbstractSynchronizer.prototype.removeLayer_ = function(root) {
  if (!root) {
    return;
  }
  var layers = [];
  var groups = [];
  olcs.AbstractSynchronizer.flattenLayers(root, layers, groups);

  layers.forEach(function(el) {
    this.removeAndDestroySingleLayer_(el);
  }, this);

  groups.forEach(function(el) {
    this.unlistenSingleGroup_(el);
  }, this);
};


/**
 * Register listeners for single layer group change.
 * @param {ol.layer.Group} group
 * @private
 */
olcs.AbstractSynchronizer.prototype.listenForGroupChanges_ = function(group) {
  var uuid = goog.getUid(group);

  goog.asserts.assert(!goog.isDef(this.olGroupListenKeys_[uuid]));

  var listenKeyArray = [];
  this.olGroupListenKeys_[uuid] = listenKeyArray;

  // only the keys that need to be relistened when collection changes
  var contentKeys = [];
  var listenAddRemove = (function() {
    var collection = group.getLayers();
    if (goog.isDef(collection)) {
      contentKeys = [
        collection.on('add', function(event) {
          this.addLayers_(event.element);
        }, this),
        collection.on('remove', function(event) {
          this.removeLayer_(event.element);
        }, this)
      ];
      listenKeyArray.push.apply(listenKeyArray, contentKeys);
    }
  }).bind(this);

  listenAddRemove();

  listenKeyArray.push(group.on('change:layers', function(e) {
    contentKeys.forEach(function(el) {
      var i = listenKeyArray.indexOf(el);
      if (i >= 0) {
        listenKeyArray.splice(i, 1);
      }
      ol.Observable.unByKey(el);
    });
    listenAddRemove();
  }));
};


/**
 * Destroys all the created Cesium objects.
 * @protected
 */
olcs.AbstractSynchronizer.prototype.destroyAll = function() {
  this.removeAllCesiumObjects(true); // destroy
  goog.object.forEach(this.olGroupListenKeys, function(keys) {
    keys.forEach(ol.Observable.unByKey);
  });
  goog.object.forEach(this.olLayerListenKeys, ol.Observable.unByKey);
  this.olGroupListenKeys = {};
  this.olLayerListenKeys = {};
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
