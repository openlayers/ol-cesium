/**
 * @module olcs.AutoRenderLoop
 */
/**
 * @constructor
 * @param {olcs.OLCesium} ol3d
 * @struct
 */
const exports = function(ol3d) {
  this.ol3d = ol3d;
  this.scene_ = ol3d.getCesiumScene();
  this.canvas_ = this.scene_.canvas;
  this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

  this.repaintEventNames_ = [
    'mousemove', 'mousedown', 'mouseup',
    'touchstart', 'touchend', 'touchmove',
    'pointerdown', 'pointerup', 'pointermove',
    'wheel'
  ];

  this.enable();
};


/**
 * Enable.
 */
exports.prototype.enable = function() {
  this.scene_.requestRenderMode = true;
  for (const repaintKey of this.repaintEventNames_) {
    this.canvas_.addEventListener(repaintKey, this._boundNotifyRepaintRequired, false);
  }

  window.addEventListener('resize', this._boundNotifyRepaintRequired, false);

  // Listen for changes on the layer group
  this.ol3d.getOlMap().getLayerGroup().on('change', this._boundNotifyRepaintRequired);
};


/**
 * Disable.
 */
exports.prototype.disable = function() {
  for (const repaintKey of this.repaintEventNames_) {
    this.canvas_.removeEventListener(repaintKey, this._boundNotifyRepaintRequired, false);
  }

  window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

  this.ol3d.getOlMap().getLayerGroup().un('change', this._boundNotifyRepaintRequired);
  this.scene_.requestRenderMode = false;
};



/**
 * Restart render loop.
 * Force a restart of the render loop.
 * @api
 */
exports.prototype.restartRenderLoop = function() {
  this.notifyRepaintRequired();
};


exports.prototype.notifyRepaintRequired = function() {
  this.scene_.requestRender();
};


export default exports;
