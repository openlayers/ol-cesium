/**
 * @module olcs.OLCesium
 */
import olGeomPoint from 'ol/geom/Point.js';
import {getTransform} from 'ol/proj.js';
import olcsUtil from './util.js';
import olcsCore from './core.js';
import olcsAutoRenderLoop from './AutoRenderLoop.js';
import olcsCamera from './Camera.js';
import olcsRasterSynchronizer from './RasterSynchronizer.js';
import olcsVectorSynchronizer from './VectorSynchronizer.js';
import olcsOverlaySynchronizer from './OverlaySynchronizer.js';


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


class OLCesium {
  /**
   * @param {!OLCesiumOptions} options Options.
   * @constructor
   * @api
   */
  constructor(options) {

    /**
     * @type {olcs.AutoRenderLoop}
     * @private
     */
    this.autoRenderLoop_ = null;

    /**
     * @type {!ol.Map}
     * @private
     */
    this.map_ = options.map;

    /**
     * @type {!function(): Cesium.JulianDate}
     * @private
     */
    this.time_ = options.time || function() {
      return Cesium.JulianDate.now();
    };

    /**
     * No change of the view projection.
     * @private
     */
    this.to4326Transform_ = getTransform(this.map_.getView().getProjection(), 'EPSG:4326');

    /**
     * @type {number}
     * @private
     */
    this.resolutionScale_ = 1.0;

    /**
     * @type {number}
     * @private
     */
    this.canvasClientWidth_ = 0.0;

    /**
     * @type {number}
     * @private
     */
    this.canvasClientHeight_ = 0.0;

    /**
     * @type {boolean}
     * @private
     */
    this.resolutionScaleChanged_ = true; // force resize

    const fillArea = 'position:absolute;top:0;left:0;width:100%;height:100%;';

    /**
     * @type {!Element}
     * @private
     */
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
     * @type {boolean}
     * @private
     */
    this.isOverMap_ = !options.target;


    if (this.isOverMap_ && options.stopOpenLayersEventsPropagation) {
      const overlayEvents = ['click', 'dblclick', 'mousedown', 'touchstart', 'MSPointerDown', 'pointerdown', 'mousewheel', 'wheel'];
      for (let i = 0, ii = overlayEvents.length; i < ii; ++i) {
        this.container_.addEventListener(overlayEvents[i], evt => evt.stopPropagation());
      }
    }


    /**
     * @type {!HTMLCanvasElement}
     * @private
     */
    this.canvas_ = /** @type {!HTMLCanvasElement} */ (document.createElement('CANVAS'));
    const canvasAttribute = document.createAttribute('style');
    canvasAttribute.value = fillArea;
    this.canvas_.setAttributeNode(canvasAttribute);

    if (olcsUtil.supportsImageRenderingPixelated()) {
      // non standard CSS4
      this.canvas_.style['imageRendering'] = olcsUtil.imageRenderingValue();
    }

    this.canvas_.oncontextmenu = function() { return false; };
    this.canvas_.onselectstart = function() { return false; };

    this.container_.appendChild(this.canvas_);

    /**
     * @type {boolean}
     * @private
     */
    this.enabled_ = false;

    /**
     * @type {!Array.<ol.interaction.Interaction>}
     * @private
     */
    this.pausedInteractions_ = [];

    /**
     * @type {?ol.layer.Group}
     * @private
     */
    this.hiddenRootGroup_ = null;

    const sceneOptions = options.sceneOptions !== undefined ? options.sceneOptions :
      /** @type {Cesium.SceneOptions} */ ({});
    sceneOptions.canvas = this.canvas_;
    sceneOptions.scene3DOnly = true;

    /**
     * @type {!Cesium.Scene}
     * @private
     */
    this.scene_ = new Cesium.Scene(sceneOptions);

    const sscc = this.scene_.screenSpaceCameraController;

    sscc.tiltEventTypes.push({
      'eventType': Cesium.CameraEventType.LEFT_DRAG,
      'modifier': Cesium.KeyboardEventModifier.SHIFT
    });

    sscc.tiltEventTypes.push({
      'eventType': Cesium.CameraEventType.LEFT_DRAG,
      'modifier': Cesium.KeyboardEventModifier.ALT
    });

    sscc.enableLook = false;

    this.scene_.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

    /**
     * @type {!olcs.Camera}
     * @private
     */
    this.camera_ = new olcsCamera(this.scene_, this.map_);

    /**
     * @type {!Cesium.Globe}
     * @private
     */
    this.globe_ = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
    this.globe_.baseColor = Cesium.Color.WHITE;
    this.scene_.globe = this.globe_;
    this.scene_.skyAtmosphere = new Cesium.SkyAtmosphere();

    // The first layer of Cesium is special; using a 1x1 transparent image to workaround it.
    // See https://github.com/AnalyticalGraphicsInc/cesium/issues/1323 for details.
    const firstImageryProvider = new Cesium.SingleTileImageryProvider({
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      rectangle: Cesium.Rectangle.fromDegrees(0, 0, 1, 1) // the Rectangle dimensions are arbitrary
    });
    this.globe_.imageryLayers.addImageryProvider(firstImageryProvider, 0);

    this.dataSourceCollection_ = new Cesium.DataSourceCollection();
    this.dataSourceDisplay_ = new Cesium.DataSourceDisplay({
      scene: this.scene_,
      dataSourceCollection: this.dataSourceCollection_
    });

    const synchronizers = options.createSynchronizers ?
      options.createSynchronizers(this.map_, this.scene_, this.dataSourceCollection_) : [
        new olcsRasterSynchronizer(this.map_, this.scene_),
        new olcsVectorSynchronizer(this.map_, this.scene_),
        new olcsOverlaySynchronizer(this.map_, this.scene_)
      ];

    // Assures correct canvas size after initialisation
    this.handleResize_();

    for (let i = synchronizers.length - 1; i >= 0; --i) {
      synchronizers[i].synchronize();
    }

    /**
     * Time of the last rendered frame, as returned by `performance.now()`.
     * @type {number}
     * @private
     */
    this.lastFrameTime_ = 0;

    /**
     * The identifier returned by `requestAnimationFrame`.
     * @type {number|undefined}
     * @private
     */
    this.renderId_ = undefined;

    /**
     * Target frame rate for the render loop.
     * @type {number}
     * @private
     */
    this.targetFrameRate_ = Number.POSITIVE_INFINITY;

    /**
     * If the Cesium render loop is being blocked.
     * @type {boolean}
     * @private
     */
    this.blockCesiumRendering_ = false;

    /**
     * If the warmup routine is active.
     * @type {boolean}
     * @private
     */
    this.warmingUp_ = false;

    /**
     * @type {ol.Feature}
     * @private
     */
    this.trackedFeature_ = null;

    /**
     * @type {Cesium.Entity}
     * @private
     */
    this.trackedEntity_ = null;

    /**
     * @type {Cesium.EntityView}
     * @private
     */
    this.entityView_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.needTrackedEntityUpdate_ = false;

    /**
     * @type {!Cesium.BoundingSphere}
     */
    this.boundingSphereScratch_ = new Cesium.BoundingSphere();

    const eventHelper = new Cesium.EventHelper();
    eventHelper.add(this.scene_.postRender, OLCesium.prototype.updateTrackedEntity_, this);

    // Cesium has a mechanism to prevent the camera to go under the terrain.
    // Unfortunately, it is only active when all the terrain has been loaded, which:
    // - does not prevent the camera to sink under terrain anymore;
    // - introduce a jumping effect once all terrain has been loaded and the position of the camera is finally fixed.
    // The property below enables a workaround found in the Camptocamp Cesium fork.
    // See also https://github.com/AnalyticalGraphicsInc/cesium/issues/5999.
    Cesium.Camera.enableSuspendTerrainAdjustment = false;
  }

  /**
   * Render the Cesium scene.
   * @private
   */
  render_() {
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
   * @private
   */
  onAnimationFrame_(frameTime) {
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
    this.scene_.initializeFrame();
    this.handleResize_();
    this.dataSourceDisplay_.update(julianDate);

    // Update tracked entity
    if (this.entityView_) {
      const trackedEntity = this.trackedEntity_;
      const trackedState = this.dataSourceDisplay_.getBoundingSphere(trackedEntity, false, this.boundingSphereScratch_);
      if (trackedState === Cesium.BoundingSphereState.DONE) {
        this.boundingSphereScratch_.radius = 1; // a radius of 1 is enough for tracking points
        this.entityView_.update(julianDate, this.boundingSphereScratch_);
      }
    }

    this.scene_.render(julianDate);
    this.camera_.checkCameraChange();

    // request the next render call after this one completes to ensure the browser doesn't get backed up
    this.render_();
  }

  /**
   * @private
   */
  updateTrackedEntity_() {
    if (!this.needTrackedEntityUpdate_) {
      return;
    }

    const trackedEntity = this.trackedEntity_;
    const scene = this.scene_;

    const state = this.dataSourceDisplay_.getBoundingSphere(trackedEntity, false, this.boundingSphereScratch_);
    if (state === Cesium.BoundingSphereState.PENDING) {
      return;
    }

    scene.screenSpaceCameraController.enableTilt = false;

    const bs = state !== Cesium.BoundingSphereState.FAILED ? this.boundingSphereScratch_ : undefined;
    if (bs) {
      bs.radius = 1;
    }
    this.entityView_ = new Cesium.EntityView(trackedEntity, scene, scene.mapProjection.ellipsoid);
    this.entityView_.update(this.time_(), bs);
    this.needTrackedEntityUpdate_ = false;
  }

  /**
   * @private
   */
  handleResize_() {
    let width = this.canvas_.clientWidth;
    let height = this.canvas_.clientHeight;

    if (width === 0 | height === 0) {
      // The canvas DOM element is not ready yet.
      return;
    }

    if (width === this.canvasClientWidth_ &&
        height === this.canvasClientHeight_ &&
        !this.resolutionScaleChanged_) {
      return;
    }

    let resolutionScale = this.resolutionScale_;
    if (!olcsUtil.supportsImageRenderingPixelated()) {
      resolutionScale *= window.devicePixelRatio || 1.0;
    }
    this.resolutionScaleChanged_ = false;

    this.canvasClientWidth_ = width;
    this.canvasClientHeight_ = height;

    width *= resolutionScale;
    height *= resolutionScale;

    this.canvas_.width = width;
    this.canvas_.height = height;
    this.scene_.camera.frustum.aspectRatio = width / height;
  }

  /**
   * @return {!olcs.Camera}
   * @api
   */
  getCamera() {
    return this.camera_;
  }

  /**
   * @return {!ol.Map}
   * @api
   */
  getOlMap() {
    return this.map_;
  }

  /**
   * @return {!ol.View}
   * @api
   */
  getOlView() {
    const view = this.map_.getView();
    console.assert(view);
    return view;
  }

  /**
   * @return {!Cesium.Scene}
   * @api
   */
  getCesiumScene() {
    return this.scene_;
  }

  /**
   * @return {!Cesium.DataSourceCollection}
   * @api
   */
  getDataSources() {
    return this.dataSourceCollection_;
  }

  /**
   * @return {!Cesium.DataSourceDisplay}
   * @api
   */
  getDataSourceDisplay() {
    return this.dataSourceDisplay_;
  }

  /**
   * @return {boolean}
   * @api
   */
  getEnabled() {
    return this.enabled_;
  }

  /**
   * Enables/disables the Cesium.
   * This modifies the visibility style of the container element.
   * @param {boolean} enable
   * @api
   */
  setEnabled(enable) {
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
        this.map_.removeInteraction = interaction =>
          this.pausedInteractions_ = this.pausedInteractions_.filter(i => i !== interaction);

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
   * @api
  */
  warmUp(height, timeout) {
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
   * @api
  */
  setBlockCesiumRendering(block) {
    if (this.blockCesiumRendering_ !== block) {
      this.blockCesiumRendering_ = block;

      // reset the render loop
      this.render_();
    }
  }

  /**
   * Render the globe only when necessary in order to save resources.
   * Experimental.
   * @api
   */
  enableAutoRenderLoop() {
    if (!this.autoRenderLoop_) {
      this.autoRenderLoop_ = new olcsAutoRenderLoop(this);
    }
  }

  /**
   * Get the autorender loop.
   * @return {?olcs.AutoRenderLoop}
   * @api
  */
  getAutoRenderLoop() {
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
   *
   * @param {number} value
   * @this {olcs.OLCesium}
   * @api
   */
  setResolutionScale(value) {
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
   * @api
   */
  setTargetFrameRate(value) {
    if (this.targetFrameRate_ !== value) {
      this.targetFrameRate_ = value;

      // reset the render loop
      this.render_();
    }
  }

  /**
   * Check if OpenLayers map is not properly initialized.
   * @private
   */
  throwOnUnitializedMap_() {
    const map = this.map_;
    const view = map.getView();
    const center = view.getCenter();
    if (!view.isDef() || isNaN(center[0]) || isNaN(center[1])) {
      throw new Error(`The OpenLayers map is not properly initialized: ${center} / ${view.getResolution()}`);
    }
  }

  /**
   * @type {ol.Feature}
   */
  get trackedFeature() {
    return this.trackedFeature_;
  }

  /**
   * @param {ol.Feature} feature
   */
  set trackedFeature(feature) {
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
        const coo = geometry.getCoordinates();
        const coo4326 = to4326Transform(coo, undefined, coo.length);
        return olcsCore.ol4326CoordinateToCesiumCartesian(coo4326);
      };

      // Create an invisible point entity for tracking.
      // It is independant from the primitive/geometry created by the vector synchronizer.
      const options = {
        'position': new Cesium.CallbackProperty((time, result) => toCesiumPosition(), false),
        'point': {
          'pixelSize': 1,
          'color': Cesium.Color.TRANSPARENT
        }
      };

      this.trackedEntity_ = this.dataSourceDisplay_.defaultDataSource.entities.add(options);
    }
  }
}

export default OLCesium;
