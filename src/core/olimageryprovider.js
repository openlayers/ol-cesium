goog.provide('olcs.core.OLImageryProvider');

goog.require('ol.events');
goog.require('ol.proj');



/**
 * Special class derived from Cesium.ImageryProvider
 * that is connected to the given ol.source.TileImage.
 * @param {!ol.source.TileImage} source
 * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the
 *                                               projection of the source
 *                                               is not defined.
 * @constructor
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
   * @type {?ol.proj.Projection}
   * @private
   */
  this.fallbackProj_ = opt_fallbackProj || null;

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

  this.source_.on(ol.events.EventType.CHANGE, function(e) {
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
          return tg ? tg.getTileSize(0) : 256;
        }
  },

  'tileHeight': {
    'get': /** @this {olcs.core.OLImageryProvider} */
        function() {return this.tileWidth;}
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
    const proj = this.source_.getProjection();
    this.projection_ = proj ? proj : this.fallbackProj_;
    if (this.projection_ == ol.proj.get('EPSG:4326')) {
      this.tilingScheme_ = new Cesium.GeographicTilingScheme();
    } else if (this.projection_ == ol.proj.get('EPSG:3857')) {
      this.tilingScheme_ = new Cesium.WebMercatorTilingScheme();
    } else {
      return;
    }
    this.rectangle_ = this.tilingScheme_.rectangle;

    const credit =
        olcs.core.OLImageryProvider.createCreditForSource(this.source_);
    this.credit_ = credit || undefined;

    this.ready_ = true;
  }
};


/**
 * Tries to create proper Cesium.Credit for
 * the given ol.source.Source as closely as possible.
 * @param {!ol.source.Source} source
 * @return {?Cesium.Credit}
 */
olcs.core.OLImageryProvider.createCreditForSource = function(source) {
  let text = '';
  const attributions = source.getAttributions();
  if (attributions) {
    attributions.forEach((el) => {
      // strip html tags (not supported in Cesium)
      text += `${el.getHTML().replace(/<\/?[^>]+(>|$)/g, '')} `;
    });
  }

  let imageUrl, link;
  if (text.length == 0) {
    // only use logo if no text is specified
    // otherwise the Cesium will automatically skip the text:
    // "The text to be displayed on the screen if no imageUrl is specified."
    const logo = source.getLogo();
    if (logo) {
      if (typeof logo == 'string') {
        imageUrl = logo;
      } else {
        imageUrl = logo.src;
        link = logo.href;
      }
    }
  }

  return (imageUrl || text.length > 0) ?
         new Cesium.Credit(text, imageUrl, link) : null;
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
  const tileUrlFunction = this.source_.getTileUrlFunction();
  if (tileUrlFunction && this.projection_) {

    // Perform mapping of Cesium tile coordinates to OpenLayers tile coordinates:
    // 1) Cesium zoom level 0 is OpenLayers zoom level 1 for EPSG:4326
    const z_ = this.tilingScheme_ instanceof Cesium.GeographicTilingScheme ?
        level + 1 : level;
    // 2) OpenLayers tile coordinates increase from bottom to top
    const y_ = -y - 1;

    let url = tileUrlFunction.call(this.source_,
        [z_, x, y_], 1, this.projection_);
    if (this.proxy_) {
      url = this.proxy_.getURL(url);
    }
    return url ? Cesium.ImageryProvider.loadImage(this, url) : this.emptyCanvas_;
  } else {
    // return empty canvas to stop Cesium from retrying later
    return this.emptyCanvas_;
  }
};
