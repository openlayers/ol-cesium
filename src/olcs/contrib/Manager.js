/**
 * @module olcs.contrib.Manager
 */
import olcsContribLazyLoader from '../contrib/LazyLoader.js';
import OLCesium from '../OLCesium.js';
import olcsCore from '../core.js';
import {toRadians} from '../math.js';
import olObservable from 'ol/Observable.js';


/**
 * @typedef {Object} ManagerOptions
 * @property {import('ol/Map.js').default} map
 * @property {import('ol/extent.js').Extent} [cameraExtentInRadians]
 * @property {string} [cesiumIonDefaultAccessToken]
 */


const Manager = class extends olObservable {
  /**
   * @param {string} cesiumUrl
   * @param {olcsx.contrib.ManagerOptions} options
   * @api
   */
  constructor(cesiumUrl, {map, cameraExtentInRadians, cesiumIonDefaultAccessToken} = {}) {

    super();

    /**
     * @type {string}
     * @private
     */
    this.cesiumUrl_ = cesiumUrl;

    /**
     * @type {ol.Map}
     * @protected
     */
    this.map = map;

    /**
     * @type {ol.Extent}
     * @protected
     */
    this.cameraExtentInRadians = cameraExtentInRadians || null;

    /**
     * @private
     * @type {Cesium.BoundingSphere}
     */
    this.boundingSphere_;

    /**
     * @type {boolean}
     * @private
     */
    this.blockLimiter_ = false;

    /**
     * @type {Promise.<olcs.OLCesium>}
     * @private
     */
    this.promise_;

    /**
     * @type {string}
     * @private
     */
    this.cesiumIonDefaultAccessToken_ = cesiumIonDefaultAccessToken;

    /**
     * @type {olcs.OLCesium}
     * @protected
     */
    this.ol3d;

    /**
     * @const {number} Tilt angle in radians
     * @private
     */
    this.cesiumInitialTilt_ = toRadians(50);

    /**
     * @protected
     * @type {number}
     */
    this.fogDensity = 0.0001;

    /**
     * @protected
     * @type {number}
     */
    this.fogSSEFactor = 25;

    /**
     * Limit the minimum distance to the terrain to 2m.
     * @protected
     * @type {number}
     */
    this.minimumZoomDistance = 2;

    /**
     * Limit the maximum distance to the earth to 10'000km.
     * @protected
     * @type {number}
     */
    this.maximumZoomDistance = 10000000;

    // when closer to 3000m, restrict the available positions harder
    /**
     * @protected
     * @param {number} height
     */
    this.limitCameraToBoundingSphereRatio = height => (height > 3000 ? 9 : 3);
  }


  /**
   * @return {Promise.<olcs.OLCesium>}
   */
  load() {
    if (!this.promise_) {
      const cesiumLazyLoader = new olcsContribLazyLoader(this.cesiumUrl_);
      this.promise_ = cesiumLazyLoader.load().then(() => this.onCesiumLoaded());
    }
    return this.promise_;
  }


  /**
   * @protected
   * @return {olcs.OLCesium}
   */
  onCesiumLoaded() {
    if (this.cameraExtentInRadians) {
      const rect = new Cesium.Rectangle(...this.cameraExtentInRadians);
      // Set the fly home rectangle
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rect;
      this.boundingSphere_ = Cesium.BoundingSphere.fromRectangle3D(rect, Cesium.Ellipsoid.WGS84, 300); // lux mean height is 300m
    }

    if (this.cesiumIonDefaultAccessToken_) {
      Cesium.Ion.defaultAccessToken = this.cesiumIonDefaultAccessToken_;
    }

    this.ol3d = this.instantiateOLCesium();
    const scene = this.ol3d.getCesiumScene();
    this.configureForUsability(scene);
    this.configureForPerformance(scene);
    this.dispatchEvent('load');
    return this.ol3d;
  }


  /**
   * Application code should override this method.
   * @return {olcs.OLCesium}
   */
  instantiateOLCesium() {
    console.assert(this.map);
    const ol3d = new OLCesium({map: this.map});
    const scene = ol3d.getCesiumScene();
    const terrainProvider = Cesium.createWorldTerrain();
    scene.terrainProvider = terrainProvider;
    return ol3d;
  }


  /**
   * @param {!Cesium.Scene} scene The scene, passed as parameter for convenience.
   * @protected
   */
  configureForPerformance(scene) {
    const fog = scene.fog;
    fog.enabled = true;
    fog.density = this.fogDensity;
    fog.screenSpaceErrorFactor = this.fogSSEFactor;
  }


  /**
   * @param {!Cesium.Scene} scene The scene, passed as parameter for convenience.
   * @protected
   */
  configureForUsability(scene) {
    const sscController = scene.screenSpaceCameraController;
    sscController.minimumZoomDistance = this.minimumZoomDistance;
    sscController.maximumZoomDistance = this.maximumZoomDistance;

    // Do not see through the terrain. Seeing through the terrain does not make
    // sense anyway, except for debugging
    scene.globe.depthTestAgainstTerrain = true;

    // Use white instead of the black default colour for the globe when tiles are missing
    scene.globe.baseColor = Cesium.Color.WHITE;
    scene.backgroundColor = Cesium.Color.WHITE;

    if (this.boundingSphere_) {
      scene.postRender.addEventListener(this.limitCameraToBoundingSphere.bind(this), scene);
    }
    // Stop rendering Cesium when there is nothing to do. This drastically reduces CPU/GPU consumption.
    this.ol3d.enableAutoRenderLoop();
  }


  /**
   * Constrain the camera so that it stays close to the bounding sphere of the map extent.
   * Near the ground the allowed distance is shorter.
   * @protected
   */
  limitCameraToBoundingSphere() {
    if (this.boundingSphere_ && !this.blockLimiter_) {
      const scene = this.ol3d.getCesiumScene();
      const camera = scene.camera;
      const position = camera.position;
      const carto = Cesium.Cartographic.fromCartesian(position);
      const ratio = this.limitCameraToBoundingSphereRatio(carto.height);
      if (Cesium.Cartesian3.distance(this.boundingSphere_.center, position) > this.boundingSphere_.radius * ratio) {
        const currentlyFlying = camera.flying;
        if (currentlyFlying === true) {
          // There is a flying property and its value is true
          return;
        } else {
          this.blockLimiter_ = true;
          const unblockLimiter = () => this.blockLimiter_ = false;
          camera.flyToBoundingSphere(this.boundingSphere_, {
            complete: unblockLimiter,
            cancel: unblockLimiter
          });
        }
      }
    }
  }


  /**
   * Enable or disable ol3d with a default animation.
   * @export
   * @return {Promise<undefined>}
   */
  toggle3d() {
    return this.load().then((/** @const {!olcs.OLCesium} */ ol3d) => {
      const is3DCurrentlyEnabled = ol3d.getEnabled();
      const scene = ol3d.getCesiumScene();
      if (is3DCurrentlyEnabled) {
        // Disable 3D
        console.assert(this.map);
        return olcsCore.resetToNorthZenith(this.map, scene).then(() => {
          ol3d.setEnabled(false);
          this.dispatchEvent('toggle');
        });
      } else {
        // Enable 3D
        ol3d.setEnabled(true);
        this.dispatchEvent('toggle');
        return olcsCore.rotateAroundBottomCenter(scene, this.cesiumInitialTilt_);
      }
    });
  }


  /**
   * Enable ol3d with a view built from parameters.
   *
   * @export
   * @param {number} lon
   * @param {number} lat
   * @param {number} elevation
   * @param {number} headingDeg Heading value in degrees.
   * @param {number} pitchDeg Pitch value in degrees.
   * @returns {Promise<undefined>}
   */
  set3dWithView(lon, lat, elevation, headingDeg, pitchDeg) {
    return this.load().then((/** @const {!olcs.OLCesium} */ ol3d) => {
      const is3DCurrentlyEnabled = ol3d.getEnabled();
      const scene = ol3d.getCesiumScene();
      const camera = scene.camera;
      const destination = Cesium.Cartesian3.fromDegrees(lon, lat, elevation);
      const heading = Cesium.Math.toRadians(headingDeg);
      const pitch = Cesium.Math.toRadians(pitchDeg);
      const roll = 0;
      const orientation = {heading, pitch, roll};

      if (!is3DCurrentlyEnabled) {
        ol3d.setEnabled(true);
        this.dispatchEvent('toggle');
      }

      camera.setView({
        destination,
        orientation
      });
    });
  }


  /**
   * @export
   * @return {boolean}
   */
  is3dEnabled() {
    return !!this.ol3d && this.ol3d.getEnabled();
  }


  /**
   * @return {number}
   */
  getHeading() {
    return this.map ? this.map.getView().getRotation() || 0 : 0;
  }


  /**
   * @return {number|undefined}
   */
  getTiltOnGlobe() {
    const scene = this.ol3d.getCesiumScene();
    const tiltOnGlobe = olcsCore.computeSignedTiltAngleOnGlobe(scene);
    return -tiltOnGlobe;
  }


  /**
   * @param {number} angle
   */
  setHeading(angle) {
    const scene = this.ol3d.getCesiumScene();
    const bottom = olcsCore.pickBottomPoint(scene);
    if (bottom) {
      olcsCore.setHeadingUsingBottomCenter(scene, angle, bottom);
    }
  }

  /**
   * @export
   * @return {olcs.OLCesium}
   */
  getOl3d() {
    return this.ol3d;
  }

  /**
   * @export
   * @return {!ol.View}
   */
  getOlView() {
    const view = this.map.getView();
    console.assert(view);
    return view;
  }

  /**
   * @export
   * @return {Cesium.Matrix4}
   */
  getCesiumViewMatrix() {
    return this.ol3d.getCesiumScene().camera.viewMatrix;
  }

  /**
   * @export
   * @return {!Cesium.Scene}
   */
  getCesiumScene() {
    return this.ol3d.getCesiumScene();
  }

  /**
   * @export
   * @param {!Cesium.Rectangle} rectangle
   * @param {number=} offset in meters
   * @return {Promise<undefined>}
   */
  flyToRectangle(rectangle, offset = 0) {
    const camera = this.getCesiumScene().camera;
    const destination = camera.getRectangleCameraCoordinates(rectangle);

    const mag = Cesium.Cartesian3.magnitude(destination) + offset;
    Cesium.Cartesian3.normalize(destination, destination);
    Cesium.Cartesian3.multiplyByScalar(destination, mag, destination);

    return new Promise((resolve, reject) => {
      if (!this.cameraExtentInRadians) {
        reject();
        return;
      }

      camera.flyTo({
        destination,
        complete: () => resolve(),
        cancel: () => reject(),
        endTransform: Cesium.Matrix4.IDENTITY
      });
    });
  }

  /**
   * @protected
   * @return {Cesium.Rectangle|undefined}
   */
  getCameraExtentRectangle() {
    if (this.cameraExtentInRadians) {
      return new Cesium.Rectangle(...this.cameraExtentInRadians);
    }
  }
};


export default Manager;
