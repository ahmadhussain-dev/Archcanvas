import test from 'node:test';
import assert from 'node:assert/strict';
import {
 getActiveMaterialDisplayName,
 getActiveMaterialArrayDisplayName,
 tryUpdateToFullMaterial
} from '../../example/js/MaterialManager.js';
import { DEFAULT_MATERIAL_PACKS } from '../../src/index.js';

test(' ： ', () => {
 const singleMat = { id: 'wood-1', name: 'Wall Panel Moulding', category: 'wood' };
 assert.equal(getActiveMaterialDisplayName(singleMat), 'Wall Panel Moulding');

 const pureWhite = { kind: 'paint', color: '#ffffff', name: ' ：#ffffff' };
 assert.equal(getActiveMaterialDisplayName(pureWhite), ' ：#ffffff');

 const matArray = [
 { componentId: 'top', material: { name: 'Wall Panel Moulding' } },
 { componentId: 'side', material: { name: 'Fluted Oak' } },
 { componentId: 'bottom', material: { name: 'Wall Panel Moulding' } }
 ];
 assert.equal(getActiveMaterialArrayDisplayName(matArray), 'Wall Panel Moulding、Fluted Oak');
});

test(' ： #ffffff Sky / ', () => {
 const skyMat = DEFAULT_MATERIAL_PACKS.find(m => m.category === 'sky');
 assert.ok(skyMat, ' Sky ');
 assert.equal(skyMat.color, '#ffffff');

 const colorVal = '#ffffff';
 
 const foundPaint = DEFAULT_MATERIAL_PACKS.find(m =>
 m.color === colorVal &&
 (m.category === 'paint' || m.kind === 'paint' || m.kind === 'color')
 );
 assert.ok(foundPaint, ' paint ');
 assert.equal(foundPaint.id, 'paint-pure-white');
 assert.notEqual(foundPaint.category, 'sky');
});

test('right-click picked floor materials replace stale deployment URLs before painting', () => {
 const staleUrl = 'https://3000thvvtest.frp.pengyg.top/blueprint3d-babylon/example/assets/brick_diamond-BXNRXH3p.jpg';
 const picked = tryUpdateToFullMaterial({
 id: 'brick-diamond',
 name: ' ',
 category: 'brick',
 kind: 'texture',
 src: staleUrl,
 color: '#ffffff'
 });

 assert.notEqual(picked.src, staleUrl);
 assert.doesNotMatch(picked.src, /^https:\/\/3000thvvtest\.frp\.pengyg\.top/);
 assert.match(picked.src, /brick_diamond\.jpg/);
});
