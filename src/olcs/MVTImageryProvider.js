import MVT from 'ol/format/MVT.js';
import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import {toContext} from 'ol/render.js';
import {get as getProjection} from 'ol/proj.js';
import {VERSION as OL_VERSION} from 'ol/util.js';


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
    this.cache_ = {};
    this.styleFunction_ = options.styleFunction || (() => styles);
    this.projection_ = getProjection('EPSG:3857');
  }

  getTileCredits() {
    return [];
  }

  pickFeatures() {
  }

  requestImage(x, y, z, request) {
    if (z < this.minimumLevel) {
      return null;
    }
    const url = this.urls[0].replace('{x}', x).replace('{y}', y).replace('{z}', z);
    // stupid put everything in cache strategy
    // no throttling, no subdomains
    let promise = this.cache_[url];
    if (!promise) {
      promise = this.cache_[url] = fetch(url)
          .then(r => (r.ok ? r : Promise.reject(r)))
          .then(r => r.arrayBuffer())
          .then(buffer => this.rasterizePbfToTile(buffer, this.styleFunction_, format, this.projection_));
    }
    return promise;
  }

  rasterizePbfToTile(buffer, styleFunction) {
    const canvas = document.createElement('canvas');
    const vectorContext = toContext(canvas.getContext('2d'), {size: [this.tileWidth, this.tileHeight]});
    try {
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
      features.forEach((f) => {
        const styles = styleFunction(f);
        if (styles) {
          styles.forEach((style) => {
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(f);
          });
        }
      });
    } catch (e) {
      console.trace(e);
      this.raiseEvent('could not render pbf tile', e);
    }
    return canvas;
  }
}
