export interface RectangleOutput {
  scaling: [number, number];
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export function computeRectangle(canvas: HTMLCanvasElement, tw: number, th: number): RectangleOutput {

  const maskAspectRatio = tw / th;
  let maskSize;

  if (maskAspectRatio > 1) {
    // landscape
    maskSize = [canvas.width, canvas.width / maskAspectRatio];
    if (maskSize[1] > canvas.height) {
      maskSize = [canvas.height * maskAspectRatio, canvas.height];
    }
  }
  else {
    // portrait
    maskSize = [canvas.height * maskAspectRatio, canvas.height];
    if (maskSize[0] > canvas.width) {
      maskSize = [canvas.width, canvas.width / maskAspectRatio];
    }
  }

  return {
    scaling: [maskSize[0] / canvas.width, maskSize[1] / canvas.height],
    width: maskSize[0],
    height: maskSize[1],
    offsetX: (canvas.width - maskSize[0]) / 2,
    offsetY: (canvas.height - maskSize[1]) / 2,
  };
}
