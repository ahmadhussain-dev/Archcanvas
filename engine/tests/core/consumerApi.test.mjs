import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import * as BABYLON from '@babylonjs/core';
import { createEditor, Blueprint3DTestMap, EditorFacade, getFurnitureThumbnailUrl, SKY_TEXTURE_URL, buildFenceGeometry } from '../../src/index.js';

test('Consumer API: public asset URLs do not require source-directory imports', () => {
 assert.equal(getFurnitureThumbnailUrl('chair'), './src/furniture/image/chair.png');
 assert.equal(getFurnitureThumbnailUrl('../unsafe'), './src/furniture/image/unsafe.png');
 assert.match(SKY_TEXTURE_URL, /sky\.png$/);
});

test('Consumer API: Sky ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const skybox = BABYLON.MeshBuilder.CreateSphere('skyBox', { segments: 16, diameter: 1000.0 }, scene);
 const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
 skybox.material = skyboxMaterial;

 // Viewer3D setEnvironmentMaterials 
 const material = skybox.material;
 material.disableLighting = true;
 const texture = new BABYLON.Texture(SKY_TEXTURE_URL, scene);
 texture.coordinatesMode = BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE;
 material.emissiveTexture = texture;

 assert.equal(skybox.material.disableLighting, true, 'Sky ');
 assert.equal(skybox.material.emissiveTexture.coordinatesMode, BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE, 'Sky 360 ');

 skybox.dispose();
 scene.dispose();
 engine.dispose();
});

test('Consumer API: 、Save、 Export ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 const mockPlan = {
 unit: 'm',
 currentFloorId: 'floor_1',
 floors: [
 { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
 ],
 floor: {
 rooms: [
 { id: 'living', name: 'Living Room', x: 0, z: 0, width: 4, depth: 4 }
 ]
 },
 walls: [],
 openings: [],
 items: [],
 roofs: [],
 stairs: [],
 fences: []
 };

 // 1. createEditor 
 const editor = createEditor({ scene, floorplan: mockPlan });
 assert.ok(editor, ' editor ');
 assert.equal(editor.getCurrentFloorId(), 'floor_1');
 assert.equal(editor.renderingEnabled, true);

 // 2. exportJSON
 const json = editor.exportJSON();
 assert.equal(json.currentFloorId, 'floor_1');
 assert.notEqual(json, mockPlan, 'Export json ');

 // 3. exportBuildingFile stringifyBuildingFile
 const bFileObj = editor.exportBuildingFile({ name: 'test-proj' });
 assert.equal(bFileObj.format, 'blueprint3d-babylon.building.v1');
 const bFileStr = editor.stringifyBuildingFile({ name: 'test-proj' });
 assert.equal(typeof bFileStr, 'string');

 // 4. stringifyDXF
 const dxfText = editor.stringifyDXF();
 assert.equal(typeof dxfText, 'string');

 // 5. create3MFPackage
 const bytes = editor.create3MFPackage({ category: 'building' });
 assert.ok(bytes instanceof Uint8Array || bytes instanceof Blob || typeof bytes === 'object');

 // 6. loadJSON 
 const newPlan = {
 ...mockPlan,
 currentFloorId: 'floor_2',
 floors: [{ id: 'floor_2', name: '2F', level: 1 }]
 };
 editor.loadJSON(newPlan);
 assert.equal(editor.getCurrentFloorId(), 'floor_2');

 // 7. loadBuildingFile
 editor.loadBuildingFile(bFileStr);
 assert.equal(editor.getCurrentFloorId(), 'floor_1'); // 

 scene.dispose();
 engine.dispose();
});

test('Blueprint3DTestMap ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 const mockPlan = {
 unit: 'm',
 currentFloorId: 'floor_1',
 floors: [
 { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
 ],
 floor: { rooms: [] },
 walls: [],
 openings: [],
 items: [],
 roofs: [],
 stairs: [],
 fences: []
 };

 const map = new Blueprint3DTestMap(scene, { floorplan: mockPlan });

 // 
 assert.equal(map.floorplan.currentFloorId, 'floor_1');
 assert.equal(map.renderingEnabled, true);

 // 
 const exported = map.exportJSON();
 assert.equal(exported.currentFloorId, 'floor_1');

 // Query API 
 assert.equal(map.getCurrentFloorId(), 'floor_1');
 assert.equal(map.getFloors().length, 1);
 assert.equal(map.getFloor('floor_1').name, '1F');
 assert.ok(Array.isArray(map.getEntities('room')));

 const buildingFile = map.stringifyBuildingFile({ name: 'my-map' });
 assert.equal(typeof buildingFile, 'string');

 scene.dispose();
 engine.dispose();
});

test('Consumer API: Query API ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 const mockPlan = {
 unit: 'm',
 currentFloorId: 'floor_1',
 floors: [
 { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
 ],
 floor: {
 rooms: [
 { id: 'living', name: 'Living Room', x: 0, z: 0, width: 4, depth: 4 }
 ]
 },
 walls: [
 { id: 'w1', floorId: 'floor_1', from: [0, 0], to: [4, 0] }
 ],
 openings: [],
 items: [
 { id: 'item1', type: 'table', floorId: 'floor_1', x: 1, z: 1 }
 ],
 roofs: [],
 stairs: [],
 fences: []
 };

 const editor = createEditor({ scene, floorplan: mockPlan });

 // 1. getCurrentFloorId
 assert.equal(editor.getCurrentFloorId(), 'floor_1');
 const metadata = editor.getProjectMetadata();
 const originalWallHeight = metadata.wallHeight;
 metadata.wallHeight = 99;
 assert.equal(editor.getProjectMetadata().wallHeight, originalWallHeight, ' ');

 // 2. getFloors & getFloor
 const floors = editor.getFloors();
 assert.equal(floors.length, 1);
 assert.equal(floors[0].name, '1F');
 
 const floor1 = editor.getFloor('floor_1');
 assert.ok(floor1);
 assert.equal(floor1.name, '1F');

 // 3. getEntities & getEntity
 const rooms = editor.getEntities('room');
 assert.equal(rooms.length, 1);
 assert.equal(rooms[0].name, 'Living Room');

 const livingRoom = editor.getEntity('room', 'living');
 assert.ok(livingRoom);
 assert.equal(livingRoom.name, 'Living Room');

 const items = editor.getEntities('item');
 assert.equal(items.length, 1);
 assert.equal(items[0].id, 'item1');

 // 4. getCurrentFloorEntities
 const floorRooms = editor.getCurrentFloorEntities('room');
 assert.equal(floorRooms.length, 1);
 assert.equal(floorRooms[0].id, 'living');

 // 5. getFloorElevation
 const elevation = editor.getFloorElevation('floor_1');
 assert.equal(typeof elevation, 'number');

 // 6. getFurnitureDefinition
 const tableDef = editor.getFurnitureDefinition('table');
 assert.ok(tableDef);
 assert.equal(tableDef.type, 'table');

 // 7. ( )
 const snap = editor.getSnapshot();
 snap.unit = 'mm';
 snap.floor.rooms[0].name = ' Room';
 
 const snapAgain = editor.getSnapshot();
 assert.equal(snapAgain.unit, 'm');
 assert.equal(snapAgain.floor.rooms[0].name, 'Living Room');

 livingRoom.name = 'Bedroom';
 const livingRoomAgain = editor.getEntity('room', 'living');
 assert.equal(livingRoomAgain.name, 'Living Room');

 rooms[0].name = 'Kitchen';
 const roomsAgain = editor.getEntities('room');
 assert.equal(roomsAgain[0].name, 'Living Room');

 scene.dispose();
 engine.dispose();
});

test(' : example js ', () => {
 const exampleDir = path.resolve('example');
 
 function walkDir(dir, files = []) {
 const list = fs.readdirSync(dir);
 for (const file of list) {
 if (file === 'dist' || file === 'dist-temp' || file === 'node_modules') continue;
 const fullPath = path.join(dir, file);
 const stat = fs.statSync(fullPath);
 if (stat.isDirectory()) {
 walkDir(fullPath, files);
 } else if (file.endsWith('.js')) {
 files.push(fullPath);
 }
 }
 return files;
 }

 const jsFiles = walkDir(exampleDir);
 const sourceImportRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]*src\/[^'"]+)['"]/g;

 for (const filePath of jsFiles) {
 const content = fs.readFileSync(filePath, 'utf8');
 let match;
 while ((match = sourceImportRegex.exec(content)) !== null) {
 const importedPath = match[1].replace(/\\/g, '/');
 if (importedPath.endsWith('/src/index.js')) continue;
 const relativePath = path.relative(process.cwd(), filePath);
 assert.fail(` : [${relativePath}] [${importedPath}]；example src/index.js 。`);
 }
 }
});

test(' : Blueprint3DTestMap EditorFacade ', () => {
 const facadeMethods = Object.getOwnPropertyNames(EditorFacade.prototype)
 .filter(method => method !== 'constructor' && !method.startsWith('_'));
 const testMapMethods = Object.getOwnPropertyNames(Blueprint3DTestMap.prototype);

 for (const method of facadeMethods) {
 const hasMethod = testMapMethods.includes(method) || typeof Blueprint3DTestMap.prototype[method] === 'function';
 assert.ok(
 hasMethod,
 ` : Blueprint3DTestMap EditorFacade [${method}] ！`
 );
 }
});

test(' : example All EditorFacade', () => {
 const exampleDir = path.resolve('example');

 function walkDir(dir, files = []) {
 const list = fs.readdirSync(dir);
 for (const file of list) {
 if (file === 'dist' || file === 'dist-temp' || file === 'node_modules') continue;
 const fullPath = path.join(dir, file);
 const stat = fs.statSync(fullPath);
 if (stat.isDirectory()) {
 walkDir(fullPath, files);
 } else if (file.endsWith('.js')) {
 files.push(fullPath);
 }
 }
 return files;
 }

 const jsFiles = walkDir(exampleDir);
 const methodCallRegex = /\b(testMap|editorApi|map)(?:\.|\?\.)([a-zA-Z0-9_]+)\(/g;

 const getPrototypeMethods = (proto) => {
 let methods = [];
 let current = proto;
 while (current && current !== Object.prototype) {
 methods = methods.concat(Object.getOwnPropertyNames(current));
 current = Object.getPrototypeOf(current);
 }
 return new Set(methods);
 };

 const testMapAvailableMethods = getPrototypeMethods(EditorFacade.prototype);

 const allowedOverrides = new Set(['on', 'off', 'emit']);

 for (const filePath of jsFiles) {
 const content = fs.readFileSync(filePath, 'utf8');
 let match;
 while ((match = methodCallRegex.exec(content)) !== null) {
 const receiverName = match[1];
 const methodName = match[2];
 const exists = testMapAvailableMethods.has(methodName) || allowedOverrides.has(methodName);
 if (!exists) {
 const relativePath = path.relative(process.cwd(), filePath);
 assert.fail(` : [${relativePath}] [${receiverName}.${methodName}()], ！`);
 }
 }
 }
});

test('Consumer API: executeCommand API ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 const mockPlan = {
 unit: 'm',
 currentFloorId: 'floor_1',
 floors: [
 { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
 ],
 floor: { rooms: [] },
 walls: [],
 openings: [],
 items: [],
 roofs: [],
 stairs: [],
 fences: []
 };

 const editor = createEditor({ scene, floorplan: mockPlan });

 // 1. 
 editor.executeCommand('addFloor', { id: 'floor_2', name: '2F', level: 1 });
 assert.ok(editor.getFloor('floor_2'), ' addFloor floor_2');

 editor.executeCommand('setCurrentFloor', { floorId: 'floor_2' });
 assert.equal(editor.getCurrentFloorId(), 'floor_2', ' setCurrentFloor floor_2');

 editor.executeCommand('renameFloor', { floorId: 'floor_2', name: '2F_Renamed' });
 assert.equal(editor.getFloor('floor_2').name, '2F_Renamed', ' renameFloor ');

 editor.executeCommand('changeFloorHeight', { floorId: 'floor_2', height: 3.5 });
 assert.equal(editor.getFloor('floor_2').wallHeight, 3.5, ' changeFloorHeight ');

 editor.executeCommand('changeFloorDefaultFloorHeight', { floorId: 'floor_2', floorHeight: 0.1 });
 assert.equal(editor.getFloor('floor_2').floorHeight, 0.1, ' changeFloorDefaultFloorHeight ');

 editor.executeCommand('changeFloorHideSettings', { floorId: 'floor_2', hideRoof: true, hideWall: false, skybox: true });
 assert.equal(editor.getFloor('floor_2').hideRoof, true, ' changeFloorHideSettings ');

 // floor_1 CRUD 
 editor.executeCommand('setCurrentFloor', { floorId: 'floor_1' });

 // 2. 
 const wall = editor.executeCommand('addWall', { from: [0, 0], to: [4, 0] });
 assert.ok(wall, ' addWall ');
 assert.equal(editor.getEntities('wall').length, 1, ' 1 ');

 editor.executeCommand('updateWall', { wallId: wall.id, patch: { color: '#ff0000', material: '#ff0000' } });
 assert.equal(editor.getEntity('wall', wall.id).color, '#ff0000', ' updateWall ');

 editor.executeCommand('updateWallLength', { wallId: wall.id, length: 5.0 });
 const updatedWall = editor.getEntity('wall', wall.id);
 const len = Math.hypot(updatedWall.to[0] - updatedWall.from[0], updatedWall.to[1] - updatedWall.from[1]);
 assert.ok(Math.abs(len - 5.0) < 0.01, ' updateWallLength 5');

 // 3. 
 const opening = editor.executeCommand('addOpening', { wallId: wall.id, type: 'door', t: 0.5, shape: 'rect' });
 assert.ok(opening, ' addOpening ');
 assert.equal(editor.getEntities('opening').length, 1, ' 1 ');

 editor.executeCommand('updateOpening', { openingId: opening.id, patch: { width: 1.2 } });
 assert.equal(editor.getEntity('opening', opening.id).width, 1.2, ' updateOpening ');

 editor.executeCommand('updateOpeningMaterial', { openingId: opening.id, componentKey: 'frame', materialDescriptor: '#123456' });
 assert.equal(editor.getEntity('opening', opening.id).frameMaterial?.color, '#123456', ' ');
 editor.executeCommand('resetOpeningMaterial', { openingId: opening.id });
 assert.equal(editor.getEntity('opening', opening.id).frameMaterial, undefined, ' ');

 const windowOpening = editor.executeCommand('addOpening', { wallId: wall.id, type: 'window', t: 0.75, shape: 'square' });
 assert.equal(editor.getEntity('opening', windowOpening.id).type, 'window', ' API ');

 // 4. Room 
 const room = editor.executeCommand('addRoom', { x: 2, z: 2, name: 'Master Bedroom' });
 assert.ok(room, ' addRoom ');
 assert.equal(editor.getEntities('room').length, 1, ' 1 Room');

 editor.executeCommand('updateRoom', { roomId: room.id, patch: { name: 'Master Bedroom_ ' } });
 assert.equal(editor.getEntity('room', room.id).name, 'Master Bedroom_ ', ' updateRoom ');

 editor.executeCommand('setRoomFloorMaterial', { roomId: room.id, material: { id: 'wood' } });
 assert.equal(editor.getEntity('room', room.id).material?.id, 'wood', ' setRoomFloorMaterial ');

 // 5. Furniture 
 const item = editor.executeCommand('addItem', { type: 'chair', x: 2, z: 2, width: 0.5, depth: 0.5, height: 0.8 });
 assert.ok(item, ' addItem ');
 assert.equal(editor.getEntities('item').length, 1, ' 1 Furniture ');

 editor.executeCommand('updateItem', { itemId: item.id, patch: { rotation: Math.PI } });
 assert.equal(editor.getEntity('item', item.id).rotation, Math.PI, ' updateItem ');

 editor.executeCommand('assignItemToRoom', { itemId: item.id, roomId: room.id });
 assert.equal(editor.getEntity('item', item.id).roomId, room.id, ' assignItemToRoom ');

 editor.executeCommand('updateItemComponentColor', { itemId: item.id, componentId: 'seat', color: '#00ff00' });
 assert.equal(editor.getEntity('item', item.id).colors?.seat, '#00ff00', ' updateItemComponentColor ');

 editor.executeCommand('updateItemComponentMaterial', { itemId: item.id, componentId: 'seat', material: { id: 'leather' } });
 assert.equal(editor.getEntity('item', item.id).materials?.seat?.id, 'leather', ' updateItemComponentMaterial ');

 // 6. Lock 
 editor.executeCommand('setTargetLocked', { type: 'item', id: item.id, locked: true });
 assert.equal(editor.getEntity('item', item.id).locked, true, ' setTargetLocked ');

 // 7. （ 、 、 、 ） updateStructure 
 const roof = editor.executeCommand('addRoof', { x: 2, z: 2, width: 4, depth: 4, subtype: 'gable' });
 assert.ok(roof, ' addRoof ');
 assert.equal(roof.hideFrame, true, ' (hideFrame true)');

 editor.executeCommand('updateStructure', { type: 'roof', id: roof.id, patch: { height: 1.5 } });
 assert.equal(editor.getEntity('roof', roof.id).height, 1.5, ' updateStructure ');

 const stairs = editor.executeCommand('addStairs', { x: 2, z: 2, subtype: 'straight' });
 assert.ok(stairs, ' addStairs ');

 const fence = editor.executeCommand('addFence', { from: [0, 0], to: [0, 4], subtype: 'picket' });
 assert.ok(fence, ' addFence ');

 const fenceGate = editor.executeCommand('addFenceGate', { fenceId: fence.id, t: 0.5, subtype: 'picket' });
 assert.ok(fenceGate, ' addFenceGate ');
 assert.ok(editor.getEntity('fence_gate', fenceGate.id), ' fence_gate ');

 editor.executeCommand('setTargetLocked', { type: 'fence_gate', id: fenceGate.id, locked: true });
 assert.equal(editor.getEntity('fence_gate', fenceGate.id).locked, true, ' setTargetLocked Lock fence_gate');
 editor.executeCommand('setTargetLocked', { type: 'fence_gate', id: fenceGate.id, locked: false });

 // 8. Delete 
 editor.executeCommand('deleteOpening', { openingId: opening.id });
 assert.equal(editor.getEntity('opening', opening.id), null, ' Delete ');
 editor.executeCommand('deleteOpening', { openingId: windowOpening.id });
 assert.equal(editor.getEntity('opening', windowOpening.id), null, ' Delete ');

 editor.executeCommand('deleteWall', { wallId: wall.id });
 assert.equal(editor.getEntity('wall', wall.id), null, ' Delete ');

 editor.executeCommand('deleteRoom', { roomId: room.id });
 assert.equal(editor.getEntity('room', room.id), null, ' DeleteRoom');

 editor.executeCommand('delete', { itemId: item.id });
 assert.equal(editor.getEntity('item', item.id), null, ' DeleteFurniture');

 editor.executeCommand('deleteRoof', { roofId: roof.id });
 assert.equal(editor.getEntity('roof', roof.id), null, ' Delete ');

 editor.executeCommand('deleteStairs', { stairsId: stairs.id });
 assert.equal(editor.getEntity('stairs', stairs.id), null, ' Delete ');

 editor.executeCommand('deleteFenceGate', { gateId: fenceGate.id });
 assert.equal(editor.getEntity('fence_gate', fenceGate.id), null, ' Delete ');

 editor.executeCommand('deleteFence', { fenceId: fence.id });
 assert.equal(editor.getEntity('fence', fence.id), null, ' Delete ');

 scene.dispose();
 engine.dispose();
});

test('Consumer API: editor.add buildFenceGeometry ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const editor = createEditor({ scene, floorplan: {} });

 assert.equal(typeof editor.add, 'function', 'EditorFacade add ');

 const group = new BABYLON.TransformNode("test_group", scene);
 const tempFence = { id: 'fence_test_1', subtype: 'picket_wood', height: 1.1, thickness: 0.1 };
 const material = new BABYLON.StandardMaterial("mat", scene);

 assert.doesNotThrow(() => {
 buildFenceGeometry(editor, group, tempFence, material, 2.0, 1.1, 0.1);
 }, ' editor registry buildFenceGeometry registry.add is not a function ');

 assert.ok(group.getChildMeshes().length > 0, ' ');

 scene.dispose();
 engine.dispose();
});

test('Consumer API: (sectionId) Delete ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const editor = createEditor({
 scene,
 floorplan: {
 currentFloorId: 'f1',
 floors: [{ id: 'f1', level: 0, wallHeight: 3 }],
 stairs: [{ id: 'st1', subtype: 'curved', x: 2, z: 2, width: 1.2, depth: 3.2, rotation: 0 }],
 fences: []
 }
 });

 // 1. sectionId 
 editor.executeCommand('addFence', { id: 'fc_out1', stairsId: 'st1', sectionId: 'st1_outer', from: [1, 1], to: [1, 2] });
 editor.executeCommand('addFence', { id: 'fc_out2', stairsId: 'st1', sectionId: 'st1_outer', from: [1, 2], to: [1, 3] });
 editor.executeCommand('addFence', { id: 'fc_in1', stairsId: 'st1', sectionId: 'st1_inner', from: [0.5, 1], to: [0.5, 2] });

 const outerBefore = editor.getEntities('fence').filter(f => f.sectionId === 'st1_outer');
 const innerBefore = editor.getEntities('fence').filter(f => f.sectionId === 'st1_inner');
 assert.equal(outerBefore.length, 2, ' 2 ');
 assert.equal(innerBefore.length, 1, ' 1 ');

 // 2. Delete ， 
 editor.executeCommand('deleteFence', { fenceId: 'fc_out1' });
 const outerAfterDelete = editor.getEntities('fence').filter(f => f.sectionId === 'st1_outer');
 const innerAfterDelete = editor.getEntities('fence').filter(f => f.sectionId === 'st1_inner');
 assert.equal(outerAfterDelete.length, 0, 'Delete ， Delete');
 assert.equal(innerAfterDelete.length, 1, ' ， ');

 // 3. updateStairs 
 editor.executeCommand('updateStairs', { stairsId: 'st1', patch: { x: 5, z: 5, rotation: Math.PI / 4 } });
 const innerAfterMove = editor.getEntities('fence').filter(f => f.sectionId === 'st1_inner');
 assert.ok(innerAfterMove.length > 0, ' ');

 scene.dispose();
 engine.dispose();
});
