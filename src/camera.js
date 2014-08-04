goog.provide('ol3Cesium.Camera');

goog.require('goog.events');



/**
 * This object takes care of additional 3d-specific properties of the view and
 * ensures proper synchronization with the underlying raw Cesium.Camera object.
 * @param {!Cesium.Scene} scene
 * @param {!ol.View} view
 * @constructor
 */
ol3Cesium.Camera = function(scene, view) {
  /**
   * @type {!Cesium.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = scene.canvas;

  /**
   * @type {!Cesium.Camera}
   * @private
   */
  this.cam_ = scene.camera;

  /**
   * @type {!ol.View}
   * @private
   */
  this.view_ = view;

  /**
   * @type {ol.TransformFunction}
   * @private
   */
  this.toLatLng_ = ol.proj.getTransform(this.view_.getProjection(),
                                        'EPSG:4326');

  /**
   * @type {ol.TransformFunction}
   * @private
   */
  this.fromLatLng_ = ol.proj.getTransform('EPSG:4326',
                                          this.view_.getProjection());

  //TODO: handles change of view and its projection

  /**
   * 0 -- topdown, PI/2 -- the horizon
   * @type {number}
   * @private
   */
  this.tilt_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.roll_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.distance_ = 0;

  /**
   * @type {?Cesium.Matrix4}
   * @private
   */
  this.lastCameraViewMatrix_ = null;

  /**
   * This is used to discard change events on view caused by updateView method.
   * @type {boolean}
   * @private
   */
  this.viewUpdateInProgress_ = false;

  goog.events.listen(this.view_,
      ['change:center', 'change:resolution', 'change:rotation'], function(e) {
        if (!this.viewUpdateInProgress_) this.readFromView();
      }, false, this);

};


/**
 * Updates the state of the underlying Cesium.Camera
 * according to the current values of the properties.
 */
ol3Cesium.Camera.prototype.updateCamera = function() {
  var ll = this.toLatLng_(this.view_.getCenter());

  var carto = new Cesium.Cartographic(goog.math.toRadians(ll[0]),
                                      goog.math.toRadians(ll[1]));
  if (this.scene_.globe) carto.height = this.scene_.globe.getHeight(carto) || 0;
  this.cam_.setPositionCartographic(carto);

  this.cam_.twistLeft(this.view_.getRotation());
  if (this.tilt_) this.cam_.lookUp(this.tilt_);
  if (this.roll_) this.cam_.twistLeft(this.roll_);
  this.cam_.moveBackward(this.distance_);

  this.checkCameraChange(true);
};


/**
 * Calculates the values of the properties from the current ol.View state.
 */
ol3Cesium.Camera.prototype.readFromView = function() {
  this.distance_ = this.calcDistanceForResolution_(this.view_.getResolution(),
      goog.math.toRadians(this.toLatLng_(this.view_.getCenter())[1]));

  this.updateCamera();
};


/**
 * Calculates the values of the properties from the current Cesium.Camera state.
 * Modifies the center, resolution and rotation properties of the view.
 */
ol3Cesium.Camera.prototype.updateView = function() {
  this.viewUpdateInProgress_ = true;

  // target & distance
  var center = new Cesium.Cartesian2(this.canvas_.width / 2,
                                     this.canvas_.height / 2);
  var target = this.scene_.globe.pick(this.cam_.getPickRay(center),
                                      this.scene_);
  var targetCartographic;
  if (target) {
    this.distance_ = Cesium.Cartesian3.distance(target, this.cam_.position);
    targetCartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(target);
    this.view_.setCenter(this.fromLatLng_([
      goog.math.toDegrees(targetCartographic.longitude),
      goog.math.toDegrees(targetCartographic.latitude)]));
  } else {
    //TODO: ? use position under the camera?
  }

  // resolution
  this.view_.setResolution(
      this.calcResolutionForDistance_(this.distance_,
          targetCartographic ? targetCartographic.latitude : 0));


  /*
   * Since we are positioning the target, the values of heading, tilt and roll
   * need to be calculated _at the target_.
   */
  if (target) {
    var pos = this.cam_.positionWC; //this forces the update

    // normal to the ellipsoid at the target
    var targetNormal = new Cesium.Cartesian3();
    this.scene_.globe.ellipsoid.geocentricSurfaceNormal(target, targetNormal);

    // vector from the target to the camera
    var targetToCamera = new Cesium.Cartesian3();
    Cesium.Cartesian3.subtract(pos, target, targetToCamera);
    Cesium.Cartesian3.normalize(targetToCamera, targetToCamera);


    // HEADING
    var normal = new Cesium.Cartesian3(-target.y, target.x, 0);
    var heading = Cesium.Cartesian3.angleBetween(this.cam_.right, normal);
    var orientation = Cesium.Cartesian3.cross(target, this.cam_.up,
                                              new Cesium.Cartesian3()).z;

    this.view_.setRotation((orientation < 0 ? heading : -heading));

    // TILT
    this.tilt_ = Math.acos(Cesium.Cartesian3.dot(targetNormal,
                                                 targetToCamera)) || 0;

    // TODO: ROLL
    this.roll_ = 0;
  } else {
    // fallback when there is no target
    this.view_.setRotation(this.cam_.heading);
    this.tilt_ = -this.cam_.tilt + Math.PI / 2;
  }

  this.viewUpdateInProgress_ = false;
};


/**
 * Check if the underlying camera state has changed and ensure synchronization.
 * @param {boolean=} opt_dontSync Do not synchronize the view.
 */
ol3Cesium.Camera.prototype.checkCameraChange = function(opt_dontSync) {
  var viewMatrix = this.cam_.viewMatrix;
  if (!this.lastCameraViewMatrix_ ||
      !this.lastCameraViewMatrix_.equals(viewMatrix)) {
    this.lastCameraViewMatrix_ = viewMatrix.clone();
    if (opt_dontSync !== true) {
      this.updateView();
    }
  }
};


/**
 * @param {number} resolution
 * @param {number} latitude
 * @return {number} The calculated distance.
 * @private
 */
ol3Cesium.Camera.prototype.calcDistanceForResolution_ = function(resolution,
                                                                 latitude) {
  var fovy = this.cam_.frustum.fov;

  var visibleMapUnits = resolution * this.canvas_.width;
  var circ = Math.cos(Math.abs(latitude));

  var meters = circ * visibleMapUnits;
  var requiredDistance = (meters / 2) / Math.tan(fovy / 2);

  return requiredDistance;
};


/**
 * @param {number} distance
 * @param {number} latitude
 * @return {number} The calculated resolution.
 * @private
 */
ol3Cesium.Camera.prototype.calcResolutionForDistance_ = function(distance,
                                                                 latitude) {
  var fovy = this.cam_.frustum.fov;

  var meters = 2 * distance * Math.tan(fovy / 2);
  var circ = Math.cos(Math.abs(latitude));
  var visibleMapUnits = meters / circ;
  var resolution = visibleMapUnits / this.canvas_.width;

  return resolution;
};
