goog.provide('olcs.contrib.Manager');

goog.require('olcs.contrib.LazyLoader');
goog.require('olcs.OLCesium');
goog.require('olcs.core');

goog.require('ol.extent');
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
     * @private
     */
    this.cameraExtentInRadians_ = cameraExtentInRadians || null;

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
    fog.density = this.fogDensity;
    fog.screenSpaceErrorFactor = this.fogSSEFactor;
  }


  /**
   * @param {!Cesium.Scene} scene The scene, passed as parameter for convenience.
   * @protected
   */
  configureForUsability(scene) {
    if (this.cameraExtentInRadians_) {
      // Set the fly home rectangle
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = new Cesium.Rectangle(...this.cameraExtentInRadians_);
    }

    const sscController = scene.screenSpaceCameraController;
    sscController.minimumZoomDistance = this.minimumZoomDistance;
    sscController.maximumZoomDistance = this.maximumZoomDistance;

    // Do not see through the terrain. Seeing through the terrain does not make
    // sense anyway, except for debugging
    scene.globe.depthTestAgainstTerrain = true;

    if (this.cameraExtentInRadians_) {
      scene.postRender.addEventListener(this.limitCameraToExtent.bind(this), scene);
    }

    // Stop rendering Cesium when there is nothing to do. This drastically reduces CPU/GPU consumption.
    this.ol3d.enableAutoRenderLoop();
  }


  /**
   * Constrain the camera so that it stays in a 3D volume above a map extent.
   * Near the ground the extent is small. Far from the ground the extent is larger.
   * @protected
   */
  limitCameraToExtent() {
    const scene = this.ol3d.getCesiumScene();
    const camera = scene.camera;
    const extent = this.cameraExtentInRadians_;
    const pos = camera.positionCartographic.clone();
    const inside = ol.extent.containsXY(extent, pos.longitude, pos.latitude);
    if (!inside) {
      // add a padding based on the camera height
      const padding = Math.max(0, pos.height * this.cameraPaddingRatio);
      let lon = pos.longitude;
      let lat = pos.latitude;
      lon = Math.max(extent[0] - padding, lon);
      lat = Math.max(extent[1] - padding, lat);
      lon = Math.min(extent[2] + padding, lon);
      lat = Math.min(extent[3] + padding, lat);
      if (lon !== pos.longitude || lat !== pos.latitude) {
        pos.longitude = lon;
        pos.latitude = lat;
        camera.setView({
          destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(pos),
          orientation: {
            heading: camera.heading,
            pitch: camera.pitch
          },
          duration: this.flyCameraConstraintDuration,
          endTransform: Cesium.Matrix4.IDENTITY
        });
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
};
