goog.provide('olcs.Overlay');


goog.require('ol');
goog.require('ol.proj');
goog.require('ol.dom');
goog.require('ol.Observable');
goog.require('ol.css');

/**
 * @constructor
 * @param {{
 *  scene: !Cesium.Scene,
 *  parent: !ol.Overlay,
 *  synchronizer: !olcs.OverlaySynchronizer
 * }} options Overlay options.
 * @api
 */
olcs.Overlay = function(options) {
  /**
   * @private
   * @type {?Function}
   */
  this.scenePostRenderListenerRemover_ = null;

  /**
   * @type {!Cesium.Scene}
   */
  this.scene = options.scene;

  /** @type {!olcs.OverlaySynchronizer} */
  this.synchronizer = options.synchronizer;

  /**
   * @private
   * @type {boolean}
   * @todo read from parent
   */
  this.insertFirst_ = true;

  /**
   * @private
   * @type {boolean}
   * @todo read from parent
   */
  this.stopEvent_ = true;

  /**
   * @private
   * @type {Element}
   */
  this.element_ = document.createElement('DIV');
  this.element_.className = `ol-overlay-container ${ol.css.CLASS_SELECTABLE}`;
  this.element_.style.position = 'absolute';

  /**
   * @private
   * @type {!ol.Overlay}
   */
  this.parent_ = options['parent'];

  /** @type {ol.Coordinate|undefined} */
  this.position = this.parent_.getPosition();

  /** @type {Element|undefined} */
  this.element = this.parent_.getElement();

  /**
   * @private
   * @type {{bottom_: string,
   *         left_: string,
   *         right_: string,
   *         top_: string,
   *         visible: boolean}}
   */
  this.rendered_ = {
    bottom_: '',
    left_: '',
    right_: '',
    top_: '',
    visible: true
  };

  /**
   * @type {MutationObserver|null}
   * @private
   */
  this.observer_ = null;

  if (this.parent_.getElement()) {
    this.addMutationObserver_(this.parent_.getElement().parentNode);
  }

  /** @type {Array<ol.EventsKey>} */
  this.listenerKeys_ = [];
  this.listenerKeys_.push(this.parent_.on('change:position', this.changePosition_.bind(this)));
  this.listenerKeys_.push(this.parent_.on('change:element', this.changeElement_.bind(this)));
};

/**
 * @param {Node} target
 * @private
 */
olcs.Overlay.prototype.addMutationObserver_ = function(target) {
  if (this.observer_ === null) {
    this.observer_ = new MutationObserver(this.changeElement_.bind(this));
    this.observer_.observe(target, {
      attributes: true,
      childList: true,
      characterData: false,
      subtree: true
    });
  }
};

/**
 * Get the scene associated with this overlay.
 * @see ol.Overlay.prototype.getMap
 * @return {!Cesium.Scene} The scene that the overlay is part of.
 * @observable
 * @api
 */
olcs.Overlay.prototype.getScene = function() {
  return this.scene;
};

/**
 * Modify the visibility of the element.
 * @param {boolean} visible Element visibility.
 * @protected
 */
olcs.Overlay.prototype.setVisible = function(visible) {
  if (this.rendered_.visible !== visible) {
    this.element_.style.display = visible ? '' : 'none';
    this.rendered_.visible = visible;
  }
};

/**
 * @api
 */
olcs.Overlay.prototype.handleMapChanged = function() {
  if (this.scenePostRenderListenerRemover_) {
    this.scenePostRenderListenerRemover_();
  }
  this.scenePostRenderListenerRemover_ = null;

  const scene = this.getScene();
  if (scene) {
    this.scenePostRenderListenerRemover_ = scene.postRender.addEventListener(this.updatePixelPosition.bind(this));
    this.updatePixelPosition();
    const container = this.stopEvent_ ?
      this.synchronizer.getOverlayContainerStopEvent() : this.synchronizer.getOverlayContainer(); // TODO respect stop-event flag in synchronizer
    if (this.insertFirst_) {
      container.insertBefore(this.element_, container.childNodes[0] || null);
    } else {
      container.appendChild(this.element_);
    }
  }
};

/**
 * @protected
 */
olcs.Overlay.prototype.handleElementChanged = function() {
  ol.dom.removeChildren(this.element_);
  const element = this.getElement();
  if (element) {
    this.element_.appendChild(element);
  }
};


/**
 * Sets up a freshly created overlay
 * @api
 */
olcs.Overlay.prototype.init = function() {
  this.changePosition_();
  this.changeElement_();
  this.handleMapChanged();
};

/**
 * @return {ol.Coordinate|undefined}
 * @api
 */
olcs.Overlay.prototype.getPosition = function() {
  return this.position;
};

/**
 * @return {Array.<number>}
 * @api
 */
olcs.Overlay.prototype.getOffset = function() {
  return this.parent_.getOffset();
};

/**
 * @return {ol.OverlayPositioning}
 * @api
 */
olcs.Overlay.prototype.getPositioning = function() {
  return this.parent_.getPositioning();
};

/**
 * @return {Element|undefined}
 */
olcs.Overlay.prototype.getElement = function() {
  return this.element;
};

/**
 * @param {ol.Coordinate|undefined} position
 */
olcs.Overlay.prototype.setPosition = function(position) {
  this.position = position;
};

/**
 * @param {Element} element
 */
olcs.Overlay.prototype.setElement = function(element) {
  this.element = element;
  this.handleElementChanged();
};

/**
 * @private
 */
olcs.Overlay.prototype.changePosition_ = function() {
  const position = this.parent_.getPosition();

  if (position) {
    this.setVisible(true);
    const sourceProjection = this.parent_.getMap().getView().getProjection();
    const coords = ol.proj.transform(position, sourceProjection, 'EPSG:4326');
    this.setPosition(coords);
    this.handleMapChanged();
  } else {
    this.setPosition(undefined);
    this.setVisible(false);
  }
};

/**
 * @private
 */
olcs.Overlay.prototype.changeElement_ = function() {
  function cloneNode(node, parent) {
    const clone = node.cloneNode();
    if (parent) {
      parent.appendChild(clone);
    }
    if (node.nodeType != Node.TEXT_NODE) {
      clone.addEventListener('click', (event) => {
        node.dispatchEvent(new MouseEvent('click', event));
        event.stopPropagation();
      });
    }
    const nodes = node.childNodes;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i]) {
        continue;
      }
      cloneNode(nodes[i], clone);
    }
    return clone;
  }

  if (this.parent_.getElement()) {
    const clonedNode = cloneNode(this.parent_.getElement(), null);

    this.setElement(clonedNode);
    const parentNode = this.getElement().parentNode;
    if (parentNode) {
      this.addMutationObserver_(parentNode);
      while (parentNode.firstChild) {
        parentNode.removeChild(parentNode.firstChild);
      }
      const childNodes = this.parent_.getElement().parentNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        cloneNode(childNodes[i], parentNode);
      }
    }
  }
};

/**
 * Update pixel position.
 * @suppress {checkTypes, accessControls}
 */
olcs.Overlay.prototype.updatePixelPosition = function() {
  const scene = this.getScene();
  const position = this.getPosition();
  if (!scene || !position) {
    this.setVisible(false);
    return;
  }
  let cartesian;
  if (position.length === 2) {
    cartesian = Cesium.Cartesian3.fromDegreesArray(position)[0];
  } else {
    cartesian = Cesium.Cartesian3.fromDegreesArrayHeights(position)[0];
  }

  const ellipsoidBoundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(), 6356752);
  const occluder = new Cesium.Occluder(ellipsoidBoundingSphere, scene.camera.position);
  // check if overlay position is behind the horizon
  if (!occluder.isPointVisible(cartesian)) {
    this.setVisible(false);
    return;
  }
  const cullingVolume = scene.camera.frustum.computeCullingVolume(scene.camera.position, scene.camera.direction, scene.camera.up);
  // check if overlay position is visible from the camera
  if (cullingVolume.computeVisibility(new Cesium.BoundingSphere(cartesian)) !== 1) {
    this.setVisible(false);
    return;
  }
  this.setVisible(true);

  const pixelCartesian = scene.cartesianToCanvasCoordinates(cartesian);
  const pixel = [pixelCartesian.x, pixelCartesian.y];
  const mapSize = [scene.canvas.width, scene.canvas.height];
  const that = /** @type {ol.Overlay} */ (this);
  ol.Overlay.prototype.updateRenderedPosition.call(that, pixel, mapSize);
};

/**
 * Destroys the overlay, removing all its listeners and elements
 * @api
 */
olcs.Overlay.prototype.destroy = function() {
  if (this.scenePostRenderListenerRemover_) {
    this.scenePostRenderListenerRemover_();
  }
  if (this.observer_) {
    this.observer_.disconnect();
    this.observer_ = null;
  }
  ol.Observable.unByKey(this.listenerKeys_);
  this.listenerKeys_.splice(0);
  if (this.element_.removeNode) {
    this.element_.removeNode(true);
  } else {
    this.element_.remove();
  }
};
