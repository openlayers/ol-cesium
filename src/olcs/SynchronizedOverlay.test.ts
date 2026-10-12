import assert from 'node:assert';
import test from 'node:test';

import SynchronizedOverlay from './SynchronizedOverlay.js';

test('disconnects per-sibling observers when destroyed', () => {
  const disconnected: string[] = [];
  const overlay = Object.create(
    SynchronizedOverlay.prototype,
  ) as SynchronizedOverlay;
  const observer = (name: string) => ({
    disconnect: () => disconnected.push(name),
  });
  const attributeObservers = [observer('first'), observer('second')];

  Object.assign(overlay, {
    observer_: observer('main'),
    attributeObserver_: attributeObservers,
    listenerKeys_: [],
    element: {remove: () => undefined},
  });

  overlay.destroy();

  assert.deepStrictEqual(disconnected, ['main', 'first', 'second']);
  assert.strictEqual(attributeObservers.length, 0);
});
