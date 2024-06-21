import test from 'node:test';
import assert from 'node:assert';

import {dashPattern} from './FeatureConverter.js';

function olPatternAsBinary(pattern: number[]): string {
  const pattern16 = dashPattern(pattern);
  return pattern16.toString(2);
}

test('pattern-100-100', (t) => {
  // Whatever the scaling, the result should be the same.
  // Only propoprtion matters.
  assert.strictEqual(olPatternAsBinary([100, 100]), '1111111100000000');
  assert.strictEqual(olPatternAsBinary([1, 1]), '1111111100000000');
  assert.strictEqual(olPatternAsBinary([999999, 999999]), '1111111100000000');
});

test('pattern-100-100-100-100', (t) => {
  // We should see 4 dashes of equal length.
  assert.strictEqual(olPatternAsBinary([100, 100, 100, 100]), '1111000011110000');
});

test('pattern-too-long', (t) => {
  // When the pattern is too long, here we have 200 segments
  // we should still ensure that the pattern is well formed (I guess):
  // - starts with a 1:
  // - ends with a 0.
  assert.strictEqual(olPatternAsBinary(Array.from({length: 200}, _ => 1)), '1000000000000000');
});


test('pattern-uneven', (t) => {
  // When the pattern is uneven, it is duplicated
  assert.strictEqual(olPatternAsBinary([6, 1, 2, 6, 1, 2]), '1111101100000100');
  assert.strictEqual(olPatternAsBinary([6, 1, 2]), '1111101100000100');
  assert.strictEqual(olPatternAsBinary([12, 2, 4]), '1111101100000100');
});
