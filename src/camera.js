goog.provide('olcs.Camera');

goog.require('goog.events');
goog.require('olcs.core');



/**
 * This object takes care of additional 3d-specific properties of the view and
 * ensures proper synchronization with the underlying raw Cesium.Camera object.
 * @param {!Cesium.Scene} scene
 * @param {!ol.Map} map
 * @constructor
 * @api
 */
olcs.Camera = function(scene, map) {
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
   * @type {!ol.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {?ol.View}
   * @private
   */
  this.view_ = null;

  /**
   * @type {!Array}
   * @private
   */
  this.viewListenKeys_ = [];

  /**
   * @type {?ol.TransformFunction}
   * @private
   */
  this.toLonLat_ = null;

  /**
   * @type {?ol.TransformFunction}
   * @private
   */
  this.fromLonLat_ = null;

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

  this.map_.on('change:view', function(e) {
    this.setView_(this.map_.getView());
  }, this);
  this.setView_(this.map_.getView());
};


/**
 * @param {ol.View|null|undefined} view New view to use.
 * @private
 */
olcs.Camera.prototype.setView_ = function(view) {
  if (!goog.isNull(this.view_)) {
    goog.array.forEach(this.viewListenKeys_, this.view_.unByKey);
  }

  this.view_ = goog.isDefAndNotNull(view) ? view : null;
  if (goog.isDefAndNotNull(view)) {
    this.toLonLat_ = ol.proj.getTransform(view.getProjection(), 'EPSG:4326');
    this.fromLonLat_ = ol.proj.getTransform('EPSG:4326', view.getProjection());

    var handleViewEvent_ = goog.bind(function(e) {
      if (!this.viewUpdateInProgress_) {
        this.readFromView();
      }
    }, this);

    this.viewListenKeys_ = [
      view.on('change:center', handleViewEvent_),
      view.on('change:resolution', handleViewEvent_),
      view.on('change:rotation', handleViewEvent_)
    ];
    this.readFromView();
  } else {
    this.toLonLat_ = null;
    this.fromLonLat_ = null;
    this.viewListenKeys_ = [];
  }
};


/**
 * @param {number} heading In radians.
 * @api
 */
olcs.Camera.prototype.setHeading = function(heading) {
  if (goog.isNull(this.view_)) {
    return;
  }

  this.view_.setRotation(heading);
};


/**
 * @return {number|undefined} Heading in radians.
 * @api
 */
olcs.Camera.prototype.getHeading = function() {
  if (goog.isNull(this.view_)) {
    return undefined;
  }
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
  if (goog.isNull(this.view_)) {
    return;
  }
  this.view_.setCenter(center);
};


/**
 * Shortcut for ol.View.getCenter().
 * @return {ol.Coordinate|undefined} Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.getCenter = function() {
  if (goog.isNull(this.view_)) {
    return undefined;
  }
  return this.view_.getCenter();
};


/**
 * Sets the position of the camera.
 * @param {!ol.Coordinate} position Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.setPosition = function(position) {
  if (goog.isNull(this.toLonLat_)) {
    return;
  }
  var ll = this.toLonLat_(position);

  var carto = new Cesium.Cartographic(goog.math.toRadians(ll[0]),
                                      goog.math.toRadians(ll[1]),
                                      this.getAltitude());

  this.cam_.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
  this.updateView();
};


/**
 * Calculates position under the camera.
 * @return {!ol.Coordinate|undefined} Same projection as the ol.View.
 * @api
 */
olcs.Camera.prototype.getPosition = function() {
  if (goog.isNull(this.fromLonLat_)) {
    return undefined;
  }
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
  if (goog.isNull(this.toLonLat_)) {
    return;
  }
  var ll = this.toLonLat_(position);

  var carto = Cesium.Cartographic.fromDegrees(ll[0], ll[1]);
  olcs.core.lookAt(this.cam_, carto, this.scene_.globe);

  this.updateView();
};


/**
 * Updates the state of the underlying Cesium.Camera
 * according to the current values of the properties.
 * @private
 */
olcs.Camera.prototype.updateCamera_ = function() {
  if (goog.isNull(this.view_) || goog.isNull(this.toLonLat_)) {
    return;
  }
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
  if (goog.isNull(this.view_) || goog.isNull(this.toLonLat_)) {
    return;
  }
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
  if (goog.isNull(this.view_) || goog.isNull(this.fromLonLat_)) {
    return;
  }
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
  var metersPerUnit = this.view_.getProjection().getMetersPerUnit();

  // number of "map units" visible in 2D (vertically)
  var visibleMapUnits = resolution * this.canvas_.height;

  // The metersPerUnit does not take latitude into account, but it should
  // be lower with increasing latitude -- we have to compensate.
  // In 3D it is not possible to maintain the resolution at more than one point,
  // so it only makes sense to use the latitude of the "target" point.
  var relativeCircumference = Math.cos(Math.abs(latitude));

  // how many meters should be visible in 3D
  var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

  // distance required to view the calculated length in meters
  //
  //  fovy/2
  //    |\
  //  x | \
  //    |--\
  // visibleMeters/2
  var requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

  // NOTE: This calculation is not absolutely precise, because metersPerUnit
  // is a great simplification. It does not take ellipsoid/terrain into account.

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
  var metersPerUnit = this.view_.getProjection().getMetersPerUnit();

  var visibleMeters = 2 * distance * Math.tan(fovy / 2);
  var relativeCircumference = Math.cos(Math.abs(latitude));
  var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  var resolution = visibleMapUnits / this.canvas_.height;

  return resolution;
};
