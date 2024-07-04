export default SynchronizedOverlay;
/**
 * Options for SynchronizedOverlay
 */
export type SynchronizedOverlayOptions = {
    scene: Cesium.Scene;
    parent: olOverlay;
    synchronizer: any;
};
/**
 * Options for SynchronizedOverlay
 * @typedef {Object} SynchronizedOverlayOptions
 * @property {!Cesium.Scene} scene
 * @property {olOverlay} parent
 * @property {!import('olsc/OverlaySynchronizer.js').default} synchronizer
 */
declare class SynchronizedOverlay extends olOverlay {
    /**
     * @param {olcsx.SynchronizedOverlayOptions} options SynchronizedOverlay Options.
     * @api
     */
    constructor(options: olcsx.SynchronizedOverlayOptions);
    /**
     * @private
     * @type {?Function}
     */
    private scenePostRenderListenerRemover_;
    /**
     * @private
     * @type {!Cesium.Scene}
     */
    private scene_;
    /**
     * @private
     * @type {!olcs.OverlaySynchronizer}
     */
    private synchronizer_;
    /**
     * @private
     * @type {!ol.Overlay}
     */
    private parent_;
    /**
     * @private
     * @type {ol.Coordinate|undefined}
     */
    private positionWGS84_;
    /**
     * @private
     * @type {MutationObserver}
     */
    private observer_;
    /**
     * @private
     * @type {Array.<MutationObserver>}
     */
    private attributeObserver_;
    /**
     * @private
     * @type {Array<ol.EventsKey>}
     */
    private listenerKeys_;
    /**
     * @param {Node} target
     * @private
     */
    private observeTarget_;
    /**
     *
     * @param {ol.Object.Event} event
     * @private
     */
    private setPropertyFromEvent_;
    /**
     * Get the scene associated with this overlay.
     * @see ol.Overlay.prototype.getMap
     * @return {!Cesium.Scene} The scene that the overlay is part of.
     * @api
     */
    getScene(): Cesium.Scene;
    /**
     * Destroys the overlay, removing all its listeners and elements
     * @api
     */
    destroy(): void;
}
import olOverlay from 'ol/Overlay.js';
