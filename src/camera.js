goog.provide('olcs.Camera');

goog.require('goog.events');



/**
 * This object takes care of additional 3d-specific properties of the view and
 * ensures proper synchronization with the underlying raw Cesium.Camera object.
 * @param {!Cesium.Scene} scene
 * @param {!ol.View} view
 * @constructor
 * @api
 */
olcs.Camera = function(scene, view) {
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
  this.toLonLat_ = ol.proj.getTransform(this.view_.getProjection(),
                                        'EPSG:4326');

  /**
   * @type {ol.TransformFunction}
   * @private
   */
  this.fromLonLat_ = ol.proj.getTransform('EPSG:4326',
                                          this.view_.getProjection());

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

  goog.events.listen(/** @type {!goog.events.EventTarget} */(this.view_),
      ['change:center', 'change:resolution', 'change:rotation'], function(e) {
        if (!this.viewUpdateInProgress_) {
          this.readFromView();
        }
      }, false, this);

};


/**
 * @param {number} heading In radians.
 * @api
 */
olcs.Camera.prototype.setHeading = function(heading) {
  this.view_.setRotation(heading);
};


/**
 * @return {number} Heading in radians.
 * @api
 */
olcs.Camera.prototype.getHeading = function() {
  var rotation = this.view_.getRotation();
  return goog.isDef(rotation) ? rotation : 0;
};


/**
 * @param {number} tilt In radians.
 * @api
 */
olcs.Camera.prototype.setTilt = function(tilt) {
  this.tilt_ = tilt;
  this.updateCamera_();
};


/**
 * @return {number} Tilt in radians.
 * @api
 */
olcs.Camera.prototype.getTilt = function() {
  return this.tilt_;
};


/**
 * @param {number} distance In meters.
 * @api
 */
olcs.Camera.prototype.setDistance = function(distance) {
  this.distance_ = distance;
  this.updateCamera_();
  this.updateView();
};


/**
 * @return {number} Distance in meters.
 * @api
 */
olcs.Camera.prototype.getDistance = function() {
  return this.distance_;
};


/**
 * Shortcut for ol.View.setCenter().
 * @param {!ol.Coordinate} center Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.setCenter = function(center) {
  this.view_.setCenter(center);
};


/**
 * Shortcut for ol.View.getCenter().
 * @return {!ol.Coordinate} Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.getCenter = function() {
  return this.view_.getCenter();
};


/**
 * Sets the position of the camera.
 * @param {!ol.Coordinate} position Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.setPosition = function(position) {
  var ll = this.toLonLat_(position);

  var carto = new Cesium.Cartographic(goog.math.toRadians(ll[0]),
                                      goog.math.toRadians(ll[1]),
                                      this.getAltitude());

  this.cam_.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
  this.updateView();
};


/**
 * Calculates position under the camera.
 * @return {!ol.Coordinate} Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.getPosition = function() {
  var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
      this.cam_.position);

  return this.fromLonLat_([goog.math.toDegrees(carto.longitude),
                           goog.math.toDegrees(carto.latitude)]);
};


/**
 * @param {number} altitude In meters.
 * @api
 */
olcs.Camera.prototype.setAltitude = function(altitude) {
  var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
      this.cam_.position);
  carto.height = altitude;
  this.cam_.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

  this.updateView();
};


/**
 * @return {number} Altitude in meters.
 * @api
 */
olcs.Camera.prototype.getAltitude = function() {
  var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
      this.cam_.position);

  return carto.height;
};


/**
 * Rotates the camera to point at the specified target.
 * @param {!ol.Coordinate} position Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.lookAt = function(position) {
  var ll = this.toLonLat_(position);

  var carto = new Cesium.Cartographic(goog.math.toRadians(ll[0]),
                                      goog.math.toRadians(ll[1]));
  if (this.scene_.globe) {
    var height = this.scene_.globe.getHeight(carto);
    carto.height = goog.isDef(height) ? height : 0;
  }
  var carte = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

  var pos = this.cam_.position;
  var up = Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(
      pos, new Cesium.Cartesian3());
  this.cam_.lookAt(pos, carte, up);

  this.updateView();
};


/**
 * Updates the state of the underlying Cesium.Camera
 * according to the current values of the properties.
 * @private
 */
olcs.Camera.prototype.updateCamera_ = function() {
  var ll = this.toLonLat_(this.view_.getCenter());

  var carto = new Cesium.Cartographic(goog.math.toRadians(ll[0]),
                                      goog.math.toRadians(ll[1]));
  if (this.scene_.globe) {
    var height = this.scene_.globe.getHeight(carto);
    carto.height = goog.isDef(height) ? height : 0;
  }
  this.cam_.setPositionCartographic(carto);

  var rotation = this.view_.getRotation();
  this.cam_.twistLeft(goog.isDef(rotation) ? rotation : 0);
  if (this.tilt_) {
    this.cam_.lookUp(this.tilt_);
  }
  this.cam_.moveBackward(this.distance_);

  this.checkCameraChange(true);
};


/**
 * Calculates the values of the properties from the current ol.View state.
 */
olcs.Camera.prototype.readFromView = function() {
  var resolution = this.view_.getResolution();
  this.distance_ = this.calcDistanceForResolution_(
      goog.isDef(resolution) ? resolution : 0,
      goog.math.toRadians(this.toLonLat_(this.view_.getCenter())[1]));

  this.updateCamera_();
};


/**
 * Calculates the values of the properties from the current Cesium.Camera state.
 * Modifies the center, resolution and rotation properties of the view.
 * @api
 */
olcs.Camera.prototype.updateView = function() {
  this.viewUpdateInProgress_ = true;

  // target & distance
  var center = new Cesium.Cartesian2(this.canvas_.width / 2,
                                     this.canvas_.height / 2);
  var target = this.scene_.globe.pick(this.cam_.getPickRay(center),
                                      this.scene_);

  var bestTarget = target;
  if (!bestTarget) {
    //TODO: how to handle this properly ?
    var carto = this.cam_.positionCartographic.clone();
    if (this.scene_.globe) {
      var height = this.scene_.globe.getHeight(carto);
      carto.height = goog.isDef(height) ? height : 0;
    }
    bestTarget = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
  }
  this.distance_ = Cesium.Cartesian3.distance(bestTarget, this.cam_.position);
  var bestTargetCartographic =
      Cesium.Ellipsoid.WGS84.cartesianToCartographic(bestTarget);
  this.view_.setCenter(this.fromLonLat_([
    goog.math.toDegrees(bestTargetCartographic.longitude),
    goog.math.toDegrees(bestTargetCartographic.latitude)]));

  // resolution
  this.view_.setResolution(
      this.calcResolutionForDistance_(this.distance_,
          bestTargetCartographic ? bestTargetCartographic.latitude : 0));


  /*
   * Since we are positioning the target, the values of heading and tilt
   * need to be calculated _at the target_.
   */
  if (target) {
    var pos = this.cam_.position;

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
    var tiltAngle = Math.acos(
        Cesium.Cartesian3.dot(targetNormal, targetToCamera));
    this.tilt_ = isNaN(tiltAngle) ? 0 : tiltAngle;
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
olcs.Camera.prototype.checkCameraChange = function(opt_dontSync) {
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
olcs.Camera.prototype.calcDistanceForResolution_ = function(resolution,
                                                            latitude) {
  var fovy = this.cam_.frustum.fovy; // vertical field of view
  var metersPerUnit =
      ol.proj.METERS_PER_UNIT[this.view_.getProjection().getUnits()];

  var visibleMapUnits = resolution * this.canvas_.height;
  var relativeCircumference = Math.cos(Math.abs(latitude));
  var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

  // distance required to view the calculated length in meters
  //
  //  fovy/2
  //    |\
  //  x | \
  //    |--\
  // visibleMeters/2
  var requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

  return requiredDistance;
};


/**
 * @param {number} distance
 * @param {number} latitude
 * @return {number} The calculated resolution.
 * @private
 */
olcs.Camera.prototype.calcResolutionForDistance_ = function(distance,
                                                            latitude) {
  // See the reverse calculation (calcDistanceForResolution_) for details
  var fovy = this.cam_.frustum.fovy;
  var metersPerUnit =
      ol.proj.METERS_PER_UNIT[this.view_.getProjection().getUnits()];

  var visibleMeters = 2 * distance * Math.tan(fovy / 2);
  var relativeCircumference = Math.cos(Math.abs(latitude));
  var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  var resolution = visibleMapUnits / this.canvas_.height;

  return resolution;
};
