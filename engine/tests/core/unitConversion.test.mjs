import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { create3MFModelXml } from '../../src/core/threeMfExporter.js';
import { FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';
import { BabylonSceneRenderer } from '../../src/index.js';

test(' ： floorplan.unit "in"（ ） ， Furniture ', () => {
 const mockFloorplan = {
 name: ' ',
 unit: 'in',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: ' ', level: 0, wallHeight: 3, floorHeight: 0.1 }
 ],
 floor: {
 rooms: [
 { id: 'r1', name: 'Living Room', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
 ]
 },
 walls: [],
 openings: [],
 items: [
 {
 id: 'chair_inch',
 type: 'chair',
 name: ' ',
 floorId: 'ground',
 x: 2,
 z: 2,
 width: 39.37, // 39.37 = 1 
 depth: 39.37, // 39.37 = 1 
 height: 78.74, // 78.74 = 2 
 elevation: 19.685 // 19.685 = 0.5 
 }
 ]
 };

 const doc = new FloorplanDocument(mockFloorplan);
 const normalized = doc.floorplan;

 // 1. ('m')
 assert.equal(normalized.unit, 'm', ' ， "m"');

 // 2. Furniture 
 const item = normalized.items.find(i => i.id === 'chair_inch');
 assert.ok(item, ' Furniture ');
 assert.equal(item.width, 1.0, ' 39.37 1.0 ');
 assert.equal(item.depth, 1.0, ' 39.37 1.0 ');
 assert.equal(item.height, 2.0, ' 78.74 2.0 ');
 assert.equal(item.elevation, 0.5, ' 19.685 0.5 ');
});

test(' ： floorplan.unit "m"（ ） ， ', () => {
 const mockFloorplan = {
 name: ' ',
 unit: 'm',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: ' ', level: 0, wallHeight: 3, floorHeight: 0.1 }
 ],
 floor: {
 rooms: [
 { id: 'r1', name: 'Living Room', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
 ]
 },
 walls: [],
 openings: [],
 items: [
 {
 id: 'chair_meter',
 type: 'chair',
 name: ' ',
 floorId: 'ground',
 x: 2,
 z: 2,
 width: 1.2,
 depth: 0.8,
 height: 1.5,
 elevation: 0.3
 }
 ]
 };

 const doc = new FloorplanDocument(mockFloorplan);
 const normalized = doc.floorplan;

 // 1. 'm'
 assert.equal(normalized.unit, 'm', ' ， "m"');

 // 2. Furniture 
 const item = normalized.items.find(i => i.id === 'chair_meter');
 assert.ok(item, ' Furniture ');
 assert.equal(item.width, 1.2, ' 1.2 ');
 assert.equal(item.depth, 0.8, ' 0.8 ');
 assert.equal(item.height, 1.5, ' 1.5 ');
 assert.equal(item.elevation, 0.3, ' 0.3 ');
});

test(' ： Furniture ， ', () => {
 const mockFloorplan = {
 name: ' ',
 unit: 'm',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: ' ', level: 0, wallHeight: 3, floorHeight: 0.1 }
 ],
 floor: {
 rooms: [
 { id: 'r1', name: 'Living Room', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
 ]
 },
 walls: [],
 openings: [],
 items: [
 {
 id: 'chair_default',
 type: 'chair', // chair （ width: 24, depth: 24, height: 32）
 name: ' ',
 floorId: 'ground',
 x: 2,
 z: 2
 }
 ]
 };

 const doc = new FloorplanDocument(mockFloorplan);
 const normalized = doc.floorplan;

 const item = normalized.items.find(i => i.id === 'chair_default');
 assert.ok(item, ' Furniture ');
 
 // ， 
 assert.ok(item.width > 0, ' ');
 assert.ok(item.depth > 0, ' ');
 assert.ok(item.height > 0, ' ');

 // defaultSize.width 0.45 (unit: 'm')
 assert.equal(item.width, 0.45, ' 0.45 ');
});

test('3MF Export： Furniture， （elevation） INCHES_PER_UNIT', () => {
 const mockFloorplan = {
 name: '3MF Export ',
 unit: 'm',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: ' ', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
 ],
 floor: {
 rooms: [
 { id: 'r1', name: 'Living Room', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
 ]
 },
 walls: [],
 openings: [],
 items: [
 {
 id: 'non_mesh_item',
 type: 'some_unknown_type', // ， 
 name: ' Furniture',
 floorId: 'ground',
 x: 0,
 z: 0,
 width: 1.0, // 1 
 depth: 1.0, // 1 
 height: 1.0, // 1 
 elevation: 1.5 // 1.5 
 }
 ]
 };

 const doc = new FloorplanDocument(mockFloorplan);
 const normalized = doc.floorplan;

 // 3MF Export XML 
 const xml = create3MFModelXml(normalized);

 // Bug ：
 // size.height = 1.0, elevation = 1.5, floorY = 0, roomOffset = 0
 // centerY = floorY + roomOffset + elevation + size.height / 2 = 1.5 + 0.5 = 2.0
 // y cy - height / 2 = 1.5, cy + height / 2 = 2.5
 // 3MF XML y="2.50000" y="1.50000"
 assert.match(xml, /y="2\.60000"/, '3MF Export 2.60000 ');
 assert.match(xml, /y="1\.60000"/, '3MF Export 1.60000 ');

 // Bug， 39.37：
 // centerY = 1.5 / 39.37 + 0.5 = 0.5381
 // y 0.03810 1.03810， 2.50000 / 1.50000 。
 assert.doesNotMatch(xml, /y="1\.03810"/, ' Bug Y 1.03810 ');
});

test(' ： Furniture unit: "m"（ ）， Furniture ， 39.37', () => {
 // 1. CustomFurniture 
 FURNITURE_DEFINITIONS['custom_meter_chair'] = {
 type: 'custom_meter_chair',
 name: ' Custom ',
 unit: 'm',
 defaultSize: { width: 0.6, depth: 0.6, height: 1.1 },
 components: [
 { id: 'seat', label: ' ', defaultColor: '#ff9dbb' }
 ]
 };

 const mockFloorplan = {
 name: ' ',
 unit: 'm',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: ' ', level: 0, wallHeight: 3, floorHeight: 0.1 }
 ],
 floor: {
 rooms: [
 { id: 'r1', name: 'Living Room', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
 ]
 },
 walls: [],
 openings: [],
 items: [
 {
 id: 'meter_chair_instance',
 type: 'custom_meter_chair',
 name: ' ',
 floorId: 'ground',
 x: 2,
 z: 2
 }
 ]
 };

 const doc = new FloorplanDocument(mockFloorplan);
 const normalized = doc.floorplan;

 const item = normalized.items.find(i => i.id === 'meter_chair_instance');
 assert.ok(item, ' Furniture ');
 assert.equal(item.width, 0.6, ' 0.6 ');
 assert.equal(item.depth, 0.6, ' 0.6 ');
 assert.equal(item.height, 1.1, ' 1.1 ');
});

test('Babylon ： Furniture unit: "m"， ， 39.37', () => {
 // 1. Furniture 
 FURNITURE_DEFINITIONS['custom_meter_light'] = {
 type: 'custom_meter_light',
 name: ' Custom ',
 unit: 'm',
 defaultSize: { width: 0.5, depth: 0.5, height: 1.0 },
 lightSource: {
 type: 'point',
 offset: { x: 0.1, y: 0.8, z: 0.2 },
 range: 3.5
 },
 components: [
 { id: 'bulb', label: ' ', defaultColor: '#ffffff' }
 ],
 build(registry, item, node, size) {
 // ： mesh 
 }
 };

 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 // 2. floorplan 
 const mockPlan = {
 unit: 'm',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: ' ', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
 ],
 floor: { rooms: [] },
 walls: [],
 openings: [],
 items: [
 {
 id: 'meter_light_instance',
 type: 'custom_meter_light',
 floorId: 'ground',
 x: 1.0,
 z: 2.0,
 elevation: 0.0,
 isOn: true
 }
 ]
 };

 // 3. 
 const doc = new FloorplanDocument(mockPlan);
 const renderer = new BabylonSceneRenderer(scene, doc);
 renderer.build();

 // 4. 
 const light = scene.lights.find(l => l.name === 'item_light_meter_light_instance');
 assert.ok(light, ' ');

 // 5. 39.37 
 assert.equal(light.position.x, 0.1, ' X 0.1 ');
 assert.equal(light.position.y, 0.8, ' Y 0.8 ');
 assert.equal(light.position.z, 0.2, ' Z 0.2 ');
 assert.equal(light.range, 3.5, ' 3.5 ');

 scene.dispose();
 engine.dispose();
});

test(' Lighting ', () => {
 FURNITURE_DEFINITIONS.custom_all_floor_light = {
 type: 'custom_all_floor_light',
 name: ' ',
 unit: 'm',
 defaultSize: { width: 0.2, depth: 0.2, height: 0.6 },
 lightSource: { type: 'point', offset: { x: 0, y: 0.5, z: 0 }, range: 3 },
 components: [],
 build() {}
 };
 const plan = {
 unit: 'm', currentFloorId: 'floor_1', floor: { rooms: [] }, walls: [], openings: [], roofs: [], stairs: [], fences: [], fenceGates: [],
 floors: [
 { id: 'floor_1', name: '1F', level: 0, wallHeight: 3, floorHeight: 0.1 },
 { id: 'floor_2', name: '2F', level: 1, wallHeight: 3, floorHeight: 0.1 }
 ],
 items: [
 { id: 'light_1', type: 'custom_all_floor_light', floorId: 'floor_1', x: 0, z: 0, width: 0.2, depth: 0.2, height: 0.6 },
 { id: 'light_2', type: 'custom_all_floor_light', floorId: 'floor_2', x: 0, z: 0, width: 0.2, depth: 0.2, height: 0.6 }
 ]
 };
 const originalWindow = globalThis.window;
 globalThis.window = { showAllFloors: true };
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 try {
 const document = new FloorplanDocument(plan);
 const renderer = new BabylonSceneRenderer(scene, document);
 renderer.build();
 assert.ok(scene.getLightByName('item_light_light_1'));
 assert.ok(scene.getLightByName('item_light_light_2'));
 renderer.dispose();
 } finally {
 if (originalWindow === undefined) delete globalThis.window;
 else globalThis.window = originalWindow;
 delete FURNITURE_DEFINITIONS.custom_all_floor_light;
 scene.dispose();
 engine.dispose();
 }
});
