/// <reference types="cesium" />
export default class MVTImageryProvider {
    constructor(options: any);
    urls: any;
    ready: boolean;
    readyPromise: Promise<boolean>;
    tileWidth: number;
    tileHeight: number;
    maximumLevel: any;
    minimumLevel: any;
    tilingScheme: import("cesium").WebMercatorTilingScheme;
    rectangle: any;
    errorEvent: import("cesium").Event<(...args: any[]) => void>;
    credit: any;
    hasAlphaChannel: boolean;
    styleFunction_: any;
    projection_: import("ol/proj/Projection").default;
    emptyCanvas_: HTMLCanvasElement;
    tileRectangle_: import("cesium").Rectangle;
    tileCache: LRUCache<any>;
    featureCache: any;
    tileFunction_: import("ol/Tile").UrlFunction;
    getTileCredits(): any[];
    pickFeatures(): void;
    getTileFeatures(z: any, x: any, y: any): any;
    readFeaturesFromBuffer(buffer: any): import("ol/Feature").FeatureLike[];
    getUrl_(z: any, x: any, y: any): string;
    getCacheKey_(z: any, x: any, y: any): string;
    requestImage(x: any, y: any, z: any, request: any): any;
    rasterizeFeatures(features: any, styleFunction: any, resolution: any): HTMLCanvasElement;
}
import LRUCache from 'ol/structs/LRUCache.js';
