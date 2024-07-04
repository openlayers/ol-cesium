export default AutoRenderLoop;
/**
 * @module olcs.AutoRenderLoop
 */
declare class AutoRenderLoop {
    /**
     * @constructor
     * @param {olcs.OLCesium} ol3d
     */
    constructor(ol3d: olcs.OLCesium);
    ol3d: olcs.OLCesium;
    scene_: any;
    canvas_: any;
    _boundNotifyRepaintRequired: any;
    repaintEventNames_: string[];
    /**
     * Enable.
     */
    enable(): void;
    /**
     * Disable.
     */
    disable(): void;
    /**
     * Restart render loop.
     * Force a restart of the render loop.
     * @api
     */
    restartRenderLoop(): void;
    notifyRepaintRequired(): void;
}
