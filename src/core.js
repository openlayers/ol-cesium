goog.provide('olcs.core');

goog.require('goog.asserts');
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
  const camera = scene.camera;
  const canvas = scene.canvas;
  const frustum = camera.frustum;
  const distance = Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(
      camera.position, target, new Cesium.Cartesian3()));
  const pixelSize = new Cesium.Cartesian2();
  return frustum.getPixelDimensions(canvas.clientWidth, canvas.clientHeight,
      distance, pixelSize);
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
  const pixelSize = olcs.core.computePixelSizeAtCoordinate(scene, target);
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(target);

  const bottomLeft = Cesium.Matrix4.multiplyByPoint(
      transform,
      new Cesium.Cartesian3(-pixelSize.x * amount, -pixelSize.y * amount, 0),
      new Cesium.Cartesian3());

  const topRight = Cesium.Matrix4.multiplyByPoint(
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
  geometry.applyTransform((input, output, stride) => {
    goog.asserts.assert(input === output);
    if (stride !== undefined && stride >= 3) {
      for (let i = 0; i < output.length; i += stride) {
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
  const clamp = Cesium.Math.clamp;
  const defaultValue = Cesium.defaultValue;

  const options = opt_options || {};
  const duration = defaultValue(options.duration, 500); // ms
  const easing = defaultValue(options.easing, ol.easing.linear);
  const callback = options.callback;

  let lastProgress = 0;
  const oldTransform = new Cesium.Matrix4();

  const start = Date.now();
  const step = function() {
    const timestamp = Date.now();
    const timeDifference = timestamp - start;
    const progress = easing(clamp(timeDifference / duration, 0, 1));
    goog.asserts.assert(progress >= lastProgress);

    camera.transform.clone(oldTransform);
    const stepAngle = (progress - lastProgress) * angle;
    lastProgress = progress;
    camera.lookAtTransform(transform);
    camera.rotate(axis, stepAngle);
    camera.lookAtTransform(oldTransform);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      if (callback) {
        callback();
      }
    }
  };
  window.requestAnimationFrame(step);
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
  const camera = scene.camera;
  // Compute the camera position to zenith quaternion
  const angleToZenith = olcs.core.computeAngleToZenith(scene, bottomCenter);
  const axis = camera.right;
  const quaternion = Cesium.Quaternion.fromAxisAngle(axis, angleToZenith);
  const rotation = Cesium.Matrix3.fromQuaternion(quaternion);

  // Get the zenith point from the rotation of the position vector
  const vector = new Cesium.Cartesian3();
  Cesium.Cartesian3.subtract(camera.position, bottomCenter, vector);
  const zenith = new Cesium.Cartesian3();
  Cesium.Matrix3.multiplyByVector(rotation, vector, zenith);
  Cesium.Cartesian3.add(zenith, bottomCenter, zenith);

  // Actually rotate around the zenith normal
  const transform = Cesium.Matrix4.fromTranslation(zenith);
  const rotateAroundAxis = olcs.core.rotateAroundAxis;
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
  const ray = scene.camera.getPickRay(pixel);
  const target = scene.globe.pick(ray, scene);
  return target || scene.camera.pickEllipsoid(pixel);
};


/**
 * Get the 3D position of the point at the bottom-center of the screen.
 * @param {!Cesium.Scene} scene
 * @return {!Cesium.Cartesian3|undefined}
 * @api
 */
olcs.core.pickBottomPoint = function(scene) {
  const canvas = scene.canvas;
  const bottom = new Cesium.Cartesian2(
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
  const canvas = scene.canvas;
  const center = new Cesium.Cartesian2(
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
  const camera = scene.camera;
  const ray = new Cesium.Ray(camera.position, camera.direction);
  let target = scene.globe.pick(ray, scene);

  if (!target) {
    // no tiles in the area were loaded?
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    const obj = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
    if (obj) {
      target = Cesium.Ray.getPoint(ray, obj.start);
    }
  }

  if (!target) {
    return undefined;
  }

  const normal = new Cesium.Cartesian3();
  Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(target, normal);

  const angleBetween = olcs.core.signedAngleBetween;
  const angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
  return Cesium.Math.convertLongitudeRange(angle);
};


/**
 * Compute the ray from the camera to the bottom-center of the screen.
 * @param {!Cesium.Scene} scene
 * @return {!Cesium.Ray}
 */
olcs.core.bottomFovRay = function(scene) {
  const camera = scene.camera;
  const fovy2 = camera.frustum.fovy / 2;
  const direction = camera.direction;
  const rotation = Cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
  const matrix = Cesium.Matrix3.fromQuaternion(rotation);
  const vector = new Cesium.Cartesian3();
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
  const a = new Cesium.Cartesian3();
  const b = new Cesium.Cartesian3();
  const c = new Cesium.Cartesian3();
  Cesium.Cartesian3.normalize(first, a);
  Cesium.Cartesian3.normalize(second, b);
  Cesium.Cartesian3.cross(a, b, c);

  const cosine = Cesium.Cartesian3.dot(a, b);
  const sine = Cesium.Cartesian3.magnitude(c);

  // Sign of the vector product and the orientation normal
  const sign = Cesium.Cartesian3.dot(normal, c);
  const angle = Math.atan2(sine, cosine);
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
  const camera = scene.camera;
  const fy = camera.frustum.fovy / 2;
  const ray = olcs.core.bottomFovRay(scene);
  const direction = Cesium.Cartesian3.clone(ray.direction);
  Cesium.Cartesian3.negate(direction, direction);

  const normal = new Cesium.Cartesian3();
  Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

  const left = new Cesium.Cartesian3();
  Cesium.Cartesian3.negate(camera.right, left);

  const a = olcs.core.signedAngleBetween(normal, direction, left);
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
  if (opt_globe) {
    const height = opt_globe.getHeight(target);
    target.height = height || 0;
  }

  const ellipsoid = Cesium.Ellipsoid.WGS84;
  const targetb = ellipsoid.cartographicToCartesian(target);

  const position = camera.position;
  const up = new Cesium.Cartesian3();
  ellipsoid.geocentricSurfaceNormal(position, up);

  camera.lookAt(position, targetb, up);
};


/**
 * Convert an OpenLayers extent to a Cesium rectangle.
 * @param {ol.Extent} extent Extent.
 * @param {ol.ProjectionLike} projection Extent projection.
 * @return {Cesium.Rectangle} The corresponding Cesium rectangle.
 * @api
 */
olcs.core.extentToRectangle = function(extent, projection) {
  if (extent && projection) {
    const ext = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
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

  let provider = null;

  const source = olLayer.getSource();
  // handle special cases before the general synchronization
  if (source instanceof ol.source.WMTS) {
    // WMTS uses different TileGrid which is not currently supported
    return null;
  }
  if (source instanceof ol.source.TileImage) {
    let projection = source.getProjection();

    if (!projection) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    } else if (projection !== viewProj) {
      return null; // do not sync layers with projections different than view
    }

    const is3857 = projection === ol.proj.get('EPSG:3857');
    const is4326 = projection === ol.proj.get('EPSG:4326');
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

  const layerOptions = {};

  const ext = olLayer.getExtent();
  if (ext && viewProj) {
    layerOptions.rectangle = olcs.core.extentToRectangle(ext, viewProj);
  }

  const cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
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
  const opacity = olLayer.getOpacity();
  if (opacity !== undefined) {
    csLayer.alpha = opacity;
  }
  const visible = olLayer.getVisible();
  if (visible !== undefined) {
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
  const coo = coordinate;
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
  const toCartesian = olcs.core.ol4326CoordinateToCesiumCartesian;
  const cartesians = [];
  for (let i = 0; i < coordinates.length; ++i) {
    cartesians.push(toCartesian(coordinates[i]));
  }
  return cartesians;
};


/**
 * Reproject an OpenLayers geometry to EPSG:4326 if needed.
 * The geometry will be cloned only when original projection is not EPSG:4326
 * and the properties will be shallow copied.
 * @param {!T} geometry
 * @param {!ol.ProjectionLike} projection
 * @return {!T}
 * @template T
 * @api
 */
olcs.core.olGeometryCloneTo4326 = function(geometry, projection) {
  goog.asserts.assert(projection);

  const proj4326 = ol.proj.get('EPSG:4326');
  const proj = ol.proj.get(projection);
  if (proj !== proj4326) {
    const properties = geometry.getProperties();
    geometry = geometry.clone();
    geometry.transform(proj, proj4326);
    geometry.setProperties(properties);
  }
  return geometry;
};


/**
 * Convert an OpenLayers color to Cesium.
 * @param {ol.Color|CanvasGradient|CanvasPattern|string} olColor
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


/**
 * Convert an OpenLayers url to Cesium.
 * @param {string} url
 * @return {!olcsx.core.CesiumUrlDefinition}
 * @api
 */
olcs.core.convertUrlToCesium = function(url) {
  let subdomains = '';
  const re = /\{(\d|[a-z])-(\d|[a-z])\}/;
  const match = re.exec(url);
  if (match) {
    url = url.replace(re, '{s}');
    const startCharCode = match[1].charCodeAt(0);
    const stopCharCode = match[2].charCodeAt(0);
    let charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      subdomains += String.fromCharCode(charCode);
    }
  }
  return {
    url,
    subdomains
  };
};
