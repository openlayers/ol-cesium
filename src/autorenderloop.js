// Apache v2 license
// https://github.com/TerriaJS/terriajs/blob/
// ebd382a8278a817fce316730d9e459bbb9b829e9/lib/Models/Cesium.js

goog.provide('olcs.AutoRenderLoop');



/**
 * @constructor
 * @param {olcs.OLCesium} ol3d
 * @param {boolean} debug
 */
olcs.AutoRenderLoop = function(ol3d, debug) {
  this.ol3d = ol3d;
  this.scene_ = ol3d.getCesiumScene();
  this.verboseRendering = debug;
  this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

  this.lastCameraViewMatrix_ = new Cesium.Matrix4();
  this.lastCameraMoveTime_ = 0;
  this.stoppedRendering = false;

  this._removePostRenderListener = this.scene_.postRender.addEventListener(
      this.postRender.bind(this));


  // Detect available wheel event
  this._wheelEvent = '';
  if ('onwheel' in this.scene_.canvas) {
    // spec event type
    this._wheelEvent = 'wheel';
  } else if (!!document['onmousewheel']) {
    // legacy event type
    this._wheelEvent = 'mousewheel';
  } else {
    // older Firefox
    this._wheelEvent = 'DOMMouseScroll';
  }

  this._originalLoadWithXhr = Cesium.loadWithXhr.load;
  this._originalScheduleTask = Cesium.TaskProcessor.prototype.scheduleTask;
  this._originalCameraSetView = Cesium.Camera.prototype.setView;
  this._originalCameraMove = Cesium.Camera.prototype.move;
  this._originalCameraRotate = Cesium.Camera.prototype.rotate;
  this._originalCameraLookAt = Cesium.Camera.prototype.lookAt;
  this._originalCameraFlyTo = Cesium.Camera.prototype.flyTo;

  this.enable();
};


/**
 * Force a repaint when the mouse moves or the window changes size.
 * @param {string} key
 * @param {boolean} capture
 * @private
 */
olcs.AutoRenderLoop.prototype.repaintOn_ = function(key, capture) {
  var canvas = this.scene_.canvas;
  canvas.addEventListener(key, this._boundNotifyRepaintRequired, capture);
};


/**
 * @param {string} key
 * @param {boolean} capture
 * @private
 */
olcs.AutoRenderLoop.prototype.removeRepaintOn_ = function(key, capture) {
  var canvas = this.scene_.canvas;
  canvas.removeEventListener(key, this._boundNotifyRepaintRequired, capture);
};


/**
 * Enable.
 */
olcs.AutoRenderLoop.prototype.enable = function() {
  this.repaintOn_('mousemove', false);
  this.repaintOn_('mousedown', false);
  this.repaintOn_('mouseup', false);
  this.repaintOn_('touchstart', false);
  this.repaintOn_('touchend', false);
  this.repaintOn_('touchmove', false);

  if (!!window['PointerEvent']) {
    this.repaintOn_('pointerdown', false);
    this.repaintOn_('pointerup', false);
    this.repaintOn_('pointermove', false);
  }

  this.repaintOn_(this._wheelEvent, false);

  window.addEventListener('resize', this._boundNotifyRepaintRequired, false);

  // Hacky way to force a repaint when an async load request completes
  var that = this;
  Cesium.loadWithXhr.load = function(url, responseType, method, data,
      headers, deferred, overrideMimeType, preferText, timeout) {
    deferred['promise']['always'](that._boundNotifyRepaintRequired);
    that._originalLoadWithXhr(url, responseType, method, data, headers,
        deferred, overrideMimeType, preferText, timeout);
  };

  // Hacky way to force a repaint when a web worker sends something back.
  Cesium.TaskProcessor.prototype.scheduleTask =
      function(parameters, transferableObjects) {
    var result = that._originalScheduleTask.call(this, parameters,
        transferableObjects);

    var taskProcessor = this;
    if (!taskProcessor._originalWorkerMessageSinkRepaint) {
      var worker = taskProcessor['_worker'];
      taskProcessor._originalWorkerMessageSinkRepaint = worker.onmessage;
      worker.onmessage = function(event) {
        taskProcessor._originalWorkerMessageSinkRepaint(event);
        that.notifyRepaintRequired();
      };
    }

    return result;
  };

  Cesium.Camera.prototype.setView = function() {
    that._originalCameraSetView.apply(this, arguments);
    that.notifyRepaintRequired();
  };
  Cesium.Camera.prototype.move = function() {
    that._originalCameraMove.apply(this, arguments);
    that.notifyRepaintRequired();
  };
  Cesium.Camera.prototype.rotate = function() {
    that._originalCameraRotate.apply(this, arguments);
    that.notifyRepaintRequired();
  };
  Cesium.Camera.prototype.lookAt = function() {
    that._originalCameraLookAt.apply(this, arguments);
    that.notifyRepaintRequired();
  };
  Cesium.Camera.prototype.flyTo = function() {
    that._originalCameraFlyTo.apply(this, arguments);
    that.notifyRepaintRequired();
  };

  // Listen for changes on the layer group
  this.ol3d.getOlMap().getLayerGroup().on('change',
      this._boundNotifyRepaintRequired);
};


/**
 * Disable.
 */
olcs.AutoRenderLoop.prototype.disable = function() {
  if (!!this._removePostRenderListener) {
    this._removePostRenderListener();
    this._removePostRenderListener = undefined;
  }

  this.removeRepaintOn_('mousemove', false);
  this.removeRepaintOn_('mousedown', false);
  this.removeRepaintOn_('mouseup', false);
  this.removeRepaintOn_('touchstart', false);
  this.removeRepaintOn_('touchend', false);
  this.removeRepaintOn_('touchmove', false);

  if (!!window['PointerEvent']) {
    this.removeRepaintOn_('pointerdown', false);
    this.removeRepaintOn_('pointerup', false);
    this.removeRepaintOn_('pointermove', false);
  }

  this.removeRepaintOn_(this._wheelEvent, false);

  window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

  Cesium.loadWithXhr.load = this._originalLoadWithXhr;
  Cesium.TaskProcessor.prototype.scheduleTask = this._originalScheduleTask;
  Cesium.Camera.prototype.setView = this._originalCameraSetView;
  Cesium.Camera.prototype.move = this._originalCameraMove;
  Cesium.Camera.prototype.rotate = this._originalCameraRotate;
  Cesium.Camera.prototype.lookAt = this._originalCameraLookAt;
  Cesium.Camera.prototype.flyTo = this._originalCameraFlyTo;

  this.ol3d.getOlMap().getLayerGroup().un('change',
      this._boundNotifyRepaintRequired);
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

  var now = Date.now();

  var scene = this.scene_;
  var camera = scene.camera;

  if (!Cesium.Matrix4.equalsEpsilon(this.lastCameraViewMatrix_,
      camera.viewMatrix, 1e-5)) {
    this.lastCameraMoveTime_ = now;
  }

  var cameraMovedInLastSecond = now - this.lastCameraMoveTime_ < 1000;

  var surface = scene.globe['_surface'];
  var tilesWaiting = !surface['_tileProvider'].ready ||
      surface['_tileLoadQueue'].length > 0 ||
      surface['_debug']['tilesWaitingForChildren'] > 0;

  var tweens = scene['tweens'];
  if (!cameraMovedInLastSecond && !tilesWaiting && tweens.length == 0) {
    if (this.verboseRendering) {
      console.log('stopping rendering @ ' + Date.now());
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
    console.log('starting rendering @ ' + Date.now());
  }
  this._lastCameraMoveTime = Date.now();
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
