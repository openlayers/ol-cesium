
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map2d',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


var ol3d = new olcs.OLCesium({map: map/*, target: 'map3d'*/});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: false
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);



/**
 * @param {!olcs.OLCesium} ol3d
 * @constructor
 */
var OlcsControl = function(ol3d) {

  /**
   * @type {!olcs.OLCesium}
   * @private
   */
  this.ol3d_ = ol3d;
};


/**
 * Almost PI / 2.
 * @const
 * @type {number}
 */
OlcsControl.MAX_TILT = 7 * Math.PI / 16;


/**
 * @const
 * @type {number}
 */
OlcsControl.MIN_TILT = 0;


/**
 * @return {ol.View}
 */
OlcsControl.prototype.getOlView = function() {
  return this.ol3d_.getOlMap().getView();
};


/**
 * @return {Array.<number>}
 */
OlcsControl.prototype.getTiltRange = function() {
  return [OlcsControl.MIN_TILT, OlcsControl.MAX_TILT];
};


/**
 * @return {number}
 */
OlcsControl.prototype.getHeading = function() {
  return this.getOlView().getRotation() || 0;
};


/**
 * @return {number|undefined}
 */
OlcsControl.prototype.getTiltOnGlobe = function() {
  var scene = this.ol3d_.getCesiumScene();
  var tiltOnGlobe = olcs.core.computeSignedTiltAngleOnGlobe(scene);
  return -tiltOnGlobe;
};


/**
 * @param {function()} callback
 */
OlcsControl.prototype.resetToNorthZenith = function(callback) {
  var scene = this.ol3d_.getCesiumScene();
  var camera = scene.camera;
  var pivot = olcs.core.pickBottomPoint(scene);

  if (!pivot) {
    callback();
    return;
  }

  var currentHeading = this.getHeading();
  var angle = olcs.core.computeAngleToZenith(scene, pivot);

  // Point to North
  olcs.core.setHeadingUsingBottomCenter(scene, currentHeading, pivot);

  // Go to zenith
  var transform = Cesium.Matrix4.fromTranslation(pivot);
  var axis = camera.right;
  var options = {callback: callback};
  olcs.core.rotateAroundAxis(camera, -angle, axis, transform, options);
};


/**
 * @param {number} angle
 */
OlcsControl.prototype.setHeading = function(angle) {
  var scene = this.ol3d_.getCesiumScene();
  var bottom = olcs.core.pickBottomPoint(scene);
  if (bottom) {
    olcs.core.setHeadingUsingBottomCenter(scene, angle, bottom);
  }
};


/**
 * @param {number} angle
 */
OlcsControl.prototype.tiltOnGlobe = function(angle) {
  var scene = this.ol3d_.getCesiumScene();
  var camera = scene.camera;
  var pivot = olcs.core.pickBottomPoint(scene);
  if (!pivot) {
    // Could not find the bottom point
    return;
  }

  var options = {};
  var transform = Cesium.Matrix4.fromTranslation(pivot);
  var axis = camera.right;
  var rotateAroundAxis = olcs.core.rotateAroundAxis;
  rotateAroundAxis(camera, -angle, axis, transform, options);
};



var control = new OlcsControl(ol3d);

