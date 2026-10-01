import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument } from '../../src/index.js';

test(' Room Draw Wall/ ， ， Draw Wall ', () => {
 const mockPlan = {
 format: 'blueprint3d-babylon.building.v1',
 version: 1,
 currentFloorId: 'floor_1',
 floors: [{ id: 'floor_1', name: '1F', level: 0 }],
 floor: {
 rooms: [
 {
 id: 'room_A',
 name: 'Hall',
 floorId: 'floor_1',
 shape: 'square',
 x: 0,
 z: 0,
 width: 8,
 depth: 10,
 wallIds: {
 north: 'wall_A_north',
 east: 'wall_A_east',
 south: 'wall_shared',
 west: 'wall_A_west'
 }
 },
 {
 id: 'room_B',
 name: ' Draw WallRoom',
 floorId: 'floor_1',
 shape: 'square',
 x: 0,
 z: -6.5,
 width: 4,
 depth: 3,
 wallIds: {}
 }
 ]
 },
 walls: [
 { id: 'wall_A_north', from: [-4, 5], to: [4, 5], floorId: 'floor_1', roomId: 'room_A' },
 { id: 'wall_A_east', from: [4, 5], to: [4, -5], floorId: 'floor_1', roomId: 'room_A' },
 { id: 'wall_shared', from: [4, -5], to: [-4, -5], floorId: 'floor_1', roomId: 'room_A' },
 { id: 'wall_A_west', from: [-4, -5], to: [-4, 5], floorId: 'floor_1', roomId: 'room_A' },
 // room_B [-3, -5] [3, -5] 
 { id: 'wall_manual_north', from: [-3, -5], to: [3, -5], floorId: 'floor_1' }
 ],
 items: [],
 openings: []
 };

 const doc = new FloorplanDocument(mockPlan);

 const initialWallCount = doc.floorplan.walls.length;

 // 1. room_B （createMissing = false， ）
 const roomB = doc.getRoom('room_B');
 doc.syncRoomWalls(roomB, false);

 // 2. ：room_B z = -5 Draw Wall 'wall_manual_north'
 assert.ok(Object.values(roomB.wallIds).includes('wall_manual_north'), 'Room Draw Wall');

 // 3. ： Draw Wall [-3, -5] [3, -5] ， 
 const manualWall = doc.getWall('wall_manual_north');
 assert.deepEqual(manualWall.from, [-3, -5], ' Draw Wall ');
 assert.deepEqual(manualWall.to, [3, -5], ' Draw Wall ');

 // 4. ： “ ” ！
 assert.equal(doc.floorplan.walls.length, initialWallCount, ' ');
});
