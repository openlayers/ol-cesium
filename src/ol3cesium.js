goog.provide('olcs.OLCesium');

goog.require('goog.async.AnimationDelay');
goog.require('goog.dom');
goog.require('olcs.AutoRenderLoop');
goog.require('olcs.Camera');
goog.require('olcs.RasterSynchronizer');
goog.require('olcs.VectorSynchronizer');



/**
 * @param {!olcsx.OLCesiumOptions} options Options.
 * @constructor
 * @api
 */
olcs.OLCesium = function(options) {

  /**
   * @type {olcs.AutoRenderLoop}
   * @private
   */
  this.autoRenderLoop_ = null;

  /**
   * @type {!ol.Map}
   * @private
   */
  this.map_ = options.map;

  /**
   * @type {number}
   * @private
   */
  this.resolutionScale_ = 1.0;

  /**
   * @type {number}
   * @private
   */
  this.canvasClientWidth_ = 0.0;

  /**
   * @type {number}
   * @private
   */
  this.canvasClientHeight_ = 0.0;

  /**
   * @type {boolean}
   * @private
   */
  this.resolutionScaleChanged_ = true; // force resize

  var fillArea = 'position:absolute;top:0;left:0;width:100%;height:100%;';

  /**
   * @type {!Element}
   * @private
   */
  this.container_ = goog.dom.createDom(goog.dom.TagName.DIV,
      {style: fillArea + 'visibility:hidden;'});

  var targetElement = goog.dom.getElement(options.target || null);
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
  this.canvas_.oncontextmenu = function() { return false; };
  this.canvas_.onselectstart = function() { return false; };

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
  sscc.inertiaTranslate = 0;
  sscc.inertiaZoom = 0;

  sscc.tiltEventTypes.push({
    'eventType': Cesium.CameraEventType.LEFT_DRAG,
    'modifier': Cesium.KeyboardEventModifier.SHIFT
  });

  sscc.tiltEventTypes.push({
    'eventType': Cesium.CameraEventType.LEFT_DRAG,
    'modifier': Cesium.KeyboardEventModifier.ALT
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

  this.dataSourceCollection_ = new Cesium.DataSourceCollection();
  this.dataSourceDisplay_ = new Cesium.DataSourceDisplay({
    scene: this.scene_,
    dataSourceCollection: this.dataSourceCollection_
  });

  var synchronizers = goog.isDef(options.createSynchronizers) ?
      options.createSynchronizers(this.map_, this.scene_) :
      [
        new olcs.RasterSynchronizer(this.map_, this.scene_),
        new olcs.VectorSynchronizer(this.map_, this.scene_)
      ];

  // Assures correct canvas size after initialisation
  this.handleResize_();

  for (var i = synchronizers.length - 1; i >= 0; --i) {
    synchronizers[i].synchronize();
  }

  if (this.isOverMap_) {
    // if in "stacked mode", hide everything except canvas (including credits)
    var credits = goog.dom.getNextElementSibling(this.canvas_);
    if (goog.isDefAndNotNull(credits)) {
      credits.style.display = 'none';
    }
  }

  this.cesiumRenderingDelay_ = new goog.async.AnimationDelay(function(time) {
    if (!this.blockCesiumRendering_) {
      var julianDate = Cesium.JulianDate.now();
      this.scene_.initializeFrame();
      this.handleResize_();
      this.dataSourceDisplay_.update(julianDate);
      this.scene_.render(julianDate);
      this.enabled_ && this.camera_.checkCameraChange();
    }
    this.cesiumRenderingDelay_.start();
  }, undefined, this);

  /**
   * @private
   */
  this.blockCesiumRendering_ = false;
};


/**
 * @private
 */
olcs.OLCesium.prototype.handleResize_ = function() {
  var width = this.canvas_.clientWidth;
  var height = this.canvas_.clientHeight;

  if (width === this.canvasClientWidth_ &&
      height === this.canvasClientHeight_ &&
      !this.resolutionScaleChanged_) {
    return;
  }

  var zoomFactor = (window.devicePixelRatio || 1.0) * this.resolutionScale_;
  this.resolutionScaleChanged_ = false;

  this.canvasClientWidth_ = width;
  this.canvasClientHeight_ = height;

  width *= zoomFactor;
  height *= zoomFactor;

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
 * @return {!ol.Map}
 * @api
 */
olcs.OLCesium.prototype.getOlMap = function() {
  return this.map_;
};


/**
 * @return {!Cesium.Scene}
 * @api
 */
olcs.OLCesium.prototype.getCesiumScene = function() {
  return this.scene_;
};


/**
 * @return {!Cesium.DataSourceCollection}
 * @api
 */
olcs.OLCesium.prototype.getDataSources = function() {
  return this.dataSourceCollection_;
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
 * @param {boolean} enable
 * @api
 */
olcs.OLCesium.prototype.setEnabled = function(enable) {
  if (this.enabled_ == enable) {
    return;
  }
  this.enabled_ = enable;

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
    this.camera_.readFromView();
    this.cesiumRenderingDelay_.start();
  } else {
    if (this.isOverMap_) {
      var interactions = this.map_.getInteractions();
      this.pausedInteractions_.forEach(function(interaction) {
        interactions.push(interaction);
      });
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


/**
 * Preload Cesium so that it is ready when transitioning from 2D to 3D.
 * @param {number} height Target height of the camera
 * @param {number} timeout Milliseconds after which the warming will stop
 * @api
*/
olcs.OLCesium.prototype.warmUp = function(height, timeout) {
  if (this.enabled_) {
    // already enabled
    return;
  }
  this.camera_.readFromView();
  var ellipsoid = this.globe_.ellipsoid;
  var csCamera = this.scene_.camera;
  var position = ellipsoid.cartesianToCartographic(csCamera.position);
  if (position.height < height) {
    position.height = height;
    csCamera.position = ellipsoid.cartographicToCartesian(position);
  }
  this.cesiumRenderingDelay_.start();
  var that = this;
  setTimeout(
      function() { !that.enabled_ && that.cesiumRenderingDelay_.stop(); },
      timeout);
};


/**
 * Block Cesium rendering to save resources.
 * @param {boolean} block True to block.
 * @api
*/
olcs.OLCesium.prototype.setBlockCesiumRendering = function(block) {
  this.blockCesiumRendering_ = block;
};


/**
 * Render the globe only when necessary in order to save resources.
 * Experimental.
 * @api
 */
olcs.OLCesium.prototype.enableAutoRenderLoop = function() {
  if (!this.autoRenderLoop_) {
    this.autoRenderLoop_ = new olcs.AutoRenderLoop(this, false);
  }
};


/**
 * Get the autorender loop.
 * @return {?olcs.AutoRenderLoop}
 * @api
*/
olcs.OLCesium.prototype.getAutoRenderLoop = function() {
  return this.autoRenderLoop_;
};


/**
 * The 3D Cesium globe is rendered in a canvas with two different dimensions:
 * clientWidth and clientHeight which are the dimension on the screen and
 * width and height which are the dimensions of the drawing buffer.
 *
 * By using a resolution scale lower than 1.0, it is possible to render the
 * globe in a buffer smaller than the canvas client dimensions and improve
 * performance, at the cost of quality.
 *
 * Pixel ratio should also be taken into account; by default, a device with
 * pixel ratio of 2.0 will have a buffer surface 4 times bigger than the client
 * surface.
 *
 * @param {number} value
 * @this {olcs.OLCesium}
 * @api
 */
olcs.OLCesium.prototype.setResolutionScale = function(value) {
  value = Math.max(0, value);
  if (value !== this.resolutionScale_) {
    this.resolutionScale_ = Math.max(0, value);
    this.resolutionScaleChanged_ = true;
    if (this.autoRenderLoop_) {
      this.autoRenderLoop_.restartRenderLoop();
    }
  }
};
