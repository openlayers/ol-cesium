goog.provide('olcs.OverlaySynchronizer');

goog.require('olcs.SynchronizedOverlay');

goog.require('ol');
goog.require('ol.events');

/**
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 * @template T
 * @struct
 * @api
 */
olcs.OverlaySynchronizer = function(map, scene) {
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
  const overlayEvents = [
    ol.events.EventType.CLICK,
    ol.events.EventType.DBLCLICK,
    ol.events.EventType.MOUSEDOWN,
    ol.events.EventType.TOUCHSTART,
    ol.events.EventType.MSPOINTERDOWN,
    ol.MapBrowserEventType.POINTERDOWN,
    ol.events.EventType.MOUSEWHEEL,
    ol.events.EventType.WHEEL
  ];
  overlayEvents.forEach((event) => {
    ol.events.listen(this.overlayContainerStopEvent_, event, ol.events.Event.stopPropagation);
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
olcs.OverlaySynchronizer.prototype.getOverlayContainerStopEvent = function() {
  return this.overlayContainerStopEvent_;
};

/**
 * Get the element that serves as a container for overlays.
 * @return {!Element} The map's overlay container.
 */
olcs.OverlaySynchronizer.prototype.getOverlayContainer = function() {
  return this.overlayContainer_;
};

/**
 * Destroy all and perform complete synchronization of the overlays.
 * @api
 */
olcs.OverlaySynchronizer.prototype.synchronize = function() {
  this.destroyAll();
  this.addOverlays();
  this.overlays_.on('add', this.addOverlayFromEvent_.bind(this));
  this.overlays_.on('remove', this.removeOverlayFromEvent_.bind(this));
};

/**
 * @param {ol.Collection.Event} event
 * @private
 */
olcs.OverlaySynchronizer.prototype.addOverlayFromEvent_ = function(event) {
  const overlay = /** @type {ol.Overlay} */ (event.element);
  this.addOverlay(overlay);
};

/**
 * @api
 */
olcs.OverlaySynchronizer.prototype.addOverlays = function() {
  this.overlays_.forEach(this.addOverlay, this);
};

/**
 * @param {ol.Overlay} overlay
 * @api
 */
olcs.OverlaySynchronizer.prototype.addOverlay = function(overlay) {
  if (!overlay) {
    return;
  }
  const cesiumOverlay = new olcs.SynchronizedOverlay({
    scene: this.scene,
    synchronizer: this,
    parent: overlay
  });

  const overlayId = ol.getUid(overlay).toString();
  this.overlayMap_[overlayId] = cesiumOverlay;
};

/**
 * @param {ol.Collection.Event} event
 * @private
 */
olcs.OverlaySynchronizer.prototype.removeOverlayFromEvent_ = function(event) {
  const removedOverlay = /** @type {ol.Overlay} */ (event.element);
  this.removeOverlay(removedOverlay);
};

/**
 * Removes an overlay from the scene
 * @param {ol.Overlay} overlay
 * @api
 */
olcs.OverlaySynchronizer.prototype.removeOverlay = function(overlay) {
  const overlayId = ol.getUid(overlay).toString();
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
olcs.OverlaySynchronizer.prototype.destroyAll = function() {
  Object.keys(this.overlayMap_).forEach((key) => {
    const overlay = this.overlayMap_[key];
    overlay.destroy();
    delete this.overlayMap_[key];
  });
};


