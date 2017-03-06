goog.provide('olcs.util');


/**
 * Cast to object.
 * @param {Object} param
 * @return {Object}
 */
olcs.util.obj = function(param) {
  return param;
};


/**
 * @type {boolean|undefined}
 * @private
 */
olcs.util.supportsImageRenderingPixelatedResult_ = undefined;


/**
 * @type {string|undefined}
 * @private
 */
olcs.util.imageRenderingValueResult_ = undefined;


/**
 * @return {boolean}
 */
olcs.util.supportsImageRenderingPixelated = function() {
  if (olcs.util.supportsImageRenderingPixelatedResult_ === undefined) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('style',
                        'image-rendering: -moz-crisp-edges;' +
                        'image-rendering: pixelated;');
    // canvas.style.imageRendering will be undefined, null or an
    // empty string on unsupported browsers.
    const tmp = canvas.style['imageRendering']; // non standard
    olcs.util.supportsImageRenderingPixelatedResult_ = !!tmp;
    if (olcs.util.supportsImageRenderingPixelatedResult_) {
      olcs.util.imageRenderingValueResult_ = tmp;
    }
  }
  return olcs.util.supportsImageRenderingPixelatedResult_;
};


/**
 * @return {string}
 */
olcs.util.imageRenderingValue = function() {
  olcs.util.supportsImageRenderingPixelated();
  return olcs.util.imageRenderingValueResult_ || '';
};

