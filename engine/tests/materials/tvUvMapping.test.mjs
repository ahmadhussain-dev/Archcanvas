import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMaterialAssetDescriptor } from '../../src/core/materialAssets.js';

test('V4-28: TV Custom UV ', () => {
 const normMat = resolveMaterialAssetDescriptor({
 id: 'tv_screen_custom',
 kind: 'texture',
 url: 'textures/tv_screen.png'
 });

 assert.ok(normMat);
 assert.equal(normMat.kind, 'texture');
});
