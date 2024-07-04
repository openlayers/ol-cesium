/// <reference types="cesium" />
export default OLImageryProvider;
declare class OLImageryProvider {
    /**
     * Special class derived from Cesium.ImageryProvider
     * that is connected to the given ol.source.TileImage.
     * @param {!ol.Map} olMap
     * @param {!ol.source.TileImage} source
     * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the
     *                                               projection of the source is not defined.
     * @constructor
     * @extends {Cesium.ImageryProvider}
     */
    constructor(olMap: ol.Map, source: ol.source.TileImage, opt_fallbackProj?: ol.proj.Projection);
    /**
     * @type {!ol.source.TileImage}
     * @private
     */
    private source_;
    /**
     * @type {?ol.proj.Projection}
     * @private
     */
    private projection_;
    /**
     * @type {?ol.proj.Projection}
     * @private
     */
    private fallbackProj_;
    /**
     * @type {boolean}
     * @private
     */
    private ready_;
    /**
     * @type {?Cesium.TilingScheme}
     * @private
     */
    private tilingScheme_;
    /**
     * @type {?Cesium.Rectangle}
     * @private
     */
    private rectangle_;
    /**
     * @type {!ol.Map}
     * @private
     */
    private map_;
    /**
     * @type {boolean}
     * @private
     */
    private shouldRequestNextLevel;
    proxy_: {
        getURL: any;
    };
    errorEvent_: import("cesium").Event<(...args: any[]) => void>;
    emptyCanvas_: HTMLCanvasElement;
    /**
     * Checks if the underlying source is ready and cached required data.
     * @private
     */
    private handleSourceChanged_;
    /**
     * Generates the proper attributions for a given position and zoom
     * level.
     * @export
     * @override
     */
    override getTileCredits(x: any, y: any, level: any): import("cesium").Credit[];
    /**
     * @export
     * @override
     */
    override requestImage(x: any, y: any, level: any): HTMLCanvasElement | Promise<import("cesium").ImageryTypes | import("cesium").CompressedTextureBuffer>;
}
