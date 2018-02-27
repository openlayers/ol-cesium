/**
 * @fileoverview Externs for Cesium JS.
 * @see https://cesiumjs.org/refdoc/
 * @externs
 */

/**
 * @const
 */
var Cesium = {};

/**
 * @param {T} value .
 * @param {T} fallback .
 * @return {T}
 * @template T
 */
Cesium.defaultValue = function(value, fallback) {};


/**
 * Prevent using a removed API.
 * @constructor
 */
Cesium.RemovedAPI = function() {};


/**
 * @constructor
 * @param {number=} opt_r .
 * @param {number=} opt_g .
 * @param {number=} opt_b .
 * @param {number=} opt_a .
 */
Cesium.Color = function(opt_r, opt_g, opt_b, opt_a) {};

/**
 * @param {string} name
 * @return {!Cesium.Color}
 */
Cesium.Color.fromCssColorString = function(name) {};

/**
 * @param {!Array.<number>} color
 * @return {!Cesium.Color}
 */
Cesium.Color.unpack = function(color) {};

/**
 * @param {number} component Integer in range [0-255]
 * @return {number} float in range [0-1]
 */
Cesium.Color.byteToFloat = function(component) {};

/**
 * @type {!Cesium.Color}
 */
Cesium.Color.WHITE;

/**
 * @type {!Cesium.Color}
 */
Cesium.Color.TRANSPARENT;

/**
 * @constructor
 * @param {string} text
 * @param {Object=} opt_description
 * @return {HTMLCanvasElement}
 */
Cesium.prototype.writeTextToCanvas = function(text, opt_description) {};



/**
 * @constructor
 */
Cesium.Billboard = function() {};


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Billboard.prototype.eyeOffset;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Billboard.prototype.position;


/**
 * @type {boolean}
 */
Cesium.Billboard.prototype.show;


/**
 * @type {number}
 */
Cesium.Billboard.prototype.scale;


/**
 * @type {number}
 */
Cesium.Billboard.prototype.imageIndex;


/**
 * @type {!Cesium.VerticalOrigin}
 */
Cesium.Billboard.prototype.verticalOrigin;


/**
 * @constructor
 */
Cesium.VerticalOrigin = function() {};


/**
 * @type {!Cesium.VerticalOrigin} .
 */
Cesium.VerticalOrigin.TOP;


/**
 * @type {!Cesium.VerticalOrigin} .
 */
Cesium.VerticalOrigin.CENTER;


/**
 * @type {!Cesium.VerticalOrigin} .
 */
Cesium.VerticalOrigin.BOTTOM;


/**
 * @param {number} near
 * @param {number} nearValue
 * @param {number} far
 * @param {number} farValue
 * @constructor
 */
Cesium.NearFarScalar = function(near, nearValue, far, farValue) {};


/**
 * @constructor
 * @extends {Cesium.Primitive} // as it can be added to PrimitiveCollection...
 * @param {{scene: Cesium.Scene }=} opt_options
 */
Cesium.BillboardCollection = function(opt_options) {};


/**
 * @typedef {{
 *   image: (string|HTMLCanvasElement|HTMLImageElement|Image),
 *   color: (Cesium.Color|undefined),
 *   heightReference: (Cesium.HeightReference|undefined),
 *   verticalOrigin: (Cesium.VerticalOrigin|undefined),
 *   horizontalOrigin: (Cesium.HorizontalOrigin|undefined),
 *   pixelOffsetScaleByDistance : (Cesium.NearFarScalar|undefined),
 *   scale: (number|undefined),
 *   scaleByDistance: (Cesium.NearFarScalar|undefined),
 *   position: !Cesium.Cartesian3
 * }}
 */
Cesium.optionsBillboardCollectionAdd;


/**
 * @param {Cesium.optionsBillboardCollectionAdd} opt_opts .
 * @return {!Cesium.Billboard} .
 */
Cesium.BillboardCollection.prototype.add = function(opt_opts) {};


/**
 * @return {boolean} .
 */
Cesium.BillboardCollection.prototype.isDestroyed = function() {};


/**
 * @type {number}
 */
Cesium.BillboardCollection.prototype.length;


/**
 * @param {Cesium.Billboard} what .
 */
Cesium.BillboardCollection.prototype.remove = function(what) {};


/**
 * @type {boolean} .
 */
Cesium.BillboardCollection.prototype.sizeReal;


/**
 * @type {Cesium.TextureAtlas}
 */
Cesium.BillboardCollection.prototype.textureAtlas;



/**
 * @param {Object.<string, *>} opts
 * @constructor
 */
Cesium.TextureAtlas = function(opts) {};


/**
 * @param {Image} image .
 */
Cesium.TextureAtlas.prototype.addImage = function(image) {};


/**
 * @type {Array.<Cesium.BoundingRectangle>} .
 */
Cesium.TextureAtlas.prototype.textureCoordinates;


/**
 * @type {!Cesium.Texture} .
 */
Cesium.TextureAtlas.prototype.texture;



/**
 * @constructor
 */
Cesium.Texture = function() {};


/**
 * @type {number} .
 */
Cesium.Texture.prototype.width;


/**
 * @type {number} .
 */
Cesium.Texture.prototype.height;



/**
 * @constructor
 */
Cesium.BoundingRectangle = function() {};


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.x;


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.y;


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.width;


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.height;



/**
 * @constructor
 */
Cesium.Camera = function() {};

/**
 * Camptocamp addition.
 * @type {!boolean}
 */
Cesium.Camera.enableSuspendTerrainAdjustment;

/**
 * @type {Cesium.Rectangle}
 */
Cesium.Camera.DEFAULT_VIEW_RECTANGLE;

/**
 * @type {number}
 */
Cesium.Camera.DEFAULT_VIEW_FACTOR;

/**
 * @type {!boolean}
 */
Cesium.Camera.prototype.flying;

/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.direction;


/**
 * @type {Cesium.PerspectiveFrustrum}
 */
Cesium.Camera.prototype.frustum;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.position;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.right;


/**
 * @type {Cesium.Matrix4}
 */
Cesium.Camera.prototype.transform;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.up;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.constrainedAxis;

/**
 * @type {number|undefined}
 */
Cesium.Camera.prototype.constrainedAxisAngle;


/**
 * @type {!Cesium.Cartographic} .
 */
Cesium.Camera.prototype.positionCartographic;


/**
 * @type {Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.positionWC;


/**
 * @type {number}
 */
Cesium.Camera.prototype.heading;


/**
 * @type {!Cesium.RemovedAPI}
 */
Cesium.Camera.prototype.tilt;


/**
 * @type {number}
 * @const
 */
Cesium.Camera.prototype.pitch;

/**
 * @type {Cesium.Event}
 */
Cesium.Camera.prototype.moveStart;

/**
 * @type {Cesium.Event}
 */
Cesium.Camera.prototype.moveEnd;


/**
 * @param {!Cesium.Cartesian2} windowPosition
 * @param {Cesium.Ray=} opt_result
 * @return {!Cesium.Ray}
 */
Cesium.Camera.prototype.getPickRay = function(windowPosition, opt_result) {};


/**
 * @param {Cesium.Cartesian4} cartesian .
 * @param {Cesium.Cartesian4=} opt_result .
 * @return {Cesium.Cartesian4} .
 */
Cesium.Camera.prototype.worldToCameraCoordinates = function(cartesian, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian .
 * @param {Cesium.Cartesian3=} opt_result .
 * @return {Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.worldToCameraCoordinatesPoint = function(cartesian, opt_result) {};


/**
 * @param {!Cesium.RemovedAPI} transform
 */
Cesium.Camera.prototype.setTransform = function(transform) {};


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.Camera.prototype.viewMatrix;


/**
 * @typedef {Object}
 */
Cesium.CameraEventType;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.LEFT_DRAG;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.MIDDLE_DRAG;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.PINCH;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.RIGHT_DRAG;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.WHEEL;


/**
 * @typedef {number}
 */
Cesium.KeyboardEventModifier;


/**
 * @type {Cesium.KeyboardEventModifier}
 */
Cesium.KeyboardEventModifier.ALT;


/**
 * @type {Cesium.KeyboardEventModifier}
 */
Cesium.KeyboardEventModifier.CTRL;


/**
 * @type {Cesium.KeyboardEventModifier}
 */
Cesium.KeyboardEventModifier.SHIFT;




/**
 * @param {Object} canvas .
 * @constructor
 */
Cesium.CameraEventAggregator = function(canvas) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.isMoving = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {Object} .
 */
Cesium.CameraEventAggregator.prototype.getMovement = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {Object} .
 */
Cesium.CameraEventAggregator.prototype.getLastMovement = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.isButtonDown = function(type, opt_mod) {};


/**
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.anyButtonDown = function() {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {number} .
 */
Cesium.CameraEventAggregator.prototype.getButtonPressTime = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {number} .
 */
Cesium.CameraEventAggregator.prototype.getButtonReleaseTime = function(type, opt_mod) {};


/**
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.isDestroyed = function() {};


/**
 */
Cesium.CameraEventAggregator.prototype.destroy = function() {};


/**
 * @type {!Cesium.RemovedAPI}
 */
Cesium.Camera.prototype.setPositionCartographic;


/**
 * @typedef {{
 *   heading: (number|undefined),
 *   pitch: (number|undefined),
 *   roll: (number|undefined)
 * }}
 */
Cesium.optionsOrientation;

/**
 * @typedef {{
 *   destination: (Cesium.Cartesian3|Cesium.Rectangle|undefined),
 *   orientation: (Cesium.optionsOrientation|undefined),
 *   position: (Cesium.RemovedAPI|undefined),
 *   positionCartographic: (Cesium.RemovedAPI|undefined),
 *   heading: (undefined|Cesium.RemovedAPI),
 *   pitch: (undefined|Cesium.RemovedAPI),
 *   roll: (undefined|Cesium.RemovedAPI),
 *   endTransform: (Cesium.Matrix4|undefined)
 * }}
 */
Cesium.optionsCameraSetView;

/**
 * @param {Cesium.optionsCameraSetView} options
 */
Cesium.Camera.prototype.setView = function(options) {};


/**
 * @param {Cesium.Cartesian3} eye .
 * @param {Cesium.Cartesian3} target .
 * @param {Cesium.Cartesian3} up .
 */
Cesium.Camera.prototype.lookAt = function(eye, target, up) {};


/**
 * @param {Cesium.Matrix4} transform
 */
Cesium.Camera.prototype.lookAtTransform = function(transform) {};

/**
 * @param {Cesium.Cartesian3} axis
 * @param {number} angle
 */
Cesium.Camera.prototype.rotate = function(axis, angle) {};

/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateUp = function(angle) {};

/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateDown = function(angle) {};

/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateLeft = function(angle) {};

/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateRight = function(angle) {};

/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.twistLeft = function(amount) {};

/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.twistRight = function(amount) {};

/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookLeft = function(amount) {};

/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookRight = function(amount) {};

/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookUp = function(amount) {};

/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookDown = function(amount) {};

/**
 * @param {!Cesium.Cartesian3} direction
 * @param {number} amount
 */
Cesium.Camera.prototype.move = function(direction, amount) {};

/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveDown = function(amount) {};

/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveBackward = function(amount) {};

/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveForward = function(amount) {};

/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveLeft = function(amount) {};
/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveRight = function(amount) {};

/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveUp = function(amount) {};

/**
 * @param {!Cesium.Cartesian2} windowPos .
 * @param {Cesium.Ellipsoid=} opt_ellipsoid .
 * @return {!Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.pickEllipsoid = function(windowPos, opt_ellipsoid) {};

/**
 * @typedef {{
 *   destination: (!Cesium.Cartesian3|Cesium.Rectangle),
 *   orientation: (!Cesium.optionsOrientation|undefined),
 *   duration: (number|undefined),
 *   complete: (function()|undefined),
 *   cancel: (function()|undefined),
 *   endTransform: (Cesium.Matrix4|undefined),
 *   convert: (boolean|undefined),
 *   maximumHeight: (number|undefined),
 *   easingFunction: (function(number): number|undefined),
 *   flyOverLongitude: (number|undefined),
 *   flyOverLongitudeWeight: (number|undefined),
 *   pitchAdjustHeight: (number|undefined)
 * }}
 */
Cesium.optionsCameraFlyTo;

/**
 * @param {!Cesium.optionsCameraFlyTo} options
 */
Cesium.Camera.prototype.flyTo = function(options) {};

/**
 * @param {number=} opt_duration
 */
Cesium.Camera.prototype.flyHome = function(opt_duration) {};

/**
 * @typedef {{
 *   duration: (number|undefined),
 *   offset: (Cesium.HeadingPitchRange|undefined),
 *   complete: (function()|undefined),
 *   cancel: (function()|undefined),
 *   endTransform: (Cesium.Matrix4|undefined),
 *   maximumHeight: (number|undefined),
 *   pitchAdjustHeight: (number|undefined),
 *   flyOverLongitude: (number|undefined),
 *   flyOverLongitudeWeight: (number|undefined),
 *   easingFunction: (function(number): number|undefined)
 * }}
 */
Cesium.optionsCameraFlyToBoundingSphere;


/**
 * @param {!Cesium.BoundingSphere} boundingSphere
 * @param {!Cesium.optionsCameraFlyToBoundingSphere} options
 */
Cesium.Camera.prototype.flyToBoundingSphere = function(boundingSphere, options) {};


/**
 * @param {!Cesium.BoundingSphere} boundingSphere
 * @param {!Cesium.HeadingPitchRange=} opt_offset
 */
Cesium.Camera.prototype.viewBoundingSphere = function(boundingSphere, opt_offset) {};


/**
 * @param {!Cesium.Rectangle} rect
 * @return {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.getRectangleCameraCoordinates = function(rect) {};


/**
 * @struct
 * @constructor
 * @param {number=} x
 * @param {number=} y
 */
Cesium.Cartesian2 = function(x, y) {};


/**
 * @type {number}
 */
Cesium.Cartesian2.prototype.x;


/**
 * @type {number}
 */
Cesium.Cartesian2.prototype.y;



/**
 * @constructor
 * @param {number=} opt_x
 * @param {number=} opt_y
 * @param {number=} opt_z
 */
Cesium.Cartesian3 = function(opt_x, opt_y, opt_z) {};


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.UNIT_X;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.UNIT_Y;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.UNIT_Z;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.ZERO;


/**
 * @type {number}
 */
Cesium.Cartesian3.prototype.x;


/**
 * @type {number}
 */
Cesium.Cartesian3.prototype.y;


/**
 * @type {number}
 */
Cesium.Cartesian3.prototype.z;


/**
 * @param {!Cesium.Cartesian3} start
 * @param {!Cesium.Cartesian3} end
 * @param {number} t
 * @param {!Cesium.Cartesian3} result
 */
Cesium.Cartesian3.lerp = function(start, end, t, result) {};

/**
 * @param {Cesium.Cartesian3} left
 * @return {number}
 */
Cesium.Cartesian3.magnitude = function(left) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.add = function(left, right, opt_result) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.subtract = function(left, right, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.normalize = function(cartesian, result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.negate = function(cartesian, result) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.cross = function(left, right, opt_result) {};


/**
 * @param {!Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.clone = function(cartesian, opt_result) {};


/**
 * @param {!Cesium.Cartesian3} cartesian
 * @param {!number} scalar
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.multiplyByScalar = function(cartesian, scalar, opt_result) {};


/**
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.prototype.clone = function(opt_result) {};



/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {number}
 */
Cesium.Cartesian3.dot = function(left, right) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {number}
 */
Cesium.Cartesian3.distance = function(left, right) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {number}
 */
Cesium.Cartesian3.angleBetween = function(left, right) {};


/**
 * @param {Array.<number>} degrees
 * @return {Array.<Cesium.Cartesian3>}
 */
Cesium.Cartesian3.fromDegreesArray = function(degrees) {};
/**
 * @param {Array.<number>} degrees
 * @return {Array.<Cesium.Cartesian3>}
 */
Cesium.Cartesian3.fromDegreesArrayHeights = function(degrees) {};




/**
 * @constructor
 * @param {number=} opt_x
 * @param {number=} opt_y
 * @param {number=} opt_z
 * @param {number=} opt_w
 */
Cesium.Cartesian4 = function(opt_x, opt_y, opt_z, opt_w) {};


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.x;


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.y;


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.z;

/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.w;



/**
 * @constructor
 * @param {number=} longitude
 * @param {number=} latitude
 * @param {number=} height
 */
Cesium.Cartographic = function(longitude, latitude, height) {};


/**
 * @type {number}
 */
Cesium.Cartographic.prototype.longitude;


/**
 * @type {number}
 */
Cesium.Cartographic.prototype.latitude;


/**
 * @type {number}
 */
Cesium.Cartographic.prototype.height;


/**
 * @param {Cesium.Cartographic=} opt_result
 * @return {!Cesium.Cartographic}
 */
Cesium.Cartographic.prototype.clone = function(opt_result) {};


/**
 * @param {number} lat .
 * @param {number} lng .
 * @return {!Cesium.Cartographic}
 */
Cesium.Cartographic.fromDegrees = function(lat, lng) {};

/**
 *
 * @param {Cesium.Cartesian3} cartesian3
 * @param {Cesium.Ellipsoid=} opt_ellipsoid
 * @param {Cesium.Cartographic=} opt_result
 */
Cesium.Cartographic.fromCartesian = function(cartesian3, opt_ellipsoid, opt_result) {};

/**
 * @constructor
 * @param {!Cesium.Cartesian3|undefined} opt_origin
 * @param {!Cesium.Cartesian3|undefined} opt_direction
 */
Cesium.Ray = function(opt_origin, opt_direction) {};

/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Ray.prototype.direction;

/**
 * @constructor
 * @param {Cesium.Ellipsoid} ellipsoid
 */
Cesium.Globe = function(ellipsoid) {};

/**
 * @type {!Cesium.ImageryLayerCollection}
 */
Cesium.Globe.prototype.imageryLayers;

/**
 * @type {Cesium.Ellipsoid}
 */
Cesium.Globe.prototype.ellipsoid;


/**
 * @type {!Cesium.Color}
 */
Cesium.Globe.prototype.baseColor;


/**
 * @type {boolean}
 */
Cesium.Globe.prototype.depthTestAgainstTerrain;


/**
 * @param {!Cesium.Cartographic} cartographic
 * @return {number|undefined}
 */
Cesium.Globe.prototype.getHeight = function(cartographic) {};


/**
 * @param {!Cesium.Ray} ray
 * @param {!Cesium.Scene} scene
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3|undefined}
 */
Cesium.Globe.prototype.pick = function(ray, scene, opt_result) {};


/**
 * Merge of all values
 * @typedef {{
 *   color: (Cesium.Color | undefined),
 *   horizontal: (boolean | undefined),
 *   repeat: (number | undefined),
 *   evenColor: (Cesium.Color | undefined),
 *   oddColor: (Cesium.Color | undefined)
 * }}
 */
Cesium.optionsMaterialFromTypeAny;

/**
 * @param {string} type .
 * @param {Cesium.optionsMaterialFromTypeAny=} opt_uniforms .
 */
Cesium.Material.fromType = function(type, opt_uniforms) {};


/**
 * @constructor
 */
Cesium.PolylineCollection = function() {};


/**
 * @param {Object=} opt_opts .
 * @return {!Cesium.Polyline} .
 */
Cesium.PolylineCollection.prototype.add = function(opt_opts) {};


/**
 * @constructor
 */
Cesium.Material = function() {};


/**
 * @type {!Object} .
 */
Cesium.Material.prototype.uniforms;


/**
 * @type {string} .
 */
Cesium.Material.ColorType;


/**
 * @constructor
 */
Cesium.Polyline = function() {};


/**
 * @type {!Array.<!Cesium.Cartesian3>}
 */
Cesium.Polyline.prototype.positions;


/**
 * @type {!Cesium.Material}
 */
Cesium.Polyline.prototype.material;


/**
 * @type {number}
 */
Cesium.Polyline.prototype.width;

/**
 * @constructor
 */
Cesium.Appearance = function() {};

/**
 * @typedef {{
 *   geometryInstances: !Cesium.GeometryInstance,
 *   appearance: !Cesium.Appearance
 * }}
 */
Cesium.optionsPrimitive;

/**
 * @constructor
 * @param {Cesium.optionsPrimitive=} opt_opts
 */
Cesium.Primitive = function(opt_opts) {};

/**
 * Custom property for storing the associated Ol3 feature.
 * http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Picking.html&label=Showcases
 * @type {ol.Feature}
 */
Cesium.Primitive.prototype.olFeature;

/**
 * Custom property for storing the associated Ol3 layer.
 * http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Picking.html&label=Showcases
 * @type {ol.layer.Layer}
 */
Cesium.Primitive.prototype.olLayer;


/**
 * @typedef {{
 *   geometryInstances: (!Array.<Cesium.GeometryInstance>|Cesium.GeometryInstance)
 * }}
 */
Cesium.optionsGroundPrimitive;

/**
 * @constructor
 * @param {Cesium.optionsGroundPrimitive=} opt_opts
 * @extends {Cesium.Primitive}
 */
Cesium.GroundPrimitive = function(opt_opts) {};

/**
 * @constructor
 */
Cesium.Label = function() {};

/**
 * @constructor
 * @param {{scene: Cesium.Scene }=} opt_options
 * @extends {Cesium.Primitive}
 */
Cesium.LabelCollection = function(opt_options) {};

/**
 * @constructor
 * @struct
 */
Cesium.optionsLabelCollection = function() {};

/**
 * @type {string| undefined}
 */
Cesium.optionsLabelCollection.prototype.text;

/**
 * @type {string| undefined}
 */
Cesium.optionsLabelCollection.prototype.font;

/**
 * @type {Cesium.Cartesian2| undefined}
 */
Cesium.optionsLabelCollection.prototype.pixelOffset;

/**
 * @type {Cesium.Cartesian3 | undefined}
 */
Cesium.optionsLabelCollection.prototype.position;

/**
 * @type {Cesium.Color | undefined}
 */
Cesium.optionsLabelCollection.prototype.fillColor;

/**
 * @type {Cesium.Color | undefined}
 */
Cesium.optionsLabelCollection.prototype.outlineColor;

/**
 * @type {number | undefined}
 */
Cesium.optionsLabelCollection.prototype.outlineWidth;

/**
 * @type {number | undefined}
 */
Cesium.optionsLabelCollection.prototype.style;

/**
 * @type {Cesium.HorizontalOrigin | undefined}
 */
Cesium.optionsLabelCollection.prototype.horizontalOrigin;

/**
 * @type {Cesium.VerticalOrigin | undefined}
 */
Cesium.optionsLabelCollection.prototype.verticalOrigin;

/**
 * @type {Cesium.HeightReference | undefined}
 */
Cesium.optionsLabelCollection.prototype.heightReference;


/**
 * @param {Cesium.optionsLabelCollection} opt
 * @return {!Cesium.Label}
 */
Cesium.LabelCollection.prototype.add = function(opt) {};

/**
 * @type {Cesium.Matrix4}
 */
Cesium.LabelCollection.prototype.modelMatrix;

/**
 * @constructor
 */
Cesium.LabelStyle = function() {};

/**
 * @type {number}
 */
Cesium.LabelStyle.FILL;

/**
 * @type {number}
 */
Cesium.LabelStyle.OUTLINE;

/**
 * @type {number}
 */
Cesium.LabelStyle.FILL_AND_OUTLINE;

/**
 * @constructor
 */
Cesium.Geometry = function() {};


/**
 * @typedef {{
 *   center: !Cesium.Cartesian3,
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   radius: number
 * }}
 */
Cesium.optionsCircleGeometry;

/**
 * @constructor
 * @param {Cesium.optionsCircleGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.CircleGeometry = function(opt_opts) {};

/**
 * @typedef {{
 *   center: !Cesium.Cartesian3,
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   radius: number
 * }}
 */
Cesium.optionsCircleOutlineGeometry;

/**
 * @constructor
 * @param {Cesium.optionsCircleOutlineGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.CircleOutlineGeometry = function(opt_opts) {};

/**
 * @constructor
 * @param {number} from .
 * @param {number} to .
 */
Cesium.DistanceDisplayConditionGeometryInstanceAttribute = function(from, to) {};

/**
 * @constructor
 */
Cesium.ColorGeometryInstanceAttribute = function() {};

/**
 * @param {!Cesium.Color} color
 * @return {!Cesium.ColorGeometryInstanceAttribute}
 */
Cesium.ColorGeometryInstanceAttribute.fromColor = function(color) {};

/**
 * @constructor
 * @struct
 */
Cesium.optionsGeometryInstance = function() {};

/**
 * @type {!Cesium.Geometry}
 */
Cesium.optionsGeometryInstance.prototype.geometry;


/**
 * @constructor
 * @struct {Cesium.GeometryInstanceAttribute}
 */
Cesium.GeometryInstanceAttribute;

/**
 * @type {Cesium.GeometryInstanceAttribute| undefined}
 */
Cesium.optionsGeometryInstance.prototype.attributes;

/**
 * @type {Cesium.Color}
 */
Cesium.GeometryInstanceAttribute.prototype.color;

/**
 * @type {Cesium.DistanceDisplayConditionGeometryInstanceAttribute}
 */
Cesium.GeometryInstanceAttribute.prototype.distanceDisplayCondition;



/**
 * @constructor
 * @param {Object} object
 */
Cesium.GeometryInstance = function(object) {};


/**
 * @constructor
 */
Cesium.HorizontalOrigin = function() {};


/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.HorizontalOrigin.LEFT;

/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.HorizontalOrigin.CENTER;

/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.HorizontalOrigin.RIGHT;

/**
 * @typedef {{
 *   enabled: (boolean| undefined)
 * }}
 */
Cesium.optionsDepthTest;

/**
 * @typedef {{
 *   lineWidth: (number| undefined),
 *   depthTest: (Cesium.optionsDepthTest | undefined)
 * }}
 */
Cesium.optionsRenderState;

/**
 * @typedef {{
 *   flat: (boolean| undefined),
 *   close: (boolean| undefined),
 *   translucent: (boolean| undefined),
 *   renderState: (Cesium.optionsRenderState | undefined)
 * }}
 */
Cesium.optionsPerInstanceColorAppearance;

/**
 * @constructor
 * @param {Object} object
 * @extends {Cesium.Appearance}
 */
Cesium.PerInstanceColorAppearance = function(object) {};


/**
 * @constructor
 * @param {Object} options
 */
Cesium.VertexFormat = function(options) {};

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.DEFAULT;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.POSITION_ONLY;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.POSITION_NORMAL_AND_ST;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.POSITION_AND_NORMAL;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.POSITION_AND_ST;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.POSITION_AND_COLOR;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.VertexFormat.ALL;

/**
 * @type {Cesium.VertexFormat}
 */
Cesium.PerInstanceColorAppearance.VERTEX_FORMAT;

/**
 * @typedef {{
 *   positions: !Array.<Cesium.Cartesian3>,
 *   holes: !Array.<Cesium.optionsPolygonHierarchy>
 * }}
 */
Cesium.optionsPolygonHierarchy;


/**
 * @typedef {{
 *   width: (number|undefined),
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   perPositionHeight: (boolean|undefined),
 *   polygonHierarchy: !Cesium.optionsPolygonHierarchy
 * }}
 */
Cesium.optionsPolygonOutlineGeometry;


/**
 * @typedef {{
 *   positions: !Array.<Cesium.Cartesian3>,
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   perPositionHeight: (boolean|undefined),
 *   polygonHierarchy: !Cesium.optionsPolygonHierarchy
 * }}
 */
Cesium.optionsPolygonGeometry;



/**
 * @constructor
 * @param {Object=} object
 * @extends {Cesium.Geometry}
 */
Cesium.PolygonGeometry = function(object) {};


/**
 * @typedef {{
 *   positions: !Array.<Cesium.Cartesian3>,
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   vertexFormat: (Cesium.VertexFormat|undefined)
 * }}
 */
Cesium.optionsPolylineGeometry;



/**
 * @constructor
 * @param {Object=} object
 * @extends {Cesium.Geometry}
 */
Cesium.PolygonOutlineGeometry = function(object) {};


/**
 * @typedef {{
 *   rectangle: !Cesium.Rectangle,
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   granularity: (number|undefined),
 *   height: (number|undefined),
 *   rotation: (number|undefined),
 *   extrudedHeight: (number|undefined)
 * }}
 */
Cesium.optionsRectangleOutlineGeometry;


/**
 * @constructor
 * @param {Cesium.optionsRectangleOutlineGeometry} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.RectangleOutlineGeometry = function(opt_opts) {};


/**
 * @typedef {{
 *   positions: !Array.<Cesium.Cartesian3>,
 *   vertexFormat: (Cesium.VertexFormat|undefined)
 * }}
 */
Cesium.optionsPolylineGeometry;


/**
 * @constructor
 * @param {Object=} object
 * @extends {Cesium.Geometry}
 */
Cesium.PolylineGeometry = function(object) {};


/**
 * @typedef {{
 *   rectangle: !Cesium.Rectangle,
 *   vertexFormat: (Cesium.VertexFormat|undefined),
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   granularity: (number|undefined),
 *   height: (number|undefined),
 *   rotation: (number|undefined),
 *   stRotation: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   closeTop: (boolean|undefined),
 *   closeBottom: (boolean|undefined)
 * }}
 */
Cesium.optionsRectangleGeometry;


/**
 * @constructor
 * @param {Cesium.optionsRectangleGeometry} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.RectangleGeometry = function(opt_opts) {};

/**
 * @constructor
 * @param {Cesium.optionsCorridorGeometry} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.CorridorGeometry = function(opt_opts) {};

/**
 * @typedef {{
 *   positions: !Array.<Cesium.Cartesian3>,
 *   width: (number|undefined),
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   granularity: (number|undefined),
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   vertexFormat: (Cesium.VertexFormat|undefined),
 *   cornerType: (number|undefined),
 * }}
 */
Cesium.optionsCorridorGeometry;

/**
 * @constructor
 * @param {{material: Cesium.Material}} object
 * @extends {Cesium.Appearance}
 */
Cesium.PolylineMaterialAppearance = function(object) {};

/**
 * @type {number}
 */
Cesium.PolylineMaterialAppearance.prototype.vertexFormat;

/**
 * @constructor
 */
Cesium.Transforms = function() {};

/**
 * @param {Cesium.Cartesian3} origin .
 * @param {Cesium.Ellipsoid=} opt_ellipsoid .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {Cesium.Matrix4}
 */
Cesium.Transforms.eastNorthUpToFixedFrame = function(origin, opt_ellipsoid, opt_result) {};












/**
 * @constructor
 * @extends {Cesium.Primitive}
 */
Cesium.PrimitiveCollection = function() {};


/**
 * @param {!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.Primitive} poly .
 */
Cesium.PrimitiveCollection.prototype.add = function(poly) {};

/**
 * @param {number} index
 * @return {!Cesium.Primitive}
 */
Cesium.PrimitiveCollection.prototype.get = function(index) {};

/**
 * @param {!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.Primitive} poly .
 * @return {boolean}
 */
Cesium.PrimitiveCollection.prototype.contains = function(poly) {};

/**
 * @param {!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.PrimitiveCollection} poly .
 */
Cesium.PrimitiveCollection.prototype.raiseToTop = function(poly) {};


/**
 * @param {!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.Primitive} poly .
 */
Cesium.PrimitiveCollection.prototype.remove = function(poly) {};

/**
 */
Cesium.PrimitiveCollection.prototype.destroy = function() {};



/**
 */
Cesium.PrimitiveCollection.prototype.removeAll = function() {};


/**
 * @type {boolean}
 */
Cesium.PrimitiveCollection.prototype.destroyPrimitives;


/**
 * @type {number}
 */
Cesium.PrimitiveCollection.prototype.length;



/**
 * @constructor
 * @param {string} proxy
 */
Cesium.DefaultProxy = function(proxy) {};



/**
 * @constructor
 */
Cesium.Event = function() {};

/**
 * @param {function(...)} listener
 * @param {Object=} opt_scope
 * @return {function()}
 */
Cesium.Event.prototype.addEventListener = function(listener, opt_scope) {};


/**
 * @constructor
 * @param {string=} opt_text
 * @param {string=} opt_imageUrl
 * @param {string=} opt_link
 */
Cesium.Credit = function(opt_text, opt_imageUrl, opt_link) {};


/**
 * @constructor
 */
Cesium.TilingScheme = function() {};


/**
 * @type {Cesium.Rectangle}
 */
Cesium.TilingScheme.prototype.rectangle;


/**
 * @param {number} level
 * @return {number}
 */
Cesium.TilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {};


/**
 * @param {number} level
 * @return {number}
 */
Cesium.TilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {};


/**
 * @constructor
 * @param {Cesium.GeographicTilingSchemeOptions=} opt_options
 * @extends {Cesium.TilingScheme}
 */
Cesium.GeographicTilingScheme = function(opt_options) {};


/**
 * @typedef {{
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   numberOfLevelZeroTilesX: (number|undefined),
 *   numberOfLevelZeroTilesY: (number|undefined)
 * }}
 */
Cesium.GeographicTilingSchemeOptions;


/**
 * @type {Cesium.Ellipsoid}
 */
Cesium.GeographicTilingSchemeOptions.prototype.ellipsoid;


/**
 * @type {Cesium.Rectangle}
 */
Cesium.GeographicTilingSchemeOptions.prototype.rectangle;


/**
 * @type {number}
 */
Cesium.GeographicTilingSchemeOptions.prototype.numberOfLevelZeroTilesX;


/**
 * @type {number}
 */
Cesium.GeographicTilingSchemeOptions.prototype.numberOfLevelZeroTilesY;


/**
 * @constructor
 * @extends {Cesium.TilingScheme}
 */
Cesium.WebMercatorTilingScheme = function() {};



/**
 * @constructor
 * @param {Cesium.ImageryProvider} imageryProvider
 * @param {{rectangle: (Cesium.Rectangle|undefined),
 *          alpha: (number|Function|undefined),
 *          brightness: (number|Function|undefined),
 *          contrast: (number|Function|undefined),
 *          hue: (number|Function|undefined),
 *          saturation: (number|Function|undefined),
 *          gamma: (number|Function|undefined),
 *          show: (boolean|undefined),
 *          maximumAnisotropy: (number|undefined),
 *          minimumTerrainLevel: (number|undefined),
 *          maximumTerrainLevel: (number|undefined)}=} opt_opts
 */
Cesium.ImageryLayer = function(imageryProvider, opt_opts) {};


/**
 * @type {Cesium.ImageryProvider}
 */
Cesium.ImageryLayer.prototype.imageryProvider;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.brightness;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.contrast;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.hue;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.alpha;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.saturation;


/**
 * @type {boolean}
 */
Cesium.ImageryLayer.prototype.show;


/**
 * @type {!Cesium.Rectangle}
 */
Cesium.ImageryLayer.prototype.rectangle;


/**
 * @param {string} url
 * @param {boolean=} opt_anonymous
 * @return {Promise}
 */
Cesium.ImageryLayer.prototype.loadImage = function(url, opt_anonymous) {};


/**
 */
Cesium.ImageryLayer.prototype.destroy = function() {};



/**
 * @constructor
 */
Cesium.ImageryLayerCollection = function() {};


/**
 * @param {Cesium.ImageryProvider} provider
 * @param {number=} index
 */
Cesium.ImageryLayerCollection.prototype.addImageryProvider = function(provider, index) {};


/**
 * @type {number}
 */
Cesium.ImageryLayerCollection.prototype.length;


/**
 * @param {number} index
 * @return {Cesium.ImageryLayer} layer
 */
Cesium.ImageryLayerCollection.prototype.get = function(index) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @return {number} index
 */
Cesium.ImageryLayerCollection.prototype.indexOf = function(layer) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @param {number=} opt_index
 */
Cesium.ImageryLayerCollection.prototype.add = function(layer, opt_index) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @param {boolean=} opt_destroy
 */
Cesium.ImageryLayerCollection.prototype.remove = function(layer, opt_destroy) {};


/**
 * @param {Cesium.ImageryLayer} layer
 */
Cesium.ImageryLayerCollection.prototype.raiseToTop = function(layer) {};


/**
 * @param {boolean=} opt_destroy
 */
Cesium.ImageryLayerCollection.prototype.removeAll = function(opt_destroy) {};



/**
 * @constructor
 */
Cesium.ImageryProvider = function() {};


/**
 * @return {boolean}
 */
Cesium.ImageryProvider.prototype.isReady = function() {};


/**
 * @type {Cesium.Rectangle}
 */
Cesium.ImageryProvider.prototype.rectangle;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.tileWidth;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.tileHeight;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.minimumLevel;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.maximumLevel;


/**
 * @type {boolean}
 */
Cesium.ImageryProvider.prototype.ready;


/**
 * @type {boolean}
 */
Cesium.ImageryProvider.prototype.hasAlphaChannel;


/**
 * @type {Object|undefined}
 */
Cesium.ImageryProvider.prototype.proxy;


/**
 * @type {string}
 */
Cesium.ImageryProvider.prototype.url;


/**
 *  @type {Cesium.TilingScheme}
 */
Cesium.ImageryProvider.prototype.tilingScheme;


/**
 * //@return {TileDiscardPolicy} The discard policy.
 * // TODO
 * @type {undefined}
 */
Cesium.ImageryProvider.prototype.tileDiscardPolicy;


/**
 * @type {Cesium.Event} The event.
 */
Cesium.ImageryProvider.prototype.errorEvent;


/**
 * @return {Cesium.Credit}
 */
Cesium.ImageryProvider.prototype.credit;


/**
 * @param {number} x The tile X coordinate.
 * @param {number} y The tile Y coordinate.
 * @param {number} level The tile level.
 * @return {Array.<Cesium.Credit>|undefined}
 */
Cesium.ImageryProvider.prototype.getTileCredits = function(x, y, level) {};


/**
 * @param {number} x The tile X coordinate.
 * @param {number} y The tile Y coordinate.
 * @param {number} level The tile level.
 * @return {Object|undefined}
 */
Cesium.ImageryProvider.prototype.requestImage = function(x, y, level) {};


/**
 * @param {Cesium.ImageryProvider} imageryProvider
 * @param {string} url
 * @return {Object}
 */
Cesium.ImageryProvider.loadImage = function(imageryProvider, url) {};


/**
 * @constructor
 * @param {{url: string,
 *          key: (string|undefined),
 *          tileProtocol: (string|undefined),
 *          mapStyle: (string|undefined),
 *          tileDiscardPolicy: (Object|undefined),
 *          proxy: (Object|undefined)}} options
 * @extends {Cesium.ImageryProvider}
 */
Cesium.BingMapsImageryProvider = function(options) {};


/**
 * @constructor
 * @param {Cesium.Cartesian3} radii
 */
Cesium.Ellipsoid = function(radii) {};


/**
 * @type {!Cesium.Ellipsoid}
 */
Cesium.Ellipsoid.WGS84;

/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} opt_result
 */
Cesium.Ellipsoid.prototype.scaleToGeodeticSurface = function(cartesian, opt_result) {};

/**
 * @param {Cesium.Cartographic} cartographic
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.cartographicToCartesian = function(cartographic, opt_result) {};


/**
 * @param {!Array.<Cesium.Cartographic>} cartographics
 * @param {!Array.<Cesium.Cartesian3>=} opt_result
 * @return {!Array.<Cesium.Cartesian3>}
 */
Cesium.Ellipsoid.prototype.cartographicArrayToCartesianArray = function(cartographics, opt_result) {};


/**
 * @param {!Array.<Cesium.Cartesian3>} cartesians
 * @param {!Array.<Cesium.Cartographic>=} opt_result
 * @return {!Array.<Cesium.Cartographic>}
 */
Cesium.Ellipsoid.prototype.cartesianArrayToCartographicArray = function(cartesians, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartographic=} opt_result
 * @return {Cesium.Cartographic}
 */
Cesium.Ellipsoid.prototype.cartesianToCartographic = function(cartesian, opt_result) {};


/**
 * @param {!Cesium.Cartesian3} position .
 * @param {Cesium.Cartesian3=} opt_result .
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.transformPositionToScaledSpace = function(position, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.geocentricSurfaceNormal = function(cartesian, result) {};


/**
 * @constructor
 * @param {number=} opt_west
 * @param {number=} opt_south
 * @param {number=} opt_east
 * @param {number=} opt_north
 */
Cesium.Rectangle = function(opt_west, opt_south, opt_east, opt_north) {};

/** @type {number} */
Cesium.Rectangle.prototype.west;

/** @type {number} */
Cesium.Rectangle.prototype.south;

/** @type {number} */
Cesium.Rectangle.prototype.east;

/** @type {number} */
Cesium.Rectangle.prototype.north;

/** @type {!Cesium.Rectangle} */
Cesium.Rectangle.MAX_VALUE;

/**
 * @param {number} west
 * @param {number} south
 * @param {number} east
 * @param {number} north
 * @param {Cesium.Rectangle=} opt_result
 * @return {!Cesium.Rectangle}
 */
Cesium.Rectangle.fromDegrees = function(west, south, east, north, opt_result) {};


/**
 * @param {Array.<Cesium.Cartographic>} cartographics
 * @param {Cesium.Rectangle=} opt_result
 * @return {Cesium.Rectangle}
 */
Cesium.Rectangle.fromCartographicArray = function(cartographics, opt_result) {};


/**
 * @constructor
 */
Cesium.FeatureDetection = function() {};


/**
 * @return {boolean}
 */
Cesium.FeatureDetection.supportsCrossOriginImagery = function() {};


/**
 * @return {boolean}
 */
Cesium.FeatureDetection.supportsImageRenderingPixelated = function() {};


/**
 * @constructor
 */
Cesium.Math = function() {};


/**
 * @param {number} angle Angle in radians.
 * @return {number} angle in range [-Pi, Pi].
 */
Cesium.Math.convertLongitudeRange = function(angle) {};


/**
 * @param {number} angle Angle in radians.
 * @return {number} in the range [-Pi, Pi].
 */
Cesium.Math.negativePiToPi = function(angle) {};


/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
Cesium.Math.clamp = function(value, min, max) {};


/**
 * @type {number}
 */
Cesium.Math.PI_OVER_TWO;


/**
 * @type {number}
 */
Cesium.Math.TWO_PI;

/**
 * @param {number} rad
 * @return {number} angle in degrees
 */
Cesium.Math.toDegrees = function(rad) {};

/**
 * @param {number} degrees
 * @return {number} angle in radians
 */
Cesium.Math.toRadians = function(degrees) {};

/**
 * @constructor
 */
Cesium.Matrix3 = function() {};


/**
 * @param {Cesium.Quaternion} quaternion
 * @param {Cesium.Matrix3=} opt_result
 * @return {!Cesium.Matrix3}
 */
Cesium.Matrix3.fromQuaternion = function(quaternion, opt_result) {};


/**
 * @param {Cesium.Matrix3} matrix
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {Cesium.Cartesian3}
 */
Cesium.Matrix3.multiplyByVector = function(matrix, cartesian, result) {};



/**
 * @constructor
 * @param {number=} opt_a00 .
 * @param {number=} opt_a10 .
 * @param {number=} opt_a20 .
 * @param {number=} opt_a30 .
 * @param {number=} opt_a01 .
 * @param {number=} opt_a11 .
 * @param {number=} opt_a21 .
 * @param {number=} opt_a31 .
 * @param {number=} opt_a02 .
 * @param {number=} opt_a12 .
 * @param {number=} opt_a22 .
 * @param {number=} opt_a32 .
 * @param {number=} opt_a03 .
 * @param {number=} opt_a13 .
 * @param {number=} opt_a23 .
 * @param {number=} opt_a33 .
 */
Cesium.Matrix4 = function(opt_a00, opt_a10, opt_a20, opt_a30,
                          opt_a01, opt_a11, opt_a21, opt_a31,
                          opt_a02, opt_a12, opt_a22, opt_a32,
                          opt_a03, opt_a13, opt_a23, opt_a33) {};


/**
 * @type {Cesium.Matrix4}
 */
Cesium.Matrix4.IDENTITY;


/**
 * @param {Cesium.Matrix4} matrix
 * @param {Cesium.Matrix4=} opt_result
 * @return {!Cesium.Matrix4}
 */
Cesium.Matrix4.clone = function(matrix, opt_result) {};


/**
 * @param {Cesium.Cartesian3} translation .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {!Cesium.Matrix4} .
 */
Cesium.Matrix4.fromTranslation = function(translation, opt_result) {};

/**
 * @param {!Cesium.Cartesian3} translation
 * @param {!Cesium.Quaternion} rotation
 * @param {!Cesium.Cartesian3} scale
 * @return {!Cesium.Matrix4}
 */
Cesium.Matrix4.fromTranslationQuaternionRotationScale = function(translation, rotation, scale) {};

/**
 * @param {Cesium.Matrix4} left .
 * @param {Cesium.Matrix4} right .
 * @param {Cesium.Matrix4} result .
 * @return {!Cesium.Matrix4} .
 */
Cesium.Matrix4.multiply = function(left, right, result) {};


/**
 * @param {Cesium.Matrix4|undefined} matrix1
 * @param {Cesium.Matrix4|undefined} matrix2
 * @param {number} epsilon
 * @return {boolean}
 */
Cesium.Matrix4.equalsEpsilon = function(matrix1, matrix2, epsilon) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @return {boolean} .
 */
Cesium.Matrix4.prototype.equals = function(matrix) {};


/**
 * @param {Cesium.Matrix4} matrix
 * @param {number} epsilon
 * @return {boolean}
 */
Cesium.Matrix4.prototype.equalsEpsilon = function(matrix, epsilon) {};


/**
 * @param {Cesium.Matrix4=} opt_result
 */
Cesium.Matrix4.prototype.clone = function(opt_result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @param {Cesium.Cartesian3} point .
 * @param {Cesium.Cartesian3} result .
 * @return {Cesium.Cartesian3} .
 */
Cesium.Matrix4.multiplyByPoint = function(matrix, point, result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @param {Cesium.Cartesian4} point .
 * @param {Cesium.Cartesian4} result .
 * @return {Cesium.Cartesian4} .
 */
Cesium.Matrix4.multiplyByVector = function(matrix, point, result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @return {Array.<number>} .
 */
Cesium.Matrix4.toArray = function(matrix) {};



/**
 * @constructor
 */
Cesium.PerspectiveFrustrum = function() {};


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.aspectRatio;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.far;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.fovy;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.fov;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.near;


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.PerspectiveFrustrum.prototype.projectionMatrix;

/**
 * @param {Cesium.Cartesian3} position
 * @param {Cesium.Cartesian3} direction
 * @param {Cesium.Cartesian3} up
 * @return {Cesium.CullingVolume}
 */
Cesium.PerspectiveFrustrum.prototype.computeCullingVolume = function(position, direction, up) {};


/**
 * @param {!number} drawingBufferWidth
 * @param {!number} drawingBufferHeight
 * @param {!number} dist
 * @param {!Cesium.Cartesian2} result
 * @return {!Cesium.Cartesian2}
 */
Cesium.PerspectiveFrustrum.prototype.getPixelDimensions = function(drawingBufferWidth, drawingBufferHeight, dist, result) {};


/**
 * @constructor
 */
Cesium.Quaternion = function() {};


/**
 * @param {Cesium.Cartesian3} axis
 * @param {number} angle
 */
Cesium.Quaternion.fromAxisAngle = function(axis, angle) {};




/**
 * @constructor
 */
Cesium.Context = function() {};


/**
 * @type {!Cesium.UniformState}
 */
Cesium.Context.prototype.uniformState;

/**
 * @constructor
 */
Cesium.Fog = function() {};

/**
 * @type {boolean}
 */
Cesium.Fog.prototype.enabled;

/**
 * @type {number}
 */
Cesium.Fog.prototype.density;

/**
 * @type {number}
 */
Cesium.Fog.prototype.screenSpaceErrorFactor;

/**
 * @typedef {{
 *   canvas: (!HTMLCanvasElement),
 *   contextOptions: (!Object|undefined),
 *   creditContainer: (!Element|undefined),
 *   mapProjection: (!Object|undefined),
 *   orderIndependentTranslucency: (!boolean|undefined),
 *   scene3DOnly: (!boolean|undefined),
 *   terrainExaggeration: (!number|undefined)
 * }}
 */
Cesium.SceneOptions;

/**
 * @constructor
 * @param {!Cesium.SceneOptions} opt_opts
 */
Cesium.Scene = function(opt_opts) {};


/**
 * @type {!HTMLCanvasElement}
 */
Cesium.Scene.prototype.canvas;


/**
 * @type {!Cesium.Color}
 */
Cesium.Scene.prototype.backgroundColor;


/**
 * @type {!Cesium.Context}
 */
Cesium.Scene.prototype.context;

/**
 * @type {!Object}
 */
Cesium.Scene.prototype.mapProjection;

/**
 * @type {!Cesium.Fog}
 */
Cesium.Scene.prototype.fog;

/**
 * @type {!number}
 */
Cesium.Scene.prototype.terrainExaggeration;

/**
 */
Cesium.Scene.prototype.initializeFrame = function() {};


/**
 * @param {Cesium.JulianDate=} opt_date
 */
Cesium.Scene.prototype.render = function(opt_date) {};

/**
 * @type {Cesium.Event}
 */
Cesium.Scene.prototype.preRender;

/**
 * @type {Cesium.Event}
 */
Cesium.Scene.prototype.postRender;

/**
 * @type {!Cesium.ShadowMap}
 */
Cesium.Scene.prototype.shadowMap;

/**
 * @type {Cesium.ScreenSpaceCameraController}
 */
Cesium.Scene.prototype.screenSpaceCameraController;

/**
 * @type {Cesium.TerrainProvider}
 */
Cesium.Scene.prototype.terrainProvider;



/**
 */
Cesium.Scene.prototype.destroy = function() {};


/**
 * @type {!Cesium.Camera}
 */
Cesium.Scene.prototype.camera;


/**
 * @type {Cesium.Globe}
 */
Cesium.Scene.prototype.globe;


/**
 * @type {!Cesium.ImageryLayerCollection}
 */
Cesium.Scene.prototype.imageryLayers;


/**
 * @type {Cesium.SceneMode}
 */
Cesium.Scene.prototype.mode;


/**
 * @type {!Cesium.PrimitiveCollection}
 */
Cesium.Scene.prototype.primitives;


/**
 * @type {Object}
 */
Cesium.Scene.prototype.scene2D;


/**
 * @type {Cesium.SkyBox}
 */
Cesium.Scene.prototype.skyBox;


/**
 * @type {Cesium.SkyAtmosphere}
 */
Cesium.Scene.prototype.skyAtmosphere;

/**
 * @type {number}
 */
Cesium.Scene.prototype.maximumAliasedLineWidth;

/**
 * @param {Cesium.Cartesian3} value
 * @return {Cesium.Cartesian2}
 */
Cesium.Scene.prototype.cartesianToCanvasCoordinates = function(value) {};

/**
 * @typedef {{
 *   context: Cesium.Context,
 *   lightCamera: Cesium.Camera,
 *   enabled: (boolean|undefined),
 *   isPointLight: (boolean|undefined),
 *   pointLightRadius: (number|undefined),
 *   cascadesEnabled: (boolean|undefined),
 *   numberOfCascades: (number|undefined),
 *   maximumDistance: (number|undefined),
 *   size: (number|undefined),
 *   softShadows: (boolean|undefined),
 *   darkness: (number|undefined)
 * }}
 */
Cesium.ShadowMapOptions;


/**
 * @constructor
 * @param {Cesium.ShadowMapOptions} options
 */
Cesium.ShadowMap = function(options) {};

/**
 * @type {boolean}
 */
Cesium.ShadowMap.prototype.enabled;

/**
 * @type {boolean}
 */
Cesium.ShadowMap.prototype.softShadows;

/**
 * @type {number}
 */
Cesium.ShadowMap.prototype.maximumDistance;

/**
 * @type {number}
 */
Cesium.ShadowMap.prototype.size;

/**
 * @type {number}
 */
Cesium.ShadowMap.prototype.darkness;


/**
 * @constructor
 */
Cesium.JulianDate = function() {};


/**
 * @return {Cesium.JulianDate}
 */
Cesium.JulianDate.now = function() {};


/**
 * @constructor
 */
Cesium.DataSource = function() {};


/**
 * @constructor
 */
Cesium.GeoJsonDataSource = function() {};

/**
 * @typedef {{
 *   source: string,
 *   describe: Function,
 *   markerSize: number,
 *   markerSymbol: string,
 *   markerColor: Cesium.Color,
 *   stroke: Cesium.Color,
 *   strokeWidth: number,
 *   fill: Cesium.Color,
 *   clampToGround: boolean
 * }}
 */
Cesium.GeoJsonDataSourceLoadOptions;

/**
 * @param {string|Object} data
 * @param {!Cesium.GeoJsonDataSourceLoadOptions} options
 * @return {Cesium.DataSource|Promise.<Cesium.DataSource>}
 */
Cesium.GeoJsonDataSource.load = function(data, options) {};


/**
 * @constructor
 */
Cesium.KmlDataSource = function() {};

/**
 * @type {Cesium.EntityCollection}
 */
Cesium.KmlDataSource.prototype.entities;

/**
 * @typedef {{
 *   camera: Cesium.Camera,
 *   canvas: HTMLCanvasElement,
 *   proxy: (Cesium.DefaultProxy|undefined),
 *   sourceUri: (string|undefined),
 *   clampToGround: (boolean|undefined)
 * }}
 */
Cesium.KmlDataSourceLoadOptions;

/**
 * @param {string|Document|Blob} data
 * @param {!Cesium.KmlDataSourceLoadOptions} options
 * @return {Cesium.DataSource|Promise.<Cesium.DataSource>}
 */
Cesium.KmlDataSource.load = function(data, options) {};


/**
 * @constructor
 */
Cesium.DataSourceCollection = function() {};

/**
 * @param {Cesium.DataSource|Promise.<Cesium.DataSource>} dataSource A data source or a promise to a data source to add to the collection.
 *                                        When passing a promise, the data source will not actually be added
 *                                        to the collection until the promise resolves successfully.
 * @return {Promise.<Cesium.DataSource>} A Promise that resolves once the data source has been added to the collection.
 */
Cesium.DataSourceCollection.prototype.add = function(dataSource) {};

/**
 * Removes a data source from this collection, if present.
 *
 * @param {Cesium.DataSource} dataSource The data source to remove.
 * @param {boolean} [destroy=false] Whether to destroy the data source in addition to removing it.
 * @return {boolean} true if the data source was in the collection and was removed,
 *                    false if the data source was not in the collection.
 */
Cesium.DataSourceCollection.prototype.remove = function(dataSource, destroy) {};

/**
 * Removes all data sources from this collection, if present.
 *
 * @param {boolean} [destroy=false] Whether to destroy the data source in
 * addition to removing it.
 */
Cesium.DataSourceCollection.prototype.removeAll = function(destroy) {};


/**
 * @constructor
 * @param {{scene: Cesium.Scene,
            dataSourceCollection: Cesium.DataSourceCollection}} opt_opts
 */
Cesium.DataSourceDisplay = function(opt_opts) {};


/**
 * @param {Cesium.JulianDate} time The simulation time.
 * @return {boolean} True if all data sources are ready to be displayed, false otherwise.
 */
Cesium.DataSourceDisplay.prototype.update = function(time) {};


/**
 * @type {Cesium.CustomDataSource}
 */
Cesium.DataSourceDisplay.prototype.defaultDataSource;


/**
 * @param {Cesium.Entity} entity
 * @param {boolean} allowPartial
 * @param {Cesium.BoundingSphere} boundingSphere
 * @return {Cesium.BoundingSphereState}
 */
Cesium.DataSourceDisplay.prototype.getBoundingSphere = function(entity, allowPartial, boundingSphere) {};

/**
 * @param {string} name
 * @constructor
 */
Cesium.CustomDataSource = function(name) {};


/**
 * @type {Cesium.EntityCollection}
 */
Cesium.CustomDataSource.prototype.entities;



/**
 * @constructor
 */
Cesium.EntityCollection = function() {}

/**
 * @param {string} id
 * @return {Cesium.Entity}
 */
Cesium.EntityCollection.prototype.getById = function(id) {}

/**
 * @param {Cesium.Entity} entity
 */
Cesium.EntityCollection.prototype.remove = function(entity) {}

/**
 * @param {Object} options
 * @return {Cesium.Entity}
 */
Cesium.EntityCollection.prototype.add = function(options) {}



/**
 * @typedef {{
 *   primitive: Cesium.Primitive
 * }}
 */
Cesium.DrillObject;


/**
 * @type {Cesium.Primitive}
 */
Cesium.DrillObject.prototype.primitive;


/**
 * @param {!Cesium.Cartesian2} windowPosition
 * @return {Array.<Cesium.DrillObject>}
 */
Cesium.Scene.prototype.drillPick = function(windowPosition) {};


/**
 * @param {Cesium.Cartesian2} windowPosition
 * @param {Cesium.Cartesian3=} opt_result
 * @return {Cesium.Cartesian3}
 */
Cesium.Scene.prototype.pickPosition = function(windowPosition, opt_result) {};


/**
 * @constructor
 */
Cesium.SceneMode = function() {};


/**
 * @type {Cesium.SceneMode}
 */
Cesium.SceneMode.COLOMBUS_VIEW;


/**
 * @type {Cesium.SceneMode}
 */
Cesium.SceneMode.MORPHING;


/**
 * @type {Cesium.SceneMode}
 */
Cesium.SceneMode.SCENE2D;


/**
 * @type {Cesium.SceneMode}
 */
Cesium.SceneMode.SCENE3D;



/**
 * @constructor
 */
Cesium.SceneTransforms = function() {};


/**
 * @param {Cesium.Scene} scene
 * @param {Cesium.Cartesian3} position
 * @param {Cesium.Cartesian2=} opt_result
 * @return {Cesium.Cartesian2}
 */
Cesium.SceneTransforms.wgs84ToWindowCoordinates = function(scene, position, opt_result) {};


/**
 * @constructor
 */
Cesium.UniformState = function() {};


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.UniformState.prototype.modelViewProjection;



/**
 * @constructor
 */
Cesium.ScreenSpaceCameraController = function() {};


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.maximumZoomDistance;

/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.minimumZoomDistance;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableRotate;

/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableLook;

/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableTilt;

/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableZoom;

/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableInputs;

/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.inertiaSpin;

/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.inertiaTranslate;

/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.inertiaZoom;

/**
 * Helper typedef.
 * @typedef {{eventType: Cesium.CameraEventType,
              modifier: Cesium.KeyboardEventModifier}|Cesium.CameraEventType}
 */
Cesium._SingleEventType;

/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.lookEventTypes;

/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.rotateEventTypes;

/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.tiltEventTypes;

/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.translateEventTypes;

/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.zoomEventTypes;


/**
 * @typedef {{
 *   position: Cesium.Cartesian2,
 *   endPosition: Cesium.Cartesian2
 * }}
 */
Cesium.ScreenSpaceEventHandlerEvent;

/**
 * @constructor
 * @param {!Element} canvas .
 */
Cesium.ScreenSpaceEventHandler = function(canvas) {};

/**
 * @return {undefined}
 */
Cesium.ScreenSpaceEventHandler.prototype.destroy = function() {};

/**
 * @param {Cesium.ScreenSpaceEventType} type .
 * @param {Cesium.KeyboardEventModifier=} opt_modifier .
 */
Cesium.ScreenSpaceEventHandler.prototype.removeInputAction = function(type, opt_modifier) {};

/**
 * @param {function(Cesium.ScreenSpaceEventHandlerEvent)} callback .
 * @param {Cesium.ScreenSpaceEventType} type .
 * @param {Cesium.KeyboardEventModifier=} opt_modifier .
 */
Cesium.ScreenSpaceEventHandler.prototype.setInputAction = function(callback, type, opt_modifier) {};


/** @constructor */
Cesium.ScreenSpaceEventType = function() {};

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.LEFT_DOWN;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.LEFT_UP;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.RIGHT_DOWN;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.MIDDLE_DOWN;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.WHEEL;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.PINCH_START;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.MOUSE_MOVE;


/**
 * @constructor
 * @extends {Cesium.ImageryProvider}
 * @param {Cesium.SingleTileImageryProviderOptions} options
 */
Cesium.SingleTileImageryProvider = function(options) {};


/**
 * @typedef {{
 *   url: string,
 *   rectangle: (Cesium.Rectangle|undefined)
 * }}
 */
Cesium.SingleTileImageryProviderOptions;



/**
 * @type {Cesium.RemovedAPI}
 */
Cesium.TileMapServiceImageryProvider;



/**
 * @constructor
 */
Cesium.SkyAtmosphere = function() {};


/**
 * @constructor
 * @param {{sources: {positiveX: string, negativeX: string,
 *          positiveY: string, negativeY: string,
 *          positiveZ: string, negativeZ: string}}} options
 */
Cesium.SkyBox = function(options) {};



/**
 * @interface
 * HACK This type definition prevents positiveX and friends
 * to be renamed when passing options to Cesium.SkyBox. There
 * must be a better way to do this!
 */
Cesium.SkyBoxOptions_ = function() {};


/**
 * @type {string}
 */
Cesium.SkyBoxOptions_.prototype.positiveX;


/**
 * @type {string}
 */
Cesium.SkyBoxOptions_.prototype.negativeX;


/**
 * @type {string}
 */
Cesium.SkyBoxOptions_.prototype.positiveY;


/**
 * @type {string}
 */
Cesium.SkyBoxOptions_.prototype.negativeY;


/**
 * @type {string}
 */
Cesium.SkyBoxOptions_.prototype.positiveZ;


/**
 * @type {string}
 */
Cesium.SkyBoxOptions_.prototype.negativeZ;



/**
 * @constructor
 * @param {Cesium.Ellipsoid} ellipsoid
 */
Cesium.WebMercatorProjection = function(ellipsoid) {};


/**
 * @param {Cesium.Cartographic} cartographic
 * @return {Cesium.Cartesian3}
 */
Cesium.WebMercatorProjection.prototype.project = function(cartographic) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @return {Cesium.Cartographic}
 */
Cesium.WebMercatorProjection.prototype.unproject = function(cartesian) {};



/** @constructor */
Cesium.BingMapsStyle = function() {};

/** @type {!Cesium.BingMapsStyle} */
Cesium.BingMapsStyle.AERIAL;

/** @type {!Cesium.BingMapsStyle} */
Cesium.BingMapsStyle.AERIAL_WITH_LABELS;

/** @type {!Cesium.BingMapsStyle} */
Cesium.BingMapsStyle.ROAD;

/** @constructor */
Cesium.IntersectionTests = function() {};

/**
 * @typedef {{
 *   start: number,
 *   end: number
 * }}
 */
Cesium.StartEndObject;

/**
 * @param {!Cesium.Ray} ray
 * @param {!Cesium.Ellipsoid} ellipsoid
 * @return {Cesium.StartEndObject}
 */
Cesium.IntersectionTests.rayEllipsoid = function(ray, ellipsoid) {};

/**
 * @param {!Cesium.Ray} ray
 * @param {number} distance
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ray.getPoint = function(ray, distance) {};


/**
 * availableLevels is found in @camptocamp/Cesium.
 * @typedef {{
 *   url: (!string|undefined),
 *   credit: (!string|undefined),
 *   availableLevels: (Array<number>|undefined)
 * }}
 */
Cesium.CesiumTerrainProviderOptions;


/**
 * @constructor
 */
Cesium.TerrainProvider = function() {};


/**
 * @param {!Cesium.CesiumTerrainProviderOptions} opt_options
 * @extends {Cesium.TerrainProvider}
 * @constructor
 */
Cesium.CesiumTerrainProvider = function(opt_options) {};

/**
 * @constructor
 */
Cesium.Matrix2 = function() {};

/**
 * @param {!Cesium.Matrix2} matrix
 * @param {!Cesium.Cartesian2} vector
 * @param {!Cesium.Cartesian2} result
 * @return {!Cesium.Cartesian2}
 */
Cesium.Matrix2.multiplyByVector = function(matrix, vector, result) {};

/**
 * @param {number} angle
 * @return {!Cesium.Matrix2}
 */
Cesium.Matrix2.fromRotation = function(angle) {};



/**
 * @constructor
 */
Cesium.HeightReference = function() {};


/**
 * @const
 * @type {!Cesium.HeightReference}
 */
Cesium.HeightReference.CLAMP_TO_GROUND;


/**
 * @const
 * @type {!Cesium.HeightReference}
 */
Cesium.HeightReference.NONE;


/**
 * @const
 * @type {!Cesium.HeightReference}
 */
Cesium.HeightReference.RELATIVE_TO_GROUND;



/**
 * @param {!Cesium.WebMapTileServiceImageryProviderOptions} options
 * @extends {Cesium.ImageryProvider}
 * @constructor
 */
Cesium.WebMapTileServiceImageryProvider = function(options) {};


/**
 * @typedef {{
 *   url: string,
 *   format: string,
 *   layer: string,
 *   style: string,
 *   tileMatrixSetID: string,
 *   tileWidth: (number|undefined),
 *   tileHeight: (number|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   proxy: (Object|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   minimumLevel: (number|undefined),
 *   maximumLevel: (number|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   subdomains: (string|Array.<string>|undefined)
 * }}
 */
Cesium.WebMapTileServiceImageryProviderOptions;



/**
 * @param {!Cesium.UrlTemplateImageryProviderOptions} options
 * @extends {Cesium.ImageryProvider}
 * @constructor
 */
Cesium.UrlTemplateImageryProvider = function(options) {};


/**
 * availableLevels is found in @camptocamp/Cesium.
 * @typedef {{
 *   url: string,
 *   subdomains: (string|Array.<string>|undefined),
 *   proxy: (Object|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   minimumLevel: (number|undefined),
 *   maximumLevel: (number|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   tileWidth: (number|undefined),
 *   tileHeight: (number|undefined),
 *   hasAlphaChannel: (boolean|undefined),
 *   availableLevels: (Array<number>|undefined)
 * }}
 */
Cesium.UrlTemplateImageryProviderOptions;


/**
 * @typedef {{
 *   url: string,
 *   layers: string,
 *   parameters: (Object|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   tileWidth: (number|undefined),
 *   tileHeight: (number|undefined),
 *   minimumLevel: (number|undefined),
 *   maximumLevel: (number|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   proxy: (Object|undefined),
 *   subdomains: (string|Array.<string>|undefined)
 * }}
 */
Cesium.WebMapServiceImageryProviderOptions;



/**
 * @constructor
 * @param {Cesium.WebMapServiceImageryProviderOptions} options
 * @extends {Cesium.ImageryProvider}
 */
Cesium.WebMapServiceImageryProvider = function(options) {};


/**
 * @type {function(Object=)}
 */
Cesium.loadWithXhr;


/**
 * @type {function(...)}
 */
Cesium.loadWithXhr.load;


/**
 * @param {string} workerName
 * @param {number=} opt_maximumActiveTasks
 * @constructor
 */
Cesium.TaskProcessor = function(workerName, opt_maximumActiveTasks) {};


/**
 * @return {boolean}
 */
Cesium.TaskProcessor.prototype.isDestroyed = function() {};


/**
 * @constructor
 */
Cesium.EventHelper = function() {};


/**
 * @param {Cesium.Event} event
 * @param {function()} listener
 * @param {Object=} opt_scope
 * @return {function()}
 */
Cesium.EventHelper.prototype.add = function(event, listener, opt_scope) {};


Cesium.EventHelper.prototype.removeAll = function() {};


/**
 * @param {Cesium.Cartesian3=} center
 * @param {number=} radius
 * @constructor
 */
Cesium.BoundingSphere = function(center, radius) {};

/**
 * @param {Cesium.Rectangle} rect
 * @param {Cesium.Ellipsoid=} opt_ellipsoid
 * @param {number=} opt_height
 * @param {Cesium.BoundingSphere=} opt_result
 * @return {Cesium.BoundingSphere}
 */
Cesium.BoundingSphere.fromRectangle3D = function(rect, opt_ellipsoid, opt_height, opt_result) {};

/**
 * @enum {number}
 */
Cesium.BoundingSphereState = {
  DONE: 0,
  PENDING: 1,
  FAILED: 2
};


/**
 * @param {Object} options
 * @constructor
 */
Cesium.Entity = function(options) {};


/**
 * @param {Cesium.Entity} entity
 * @param {Cesium.Scene} scene
 * @param {Cesium.Ellipsoid} ellipsoid
 * @constructor
 */
Cesium.EntityView = function(entity, scene, ellipsoid) {};


/**
 * @param {Cesium.JulianDate} currentTime
 * @param {!Cesium.BoundingSphere|undefined} bs
 */
Cesium.EntityView.prototype.update = function(currentTime, bs) {};


/**
 * @param {function(Cesium.JulianDate, Object)} cb
 * @param {boolean} constant
 * @constructor
 */
Cesium.CallbackProperty = function(cb, constant) {};

/**
 * @param {Cesium.BoundingSphere} occluderBoundingSphere
 * @param {Cesium.Cartesian3} cameraPosition
 * @constructor
 */
Cesium.Occluder = function(occluderBoundingSphere, cameraPosition) {};

/**
 * @param {Cesium.Cartesian3} occludee
 */
Cesium.Occluder.prototype.isPointVisible  = function(occludee) {};

/**
 * @enum {number}
 */
Cesium.Intersect = {
  OUTSIDE: -1,
  INTERSECTING: 0,
  INSIDE: 1
};


/**
 * @param {Array.<Cesium.Cartesian4>} planes
 * @constructor
 */
Cesium.CullingVolume = function(planes) {};

/**
 * @param {Object} boundingVolume
 * @return {Cesium.Intersect}
 */
Cesium.CullingVolume.prototype.computeVisibility  = function(boundingVolume) {};


/**
 * @param {number} heading
 * @param {number} pitch
 * @param {number} range
 * @constructor
 */
Cesium.HeadingPitchRange = function(heading, pitch, range) {};

/**
 * @param {string} url
 * @param {boolean=} opt_anonymous
 * @return {Promise<Image>}
 */
Cesium.loadImage = function(url, opt_anonymous) {};


/**
 * @constructor
 */
Cesium.Model = function() {};

/**
 * @param {Cesium.ModelFromGltfOptions} options
 */
Cesium.Model.fromGltf = function(options) {};

/**
 * @constructor
 * @param {number} near .
 * @param {number} far .
 */
Cesium.DistanceDisplayCondition = function(near, far) {};

/**
 * @typedef {{
 *  scene: (Cesium.Scene|undefined),
 *  url: (string),
 *  heightReference: (Cesium.HeightReference|undefined),
 *  modelMatrix: (Cesium.Matrix4|undefined),
 *  minimumPixelSize: (number|undefined),
 *  distanceDisplayCondition: (Cesium.DistanceDisplayCondition|undefined),
 *  color: (Cesium.Color|undefined),
 *  silhouetteColor: (Cesium.Color|undefined),
 *  silhouetteSize: (number|undefined),
 *  allowPicking: (boolean|undefined),
 *  debugWireframe: (boolean|undefined),
 *  id: (Object|undefined)
 * }}
 */
Cesium.ModelFromGltfOptions;

/**
 * @typedef {{
 *  length: (number|undefined),
 *  width: (number|undefined),
 *  modelMatrix: (Cesium.Matrix4|undefined),
 *  show: (boolean|undefined),
 *  id: (Object|undefined)
 * }}
 */
Cesium.DebugModelMatrixPrimitiveOptions;

/**
 * @constructor
 * @extends Cesium.Primitive
 * @param {Cesium.DebugModelMatrixPrimitiveOptions} options
 */
Cesium.DebugModelMatrixPrimitive = function(options) {};
