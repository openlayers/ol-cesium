goog.provide('ol3cesium');

goog.require('goog.dom');
goog.require('goog.events');


/**
 * @param {!ol.Map} map
 * @return {ol3cesium.Instance}
 */
ol3cesium = function(map) {
  return new ol3cesium.Instance(map);
};



/**
 * @param {!ol.Map} map
 * @constructor
 */
ol3cesium.Instance = function(map) {
  /**
   * @type {!ol.Map}
   * @private
   */
  this.map_ = map;

  var fillArea = 'position:absolute;top:0;left:0;width:100%;height:100%';

  /**
   * @type {!Element}
   * @private
   */
  this.container_ = goog.dom.createDom(goog.dom.TagName.DIV, {style: fillArea});

  /**
   * @type {!Element}
   * @private
   */
  this.canvas_ = goog.dom.createDom(goog.dom.TagName.CANVAS, {style: fillArea});
  goog.dom.appendChild(this.container_, this.canvas_);

  /**
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;

  /**
   * @type {!Cesium.Scene}
   * @private
   */
  this.scene_ = new Cesium.Scene({
    'canvas': this.canvas_,
    'scene3DOnly': true
  });

  /**
   * @type {!Cesium.Globe}
   * @private
   */
  this.globe_ = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
  this.scene_.globe = this.globe_;
  this.scene_.skyAtmosphere = new Cesium.SkyAtmosphere();

  var el = this.globe_.ellipsoid;
  this.scene_.camera.lookAt(
      el.cartographicToCartesian(new Cesium.Cartographic(0, 0, 1e7)),
      el.cartographicToCartesian(new Cesium.Cartographic(0, 0, 0)),
      new Cesium.Cartesian3(0, 0, 1)
  );

  var osm = new Cesium.OpenStreetMapImageryProvider();
  this.scene_.imageryLayers.addImageryProvider(osm);

  goog.events.listen(this.map_, 'change:target',
      this.handleMapTargetChanged_, false, this);

  var tick = goog.bind(function() {
    this.handleResize_();
    this.scene_.initializeFrame();
    this.scene_.render();
    Cesium.requestAnimationFrame(tick);
  }, this);
  Cesium.requestAnimationFrame(tick);
};


/**
 * @private
 */
ol3cesium.Instance.prototype.handleMapTargetChanged_ = function() {
  if (!this.enabled_) return;
  var vp = this.map_.getViewport();
  var oc = goog.dom.getElementByClass('ol-overlaycontainer', vp);
  goog.dom.removeNode(this.container_);
  if (oc) goog.dom.insertSiblingBefore(this.container_, oc);
};


/**
 * @private
 */
ol3cesium.Instance.prototype.handleResize_ = function() {
  var width = this.canvas_.clientWidth;
  var height = this.canvas_.clientHeight;

  if (this.canvas_.width === width && this.canvas_.height === height) {
    return;
  }

  this.canvas_.width = width;
  this.canvas_.height = height;
  this.scene_.camera.frustum.aspectRatio = width / height;
};


/**
 * @return {boolean}
 */
ol3cesium.Instance.prototype.getEnabled = function() {
  return this.enabled_;
};


/**
 * @param {boolean=} opt_enable
 */
ol3cesium.Instance.prototype.setEnabled = function(opt_enable) {
  this.enabled_ = opt_enable !== false;
  if (this.enabled_) {
    this.handleMapTargetChanged_();
  } else {
    goog.dom.removeNode(this.container_);
  }
};


goog.exportSymbol('ol3cesium', ol3cesium);
goog.exportSymbol('ol3cesium.Instance.prototype.getEnabled',
                  ol3cesium.Instance.prototype.getEnabled);
goog.exportSymbol('ol3cesium.Instance.prototype.setEnabled',
                  ol3cesium.Instance.prototype.setEnabled);
