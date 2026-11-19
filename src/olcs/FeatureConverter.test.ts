import assert from 'node:assert';
import test from 'node:test';

import type {BillboardCollection} from 'cesium';
import type {Feature} from 'ol';
import type {Point} from 'ol/geom.js';
import type ImageStyle from 'ol/style/Image.js';
import type Style from 'ol/style/Style.js';

import FeatureConverter from './FeatureConverter.js';

type PrimitiveLayer = Parameters<
  FeatureConverter['createBillboardFromImage']
>[0];

// Node has no DOM and no Cesium: only what createBillboardFromImage reads.
class FakeImageBitmap {
  width = 12;
  height = 12;
}
const globals = globalThis as Record<string, unknown>;
globals.HTMLCanvasElement ??= class {};
globals.HTMLImageElement ??= class {};
globals.Image ??= class {};
globals.ImageBitmap ??= FakeImageBitmap;
globals.Cesium ??= {
  Color: class {},
  Cartesian3: class {
    static fromDegrees(x: number, y: number) {
      return {x, y};
    }
  },
  HeightReference: {NONE: 0, CLAMP_TO_GROUND: 1, RELATIVE_TO_GROUND: 2},
};

test('creates a billboard from an ImageBitmap', () => {
  const converter = Object.create(
    FeatureConverter.prototype,
  ) as FeatureConverter;
  const image = new (globals.ImageBitmap as typeof FakeImageBitmap)();
  // OpenLayers 10 returns its cached shape images (Circle, RegularShape) as ImageBitmap.
  const imageStyle = {
    getImage: () => image,
    getOpacity: () => 1,
    getScale: () => 1,
  } as unknown as ImageStyle;
  const noProperty = {get: () => undefined};
  const point = {
    ...noProperty,
    getCoordinates: () => [4.35, 50.85],
  } as unknown as Point;
  const added: unknown[] = [];
  const billboards = {
    add: (options: {image: unknown}) => {
      added.push(options.image);
      return {};
    },
  } as unknown as BillboardCollection;

  converter.createBillboardFromImage(
    noProperty as unknown as PrimitiveLayer,
    noProperty as unknown as Feature,
    point,
    'EPSG:4326',
    {} as Style,
    imageStyle,
    billboards,
    () => undefined,
  );

  assert.deepStrictEqual(added, [image]);
});
