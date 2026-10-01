import assert from 'node:assert/strict';
import test from 'node:test';
import { createBuildingFileName } from '../../src/index.js';

test('Custom building file name generation', () => {
 const date = new Date(2026, 6, 22, 22, 35, 48);
 assert.equal(
 createBuildingFileName('Loft', date),
 'Loft-20260722-2235.b3dbuilding.json'
 );
});
