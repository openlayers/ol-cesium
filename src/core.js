goog.provide('olcs.core');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.source.WMTS');
goog.require('olcs.core.OLImageryProvider');


/**
 * Compute the pixel width and height of a point in meters using the
 * camera frustum.
 * @param {!Cesium.Scene} scene
 * @param {!Cesium.Cartesian3} target
 * @return {!Cesium.Cartesian2} the pixel size
 * @api
 */
olcs.core.computePixelSizeAtCoordinate = function(scene, target) {
  var camera = scene.camera;
  var canvas = scene.canvas;
  var frustum = camera.frustum;
  var canvasDimensions = new Cesium.Cartesian2(
      canvas.clientWidth, canvas.clientHeight);
  var distance = Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(
      camera.position, target, new Cesium.Cartesian3()));
  var pixelSize = frustum.getPixelSize(canvasDimensions, distance);
  return pixelSize;
};


/**
 * Compute bounding box around a target point.
 * @param {!Cesium.Scene} scene
 * @param {!Cesium.Cartesian3} target
 * @param {number} amount Half the side of the box, in pixels.
 * @return {Array<Cesium.Cartographic>} bottom left and top right
 * coordinates of the box
 */
olcs.core.computeBoundingBoxAtTarget = function(scene, target, amount) {
  var pixelSize = olcs.core.computePixelSizeAtCoordinate(scene, target);
  var transform = Cesium.Transforms.eastNorthUpToFixedFrame(target);

  var bottomLeft = Cesium.Matrix4.multiplyByPoint(
      transform,
      new Cesium.Cartesian3(-pixelSize.x * amount, -pixelSize.y * amount, 0),
      new Cesium.Cartesian3());

  var topRight = Cesium.Matrix4.multiplyByPoint(
      transform,
      new Cesium.Cartesian3(pixelSize.x * amount, pixelSize.y * amount, 0),
      new Cesium.Cartesian3());

  return Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(
      [bottomLeft, topRight]);
};


/**
 *
 * @param {!ol.geom.Geometry} geometry
 * @param {number} height
 * @api
 */
olcs.core.applyHeightOffsetToGeometry = function(geometry, height) {
  geometry.applyTransform(function(input, output, stride) {
    goog.asserts.assert(input === output);
    if (goog.isDef(stride) && stride >= 3) {
      for (var i = 0; i < output.length; i += stride) {
        output[i + 2] = output[i + 2] + height;
      }
    }
    return output;
  });
};


/**
 * @param {!Cesium.Camera} camera
 * @param {number} angle
 * @param {!Cesium.Cartesian3} axis
 * @param {!Cesium.Matrix4} transform
 * @param {olcsx.core.RotateAroundAxisOption=} opt_options
 * @api
 */
olcs.core.rotateAroundAxis = function(camera, angle, axis, transform,
    opt_options) {
  var clamp = Cesium.Math.clamp;
  var defaultValue = Cesium.defaultValue;

  var options = opt_options || {};
  var duration = defaultValue(options.duration, 500); // ms
  var easing = defaultValue(options.easing, ol.easing.linear);
  var callback = options.callback;

  var start = goog.now();
  var lastProgress = 0;
  var oldTransform = new Cesium.Matrix4();

  var animation = new goog.async.AnimationDelay(function(millis) {
    var progress = easing(clamp((millis - start) / duration, 0, 1));
    goog.asserts.assert(progress > lastProgress);

    camera.transform.clone(oldTransform);
    var stepAngle = (progress - lastProgress) * angle;
    lastProgress = progress;
    camera.lookAtTransform(transform);
    camera.rotate(axis, stepAngle);
    camera.lookAtTransform(oldTransform);

    if (progress < 1) {
      animation.start();
    } else if (callback) {
      callback();
    }
  });
  animation.start();
};


/**
 * @param {!Cesium.Scene} scene
 * @param {number} heading
 * @param {!Cesium.Cartesian3} bottomCenter
 * @param {olcsx.core.RotateAroundAxisOption=} opt_options
 * @api
 */
olcs.core.setHeadingUsingBottomCenter = function(scene, heading,
    bottomCenter, opt_options) {
  var camera = scene.camera;
  // Compute the camera position to zenith quaternion
  var angleToZenith = olcs.core.computeAngleToZenith(scene, bottomCenter);
  var axis = camera.right;
  var quaternion = Cesium.Quaternion.fromAxisAngle(axis, angleToZenith);
  var rotation = Cesium.Matrix3.fromQuaternion(quaternion);

  // Get the zenith point from the rotation of the position vector
  var vector = new Cesium.Cartesian3();
  Cesium.Cartesian3.subtract(camera.position, bottomCenter, vector);
  var zenith = new Cesium.Cartesian3();
  Cesium.Matrix3.multiplyByVector(rotation, vector, zenith);
  Cesium.Cartesian3.add(zenith, bottomCenter, zenith);

  // Actually rotate around the zenith normal
  var transform = Cesium.Matrix4.fromTranslation(zenith);
  var rotateAroundAxis = olcs.core.rotateAroundAxis;
  rotateAroundAxis(camera, heading, zenith, transform, opt_options);
};


/**
 * Get the 3D position of the given pixel of the canvas.
 * @param {!Cesium.Scene} scene
 * @param {!Cesium.Cartesian2} pixel
 * @return {!Cesium.Cartesian3|undefined}
 * @api
 */
olcs.core.pickOnTerrainOrEllipsoid = function(scene, pixel) {
  var ray = scene.camera.getPickRay(pixel);
  var target = scene.globe.pick(ray, scene);
  return target || scene.camera.pickEllipsoid(pixel);
};


/**
 * Get the 3D position of the point at the bottom-center of the screen.
 * @param {!Cesium.Scene} scene
 * @return {!Cesium.Cartesian3|undefined}
 * @api
 */
olcs.core.pickBottomPoint = function(scene) {
  var canvas = scene.canvas;
  var bottom = new Cesium.Cartesian2(
      canvas.clientWidth / 2, canvas.clientHeight);
  return olcs.core.pickOnTerrainOrEllipsoid(scene, bottom);
};


/**
 * Get the 3D position of the point at the center of the screen.
 * @param {!Cesium.Scene} scene
 * @return {!Cesium.Cartesian3|undefined}
 * @api
 */
olcs.core.pickCenterPoint = function(scene) {
  var canvas = scene.canvas;
  var center = new Cesium.Cartesian2(
      canvas.clientWidth / 2,
      canvas.clientHeight / 2);
  return olcs.core.pickOnTerrainOrEllipsoid(scene, center);
};


/**
 * Compute the signed tilt angle on globe, between the opposite of the
 * camera direction and the target normal. Return undefined if there is no
 * intersection of the camera direction with the globe.
 * @param {!Cesium.Scene} scene
 * @return {number|undefined}
 * @api
 */
olcs.core.computeSignedTiltAngleOnGlobe = function(scene) {
  var camera = scene.camera;
  var ray = new Cesium.Ray(camera.position, camera.direction);
  var target = scene.globe.pick(ray, scene);

  if (!target) {
    // no tiles in the area were loaded?
    var ellipsoid = Cesium.Ellipsoid.WGS84;
    var obj = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
    if (obj) {
      target = Cesium.Ray.getPoint(ray, obj.start);
    }
  }

  if (!target) {
    return undefined;
  }

  var normal = new Cesium.Cartesian3();
  Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(target, normal);

  var angleBetween = olcs.core.signedAngleBetween;
  var angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
  return Cesium.Math.convertLongitudeRange(angle);
};


/**
 * Compute the ray from the camera to the bottom-center of the screen.
 * @param {!Cesium.Scene} scene
 * @return {!Cesium.Ray}
 */
olcs.core.bottomFovRay = function(scene) {
  var camera = scene.camera;
  var fovy2 = camera.frustum.fovy / 2;
  var direction = camera.direction;
  var rotation = Cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
  var matrix = Cesium.Matrix3.fromQuaternion(rotation);
  var vector = new Cesium.Cartesian3();
  Cesium.Matrix3.multiplyByVector(matrix, direction, vector);
  return new Cesium.Ray(camera.position, vector);
};


/**
 * Compute the angle between two Cartesian3.
 * @param {!Cesium.Cartesian3} first
 * @param {!Cesium.Cartesian3} second
 * @param {!Cesium.Cartesian3} normal Normal to test orientation against.
 * @return {number}
 */
olcs.core.signedAngleBetween = function(first, second, normal) {
  // We are using the dot for the angle.
  // Then the cross and the dot for the sign.
  var a = new Cesium.Cartesian3();
  var b = new Cesium.Cartesian3();
  var c = new Cesium.Cartesian3();
  Cesium.Cartesian3.normalize(first, a);
  Cesium.Cartesian3.normalize(second, b);
  Cesium.Cartesian3.cross(a, b, c);

  var cosine = Cesium.Cartesian3.dot(a, b);
  var sine = Cesium.Cartesian3.magnitude(c);

  // Sign of the vector product and the orientation normal
  var sign = Cesium.Cartesian3.dot(normal, c);
  var angle = Math.atan2(sine, cosine);
  return sign >= 0 ? angle : -angle;
};


/**
 * Compute the rotation angle around a given point, needed to reach the
 * zenith position.
 * At a zenith position, the camera direction is going througth the earth
 * center and the frustrum bottom ray is going through the chosen pivot
 * point.
 * The bottom-center of the screen is a good candidate for the pivot point.
 * @param {!Cesium.Scene} scene
 * @param {!Cesium.Cartesian3} pivot Point around which the camera rotates.
 * @return {number}
 * @api
 */
olcs.core.computeAngleToZenith = function(scene, pivot) {
  // This angle is the sum of the angles 'fy' and 'a', which are defined
  // using the pivot point and its surface normal.
  //        Zenith |    camera
  //           \   |   /
  //            \fy|  /
  //             \ |a/
  //              \|/pivot
  var camera = scene.camera;
  var fy = camera.frustum.fovy / 2;
  var ray = olcs.core.bottomFovRay(scene);
  var direction = Cesium.Cartesian3.clone(ray.direction);
  Cesium.Cartesian3.negate(direction, direction);

  var normal = new Cesium.Cartesian3();
  Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

  var left = new Cesium.Cartesian3();
  Cesium.Cartesian3.negate(camera.right, left);

  var a = olcs.core.signedAngleBetween(normal, direction, left);
  return a + fy;
};


/**
 * Rotate the camera so that its direction goes through the target point.
 * If a globe is given, the target height is first interpolated from terrain.
 * @param {!Cesium.Camera} camera
 * @param {!Cesium.Cartographic} target
 * @param {Cesium.Globe=} opt_globe
 * @api
 */
olcs.core.lookAt = function(camera, target, opt_globe) {
  if (goog.isDef(opt_globe)) {
    var height = opt_globe.getHeight(target);
    target.height = goog.isDef(height) ? height : 0;
  }

  var ellipsoid = Cesium.Ellipsoid.WGS84;
  var targetb = ellipsoid.cartographicToCartesian(target);

  var position = camera.position;
  var up = new Cesium.Cartesian3();
  ellipsoid.geocentricSurfaceNormal(position, up);

  camera.lookAt(position, targetb, up);
};


/**
 * Convert an OpenLayers extent to a Cesium rectangle.
 * @param {ol.Extent} extent Extent.
 * @param {ol.proj.ProjectionLike} projection Extent projection.
 * @return {Cesium.Rectangle} The corresponding Cesium rectangle.
 * @api
 */
olcs.core.extentToRectangle = function(extent, projection) {
  if (!goog.isNull(extent) && !goog.isNull(projection)) {
    var ext = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
    return Cesium.Rectangle.fromDegrees(ext[0], ext[1], ext[2], ext[3]);
  } else {
    return null;
  }
};


/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer.
 * Only supports raster layers
 * @param {!ol.layer.Base} olLayer
 * @param {?ol.proj.Projection} viewProj Projection of the view.
 * @return {?Cesium.ImageryLayer} null if not possible (or supported)
 * @api
 */
olcs.core.tileLayerToImageryLayer = function(olLayer, viewProj) {
  if (!(olLayer instanceof ol.layer.Tile)) {
    return null;
  }

  var provider = null;

  var source = olLayer.getSource();
  // handle special cases before the general synchronization
  if (source instanceof ol.source.WMTS) {
    // WMTS uses different TileGrid which is not currently supported
    return null;
  }
  if (source instanceof ol.source.TileImage) {
    var projection = source.getProjection();

    if (goog.isNull(projection)) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    } else if (projection !== viewProj) {
      return null; // do not sync layers with projections different than view
    }

    var is3857 = projection === ol.proj.get('EPSG:3857');
    var is4326 = projection === ol.proj.get('EPSG:4326');
    if (is3857 || is4326) {
      provider = new olcs.core.OLImageryProvider(source, viewProj);
    } else {
      return null;
    }
  } else {
    // sources other than TileImage are currently not supported
    return null;
  }

  // the provider is always non-null if we got this far

  var layerOptions = {};

  var ext = olLayer.getExtent();
  if (goog.isDefAndNotNull(ext) && !goog.isNull(viewProj)) {
    layerOptions.rectangle = olcs.core.extentToRectangle(ext, viewProj);
  }

  var cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
};


/**
 * Synchronizes the layer rendering properties (opacity, visible)
 * to the given Cesium ImageryLayer.
 * @param {!ol.layer.Base} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 * @api
 */
olcs.core.updateCesiumLayerProperties = function(olLayer, csLayer) {
  var opacity = olLayer.getOpacity();
  if (goog.isDef(opacity)) {
    csLayer.alpha = opacity;
  }
  var visible = olLayer.getVisible();
  if (goog.isDef(visible)) {
    csLayer.show = visible;
  }
};


/**
 * Convert a 2D or 3D OpenLayers coordinate to Cesium.
 * @param {ol.Coordinate} coordinate Ol3 coordinate.
 * @return {!Cesium.Cartesian3} Cesium cartesian coordinate
 * @api
 */
olcs.core.ol4326CoordinateToCesiumCartesian = function(coordinate) {
  var coo = coordinate;
  goog.isDefAndNotNull(coo);
  return coo.length > 2 ?
      Cesium.Cartesian3.fromDegrees(coo[0], coo[1], coo[2]) :
      Cesium.Cartesian3.fromDegrees(coo[0], coo[1]);
};


/**
 * Convert an array of 2D or 3D OpenLayers coordinates to Cesium.
 * @param {Array.<!ol.Coordinate>} coordinates Ol3 coordinates.
 * @return {!Array.<Cesium.Cartesian3>} Cesium cartesian coordinates
 * @api
 */
olcs.core.ol4326CoordinateArrayToCsCartesians = function(coordinates) {
  goog.asserts.assert(coordinates !== null);
  var toCartesian = olcs.core.ol4326CoordinateToCesiumCartesian;
  var cartesians = [];
  for (var i = 0; i < coordinates.length; ++i) {
    cartesians.push(toCartesian(coordinates[i]));
  }
  return cartesians;
};


/**
 * Reproject an OpenLayers geometry to EPSG:4326 if needed.
 * The geometry will be cloned only when original projection is not EPSG:4326
 * and the properties will be shallow copied.
 * @param {!T} geometry
 * @param {!ol.proj.ProjectionLike} projection
 * @return {!T}
 * @template T
 * @api
 */
olcs.core.olGeometryCloneTo4326 = function(geometry, projection) {
  goog.asserts.assert(goog.isDef(projection));

  var proj4326 = ol.proj.get('EPSG:4326');
  var proj = ol.proj.get(projection);
  if (proj !== proj4326) {
    var properties = geometry.getProperties();
    geometry = geometry.clone();
    geometry.transform(proj, proj4326);
    geometry.setProperties(properties);
  }
  return geometry;
};


/**
 * Convert an OpenLayers color to Cesium.
 * @param {ol.Color|string} olColor
 * @return {!Cesium.Color}
 * @api
 */
olcs.core.convertColorToCesium = function(olColor) {
  olColor = olColor || 'black';
  if (Array.isArray(olColor)) {
    return new Cesium.Color(
        Cesium.Color.byteToFloat(olColor[0]),
        Cesium.Color.byteToFloat(olColor[1]),
        Cesium.Color.byteToFloat(olColor[2]),
        olColor[3]
    );
  } else if (typeof olColor == 'string') {
    return Cesium.Color.fromCssColorString(olColor);
  }
  goog.asserts.fail('impossible');
};
