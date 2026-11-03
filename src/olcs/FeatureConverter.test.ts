import assert from 'node:assert';
import test, {before} from 'node:test';

import type {GroundPolylinePrimitive, PrimitiveCollection, Scene} from 'cesium';
import Feature from 'ol/Feature.js';
import Circle from 'ol/geom/Circle.js';
import type Geometry from 'ol/geom/Geometry.js';
import LineString from 'ol/geom/LineString.js';
import Polygon from 'ol/geom/Polygon.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';

import type FeatureConverterClass from './FeatureConverter.js';

let FeatureConverter: typeof FeatureConverterClass;
let GroundPolylinePrimitiveClass: typeof GroundPolylinePrimitive;

before(async () => {
  Object.assign(globalThis, {
    HTMLCanvasElement: class {},
    HTMLImageElement: class {},
    ImageBitmap: class {},
    OffscreenCanvas: class {},
  });
  const Cesium = await import('cesium');
  Object.assign(Cesium.ContextLimits, {_maximumAliasedLineWidth: 1});
  Object.assign(globalThis, {Cesium});
  GroundPolylinePrimitiveClass = Cesium.GroundPolylinePrimitive;
  ({default: FeatureConverter} = await import('./FeatureConverter.js'));
});

const style = new Style({stroke: new Stroke({color: 'red', width: 2})});

function clampedLayer(): VectorLayer {
  const layer = new VectorLayer({source: new VectorSource()});
  layer.set('altitudeMode', 'clampToGround');
  return layer;
}

function groundPolylinesOf(
  converted: PrimitiveCollection | GroundPolylinePrimitive,
): GroundPolylinePrimitive[] {
  if (converted instanceof GroundPolylinePrimitiveClass) {
    return [converted];
  }
  const collection = converted as PrimitiveCollection;
  const found: GroundPolylinePrimitive[] = [];
  for (let i = 0; i < collection.length; i++) {
    found.push(...groundPolylinesOf(collection.get(i)));
  }
  return found;
}

function convert(
  geometry: Geometry,
  toCesium: (
    converter: FeatureConverterClass,
    layer: VectorLayer,
    feature: Feature,
  ) => PrimitiveCollection | GroundPolylinePrimitive,
) {
  const converter = new FeatureConverter({} as Scene);
  const layer = clampedLayer();
  const feature = new Feature(geometry);
  const intervals: unknown[] = [];
  const setInterval = globalThis.setInterval;
  globalThis.setInterval = ((...args: unknown[]) => {
    intervals.push(args);
    return 0;
  }) as typeof globalThis.setInterval;
  try {
    const outlines = groundPolylinesOf(toCesium(converter, layer, feature));
    return {layer, feature, outlines, intervals};
  } finally {
    globalThis.setInterval = setInterval;
  }
}

const clampedOutlines = {
  circle: () =>
    convert(new Circle([0, 0], 100), (converter, layer, feature) =>
      converter.olCircleGeometryToCesium(
        layer,
        feature,
        feature.getGeometry() as Circle,
        'EPSG:3857',
        style,
      ),
    ),
  line: () =>
    convert(
      new LineString([
        [0, 0],
        [100, 100],
      ]),
      (converter, layer, feature) =>
        converter.olLineStringGeometryToCesium(
          layer,
          feature,
          feature.getGeometry() as LineString,
          'EPSG:3857',
          style,
        ),
    ),
  polygon: () =>
    convert(
      new Polygon([
        [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 0],
        ],
      ]),
      (converter, layer, feature) =>
        converter.olPolygonGeometryToCesium(
          layer,
          feature,
          feature.getGeometry() as Polygon,
          'EPSG:3857',
          style,
        ),
    ),
};

for (const [kind, convertOutline] of Object.entries(clampedOutlines)) {
  test(`references the feature on the clamped ${kind} outline that picking returns`, () => {
    const {layer, feature, outlines} = convertOutline();

    assert.strictEqual(outlines.length, 1);
    assert.strictEqual(outlines[0].olFeature, feature);
    assert.strictEqual(outlines[0].olLayer, layer);
  });

  test(`does not poll the clamped ${kind} outline until it is ready`, () => {
    const {intervals} = convertOutline();

    assert.deepStrictEqual(intervals, []);
  });
}
