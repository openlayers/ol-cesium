/**
 * @module olcs.Camera
 */
import googAsserts from 'goog/asserts.js';
import {unByKey as olObservableUnByKey} from 'ol/Observable.js';
import * as olEvents from 'ol/events.js';
import * as olMath from 'ol/math.js';
import * as olProj from 'ol/proj.js';
import olcsCore from './core.js';

/**
 * This object takes care of additional 3d-specific properties of the view and
 * ensures proper synchronization with the underlying raw Cesium.Camera object.
 * @param {!Cesium.Scene} scene
 * @param {!ol.Map} map
 * @constructor
 * @api
 * @struct
 */
const exports = function(scene, map) {
  /**
   * @type {!Cesium.Scene}
   * @private
   */
  this.scene_ = scene;

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
   * @type {?ol.EventsKey}
   * @private
   */
  this.viewListenKey_ = null;

  /**
   * @type {!ol.TransformFunction}
   * @private
   */
  this.toLonLat_ = exports.identityProjection;

  /**
   * @type {!ol.TransformFunction}
   * @private
   */
  this.fromLonLat_ = exports.identityProjection;

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

  this.map_.on('change:view', (e) => {
    this.setView_(this.map_.getView());
  });
  this.setView_(this.map_.getView());
};


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Input coordinate array (same array as input).
 */
exports.identityProjection = function(input, opt_output, opt_dimension) {
  const dim = opt_dimension || input.length;
  if (opt_output) {
    for (let i = 0; i < dim; ++i) {
      opt_output[i] = input[i];
    }
  }
  return input;
};


/**
 * @param {?ol.View} view New view to use.
 * @private
 */
exports.prototype.setView_ = function(view) {
  if (this.view_) {
    olObservableUnByKey(this.viewListenKey_);
    this.viewListenKey_ = null;
  }

  this.view_ = view;
  if (view) {
    const toLonLat = olProj.getTransform(view.getProjection(), 'EPSG:4326');
    const fromLonLat = olProj.getTransform('EPSG:4326', view.getProjection());
    googAsserts.assert(toLonLat && fromLonLat);

    this.toLonLat_ = toLonLat;
    this.fromLonLat_ = fromLonLat;

    this.viewListenKey_ = olEvents.listen(view, 'propertychange',
        this.handleViewEvent_, this);

    this.readFromView();
  } else {
    this.toLonLat_ = exports.identityProjection;
    this.fromLonLat_ = exports.identityProjection;
  }
};


/**
 * @param {?} e
 * @private
 */
exports.prototype.handleViewEvent_ = function(e) {
  if (!this.viewUpdateInProgress_) {
    this.readFromView();
  }
};


/**
 * @param {number} heading In radians.
 * @api
 */
exports.prototype.setHeading = function(heading) {
  if (!this.view_) {
    return;
  }

  this.view_.setRotation(heading);
};


/**
 * @return {number|undefined} Heading in radians.
 * @api
 */
exports.prototype.getHeading = function() {
  if (!this.view_) {
    return undefined;
  }
  const rotation = this.view_.getRotation();
  return rotation || 0;
};


/**
 * @param {number} tilt In radians.
 * @api
 */
exports.prototype.setTilt = function(tilt) {
  this.tilt_ = tilt;
  this.updateCamera_();
};


/**
 * @return {number} Tilt in radians.
 * @api
 */
exports.prototype.getTilt = function() {
  return this.tilt_;
};


/**
 * @param {number} distance In meters.
 * @api
 */
exports.prototype.setDistance = function(distance) {
  this.distance_ = distance;
  this.updateCamera_();
  this.updateView();
};


/**
 * @return {number} Distance in meters.
 * @api
 */
exports.prototype.getDistance = function() {
  return this.distance_;
};


/**
 * Shortcut for ol.View.setCenter().
 * @param {!ol.Coordinate} center Same projection as the ol.View.
 * @api
 */
exports.prototype.setCenter = function(center) {
  if (!this.view_) {
    return;
  }
  this.view_.setCenter(center);
};


/**
 * Shortcut for ol.View.getCenter().
 * @return {ol.Coordinate|undefined} Same projection as the ol.View.
 * @api
 */
exports.prototype.getCenter = function() {
  if (!this.view_) {
    return undefined;
  }
  return this.view_.getCenter();
};


/**
 * Sets the position of the camera.
 * @param {!ol.Coordinate} position Same projection as the ol.View.
 * @api
 */
exports.prototype.setPosition = function(position) {
  if (!this.toLonLat_) {
    return;
  }
  const ll = this.toLonLat_(position);
  googAsserts.assert(ll);

  const carto = new Cesium.Cartographic(
      olMath.toRadians(ll[0]),
      olMath.toRadians(ll[1]),
      this.getAltitude());

  this.cam_.setView({
    destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto)
  });
  this.updateView();
};


/**
 * Calculates position under the camera.
 * @return {!ol.Coordinate|undefined} Same projection as the ol.View.
 * @api
 */
exports.prototype.getPosition = function() {
  if (!this.fromLonLat_) {
    return undefined;
  }
  const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.cam_.position);

  const pos = this.fromLonLat_([
    olMath.toDegrees(carto.longitude),
    olMath.toDegrees(carto.latitude)
  ]);
  googAsserts.assert(pos);
  return pos;
};


/**
 * @param {number} altitude In meters.
 * @api
 */
exports.prototype.setAltitude = function(altitude) {
  const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
      this.cam_.position);
  carto.height = altitude;
  this.cam_.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

  this.updateView();
};


/**
 * @return {number} Altitude in meters.
 * @api
 */
exports.prototype.getAltitude = function() {
  const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
      this.cam_.position);

  return carto.height;
};


/**
 * Updates the state of the underlying Cesium.Camera
 * according to the current values of the properties.
 * @private
 */
exports.prototype.updateCamera_ = function() {
  if (!this.view_ || !this.toLonLat_) {
    return;
  }
  const center = this.view_.getCenter();
  if (!center) {
    return;
  }
  const ll = this.toLonLat_(center);
  googAsserts.assert(ll);

  const carto = new Cesium.Cartographic(olMath.toRadians(ll[0]),
      olMath.toRadians(ll[1]));
  if (this.scene_.globe) {
    const height = this.scene_.globe.getHeight(carto);
    carto.height = height || 0;
  }

  const destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

  /** @type {Cesium.optionsOrientation} */
  const orientation = {
    pitch: this.tilt_ - Cesium.Math.PI_OVER_TWO,
    heading: -this.view_.getRotation(),
    roll: undefined
  };
  this.cam_.setView({
    destination,
    orientation
  });

  this.cam_.moveBackward(this.distance_);

  this.checkCameraChange(true);
};


/**
 * Calculates the values of the properties from the current ol.View state.
 * @api
 */
exports.prototype.readFromView = function() {
  if (!this.view_ || !this.toLonLat_) {
    return;
  }
  const center = this.view_.getCenter();
  if (center === undefined || center === null) {
    return;
  }
  const ll = this.toLonLat_(center);
  googAsserts.assert(ll);

  const resolution = this.view_.getResolution();
  this.distance_ = this.calcDistanceForResolution(
      resolution || 0, olMath.toRadians(ll[1]));

  this.updateCamera_();
};


/**
 * Calculates the values of the properties from the current Cesium.Camera state.
 * Modifies the center, resolution and rotation properties of the view.
 * @api
 */
exports.prototype.updateView = function() {
  if (!this.view_ || !this.fromLonLat_) {
    return;
  }
  this.viewUpdateInProgress_ = true;

  // target & distance
  const ellipsoid = Cesium.Ellipsoid.WGS84;
  const scene = this.scene_;
  const target = olcsCore.pickCenterPoint(scene);

  let bestTarget = target;
  if (!bestTarget) {
    //TODO: how to handle this properly ?
    const globe = scene.globe;
    const carto = this.cam_.positionCartographic.clone();
    const height = globe.getHeight(carto);
    carto.height = height || 0;
    bestTarget = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
  }
  this.distance_ = Cesium.Cartesian3.distance(bestTarget, this.cam_.position);
  const bestTargetCartographic = ellipsoid.cartesianToCartographic(bestTarget);
  this.view_.setCenter(this.fromLonLat_([
    olMath.toDegrees(bestTargetCartographic.longitude),
    olMath.toDegrees(bestTargetCartographic.latitude)]));

  // resolution
  this.view_.setResolution(
      this.calcResolutionForDistance(this.distance_,
          bestTargetCartographic ? bestTargetCartographic.latitude : 0));


  /*
   * Since we are positioning the target, the values of heading and tilt
   * need to be calculated _at the target_.
   */
  if (target) {
    const pos = this.cam_.position;

    // normal to the ellipsoid at the target
    const targetNormal = new Cesium.Cartesian3();
    ellipsoid.geocentricSurfaceNormal(target, targetNormal);

    // vector from the target to the camera
    const targetToCamera = new Cesium.Cartesian3();
    Cesium.Cartesian3.subtract(pos, target, targetToCamera);
    Cesium.Cartesian3.normalize(targetToCamera, targetToCamera);


    // HEADING
    const up = this.cam_.up;
    const right = this.cam_.right;
    const normal = new Cesium.Cartesian3(-target.y, target.x, 0); // what is it?
    const heading = Cesium.Cartesian3.angleBetween(right, normal);
    const cross = Cesium.Cartesian3.cross(target, up, new Cesium.Cartesian3());
    const orientation = cross.z;

    this.view_.setRotation((orientation < 0 ? heading : -heading));

    // TILT
    const tiltAngle = Math.acos(
        Cesium.Cartesian3.dot(targetNormal, targetToCamera));
    this.tilt_ = isNaN(tiltAngle) ? 0 : tiltAngle;
  } else {
    // fallback when there is no target
    this.view_.setRotation(this.cam_.heading);
    this.tilt_ = -this.cam_.pitch + Math.PI / 2;
  }

  this.viewUpdateInProgress_ = false;
};


/**
 * Check if the underlying camera state has changed and ensure synchronization.
 * @param {boolean=} opt_dontSync Do not synchronize the view.
 */
exports.prototype.checkCameraChange = function(opt_dontSync) {
  const old = this.lastCameraViewMatrix_;
  const current = this.cam_.viewMatrix;

  if (!old || !Cesium.Matrix4.equalsEpsilon(old, current, 1e-5)) {
    this.lastCameraViewMatrix_ = current.clone();
    if (opt_dontSync !== true) {
      this.updateView();
    }
  }
};


/**
 * calculate the distance between camera and centerpoint based on the resolution and latitude value
 * @param {number} resolution Number of map units per pixel.
 * @param {number} latitude Latitude in radians.
 * @return {number} The calculated distance.
 * @api
 */
exports.prototype.calcDistanceForResolution = function(resolution, latitude) {
  const canvas = this.scene_.canvas;
  const fovy = this.cam_.frustum.fovy; // vertical field of view
  googAsserts.assert(!isNaN(fovy));
  const metersPerUnit = this.view_.getProjection().getMetersPerUnit();

  // number of "map units" visible in 2D (vertically)
  const visibleMapUnits = resolution * canvas.clientHeight;

  // The metersPerUnit does not take latitude into account, but it should
  // be lower with increasing latitude -- we have to compensate.
  // In 3D it is not possible to maintain the resolution at more than one point,
  // so it only makes sense to use the latitude of the "target" point.
  const relativeCircumference = Math.cos(Math.abs(latitude));

  // how many meters should be visible in 3D
  const visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

  // distance required to view the calculated length in meters
  //
  //  fovy/2
  //    |\
  //  x | \
  //    |--\
  // visibleMeters/2
  const requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

  // NOTE: This calculation is not absolutely precise, because metersPerUnit
  // is a great simplification. It does not take ellipsoid/terrain into account.

  return requiredDistance;
};


/**
 * calculate the resolution based on a distance(camera to position) and latitude value
 * @param {number} distance
 * @param {number} latitude
 * @return {number} The calculated resolution.
 * @api
 */
exports.prototype.calcResolutionForDistance = function(distance, latitude) {
  // See the reverse calculation (calcDistanceForResolution) for details
  const canvas = this.scene_.canvas;
  const fovy = this.cam_.frustum.fovy;
  const metersPerUnit = this.view_.getProjection().getMetersPerUnit();

  const visibleMeters = 2 * distance * Math.tan(fovy / 2);
  const relativeCircumference = Math.cos(Math.abs(latitude));
  const visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  const resolution = visibleMapUnits / canvas.clientHeight;

  return resolution;
};


export default exports;
