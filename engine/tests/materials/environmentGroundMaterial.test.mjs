import * as BABYLON from '@babylonjs/core';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlueprintMaterial } from '../../src/index.js';

test('Sky createBlueprintMaterial Glass ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 try {
 // 1. Glass 
 const glassDescriptor = {
 kind: 'glass',
 color: '#88ccff',
 alpha: 0.35
 };

 const glassMat = createBlueprintMaterial(scene, 'ground_glass_test', glassDescriptor, {
 isFloor: true,
 isEnvironmentGround: true,
 surfaceWidth: 120,
 surfaceHeight: 120
 });

 assert.ok(glassMat, ' Glass ');
 assert.equal(glassMat.alpha, 0.35, ' Glass alpha 0.35');
 assert.equal(glassMat.backFaceCulling, false, ' Glass ');
 assert.equal(glassMat.twoSidedLighting, true, ' Glass ');

 // 2. alpha 
 const transparentColorDesc = {
 kind: 'color',
 color: '#00ff88',
 alpha: 0.5
 };

 const transparentColorMat = createBlueprintMaterial(scene, 'ground_transparent_color', transparentColorDesc, {
 isFloor: true,
 isEnvironmentGround: true,
 surfaceWidth: 120,
 surfaceHeight: 120
 });

 assert.equal(transparentColorMat.alpha, 0.5, ' alpha alpha 0.5');

 // 3. Export createBlueprintMaterial
 assert.equal(typeof createBlueprintMaterial, 'function', ' API (src/index.js) Export createBlueprintMaterial');
 } finally {
 scene.dispose();
 engine.dispose();
 }
});
