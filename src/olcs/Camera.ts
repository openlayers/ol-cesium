import {unByKey as olObservableUnByKey} from 'ol/Observable.js';
import {toRadians, toDegrees} from './math';
import {getTransform} from 'ol/proj.js';
import {pickCenterPoint, calcDistanceForResolution, calcResolutionForDistance} from './core';
import type {Map, View} from 'ol';
import type {Scene, Camera as CesiumCamera, Matrix4, HeadingPitchRollValues} from 'cesium';
import type {EventsKey} from 'ol/events.js';

/**
 * @param input Input coordinate array.
 * @param opt_output Output array of coordinate values.
 * @param opt_dimension Dimension.
 * @return Input coordinate array (same array as input).
 */
export function identityProjection(input: number[], opt_output?: number[], opt_dimension?: number): number[] {
  const dim = opt_dimension || input.length;
  if (opt_output) {
    for (let i = 0; i < dim; ++i) {
      opt_output[i] = input[i];
    }
  }
  return input;
}

export default class Camera {
  private scene_: Scene;
  private cam_: CesiumCamera;
  private map_: Map;
  private view_: View;

  private viewListenKey_: EventsKey = null;

  private toLonLat_ = identityProjection;
  private fromLonLat_ = identityProjection;

  /**
   * 0 -- topdown, PI/2 -- the horizon
   */
  private tilt_: number = 0;
  private distance_ = 0;
  private lastCameraViewMatrix_: Matrix4 = null;

  /**
   * This is used to discard change events on view caused by updateView method.
   */
  private viewUpdateInProgress_ = false;

  /**
   * This object takes care of additional 3d-specific properties of the view and
   * ensures proper synchronization with the underlying raw Cesium.Camera object.
   */
  constructor(scene: Scene, map: Map) {
    this.scene_ = scene;
    this.cam_ = scene.camera;
    this.map_ = map;
    this.map_.on('change:view', (e) => {
      this.setView_(this.map_.getView());
    });
    this.setView_(this.map_.getView());
  }

  destroy() {
    olObservableUnByKey(this.viewListenKey_);
    this.viewListenKey_ = null;
  }

  /**
   * @param {?ol.View} view New view to use.
   * @private
   */
  setView_(view: View | undefined) {
    if (this.view_) {
      olObservableUnByKey(this.viewListenKey_);
      this.viewListenKey_ = null;
    }

    this.view_ = view;
    if (view) {
      const toLonLat = getTransform(view.getProjection(), 'EPSG:4326');
      const fromLonLat = getTransform('EPSG:4326', view.getProjection());
      console.assert(toLonLat && fromLonLat);

      this.toLonLat_ = toLonLat;
      this.fromLonLat_ = fromLonLat;

      this.viewListenKey_ = view.on('propertychange', e => this.handleViewChangedEvent_());

      this.readFromView();
    } else {
      this.toLonLat_ = identityProjection;
      this.fromLonLat_ = identityProjection;
    }
  }

  private handleViewChangedEvent_() {
    if (!this.viewUpdateInProgress_) {
      this.readFromView();
    }
  }

  /**
   * @deprecated
   * @param heading In radians.
   */
  setHeading(heading: number) {
    if (!this.view_) {
      return;
    }

    this.view_.setRotation(heading);
  }

  /**
   * @deprecated
   * @return Heading in radians.
   */
  getHeading(): number|undefined {
    if (!this.view_) {
      return undefined;
    }
    const rotation = this.view_.getRotation();
    return rotation || 0;
  }

  /**
   * @param tilt In radians.
   */
  setTilt(tilt: number) {
    this.tilt_ = tilt;
    this.updateCamera_();
  }

  /**
   * @return Tilt in radians.
   */
  getTilt(): number {
    return this.tilt_;
  }

  /**
   * @param distance In meters.
   */
  setDistance(distance: number) {
    this.distance_ = distance;
    this.updateCamera_();
    this.updateView();
  }

  /**
   * @return Distance in meters.
   */
  getDistance(): number {
    return this.distance_;
  }

  /**
   * @deprecated
   * Shortcut for ol.View.setCenter().
   * @param center Same projection as the ol.View.
   */
  setCenter(center: number[]) {
    if (!this.view_) {
      return;
    }
    this.view_.setCenter(center);
  }

  /**
   * @deprecated
   * Shortcut for ol.View.getCenter().
   * @return {ol.Coordinate|undefined} Same projection as the ol.View.
   * @api
   */
  getCenter() {
    if (!this.view_) {
      return undefined;
    }
    return this.view_.getCenter();
  }

  /**
   * Sets the position of the camera.
   * @param position Same projection as the ol.View.
   */
  setPosition(position: number[]) {
    if (!this.toLonLat_) {
      return;
    }
    const ll = this.toLonLat_(position);
    console.assert(ll);

    const carto = new Cesium.Cartographic(
        toRadians(ll[0]),
        toRadians(ll[1]),
        this.getAltitude());

    this.cam_.setView({
      destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto)
    });
    this.updateView();
  }

  /**
   * Calculates position under the camera.
   * @return Coordinates in same projection as the ol.View.
   * @api
   */
  getPosition(): number[] | undefined {
    if (!this.fromLonLat_) {
      return undefined;
    }
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.cam_.position);

    const pos = this.fromLonLat_([
      toDegrees(carto.longitude),
      toDegrees(carto.latitude)
    ]);
    console.assert(pos);
    return pos;
  }

  /**
   * @param altitude In meters.
   */
  setAltitude(altitude: number) {
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
        this.cam_.position);
    carto.height = altitude;
    this.cam_.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

    this.updateView();
  }

  /**
   * @return Altitude in meters.
   */
  getAltitude(): number {
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
        this.cam_.position);

    return carto.height;
  }

  /**
   * Updates the state of the underlying Cesium.Camera
   * according to the current values of the properties.
   */
  private updateCamera_() {
    if (!this.view_ || !this.toLonLat_) {
      return;
    }
    const center = this.view_.getCenter();
    if (!center) {
      return;
    }
    const ll = this.toLonLat_(center);
    console.assert(ll);

    const carto = new Cesium.Cartographic(toRadians(ll[0]),
        toRadians(ll[1]));
    if (this.scene_.globe) {
      const height = this.scene_.globe.getHeight(carto);
      carto.height = height || 0;
    }

    const destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

    const orientation: HeadingPitchRollValues = {
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
  }

  /**
   * Calculates the values of the properties from the current ol.View state.
   */
  readFromView() {
    if (!this.view_ || !this.toLonLat_) {
      return;
    }
    const center = this.view_.getCenter();
    if (center === undefined || center === null) {
      return;
    }
    const ll = this.toLonLat_(center);
    console.assert(ll);

    const resolution = this.view_.getResolution();
    this.distance_ = this.calcDistanceForResolution(
        resolution || 0, toRadians(ll[1]));

    this.updateCamera_();
  }

  /**
   * Calculates the values of the properties from the current Cesium.Camera state.
   * Modifies the center, resolution and rotation properties of the view.
   */
  updateView() {
    if (!this.view_ || !this.fromLonLat_) {
      return;
    }
    this.viewUpdateInProgress_ = true;

    // target & distance
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    const scene = this.scene_;
    const target = pickCenterPoint(scene);

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
      toDegrees(bestTargetCartographic.longitude),
      toDegrees(bestTargetCartographic.latitude)]));

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
  }

  /**
   * Check if the underlying camera state has changed and ensure synchronization.
   * @param opt_dontSync Do not synchronize the view.
   */
  checkCameraChange(opt_dontSync?: boolean) {
    const old = this.lastCameraViewMatrix_;
    const current = this.cam_.viewMatrix;

    if (!old || !Cesium.Matrix4.equalsEpsilon(old, current, 1e-7)) {
      this.lastCameraViewMatrix_ = current.clone();
      if (opt_dontSync !== true) {
        this.updateView();
      }
    }
  }

  /**
   * calculate the distance between camera and centerpoint based on the resolution and latitude value
   * @param resolution Number of map units per pixel.
   * @param latitude Latitude in radians.
   * @return The calculated distance.
   */
  calcDistanceForResolution(resolution: number, latitude: number): number {
    return calcDistanceForResolution(resolution, latitude, this.scene_, this.view_.getProjection());
  }

  /**
   * calculate the resolution based on a distance(camera to position) and latitude value
   * @param distance
   * @param latitude
   * @return} The calculated resolution.
   */
  calcResolutionForDistance(distance: number, latitude: number): number {
    return calcResolutionForDistance(distance, latitude, this.scene_, this.view_.getProjection());
  }
}
