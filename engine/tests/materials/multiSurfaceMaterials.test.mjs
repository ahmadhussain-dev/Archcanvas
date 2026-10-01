import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMaterialAssetDescriptor } from '../../src/core/materialAssets.js';

test('V4-30: 、 ', () => {
 const topSurfaceMat = resolveMaterialAssetDescriptor({ id: 'roof-tile-red', category: 'roof' });
 const sideSurfaceMat = resolveMaterialAssetDescriptor({ id: 'wall-stucco-white', category: 'wall' });

 assert.equal(topSurfaceMat.id, 'roof-tile-red');
 assert.equal(sideSurfaceMat.id, 'wall-stucco-white');
});
