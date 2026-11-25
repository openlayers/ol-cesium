import assert from 'node:assert';
import test, {afterEach, beforeEach} from 'node:test';

import type {ImageryLayer, Scene} from 'cesium';
import type Map from 'ol/Map.js';
import View from 'ol/View.js';
import type {Options as TileLayerOptions} from 'ol/layer/BaseTile.js';
import LayerGroup from 'ol/layer/Group.js';
import TileLayer from 'ol/layer/Tile.js';
import {get as getProjection} from 'ol/proj.js';
import XYZ from 'ol/source/XYZ.js';

import RasterSynchronizer from './RasterSynchronizer.js';
import OLImageryProvider from './core/OLImageryProvider.js';

const EMPTY = Promise.resolve('empty');

const globals = globalThis as Record<string, unknown>;
let previousCesium: unknown;
let requestedUrls: string[];

class FakeImageryLayerCollection {
  layers: ImageryLayer[] = [];
  get length() {
    return this.layers.length;
  }
  add(layer: ImageryLayer) {
    this.layers.push(layer);
  }
  get(index: number) {
    return this.layers[index];
  }
  indexOf(layer: ImageryLayer) {
    return this.layers.indexOf(layer);
  }
  remove(layer: ImageryLayer) {
    this.layers = this.layers.filter((l) => l !== layer);
  }
  removeAll() {
    this.layers = [];
  }
  raiseToTop() {}
}

beforeEach(() => {
  previousCesium = globals.Cesium;
  requestedUrls = [];
  globals.Cesium = {
    ImageryProvider: {
      loadImage: (provider: unknown, url: string) => {
        requestedUrls.push(url);
        return Promise.resolve('loaded');
      },
    },
    ImageryLayerCollection: FakeImageryLayerCollection,
  };
});

afterEach(() => {
  globals.Cesium = previousCesium;
});

function createProvider(layerOptions: TileLayerOptions<XYZ>) {
  const source = new XYZ({url: 'https://tiles.test/{z}/{x}/{y}.png'});
  const layer = new TileLayer({...layerOptions, source});
  const view = new View();
  // the constructor needs a Cesium tiling scheme, only requestImage is under test
  const provider = Object.create(
    OLImageryProvider.prototype,
  ) as OLImageryProvider;
  Object.assign(provider, {
    source_: source,
    layer_: layer,
    map_: {getView: () => view},
    projection_: getProjection('EPSG:3857'),
    shouldRequestNextLevel: false,
    emptyCanvasPromise_: EMPTY,
  });
  return provider;
}

function isRequested(provider: OLImageryProvider, level: number): boolean {
  requestedUrls = [];
  const image = provider.requestImage(0, 0, level);
  return image !== EMPTY && requestedUrls.length === 1;
}

test('requests every tile of a layer without visibility range', () => {
  const provider = createProvider({});

  assert.strictEqual(isRequested(provider, 0), true);
  assert.strictEqual(isRequested(provider, 18), true);
});

test('returns an empty tile without request when the tile is too coarse for the maxResolution of the layer', () => {
  const view = new View();
  const provider = createProvider({
    maxResolution: view.getResolutionForZoom(5),
  });

  assert.strictEqual(provider.requestImage(0, 0, 4), EMPTY);
  assert.deepStrictEqual(requestedUrls, []);
});

test('requests the tiles within the minResolution and maxResolution of the layer', () => {
  const view = new View();
  const provider = createProvider({
    maxResolution: view.getResolutionForZoom(5),
    minResolution: view.getResolutionForZoom(10),
  });

  assert.strictEqual(isRequested(provider, 5), false);
  assert.strictEqual(isRequested(provider, 6), true);
  assert.strictEqual(isRequested(provider, 10), true);
  assert.strictEqual(isRequested(provider, 11), false);
});

test('excludes the minZoom of the layer, like OpenLayers', () => {
  const provider = createProvider({minZoom: 7});

  assert.strictEqual(isRequested(provider, 7), false);
  assert.strictEqual(isRequested(provider, 8), true);
});

test('includes the maxZoom of the layer, like OpenLayers', () => {
  const provider = createProvider({maxZoom: 12});

  assert.strictEqual(isRequested(provider, 12), true);
  assert.strictEqual(isRequested(provider, 13), false);
});

test('recreates the Cesium layer when the visibility range of the layer changes', () => {
  const layer = new TileLayer({
    source: new XYZ({url: 'https://tiles.test/{z}/{x}/{y}.png'}),
  });
  const view = new View();
  const group = new LayerGroup({layers: [layer]});
  const map = {
    getView: () => view,
    getLayerGroup: () => group,
  } as unknown as Map;
  const cesiumLayers = new FakeImageryLayerCollection();
  const scene = {imageryLayers: cesiumLayers} as unknown as Scene;

  const created: ImageryLayer[] = [];
  const synchronizer = new RasterSynchronizer(map, scene);
  // the conversion needs Cesium, only the synchronization is under test
  Object.assign(synchronizer, {
    convertLayerToCesiumImageries: () => {
      const cesiumLayer = {destroy: () => undefined} as ImageryLayer;
      created.push(cesiumLayer);
      return [cesiumLayer];
    },
  });
  synchronizer.synchronize();
  assert.strictEqual(created.length, 1);

  layer.setMaxResolution(1000);

  assert.strictEqual(created.length, 2);
  assert.deepStrictEqual(cesiumLayers.layers, [created[1]]);
});
