goog.provide('olcs.obj');


/**
 * Cast to object.
 * @param {Object} param
 * @return {Object}
 */
olcs.obj = function(param) {
  return param;
};


/**
 * @type {boolean|undefined}
 * @private
 */
olcs.supportsImageRenderingPixelatedResult_ = undefined;


/**
 * @type {string|undefined}
 * @private
 */
olcs.imageRenderingValueResult_ = undefined;


/**
 * @return {boolean}
 */
olcs.supportsImageRenderingPixelated = function() {
  if (olcs.supportsImageRenderingPixelatedResult_ === undefined) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('style',
                        'image-rendering: -moz-crisp-edges;' +
                        'image-rendering: pixelated;');
    // canvas.style.imageRendering will be undefined, null or an
    // empty string on unsupported browsers.
    var tmp = canvas.style['imageRendering']; // non standard
    olcs.supportsImageRenderingPixelatedResult_ = !!tmp;
    if (olcs.supportsImageRenderingPixelatedResult_) {
      olcs.imageRenderingValueResult_ = tmp;
    }
  }
  return olcs.supportsImageRenderingPixelatedResult_;
};


/**
 * @return {string|undefined}
 */
olcs.imageRenderingValue = function() {
  return olcs.supportsImageRenderingPixelated() ?
      olcs.imageRenderingValueResult_ : undefined;
};

