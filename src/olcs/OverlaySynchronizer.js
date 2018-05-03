/**
 * @module olcs.OverlaySynchronizer
 */
import olcsSynchronizedOverlay from './SynchronizedOverlay.js';
import * as olBase from 'ol/index.js';
import * as olEvents from 'ol/events.js';

/**
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 * @template T
 * @struct
 * @api
 */
const exports = function(map, scene) {
  /**
   * @type {!ol.Map}
   * @protected
   */
  this.map = map;

  /**
   * @type {ol.Collection.<ol.Overlay>}
   * @private
   */
  this.overlays_ = this.map.getOverlays();

  /**
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;

  /**
   * @private
   * @type {!Element}
   */
  this.overlayContainerStopEvent_ = document.createElement('DIV');
  this.overlayContainerStopEvent_.className = 'ol-overlaycontainer-stopevent';
  const overlayEvents = ['click', 'dblclick', 'mousedown', 'touchstart', 'MSPointerDown', 'pointerdown', 'mousewheel', 'wheel'];
  overlayEvents.forEach((event) => {
    olEvents.listen(this.overlayContainerStopEvent_, event, evt => evt.stopPropagation());
  });
  this.scene.canvas.parentElement.appendChild(this.overlayContainerStopEvent_);

  /**
   * @private
   * @type {!Element}
   */
  this.overlayContainer_ = document.createElement('DIV');
  this.overlayContainer_.className = 'ol-overlaycontainer';
  this.scene.canvas.parentElement.appendChild(this.overlayContainer_);


  /**
   * @type {!Object<?,olcs.SynchronizedOverlay>}
   * @private
   */
  this.overlayMap_ = {};
};



/**
 * Get the element that serves as a container for overlays that don't allow
 * event propagation. Elements added to this container won't let mousedown and
 * touchstart events through to the map, so clicks and gestures on an overlay
 * don't trigger any {@link ol.MapBrowserEvent}.
 * @return {!Element} The map's overlay container that stops events.
 */
exports.prototype.getOverlayContainerStopEvent = function() {
  return this.overlayContainerStopEvent_;
};

/**
 * Get the element that serves as a container for overlays.
 * @return {!Element} The map's overlay container.
 */
exports.prototype.getOverlayContainer = function() {
  return this.overlayContainer_;
};

/**
 * Destroy all and perform complete synchronization of the overlays.
 * @api
 */
exports.prototype.synchronize = function() {
  this.destroyAll();
  this.addOverlays();
  this.overlays_.on('add', this.addOverlayFromEvent_.bind(this));
  this.overlays_.on('remove', this.removeOverlayFromEvent_.bind(this));
};

/**
 * @param {ol.Collection.Event} event
 * @private
 */
exports.prototype.addOverlayFromEvent_ = function(event) {
  const overlay = /** @type {ol.Overlay} */ (event.element);
  this.addOverlay(overlay);
};

/**
 * @api
 */
exports.prototype.addOverlays = function() {
  this.overlays_.forEach((overlay) => { this.addOverlay(); });
};

/**
 * @param {ol.Overlay} overlay
 * @api
 */
exports.prototype.addOverlay = function(overlay) {
  if (!overlay) {
    return;
  }
  const cesiumOverlay = new olcsSynchronizedOverlay({
    scene: this.scene,
    synchronizer: this,
    parent: overlay
  });

  const overlayId = olBase.getUid(overlay).toString();
  this.overlayMap_[overlayId] = cesiumOverlay;
};

/**
 * @param {ol.Collection.Event} event
 * @private
 */
exports.prototype.removeOverlayFromEvent_ = function(event) {
  const removedOverlay = /** @type {ol.Overlay} */ (event.element);
  this.removeOverlay(removedOverlay);
};

/**
 * Removes an overlay from the scene
 * @param {ol.Overlay} overlay
 * @api
 */
exports.prototype.removeOverlay = function(overlay) {
  const overlayId = olBase.getUid(overlay).toString();
  const csOverlay = this.overlayMap_[overlayId];
  if (csOverlay) {
    csOverlay.destroy();
    delete this.overlayMap_[overlayId];
  }
};

/**
 * Destroys all the created Cesium objects.
 * @protected
 */
exports.prototype.destroyAll = function() {
  Object.keys(this.overlayMap_).forEach((key) => {
    const overlay = this.overlayMap_[key];
    overlay.destroy();
    delete this.overlayMap_[key];
  });
};



export default exports;
