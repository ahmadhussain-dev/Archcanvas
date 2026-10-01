import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { BlueprintRegistry } from '../../src/core/BlueprintRegistry.js';
import { FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';

test(' 8 Potted Plants Flora & Trees ', async (t) => {
 const newTypes = [
 'balcony_flower_box',
 'terracotta_flower_urn',
 'potted_pink_rose',
 'landscape_climbing_rose_wall',
 'landscape_water_lily_pads',
 'landscape_water_reeds',
 'landscape_flower_hedge',
 'landscape_pergola_flower_vines'
 ];

 await t.test(' FURNITURE_DEFINITIONS ', () => {
 newTypes.forEach((type) => {
 const def = FURNITURE_DEFINITIONS[type];
 assert.ok(def, ` ${type} Export `);
 assert.ok(def.name, ` ${type} `);
 assert.ok(def.defaultSize, ` ${type} defaultSize`);
 assert.ok(def.defaultSize.width > 0, ` ${type} width `);
 assert.ok(def.defaultSize.height > 0, ` ${type} height `);
 assert.ok(def.defaultSize.depth > 0, ` ${type} depth `);
 assert.ok(Array.isArray(def.components) && def.components.length > 0, ` ${type} components `);
 assert.equal(typeof def.build, 'function', ` ${type} build 3D `);
 });
 });

 await t.test(' 8 Babylon Scene 3D ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const registry = new BlueprintRegistry(scene);

 newTypes.forEach((type, index) => {
 const def = FURNITURE_DEFINITIONS[type];
 const item = { id: `item_test_${type}_${index}`, type: type };
 const parentNode = new BABYLON.TransformNode(`node_${item.id}`, scene);

 def.build(registry, item, parentNode, def.defaultSize);

 const children = parentNode.getChildren();
 assert.ok(children.length > 0, ` ${type} build 3D Mesh ( : ${children.length})`);
 });

 scene.dispose();
 engine.dispose();
 });

 await t.test(' 8 （ 2.5 /0.3 ） ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const registry = new BlueprintRegistry(scene);

 newTypes.forEach((type, index) => {
 const def = FURNITURE_DEFINITIONS[type];
 const scaledUpSize = {
 width: def.defaultSize.width * 2.5,
 height: def.defaultSize.height * 2.5,
 depth: def.defaultSize.depth * 2.5
 };

 const itemScaled = { id: `item_scale_${type}_${index}`, type: type };
 const parentNode = new BABYLON.TransformNode(`node_${itemScaled.id}`, scene);

 def.build(registry, itemScaled, parentNode, scaledUpSize);

 const children = parentNode.getChildren();
 assert.ok(children.length > 0, ` ${type} `);
 });

 scene.dispose();
 engine.dispose();
 });

 await t.test('Flora & Trees Design （ #ff0000） ， Custom ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const registry = new BlueprintRegistry(scene);

 const wisteriaDef = FURNITURE_DEFINITIONS['landscape_pergola_flower_vines'];
 assert.ok(wisteriaDef, ' ');

 // Design #ff0000
 const custom = {
 id: 'item_custom_wisteria',
 type: 'landscape_pergola_flower_vines',
 colors: {
 'hanging-flowers': '#ff0000'
 }
 };

 const parentNode = new BABYLON.TransformNode(`node_${custom.id}`, scene);
 wisteriaDef.build(registry, custom, parentNode, wisteriaDef.defaultSize);

 const children = parentNode.getChildren();
 assert.ok(children.length > 0, ' ');

 // ，hanging-flowers Custom #ff0000 
 const flowerMesh = children.find(child => child.metadata && child.metadata.blueprintFurnitureComponentId === 'hanging-flowers');
 assert.ok(flowerMesh, ' hanging-flowers ');
 assert.ok(flowerMesh.material, 'hanging-flowers 3D ');

 const diffuseColorHex = flowerMesh.material.diffuseColor ? flowerMesh.material.diffuseColor.toHexString().toLowerCase() : '';
 assert.equal(diffuseColorHex, '#ff0000', ` Custom #ff0000， ${diffuseColorHex}`);

 scene.dispose();
 engine.dispose();
 });

});

