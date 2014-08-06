goog.provide('ol3cesium.Instance');

goog.require('goog.dom');
goog.require('goog.events');

goog.require('ol3cesium.Camera');



/**
 * @param {!ol.Map} map
 * @constructor
 */
ol3cesium.Instance = function(map) {
  /**
   * @type {!ol.Map}
   * @private
   */
  this.map_ = map;

  var fillArea = 'position:absolute;top:0;left:0;width:100%;height:100%;';

  /**
   * @type {!Element}
   * @private
   */
  this.container_ = goog.dom.createDom(goog.dom.TagName.DIV,
      {style: fillArea + 'visibility:hidden;'});

  var vp = this.map_.getViewport();
  var oc = goog.dom.getElementByClass('ol-overlaycontainer', vp);
  if (oc) goog.dom.insertSiblingBefore(this.container_, oc);

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

  var sscc = this.scene_.screenSpaceCameraController;
  sscc.inertiaSpin = 0;
  sscc.ineartiaTranslate = 0;
  sscc.inertiaZoom = 0;

  sscc.tiltEventTypes.push({
    'eventType': Cesium.CameraEventType.LEFT_DRAG,
    'modifier': Cesium.KeyboardEventModifier.SHIFT
  });

  sscc.lookEventTypes = {
    'eventType': Cesium.CameraEventType.LEFT_DRAG,
    'modifier': Cesium.KeyboardEventModifier.ALT
  };

  this.scene_.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

  /**
   * @type {!ol3cesium.Camera}
   * @private
   */
  this.camera_ = new ol3cesium.Camera(this.scene_, this.map_.getView());

  /**
   * @type {!Cesium.Globe}
   * @private
   */
  this.globe_ = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
  this.scene_.globe = this.globe_;
  this.scene_.skyAtmosphere = new Cesium.SkyAtmosphere();

  var osm = new Cesium.OpenStreetMapImageryProvider();
  this.scene_.imageryLayers.addImageryProvider(osm);

  this.camera_.readFromView();

  var tick = goog.bind(function() {
    this.scene_.initializeFrame();
    this.scene_.render();
    this.camera_.checkCameraChange();
    Cesium.requestAnimationFrame(tick);
  }, this);
  Cesium.requestAnimationFrame(tick);
};


/**
 * @private
 */
ol3cesium.Instance.prototype.handleResize_ = function() {
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
 * @return {!ol3cesium.Camera}
 */
ol3cesium.Instance.prototype.getCamera = function() {
  return this.camera_;
};


/**
 * @return {!Cesium.Scene}
 */
ol3cesium.Instance.prototype.getCesiumScene = function() {
  return this.scene_;
};


/**
 * @return {boolean}
 */
ol3cesium.Instance.prototype.getEnabled = function() {
  return this.enabled_;
};


/**
 * Enables/disabled the cesium.
 * This actually causes the canvas to be added to/removed from DOM.
 * @param {boolean=} opt_enable
 */
ol3cesium.Instance.prototype.setEnabled = function(opt_enable) {
  this.enabled_ = opt_enable !== false;

  // some Cesium operations are operating with canvas.clientWidth,
  // so we can't remove it from DOM or even make display:none;
  this.container_.style.visibility = this.enabled_ ? 'visible' : 'hidden';
  if (this.enabled_) {
    var interactions = this.map_.getInteractions();
    interactions.forEach(function(el, i, arr) {
      this.pausedInteractions_.push(el);
    }, this);
    interactions.clear();

    this.handleResize_();
    this.camera_.readFromView();
  } else {
    var interactions = this.map_.getInteractions();
    goog.array.forEach(this.pausedInteractions_, function(el, i, arr) {
      interactions.push(el);
    }, this);
    this.pausedInteractions_ = [];

    this.camera_.updateView();
  }
};


goog.exportSymbol('ol3cesium.Instance', ol3cesium.Instance);
goog.exportSymbol('ol3cesium.Instance.prototype.getEnabled',
                  ol3cesium.Instance.prototype.getEnabled);
goog.exportSymbol('ol3cesium.Instance.prototype.getCamera',
                  ol3cesium.Instance.prototype.getCamera);
goog.exportSymbol('ol3cesium.Instance.prototype.getCesiumScene',
                  ol3cesium.Instance.prototype.getCesiumScene);
goog.exportSymbol('ol3cesium.Instance.prototype.setEnabled',
                  ol3cesium.Instance.prototype.setEnabled);
