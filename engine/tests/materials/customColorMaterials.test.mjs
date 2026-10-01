import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { MaterialResolver } from '../../src/domain/MaterialResolver.js';
import { isCustomColorMaterial } from '../../example/js/MaterialManager.js';

test('isCustomColorMaterial Glass、Metal、Mirror、Paint Emissive Custom ', () => {
 const customIds = [
 'custom-glass-ff0000',
 'custom-metal-d4af37',
 'custom-mirror-e8eef4',
 'custom-paint-f9fbff',
 'custom-emissive-ffeb3b'
 ];

 for (const id of customIds) {
 assert.equal(isCustomColorMaterial(id), true, ` ${id} Custom `);
 }

 const standardIds = [
 'glass-clear',
 'metal-gold',
 'mirror-silver',
 'paint-soft-white',
 'wood-oak-natural-light',
 'custom_uploaded_texture_123'
 ];

 for (const id of standardIds) {
 assert.equal(isCustomColorMaterial(id), false, ` ${id} Custom `);
 }
});

test('MaterialResolver Glass ', () => {
 const descriptor = {
 id: 'custom-glass-ff0000',
 name: 'CustomGlass (#ff0000)',
 category: 'glass',
 kind: 'glass',
 color: '#ff0000'
 };

 const normalized = MaterialResolver.normalizeMaterialDescriptor(descriptor);
 assert.equal(normalized.kind, 'glass');
 assert.equal(normalized.category, 'glass');
 assert.equal(normalized.color, '#ff0000');
 assert.equal(normalized.alpha, 0.3, ' Glass alpha 0.3');
});

test('MaterialResolver Metal ', () => {
 const descriptor = {
 id: 'custom-metal-d4af37',
 name: 'CustomMetal (#d4af37)',
 category: 'metal',
 kind: 'metal',
 color: '#d4af37'
 };

 const normalized = MaterialResolver.normalizeMaterialDescriptor(descriptor);
 assert.equal(normalized.kind, 'metal');
 assert.equal(normalized.category, 'metal');
 assert.equal(normalized.color, '#d4af37');
 assert.equal(normalized.roughness, 0, ' Metal roughness 0');
});

test('MaterialResolver Mirror Mirror ', () => {
 const descriptor = {
 id: 'custom-mirror-e8eef4',
 name: 'CustomMirror (#e8eef4)',
 category: 'mirror',
 kind: 'mirror',
 color: '#e8eef4'
 };

 const normalized = MaterialResolver.normalizeMaterialDescriptor(descriptor);
 assert.equal(normalized.kind, 'mirror');
 assert.equal(normalized.category, 'mirror');
 assert.equal(normalized.color, '#e8eef4');
});

test('Custom material color picker element configuration', () => {
 const source = fs.readFileSync(new URL('../../example/js/MaterialManager.js', import.meta.url), 'utf8');
 const startIndex = source.indexOf('const colorInput = document.createElement');
 const pickerBlock = source.slice(startIndex, startIndex + 500);

 assert.match(pickerBlock, /colorInput\.type = 'color'/);
 assert.match(pickerBlock, /inset:0;width:100%;height:100%/);
 assert.doesNotMatch(pickerBlock, /colorInput\.click\(\)/);
 assert.doesNotMatch(pickerBlock, /pointer-events:none/);
 assert.doesNotMatch(pickerBlock, /width:0;height:0/);
});
