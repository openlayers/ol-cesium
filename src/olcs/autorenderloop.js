// Apache v2 license
// https://github.com/TerriaJS/terriajs/blob/
// ebd382a8278a817fce316730d9e459bbb9b829e9/lib/Models/Cesium.js

goog.provide('olcs.AutoRenderLoop');



/**
 * @constructor
 * @param {olcs.OLCesium} ol3d
 * @param {boolean} debug
 * @struct
 */
olcs.AutoRenderLoop = function(ol3d, debug) {
  this.ol3d = ol3d;
  this.scene_ = ol3d.getCesiumScene();
  this.canvas_ = this.scene_.canvas;
  this.verboseRendering = debug;
  this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

  this.lastCameraViewMatrix_ = new Cesium.Matrix4();
  this.lastCameraMoveTime_ = 0;
  this.stoppedRendering = false;

  this._removePostRenderListener = this.scene_.postRender.addEventListener(this.postRender.bind(this));

  this.repaintEventNames_ = [
    'mousemove', 'mousedown', 'mouseup',
    'touchstart', 'touchend', 'touchmove',
    'pointerdown', 'pointerup', 'pointermove',
    'wheel'
  ];

  const CameraPrototype = Cesium.Camera.prototype;
  this.interceptedAPIs_ = [
    [CameraPrototype, 'setView'],
    [CameraPrototype, 'move'],
    [CameraPrototype, 'rotate'],
    [CameraPrototype, 'lookAt'],
    [CameraPrototype, 'flyTo'],
    [CameraPrototype, 'flyToHome'],
    [CameraPrototype, 'flyToBoundingSphere']
  ];

  this.originalAPIs_ = this.interceptedAPIs_.map(tuple => tuple[0][tuple[1]]);

  this.originalLoadWithXhr_ = Cesium.loadWithXhr.load;
  this.originalScheduleTask_ = Cesium.TaskProcessor.prototype.scheduleTask;
  this.enable();
};


/**
 * Enable.
 */
olcs.AutoRenderLoop.prototype.enable = function() {
  for (const repaintKey of this.repaintEventNames_) {
    this.canvas_.addEventListener(repaintKey, this._boundNotifyRepaintRequired, false);
  }

  window.addEventListener('resize', this._boundNotifyRepaintRequired, false);

  // Hacky way to force a repaint when an async load request completes
  const that = this;
  Cesium.loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
    deferred['promise']['always'](that._boundNotifyRepaintRequired);
    that.originalLoadWithXhr_(...arguments); // eslint-disable-line prefer-rest-params
  };

  // Hacky way to force a repaint when a web worker sends something back.
  Cesium.TaskProcessor.prototype.scheduleTask = function(parameters, transferableObjects) {
    const result = that.originalScheduleTask_.call(this, parameters, transferableObjects);

    const taskProcessor = this;
    if (!taskProcessor._originalWorkerMessageSinkRepaint) {
      const worker = taskProcessor['_worker'];
      taskProcessor._originalWorkerMessageSinkRepaint = worker.onmessage;
      worker.onmessage = function(event) {
        taskProcessor._originalWorkerMessageSinkRepaint(event);
        that.notifyRepaintRequired();
      };
    }

    return result;
  };

  // Intercept API calls to trigger a repaint
  for (let i = 0; i < this.interceptedAPIs_.length; ++i) {
    const api = this.interceptedAPIs_[i];
    const parent = api[0];
    const original = this.originalAPIs_[i];
    // Not using an arrow function to keep the "this" unbounded.
    parent[api[1]] = function(...args) {
      original.apply(this, args);
      that.notifyRepaintRequired();
    };
  }

  // Listen for changes on the layer group
  this.ol3d.getOlMap().getLayerGroup().on('change', this._boundNotifyRepaintRequired);
};


/**
 * Disable.
 */
olcs.AutoRenderLoop.prototype.disable = function() {
  if (!!this._removePostRenderListener) {
    this._removePostRenderListener();
    this._removePostRenderListener = undefined;
  }
  for (const repaintKey of this.repaintEventNames_) {
    this.canvas_.removeEventListener(repaintKey, this._boundNotifyRepaintRequired, false);
  }

  window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

  Cesium.loadWithXhr.load = this.originalLoadWithXhr_;
  Cesium.TaskProcessor.prototype.scheduleTask = this.originalScheduleTask_;

  // Restore original APIs
  for (let i = 0; i < this.interceptedAPIs_.length; ++i) {
    const api = this.interceptedAPIs_[i];
    const parent = api[0];
    const original = this.originalAPIs_[i];
    parent[api[1]] = original;
  }

  this.ol3d.getOlMap().getLayerGroup().un('change', this._boundNotifyRepaintRequired);
};


/**
 * @param {number} date
 */
olcs.AutoRenderLoop.prototype.postRender = function(date) {
  // We can safely stop rendering when:
  //  - the camera position hasn't changed in over a second,
  //  - there are no tiles waiting to load, and
  //  - the clock is not animating
  //  - there are no tweens in progress

  const now = Date.now();

  const scene = this.scene_;
  const camera = scene.camera;

  if (!Cesium.Matrix4.equalsEpsilon(this.lastCameraViewMatrix_, camera.viewMatrix, 1e-5)) {
    this.lastCameraMoveTime_ = now;
  }

  const cameraMovedInLastSecond = now - this.lastCameraMoveTime_ < 1000;

  const surface = scene.globe['_surface'];
  const tilesWaiting = !surface['tileProvider'].ready ||
      surface['_tileLoadQueueHigh'].length > 0 ||
      surface['_tileLoadQueueMedium'].length > 0 ||
      surface['_tileLoadQueueLow'].length > 0 ||
      surface['_debug']['tilesWaitingForChildren'] > 0;

  const tweens = scene['tweens'];
  if (!cameraMovedInLastSecond && !tilesWaiting && tweens.length == 0) {
    if (this.verboseRendering) {
      console.log(`stopping rendering @ ${Date.now()}`);
    }
    this.ol3d.setBlockCesiumRendering(true);
    this.stoppedRendering = true;
  }

  Cesium.Matrix4.clone(camera.viewMatrix, this.lastCameraViewMatrix_);
};


/**
 * Restart render loop.
 * Force a restart of the render loop.
 * @api
 */
olcs.AutoRenderLoop.prototype.restartRenderLoop = function() {
  this.notifyRepaintRequired();
};


/**
 * Notifies the viewer that a repaint is required.
 */
olcs.AutoRenderLoop.prototype.notifyRepaintRequired = function() {
  if (this.verboseRendering && this.stoppedRendering) {
    console.log(`starting rendering @ ${Date.now()}`);
  }
  this.lastCameraMoveTime_ = Date.now();
  // TODO: do not unblock if not blocked by us
  this.ol3d.setBlockCesiumRendering(false);
  this.stoppedRendering = false;
};


/**
 * @param {boolean} debug
 * @api
 */
olcs.AutoRenderLoop.prototype.setDebug = function(debug) {
  this.verboseRendering = debug;
};
