export {computeRectangle} from './computeRectangle';

export type{RectangleOutput} from './computeRectangle';

export function computeDPIForPDF(pdfPixels: [number, number], imageDimensions: [number, number]): number {
  const widthDPI = imageDimensions[0] / (pdfPixels[0] / 72);
  const heightDPI = imageDimensions[1] / (pdfPixels[1] / 72);

  // this can be fractional
  return (widthDPI + heightDPI) / 2;
}
