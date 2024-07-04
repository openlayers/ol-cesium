import { type ProjectionLike } from 'ol/proj.js';
import olcsCoreOLImageryProvider from './core/OLImageryProvider.js';
import MVTImageryProvider from './MVTImageryProvider.js';
import { type Extent } from 'ol/extent.js';
import BaseLayer from 'ol/layer/Base.js';
import LayerGroup from 'ol/layer/Group.js';
import type { BoundingSphere, Camera, Cartesian2, Cartesian3, Cartographic, Color, ImageMaterialProperty, ImageryLayer, Matrix4, Ray, Rectangle, Scene, SingleTileImageryProvider } from 'cesium';
import Geometry from 'ol/geom/Geometry.js';
import type { Coordinate } from 'ol/coordinate.js';
import Source from 'ol/source/Source.js';
import type { Attribution } from 'ol/source/Source.js';
import Map from 'ol/Map.js';
import Projection from 'ol/proj/Projection.js';
import type { Color as OLColor } from 'ol/color.js';
import View from 'ol/View.js';
type CesiumUrlDefinition = {
    url: string;
    subdomains: string;
};
/**
 * Options for rotate around axis core function.
 */
type RotateAroundAxisOption = {
    duration?: number;
    easing?: (value: number) => number;
    callback: () => void;
};
export type LayerWithParents = {
    layer: BaseLayer;
    parents: LayerGroup[] | BaseLayer[];
};
/**
 * Compute the pixel width and height of a point in meters using the
 * camera frustum.
 */
export declare function computePixelSizeAtCoordinate(scene: Scene, target: Cartesian3): Cartesian2;
/**
 * Compute bounding box around a target point.
 * @param {!Cesium.Scene} scene
 * @param {!Cesium.Cartesian3} target
 * @param {number} amount Half the side of the box, in pixels.
 * @return {Array<Cesium.Cartographic>} bottom left and top right
 * coordinates of the box
 */
export declare function computeBoundingBoxAtTarget(scene: Scene, target: Cartesian3, amount: number): Cartographic[];
export declare function applyHeightOffsetToGeometry(geometry: Geometry, height: number): void;
export declare function createMatrixAtCoordinates(coordinates: Coordinate, rotation?: number, translation?: Cartesian3, scale?: Cartesian3): Matrix4;
export declare function rotateAroundAxis(camera: Camera, angle: number, axis: Cartesian3, transform: Matrix4, opt_options?: RotateAroundAxisOption): void;
export declare function setHeadingUsingBottomCenter(scene: Scene, heading: number, bottomCenter: Cartesian3, options?: RotateAroundAxisOption): void;
/**
 * Get the 3D position of the given pixel of the canvas.
 */
export declare function pickOnTerrainOrEllipsoid(scene: Scene, pixel: Cartesian2): Cartesian3;
/**
 * Get the 3D position of the point at the bottom-center of the screen.
 */
export declare function pickBottomPoint(scene: Scene): Cartesian3 | undefined;
/**
 * Get the 3D position of the point at the center of the screen.
 */
export declare function pickCenterPoint(scene: Scene): Cartesian3 | undefined;
/**
 * Compute the signed tilt angle on globe, between the opposite of the
 * camera direction and the target normal. Return undefined if there is no
 */
export declare function computeSignedTiltAngleOnGlobe(scene: Scene): number | undefined;
/**
 * Compute the ray from the camera to the bottom-center of the screen.
 */
export declare function bottomFovRay(scene: Scene): Ray;
/**
 * Compute the angle between two Cartesian3.
 */
export declare function signedAngleBetween(first: Cartesian3, second: Cartesian3, normal: Cartesian3): number;
/**
 * Compute the rotation angle around a given point, needed to reach the
 * zenith position.
 * At a zenith position, the camera direction is going througth the earth
 * center and the frustrum bottom ray is going through the chosen pivot
 * point.
 * The bottom-center of the screen is a good candidate for the pivot point.
 */
export declare function computeAngleToZenith(scene: Scene, pivot: Cartesian3): number;
/**
 * Convert an OpenLayers extent to a Cesium rectangle.
 * @param {ol.Extent} extent Extent.
 * @param {ol.ProjectionLike} projection Extent projection.
 * @return {Cesium.Rectangle} The corresponding Cesium rectangle.
 */
export declare function extentToRectangle(extent: Extent, projection: ProjectionLike): Rectangle;
export declare function sourceToImageryProvider(olMap: Map, source: Source, viewProj: Projection, olLayer: BaseLayer): olcsCoreOLImageryProvider | MVTImageryProvider | SingleTileImageryProvider;
/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer.
 * Only supports raster layers and export function images
 */
export declare function tileLayerToImageryLayer(olMap: Map, olLayer: BaseLayer, viewProj: Projection): ImageryLayer | null;
/**
 * Synchronizes the layer rendering properties (opacity, visible)
 * to the given Cesium ImageryLayer.
 */
export declare function updateCesiumLayerProperties(olLayerWithParents: LayerWithParents, csLayer: ImageryLayer): void;
/**
 * Convert a 2D or 3D OpenLayers coordinate to Cesium.
 */
export declare function ol4326CoordinateToCesiumCartesian(coordinate: Coordinate): Cartesian3;
/**
 * Convert an array of 2D or 3D OpenLayers coordinates to Cesium.
 */
export declare function ol4326CoordinateArrayToCsCartesians(coordinates: Coordinate[]): Cartesian3[];
/**
 * Reproject an OpenLayers geometry to EPSG:4326 if needed.
 * The geometry will be cloned only when original projection is not EPSG:4326
 * and the properties will be shallow copied.
 */
export declare function olGeometryCloneTo4326<T>(geometry: Geometry, projection: ProjectionLike): T | Geometry;
/**
 * Convert an OpenLayers color to Cesium.
 */
export declare function convertColorToCesium(olColor: OLColor | CanvasGradient | CanvasPattern | string): Color | ImageMaterialProperty;
/**
 * Convert an OpenLayers url to Cesium.
 */
export declare function convertUrlToCesium(url: string): CesiumUrlDefinition;
/**
 * Animate the return to a top-down view from the zenith.
 * The camera is rotated to orient to the North.
 */
export declare function resetToNorthZenith(map: Map, scene: Scene): Promise<undefined>;
/**
 * @param {!Cesium.Scene} scene
 * @param {number} angle in radian
 * @return {Promise<undefined>}
 * @api
 */
export declare function rotateAroundBottomCenter(scene: Scene, angle: number): Promise<undefined>;
/**
 * Set the OpenLayers view to a specific rotation and
 * the nearest resolution.
 */
export declare function normalizeView(view: View, angle?: number): void;
/**
 * Check if the given projection is managed by Cesium (WGS84 or Mercator Spheric)
 */
export declare function isCesiumProjection(projection: Projection): boolean;
export declare function attributionsFunctionToCredits(attributionsFunction: Attribution | null, zoom: number, center: Coordinate, extent: Extent): import("cesium").Credit[];
/**
 * calculate the distance between camera and centerpoint based on the resolution and latitude value
 */
export declare function calcDistanceForResolution(resolution: number, latitude: number, scene: Scene, projection: Projection): number;
/**
 * calculate the resolution based on a distance(camera to position) and latitude value
 */
export declare function calcResolutionForDistance(distance: number, latitude: number, scene: Scene, projection: Projection): number;
/**
 * Constrain the camera so that it stays close to the bounding sphere of the map extent.
 * Near the ground the allowed distance is shorter.
 */
export declare function limitCameraToBoundingSphere(camera: Camera, boundingSphere: BoundingSphere, ratio: (height: number) => number): () => void;
export {};
