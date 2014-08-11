goog.provide('olcs.OLImageryProvider');



/**
 * Special class derived from Cesium.ImageryProvider
 * that is connected to the given ol.source.TileImage.
 * @param {!ol.source.TileImage} source
 * @constructor
 * @extends {Cesium.ImageryProvider}
 */
olcs.OLImageryProvider = function(source) {
  /**
   * @type {!ol.source.TileImage}
   * @private
   */
  this.source_ = source;

  /**
   * @type {!ol.proj.Projection}
   * @private
   */
  this.projection_ = source.getProjection();

  this.is4326_ = false;

  this.ready_ = false;

  this.errorEvent_ = new Cesium.Event();

  this.emptyCanvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.emptyCanvas_.width = 1;
  this.emptyCanvas_.height = 1;
};
goog.inherits(olcs.OLImageryProvider, Cesium.ImageryProvider);


// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(olcs.OLImageryProvider.prototype, {
  ready: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.checkReady();}
  },

  rectangle: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.rectangle_;}
  },

  tileWidth: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {
          var tg = this.source_.getTileGrid();
          return !goog.isNull(tg) ? tg.getTileSize(0) : 256;
        }
  },

  tileHeight: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.tileWidth;}
  },

  maximumLevel: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {
          var tg = this.source_.getTileGrid();
          return !goog.isNull(tg) ? tg.getMaxZoom() : 18;
        }
  },

  minimumLevel: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {
          // WARNING: Do not use the minimum level (at least until the extent is
          // properly set). Cesium assumes the minimumLevel to contain only
          // a few tiles and tries to load them all at once -- this can
          // freeze and/or crash the browser !
          return 0;
          //var tg = this.source_.getTileGrid();
          //return !goog.isNull(tg) ? tg.getMinZoom() : 0;
        }
  },

  tilingScheme: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.tilingScheme_;}
  },

  tileDiscardPolicy: {
    get: function() {return undefined;}
  },

  errorEvent: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.errorEvent_;}
  },

  credit: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.credit_;}
  },

  proxy: {
    get: function() {return undefined;}
  },

  hasAlphaChannel: {
    get: function() {return true;}
  }
});


/**
 * Checks if the underlying source just got ready and cached required data.
 * @return {boolean} Ready state.
 */
olcs.OLImageryProvider.prototype.checkReady = function() {
  if (!this.ready_ && this.source_.getState() == 'ready') {
    this.projection_ = this.source_.getProjection();

    if (this.projection_ == ol.proj.get('EPSG:4326')) {
      this.tilingScheme_ = new Cesium.GeographicTilingScheme();
      this.is4326_ = true;
    } else if (this.projection_ == ol.proj.get('EPSG:3857')) {
      this.tilingScheme_ = new Cesium.WebMercatorTilingScheme();
    } else {
      return false;
    }
    this.rectangle_ = this.tilingScheme_.rectangle;

    this.credit_ = undefined; //TODO: create from attributions

    this.ready_ = true;
  }
  return this.ready_;
};


/**
 * TODO: attributions for individual tile ranges
 * @override
 * @this {olcs.OLImageryProvider}
 */
olcs.OLImageryProvider.prototype['getTileCredits'] = function(x, y, level) {
  return undefined;
};


/**
 * @override
 * @this {olcs.OLImageryProvider}
 */
olcs.OLImageryProvider.prototype['requestImage'] =
    function(x, y, level) {
  var tileUrlFunction = this.source_.getTileUrlFunction();
  if (!goog.isNull(tileUrlFunction)) {
    var z_ = this.is4326_ ? (level + 1) : level;
    var y_ = this.is4326_ ? ((1 << level) - y - 1) : (-y - 1);
    var url = tileUrlFunction(new ol.TileCoord(z_, x, y_), 1, this.projection_);
    return goog.isDef(url) ?
           Cesium.ImageryProvider.loadImage(this, url) : this.emptyCanvas_;
  } else {
    // return empty canvas to stop Cesium from retrying later
    return this.emptyCanvas_;
  }
};

