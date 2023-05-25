/**
 * @module olcs.core.OLImageryProvider
 */
import {Tile as TileSource} from 'ol/source.js';
import {attributionsFunctionToCredits} from '../core.ts';
import {getSourceProjection} from '../util.js';

const olUseNewCoordinates = (function () {
  const tileSource = new TileSource({
    projection: 'EPSG:3857',
    wrapX: true,
  });
  const tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
  return tileCoord && tileCoord[1] === 33 && tileCoord[2] === 22;
  // See b/test/spec/ol/source/tile.test.js
  // of e9a30c5cb7e3721d9370025fbe5472c322847b35 in OpenLayers repository
})();

class OLImageryProvider /* should not extend Cesium.ImageryProvider */ {
  /**
   * Special class derived from Cesium.ImageryProvider
   * that is connected to the given ol.source.TileImage.
   * @param {!ol.Map} olMap
   * @param {!ol.source.TileImage} source
   * @param {ol.proj.Projection} [opt_fallbackProj] Projection to assume if the
   *                                               projection of the source is not defined.
   * @class
   * @extends {Cesium.ImageryProvider}
   */
  constructor(olMap, source, opt_fallbackProj) {
    // Do not extend or call super constructor from
    // Cesium.ImageryProvider since this particular function is a
    // 'non instanciable interface' which throws on instanciation.

    /**
     * @type {!ol.source.TileImage}
     * @private
     */
    this.source_ = source;

    /**
     * @type {?ol.proj.Projection}
     * @private
     */
    this.projection_ = null;

    /**
     * @type {?ol.proj.Projection}
     * @private
     */
    this.fallbackProj_ = opt_fallbackProj || null;

    /**
     * @type {boolean}
     * @private
     */
    this.ready_ = false;

    /**
     * @type {?Cesium.TilingScheme}
     * @private
     */
    this.tilingScheme_ = null;

    /**
     * @type {?Cesium.Rectangle}
     * @private
     */
    this.rectangle_ = null;

    /**
     * @type {!ol.Map}
     * @private
     */
    this.map_ = olMap;

    /**
     * @type {boolean}
     * @private
     */
    this.shouldRequestNextLevel = false;

    const proxy = this.source_.get('olcs.proxy');
    if (proxy) {
      if (typeof proxy === 'function') {
        this.proxy_ = {
          getURL: proxy,
        };
      } else if (typeof proxy === 'string') {
        this.proxy_ = new Cesium.DefaultProxy(proxy);
      }
    }

    this.errorEvent_ = new Cesium.Event();

    this.emptyCanvas_ = document.createElement('canvas');
    this.emptyCanvas_.width = 1;
    this.emptyCanvas_.height = 1;

    this.source_.on('change', (e) => {
      this.handleSourceChanged_();
    });
    this.handleSourceChanged_();
  }

  /**
   * Checks if the underlying source is ready and cached required data.
   * @param frameState
   * @private
   */
  handleSourceChanged_(frameState) {
    if (!this.ready_ && this.source_.getState() == 'ready') {
      this.projection_ =
        getSourceProjection(this.source_) || this.fallbackProj_;
      const options = {numberOfLevelZeroTilesX: 1, numberOfLevelZeroTilesY: 1};

      if (this.source_.tileGrid !== null) {
        // Get the number of tiles at level 0 if it is defined
        this.source_.tileGrid.forEachTileCoord(
          this.projection_.getExtent(),
          0,
          ([zoom, xIndex, yIndex]) => {
            options.numberOfLevelZeroTilesX = xIndex + 1;
            options.numberOfLevelZeroTilesY = yIndex + 1;
          }
        );
      }

      if (this.projection_.getCode() === 'EPSG:4326') {
        // Cesium zoom level 0 is OpenLayers zoom level 1 for layer in EPSG:4326 with a single tile on level 0
        this.shouldRequestNextLevel =
          options.numberOfLevelZeroTilesX === 1 &&
          options.numberOfLevelZeroTilesY === 1;
        this.tilingScheme_ = new Cesium.GeographicTilingScheme(options);
      } else if (this.projection_.getCode() === 'EPSG:3857') {
        this.shouldRequestNextLevel = false;
        this.tilingScheme_ = new Cesium.WebMercatorTilingScheme(options);
      } else {
        return;
      }
      this.rectangle_ = this.tilingScheme_.rectangle;

      this.ready_ = true;
    }
  }

  /**
   * Generates the proper attributions for a given position and zoom
   * level.
   * @override
   */
  getTileCredits(x, y, level) {
    const attributionsFunction = this.source_.getAttributions();
    if (!attributionsFunction) {
      return [];
    }
    const extent = this.map_.getView().calculateExtent(this.map_.getSize());
    const center = this.map_.getView().getCenter();
    const zoom = this.shouldRequestNextLevel ? level + 1 : level;
    return attributionsFunctionToCredits(
      attributionsFunction,
      zoom,
      center,
      extent
    );
  }

  /**
   * @override
   */
  requestImage(x, y, level) {
    const tileUrlFunction = this.source_.getTileUrlFunction();
    if (tileUrlFunction && this.projection_) {
      const z_ = this.shouldRequestNextLevel ? level + 1 : level;

      let y_ = y;
      if (!olUseNewCoordinates) {
        // OpenLayers version 3 to 5 tile coordinates increase from bottom to top
        y_ = -y - 1;
      }
      let url = tileUrlFunction.call(
        this.source_,
        [z_, x, y_],
        1,
        this.projection_
      );
      if (this.proxy_) {
        url = this.proxy_.getURL(url);
      }
      return url
        ? Cesium.ImageryProvider.loadImage(this, url)
        : this.emptyCanvas_;
    }
    // return empty canvas to stop Cesium from retrying later
    return this.emptyCanvas_;
  }
}

// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(OLImageryProvider.prototype, {
  ready: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      return this.ready_;
    },
  },

  _ready: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      return this.ready_;
    },
  },

  rectangle: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      return this.rectangle_;
    },
  },

  tileWidth: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      const tg = this.source_.getTileGrid();
      return tg
        ? Array.isArray(tg.getTileSize(0))
          ? tg.getTileSize(0)[0]
          : tg.getTileSize(0)
        : 256;
    },
  },

  tileHeight: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      const tg = this.source_.getTileGrid();
      return tg
        ? Array.isArray(tg.getTileSize(0))
          ? tg.getTileSize(0)[1]
          : tg.getTileSize(0)
        : 256;
    },
  },

  maximumLevel: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      const tg = this.source_.getTileGrid();
      return tg ? tg.getMaxZoom() : 18;
    },
  },

  minimumLevel: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      // WARNING: Do not use the minimum level (at least until the extent is
      // properly set). Cesium assumes the minimumLevel to contain only
      // a few tiles and tries to load them all at once -- this can
      // freeze and/or crash the browser !
      return 0;
      //var tg = this.source_.getTileGrid();
      //return tg ? tg.getMinZoom() : 0;
    },
  },

  tilingScheme: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      return this.tilingScheme_;
    },
  },

  tileDiscardPolicy: {
    get() {
      return undefined;
    },
  },

  errorEvent: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      return this.errorEvent_;
    },
  },

  proxy: {
    /** @this {olcs.core.OLImageryProvider} */
    get() {
      return this.proxy_;
    },
  },

  hasAlphaChannel: {
    get() {
      return true;
    },
  },

  pickFeatures: {
    get() {
      return undefined;
    },
  },
});

export default OLImageryProvider;
