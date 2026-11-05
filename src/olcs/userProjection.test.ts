import assert from 'node:assert';
import test from 'node:test';

import Feature from 'ol/Feature.js';
import View from 'ol/View.js';
import Point from 'ol/geom/Point.js';
import VectorLayer from 'ol/layer/Vector.js';
import {
  clearUserProjection,
  fromLonLat,
  getUserProjection,
  useGeographic,
} from 'ol/proj.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style.js';

import Camera from './Camera.js';
import FeatureConverter from './FeatureConverter.js';
import type {OlFeatureToCesiumContext} from './core/VectorLayerCounterpart.js';

const BRUSSELS = [4.35, 50.85];

function createCamera(view: View): Camera {
  const camera = Object.create(Camera.prototype) as Camera;
  // readFromView needs a Cesium scene, only the transforms are under test.
  Object.assign(camera, {readFromView: () => undefined});
  camera['setView_'](view);
  return camera;
}

function createConverter(projections: unknown[]): FeatureConverter {
  const converter = Object.create(
    FeatureConverter.prototype,
  ) as FeatureConverter;
  Object.assign(converter, {
    scene: {},
    computePlainStyle: () => [new Style()],
    olFeatureToCesium: (
      layer: unknown,
      feature: unknown,
      style: unknown,
      context: OlFeatureToCesiumContext,
    ) => {
      projections.push(context.projection);
      return null;
    },
  });
  return converter;
}

function createLayer(): VectorLayer<VectorSource<Feature>, Feature> {
  return new VectorLayer({
    source: new VectorSource({features: [new Feature(new Point(BRUSSELS))]}),
  });
}

test('camera transforms the view center from the user projection', () => {
  useGeographic();
  try {
    const camera = createCamera(new View({center: BRUSSELS, zoom: 12}));
    assert.deepStrictEqual(camera['toLonLat_'](BRUSSELS), BRUSSELS);
    assert.deepStrictEqual(camera['fromLonLat_'](BRUSSELS), BRUSSELS);
  } finally {
    clearUserProjection();
  }
});

test('camera transforms the view center from the view projection without user projection', () => {
  const camera = createCamera(new View({center: [0, 0], zoom: 12}));
  const lonLat = camera['toLonLat_'](fromLonLat(BRUSSELS));
  assert.ok(Math.abs(lonLat[0] - BRUSSELS[0]) < 1e-9);
  assert.ok(Math.abs(lonLat[1] - BRUSSELS[1]) < 1e-9);
});

test('convert uses the user projection for feature geometries', () => {
  useGeographic();
  try {
    const projections: unknown[] = [];
    const converter = createConverter(projections);
    const layer = createLayer();
    const context = {} as OlFeatureToCesiumContext;
    converter.convert(
      layer,
      new View({center: BRUSSELS, zoom: 12}),
      layer.getSource().getFeatures()[0],
      context,
    );
    assert.deepStrictEqual(projections, [getUserProjection()]);
  } finally {
    clearUserProjection();
  }
});

test('olVectorLayerToCesium uses the user projection for feature geometries', () => {
  const globals = globalThis as {Cesium?: unknown};
  const previousCesium = globals.Cesium;
  globals.Cesium = {
    BillboardCollection: class {},
    PrimitiveCollection: class {
      add() {}
    },
  };
  useGeographic();
  try {
    const projections: unknown[] = [];
    const converter = createConverter(projections);
    converter.olVectorLayerToCesium(
      createLayer(),
      new View({center: BRUSSELS, zoom: 12}),
      {},
    );
    assert.deepStrictEqual(projections, [getUserProjection()]);
  } finally {
    clearUserProjection();
    globals.Cesium = previousCesium;
  }
});
