goog.provide('olcs.contrib.Manager');

goog.require('olcs.contrib.LazyLoader');
goog.require('olcs.OLCesium');

goog.require('ol.extent');
goog.require('goog.asserts');


olcs.contrib.Manager = class {
  /**
   * @param {string} cesiumUrl
   * @param {{map: ol.Map, cameraExtentInRadians: ol.Extent}} options
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
    this.cameraExtentInRadians_ = cameraExtentInRadians;

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
    this.configureForUsability();
    this.configureForPerformance();
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
   * @protected
   */
  configureForPerformance() {
    const scene = this.ol3d.getCesiumScene();
    const fog = scene.fog;
    fog.density = 0.0001;
    fog.screenSpaceErrorFactor = 25;
  }


  /**
   * @protected
   */
  configureForUsability() {
    const scene = this.ol3d.getCesiumScene();
    const sscController = scene.screenSpaceCameraController;

    // To avoid going under the terrain, limit the minimum distance to 30m
    sscController.minimumZoomDistance = 30;

    // To avoid getting lost in space, limit the maximum distance to 10'000km
    sscController.maximumZoomDistance = 10000000;

    // Disable seeing through the terrain. Seeing through the terrain does not make
    // sense anyway, except for debugging
    scene.globe.depthTestAgainstTerrain = true;

    if (this.cameraExtentInRadians_) {
      scene.postRender.addEventListener(this.limitCameraToExtent.bind(this), scene);
    }
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
      const padding = Math.max(0, pos.height * 0.05 / 500000);
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
          }
        });
      }
    }
  }


  /**
   * Enable or disable ol3d with a default animation.
   * @api
   */
  toggle3D() {
    this.load().then((ol3d) => {
      ol3d.setEnabled(!ol3d.getEnabled());
    });
  }


  /**
   * @api
   * @return {boolean}
   */
  is3dEnabled() {
    return !!this.ol3d && this.ol3d.getEnabled();
  }
};
