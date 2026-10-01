import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDoorOpening, buildOpeningGeometry } from '../../src/openings/index.js';

test('V4-17: / ', () => {
 assert.equal(typeof buildDoorOpening, 'function');
 assert.equal(typeof buildOpeningGeometry, 'function');
});
