import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE_LIST, getFurnitureDefinition } from '../../src/furniture/index.js';

test('V4-25: Storage ', () => {
 assert.ok(FURNITURE_LIST.length > 0, 'Furniture ');
 const bookshelfDef = getFurnitureDefinition('bookshelf');
 assert.ok(bookshelfDef, ' /Tables Furniture ');
});
