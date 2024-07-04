import olcsAutoRenderLoop from './AutoRenderLoop.js';
import olcsCamera from './Camera.js';
import Map from 'ol/Map.js';
import Feature from 'ol/Feature.js';
import View from 'ol/View.js';
import type { ContextOptions, DataSourceCollection, DataSourceDisplay, JulianDate, MapMode2D, MapProjection, Scene, ImageryLayer } from 'cesium';
import type AbstractSynchronizer from './AbstractSynchronizer';
import type VectorLayerCounterpart from './core/VectorLayerCounterpart';
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
};
type OLCesiumOptions = {
    map: Map;
    time: () => JulianDate;
    target: Element | string;
    createSynchronizers: (map: Map, scene: Scene, dataSourceCollection: DataSourceCollection) => AbstractSynchronizer<ImageryLayer | VectorLayerCounterpart>[];
    stopOpenLayersEventsPropagation: boolean;
    sceneOptions: SceneOptions;
};
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
declare class OLCesium {
    private autoRenderLoop_;
    private map_;
    private time_;
    private to4326Transform_;
    private resolutionScale_;
    private canvasClientWidth_;
    private canvasClientHeight_;
    private resolutionScaleChanged_;
    private container_;
    private isOverMap_;
    private canvas_;
    private enabled_;
    private pausedInteractions_;
    private hiddenRootGroup_;
    private scene_;
    private camera_;
    private globe_;
    private dataSourceCollection_;
    private dataSourceDisplay_;
    /** Time of the last rendered frame, as returned by `performance.now()`. */
    private lastFrameTime_;
    /** The identifier returned by `requestAnimationFrame`. */
    private renderId_;
    /** Target frame rate for the render loop.  */
    private targetFrameRate_;
    /** If the Cesium render loop is being blocked. */
    private blockCesiumRendering_;
    /** If the warmup routine is active. */
    private warmingUp_;
    private trackedFeature_;
    private trackedEntity_;
    private entityView_;
    private needTrackedEntityUpdate_;
    private boundingSphereScratch_;
    private synchronizers_;
    constructor(options: OLCesiumOptions);
    /**
     * Destroys the Cesium resources held by this object.
     */
    destroy(): void;
    /**
     * Render the Cesium scene.
     */
    private render_;
    /**
     * Callback for `requestAnimationFrame`.
     * @param {number} frameTime The frame time, from `performance.now()`.
     */
    private onAnimationFrame_;
    private updateTrackedEntity_;
    private handleResize_;
    getCamera(): olcsCamera;
    getOlMap(): Map;
    getOlView(): View;
    getCesiumScene(): Scene;
    getDataSources(): DataSourceCollection;
    getDataSourceDisplay(): DataSourceDisplay;
    getEnabled(): boolean;
    /**
     * Enables/disables the Cesium.
     * This modifies the visibility style of the container element.
     */
    setEnabled(enable: boolean): void;
    /**
     * Preload Cesium so that it is ready when transitioning from 2D to 3D.
     * @param {number} height Target height of the camera
     * @param {number} timeout Milliseconds after which the warming will stop
    */
    warmUp(height: number, timeout: number): void;
    /**
     * Block Cesium rendering to save resources.
     * @param {boolean} block True to block.
    */
    setBlockCesiumRendering(block: boolean): void;
    /**
     * Render the globe only when necessary in order to save resources.
     * Experimental.
     */
    enableAutoRenderLoop(): void;
    /**
     * Get the autorender loop.
    */
    getAutoRenderLoop(): olcsAutoRenderLoop;
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
    setResolutionScale(value: number): void;
    /**
     * Set the target frame rate for the renderer. Set to `Number.POSITIVE_INFINITY`
     * to render as quickly as possible.
     * @param {number} value The frame rate, in frames per second.
     */
    setTargetFrameRate(value: number): void;
    /**
     * Check if OpenLayers map is not properly initialized.
     */
    private throwOnUnitializedMap_;
    get trackedFeature(): Feature;
    set trackedFeature(feature: Feature);
}
export default OLCesium;
