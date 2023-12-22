import olcsContribLazyLoader from './LazyLoader';
import OLCesium from '../OLCesium';
import {resetToNorthZenith, rotateAroundBottomCenter, computeSignedTiltAngleOnGlobe, pickBottomPoint, setHeadingUsingBottomCenter, limitCameraToBoundingSphere} from '../core';
import {toRadians} from '../math';
import Observable from 'ol/Observable.js';
import type OLMap from 'ol/Map.js';
import type {Extent} from 'ol/extent.js';
import type {BoundingSphere, Matrix4, Rectangle, Scene} from 'cesium';


/**
 * @typedef {Object} ManagerOptions
 * @property {import('ol/Map.js').default} map
 * @property {import('ol/extent.js').Extent} [cameraExtentInRadians]
 * @property {string} [cesiumIonDefaultAccessToken]
 */


export default class Manager extends Observable {
  private cesiumUrl_: string;
  private boundingSphere_: BoundingSphere;
  private promise_: Promise<OLCesium>;
  private cesiumIonDefaultAccessToken_: string;
  protected map: OLMap;
  protected cameraExtentInRadians: Extent;
  protected ol3d: OLCesium;
  private cesiumInitialTilt_ = toRadians(50);

  protected fogDensity = 0.0001;

  protected fogSSEFactor = 25;

  protected minimumZoomDistance = 2;

  /**
   * Limit the maximum distance to the earth to 10'000km.
   */
  protected maximumZoomDistance: number = 10000000;

  // when closer to 3000m, restrict the available positions harder
  protected limitCameraToBoundingSphereRatio = (height: number) => (height > 3000 ? 9 : 3);

  /**
   * @param {string} cesiumUrl
   * @param {olcsx.contrib.ManagerOptions} options
   * @api
   */
  constructor(cesiumUrl: string, {map, cameraExtentInRadians, cesiumIonDefaultAccessToken}: {map: OLMap, cameraExtentInRadians?: Extent, cesiumIonDefaultAccessToken?: string}) {
    super();
    this.cesiumUrl_ = cesiumUrl;
    console.assert(map);
    this.map = map;
    this.cameraExtentInRadians = cameraExtentInRadians || null;
    this.cesiumIonDefaultAccessToken_ = cesiumIonDefaultAccessToken;
  }


  /**
   * Lazy load Cesium.
   */
  load(): Promise<OLCesium> {
    if (!this.promise_) {
      const cesiumLazyLoader = new olcsContribLazyLoader(this.cesiumUrl_);
      this.promise_ = cesiumLazyLoader.load().then(() => this.onCesiumLoaded());
    }
    return this.promise_;
  }


  /**
   * Hook called when Cesium has been lazy loaded.
   */
  protected onCesiumLoaded(): OLCesium {
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
   */
  instantiateOLCesium(): OLCesium {
    const ol3d = new OLCesium({map: this.map});
    const scene = ol3d.getCesiumScene();
    // LEGACY
    if ('createWorldTerrain' in Cesium) {
      // @ts-ignore
      const terrainProvider = Cesium.createWorldTerrain();
      scene.terrainProvider = terrainProvider;
    } else {
      // v107+
      Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
    }

    return ol3d;
  }


  /**
   * Override with custom performance optimization logics, if needed.
   */
  protected configureForPerformance(scene: Scene) {
    const fog = scene.fog;
    fog.enabled = true;
    fog.density = this.fogDensity;
    fog.screenSpaceErrorFactor = this.fogSSEFactor;
  }


  /**
   * Override with custom usabliity logics, id needed.
   */
  configureForUsability(scene: Scene) {
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
      scene.postRender.addEventListener(this.limitCameraToBoundingSphere.bind(this));
    }
    // Stop rendering Cesium when there is nothing to do. This drastically reduces CPU/GPU consumption.
    this.ol3d.enableAutoRenderLoop();
  }

  /**
   * Constrain the camera so that it stays close to the bounding sphere of the map extent.
   * Near the ground the allowed distance is shorter.
   */
  protected limitCameraToBoundingSphere() {
    const scene = this.ol3d.getCesiumScene();
    limitCameraToBoundingSphere(scene.camera, this.boundingSphere_, this.limitCameraToBoundingSphereRatio);
  }

  /**
   * Enable or disable ol3d with a default animation.
   */
  toggle3d(): Promise<void> {
    return this.load().then((/** @const {!olcs.OLCesium} */ ol3d) => {
      const is3DCurrentlyEnabled = ol3d.getEnabled();
      const scene = ol3d.getCesiumScene();
      if (is3DCurrentlyEnabled) {
        // Disable 3D
        console.assert(this.map);
        return resetToNorthZenith(this.map, scene).then(() => {
          ol3d.setEnabled(false);
          this.dispatchEvent('toggle');
        });
      } else {
        // Enable 3D
        ol3d.setEnabled(true);
        this.dispatchEvent('toggle');
        return rotateAroundBottomCenter(scene, this.cesiumInitialTilt_);
      }
    });
  }


  /**
   * Enable ol3d with a view built from parameters.
   */
  set3dWithView(lon: number, lat: number, elevation: number, headingDeg: number, pitchDeg: number): Promise<void> {
    return this.load().then((ol3d) => {
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
   * Whether OL-Cesium has been loaded and 3D mode is enabled.
   */
  is3dEnabled(): boolean {
    return !!this.ol3d && this.ol3d.getEnabled();
  }


  /**
   * @return {number}
   */
  getHeading(): number {
    return this.map ? this.map.getView().getRotation() || 0 : 0;
  }


  /**
   * @return {number|undefined}
   */
  getTiltOnGlobe() {
    const scene = this.ol3d.getCesiumScene();
    const tiltOnGlobe = computeSignedTiltAngleOnGlobe(scene);
    return -tiltOnGlobe;
  }


  /**
   * Set heading.
   * This assumes ol3d has been loaded.
   */
  setHeading(angle: number) {
    const scene = this.ol3d.getCesiumScene();
    const bottom = pickBottomPoint(scene);
    if (bottom) {
      setHeadingUsingBottomCenter(scene, angle, bottom);
    }
  }

  getOl3d(): OLCesium {
    return this.ol3d;
  }

  getCesiumViewMatrix(): Matrix4 {
    return this.ol3d.getCesiumScene().camera.viewMatrix;
  }

  getCesiumScene(): Scene {
    return this.ol3d.getCesiumScene();
  }

  /**
   * Fly to some rectangle.
   * This assumes ol3d has been loaded.
   */
  flyToRectangle(rectangle: Rectangle, offset = 0): Promise<void> {
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
}
