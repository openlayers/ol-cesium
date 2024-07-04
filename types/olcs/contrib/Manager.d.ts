export default Manager;
export type ManagerOptions = {
    map: import('ol/Map.js').default;
    cameraExtentInRadians?: import('ol/extent.js').Extent;
    cesiumIonDefaultAccessToken?: string;
};
/**
 * @typedef {Object} ManagerOptions
 * @property {import('ol/Map.js').default} map
 * @property {import('ol/extent.js').Extent} [cameraExtentInRadians]
 * @property {string} [cesiumIonDefaultAccessToken]
 */
declare const Manager: {
    new (cesiumUrl: string, { map, cameraExtentInRadians, cesiumIonDefaultAccessToken }?: olcsx.contrib.ManagerOptions): {
        /**
         * @type {string}
         * @private
         */
        cesiumUrl_: string;
        /**
         * @type {ol.Map}
         * @protected
         */
        map: ol.Map;
        /**
         * @type {ol.Extent}
         * @protected
         */
        cameraExtentInRadians: ol.Extent;
        /**
         * @private
         * @type {Cesium.BoundingSphere}
         */
        boundingSphere_: Cesium.BoundingSphere;
        /**
         * @type {Promise.<olcs.OLCesium>}
         * @private
         */
        promise_: Promise<olcs.OLCesium>;
        /**
         * @type {string}
         * @private
         */
        cesiumIonDefaultAccessToken_: string;
        /**
         * @type {olcs.OLCesium}
         * @protected
         */
        ol3d: olcs.OLCesium;
        /**
         * @const {number} Tilt angle in radians
         * @private
         */
        cesiumInitialTilt_: number;
        /**
         * @protected
         * @type {number}
         */
        fogDensity: number;
        /**
         * @protected
         * @type {number}
         */
        fogSSEFactor: number;
        /**
         * Limit the minimum distance to the terrain to 2m.
         * @protected
         * @type {number}
         */
        minimumZoomDistance: number;
        /**
         * Limit the maximum distance to the earth to 10'000km.
         * @protected
         * @type {number}
         */
        maximumZoomDistance: number;
        /**
         * @protected
         * @param {number} height
         */
        limitCameraToBoundingSphereRatio: (height: number) => 3 | 9;
        /**
         * @return {Promise.<olcs.OLCesium>}
         */
        load(): Promise<olcs.OLCesium>;
        /**
         * @protected
         * @return {olcs.OLCesium}
         */
        onCesiumLoaded(): olcs.OLCesium;
        /**
         * Application code should override this method.
         * @return {olcs.OLCesium}
         */
        instantiateOLCesium(): olcs.OLCesium;
        /**
         * @param {!Cesium.Scene} scene The scene, passed as parameter for convenience.
         * @protected
         */
        configureForPerformance(scene: Cesium.Scene): void;
        /**
         * @param {!Cesium.Scene} scene The scene, passed as parameter for convenience.
         * @protected
         */
        configureForUsability(scene: Cesium.Scene): void;
        /**
         * Constrain the camera so that it stays close to the bounding sphere of the map extent.
         * Near the ground the allowed distance is shorter.
         * @protected
         */
        limitCameraToBoundingSphere(): void;
        /**
         * Enable or disable ol3d with a default animation.
         * @export
         * @return {Promise<undefined>}
         */
        toggle3d(): Promise<undefined>;
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
        set3dWithView(lon: number, lat: number, elevation: number, headingDeg: number, pitchDeg: number): Promise<undefined>;
        /**
         * @export
         * @return {boolean}
         */
        is3dEnabled(): boolean;
        /**
         * @return {number}
         */
        getHeading(): number;
        /**
         * @return {number|undefined}
         */
        getTiltOnGlobe(): number | undefined;
        /**
         * @param {number} angle
         */
        setHeading(angle: number): void;
        /**
         * @export
         * @return {olcs.OLCesium}
         */
        getOl3d(): olcs.OLCesium;
        /**
         * @export
         * @return {!ol.View}
         */
        getOlView(): ol.View;
        /**
         * @export
         * @return {Cesium.Matrix4}
         */
        getCesiumViewMatrix(): Cesium.Matrix4;
        /**
         * @export
         * @return {!Cesium.Scene}
         */
        getCesiumScene(): Cesium.Scene;
        /**
         * @export
         * @param {!Cesium.Rectangle} rectangle
         * @param {number=} offset in meters
         * @return {Promise<undefined>}
         */
        flyToRectangle(rectangle: Cesium.Rectangle, offset?: number | undefined): Promise<undefined>;
        /**
         * @protected
         * @return {Cesium.Rectangle|undefined}
         */
        getCameraExtentRectangle(): Cesium.Rectangle | undefined;
        on: import("ol/Observable.js").ObservableOnSignature<import("ol/events.js").EventsKey>;
        /**
         * @protected
         * @param {number} height
         */
        once: import("ol/Observable.js").ObservableOnSignature<import("ol/events.js").EventsKey>; /**
         * @protected
         * @param {number} height
         */
        un: import("ol/Observable.js").ObservableOnSignature<void>;
        revision_: any;
        changed(): void;
        getRevision(): number;
        onInternal(type: string | string[], listener: (arg0: import("ol/events/Event.js").default | Event) => unknown): import("ol/events.js").EventsKey | import("ol/events.js").EventsKey[];
        onceInternal(type: string | string[], listener: (arg0: import("ol/events/Event.js").default | Event) => unknown): import("ol/events.js").EventsKey | import("ol/events.js").EventsKey[];
        unInternal(type: string | string[], listener: (arg0: import("ol/events/Event.js").default | Event) => unknown): void;
        eventTarget_: any;
        pendingRemovals_: any;
        dispatching_: any;
        listeners_: any;
        addEventListener(type: string, listener: import("ol/events.js").Listener): void;
        dispatchEvent(event: string | import("ol/events/Event.js").default): boolean;
        getListeners(type: string): import("ol/events.js").Listener[];
        hasListener(type?: string): boolean;
        removeEventListener(type: string, listener: import("ol/events.js").Listener): void;
        disposed: boolean;
        dispose(): void;
        disposeInternal(): void;
    };
};
