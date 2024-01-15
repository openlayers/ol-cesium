import type {Projection} from 'ol/proj';
import type {Source} from 'ol/source';

let _imageRenderingPixelatedSupported: boolean = undefined;
let _imageRenderingValue: string = undefined;


/**
 * https://caniuse.com/mdn-css_properties_image-rendering_pixelated
 * @return whether the browser supports
 */
export function supportsImageRenderingPixelated(): boolean {
  if (_imageRenderingPixelatedSupported === undefined) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('style', 'image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; image-rendering: pixelated;');
    // canvas.style.imageRendering will be undefined, null or an
    // empty string on unsupported browsers.
    const imageRenderingValue = canvas.style.imageRendering;
    _imageRenderingPixelatedSupported = !!imageRenderingValue;
    if (_imageRenderingPixelatedSupported) {
      _imageRenderingValue = imageRenderingValue;
    }
  }
  return _imageRenderingPixelatedSupported;
}


/**
 * The value supported by thie browser for the CSS property "image-rendering"
 * @return {string}
 */
export function imageRenderingValue() {
  supportsImageRenderingPixelated();
  return _imageRenderingValue || '';
}

/**
 * Return the projection of the source that Cesium should use.
 *
 * @param source Source.
 * @return The projection of the source.
 */
export function getSourceProjection(source: Source): Projection {
  return source.get('olcs.projection') as Projection || source.getProjection();
}


/**
 * Counter for getUid.
 * @type {number}
 */
let uidCounter_ = 0;

/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid. Similar to OL getUid.
 *
 * @param obj The object to get the unique ID for.
 * @return The unique ID for the object.
 */
export function getUid(obj: any): number {
  return obj.olcs_uid || (obj.olcs_uid = ++uidCounter_);
}

export function waitReady<Type>(object: Type): Promise<Type> {
  const o = object as any;
  const p = o.readyPromise;
  if (p) {
    return p;
  }
  if (o.ready !== undefined) {
    if (o.ready) {
      return Promise.resolve(object);
    }
    return new Promise((resolve, _) => {
      // FIXME: this is crazy
      // alternative: intercept _ready = true
      // altnerative: pass a timeout
      const stopper = setInterval(() => {
        if (o.ready) {
          clearInterval(stopper);
          resolve(object);
        }
      }, 20);
    });
  }
  return Promise.reject('Not a readyable object');
}
