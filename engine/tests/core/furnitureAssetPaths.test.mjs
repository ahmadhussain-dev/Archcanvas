import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE_LIST } from '../../src/furniture/index.js';

test('V4-37: Furniture ', () => {
 assert.ok(FURNITURE_LIST.length > 50, 'Furniture ');
 
 let validCount = 0;
 for (const def of FURNITURE_LIST) {
 if (def.type && def.name) {
 validCount += 1;
 }
 }
 assert.ok(validCount > 50, ' Furniture ');
});
