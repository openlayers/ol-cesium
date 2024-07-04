export default Camera;
declare class Camera {
    /**
     * @param {Array.<number>} input Input coordinate array.
     * @param {Array.<number>=} opt_output Output array of coordinate values.
     * @param {number=} opt_dimension Dimension.
     * @return {Array.<number>} Input coordinate array (same array as input).
     */
    static identityProjection(input: Array<number>, opt_output?: Array<number> | undefined, opt_dimension?: number | undefined): Array<number>;
    /**
     * This object takes care of additional 3d-specific properties of the view and
     * ensures proper synchronization with the underlying raw Cesium.Camera object.
     * @param {!Cesium.Scene} scene
     * @param {!ol.Map} map
     * @api
     */
    constructor(scene: Cesium.Scene, map: ol.Map);
    /**
     * @type {!Cesium.Scene}
     * @private
     */
    private scene_;
    /**
     * @type {!Cesium.Camera}
     * @private
     */
    private cam_;
    /**
     * @type {!ol.Map}
     * @private
     */
    private map_;
    /**
     * @type {?ol.View}
     * @private
     */
    private view_;
    /**
     * @type {?ol.EventsKey}
     * @private
     */
    private viewListenKey_;
    /**
     * @type {!ol.TransformFunction}
     * @private
     */
    private toLonLat_;
    /**
     * @type {!ol.TransformFunction}
     * @private
     */
    private fromLonLat_;
    /**
     * 0 -- topdown, PI/2 -- the horizon
     * @type {number}
     * @private
     */
    private tilt_;
    /**
     * @type {number}
     * @private
     */
    private distance_;
    /**
     * @type {?Cesium.Matrix4}
     * @private
     */
    private lastCameraViewMatrix_;
    /**
     * This is used to discard change events on view caused by updateView method.
     * @type {boolean}
     * @private
     */
    private viewUpdateInProgress_;
    destroy(): void;
    /**
     * @param {?ol.View} view New view to use.
     * @private
     */
    private setView_;
    /**
     * @param {?} e
     * @private
     */
    private handleViewEvent_;
    /**
     * @param {number} heading In radians.
     * @api
     */
    setHeading(heading: number): void;
    /**
     * @return {number|undefined} Heading in radians.
     * @api
     */
    getHeading(): number | undefined;
    /**
     * @param {number} tilt In radians.
     * @api
     */
    setTilt(tilt: number): void;
    /**
     * @return {number} Tilt in radians.
     * @api
     */
    getTilt(): number;
    /**
     * @param {number} distance In meters.
     * @api
     */
    setDistance(distance: number): void;
    /**
     * @return {number} Distance in meters.
     * @api
     */
    getDistance(): number;
    /**
     * Shortcut for ol.View.setCenter().
     * @param {!ol.Coordinate} center Same projection as the ol.View.
     * @api
     */
    setCenter(center: ol.Coordinate): void;
    /**
     * Shortcut for ol.View.getCenter().
     * @return {ol.Coordinate|undefined} Same projection as the ol.View.
     * @api
     */
    getCenter(): ol.Coordinate | undefined;
    /**
     * Sets the position of the camera.
     * @param {!ol.Coordinate} position Same projection as the ol.View.
     * @api
     */
    setPosition(position: ol.Coordinate): void;
    /**
     * Calculates position under the camera.
     * @return {!ol.Coordinate|undefined} Same projection as the ol.View.
     * @api
     */
    getPosition(): ol.Coordinate | undefined;
    /**
     * @param {number} altitude In meters.
     * @api
     */
    setAltitude(altitude: number): void;
    /**
     * @return {number} Altitude in meters.
     * @api
     */
    getAltitude(): number;
    /**
     * Updates the state of the underlying Cesium.Camera
     * according to the current values of the properties.
     * @private
     */
    private updateCamera_;
    /**
     * Calculates the values of the properties from the current ol.View state.
     * @api
     */
    readFromView(): void;
    /**
     * Calculates the values of the properties from the current Cesium.Camera state.
     * Modifies the center, resolution and rotation properties of the view.
     * @api
     */
    updateView(): void;
    /**
     * Check if the underlying camera state has changed and ensure synchronization.
     * @param {boolean=} opt_dontSync Do not synchronize the view.
     */
    checkCameraChange(opt_dontSync?: boolean | undefined): void;
    /**
     * calculate the distance between camera and centerpoint based on the resolution and latitude value
     * @param {number} resolution Number of map units per pixel.
     * @param {number} latitude Latitude in radians.
     * @return {number} The calculated distance.
     * @api
     */
    calcDistanceForResolution(resolution: number, latitude: number): number;
    /**
     * calculate the resolution based on a distance(camera to position) and latitude value
     * @param {number} distance
     * @param {number} latitude
     * @return {number} The calculated resolution.
     * @api
     */
    calcResolutionForDistance(distance: number, latitude: number): number;
}
