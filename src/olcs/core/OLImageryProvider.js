/**
 * @module olcs.core.OLImageryProvider
 */
import {get as getProjection} from 'ol/proj.js';
import olcsUtil from '../util.js';
import {ENABLE_RASTER_REPROJECTION} from 'ol/reproj/common';
import olTileState from 'ol/TileState';
import {listen, unlistenByKey} from 'ol/events';
import {Tile as TileSource} from 'ol/source.js';


const olUseNewCoordinates = (function() {
  const tileSource = new TileSource({
    projection: 'EPSG:3857',
    wrapX: true
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
   * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the
   *                                               projection of the source is not defined.
   * @constructor
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

    const proxy = this.source_.get('olcs.proxy');
    if (proxy) {
      if (typeof proxy === 'function') {
        this.proxy_ = {
          'getURL': proxy
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
   * @private
   */
  handleSourceChanged_(frameState) {
    if (!this.ready_ && this.source_.getState() == 'ready') {
      this.projection_ = olcsUtil.getSourceProjection(this.source_) || this.fallbackProj_;
      if (this.projection_ == getProjection('EPSG:4326')) {
        this.tilingScheme_ = new Cesium.GeographicTilingScheme();
      } else if (this.projection_ == getProjection('EPSG:3857')) {
        this.tilingScheme_ = new Cesium.WebMercatorTilingScheme();
      } else if (ENABLE_RASTER_REPROJECTION) {
        this.tilingScheme_ = new Cesium.GeographicTilingScheme();
        this.projection_ = getProjection('EPSG:4326');
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
   * @export
   * @override
   */
  getTileCredits(x, y, level) {
    const extent = this.map_.getView().calculateExtent(this.map_.getSize());
    const center = this.map_.getView().getCenter();
    const zoom = this.tilingScheme_ instanceof Cesium.GeographicTilingScheme ? level + 1 : level;

    const frameState = {
      viewState: {zoom, center},
      extent,
    };

    const attributionsFunction = this.source_.getAttributions();
    if (!attributionsFunction) {
      return [];
    }
    let attributions = attributionsFunction(frameState);
    if (!Array.isArray(attributions)) {
      attributions = [attributions];
    }

    return attributions.map(html => new Cesium.Credit(html, true));
  }

  /**
   * @export
   * @override
   */
  requestImage(x, y, level) {
    // Perform mapping of Cesium tile coordinates to ol3 tile coordinates:
    // 1) Cesium zoom level 0 is OpenLayers zoom level 1 for EPSG:4326
    const z_ = this.tilingScheme_ instanceof Cesium.GeographicTilingScheme ? level + 1 : level;
    // 2) OpenLayers tile coordinates increase from bottom to top
      let y_ = y;
      if (!olUseNewCoordinates) {
        // OpenLayers version 3 to 5 tile coordinates increase from bottom to top
        y_ = -y - 1;
      }

    const tilegrid = this.source_.getTileGridForProjection(this.projection_);
    if (z_ < tilegrid.getMinZoom() || z_ > tilegrid.getMaxZoom()) {
      return Promise.resolve(this.emptyCanvas_); // no data
    }

    const tile = this.source_.getTile(z_, x, y_, 1, this.projection_);

    tile.load();

    // not yet loaded!
    // const image = tile.getImage();
    // if (!image || !image.src) {
    //   return this.emptyCanvas_; // no data
    // }


    const state = tile.getState();
    if (state === olTileState.LOADED || state === olTileState.EMPTY) {
      return Promise.resolve(tile.getImage()) || undefined;
    } else if (state === olTileState.ERROR) {
      return undefined; // let Cesium continue retrieving later
    } else {
      const promise = new Promise((resolve, reject) => {
        const unlisten = listen(tile, 'change', (evt) => {
          const state = tile.getState();
          if (state === olTileState.LOADED || state === olTileState.EMPTY) {
            resolve(tile.getImage() || undefined);
            unlistenByKey(unlisten);
          } else if (state === olTileState.ERROR) {
            resolve(undefined); // let Cesium continue retrieving later
            unlistenByKey(unlisten);
          }
        });
      });
      return promise;
    }
  }
}

// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(OLImageryProvider.prototype, {
  'ready': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.ready_;}
  },

  'rectangle': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.rectangle_;}
  },

  'tileWidth': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {
          const tg = this.source_.getTileGrid();
          return tg ? (Array.isArray(tg.getTileSize(0)) ? tg.getTileSize(0)[0] : tg.getTileSize(0)) : 256;
        }
  },

  'tileHeight': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {
          const tg = this.source_.getTileGrid();
          return tg ? (Array.isArray(tg.getTileSize(0)) ? tg.getTileSize(0)[1] : tg.getTileSize(0)) : 256;
        }
  },

  'maximumLevel': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {
          const tg = this.source_.getTileGrid();
          return tg ? tg.getMaxZoom() : 18;
        }
  },

  'minimumLevel': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {
          // WARNING: Do not use the minimum level (at least until the extent is
          // properly set). Cesium assumes the minimumLevel to contain only
          // a few tiles and tries to load them all at once -- this can
          // freeze and/or crash the browser !
          return 0;
          //var tg = this.source_.getTileGrid();
          //return tg ? tg.getMinZoom() : 0;
        }
  },

  'tilingScheme': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.tilingScheme_;}
  },

  'tileDiscardPolicy': {
    'get': function() {return undefined;}
  },

  'errorEvent': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.errorEvent_;}
  },

  'proxy': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.proxy_;}
  },

  'hasAlphaChannel': {
    'get': function() {return true;}
  },

  'pickFeatures': {
    'get': function() {return undefined;}
  }
});


export default OLImageryProvider;
