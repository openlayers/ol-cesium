import assert from 'node:assert';
import test, {before} from 'node:test';

import type {BillboardCollection, Scene} from 'cesium';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import type ImageStyle from 'ol/style/Image.js';
import type Style from 'ol/style/Style.js';

import type FeatureConverterClass from './FeatureConverter.js';

type PrimitiveLayer = Parameters<
  FeatureConverterClass['createBillboardFromImage']
>[0];

class PendingImage extends EventTarget {
  src = 'icon.png';
  naturalWidth = 0;
  naturalHeight = 0;
  complete = false;
}

class FakeImageBitmap {
  width = 12;
  height = 12;
}

const globals = globalThis as Record<string, unknown>;
let FeatureConverter: typeof FeatureConverterClass;

before(async () => {
  Object.assign(globalThis, {
    Cesium: {
      Color: class {},
      Cartesian3: class {
        static fromDegrees(x: number, y: number) {
          return {x, y};
        }
      },
      HeightReference: {NONE: 0, CLAMP_TO_GROUND: 1, RELATIVE_TO_GROUND: 2},
    },
    Image: PendingImage,
    ImageBitmap: FakeImageBitmap,
    HTMLCanvasElement: class {},
    HTMLImageElement: PendingImage,
  });
  ({default: FeatureConverter} = await import('./FeatureConverter.js'));
});

function waitForImage(
  converter: FeatureConverterClass,
  source: VectorSource,
  feature: Feature<Point>,
): PendingImage {
  const image = new PendingImage();
  const imageStyle = {getImage: () => image} as unknown as ImageStyle;
  const billboards = {
    isDestroyed: () => true,
  } as unknown as BillboardCollection;
  converter.createBillboardFromImage(
    new VectorLayer({source}),
    feature,
    feature.getGeometry()!,
    'EPSG:3857',
    {} as Style,
    imageStyle,
    billboards,
    () => undefined,
  );
  return image;
}

function pointFeature(): Feature<Point> {
  return new Feature(new Point([0, 0]));
}

test('stops listening to the source once the pending image has loaded', () => {
  const source = new VectorSource();
  const converter = new FeatureConverter({} as Scene);
  const image = waitForImage(converter, source, pointFeature());
  assert.strictEqual(source.hasListener('removefeature'), true);

  image.dispatchEvent(new Event('load'));

  assert.strictEqual(source.hasListener('removefeature'), false);
  assert.strictEqual(source.hasListener('clear'), false);
});

test('keeps listening while another image of the source is pending', () => {
  const source = new VectorSource();
  const converter = new FeatureConverter({} as Scene);
  const image = waitForImage(converter, source, pointFeature());
  waitForImage(converter, source, pointFeature());

  image.dispatchEvent(new Event('load'));

  assert.strictEqual(source.hasListener('removefeature'), true);
});

test('stops listening to the source once the pending feature is removed', () => {
  const feature = pointFeature();
  const source = new VectorSource({features: [feature]});
  const converter = new FeatureConverter({} as Scene);
  waitForImage(converter, source, feature);

  source.removeFeature(feature);

  assert.strictEqual(source.hasListener('removefeature'), false);
});

test('stops listening to the source once it is cleared', () => {
  const source = new VectorSource();
  const converter = new FeatureConverter({} as Scene);
  waitForImage(converter, source, pointFeature());

  source.clear();

  assert.strictEqual(source.hasListener('clear'), false);
});

test('stops listening when only another converter still waits for an image of the source', () => {
  const source = new VectorSource();
  const destroyedSceneConverter = new FeatureConverter({} as Scene);
  const liveSceneConverter = new FeatureConverter({} as Scene);
  const image = waitForImage(destroyedSceneConverter, source, pointFeature());
  waitForImage(liveSceneConverter, source, pointFeature());

  image.dispatchEvent(new Event('load'));

  assert.strictEqual(source.getListeners('removefeature')?.length, 1);
});

test('creates a billboard from an ImageBitmap', () => {
  const converter = Object.create(
    FeatureConverter.prototype,
  ) as FeatureConverterClass;
  const image = new (globals.ImageBitmap as typeof FakeImageBitmap)();
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
