import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument, createBabylonRenderer } from '../../src/index.js';

test('Glass Mesh', () => {
 const document = new FloorplanDocument({
 currentFloorId: 'floor-1',
 floors: [{ id: 'floor-1', level: 0, floorHeight: 0.2, wallHeight: 2.8 }],
 floor: {
 rooms: [
 { id: 'test-room-1', name: 'Living Room', floorId: 'floor-1', shape: 'square', x: 0, z: 0, width: 5, depth: 5 }
 ]
 }
 });
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 try {
 const room = document.floorplan.floor.rooms[0];
 assert.ok(room, ' Room');

 // 1. 
 room.material = { kind: 'color', color: '#ffffff' };
 const rendererNormal = createBabylonRenderer(scene, document);
 rendererNormal.build();

 const normalFloorNode = rendererNormal.floorNodes.get(room.id);
 assert.ok(normalFloorNode, ' Room TransformNode');
 const hasNormalCeilingChild = normalFloorNode.getChildren().some((child) => child.name && child.name.includes('ceiling_'));
 assert.equal(hasNormalCeilingChild, true, ' Room ');

 rendererNormal.dispose();

 // 2. Room Glass 
 room.material = { kind: 'glass', color: '#88ccff', alpha: 0.3 };
 const rendererGlass = createBabylonRenderer(scene, document);
 rendererGlass.build();

 const glassFloorNode = rendererGlass.floorNodes.get(room.id);
 assert.ok(glassFloorNode, 'Glass Room TransformNode');
 const hasGlassCeilingChild = glassFloorNode.getChildren().some((child) => child.name && child.name.includes('ceiling_'));
 assert.equal(hasGlassCeilingChild, false, 'Glass Room Mesh， ');

 rendererGlass.dispose();
 } finally {
 scene.dispose();
 engine.dispose();
 }
});
