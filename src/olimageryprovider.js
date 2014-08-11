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
        function() {return this.tileSize_;}
  },

  tileHeight: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.tileSize_;}
  },

  maximumLevel: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.maximumLevel_;}
  },

  minimumLevel: {
    get: /** @this {olcs.OLImageryProvider} */
        function() {return this.minimumLevel_;}
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
    var tileGrid = this.source_.getTileGrid();
    if (!goog.isNull(tileGrid)) {
      this.tileSize_ = tileGrid.getTileSize(0);

      // WARNING: Do not use the minimum level (at least until the extent is
      // properly set). Cesium assumes the minimumLevel contains only
      // a few tiles and tries to load them all at once -- this can
      // freeze and/or crash the browser !
      this.minimumLevel_ = 0; //tileGrid.getMinZoom();
      this.maximumLevel_ = tileGrid.getMaxZoom();

      this.credit_ = undefined; //TODO: create from attributions
      this.tilingScheme_ = new Cesium.WebMercatorTilingScheme(); //TODO:
      this.rectangle_ = this.tilingScheme_.rectangle;

      this.ready_ = true;
    }
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
    var url = tileUrlFunction(new ol.TileCoord(level, x, -y - 1),
                              1, this.projection_);
    return goog.isDef(url) ?
           Cesium.ImageryProvider.loadImage(this, url) : this.emptyCanvas_;
  } else {
    // return empty canvas to stop Cesium from retrying later
    return this.emptyCanvas_;
  }
};

