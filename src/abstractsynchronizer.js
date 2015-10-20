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
   * Null value means, that we are unable to create equivalent layers.
   * @type {Object.<number, ?Array.<T>>}
   * @protected
   */
  this.layerMap = {};

  /**
   * Map of listen keys for ol3 layer layers ids (from goog.getUid).
   * @type {!Object.<number, goog.events.Key>}
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
  /** @type {Array.<!ol.layer.Base>} */
  var fifo = [root];
  while (fifo.length > 0) {
    var olLayer = fifo.splice(0, 1)[0];
    var olLayerId = goog.getUid(olLayer);
    goog.asserts.assert(!goog.isDef(this.layerMap[olLayerId]));

    var cesiumObjects = null;
    if (olLayer instanceof ol.layer.Group) {
      this.listenForGroupChanges_(olLayer);
      cesiumObjects = this.createSingleLayerCounterparts(olLayer);
      if (!cesiumObjects) {
        olLayer.getLayers().forEach(function(l) {
          fifo.push(l);
        });
      }
    } else {
      cesiumObjects = this.createSingleLayerCounterparts(olLayer);
    }

    // add Cesium layers
    if (!goog.isNull(cesiumObjects)) {
      this.layerMap[olLayerId] = cesiumObjects;
      this.olLayerListenKeys_[olLayerId] = olLayer.on('change:zIndex',
          this.orderLayers, this);
      cesiumObjects.forEach(function(cesiumObject) {
        this.addCesiumObject(cesiumObject);
      }, this);
    }
  }

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
  var counterparts = this.layerMap[uid];
  if (!!counterparts) {
    counterparts.forEach(function(counterpart) {
      this.removeSingleCesiumObject(counterpart, false);
      this.destroyCesiumObject(counterpart);
    }, this);
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
  delete this.layerMap[uid];
};


/**
 * Remove layer hierarchy.
 * @param {ol.layer.Base} root
 * @private
 */
olcs.AbstractSynchronizer.prototype.removeLayer_ = function(root) {
  if (!!root) {
    var fifo = [root];
    while (fifo.length > 0) {
      var olLayer = fifo.splice(0, 1)[0];
      if (olLayer instanceof ol.layer.Group) {
        this.unlistenSingleGroup_(olLayer);
        olLayer.getLayers().forEach(function(l) {
          fifo.push(l);
        });
      } else {
        this.removeAndDestroySingleLayer_(olLayer);
      }
    }
  }
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
 * @param {!ol.layer.Base} olLayer
 * @return {?Array.<T>}
 * @protected
 */
olcs.AbstractSynchronizer.prototype.createSingleLayerCounterparts =
    goog.abstractMethod;
