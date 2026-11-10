import assert from 'node:assert';
import test from 'node:test';

import {get as getProjection, transformExtent} from 'ol/proj.js';
import ImageStatic from 'ol/source/ImageStatic.js';

class WebMercatorTilingScheme {}
class GeographicTilingScheme {}

type DegreeCall = {
  west: number;
  south: number;
  east: number;
  north: number;
};

const degreeCalls: DegreeCall[] = [];
const constructed: SingleTileImageryProvider[] = [];

class SingleTileImageryProvider {
  readonly url: string;
  readonly tilingScheme: unknown;
  constructor(options: {url: string; tilingScheme?: unknown}) {
    this.url = options.url;
    this.tilingScheme = options.tilingScheme;
    constructed.push(this);
  }
}

globalThis.Cesium = {
  Rectangle: {
    fromDegrees(west: number, south: number, east: number, north: number) {
      degreeCalls.push({west, south, east, north});
      const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
      return {
        west: toRadians(west),
        south: toRadians(south),
        east: toRadians(east),
        north: toRadians(north),
      };
    },
  },
  WebMercatorTilingScheme,
  GeographicTilingScheme,
  SingleTileImageryProvider,
};

const {sourceToImageryProvider} = await import('./core.js');
const viewProj = getProjection('EPSG:3857');

test('reprojects an EPSG:3857 image extent and uses a Web Mercator tiling scheme', () => {
  const imageExtent = [800000, 5800000, 1100000, 6100000];
  const source = new ImageStatic({
    url: 'mercator.png',
    projection: 'EPSG:3857',
    imageExtent,
  });

  const provider = sourceToImageryProvider(null, source, viewProj, null);
  const [west, south, east, north] = transformExtent(
    imageExtent,
    'EPSG:3857',
    'EPSG:4326',
  );
  const recorded = degreeCalls.find(
    (call) => Math.abs(call.west - west) < 1e-6,
  );

  assert.ok(recorded);
  assert.ok(Math.abs(recorded.south - south) < 1e-6);
  assert.ok(Math.abs(recorded.east - east) < 1e-6);
  assert.ok(Math.abs(recorded.north - north) < 1e-6);
  assert.ok(provider instanceof SingleTileImageryProvider);
  assert.ok(provider.tilingScheme instanceof WebMercatorTilingScheme);
});

test('keeps an EPSG:4326 image extent in degrees without a tiling scheme', () => {
  const imageExtent = [-40, 50, -10, 65];
  const source = new ImageStatic({
    url: 'geographic.png',
    projection: 'EPSG:4326',
    imageExtent,
  });

  const provider = sourceToImageryProvider(null, source, viewProj, null);

  assert.ok(
    degreeCalls.some(
      (call) =>
        call.west === imageExtent[0] &&
        call.south === imageExtent[1] &&
        call.east === imageExtent[2] &&
        call.north === imageExtent[3],
    ),
  );
  assert.ok(provider instanceof SingleTileImageryProvider);
  assert.strictEqual(provider.tilingScheme, undefined);
});

test('returns null for a projection Cesium does not support', () => {
  const source = new ImageStatic({
    url: 'lv95.png',
    projection: 'EPSG:3857',
    imageExtent: [800000, 5800000, 1100000, 6100000],
  });
  source.set('olcs_projection', {getCode: () => 'EPSG:21781'});

  assert.strictEqual(
    sourceToImageryProvider(null, source, viewProj, null),
    null,
  );
  assert.strictEqual(
    constructed.some((provider) => provider.url === 'lv95.png'),
    false,
  );
});

test('returns null when the image extent cannot be converted', () => {
  const missing = new ImageStatic({
    url: 'missing-extent.png',
    projection: 'EPSG:3857',
    imageExtent: [800000, 5800000, 1100000, 6100000],
  });
  missing.getImageExtent = () => null;

  const empty = new ImageStatic({
    url: 'empty-extent.png',
    projection: 'EPSG:3857',
    imageExtent: [10, 10, 0, 0],
  });

  assert.strictEqual(
    sourceToImageryProvider(null, missing, viewProj, null),
    null,
  );
  assert.strictEqual(
    sourceToImageryProvider(null, empty, viewProj, null),
    null,
  );
  assert.strictEqual(
    constructed.some(
      (provider) =>
        provider.url === 'missing-extent.png' ||
        provider.url === 'empty-extent.png',
    ),
    false,
  );
});
