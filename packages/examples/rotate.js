import OLCesium, {computeSignedTiltAngleOnGlobe, pickBottomPoint, computeAngleToZenith, setHeadingUsingBottomCenter, rotateAroundAxis} from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {OLCS_ION_TOKEN} from './_common.js';


const map = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  target: 'map2d',
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new olView({
    center: [333333, 1500000],
    zoom: 6
  })
});


Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol3d = new OLCesium({map/*, target: 'map3d'*/});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
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
  return this.ol3d_.getOlView();
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
  const tiltOnGlobe = computeSignedTiltAngleOnGlobe(scene);
  return -tiltOnGlobe;
};


/**
 * @param {function()} callback
 */
OlcsControl.prototype.resetToNorthZenith = function(callback) {
  const scene = this.ol3d_.getCesiumScene();
  const camera = scene.camera;
  const pivot = pickBottomPoint(scene);

  if (!pivot) {
    callback();
    return;
  }

  const currentHeading = this.getHeading();
  const angle = computeAngleToZenith(scene, pivot);

  // Point to North
  setHeadingUsingBottomCenter(scene, currentHeading, pivot);

  // Go to zenith
  const transform = Cesium.Matrix4.fromTranslation(pivot);
  const axis = camera.right;
  const options = {callback};
  rotateAroundAxis(camera, -angle, axis, transform, options);
};


OlcsControl.prototype.rotate = function(angle) {
  const view = this.ol3d_.getOlView();
  const current = view.getRotation();
  view.animate({
    rotation: current + angle,
    duration: 250
  });
};


/**
 * @param {number} angle
 */
OlcsControl.prototype.setHeading = function(angle) {
  const scene = this.ol3d_.getCesiumScene();
  const bottom = pickBottomPoint(scene);
  if (bottom) {
    setHeadingUsingBottomCenter(scene, angle, bottom);
  }
};


/**
 * @param {number} angle
 */
OlcsControl.prototype.tiltOnGlobe = function(angle) {
  const scene = this.ol3d_.getCesiumScene();
  const camera = scene.camera;
  const pivot = pickBottomPoint(scene);
  if (!pivot) {
    // Could not find the bottom point
    return;
  }

  const options = {};
  const transform = Cesium.Matrix4.fromTranslation(pivot);
  const axis = camera.right;
  rotateAroundAxis(camera, -angle, axis, transform, options);
};



window['control'] = new OlcsControl(ol3d); // eslint-disable-line no-unused-vars
