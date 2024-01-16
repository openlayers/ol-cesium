import OLOverlay from 'ol/Overlay.js';
import {transform} from 'ol/proj.js';
import {unByKey as olObservableUnByKey} from 'ol/Observable.js';
import type {Scene} from 'cesium';
import type OverlaySynchronizer from './OverlaySynchronizer';
import type {EventsKey} from 'ol/events';
import type {ObjectEvent} from 'ol/Object';


/**
 * @param node The node to remove.
 * @return The node that was removed or null.
 */
function removeNode(node: Node): Node {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}

/**
 * @param {Node} node The node to remove the children from.
 */
function removeChildren(node: Node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
}

function cloneNode<T extends Node, U extends Node>(node: T, parent: U): T {
  const clone = node.cloneNode() as T;
  if (node.nodeName === 'CANVAS') {
    const ctx = (clone as unknown as HTMLCanvasElement).getContext('2d');
    ctx.drawImage(node as unknown as HTMLCanvasElement, 0, 0);
  }
  if (parent) {
    parent.appendChild(clone);
  }
  if (node.nodeType !== Node.TEXT_NODE) {
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


interface SynchronizedOverlayOptions {
  scene: Scene;
  parent: OLOverlay;
  synchronizer: OverlaySynchronizer;
}


export default class SynchronizedOverlay extends OLOverlay {

  private scenePostRenderListenerRemover_?: Function = null;
  private scene_: Scene;
  private synchronizer_: OverlaySynchronizer;
  private parent_: OLOverlay;
  private positionWGS84_: number[];
  private observer_: MutationObserver;
  private attributeObserver_: MutationObserver[] = [];
  private listenerKeys_: EventsKey[];


  /**
   * @param options SynchronizedOverlay Options.
   * @api
   */
  constructor(options: SynchronizedOverlayOptions) {
    const parent = options.parent;
    super(parent.getOptions());
    this.scene_ = options.scene;
    this.synchronizer_ = options.synchronizer;
    this.parent_ = parent;
    this.positionWGS84_ = undefined;
    this.observer_ = new MutationObserver(this.handleElementChanged.bind(this));
    this.attributeObserver_ = [];
    this.listenerKeys_ = [];

    // synchronize our Overlay with the parent Overlay
    const setPropertyFromEvent = (event: ObjectEvent) => this.setPropertyFromEvent_(event);
    this.listenerKeys_.push(this.parent_.on('change:element', setPropertyFromEvent));
    this.listenerKeys_.push(this.parent_.on('change:offset', setPropertyFromEvent));
    this.listenerKeys_.push(this.parent_.on('change:position', setPropertyFromEvent));
    this.listenerKeys_.push(this.parent_.on('change:positioning', setPropertyFromEvent));

    this.setProperties(this.parent_.getProperties());

    this.handleMapChanged();
    this.handleElementChanged();
  }

  /**
   * @param target
   */
  private observeTarget_(target: Node) {
    if (!this.observer_) {
      // not ready, skip the event (this occurs on construction)
      return;
    }
    this.observer_.disconnect();
    this.observer_.observe(target, {
      attributes: false,
      childList: true,
      characterData: true,
      subtree: true
    });
    this.attributeObserver_.forEach((observer) => {
      observer.disconnect();
    });
    this.attributeObserver_.length = 0;
    for (let i = 0; i < target.childNodes.length; i++) {
      const node = target.childNodes[i];
      if (node.nodeType === 1) {
        const observer = new MutationObserver(this.handleElementChanged.bind(this));
        observer.observe(node, {
          attributes: true,
          subtree: true
        });
        this.attributeObserver_.push(observer);
      }
    }
  }

  /**
   *
   * @param event
   */
  private setPropertyFromEvent_(event: ObjectEvent) {
    if (event.target && event.key) {
      this.set(event.key, event.target.get(event.key));
    }
  }

  /**
   * Get the scene associated with this overlay.
   * @see ol.Overlay.prototype.getMap
   * @return The scene that the overlay is part of.
   * @api
   */
  getScene(): Scene {
    return this.scene_;
  }

  /**
   * @override
   */
  handleMapChanged() {
    if (this.scenePostRenderListenerRemover_) {
      this.scenePostRenderListenerRemover_();
      removeNode(this.element);
    }
    this.scenePostRenderListenerRemover_ = null;
    const scene = this.getScene();
    if (scene) {
      this.scenePostRenderListenerRemover_ = scene.postRender.addEventListener(this.updatePixelPosition.bind(this));
      this.updatePixelPosition();
      const container = this.stopEvent ?
        this.synchronizer_.getOverlayContainerStopEvent() : this.synchronizer_.getOverlayContainer();
      if (this.insertFirst) {
        container.insertBefore(this.element, container.childNodes[0] || null);
      } else {
        container.appendChild(this.element);
      }
    }
  }

  /**
   * @override
   */
  handlePositionChanged() {
    // transform position to WGS84
    const position = this.getPosition();
    if (position) {
      const sourceProjection = this.parent_.getMap().getView().getProjection();
      this.positionWGS84_ = transform(position, sourceProjection, 'EPSG:4326');
    } else {
      this.positionWGS84_ = undefined;
    }
    this.updatePixelPosition();
  }

  /**
   * @override
   */
  handleElementChanged() {
    removeChildren(this.element);
    const element = this.getElement();
    if (element) {
      if (element.parentNode && element.parentNode.childNodes) {
        for (const node of Array.from(element.parentNode.childNodes)) {
          const clonedNode = cloneNode(node, null);
          this.element.appendChild(clonedNode);
        }
      }
    }
    if (element.parentNode) {
      // set new Observer
      this.observeTarget_(element.parentNode);
    }
  }

  /**
   * @override
   */
  updatePixelPosition() {
    const position = this.positionWGS84_;
    if (!this.scene_ || !position) {
      this.setVisible(false);
      return;
    }
    let height = 0;
    if (position.length === 2) {
      const globeHeight = this.scene_.globe.getHeight(Cesium.Cartographic.fromDegrees(position[0], position[1]));
      if (globeHeight && this.scene_.globe.tilesLoaded) {
        position[2] = globeHeight;
      }
      if (globeHeight) {
        height = globeHeight;
      }
    } else {
      height = position[2];
    }
    const cartesian = Cesium.Cartesian3.fromDegrees(position[0], position[1], height);
    const camera = this.scene_.camera;
    const ellipsoidBoundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(), 6356752);
    const occluder = new Cesium.Occluder(ellipsoidBoundingSphere, camera.position);
    // check if overlay position is behind the horizon
    if (!occluder.isPointVisible(cartesian)) {
      this.setVisible(false);
      return;
    }
    const cullingVolume = camera.frustum.computeCullingVolume(camera.position, camera.direction, camera.up);
    // check if overlay position is visible from the camera
    if (cullingVolume.computeVisibility(new Cesium.BoundingSphere(cartesian)) !== 1) {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);

    const pixelCartesian = this.scene_.cartesianToCanvasCoordinates(cartesian);
    const pixel = [pixelCartesian.x, pixelCartesian.y];
    const mapSize = [this.scene_.canvas.width, this.scene_.canvas.height];
    this.updateRenderedPosition(pixel, mapSize);
  }

  /**
   * Destroys the overlay, removing all its listeners and elements
   * @api
   */
  destroy() {
    if (this.scenePostRenderListenerRemover_) {
      this.scenePostRenderListenerRemover_();
    }
    if (this.observer_) {
      this.observer_.disconnect();
    }
    olObservableUnByKey(this.listenerKeys_);
    this.listenerKeys_.splice(0);
    if ('removeNode' in this.element) {
      // @ts-ignore
      this.element.removeNode(true);
    } else {
      this.element.remove();
    }
    this.element = null;
  }
}
