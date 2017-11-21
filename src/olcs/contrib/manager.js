goog.provide('olcs.contrib.Manager');

goog.require('olcs.contrib.LazyLoader');
goog.require('olcs.OLCesium');
goog.require('olcs.core');

goog.require('ol.math');
goog.require('goog.asserts');


olcs.contrib.Manager = class {
  /**
   * @param {string} cesiumUrl
   * @param {{map: ol.Map, cameraExtentInRadians: (ol.Extent|undefined)}} options
   * @api
   */
  constructor(cesiumUrl, {map, cameraExtentInRadians} = {}) {

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
     * @type {olcs.OLCesium}
     * @protected
     */
    this.ol3d;


    /**
     * @const {number} Tilt angle in radians
     * @private
     */
    this.cesiumInitialTilt_ = ol.math.toRadians(50);

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
      const cesiumLazyLoader = new olcs.contrib.LazyLoader(this.cesiumUrl_);
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

    this.ol3d = this.instantiateOLCesium();
    const scene = this.ol3d.getCesiumScene();
    this.configureForUsability(scene);
    this.configureForPerformance(scene);
    return this.ol3d;
  }


  /**
   * Application code should override this method.
   * @return {olcs.OLCesium}
   */
  instantiateOLCesium() {
    goog.asserts.assert(this.map);
    const ol3d = new olcs.OLCesium({map: this.map});
    const scene = ol3d.getCesiumScene();
    const terrainProvider = new Cesium.CesiumTerrainProvider({
      url: '//assets.agi.com/stk-terrain/world'
    });
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
   * @api
   * @return {Promise<undefined>}
   */
  toggle3d() {
    return this.load().then((/** @const {!olcs.OLCesium} */ ol3d) => {
      const is3DCurrentlyEnabled = ol3d.getEnabled();
      const scene = ol3d.getCesiumScene();
      if (is3DCurrentlyEnabled) {
        // Disable 3D
        goog.asserts.assert(this.map);
        return olcs.core.resetToNorthZenith(this.map, scene).then(() => {
          ol3d.setEnabled(false);
        });
      } else {
        // Enable 3D
        ol3d.setEnabled(true);
        return olcs.core.rotateAroundBottomCenter(scene, this.cesiumInitialTilt_);
      }
    });
  }


  /**
   * @api
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
    const tiltOnGlobe = olcs.core.computeSignedTiltAngleOnGlobe(scene);
    return -tiltOnGlobe;
  }


  /**
   * @param {number} angle
   */
  setHeading(angle) {
    const scene = this.ol3d.getCesiumScene();
    const bottom = olcs.core.pickBottomPoint(scene);
    if (bottom) {
      olcs.core.setHeadingUsingBottomCenter(scene, angle, bottom);
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
    goog.asserts.assert(view);
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
