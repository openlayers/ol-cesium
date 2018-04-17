goog.provide('olcs.core.OLImageryProvider');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.proj');
goog.require('ol.TileState');

goog.require('olcs.util');



/**
 * Special class derived from Cesium.ImageryProvider that is connected to the given ol.source.TileImage.
 * @param {!ol.source.TileImage} source
 * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the projection of the source is not defined.
 * @constructor
 * @struct
 * @extends {Cesium.ImageryProvider}
 */
olcs.core.OLImageryProvider = function(source, opt_fallbackProj) {
  // Do not ol.inherit() or call super constructor from
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
   * @type {Cesium.Rectangle|undefined}
   * @private
   */
  this.rectangle_ = undefined;

  /**
   * @type {Cesium.TilingScheme|undefined}
   * @private
   */
  this.tilingScheme_ = undefined;

  /**
   * @type {Cesium.Credit|undefined}
   * @private
   */
  this.credit_ = undefined;

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

  this.source_.on('change', function(e) {
    this.handleSourceChanged_();
  }, this);
  this.handleSourceChanged_();
};


// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(olcs.core.OLImageryProvider.prototype, {
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

  'credit': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.credit_;}
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


/**
 * Checks if the underlying source is ready and cached required data.
 * @private
 */
olcs.core.OLImageryProvider.prototype.handleSourceChanged_ = function() {
  if (!this.ready_ && this.source_.getState() == 'ready') {
    this.projection_ = olcs.util.getSourceProjection(this.source_) || this.fallbackProj_;
    if (this.projection_ == ol.proj.get('EPSG:4326')) {
      this.tilingScheme_ = new Cesium.GeographicTilingScheme();
    } else if (this.projection_ == ol.proj.get('EPSG:3857')) {
      this.tilingScheme_ = new Cesium.WebMercatorTilingScheme();
    } else if (ol.ENABLE_RASTER_REPROJECTION) {
      this.tilingScheme_ = new Cesium.GeographicTilingScheme();
      this.projection_ = ol.proj.get('EPSG:4326'); // reproject
    } else {
      return;
    }

    // FIXME: should intersect with the source extent
    this.rectangle_ = this.tilingScheme_.rectangle;

    this.credit_ = olcs.core.OLImageryProvider.createCreditForSource(this.source_);
    this.ready_ = true;
  }
};


/**
 * Try to create proper Cesium.Credit for the given ol.source.Source as closely as possible.
 * @param {!ol.source.Source} source
 * @return {?Cesium.Credit}
 */
olcs.core.OLImageryProvider.createCreditForSource = function(source) {
  let text = '';
  let attributions = source.getAttributions();
  if (typeof attributions === 'function') {
    attributions = attributions();
  }
  if (attributions) {
    attributions.forEach((htmlOrAttr) => {
      const html = typeof htmlOrAttr === 'string' ? htmlOrAttr : htmlOrAttr.getHTML();
      text += html;
    });
  }

  return text.length > 0 ? new Cesium.Credit(text, true) : null;
};


/**
 * TODO: attributions for individual tile ranges
 * @export
 * @override
 */
olcs.core.OLImageryProvider.prototype.getTileCredits = function(x, y, level) {
  return undefined;
};


/**
 * @export
 * @override
 */
olcs.core.OLImageryProvider.prototype.requestImage = function(x, y, level) {
  // Perform mapping of Cesium tile coordinates to ol3 tile coordinates:
  // 1) Cesium zoom level 0 is OpenLayers zoom level 1 for EPSG:4326
  const z_ = this.tilingScheme_ instanceof Cesium.GeographicTilingScheme ? level + 1 : level;
  // 2) OpenLayers tile coordinates increase from bottom to top
  const y_ = -y - 1;

  const tilegrid = this.source_.getTileGridForProjection(this.projection_);
  if (z_ < tilegrid.getMinZoom() || z_ > tilegrid.getMaxZoom()) {
    return Promise.resolve(this.emptyCanvas_); // no data
  }

  const tile = this.source_.getTile(z_, x, y_, 1, this.projection_);

  tile.load();

  // not yet loaded!
  // const image = tile.getImage();
  // if (!image || !image.src) {
  //   return Promise.resolve(this.emptyCanvas_); // no data
  // }


  const state = tile.getState();
  if (state === ol.TileState.LOADED || state === ol.TileState.EMPTY) {
    return Promise.resolve(tile.getImage()) || undefined;
  } else if (state === ol.TileState.ERROR) {
    return undefined; // let Cesium continue retrieving later
  } else {
    const promise = new Promise((resolve, reject) => {
      const unlisten = ol.events.listen(tile, 'change', (evt) => {
        const state = tile.getState();
        if (state === ol.TileState.LOADED || state === ol.TileState.EMPTY) {
          resolve(tile.getImage() || undefined);
          ol.events.unlistenByKey(unlisten);
        } else if (state === ol.TileState.ERROR) {
          resolve(undefined); // let Cesium continue retrieving later
          ol.events.unlistenByKey(unlisten);
        }
      });
    });
    return promise;
  }
};
