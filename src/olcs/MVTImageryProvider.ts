import MVT from 'ol/format/MVT.js';
import Style, {type StyleFunction} from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import {toContext} from 'ol/render.js';
import {get as getProjection} from 'ol/proj.js';
import {VERSION as OL_VERSION} from 'ol/util.js';
import LRUCache from 'ol/structs/LRUCache.js';
import {getForProjection as getTilegridForProjection} from 'ol/tilegrid.js';
import {createFromTemplates as createTileUrlFunctions} from 'ol/tileurlfunction.js';
import type {Credit, Event, ImageryLayerFeatureInfo, ImageryProvider, ImageryTypes, Proxy, Rectangle, Request, TileDiscardPolicy, TilingScheme} from 'cesium';
import type {UrlFunction} from 'ol/Tile.js';
import RenderFeature from 'ol/render/Feature.js';
import {createEmptyCanvas} from './core/OLImageryProvider';


export interface MVTOptions {
  urls: string[],
  rectangle: Rectangle,
  credit: Credit,
  styleFunction: StyleFunction,
  cacheSize?: number,
  featureCache?: LRUCache<Promise<RenderFeature[]>>
  minimumLevel: number
}

const format = new MVT({
  featureClass: RenderFeature
});

const styles = [new Style({
  stroke: new Stroke({
    color: 'blue',
    width: 2
  })
})];


export default class MVTImageryProvider implements ImageryProvider {
  private urls: string[];
  private emptyCanvas_: HTMLCanvasElement = createEmptyCanvas();
  private emptyCanvasPromise_: Promise<HTMLCanvasElement> = Promise.resolve(this.emptyCanvas_);
  private tilingScheme_ = new Cesium.WebMercatorTilingScheme;
  private ready_ = true;
  private rectangle_: Rectangle;
  private tileRectangle_: Rectangle;
  readonly tileWidth = 256;
  readonly tileHeight = 256;
  readonly maximumLevel = 20;
  private minimumLevel_ = 0;
  get minimumLevel(): number {
    return this.minimumLevel_;
  }
  private featureCache: LRUCache<Promise<RenderFeature[]>>;
  private tileCache: LRUCache<Promise<HTMLCanvasElement>>;
  private tileFunction_: UrlFunction;
  private styleFunction_: StyleFunction;
  private projection_ = getProjection('EPSG:3857');

  /**
 * When <code>true</code>, this model is ready to render, i.e., the external binary, image,
 * and shader files were downloaded and the WebGL resources were created.
 */
  get ready(): boolean {
    return this.ready_;
  }

  /**
 * Gets the rectangle, in radians, of the imagery provided by the instance.
 */
  get rectangle() {
    return this.rectangle_;
  }

  /**
   * Gets the tiling scheme used by the provider.
   */
  get tilingScheme(): TilingScheme {
    return this.tilingScheme_;
  }

  /**
   * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of {@link Cesium.TileProviderError}.
   */
  readonly errorEvent: Event = new Cesium.Event();

  /**
   * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
   * the source of the imagery.
   */
  readonly credit: Credit;

  getTileCredits(x: number, y: number, level: number): Credit[] {
    return [];
  }

  /**
   * Gets the proxy used by this provider.
   */
  readonly proxy: Proxy;

  get _ready(): boolean {
    return this.ready_;
  }

  /**
   * Gets the tile discard policy.  If not undefined, the discard policy is responsible
   * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
   * returns undefined, no tiles are filtered.
   */
  get tileDiscardPolicy(): TileDiscardPolicy {
    return undefined;
  }

  // FIXME: this might be exposed
  /**
   * Gets a value indicating whether or not the images provided by this imagery provider
   * include an alpha channel.  If this property is false, an alpha channel, if present, will
   * be ignored.  If this property is true, any images without an alpha channel will be treated
   * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
   * and texture upload time are reduced.
   */
  get hasAlphaChannel() {
    return true;
  }

  // FIXME: this could be implemented by proxying to OL
  /**
   * Asynchronously determines what features, if any, are located at a given longitude and latitude within
   * a tile.
   * This function is optional, so it may not exist on all ImageryProviders.
   * @param x - The tile X coordinate.
   * @param y - The tile Y coordinate.
   * @param level - The tile level.
   * @param longitude - The longitude at which to pick features.
   * @param latitude - The latitude at which to pick features.
   * @return A promise for the picked features that will resolve when the asynchronous
   *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
   *                   instances.  The array may be empty if no features are found at the given location.
   *                   It may also be undefined if picking is not supported.
   */
  pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<ImageryLayerFeatureInfo[]> | undefined {
    return undefined;
  }

  constructor(options: MVTOptions) {
    this.urls = options.urls;
    this.rectangle_ = options.rectangle || this.tilingScheme.rectangle;
    this.credit = options.credit;
    this.styleFunction_ = options.styleFunction || (() => styles);
    this.tileRectangle_ = new Cesium.Rectangle();
    // to avoid too frequent cache grooming we allow x2 capacity
    const cacheSize = options.cacheSize !== undefined ? options.cacheSize : 50;
    this.tileCache = new LRUCache(cacheSize);
    this.featureCache = options.featureCache || new LRUCache(cacheSize);
    this.minimumLevel_ = options.minimumLevel || 0;
    const tileGrid = getTilegridForProjection(this.projection_);
    this.tileFunction_ = createTileUrlFunctions(this.urls, tileGrid);
  }

  private getTileFeatures(z: number, x: number, y: number): Promise<RenderFeature[]> {
    const cacheKey = this.getCacheKey_(z, x, y);
    let promise;
    if (this.featureCache.containsKey(cacheKey)) {
      promise = this.featureCache.get(cacheKey);
    }
    if (!promise) {
      const url = this.getUrl_(z, x, y);
      promise = fetch(url)
          .then(r => (r.ok ? r : Promise.reject(r)))
          .then(r => r.arrayBuffer())
          .then(buffer => this.readFeaturesFromBuffer(buffer));
      this.featureCache.set(cacheKey, promise);
      if (this.featureCache.getCount() > 2 * this.featureCache.highWaterMark) {
        while (this.featureCache.canExpireCache()) {
          this.featureCache.pop();
        }
      }
    }
    return promise;
  }

  readFeaturesFromBuffer(buffer: ArrayBuffer): RenderFeature[] {
    let options;
    if (OL_VERSION <= '6.4.4') {
      // See https://github.com/openlayers/openlayers/pull/11540
      options = {
        extent: [0, 0, 4096, 4096],
        dataProjection: this.projection_,
        featureProjection: this.projection_
      };
    }
    const features = format.readFeatures(buffer, options) as RenderFeature[];
    const scaleFactor = this.tileWidth / 4096;
    features.forEach((f) => {
      const flatCoordinates = f.getFlatCoordinates();
      let flip = false;
      for (let i = 0; i < flatCoordinates.length; ++i) {
        flatCoordinates[i] *= scaleFactor;
        if (flip) {
          // FIXME: why do we need this now?
          flatCoordinates[i] = this.tileWidth - flatCoordinates[i];
        }
        if (OL_VERSION <= '6.4.4') {
          // LEGACY
          flip = !flip;
        }
      }
    });

    return features;
  }

  private getUrl_(z: number, x: number, y: number): string {
    // FIXME: probably we should not pass 1 as pixelRatio
    const url = this.tileFunction_([z, x, y], 1, this.projection_);
    return url;
  }

  private getCacheKey_(z: number, x: number, y: number) {
    return `${z}_${x}_${y}`;
  }

  requestImage(x: number, y: number, z: number, request?: Request): Promise<ImageryTypes> | undefined {
    if (z < this.minimumLevel_) {
      return this.emptyCanvasPromise_;
    }

    try {
      const cacheKey = this.getCacheKey_(z, x, y);
      let promise;
      if (this.tileCache.containsKey(cacheKey)) {
        promise = this.tileCache.get(cacheKey);
      }
      if (!promise) {
        promise = this.getTileFeatures(z, x, y)
            .then((features) => {
            // FIXME: here we suppose the 2D projection is in meters
              this.tilingScheme.tileXYToNativeRectangle(x, y, z, this.tileRectangle_);
              const resolution = (this.tileRectangle_.east - this.tileRectangle_.west) / this.tileWidth;
              return this.rasterizeFeatures(features, this.styleFunction_, resolution);
            });
        this.tileCache.set(cacheKey, promise);
        if (this.tileCache.getCount() > 2 * this.tileCache.highWaterMark) {
          while (this.tileCache.canExpireCache()) {
            this.tileCache.pop();
          }
        }
      }
      return promise;
    } catch (e) {
      console.trace(e);
      // FIXME: open PR on Cesium to fix incorrect typing
      // @ts-ignore
      this.errorEvent.raiseEvent('could not render pbf to tile', e);
    }
  }

  rasterizeFeatures(features: RenderFeature[], styleFunction: StyleFunction, resolution: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const vectorContext = toContext(canvas.getContext('2d'), {size: [this.tileWidth, this.tileHeight]});
    features.forEach((f) => {
      const styles = styleFunction(f, resolution);
      if (styles) {
        if (Array.isArray(styles)) {
          styles.forEach((style) => {
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(f);
          });
        } else {
          vectorContext.setStyle(styles);
          vectorContext.drawGeometry(f);
        }
      }
    });
    return canvas;
  }
}
