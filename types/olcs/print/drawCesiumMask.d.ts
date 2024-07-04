import type { Scene } from 'cesium';
/**
 *
 */
export declare function autoDrawMask(scene: Scene, getScalings: () => number[]): void;
export declare class MaskDrawer {
    private gl;
    private programInfo;
    private positionBuffer;
    constructor(gl: WebGL2RenderingContext | WebGLRenderingContext);
    getVertexShaderSource(): string;
    getFragmentShaderSource(): string;
    /**
     *
     */
    private initShaderProgram;
    /**
     *
     * @param {number[]} scaling scaling
     */
    drawMask(scaling: number[]): void;
    /**
     */
    private static loadShader;
}
