export default OverlaySynchronizer;
declare class OverlaySynchronizer {
    /**
    * @param {!ol.Map} map
    * @param {!Cesium.Scene} scene
    * @constructor
    * @template T
    * @api
    */
    constructor(map: ol.Map, scene: Cesium.Scene);
    /**
    * @type {!ol.Map}
    * @protected
    */
    protected map: ol.Map;
    /**
    * @type {ol.Collection.<ol.Overlay>}
    * @private
    */
    private overlays_;
    /**
    * @type {!Cesium.Scene}
    * @protected
    */
    protected scene: Cesium.Scene;
    /**
    * @private
    * @type {!Element}
    */
    private overlayContainerStopEvent_;
    /**
    * @private
    * @type {!Element}
    */
    private overlayContainer_;
    /**
    * @type {!Object<?,olcs.SynchronizedOverlay>}
    * @private
    */
    private overlayMap_;
    /**
    * Get the element that serves as a container for overlays that don't allow
    * event propagation. Elements added to this container won't let mousedown and
    * touchstart events through to the map, so clicks and gestures on an overlay
    * don't trigger any {@link ol.MapBrowserEvent}.
    * @return {!Element} The map's overlay container that stops events.
    */
    getOverlayContainerStopEvent(): Element;
    /**
    * Get the element that serves as a container for overlays.
    * @return {!Element} The map's overlay container.
    */
    getOverlayContainer(): Element;
    /**
    * Destroy all and perform complete synchronization of the overlays.
    * @api
    */
    synchronize(): void;
    /**
    * @param {ol.Collection.Event} event
    * @private
    */
    private addOverlayFromEvent_;
    /**
    * @api
    */
    addOverlays(): void;
    /**
    * @param {ol.Overlay} overlay
    * @api
    */
    addOverlay(overlay: ol.Overlay): void;
    /**
    * @param {ol.Collection.Event} event
    * @private
    */
    private removeOverlayFromEvent_;
    /**
    * Removes an overlay from the scene
    * @param {ol.Overlay} overlay
    * @api
    */
    removeOverlay(overlay: ol.Overlay): void;
    /**
    * Destroys all the created Cesium objects.
    * @protected
    */
    protected destroyAll(): void;
}
