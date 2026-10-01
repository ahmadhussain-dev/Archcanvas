import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getItemRoomElevationOffset } from '../../src/core/exporterUtils.js';

test('Room Furniture ', async (t) => {
 await t.test('getItemRoomElevationOffset Room Room ', () => {
 const doc = new FloorplanDocument({
 unit: 'm',
 floorHeight: 0.2,
 wallHeight: 2.8,
 floors: [
 { id: 'floor_1', name: '1F', level: 0, floorHeight: 0.2 }
 ],
 currentFloorId: 'floor_1',
 rooms: [
 {
 id: 'room_1',
 floorId: 'floor_1',
 elevation: 0.5,
 x: 0,
 z: 0,
 width: 5,
 depth: 5
 }
 ],
 items: [
 {
 id: 'item_indoor',
 type: 'chair',
 floorId: 'floor_1',
 roomId: 'room_1',
 x: 1,
 z: 1,
 elevation: 0
 },
 {
 id: 'item_outdoor',
 type: 'chair',
 floorId: 'floor_1',
 roomId: null,
 x: 10,
 z: 10,
 elevation: 0
 }
 ]
 });

 const indoor = doc.getItem('item_indoor');
 const outdoor = doc.getItem('item_outdoor');

 // Room Furniture： Room (0.5m)
 assert.equal(doc.getItemRoomElevationOffset(indoor), 0.5);

 // Room Furniture： -floorHeight (-0.2m)
 assert.equal(doc.getItemRoomElevationOffset(outdoor), -0.2);

 // exporterUtils getItemRoomElevationOffset
 const exporterIndoorOffset = getItemRoomElevationOffset(doc.floorplan, indoor);
 const exporterOutdoorOffset = getItemRoomElevationOffset(doc.floorplan, outdoor);

 assert.equal(exporterIndoorOffset, 0.5);
 assert.equal(exporterOutdoorOffset, -0.2);
 });

 await t.test('1 Room Furniture 3D 0.0m', () => {
 const doc = new FloorplanDocument({
 unit: 'm',
 floorHeight: 0.2,
 wallHeight: 2.8,
 floors: [
 { id: 'floor_1', name: '1F', level: 0, floorHeight: 0.2 }
 ],
 currentFloorId: 'floor_1',
 rooms: [
 {
 id: 'room_1',
 floorId: 'floor_1',
 elevation: 0,
 x: 0,
 z: 0,
 width: 4,
 depth: 4
 }
 ],
 items: [
 {
 id: 'outdoor_bench',
 type: 'chair',
 floorId: 'floor_1',
 x: 8,
 z: 8,
 elevation: 0
 }
 ]
 });

 const bench = doc.getItem('outdoor_bench');
 const floorY = doc.getFloorElevation(bench.floorId); // 0.2m
 const roomOffset = doc.getItemRoomElevationOffset(bench); // -0.2m
 const finalY = floorY + roomOffset + (bench.elevation || 0);

 // Room Furniture 0.0m ( )
 assert.equal(floorY, 0.2);
 assert.equal(roomOffset, -0.2);
 assert.equal(finalY, 0.0);
 });
});
