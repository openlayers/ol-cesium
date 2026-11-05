import assert from 'node:assert';
import test from 'node:test';

import type {Scene} from 'cesium';
import type {Map} from 'ol';
import Observable from 'ol/Observable.js';

import Camera from './Camera.js';

test('stops listening to view changes of the map when destroyed', () => {
  const map = Object.assign(new Observable(), {getView: () => undefined});
  const camera = new Camera({camera: {}} as Scene, map as unknown as Map);

  camera.destroy();

  assert.strictEqual(map.hasListener('change:view'), false);
});
