import type {Collection, Map as OLMap, Overlay} from 'ol';
import SynchronizedOverlay from './SynchronizedOverlay';
import {getUid} from './util';
import type {Scene} from 'cesium';
import type {CollectionEvent} from 'ol/Collection.js';

export default class OverlaySynchronizer {
  private overlayCollection_: Collection<Overlay>;
  private overlayContainerStopEvent_: HTMLDivElement;
  private overlayContainer_: HTMLDivElement;
  private overlayMap_: Map<number, SynchronizedOverlay> = new Map();
  private overlayEvents = ['click', 'dblclick', 'mousedown', 'touchstart', 'pointerdown', 'mousewheel', 'wheel'];

  /**
  * @param map
  * @param scene
  * @constructor
  * @api
  */
  constructor(protected map: OLMap, protected scene: Scene) {
    this.map = map;
    this.overlayCollection_ = this.map.getOverlays();
    this.scene = scene;
    this.overlayContainerStopEvent_ = document.createElement('div');
    this.overlayContainerStopEvent_.className = 'ol-overlaycontainer-stopevent';
    this.overlayEvents.forEach((name) => {
      this.overlayContainerStopEvent_.addEventListener(name, evt => evt.stopPropagation());
    });
    this.scene.canvas.parentElement.appendChild(this.overlayContainerStopEvent_);

    this.overlayContainer_ = document.createElement('div');
    this.overlayContainer_.className = 'ol-overlaycontainer';
    this.scene.canvas.parentElement.appendChild(this.overlayContainer_);
  }

  /**
  * Get the element that serves as a container for overlays that don't allow
  * event propagation. Elements added to this container won't let mousedown and
  * touchstart events through to the map, so clicks and gestures on an overlay
  * don't trigger any {@link ol.MapBrowserEvent}.
  * @return The map's overlay container that stops events.
  */
  getOverlayContainerStopEvent(): Element {
    return this.overlayContainerStopEvent_;
  }

  /**
  * Get the element that serves as a container for overlays.
  * @return The map's overlay container.
  */
  getOverlayContainer(): Element {
    return this.overlayContainer_;
  }

  /**
  * Destroy all and perform complete synchronization of the overlays.
  * @api
  */
  synchronize() {
    this.destroyAll();
    this.overlayCollection_.forEach((overlay) => { this.addOverlay(overlay); });
    this.overlayCollection_.on('add', (evt: CollectionEvent<Overlay>) => this.addOverlay(evt.element));
    this.overlayCollection_.on('remove', (evt: CollectionEvent<Overlay>) => this.removeOverlay(evt.element));
  }


  /**
  * @api
  */
  addOverlay(overlay: Overlay) {
    if (!overlay) {
      return;
    }
    const cesiumOverlay = new SynchronizedOverlay({
      scene: this.scene,
      synchronizer: this,
      parent: overlay
    });

    this.overlayMap_.set(getUid(overlay), cesiumOverlay);
  }


  /**
  * Removes an overlay from the scene
  * @api
  */
  removeOverlay(overlay: Overlay) {
    const overlayId = getUid(overlay);
    const csOverlay = this.overlayMap_.get(overlayId);
    if (csOverlay) {
      csOverlay.destroy();
      this.overlayMap_.delete(overlayId);
    }
  }

  /**
  * Destroys all the created Cesium objects.
  */
  protected destroyAll() {
    this.overlayMap_.forEach((overlay: SynchronizedOverlay) => {
      overlay.destroy();
    });
    this.overlayMap_.clear();
  }
}
