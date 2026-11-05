import assert from 'node:assert';
import test from 'node:test';

import Collection from 'ol/Collection.js';
import type Map from 'ol/Map.js';
import type Interaction from 'ol/interaction/Interaction.js';

import OLCesium from './OLCesium.js';

globalThis.cancelAnimationFrame ??= () => undefined;

function createMap(interactions: Collection<Interaction>): Map {
  const mapPrototype = {
    addInteraction: (interaction: Interaction) =>
      interactions.push(interaction),
    removeInteraction: (interaction: Interaction) =>
      interactions.remove(interaction),
  };
  return Object.assign(Object.create(mapPrototype), {
    getInteractions: () => interactions,
    getOverlayContainer: () => ({classList: {remove: () => undefined}}),
  }) as Map;
}

function createEnabledOverMap(map: Map, paused: Interaction): OLCesium {
  const ol3d = Object.create(OLCesium.prototype) as OLCesium;
  Object.assign(ol3d, {
    map_: map,
    isOverMap_: true,
    pausedInteractions_: [paused],
    hiddenRootGroup_: null,
    synchronizers_: [],
    camera_: {destroy: () => undefined},
    scene_: {destroy: () => undefined},
    moveEndRemoveCallback_: () => undefined,
    container_: {remove: () => undefined},
  });
  map.addInteraction = () => undefined;
  map.removeInteraction = () => undefined;
  return ol3d;
}

test('removes its interaction overrides from the map when destroyed', () => {
  const map = createMap(new Collection<Interaction>());
  const ol3d = createEnabledOverMap(map, {} as Interaction);

  ol3d.destroy();

  assert.strictEqual(Object.hasOwn(map, 'addInteraction'), false);
  assert.strictEqual(Object.hasOwn(map, 'removeInteraction'), false);
});

test('gives the paused interactions back to the map when destroyed', () => {
  const interactions = new Collection<Interaction>();
  const paused = {} as Interaction;
  const ol3d = createEnabledOverMap(createMap(interactions), paused);

  ol3d.destroy();

  assert.deepStrictEqual(interactions.getArray(), [paused]);
});
