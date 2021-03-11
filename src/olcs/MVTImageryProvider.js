import MVT from 'ol/format/MVT.js';
import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import {toContext} from 'ol/render.js';
import {get as getProjection} from 'ol/proj.js';
import {VERSION as OL_VERSION} from 'ol/util.js';
import LRUCache from 'ol/structs/LRUCache.js';
import {getForProjection as getTilegridForProjection} from 'ol/tilegrid.js';
import {createFromTemplates as createTileUrlFunctions} from 'ol/tileurlfunction.js';


const format = new MVT();
const styles = [new Style({
  stroke: new Stroke({
    color: 'blue',
    width: 2
  })
})];


export default class MVTImageryProvider {
  constructor(options) {
    this.urls = options.urls;
    this.ready = true;
    this.readyPromise = Promise.resolve(true);
    this.tileWidth = 256;
    this.tileHeight = 256;
    this.maximumLevel = options.maximumLevel || 20;
    this.minimumLevel = options.minimumLevel || 0;
    this.tilingScheme = new Cesium.WebMercatorTilingScheme;
    this.rectangle = options.rectangle || this.tilingScheme.rectangle;
    this.errorEvent = new Cesium.Event();
    this.credit = options.credit;
    this.hasAlphaChannel = true;
    this.styleFunction_ = options.styleFunction || (() => styles);
    this.projection_ = getProjection('EPSG:3857');
    this.emptyCanvas_ = document.createElement('canvas');
    this.emptyCanvas_.width = 1;
    this.emptyCanvas_.height = 1;
    this.tileRectangle_ = new Cesium.Rectangle();
    const cacheSize = options.cacheSize !== undefined ? options.cacheSize : 50;
    this.tileCache = new LRUCache(cacheSize);
    this.featureCache = options.featureCache || new LRUCache(cacheSize);
    // to avoid too frequent cache grooming we allow x2 capacity

    const tileGrid = getTilegridForProjection(this.projection_);
    this.tileFunction_ = createTileUrlFunctions(this.urls, tileGrid);
  }

  getTileCredits() {
    return [];
  }

  pickFeatures() {
  }


  getTileFeatures(z, x, y) {
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

  readFeaturesFromBuffer(buffer) {
    let options;
    if (OL_VERSION <= '6.4.4') {
      // See https://github.com/openlayers/openlayers/pull/11540
      options = {
        extent: [0, 0, 4096, 4096],
        dataProjection: format.dataProjection,
        featureProjection: format.dataProjection
      };
    }
    const features = format.readFeatures(buffer, options);
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
          flip = !flip;
        }
      }
    });

    return features;
  }

  getUrl_(z, x, y) {
    const url = this.tileFunction_([z, x, y]);
    return url;
  }

  getCacheKey_(z, x, y) {
    return `${z}_${x}_${y}`;
  }

  requestImage(x, y, z, request) {
    if (z < this.minimumLevel) {
      return this.emptyCanvas_;
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
      this.raiseEvent('could not render pbf to tile', e);
    }
  }

  rasterizeFeatures(features, styleFunction, resolution) {
    const canvas = document.createElement('canvas');
    const vectorContext = toContext(canvas.getContext('2d'), {size: [this.tileWidth, this.tileHeight]});
    features.forEach((f) => {
      const styles = styleFunction(f, resolution);
      if (styles) {
        styles.forEach((style) => {
          vectorContext.setStyle(style);
          vectorContext.drawGeometry(f);
        });
      }
    });
    return canvas;
  }
}
