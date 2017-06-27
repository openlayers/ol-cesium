
const map = new ol.Map({
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


const ol3d = new olcs.OLCesium({map/*, target: 'map3d'*/});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: false
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);



/**
 * @param {!olcs.OLCesium} ol3d
 * @constructor
 */
const OlcsControl = function(ol3d) {

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
  const scene = this.ol3d_.getCesiumScene();
  const tiltOnGlobe = olcs.core.computeSignedTiltAngleOnGlobe(scene);
  return -tiltOnGlobe;
};


/**
 * @param {function()} callback
 */
OlcsControl.prototype.resetToNorthZenith = function(callback) {
  const scene = this.ol3d_.getCesiumScene();
  const camera = scene.camera;
  const pivot = olcs.core.pickBottomPoint(scene);

  if (!pivot) {
    callback();
    return;
  }

  const currentHeading = this.getHeading();
  const angle = olcs.core.computeAngleToZenith(scene, pivot);

  // Point to North
  olcs.core.setHeadingUsingBottomCenter(scene, currentHeading, pivot);

  // Go to zenith
  const transform = Cesium.Matrix4.fromTranslation(pivot);
  const axis = camera.right;
  const options = {callback};
  olcs.core.rotateAroundAxis(camera, -angle, axis, transform, options);
};


/**
 * @param {number} angle
 */
OlcsControl.prototype.setHeading = function(angle) {
  const scene = this.ol3d_.getCesiumScene();
  const bottom = olcs.core.pickBottomPoint(scene);
  if (bottom) {
    olcs.core.setHeadingUsingBottomCenter(scene, angle, bottom);
  }
};


/**
 * @param {number} angle
 */
OlcsControl.prototype.tiltOnGlobe = function(angle) {
  const scene = this.ol3d_.getCesiumScene();
  const camera = scene.camera;
  const pivot = olcs.core.pickBottomPoint(scene);
  if (!pivot) {
    // Could not find the bottom point
    return;
  }

  const options = {};
  const transform = Cesium.Matrix4.fromTranslation(pivot);
  const axis = camera.right;
  const rotateAroundAxis = olcs.core.rotateAroundAxis;
  rotateAroundAxis(camera, -angle, axis, transform, options);
};



const control = new OlcsControl(ol3d); // eslint-disable-line no-unused-vars
