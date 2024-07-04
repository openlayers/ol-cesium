export { computeRectangle } from './computeRectangle';
export function computeDPIForPDF(pdfPixels, imageDimensions) {
    const widthDPI = imageDimensions[0] / (pdfPixels[0] / 72);
    const heightDPI = imageDimensions[1] / (pdfPixels[1] / 72);
    // this can be fractional
    return (widthDPI + heightDPI) / 2;
}
