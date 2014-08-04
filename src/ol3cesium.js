goog.provide('ol3Cesium.Instance');
goog.provide('ol3cesium');

goog.require('goog.dom');
goog.require('goog.events');

goog.require('ol3Cesium.Camera');


/**
 * @param {!ol.Map} map
 * @return {ol3Cesium}
 */
ol3cesium = function(map) {
  return new ol3Cesium.Instance(map);
};



/**
 * @param {!ol.Map} map
 * @constructor
 */
ol3Cesium.Instance = function(map) {
  /**
   * @type {!ol.Map}
   * @private
   */
  this.map_ = map;

  var fillArea = 'position:absolute;top:0;left:0;width:100%;height:100%';

  /**
   * @type {!Element}
   * @private
   */
  this.container_ = goog.dom.createDom(goog.dom.TagName.DIV, {style: fillArea});

  /**
   * @type {!Element}
   * @private
   */
  this.canvas_ = goog.dom.createDom(goog.dom.TagName.CANVAS, {style: fillArea});
  goog.dom.appendChild(this.container_, this.canvas_);

  /**
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;

  /**
   * @type {!Array.<ol.interaction.Interaction>}
   * @private
   */
  this.pausedInteractions_ = [];

  /**
   * @type {!Cesium.Scene}
   * @private
   */
  this.scene_ = new Cesium.Scene({
    'canvas': this.canvas_,
    'scene3DOnly': true
  });

  /**
   * @type {!ol3cesium.Camera}
   * @private
   */
  this.camera_ = new ol3Cesium.Camera(this.scene_, this.map_.getView());

  /**
   * @type {!Cesium.Globe}
   * @private
   */
  this.globe_ = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
  this.scene_.globe = this.globe_;
  this.scene_.skyAtmosphere = new Cesium.SkyAtmosphere();

  var el = this.globe_.ellipsoid;
  this.scene_.camera.lookAt(
      el.cartographicToCartesian(new Cesium.Cartographic(0, 0, 1e7)),
      el.cartographicToCartesian(new Cesium.Cartographic(0, 0, 0)),
      new Cesium.Cartesian3(0, 0, 1)
  );

  var osm = new Cesium.OpenStreetMapImageryProvider();
  this.scene_.imageryLayers.addImageryProvider(osm);

  goog.events.listen(this.map_, 'change:target',
      this.handleMapTargetChanged_, false, this);

  var tick = goog.bind(function() {
    this.scene_.initializeFrame();
    this.scene_.render();
    Cesium.requestAnimationFrame(tick);
  }, this);
  Cesium.requestAnimationFrame(tick);
};


/**
 * @private
 */
ol3Cesium.Instance.prototype.handleMapTargetChanged_ = function() {
  if (!this.enabled_) return;
  var vp = this.map_.getViewport();
  var oc = goog.dom.getElementByClass('ol-overlaycontainer', vp);
  goog.dom.removeNode(this.container_);
  if (oc) goog.dom.insertSiblingBefore(this.container_, oc);
};


/**
 * @private
 */
ol3Cesium.Instance.prototype.handleResize_ = function() {
  var width = this.canvas_.clientWidth;
  var height = this.canvas_.clientHeight;

  if (this.canvas_.width === width && this.canvas_.height === height) {
    return;
  }

  this.canvas_.width = width;
  this.canvas_.height = height;
  this.scene_.camera.frustum.aspectRatio = width / height;
};


/**
 * @return {!Cesium.Scene}
 */
ol3Cesium.Instance.prototype.getCesiumScene = function() {
  return this.scene_;
};


/**
 * @return {boolean}
 */
ol3Cesium.Instance.prototype.getEnabled = function() {
  return this.enabled_;
};


/**
 * Enables/disabled the cesium.
 * This actually causes the canvas to be added to/removed from DOM.
 * @param {boolean=} opt_enable
 */
ol3Cesium.Instance.prototype.setEnabled = function(opt_enable) {
  this.enabled_ = opt_enable !== false;
  if (this.enabled_) {
    var interactions = this.map_.getInteractions();
    interactions.forEach(function(el, i, arr) {
      this.pausedInteractions_.push(el);
    }, this);
    interactions.clear();

    this.handleMapTargetChanged_();
    this.handleResize_();
    this.camera_.readFromView();
  } else {
    var interactions = this.map_.getInteractions();
    goog.array.forEach(this.pausedInteractions_, function(el, i, arr) {
      interactions.push(el);
    }, this);
    this.pausedInteractions_ = [];

    this.camera_.updateView();
    goog.dom.removeNode(this.container_);
  }
};


//goog.exportSymbol('ol3cesium', ol3cesium);
//goog.exportSymbol('ol3Cesium.Instance.prototype.getEnabled',
//                  ol3Cesium.Instance.prototype.getEnabled);
//goog.exportSymbol('ol3Cesium.Instance.prototype.setEnabled',
//                  ol3Cesium.Instance.prototype.setEnabled);
