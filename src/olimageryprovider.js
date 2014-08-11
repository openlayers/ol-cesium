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

  var tileGrid = source.getTileGrid();

  this.tileSize_ = !goog.isNull(tileGrid) ? tileGrid.getTileSize(0) : 256;
  this.minimumLevel_ = !goog.isNull(tileGrid) ? tileGrid.getMinZoom() : 0;
  this.maximumLevel_ = !goog.isNull(tileGrid) ? tileGrid.getMaxZoom() : 18;

  this.credit_ = undefined; //TODO: create from attributions
  this.tilingScheme_ = new Cesium.WebMercatorTilingScheme(); //TODO:
  this.rectangle_ = this.tilingScheme_.rectangle;
  this.errorEvent_ = new Cesium.Event();
};
goog.inherits(olcs.OLImageryProvider, Cesium.ImageryProvider);


// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(olcs.OLImageryProvider.prototype, {
  ready: {
    get: function() {return true;}
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
           Cesium.ImageryProvider.loadImage(this, url) : undefined;
  } else {
    //TODO: there is no way to tell Cesium to stop trying when this happens
    return undefined;
  }
};

