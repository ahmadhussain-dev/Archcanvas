import test from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getFurnitureDefinition, FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';

test(' Vending Machine Food', () => {
 const doc = new FloorplanDocument();
 const vending = doc.addItem({
 type: 'vending_machine',
 x: 5,
 z: 10,
 rotation: 0,
 isOn: false
 });

 const initialCount = doc.floorplan.items.length;
 assert.equal(initialCount, 1);

 // 1. Vending Machine
 doc.updateItem(vending.id, { isOn: true });

 assert.equal(doc.floorplan.items.length, 2);
 const spawnedFood = doc.floorplan.items[1];

 const foodDef = getFurnitureDefinition(spawnedFood.type);
 assert.equal(foodDef.category, 'food', ' food');

 // rotation = 0 ， 1m (sin(0)=0, cos(0)=1) -> x: 5, z: 11
 assert.equal(spawnedFood.x, 5);
 assert.equal(spawnedFood.z, 11);

 // 2. isOn: true isOn ， Food
 doc.updateItem(vending.id, { name: ' ' });
 assert.equal(doc.floorplan.items.length, 2);

 // 3. Vending Machine
 doc.updateItem(vending.id, { isOn: false });
 assert.equal(doc.floorplan.items.length, 2);

 // 4. Rotate 90 (Math.PI / 2) Vending Machine
 doc.updateItem(vending.id, { rotation: Math.PI / 2 });
 doc.updateItem(vending.id, { isOn: true });

 assert.equal(doc.floorplan.items.length, 3);
 const secondFood = doc.floorplan.items[2];
 const secondFoodDef = getFurnitureDefinition(secondFood.type);
 assert.equal(secondFoodDef.category, 'food');

 // rotation = Math.PI / 2 (sin(PI/2)=1, cos(PI/2)=0) -> x: 6, z: 10
 assert.equal(secondFood.x, 6);
 assert.equal(secondFood.z, 10);
});

test('BabylonSceneRenderer Vending Machine Food 3D ', async () => {
 const { BabylonSceneRenderer } = await import('../../src/runtime/BabylonSceneRenderer.js');
 const BABYLON = await import('@babylonjs/core');

 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 const doc = new FloorplanDocument();
 const vending = doc.addItem({
 type: 'vending_machine',
 x: 0,
 z: 0,
 rotation: 0,
 isOn: false
 });

 const renderer = new BabylonSceneRenderer(scene, doc);
 renderer.renderingEnabled = true;
 renderer.build({ rebuildType: 'all' });

 assert.equal(renderer.itemNodes.size, 1);

 // update ， 
 doc.updateItem(vending.id, { isOn: true });
 renderer.build({ rebuildType: 'item_update', targetId: vending.id });

 // itemNodes 2 （ Food ）
 assert.equal(renderer.itemNodes.size, 2);

 scene.dispose();
 engine.dispose();
});

