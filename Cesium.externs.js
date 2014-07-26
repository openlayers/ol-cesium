/**
 * @externs
 * @see http://cesium.agi.com/
 */
var Cesium = {};



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
 * @constructor
 */
Cesium.BillboardCollection = function() {};


/**
 * @param {Object=} opt_opts .
 * @return {Cesium.Billboard} .
 */
Cesium.BillboardCollection.prototype.add = function(opt_opts) {};


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
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.direction;


/**
 * @type {Cesium.PerspectiveFrustrum}
 */
Cesium.Camera.prototype.frustum;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.position;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.right;


/**
 * @type {Cesium.Matrix4}
 */
Cesium.Camera.prototype.transform;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.up;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.constrainedAxis;


/**
 * @type {Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.positionWC;


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
 * @type {!Cesium.Matrix4}
 */
Cesium.Camera.prototype.viewMatrix;



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
Cesium.CameraEventAggregator.prototype.isDestroyed = function() {}


/**
 */
Cesium.CameraEventAggregator.prototype.destroy = function() {};


/**
 * @param {Cesium.Cartographic} carto
 */
Cesium.Camera.prototype.setPositionCartographic = function(carto) {};


/**
 * @param {Cesium.Cartesian3} eye .
 * @param {Cesium.Cartesian3} target .
 * @param {Cesium.Cartesian3} up .
 */
Cesium.Camera.prototype.lookAt = function(eye, target, up) {};


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
 * @param {!Cesium.Cartesian2} windowPos .
 * @return {!Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.pickEllipsoid = function(windowPos) {};


/**
 * @constructor
 * @param {number} x
 * @param {number} y
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
Cesium.Cartesian3.angleBetween = function(left, right) {};



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
 * @param {number} lat .
 * @param {number} lng .
 * @return {!Cesium.Cartographic}
 */
Cesium.Cartographic.fromDegrees = function(lat, lng) {};



/**
 * @constructor
 * @param {Cesium.Ellipsoid} ellipsoid
 */
Cesium.Globe = function(ellipsoid) {};


/**
 * @type {Cesium.Ellipsoid}
 */
Cesium.Globe.prototype.ellipsoid;



/**
 * @param {Object.<string, *>=} opt_opts
 * @constructor
 */
Cesium.Polygon = function(opt_opts) {};


/**
 * @type {!Array.<!Cesium.Cartesian3>}
 */
Cesium.Polygon.prototype.positions;


/**
 * @type {!Cesium.Material} material .
 */
Cesium.Polygon.prototype.material;


/**
 * @type {boolean} .
 */
Cesium.Polygon.prototype.show;


/**
 */
Cesium.Polygon.prototype.update = function() {};



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
Cesium.PrimitiveCollection = function() {};


/**
 * @param {!Cesium.Polygon|!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.PrimitiveCollection} poly .
 */
Cesium.PrimitiveCollection.prototype.add = function(poly) {};


/**
 * @param {!Cesium.Polygon|!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.PrimitiveCollection} poly .
 */
Cesium.PrimitiveCollection.prototype.raiseToTop = function(poly) {};


/**
 * @param {!Cesium.Polygon|!Cesium.PolylineCollection|!Cesium.BillboardCollection|!Cesium.PrimitiveCollection} poly .
 */
Cesium.PrimitiveCollection.prototype.remove = function(poly) {};


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
 * @constructor
 * @param {string=} opt_text
 * @param {string=} opt_imageUrl
 * @param {string=} opt_link
 */
Cesium.Credit = function(opt_text, opt_imageUrl, opt_link) {};



/**
 * @constructor
 */
Cesium.GeographicTilingScheme = function() {};


/**
 * @type {Cesium.Rectangle}
 */
Cesium.GeographicTilingScheme.prototype.rectangle;



/**
 * @constructor
 * @param {Cesium.ImageryProvider} imageryProvider
 */
Cesium.ImageryLayer = function(imageryProvider) {};

/**
 * @type {Cesium.ImageryProvider}
 */
Cesium.ImageryLayer.prototype.imageryProvider;


/**
 * @param {string} url .
 * @return {Object} .
 */
Cesium.ImageryLayer.prototype.loadImage = function(url) {};



/**
 * @constructor
 */
Cesium.ImageryLayerCollection = function() {};


/**
 * @param {Cesium.ImageryProvider} provider
 */
Cesium.ImageryLayerCollection.prototype.addImageryProvider = function(provider) {};


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
 * @param {number=} opt_index 
 */
Cesium.ImageryLayerCollection.prototype.add = function(layer, opt_index) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @param {boolean} destroy
 */
Cesium.ImageryLayerCollection.prototype.remove = function(layer, destroy) {};



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
 * @type {string}
 */
Cesium.ImageryProvider.prototype.url;


/**
 *  //@return {TilingScheme} The tiling scheme.
 *  // TODO
 *  //@return {Cesium.GeographicTilingScheme}
 *  @type {Cesium.WebMercatorTilingScheme}
 */
Cesium.ImageryProvider.prototype.tilingScheme;


/**
 * //@returns {TileDiscardPolicy} The discard policy.
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
 * @extends {Cesium.ImageryProvider}
 */
Cesium.BingMapsImageryProvider = function(options) {};


/**
 * @constructor
 * @param {Cesium.Cartesian3} radii
 */
Cesium.Ellipsoid = function(radii) {};


/**
 * @type {Cesium.Ellipsoid}
 */
Cesium.Ellipsoid.WGS84;


/**
 * @param {Cesium.Cartographic} cartographic
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.cartographicToCartesian = function(cartographic, opt_result) {};


/**
 * @param {!Array.<Cesium.Cartographic>} cartographic
 * @param {!Array.<Cesium.Cartesian3>=} opt_result
 * @return {!Array.<Cesium.Cartesian3>}
 */
Cesium.Ellipsoid.prototype.cartographicArrayToCartesianArray = function(cartographic, opt_result) {};


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
 * @constructor
 * @param {number} west
 * @param {number} south
 * @param {number} east
 * @param {number} north
 */
Cesium.Rectangle = function(west, south, east, north) {};

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
 * @constructor
 */
Cesium.FeatureDetection = function() {};


/**
 * @return {boolean}
 */
Cesium.FeatureDetection.supportsCrossOriginImagery = function() {};



/**
 * @constructor
 */
Cesium.Math = function() {};


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
 * @constructor
 */
Cesium.Matrix3 = function() {};


/**
 * @param {Cesium.Quaternion} quaternion
 */
Cesium.Matrix3.fromQuaternion = function(quaternion) {};


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
 * @param {Cesium.Cartesian3} translation .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {Cesium.Matrix4} .
 */
Cesium.Matrix4.fromTranslation = function(translation, opt_result) {};


/**
 * @param {Cesium.Matrix4} left .
 * @param {Cesium.Matrix4} right .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {Cesium.Matrix4} .
 */
Cesium.Matrix4.multiply = function(left, right, opt_result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @return {boolean} .
 */
Cesium.Matrix4.prototype.equals = function(matrix) {};


/**
 * @param {Cesium.Matrix4} matrix .
 */
Cesium.Matrix4.prototype.clone = function(matrix) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @param {Cesium.Cartesian3} point .
 * @param {Cesium.Cartesian3=} opt_result .
 * @return {Cesium.Cartesian3} .
 */
Cesium.Matrix4.multiplyByPoint = function(matrix, point, opt_result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @param {Cesium.Cartesian4} point .
 * @param {Cesium.Cartesian4=} opt_result .
 * @return {Cesium.Cartesian4} .
 */
Cesium.Matrix4.multiplyByVector = function(matrix, point, opt_result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @return {Array.<number>} .
 */
Cesium.Matrix4.toArray = function(matrix) {};



/**
 * @constructor
 * @param {number=} opt_r .
 * @param {number=} opt_g .
 * @param {number=} opt_b .
 * @param {number=} opt_a .
 */
Cesium.Color = function(opt_r, opt_g, opt_b, opt_a) {};



/**
 * @constructor
 * @param {Object} options
 * @extends {Cesium.ImageryProvider}
 */
Cesium.OpenStreetMapImageryProvider = function(options) {};



/**
 * @constructor
 * @param {Object} options
 * @extends {Cesium.ImageryProvider}
 */
Cesium.WebMapServiceImageryProvider = function(options) {};



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
Cesium.PerspectiveFrustrum.prototype.near;


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.PerspectiveFrustrum.prototype.projectionMatrix;


/**
 * @param {!Cesium.Cartesian2} canvasDim .
 * @param {number=} opt_dist .
 * @return {!Cesium.Cartesian2}
 */
Cesium.PerspectiveFrustrum.prototype.getPixelSize = function(canvasDim, opt_dist) {};



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
 * @param {Object.<string, Object>} canvas
 */
Cesium.Scene = function(canvas) {};


/**
 * @type {HTMLCanvasElement}
 */
Cesium.Scene.prototype.canvas;


/**
 * @type {!Cesium.Context}
 */
Cesium.Scene.prototype.context;


/**
 */
Cesium.Scene.prototype.initializeFrame = function() {};


/**
 */
Cesium.Scene.prototype.render = function() {};


/**
 * @type {Cesium.ScreenSpaceCameraController}
 */
Cesium.Scene.prototype.screenSpaceCameraController;


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
 * @type {Cesium.ImageryLayerCollection}
 */
Cesium.Scene.prototype.imageryLayers;


/**
 * @type {Cesium.SceneMode}
 */
Cesium.Scene.prototype.mode;


/**
 * @type {Cesium.PrimitiveCollection}
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
 * @constructor
 * @param {!Element} canvas .
 */
Cesium.ScreenSpaceEventHandler = function(canvas) {};


/**
 * @param {Function} callback .
 * @param {Cesium.ScreenSpaceEventType} type .
 */
Cesium.ScreenSpaceEventHandler.prototype.setInputAction = function(callback, type) {};


/** @constructor */
Cesium.ScreenSpaceEventType = function() {};

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.LEFT_DOWN;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.RIGHT_DOWN;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.MIDDLE_DOWN;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.WHEEL;

/** @type {Cesium.ScreenSpaceEventType} */
Cesium.ScreenSpaceEventType.PINCH_START;



/**
 * @constructor
 * @extends {Cesium.ImageryProvider}
 * @param {Cesium.SingleTileImageryProviderOptions} options
 */
Cesium.SingleTileImageryProvider = function(options) {};


/**
 * @typedef {{url: string}}
 */
Cesium.SingleTileImageryProviderOptions;



/**
 * @constructor
 * @extends {Cesium.ImageryProvider}
 * @param {Object} options
 */
Cesium.TileMapServiceImageryProvider = function(options) {};



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



/**
 * @constructor
 */
Cesium.WebMercatorTilingScheme = function() {};


/**
 * @type {Cesium.Rectangle}
 */
//Cesium.WebMercatorTilingScheme.prototype.rectangle;


/** @constructor */
Cesium.BingMapsStyle = function() {};

/** @type {!Cesium.BingMapsStyle} */
Cesium.BingMapsStyle.AERIAL;

/** @type {!Cesium.BingMapsStyle} */
Cesium.BingMapsStyle.AERIAL_WITH_LABELS;

/** @type {!Cesium.BingMapsStyle} */
Cesium.BingMapsStyle.ROAD;