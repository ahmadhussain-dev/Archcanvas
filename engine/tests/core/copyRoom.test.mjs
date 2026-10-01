import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument, getRoomWallKeys, pointInRoom } from '../../src/index.js';
import { isWallSharedByAnotherRoom } from '../../example/js/TargetHandler.js';

function calculateFastNonOverlappingPosition(sourceRoom, existingRooms = []) {
 const currentFloorId = sourceRoom.floorId;
 const roomsOnFloor = existingRooms.filter(r => r.floorId === currentFloorId && r.id !== sourceRoom.id);

 const w = sourceRoom.width || 4;
 const d = sourceRoom.depth || 4;
 const sourceW = sourceRoom.width || 4;
 const sourceD = sourceRoom.depth || 4;
 const gap = 0;
 const eps = 0.05;

 const stepX = (w + sourceW) / 2 + gap;
 const stepZ = (d + sourceD) / 2 + gap;

 const isPositionOverlapping = (cx, cz) => {
 const minX1 = cx - w / 2;
 const maxX1 = cx + w / 2;
 const minZ1 = cz - d / 2;
 const maxZ1 = cz + d / 2;

 for (const other of roomsOnFloor) {
 const otherW = other.width || 4;
 const otherD = other.depth || 4;
 const minX2 = other.x - otherW / 2;
 const maxX2 = other.x + otherW / 2;
 const minZ2 = other.z - otherD / 2;
 const maxZ2 = other.z + otherD / 2;

 const overlapX = (minX1 + eps < maxX2) && (maxX1 - eps > minX2);
 const overlapZ = (minZ1 + eps < maxZ2) && (maxZ1 - eps > minZ2);
 if (overlapX && overlapZ) {
 return { other, minX2, maxX2, minZ2, maxZ2 };
 }
 }
 return null;
 };

 const candidateNeighbors = [
 { x: sourceRoom.x + stepX, z: sourceRoom.z }, // (+X)
 { x: sourceRoom.x - stepX, z: sourceRoom.z }, // (-X)
 { x: sourceRoom.x, z: sourceRoom.z + stepZ }, // (+Z)
 { x: sourceRoom.x, z: sourceRoom.z - stepZ } // (-Z)
 ];

 for (const pos of candidateNeighbors) {
 if (!isPositionOverlapping(pos.x, pos.z)) {
 return pos;
 }
 }

 const jumpDirections = [
 { dirX: 1, dirZ: 0 },
 { dirX: -1, dirZ: 0 },
 { dirX: 0, dirZ: 1 },
 { dirX: 0, dirZ: -1 }
 ];

 for (const dir of jumpDirections) {
 let currX = sourceRoom.x + dir.dirX * stepX;
 let currZ = sourceRoom.z + dir.dirZ * stepZ;

 for (let iter = 0; iter < roomsOnFloor.length + 2; iter++) {
 const block = isPositionOverlapping(currX, currZ);
 if (!block) {
 return { x: currX, z: currZ };
 }
 if (dir.dirX > 0) currX = block.maxX2 + w / 2 + gap;
 else if (dir.dirX < 0) currX = block.minX2 - w / 2 - gap;
 else if (dir.dirZ > 0) currZ = block.maxZ2 + d / 2 + gap;
 else if (dir.dirZ < 0) currZ = block.minZ2 - d / 2 - gap;
 }
 }

 const candidateAnchors = [];
 roomsOnFloor.forEach(r => {
 const rW = r.width || 4;
 const rD = r.depth || 4;
 const rMinX = r.x - rW / 2;
 const rMaxX = r.x + rW / 2;
 const rMinZ = r.z - rD / 2;
 const rMaxZ = r.z + rD / 2;

 candidateAnchors.push({ x: rMaxX + w / 2 + gap, z: rMaxZ + d / 2 + gap });
 candidateAnchors.push({ x: rMinX - w / 2 - gap, z: rMaxZ + d / 2 + gap });
 candidateAnchors.push({ x: rMaxX + w / 2 + gap, z: rMinZ - d / 2 - gap });
 candidateAnchors.push({ x: rMinX - w / 2 - gap, z: rMinZ - d / 2 - gap });
 });

 candidateAnchors.sort((a, b) => {
 const distA = Math.hypot(a.x - sourceRoom.x, a.z - sourceRoom.z);
 const distB = Math.hypot(b.x - sourceRoom.x, b.z - sourceRoom.z);
 return distA - distB;
 });

 for (const anchor of candidateAnchors) {
 if (!isPositionOverlapping(anchor.x, anchor.z)) {
 return anchor;
 }
 }

 return { x: sourceRoom.x + stepX, z: sourceRoom.z };
}

test('Block-Jump ： +X/-X/+Z/-Z Room ', () => {
 const baseRoom = { id: 'r0', floorId: 'f1', x: 0, z: 0, width: 50, depth: 50 };
 let rooms = [baseRoom];

 const startTime = performance.now();
 let pos1 = calculateFastNonOverlappingPosition(baseRoom, rooms);
 const duration = performance.now() - startTime;

 assert.ok(duration < 5.0, `50m x 50m Room 5ms， ${duration}ms`);
 assert.equal(pos1.x, 50);
 assert.equal(pos1.z, 0);
 rooms.push({ id: 'r1', floorId: 'f1', x: pos1.x, z: pos1.z, width: 50, depth: 50 });

 let pos2 = calculateFastNonOverlappingPosition(baseRoom, rooms);
 assert.equal(pos2.x, -50);
 assert.equal(pos2.z, 0);
});

test('DuplicateRoom ', () => {
 const doc = new FloorplanDocument();
 const sourceRoom = doc.addRoom({
 id: 'source-room',
 x: 0,
 z: 0,
 width: 6,
 depth: 6
 });

 const westWallEntry = Object.entries(sourceRoom.wallIds).find(([, wallId]) => {
 const wall = doc.getWall(wallId);
 return wall && wall.from[0] === -3 && wall.to[0] === -3;
 });
 assert.ok(westWallEntry, ' Room ');
 doc.deleteWall(westWallEntry[1]);

 const copiedRoom = doc.addRoom({
 id: 'copied-room',
 x: 6,
 z: 0,
 width: 6,
 depth: 6
 });
 const sharedWallId = Object.values(copiedRoom.wallIds).find((wallId) => (
 Object.values(sourceRoom.wallIds).includes(wallId)
 ));

 assert.ok(sharedWallId, ' Room ');
 assert.equal(
 isWallSharedByAnotherRoom(sharedWallId, copiedRoom.id, doc.floorplan.floor.rooms),
 true,
 'DuplicateRoom Delete '
 );
});

test(' Room/TerraceDuplicate： Room ，Duplicate Room ', () => {
 const doc = new FloorplanDocument();
 const terrace = doc.addRoom({
 name: 'Terrace',
 x: 0,
 z: 0,
 width: 6,
 depth: 6
 });

 // Delete ， Terrace
 const keys = getRoomWallKeys(terrace);
 const eastWallId = terrace.wallIds[keys[1]];
 if (eastWallId) {
 doc.deleteWall(eastWallId);
 }

 // DuplicateRoom 
 const roomCopyData = JSON.parse(JSON.stringify(terrace));
 delete roomCopyData.id;
 delete roomCopyData.wallIds;

 const copiedTerrace = doc.addRoom({
 ...roomCopyData,
 x: 10,
 z: 0
 });

 const copiedKeys = getRoomWallKeys(copiedTerrace);
 copiedKeys.forEach(k => {
 const sWallId = terrace.wallIds?.[k];
 const tWallId = copiedTerrace.wallIds?.[k];
 if (!sWallId && tWallId) {
 doc.deleteWall(tWallId);
 } else if (sWallId && tWallId) {
 const sWall = doc.getWall(sWallId);
 if (!sWall) {
 doc.deleteWall(tWallId);
 } else {
 doc.updateWall(tWallId, { hidden: !!sWall.hidden });
 }
 }
 });

 // copiedTerrace 
 assert.equal(copiedTerrace.wallIds[keys[1]], undefined, ' Terrace ');
});

test('Room Duplicate： Room 、 、 Furniture ', () => {
 const doc = new FloorplanDocument();

 const sourceRoom = doc.addRoom({
 id: 'full-copy-source-room',
 name: ' Master Bedroom',
 x: 0,
 z: 0,
 width: 6,
 depth: 6,
 material: { textureUrl: 'wood_floor.jpg' },
 color: '#d4a373',
 ceilingMaterial: { textureUrl: 'plaster.jpg' },
 ceilingColor: '#ffffff',
 elevation: 0.2
 });

 const wallKeys = getRoomWallKeys(sourceRoom);
 const northWallId = sourceRoom.wallIds[wallKeys[0]];
 const northWall = doc.getWall(northWallId);
 if (northWall) {
 northWall.materialFront = { textureUrl: 'wallpaper_blue.jpg' };
 northWall.colorFront = '#1e3d59';
 northWall.baseboardEnabled = true;
 northWall.baseboardHeight = 0.12;
 northWall.baseboardMaterialFront = { textureUrl: 'wood_skirting.jpg' };
 }

 const opening = doc.addOpening({
 wallId: northWallId,
 type: 'window',
 shape: 'round-arch',
 width: 1.5,
 height: 2.0,
 t: 0.5,
 doubleDoor: true
 });

 const item = doc.addItem({
 name: 'Double Bed',
 type: 'bed',
 x: 1.0,
 z: 1.0,
 roomId: sourceRoom.id,
 rotation: Math.PI / 2,
 elevation: 0.2,
 customMaterial: { color: '#ff5722' }
 });

 const existingRooms = doc.floorplan.floor.rooms;
 const targetPos = calculateFastNonOverlappingPosition(sourceRoom, existingRooms);
 const dx = targetPos.x - sourceRoom.x;
 const dz = targetPos.z - sourceRoom.z;

 const roomCopyData = JSON.parse(JSON.stringify(sourceRoom));
 delete roomCopyData.id;
 delete roomCopyData.wallIds;

 const copiedRoom = doc.addRoom({
 ...roomCopyData,
 id: 'full-copy-target-room',
 x: targetPos.x,
 z: targetPos.z
 });

 const newWallKeys = getRoomWallKeys(copiedRoom);
 newWallKeys.forEach(key => {
 const sWallId = sourceRoom.wallIds?.[key];
 const tWallId = copiedRoom.wallIds?.[key];
 if (sWallId && tWallId) {
 const sWall = doc.getWall(sWallId);
 const tWall = doc.getWall(tWallId);
 if (sWall && tWall) {
 Object.assign(tWall, {
 colorFront: sWall.colorFront,
 materialFront: sWall.materialFront,
 baseboardEnabled: sWall.baseboardEnabled,
 baseboardHeight: sWall.baseboardHeight,
 baseboardMaterialFront: sWall.baseboardMaterialFront
 });

 const sourceOpenings = (doc.floorplan.openings || []).filter(o => o.wallId === sWallId);
 sourceOpenings.forEach(op => {
 const opCopy = JSON.parse(JSON.stringify(op));
 delete opCopy.id;
 delete opCopy.wallId;
 doc.addOpening({
 ...opCopy,
 wallId: tWallId
 });
 });
 }
 }
 });

 const rooms = (doc.floorplan.items || []).filter(i => i.roomId === sourceRoom.id || pointInRoom(sourceRoom, i.x, i.z));
 rooms.forEach(it => {
 const itCopy = JSON.parse(JSON.stringify(it));
 delete itCopy.id;
 doc.addItem({
 ...itCopy,
 x: it.x + dx,
 z: it.z + dz,
 roomId: copiedRoom.id
 });
 });

 assert.ok(copiedRoom, ' DuplicateRoom');
 assert.equal(copiedRoom.name, ' Master Bedroom');
 assert.deepEqual(copiedRoom.material, { textureUrl: 'wood_floor.jpg' });
 assert.equal(copiedRoom.color, '#d4a373');
 assert.deepEqual(copiedRoom.ceilingMaterial, { textureUrl: 'plaster.jpg' });

 const copiedNorthWall = doc.getWall(copiedRoom.wallIds[newWallKeys[0]]);
 assert.ok(copiedNorthWall);
 assert.equal(copiedNorthWall.colorFront, '#1e3d59');
 assert.deepEqual(copiedNorthWall.materialFront, { textureUrl: 'wallpaper_blue.jpg' });
 assert.equal(copiedNorthWall.baseboardEnabled, true);
 assert.equal(copiedNorthWall.baseboardHeight, 0.12);

 const copiedOpenings = (doc.floorplan.openings || []).filter(o => o.wallId === copiedNorthWall.id);
 assert.equal(copiedOpenings.length, 1);
 assert.equal(copiedOpenings[0].type, 'window');
 assert.equal(copiedOpenings[0].shape, 'round-arch');
 assert.equal(copiedOpenings[0].width, 1.5);
 assert.equal(copiedOpenings[0].doubleDoor, true);

 const copieds = (doc.floorplan.items || []).filter(i => i.roomId === copiedRoom.id);
 assert.equal(copieds.length, 1);
 assert.equal(copieds[0].name, 'Double Bed');
 assert.equal(copieds[0].x, 1.0 + dx);
 assert.equal(copieds[0].z, 1.0 + dz);
 assert.equal(copieds[0].rotation, Math.PI / 2);
 assert.deepEqual(copieds[0].customMaterial, { color: '#ff5722' });
});
