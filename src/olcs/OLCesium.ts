import olGeomPoint from 'ol/geom/Point.js';
import {supportsImageRenderingPixelated, imageRenderingValue} from './util';
import {ol4326CoordinateToCesiumCartesian} from './core';
import {getTransform, type TransformFunction} from 'ol/proj.js';
import olcsAutoRenderLoop from './AutoRenderLoop';
import olcsCamera from './Camera';
import olcsRasterSynchronizer from './RasterSynchronizer';
import olcsVectorSynchronizer from './VectorSynchronizer';
import olcsOverlaySynchronizer from './OverlaySynchronizer';
import type Map from 'ol/Map.js';
import type Interaction from 'ol/interaction/Interaction.js';
import type {Group} from 'ol/layer.js';
import type Feature from 'ol/Feature.js';
import type View from 'ol/View.js';
import type {
  BoundingSphere, ContextOptions,
  DataSourceCollection,
  DataSourceDisplay,
  Entity,
  EntityView,
  Globe,
  JulianDate, MapMode2D, MapProjection, PerspectiveFrustum,
  Scene,
  ImageryLayer
} from 'cesium';
import type AbstractSynchronizer from './AbstractSynchronizer';
import type VectorLayerCounterpart from './core/VectorLayerCounterpart';

/**
 * Moved from Cesium
 * The state of a BoundingSphere computation being performed by a {@link Visualizer}.
 */
const BoundingSphereState: Record<string, number> = {
  /**
   * The BoundingSphere has been computed.
   */
  DONE: 0,
  /**
   * The BoundingSphere is still being computed.
   */
  PENDING: 1,
  /**
   * The BoundingSphere does not exist.
   */
  FAILED: 2,
};

type SceneOptions = {
  canvas: HTMLCanvasElement;
  contextOptions?: ContextOptions;
  creditContainer?: Element;
  creditViewport?: Element;
  mapProjection?: MapProjection;
  orderIndependentTranslucency?: boolean;
  scene3DOnly?: boolean;
  shadows?: boolean;
  mapMode2D?: MapMode2D;
  requestRenderMode?: boolean;
  maximumRenderTimeChange?: number;
  depthPlaneEllipsoidOffset?: number;
  msaaSamples?: number;
}

type OLCesiumOptions = {
  map: Map,
  time?: () => JulianDate,
  target?: Element | string,
  createSynchronizers?: (map: Map, scene: Scene, dataSourceCollection: DataSourceCollection) => AbstractSynchronizer<ImageryLayer | VectorLayerCounterpart>[],
  stopOpenLayersEventsPropagation?: boolean,
  sceneOptions?: SceneOptions
}

// FIXME: remove this when all the synchronizers are migrated to typescript.
type SynchronizerType = AbstractSynchronizer<ImageryLayer | VectorLayerCounterpart>;

/**
 * @typedef {Object} OLCesiumOptions
 * @property {import('ol/Map.js').default} map The OpenLayers map we want to show on a Cesium scene.
 * @property {Element|string} [target] Target element for the Cesium scene.
 * @property {function(!import('ol/Map.js').default, !Cesium.Scene, !Cesium.DataSourceCollection): Array<import('olcs/AbstractSynchronizer.js').default>}
 *      [createSynchronizers] Callback function which will be called by the {@link olcs.OLCesium}
 *      constructor to create custom synchronizers. Receives an `ol.Map` and a `Cesium.Scene` as arguments,
 *      and needs to return an array of {@link import('olcs/AbstractSynchronizer.js').default}.
 * @property {function(): Cesium.JulianDate} [time] Control the current time used by Cesium.
 * @property {boolean} [stopOpenLayersEventsPropagation] Prevent propagation of mouse/touch events to
 *      OpenLayers when Cesium is active.
 * @property {Cesium.SceneOptions} [sceneOptions] Allows the passing of property value to the
 *      `Cesium.Scene`.
 */
export default class OLCesium {
  private autoRenderLoop_: olcsAutoRenderLoop | null = null;
  private map_: Map;
  private time_: () => JulianDate;
  private to4326Transform_: TransformFunction;
  private resolutionScale_ = 1.0;
  private canvasClientWidth_ = 0.0;
  private canvasClientHeight_ = 0.0;
  private resolutionScaleChanged_ = true; // force resize
  private container_: HTMLElement;
  private isOverMap_: boolean;
  private canvas_: HTMLCanvasElement;
  private enabled_ = false;
  private pausedInteractions_: Interaction[] = [];
  private hiddenRootGroup_: Group | null = null;
  private scene_: Scene;
  private camera_: olcsCamera;
  private globe_: Globe;
  private dataSourceCollection_: DataSourceCollection;
  private dataSourceDisplay_: DataSourceDisplay;
  /** Time of the last rendered frame, as returned by `performance.now()`. */
  private lastFrameTime_ = 0;
  /** The identifier returned by `requestAnimationFrame`. */
  private renderId_: number | undefined;
  /** Target frame rate for the render loop.  */
  private targetFrameRate_ = Number.POSITIVE_INFINITY;
  /** If the Cesium render loop is being blocked. */
  private blockCesiumRendering_ = false;
  /** If the warmup routine is active. */
  private warmingUp_ = false;
  private trackedFeature_: Feature | null = null;
  private trackedEntity_: Entity | null = null;
  private entityView_: EntityView | null = null;
  private needTrackedEntityUpdate_ = false;
  private boundingSphereScratch_: BoundingSphere = new Cesium.BoundingSphere();
  private synchronizers_: SynchronizerType[];

  constructor(options: OLCesiumOptions) {
    this.map_ = options.map;

    this.time_ = options.time || function() {
      return Cesium.JulianDate.now();
    };

    /**
     * No change of the view projection.
     */
    this.to4326Transform_ = getTransform(this.map_.getView().getProjection(), 'EPSG:4326');

    const fillArea = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;';
    this.container_ = document.createElement('DIV');
    const containerAttribute = document.createAttribute('style');
    containerAttribute.value = `${fillArea}visibility:hidden;`;
    this.container_.setAttributeNode(containerAttribute);

    let targetElement = options.target || this.map_.getViewport();
    if (typeof targetElement === 'string') {
      targetElement = document.getElementById(targetElement);
    }
    targetElement.appendChild(this.container_);

    /**
     * Whether the Cesium container is placed over the ol map.
     * a target => side by side mode
     * no target => over map mode
     */
    this.isOverMap_ = !options.target;


    if (this.isOverMap_ && options.stopOpenLayersEventsPropagation) {
      const overlayEvents = ['click', 'dblclick', 'mousedown', 'touchstart', 'pointerdown', 'mousewheel', 'wheel'];
      for (let i = 0, ii = overlayEvents.length; i < ii; ++i) {
        this.container_.addEventListener(overlayEvents[i], evt => evt.stopPropagation());
      }
    }

    this.canvas_ = document.createElement<'canvas'>('canvas');
    const canvasAttribute = document.createAttribute('style');
    canvasAttribute.value = fillArea;
    this.canvas_.setAttributeNode(canvasAttribute);

    if (supportsImageRenderingPixelated()) {
      // non standard CSS4
      this.canvas_.style['imageRendering'] = imageRenderingValue();
    }

    this.canvas_.oncontextmenu = function() {
      return false;
    };
    this.canvas_.onselectstart = function() {
      return false;
    };

    this.container_.appendChild(this.canvas_);

    const sceneOptions: SceneOptions = options.sceneOptions !== undefined ?
      {...options.sceneOptions, canvas: this.canvas_, scene3DOnly: true} :
      {canvas: this.canvas_, scene3DOnly: true};

    this.scene_ = new Cesium.Scene(sceneOptions);

    const sscc = this.scene_.screenSpaceCameraController;

    if (!Array.isArray(sscc.tiltEventTypes)) {
      console.log('sscc is not an array');
    } else {
      sscc.tiltEventTypes.push({
        'eventType': Cesium.CameraEventType.LEFT_DRAG,
        'modifier': Cesium.KeyboardEventModifier.SHIFT
      });

      sscc.tiltEventTypes.push({
        'eventType': Cesium.CameraEventType.LEFT_DRAG,
        'modifier': Cesium.KeyboardEventModifier.ALT
      });
    }

    sscc.enableLook = false;

    this.scene_.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

    this.camera_ = new olcsCamera(this.scene_, this.map_);

    this.globe_ = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
    this.globe_.baseColor = Cesium.Color.WHITE;
    this.scene_.globe = this.globe_;
    this.scene_.skyAtmosphere = new Cesium.SkyAtmosphere();

    // The first layer of Cesium is special; using a 1x1 transparent image to workaround it.
    // See https://github.com/AnalyticalGraphicsInc/cesium/issues/1323 for details.
    const firstImageryProvider = new Cesium.SingleTileImageryProvider({
      tileHeight: 1,
      tileWidth: 1,
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      rectangle: Cesium.Rectangle.fromDegrees(0, 0, 1, 1) // the Rectangle dimensions are arbitrary
    });
    this.globe_.imageryLayers.addImageryProvider(firstImageryProvider, 0);

    this.dataSourceCollection_ = new Cesium.DataSourceCollection();
    this.dataSourceDisplay_ = new Cesium.DataSourceDisplay({
      scene: this.scene_,
      dataSourceCollection: this.dataSourceCollection_
    });

    this.synchronizers_ = options.createSynchronizers ?
      options.createSynchronizers(this.map_, this.scene_, this.dataSourceCollection_) : [
        new olcsRasterSynchronizer(this.map_, this.scene_),
        new olcsVectorSynchronizer(this.map_, this.scene_),
        new olcsOverlaySynchronizer(this.map_, this.scene_)
      ] as unknown as SynchronizerType[];

    // Assures correct canvas size after initialisation
    this.handleResize_();

    for (let i = this.synchronizers_.length - 1; i >= 0; --i) {
      this.synchronizers_[i].synchronize();
    }

    const eventHelper = new Cesium.EventHelper();
    eventHelper.add(this.scene_.postRender, OLCesium.prototype.updateTrackedEntity_, this);
  }

  /**
   * Destroys the Cesium resources held by this object.
   */
  destroy() {
    cancelAnimationFrame(this.renderId_);
    this.renderId_ = undefined;
    this.synchronizers_.forEach(synchronizer => synchronizer.destroyAll());
    this.camera_.destroy();
    this.scene_.destroy();
    // @ts-ignore TS2341
    this.scene_._postRender = null;
    this.container_.remove();
  }

  /**
   * Render the Cesium scene.
   */
  private render_() {
    // if a call to `requestAnimationFrame` is pending, cancel it
    if (this.renderId_ !== undefined) {
      cancelAnimationFrame(this.renderId_);
      this.renderId_ = undefined;
    }

    // only render if Cesium is enabled/warming and rendering hasn't been blocked
    if ((this.enabled_ || this.warmingUp_) && !this.blockCesiumRendering_) {
      this.renderId_ = requestAnimationFrame(this.onAnimationFrame_.bind(this));
    }
  }

  /**
   * Callback for `requestAnimationFrame`.
   * @param {number} frameTime The frame time, from `performance.now()`.
   */
  private onAnimationFrame_(frameTime: number) {
    this.renderId_ = undefined;

    // check if a frame was rendered within the target frame rate
    const interval = 1000.0 / this.targetFrameRate_;
    const delta = frameTime - this.lastFrameTime_;
    if (delta < interval) {
      // too soon, don't render yet
      this.render_();
      return;
    }

    // time to render a frame, save the time
    this.lastFrameTime_ = frameTime;

    const julianDate = this.time_();
    // initializeFrame private property
    // @ts-ignore TS2341
    this.scene_.initializeFrame();
    this.handleResize_();
    this.dataSourceDisplay_.update(julianDate);

    // Update tracked entity
    if (this.entityView_) {
      const trackedEntity = this.trackedEntity_;
      // getBoundingSphere private property
      // @ts-ignore TS2341
      const trackedState = this.dataSourceDisplay_.getBoundingSphere(trackedEntity, false, this.boundingSphereScratch_);
      if (trackedState === BoundingSphereState.DONE) {
        this.boundingSphereScratch_.radius = 1; // a radius of 1 is enough for tracking points
        this.entityView_.update(julianDate, this.boundingSphereScratch_);
      }
    }

    this.scene_.render(julianDate);
    this.camera_.checkCameraChange();

    // request the next render call after this one completes to ensure the browser doesn't get backed up
    this.render_();
  }

  private updateTrackedEntity_() {
    if (!this.needTrackedEntityUpdate_) {
      return;
    }

    const trackedEntity = this.trackedEntity_;
    const scene = this.scene_;

    // getBoundingSphere private property
    // @ts-ignore TS2341
    const state = this.dataSourceDisplay_.getBoundingSphere(trackedEntity, false, this.boundingSphereScratch_);
    if (state === BoundingSphereState.PENDING) {
      return;
    }

    scene.screenSpaceCameraController.enableTilt = false;

    const bs = state !== BoundingSphereState.FAILED ? this.boundingSphereScratch_ : undefined;
    if (bs) {
      bs.radius = 1;
    }
    this.entityView_ = new Cesium.EntityView(trackedEntity, scene, scene.mapProjection.ellipsoid);
    this.entityView_.update(this.time_(), bs);
    this.needTrackedEntityUpdate_ = false;
  }

  private handleResize_() {
    let width = this.canvas_.clientWidth;
    let height = this.canvas_.clientHeight;

    if (width === 0 || height === 0) {
      // The canvas DOM element is not ready yet.
      return;
    }

    if (width === this.canvasClientWidth_ &&
        height === this.canvasClientHeight_ &&
        !this.resolutionScaleChanged_) {
      return;
    }

    let resolutionScale = this.resolutionScale_;
    if (!supportsImageRenderingPixelated()) {
      resolutionScale *= window.devicePixelRatio || 1.0;
    }
    this.resolutionScaleChanged_ = false;

    this.canvasClientWidth_ = width;
    this.canvasClientHeight_ = height;

    width *= resolutionScale;
    height *= resolutionScale;

    this.canvas_.width = width;
    this.canvas_.height = height;
    (<PerspectiveFrustum> this.scene_.camera.frustum).aspectRatio = width / height;
  }

  getCamera(): olcsCamera {
    return this.camera_;
  }

  getOlMap(): Map {
    return this.map_;
  }

  getOlView(): View {
    const view = this.map_.getView();
    console.assert(view);
    return view;
  }

  getCesiumScene(): Scene {
    return this.scene_;
  }

  getDataSources(): DataSourceCollection {
    return this.dataSourceCollection_;
  }

  getDataSourceDisplay(): DataSourceDisplay {
    return this.dataSourceDisplay_;
  }

  getEnabled(): boolean {
    return this.enabled_;
  }

  /**
   * Enables/disables the Cesium.
   * This modifies the visibility style of the container element.
   */
  setEnabled(enable: boolean) {
    if (this.enabled_ === enable) {
      return;
    }
    this.enabled_ = enable;

    // some Cesium operations are operating with canvas.clientWidth,
    // so we can't remove it from DOM or even make display:none;
    this.container_.style.visibility = this.enabled_ ? 'visible' : 'hidden';
    let interactions;
    if (this.enabled_) {
      this.throwOnUnitializedMap_();
      if (this.isOverMap_) {
        interactions = this.map_.getInteractions();
        interactions.forEach((el, i, arr) => {
          this.pausedInteractions_.push(el);
        });
        interactions.clear();

        this.map_.addInteraction = interaction => this.pausedInteractions_.push(interaction);
        this.map_.removeInteraction = (interaction) => {
          let interactionRemoved = false;
          this.pausedInteractions_ = this.pausedInteractions_.filter((i) => {
            const removed = i !== interaction;
            if (!interactionRemoved) {interactionRemoved = removed;}
            return removed;
          });
          return interactionRemoved ? interaction : undefined;
        };

        const rootGroup = this.map_.getLayerGroup();
        if (rootGroup.getVisible()) {
          this.hiddenRootGroup_ = rootGroup;
          this.hiddenRootGroup_.setVisible(false);
        }

        this.map_.getOverlayContainer().classList.add('olcs-hideoverlay');
      }

      this.camera_.readFromView();
      this.render_();
    } else {
      if (this.isOverMap_) {
        interactions = this.map_.getInteractions();
        this.pausedInteractions_.forEach((interaction) => {
          interactions.push(interaction);
        });
        this.pausedInteractions_.length = 0;

        this.map_.addInteraction = interaction => this.map_.getInteractions().push(interaction);
        this.map_.removeInteraction = interaction => this.map_.getInteractions().remove(interaction);

        this.map_.getOverlayContainer().classList.remove('olcs-hideoverlay');
        if (this.hiddenRootGroup_) {
          this.hiddenRootGroup_.setVisible(true);
          this.hiddenRootGroup_ = null;
        }
      }

      this.camera_.updateView();
    }
  }

  /**
   * Preload Cesium so that it is ready when transitioning from 2D to 3D.
   * @param {number} height Target height of the camera
   * @param {number} timeout Milliseconds after which the warming will stop
  */
  warmUp(height: number, timeout: number) {
    if (this.enabled_) {
      // already enabled
      return;
    }
    this.throwOnUnitializedMap_();
    this.camera_.readFromView();
    const ellipsoid = this.globe_.ellipsoid;
    const csCamera = this.scene_.camera;
    const position = ellipsoid.cartesianToCartographic(csCamera.position);
    if (position.height < height) {
      position.height = height;
      csCamera.position = ellipsoid.cartographicToCartesian(position);
    }

    this.warmingUp_ = true;
    this.render_();

    setTimeout(() => {
      this.warmingUp_ = false;
    }, timeout);
  }

  /**
   * Block Cesium rendering to save resources.
   * @param {boolean} block True to block.
  */
  setBlockCesiumRendering(block: boolean) {
    if (this.blockCesiumRendering_ !== block) {
      this.blockCesiumRendering_ = block;

      // reset the render loop
      this.render_();
    }
  }

  /**
   * Render the globe only when necessary in order to save resources.
   * Experimental.
   */
  enableAutoRenderLoop() {
    if (!this.autoRenderLoop_) {
      this.autoRenderLoop_ = new olcsAutoRenderLoop(this);
    }
  }

  /**
   * Get the autorender loop.
  */
  getAutoRenderLoop(): olcsAutoRenderLoop {
    return this.autoRenderLoop_;
  }

  /**
   * The 3D Cesium globe is rendered in a canvas with two different dimensions:
   * clientWidth and clientHeight which are the dimension on the screen and
   * width and height which are the dimensions of the drawing buffer.
   *
   * By using a resolution scale lower than 1.0, it is possible to render the
   * globe in a buffer smaller than the canvas client dimensions and improve
   * performance, at the cost of quality.
   *
   * Pixel ratio should also be taken into account; by default, a device with
   * pixel ratio of 2.0 will have a buffer surface 4 times bigger than the client
   * surface.
   */
  setResolutionScale(value: number) {
    value = Math.max(0, value);
    if (value !== this.resolutionScale_) {
      this.resolutionScale_ = Math.max(0, value);
      this.resolutionScaleChanged_ = true;
      if (this.autoRenderLoop_) {
        this.autoRenderLoop_.restartRenderLoop();
      }
    }
  }

  /**
   * Set the target frame rate for the renderer. Set to `Number.POSITIVE_INFINITY`
   * to render as quickly as possible.
   * @param {number} value The frame rate, in frames per second.
   */
  setTargetFrameRate(value: number) {
    if (this.targetFrameRate_ !== value) {
      this.targetFrameRate_ = value;

      // reset the render loop
      this.render_();
    }
  }

  /**
   * Check if OpenLayers map is not properly initialized.
   */
  private throwOnUnitializedMap_() {
    const map = this.map_;
    const view = map.getView();
    const center = view.getCenter();
    if (!view.isDef() || isNaN(center[0]) || isNaN(center[1])) {
      throw new Error(`The OpenLayers map is not properly initialized: ${center} / ${view.getResolution()}`);
    }
  }

  get trackedFeature(): Feature {
    return this.trackedFeature_;
  }

  set trackedFeature(feature: Feature) {
    if (this.trackedFeature_ !== feature) {

      const scene = this.scene_;

      //Stop tracking
      if (!feature || !feature.getGeometry()) {
        this.needTrackedEntityUpdate_ = false;
        scene.screenSpaceCameraController.enableTilt = true;

        if (this.trackedEntity_) {
          this.dataSourceDisplay_.defaultDataSource.entities.remove(this.trackedEntity_);
        }
        this.trackedEntity_ = null;
        this.trackedFeature_ = null;
        this.entityView_ = null;
        scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        return;
      }

      this.trackedFeature_ = feature;

      //We can't start tracking immediately, so we set a flag and start tracking
      //when the bounding sphere is ready (most likely next frame).
      this.needTrackedEntityUpdate_ = true;

      const to4326Transform = this.to4326Transform_;
      const toCesiumPosition = function() {
        const geometry = feature.getGeometry();
        console.assert(geometry instanceof olGeomPoint);
        const coo = geometry instanceof olGeomPoint ? geometry.getCoordinates() : [];
        const coo4326 = to4326Transform(coo, undefined, coo.length);
        return ol4326CoordinateToCesiumCartesian(coo4326);
      };

      // Create an invisible point entity for tracking.
      // It is independent of the primitive/geometry created by the vector synchronizer.
      const options: Entity.ConstructorOptions = {
        // @ts-ignore according to Cesium types, not possible to pass CallbackProperty
        position: new Cesium.CallbackProperty((time, result) => toCesiumPosition(), false),
        point: {
          pixelSize: 1,
          color: Cesium.Color.TRANSPARENT
        }
      };

      this.trackedEntity_ = this.dataSourceDisplay_.defaultDataSource.entities.add(options);
    }
  }
}
