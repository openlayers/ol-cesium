goog.provide('olcs.OLCesium');

goog.require('goog.async.AnimationDelay');
goog.require('goog.dom');
goog.require('goog.events');

goog.require('olcs.Camera');
goog.require('olcs.RasterSynchronizer');
goog.require('olcs.VectorSynchronizer');



/**
 * @param {!ol.Map} map
 * @param {Element|string=} opt_target Target element for the Cesium container.
 * @constructor
 * @api
 */
olcs.OLCesium = function(map, opt_target) {
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

  var targetElement = goog.dom.getElement(opt_target || null);
  if (targetElement) {
    goog.dom.appendChild(targetElement, this.container_);
  } else {
    var vp = this.map_.getViewport();
    var oc = goog.dom.getElementByClass('ol-overlaycontainer', vp);
    if (oc) {
      goog.dom.insertSiblingBefore(this.container_, oc);
    }
  }

  /**
   * Whether the Cesium container is placed over the ol map.
   * @type {boolean}
   * @private
   */
  this.isOverMap_ = !goog.isDefAndNotNull(targetElement);

  /**
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = /** @type {!HTMLCanvasElement} */
      (goog.dom.createDom(goog.dom.TagName.CANVAS, {style: fillArea}));
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
   * @type {?ol.layer.Group}
   * @private
   */
  this.hiddenRootGroup_ = null;

  /**
   * @type {!Cesium.Scene}
   * @private
   */
  this.scene_ = new Cesium.Scene({
    canvas: this.canvas_,
    scene3DOnly: true
  });

  var sscc = this.scene_.screenSpaceCameraController;
  sscc.inertiaSpin = 0;
  sscc.ineartiaTranslate = 0;
  sscc.inertiaZoom = 0;

  sscc.tiltEventTypes.push({
    'eventType': Cesium.CameraEventType.LEFT_DRAG,
    'modifier': Cesium.KeyboardEventModifier.SHIFT
  });

  sscc.enableLook = false;

  this.scene_.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

  /**
   * @type {!olcs.Camera}
   * @private
   */
  this.camera_ = new olcs.Camera(this.scene_, this.map_);

  /**
   * @type {!Cesium.Globe}
   * @private
   */
  this.globe_ = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
  this.scene_.globe = this.globe_;
  this.scene_.skyAtmosphere = new Cesium.SkyAtmosphere();

  /**
   * @type {!olcs.RasterSynchronizer}
   * @private
   */
  this.rasterSynchronizer_ = new olcs.RasterSynchronizer(this.map_,
      this.scene_);
  this.rasterSynchronizer_.synchronize();

  this.vectorSynchronizer_ = new olcs.VectorSynchronizer(this.map_,
      this.scene_);
  this.vectorSynchronizer_.synchronize();

  if (this.isOverMap_) {
    // if in "stacked mode", hide everything except canvas (including credits)
    var credits = goog.dom.getNextElementSibling(this.canvas_);
    if (goog.isDefAndNotNull(credits)) {
      credits.style.display = 'none';
    }
  }

  this.camera_.readFromView();

  this.cesiumRenderingDelay_ = new goog.async.AnimationDelay(function(time) {
    this.scene_.initializeFrame();
    this.scene_.render();
    this.camera_.checkCameraChange();

    this.cesiumRenderingDelay_.start();
  }, undefined, this);
};


/**
 * @private
 */
olcs.OLCesium.prototype.handleResize_ = function() {
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
 * @return {!olcs.Camera}
 * @api
 */
olcs.OLCesium.prototype.getCamera = function() {
  return this.camera_;
};


/**
 * @return {!Cesium.Scene}
 * @api
 */
olcs.OLCesium.prototype.getCesiumScene = function() {
  return this.scene_;
};


/**
 * @return {boolean}
 * @api
 */
olcs.OLCesium.prototype.getEnabled = function() {
  return this.enabled_;
};


/**
 * Enables/disables the Cesium.
 * This modifies the visibility style of the container element.
 * @param {boolean=} opt_enable
 * @api
 */
olcs.OLCesium.prototype.setEnabled = function(opt_enable) {
  this.enabled_ = opt_enable !== false;

  // some Cesium operations are operating with canvas.clientWidth,
  // so we can't remove it from DOM or even make display:none;
  this.container_.style.visibility = this.enabled_ ? 'visible' : 'hidden';
  if (this.enabled_) {
    if (this.isOverMap_) {
      var interactions = this.map_.getInteractions();
      interactions.forEach(function(el, i, arr) {
        this.pausedInteractions_.push(el);
      }, this);
      interactions.clear();

      var rootGroup = this.map_.getLayerGroup();
      if (rootGroup.getVisible()) {
        this.hiddenRootGroup_ = rootGroup;
        this.hiddenRootGroup_.setVisible(false);
      }
    }
    this.handleResize_();
    this.camera_.readFromView();
    this.cesiumRenderingDelay_.start();
  } else {
    if (this.isOverMap_) {
      var interactions = this.map_.getInteractions();
      goog.array.forEach(this.pausedInteractions_, function(el, i, arr) {
        interactions.push(el);
      }, this);
      this.pausedInteractions_.length = 0;

      if (!goog.isNull(this.hiddenRootGroup_)) {
        this.hiddenRootGroup_.setVisible(true);
        this.hiddenRootGroup_ = null;
      }
    }

    this.camera_.updateView();
    this.cesiumRenderingDelay_.stop();
  }
};
