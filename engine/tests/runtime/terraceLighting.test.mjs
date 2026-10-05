import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { BabylonSceneRenderer, FloorplanDocument, isNoCeilingRoom, isParapetWall, PARAPET_HEIGHT } from '../../src/index.js';

test('isNoCeilingRoom correctly identifies terrace/balcony/outdoor rooms', () => {
 assert.equal(isNoCeilingRoom({ name: ' Second Floor Terrace Terrace 2F' }), true);
 assert.equal(isNoCeilingRoom({ name: ' Balcony Balcony' }), true);
 assert.equal(isNoCeilingRoom({ roomType: 'terrace' }), true);
 assert.equal(isNoCeilingRoom({ noCeiling: true }), true);
 assert.equal(isNoCeilingRoom({ isOutdoor: true }), true);
 assert.equal(isNoCeilingRoom({ name: 'Master Bedroom Bedroom' }), false);
 assert.equal(isNoCeilingRoom(null), false);
});

test('3D floor meshes generate bottom ceiling skin and natural shadows without hardcoded 2D bounds', () => {
 globalThis.showAllFloors = true;
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const document = new FloorplanDocument({
 unit: 'm',
 currentFloorId: 'floor-1',
 floors: [
 { id: 'floor-1', level: 0, floorHeight: 0.2, wallHeight: 2.8 },
 { id: 'floor-2', level: 1, floorHeight: 0.2, wallHeight: 2.8 }
 ],
 floor: {
 rooms: [
 { id: 'room-1f-living', name: ' Living Room', floorId: 'floor-1', shape: 'square', x: 0, z: 0, width: 8, depth: 8 },
 { id: 'room-2f-small-loft', name: 'Attic Small Loft', floorId: 'floor-2', shape: 'square', x: 0, z: 0, width: 2, depth: 2 },
 { id: 'room-2f-terrace', name: 'Second Floor Terrace Terrace 2F', floorId: 'floor-2', shape: 'square', x: 4, z: 0, width: 4, depth: 4 }
 ]
 },
 walls: [],
 openings: [],
 items: [],
 roofs: [],
 stairs: [],
 fences: [],
 fenceGates: []
 });
 const renderer = new BabylonSceneRenderer(scene, document);

 renderer.build();

 const casterNames = new Set(renderer.shadowCasters.map((mesh) => mesh.name));
 
 // 2F 2x2m bottom ceiling skin
 assert.equal(casterNames.has('ceiling_room-2f-small-loft_0'), true);
 assert.equal(scene.getMeshByName('ceiling_room-2f-small-loft_0') !== null, true);

 // 2F Terrace Mesh， ceiling
 assert.equal(casterNames.has('ceiling_room-2f-terrace_0'), false);
 assert.equal(scene.getMeshByName('ceiling_room-2f-terrace_0'), null);

 renderer.dispose();
 scene.dispose();
 engine.dispose();
 delete globalThis.showAllFloors;
});

test('walls that only bound a terrace are waist-high parapets', () => {
  const floorplan = {
    floor: {
      rooms: [
        { id: 'bed', name: 'Bedroom', floorId: 'f2', wallIds: { south: 'shared', north: 'n' } },
        { id: 'ter', name: 'Front Terrace', floorId: 'f2', wallIds: { north: 'shared', south: 'front', east: 'side' } }
      ]
    },
    openings: [{ id: 'w1', wallId: 'side', type: 'window' }]
  };
  const wall = (id) => ({ id, floorId: 'f2' });
  assert.equal(isParapetWall(floorplan, wall('front')), true);
  assert.equal(isParapetWall(floorplan, wall('shared')), false, 'shared with the bedroom');
  assert.equal(isParapetWall(floorplan, wall('n')), false, 'an indoor wall');
  assert.equal(isParapetWall(floorplan, wall('side')), false, 'has a window');
  assert.equal(PARAPET_HEIGHT, 1);
});
