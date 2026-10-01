import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { ExportService } from '../../src/services/ExportService.js';
import { Blueprint3DTestMap } from '../../src/presets/blueprintTestMap.js';

test('ExportService： Export ', () => {
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

 const doc = new FloorplanDocument(mockPlan);
 const service = new ExportService(doc);

 // 1. exportJSON
 const exported = service.exportJSON();
 assert.equal(exported.currentFloorId, 'floor_1');
 assert.equal(exported.floor.rooms[0].id, 'living');
 // 
 assert.notEqual(exported, doc.floorplan);

 // 2. exportBuildingFile stringifyBuildingFile
 const buildingFileData = service.exportBuildingFile();
 assert.equal(typeof buildingFileData, 'object');
 assert.equal(buildingFileData.format, 'blueprint3d-babylon.building.v1');
 const buildingFileStr = service.stringifyBuildingFile();
 assert.equal(typeof buildingFileStr, 'string');

 // 3. stringifyDXF
 const dxfStr = service.stringifyDXF();
 assert.equal(typeof dxfStr, 'string');

 // 4. create3MFPackage
 const package3mf = service.create3MFPackage();
 assert.ok(package3mf instanceof Uint8Array || package3mf instanceof Blob || typeof package3mf === 'object');

 // 5. loadJSON loadBuildingFile
 const newPlan = {
 ...mockPlan,
 currentFloorId: 'floor_2',
 floors: [{ id: 'floor_2', name: '2F', level: 1 }]
 };
 service.loadJSON(newPlan);
 assert.equal(doc.floorplan.currentFloorId, 'floor_2');

 const fileData = service.exportBuildingFile();
 service.loadBuildingFile(fileData);
 assert.equal(doc.floorplan.currentFloorId, 'floor_2');
});

test('Blueprint3DTestMap： ', async () => {
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

 // 1. exportService 
 assert.ok(map.exportService instanceof ExportService, 'exportService map ');

 // 2. exportJSON 
 const exported = map.exportJSON();
 assert.equal(exported.currentFloorId, 'floor_1');

 // 3. loadJSON build 
 map.selectedItemId = 'some_item';
 const newPlan = {
 ...mockPlan,
 currentFloorId: 'floor_2',
 floors: [{ id: 'floor_2', name: '2F', level: 1 }]
 };
 map.loadJSON(newPlan);

 assert.equal(map.floorplan.currentFloorId, 'floor_2');
 assert.equal(map.selectedItemId, null, ' ， ');

 scene.dispose();
 engine.dispose();
});
