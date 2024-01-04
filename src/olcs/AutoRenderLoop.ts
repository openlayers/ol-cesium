import type {Scene} from 'cesium';
import type OLCesium from './OLCesium';

/**
 * By default Cesium (used to?) renders as often as possible.
 * This is a waste of resources (CPU/GPU/battery).
 * An alternative mechanism in Cesium is on-demand rendering.
 * This class makes use of this alternative method and add some additionnal render points.
 */
export default class AutoRenderLoop {
  ol3d: OLCesium;
  private scene_: Scene;
  private canvas_: HTMLCanvasElement;
  private _boundNotifyRepaintRequired: typeof this.notifyRepaintRequired;
  private repaintEventNames_ = [
    'mousemove', 'mousedown', 'mouseup',
    'touchstart', 'touchend', 'touchmove',
    'pointerdown', 'pointerup', 'pointermove',
    'wheel'
  ] as const;

  /**
   * @param ol3d
   */
  constructor(ol3d: OLCesium) {
    this.ol3d = ol3d;
    this.scene_ = ol3d.getCesiumScene();
    this.canvas_ = this.scene_.canvas;
    this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);
    this.enable();
  }

  /**
   * Enable.
   */
  enable() {
    this.scene_.requestRenderMode = true;
    this.scene_.maximumRenderTimeChange = 1000;
    for (const repaintKey of this.repaintEventNames_) {
      this.canvas_.addEventListener(repaintKey, this._boundNotifyRepaintRequired, false);
    }

    window.addEventListener('resize', this._boundNotifyRepaintRequired, false);

    // Listen for changes on the layer group
    this.ol3d.getOlMap().getLayerGroup().on('change', this._boundNotifyRepaintRequired);
  }

  /**
   * Disable.
   */
  disable() {
    for (const repaintKey of this.repaintEventNames_) {
      this.canvas_.removeEventListener(repaintKey, this._boundNotifyRepaintRequired, false);
    }

    window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

    this.ol3d.getOlMap().getLayerGroup().un('change', this._boundNotifyRepaintRequired);
    this.scene_.requestRenderMode = false;
  }

  /**
   * Restart render loop.
   * Force a restart of the render loop.
   */
  restartRenderLoop() {
    this.notifyRepaintRequired();
  }

  notifyRepaintRequired() {
    this.scene_.requestRender();
  }
}
