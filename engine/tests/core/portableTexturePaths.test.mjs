import assert from 'node:assert/strict';
import test from 'node:test';
import { stringifyBuildingFile, parseBuildingFile, resolveMaterialAssetDescriptor } from '../../src/index.js';

const devUrl = 'http://localhost:5173/editor/@fs/D:/WebDevelopment/Archcanvas/engine/src/textures/brick_red.jpg';

function plan(material) {
  return {
    name: 'Test',
    unit: 'm',
    floor: { rooms: [] },
    walls: [{ id: 'w1', from: [0, 0], to: [1, 0], materialBack: material }],
    openings: [],
    items: []
  };
}

test('saved building files keep engine textures by file name, not machine path', () => {
  const saved = JSON.parse(stringifyBuildingFile(plan({ id: 'brick-red', kind: 'texture', src: devUrl })));
  assert.equal(saved.floorplan.walls[0].materialBack.src, 'textures/brick_red.jpg');
});

test('custom and inline textures are saved unchanged', () => {
  const dataUrl = 'data:image/png;base64,AAAA';
  const saved = JSON.parse(stringifyBuildingFile(plan({ id: 'custom_1', kind: 'texture', src: dataUrl })));
  assert.equal(saved.floorplan.walls[0].materialBack.src, dataUrl);
  const other = JSON.parse(stringifyBuildingFile(plan({ id: 'x', kind: 'texture', src: 'https://example.com/my_photo.jpg' })));
  assert.equal(other.floorplan.walls[0].materialBack.src, 'https://example.com/my_photo.jpg');
});

test('old files with a machine path still resolve to the bundled texture', () => {
  const floorplan = parseBuildingFile({ format: 'blueprint3d-babylon.building.v1', floorplan: plan({ id: 'brick-red', kind: 'texture', src: devUrl }) });
  const resolved = resolveMaterialAssetDescriptor(floorplan.walls[0].materialBack);
  assert.ok(!resolved.src.includes('D:/'));
  assert.ok(resolved.src.endsWith('brick_red.jpg'));
  const byName = resolveMaterialAssetDescriptor({ id: 'unknown', kind: 'texture', src: 'textures/brick_red.jpg' });
  assert.ok(byName.src.endsWith('/textures/brick_red.jpg') && byName.src !== 'textures/brick_red.jpg');
});
