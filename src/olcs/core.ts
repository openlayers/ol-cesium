import {linear as linearEasing} from 'ol/easing.js';
import olLayerTile from 'ol/layer/Tile.js';
import olLayerImage from 'ol/layer/Image.js';
import {get as getProjection, type ProjectionLike, transformExtent} from 'ol/proj.js';
import olSourceImageStatic from 'ol/source/ImageStatic.js';
import olSourceImageWMS from 'ol/source/ImageWMS.js';
import olSourceTileImage from 'ol/source/TileImage.js';
import olSourceTileWMS from 'ol/source/TileWMS.js';
import olSourceVectorTile from 'ol/source/VectorTile.js';
import {defaultImageLoadFunction} from 'ol/source/Image.js';
import olcsCoreOLImageryProvider from './core/OLImageryProvider';
import {getSourceProjection} from './util';
import MVTImageryProvider from './MVTImageryProvider';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import {type Extent, getCenter as getExtentCenter} from 'ol/extent.js';
import type BaseLayer from 'ol/layer/Base.js';
import type LayerGroup from 'ol/layer/Group.js';
import type {
  BoundingSphere,
  Camera,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color, ImageMaterialProperty,
  ImageryLayer,
  Matrix4,
  Ray,
  Rectangle,
  Scene,
  SingleTileImageryProvider
} from 'cesium';
import type Geometry from 'ol/geom/Geometry.js';
import type {Coordinate} from 'ol/coordinate.js';
import type Source from 'ol/source/Source.js';
// eslint-disable-next-line no-duplicate-imports
import type {Attribution} from 'ol/source/Source.js';

import type Map from 'ol/Map.js';
import type Projection from 'ol/proj/Projection.js';
import type {Color as OLColor} from 'ol/color.js';
import type View from 'ol/View.js';

type CesiumUrlDefinition = {
    url: string,
    subdomains: string
}


/**
 * Options for rotate around axis core function.
 */
type RotateAroundAxisOption = {
  duration?: number,
  easing?: (value: number) => number,
  callback: () => void
}


export type LayerWithParents = {
  layer: BaseLayer,
  parents: LayerGroup[] | BaseLayer[]
}


/**
 * Compute the pixel width and height of a point in meters using the
 * camera frustum.
 */
export function computePixelSizeAtCoordinate(scene: Scene, target: Cartesian3): Cartesian2 {
  const camera = scene.camera;
  const canvas = scene.canvas;
  const frustum = camera.frustum;
  const distance = Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(
      camera.position, target, new Cesium.Cartesian3()));
  // @ts-ignore TS2341
  return frustum.getPixelDimensions(canvas.clientWidth, canvas.clientHeight, distance, scene.pixelRatio, new Cesium.Cartesian2());
}


/**
 * Compute bounding box around a target point.
 * @param {!Cesium.Scene} scene
 * @param {!Cesium.Cartesian3} target
 * @param {number} amount Half the side of the box, in pixels.
 * @return {Array<Cesium.Cartographic>} bottom left and top right
 * coordinates of the box
 */
export function computeBoundingBoxAtTarget(scene: Scene, target: Cartesian3, amount: number): Cartographic[] {
  const pixelSize = computePixelSizeAtCoordinate(scene, target);
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
}

export function applyHeightOffsetToGeometry(geometry: Geometry, height: number) {
  geometry.applyTransform((input, output, stride) => {
    console.assert(input === output);
    if (stride !== undefined && stride >= 3) {
      for (let i = 0; i < output.length; i += stride) {
        output[i + 2] = output[i + 2] + height;
      }
    }
    return output;
  });
}

export function createMatrixAtCoordinates(
    coordinates: Coordinate,
    rotation = 0,
    translation = Cesium.Cartesian3.ZERO,
    scale = new Cesium.Cartesian3(1, 1, 1)
): Matrix4 {
  const position = ol4326CoordinateToCesiumCartesian(coordinates);
  const rawMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const quaternion = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, -rotation);
  const rotationMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(translation, quaternion, scale);
  return Cesium.Matrix4.multiply(rawMatrix, rotationMatrix, new Cesium.Matrix4());
}

export function rotateAroundAxis(camera: Camera, angle: number, axis: Cartesian3, transform: Matrix4,
    opt_options?: RotateAroundAxisOption) {
  const clamp = Cesium.Math.clamp;
  const defaultValue = Cesium.defaultValue;

  const options: RotateAroundAxisOption = opt_options;
  const duration = defaultValue(options?.duration, 500); // ms
  const easing = defaultValue(options?.easing, linearEasing);
  const callback = options?.callback;

  let lastProgress = 0;
  const oldTransform = new Cesium.Matrix4();

  const start = Date.now();
  const step = function() {
    const timestamp = Date.now();
    const timeDifference = timestamp - start;
    const progress = easing(clamp(timeDifference / duration, 0, 1));
    console.assert(progress >= lastProgress);

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
}

export function setHeadingUsingBottomCenter(
    scene: Scene,
    heading: number,
    bottomCenter: Cartesian3,
    options?: RotateAroundAxisOption
) {
  const camera = scene.camera;
  // Compute the camera position to zenith quaternion
  const angleToZenith = computeAngleToZenith(scene, bottomCenter);
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
  rotateAroundAxis(camera, heading, zenith, transform, options);
}


/**
 * Get the 3D position of the given pixel of the canvas.
 */
export function pickOnTerrainOrEllipsoid(scene: Scene, pixel: Cartesian2): Cartesian3 {
  const ray = scene.camera.getPickRay(pixel);
  const target = scene.globe.pick(ray, scene);
  return target || scene.camera.pickEllipsoid(pixel);
}


/**
 * Get the 3D position of the point at the bottom-center of the screen.
 */
export function pickBottomPoint(scene: Scene): Cartesian3 | undefined {
  const canvas = scene.canvas;
  const bottom = new Cesium.Cartesian2(
      canvas.clientWidth / 2, canvas.clientHeight);
  return pickOnTerrainOrEllipsoid(scene, bottom);
}


/**
 * Get the 3D position of the point at the center of the screen.
 */
export function pickCenterPoint(scene: Scene): Cartesian3 | undefined {
  const canvas = scene.canvas;
  const center = new Cesium.Cartesian2(
      canvas.clientWidth / 2,
      canvas.clientHeight / 2);
  return pickOnTerrainOrEllipsoid(scene, center);
}


/**
 * Compute the signed tilt angle on globe, between the opposite of the
 * camera direction and the target normal. Return undefined if there is no
 */
export function computeSignedTiltAngleOnGlobe(scene: Scene): number | undefined {
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

  const angleBetween = signedAngleBetween;
  const angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
  return Cesium.Math.convertLongitudeRange(angle);
}


/**
 * Compute the ray from the camera to the bottom-center of the screen.
 */
export function bottomFovRay(scene: Scene): Ray {
  const camera = scene.camera;
  // @ts-ignore TS2341
  const fovy2 = camera.frustum.fovy / 2;
  const direction = camera.direction;
  const rotation = Cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
  const matrix = Cesium.Matrix3.fromQuaternion(rotation);
  const vector = new Cesium.Cartesian3();
  Cesium.Matrix3.multiplyByVector(matrix, direction, vector);
  return new Cesium.Ray(camera.position, vector);
}


/**
 * Compute the angle between two Cartesian3.
 */
export function signedAngleBetween(first: Cartesian3, second: Cartesian3, normal: Cartesian3): number {
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
}


/**
 * Compute the rotation angle around a given point, needed to reach the
 * zenith position.
 * At a zenith position, the camera direction is going througth the earth
 * center and the frustrum bottom ray is going through the chosen pivot
 * point.
 * The bottom-center of the screen is a good candidate for the pivot point.
 */
export function computeAngleToZenith(scene: Scene, pivot: Cartesian3): number {
  // This angle is the sum of the angles 'fy' and 'a', which are defined
  // using the pivot point and its surface normal.
  //        Zenith |    camera
  //           \   |   /
  //            \fy|  /
  //             \ |a/
  //              \|/pivot
  const camera = scene.camera;
  // @ts-ignore TS2341
  const fy = camera.frustum.fovy / 2;
  const ray = bottomFovRay(scene);
  const direction = Cesium.Cartesian3.clone(ray.direction);
  Cesium.Cartesian3.negate(direction, direction);

  const normal = new Cesium.Cartesian3();
  Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

  const left = new Cesium.Cartesian3();
  Cesium.Cartesian3.negate(camera.right, left);

  const a = signedAngleBetween(normal, direction, left);
  return a + fy;
}


/**
 * Convert an OpenLayers extent to a Cesium rectangle.
 * @param {ol.Extent} extent Extent.
 * @param {ol.ProjectionLike} projection Extent projection.
 * @return {Cesium.Rectangle} The corresponding Cesium rectangle.
 */
export function extentToRectangle(extent: Extent, projection: ProjectionLike) {
  if (extent && projection) {
    const ext = transformExtent(extent, projection, 'EPSG:4326');
    return Cesium.Rectangle.fromDegrees(ext[0], ext[1], ext[2], ext[3]);
  } else {
    return null;
  }
}

export function sourceToImageryProvider(
    olMap: Map,
    source: Source,
    viewProj: Projection,
    olLayer: BaseLayer
): olcsCoreOLImageryProvider | MVTImageryProvider | SingleTileImageryProvider {
  const skip = source.get('olcs_skip');
  if (skip) {
    return null;
  }
  let provider = null;
  // Convert ImageWMS to TileWMS
  if (source instanceof olSourceImageWMS && source.getUrl() &&
  source.getImageLoadFunction() === defaultImageLoadFunction) {
    const sourceProps = {
      'olcs.proxy': source.get('olcs.proxy'),
      'olcs.extent': source.get('olcs.extent'),
      'olcs.projection': source.get('olcs.projection'),
      'olcs.imagesource': source
    };
    source = new olSourceTileWMS({
      url: source.getUrl(),
      attributions: source.getAttributions(),
      projection: source.getProjection(),
      params: source.getParams()
    });
    source.setProperties(sourceProps);
  }

  if (source instanceof olSourceTileImage) {
    let projection = getSourceProjection(source);

    if (!projection) {
    // if not explicit, assume the same projection as view
      projection = viewProj;
    }

    if (isCesiumProjection(projection)) {
      provider = new olcsCoreOLImageryProvider(olMap, source, viewProj);
    }
    // Projection not supported by Cesium
    else {
      return null;
    }
  } else if (source instanceof olSourceImageStatic) {
    let projection = getSourceProjection(source);
    if (!projection) {
      projection = viewProj;
    }
    if (isCesiumProjection(projection)) {
      const rectangle: Rectangle = Cesium.Rectangle.fromDegrees(
          source.getImageExtent()[0],
          source.getImageExtent()[1],
          source.getImageExtent()[2],
          source.getImageExtent()[3],
          new Cesium.Rectangle()
      );
      provider = new Cesium.SingleTileImageryProvider({
        url: source.getUrl(),
        rectangle
      });
    }
    // Projection not supported by Cesium
    else {
      return null;
    }
  } else if (source instanceof olSourceVectorTile && olLayer instanceof VectorTileLayer) {
    let projection = getSourceProjection(source);

    if (!projection) {
      projection = viewProj;
    }
    if (skip === false) {
    // MVT is experimental, it should be whitelisted to be synchronized
      const fromCode = projection.getCode().split(':')[1];
      // @ts-ignore TS2341
      const urls = source.urls.map(u => u.replace(fromCode, '3857'));
      const extent = olLayer.getExtent();
      const rectangle = extentToRectangle(extent, projection);
      const minimumLevel = source.get('olcs_minimumLevel');
      const attributionsFunction = source.getAttributions();
      const styleFunction = olLayer.getStyleFunction();
      let credit;
      if (extent && attributionsFunction) {
        const center = getExtentCenter(extent);
        credit = attributionsFunctionToCredits(attributionsFunction, 0, center, extent)[0];
      }

      provider = new MVTImageryProvider({
        credit,
        rectangle,
        minimumLevel,
        styleFunction,
        urls
      });
      return provider;
    }
    return null; // FIXME: it is disabled by default right now
  } else {
    // sources other than TileImage|Imageexport function are currently not supported
    return null;
  }
  return provider;
}

/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer.
 * Only supports raster layers and export function images
 */
export function tileLayerToImageryLayer(olMap: Map, olLayer: BaseLayer, viewProj: Projection): ImageryLayer | null {

  if (!(olLayer instanceof olLayerTile) && !(olLayer instanceof olLayerImage) &&
  !(olLayer instanceof VectorTileLayer)) {
    return null;
  }

  const source = olLayer.getSource();
  if (!source) {
    return null;
  }
  let provider = source.get('olcs_provider');
  if (!provider) {
    provider = sourceToImageryProvider(olMap, source, viewProj, olLayer);
  }
  if (!provider) {
    return null;
  }

  const layerOptions: {rectangle?: Rectangle} = {};

  const forcedExtent = (olLayer.get('olcs.extent'));
  const ext = forcedExtent || olLayer.getExtent();
  if (ext) {
    layerOptions.rectangle = extentToRectangle(ext, viewProj);
  }

  const cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
}


/**
 * Synchronizes the layer rendering properties (opacity, visible)
 * to the given Cesium ImageryLayer.
 */
export function updateCesiumLayerProperties(olLayerWithParents: LayerWithParents, csLayer: ImageryLayer) {
  let opacity = 1;
  let visible = true;
  [olLayerWithParents.layer].concat(olLayerWithParents.parents).forEach((olLayer) => {
    const layerOpacity = olLayer.getOpacity();
    if (layerOpacity !== undefined) {
      opacity *= layerOpacity;
    }
    const layerVisible = olLayer.getVisible();
    if (layerVisible !== undefined) {
      visible = visible && layerVisible;
    }
  });
  csLayer.alpha = opacity;
  csLayer.show = visible;
}


/**
 * Convert a 2D or 3D OpenLayers coordinate to Cesium.
 */
export function ol4326CoordinateToCesiumCartesian(coordinate: Coordinate): Cartesian3 {
  const coo = coordinate;
  return coo.length > 2 ?
    Cesium.Cartesian3.fromDegrees(coo[0], coo[1], coo[2]) :
    Cesium.Cartesian3.fromDegrees(coo[0], coo[1]);
}


/**
 * Convert an array of 2D or 3D OpenLayers coordinates to Cesium.
 */
export function ol4326CoordinateArrayToCsCartesians(coordinates: Coordinate[]): Cartesian3[] {
  console.assert(coordinates !== null);
  const toCartesian = ol4326CoordinateToCesiumCartesian;
  const cartesians = [];
  for (let i = 0; i < coordinates.length; ++i) {
    cartesians.push(toCartesian(coordinates[i]));
  }
  return cartesians;
}


/**
 * Reproject an OpenLayers geometry to EPSG:4326 if needed.
 * The geometry will be cloned only when original projection is not EPSG:4326
 * and the properties will be shallow copied.
 */
export function olGeometryCloneTo4326<T extends Geometry>(geometry: T, projection: ProjectionLike): T {
  console.assert(projection);

  const proj4326 = getProjection('EPSG:4326');
  const proj = getProjection(projection);
  if (proj.getCode() !== proj4326.getCode()) {
    const properties = geometry.getProperties();
    geometry = geometry.clone() as T;
    geometry.transform(proj, proj4326);
    geometry.setProperties(properties);
  }
  return geometry;
}


/**
 * Convert an OpenLayers color to Cesium.
 */
export function convertColorToCesium(olColor: OLColor | CanvasGradient | CanvasPattern | string): Color | ImageMaterialProperty {
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
  } else if (olColor instanceof CanvasPattern || olColor instanceof CanvasGradient) {
    // Render the CanvasPattern/CanvasGradient into a canvas that will be sent to Cesium as material
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 256;
    ctx.fillStyle = olColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new Cesium.ImageMaterialProperty({
      image: canvas
    });
  }
  console.assert(false, 'impossible');
}


/**
 * Convert an OpenLayers url to Cesium.
 */
export function convertUrlToCesium(url: string): CesiumUrlDefinition {
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
}


/**
 * Animate the return to a top-down view from the zenith.
 * The camera is rotated to orient to the North.
 */
export function resetToNorthZenith(map: Map, scene: Scene): Promise<undefined> {
  return new Promise((resolve, reject) => {
    const camera = scene.camera;
    const pivot = pickBottomPoint(scene);
    if (!pivot) {
      reject('Could not get bottom pivot');
      return;
    }

    const currentHeading = map.getView().getRotation();
    if (currentHeading === undefined) {
      reject('The view is not initialized');
      return;
    }
    const angle = computeAngleToZenith(scene, pivot);

    // Point to North
    setHeadingUsingBottomCenter(scene, currentHeading, pivot);

    // Go to zenith
    const transform = Cesium.Matrix4.fromTranslation(pivot);
    const axis = camera.right;
    const options: RotateAroundAxisOption = {
      callback: () => {
        const view = map.getView();
        normalizeView(view);
        resolve(undefined);
      }
    };
    rotateAroundAxis(camera, -angle, axis, transform, options);
  });
}


/**
 * @param {!Cesium.Scene} scene
 * @param {number} angle in radian
 * @return {Promise<undefined>}
 * @api
 */
export function rotateAroundBottomCenter(scene: Scene, angle: number): Promise<undefined> {
  return new Promise((resolve, reject) => {
    const camera = scene.camera;
    const pivot = pickBottomPoint(scene);
    if (!pivot) {
      reject('could not get bottom pivot');
      return;
    }

    const options: RotateAroundAxisOption = {callback: () => resolve(undefined)};
    const transform = Cesium.Matrix4.fromTranslation(pivot);
    const axis = camera.right;
    rotateAroundAxis(camera, -angle, axis, transform, options);
  });
}


/**
 * Set the OpenLayers view to a specific rotation and
 * the nearest resolution.
 */
export function normalizeView(view: View, angle = 0) {
  const resolution = view.getResolution();
  view.setRotation(angle);

  // @ts-ignore TS2341
  if (view.constrainResolution) {
    // @ts-ignore TS2341
    view.setResolution(view.constrainResolution(resolution));
  } else {
    view.setResolution(view.getConstrainedResolution(resolution));
  }
}

/**
 * Check if the given projection is managed by Cesium (WGS84 or Mercator Spheric)
 */
export function isCesiumProjection(projection: Projection): boolean {
  const is3857 = projection.getCode() === 'EPSG:3857';
  const is4326 = projection.getCode() === 'EPSG:4326';
  return is3857 || is4326;
}

export function attributionsFunctionToCredits(
    attributionsFunction: Attribution | null,
    zoom: number,
    center: Coordinate,
    extent: Extent
) {

  if (!attributionsFunction) {
    return [];
  }
  let attributions = attributionsFunction({
    viewState: {zoom, center, projection: undefined, resolution: undefined, rotation: undefined},
    extent,
  });
  if (!Array.isArray(attributions)) {
    attributions = [attributions];
  }

  return attributions.map(html => new Cesium.Credit(html, true));
}

/**
 * calculate the distance between camera and centerpoint based on the resolution and latitude value
 */
export function calcDistanceForResolution(
    resolution: number,
    latitude: number,
    scene: Scene,
    projection: Projection
): number {
  const canvas = scene.canvas;
  const camera = scene.camera;
  // @ts-ignore TS2341
  const fovy = camera.frustum.fovy; // vertical field of view
  console.assert(!isNaN(fovy));
  const metersPerUnit = projection.getMetersPerUnit();

  // number of "map units" visible in 2D (vertically)
  const visibleMapUnits = resolution * canvas.clientHeight;

  // The metersPerUnit does not take latitude into account, but it should
  // be lower with increasing latitude -- we have to compensate.
  // In 3D it is not possible to maintain the resolution at more than one point,
  // so it only makes sense to use the latitude of the "target" point.
  const relativeCircumference = Math.cos(Math.abs(latitude));

  // how many meters should be visible in 3D
  const visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

  // distance required to view the calculated length in meters
  //
  //  fovy/2
  //    |\
  //  x | \
  //    |--\
  // visibleMeters/2
  const requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

  // NOTE: This calculation is not absolutely precise, because metersPerUnit
  // is a great simplification. It does not take ellipsoid/terrain into account.

  return requiredDistance;
}

/**
 * calculate the resolution based on a distance(camera to position) and latitude value
 */
export function calcResolutionForDistance(distance: number, latitude: number, scene: Scene, projection: Projection): number {
  // See the reverse calculation (calcDistanceForResolution) for details
  const canvas = scene.canvas;
  const camera = scene.camera;
  // @ts-ignore TS2341
  const fovy = camera.frustum.fovy; // vertical field of view
  console.assert(!isNaN(fovy));
  const metersPerUnit = projection.getMetersPerUnit();

  const visibleMeters = 2 * distance * Math.tan(fovy / 2);
  const relativeCircumference = Math.cos(Math.abs(latitude));
  const visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  const resolution = visibleMapUnits / canvas.clientHeight;

  return resolution;
}

/**
 * Constrain the camera so that it stays close to the bounding sphere of the map extent.
 * Near the ground the allowed distance is shorter.
 */
export function limitCameraToBoundingSphere(camera: Camera, boundingSphere: BoundingSphere, ratio: (height: number) => number): () => void {
  let blockLimiter = false;
  return function() {
    if (!blockLimiter) {
      const position = camera.position;
      const carto = Cesium.Cartographic.fromCartesian(position);
      if (Cesium.Cartesian3.distance(boundingSphere.center, position) > boundingSphere.radius * ratio(carto.height)) {
        // @ts-ignore TS2339: FIXME, there is no flying property in Camera
        const currentlyFlying = camera.flying;
        if (currentlyFlying === true) {
          // There is a flying property and its value is true
          return;
        } else {
          blockLimiter = true;
          const unblockLimiter = () => (blockLimiter = false);
          camera.flyToBoundingSphere(boundingSphere, {
            complete: unblockLimiter,
            cancel: unblockLimiter,
          });
        }
      }
    }
  };
}
