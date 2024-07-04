export interface RectangleOutput {
    scaling: [number, number];
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
}
export declare function computeRectangle(canvas: HTMLCanvasElement, tw: number, th: number): RectangleOutput;
