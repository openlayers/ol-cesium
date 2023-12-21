import type {Scene} from 'cesium';

interface ScreenshotOptions {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 */
export function takeScreenshot(scene: Scene, options: ScreenshotOptions): Promise<string> {
  return new Promise((resolve, reject) => {
  // preserveDrawingBuffers is false so we render on demand and immediately read the buffer
    const remover = scene.postRender.addEventListener(() => {
      remover();
      try {
        let url;

        if (options) {
          const smallerCanvas = document.createElement('canvas');

          smallerCanvas.width = options.width;
          smallerCanvas.height = options.height;
          smallerCanvas.getContext('2d').drawImage(
              scene.canvas,
              options.offsetX, options.offsetY, options.width, options.height,
              0, 0, options.width, options.height);
          url = smallerCanvas.toDataURL();
        }
        else {
          url = scene.canvas.toDataURL();
        }
        resolve(url);
      }
      catch (e) {
        reject(e);
      }
    });

    scene.requestRender();
  });
}
