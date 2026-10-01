import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';
import { BabylonSceneRenderer } from '../../src/index.js';

test(' ： Mirror、 Mirror、Metal / ', async () => {
 // 1. Mirror MetalFurniture 
 FURNITURE_DEFINITIONS['custom_test_mirror'] = {
 type: 'custom_test_mirror',
 name: ' Mirror',
 isMirror: true,
 defaultSize: { width: 0.8, depth: 0.1, height: 1.5 },
 components: [
 { id: 'mirror_mesh_id', label: ' ', defaultColor: '#ffffff' }
 ],
 build(registry, item, node, size) {
 const mesh = BABYLON.MeshBuilder.CreateBox('mirror_mesh_id', { width: 0.8, height: 1.5, depth: 0.05 }, node.getScene());
 mesh.parent = node;
 mesh.metadata = { blueprintFurnitureComponentId: 'mirror_mesh_id' };
 const mat = new BABYLON.StandardMaterial('mirror_mat', node.getScene());
 mat.metadata = {
 blueprintMaterial: {
 kind: 'mirror'
 }
 };
 mesh.material = mat;
 }
 };

 FURNITURE_DEFINITIONS['custom_test_sub_mirror'] = {
 type: 'custom_test_sub_mirror',
 name: ' Mirror',
 isMirror: false,
 defaultSize: { width: 0.8, depth: 0.1, height: 1.5 },
 components: [
 { id: 'sub_glass_id', label: ' ', defaultColor: '#ffffff' }
 ],
 build(registry, item, node, size) {
 const mesh = BABYLON.MeshBuilder.CreateBox('sub_glass_id', { width: 0.8, height: 1.5, depth: 0.05 }, node.getScene());
 mesh.parent = node;
 mesh.metadata = { blueprintFurnitureComponentId: 'sub_glass_id' };
 const mat = new BABYLON.StandardMaterial('sub_glass_mat', node.getScene());
 mat.metadata = {
 blueprintMaterial: {
 kind: 'mirror'
 }
 };
 mesh.material = mat;
 }
 };

 FURNITURE_DEFINITIONS['custom_test_metal'] = {
 type: 'custom_test_metal',
 name: ' Metal ',
 defaultSize: { width: 0.5, depth: 0.5, height: 0.5 },
 components: [
 { id: 'metal_mesh_id', label: 'Metal ', defaultColor: '#888888' }
 ],
 build(registry, item, node, size) {
 const mesh = BABYLON.MeshBuilder.CreateBox('metal_mesh_id', { width: 0.5, height: 0.5, depth: 0.5 }, node.getScene());
 mesh.parent = node;
 mesh.metadata = { blueprintFurnitureComponentId: 'metal_mesh_id' };
 const mat = new BABYLON.StandardMaterial('metal_mat', node.getScene());
 mat.metadata = {
 blueprintMaterial: {
 kind: 'metal'
 }
 };
 mesh.material = mat;
 }
 };

 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 // 2. Floorplan
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
 id: 'main_mirror_instance',
 type: 'custom_test_mirror',
 floorId: 'ground',
 x: 1.0,
 z: 1.0,
 elevation: 0.0
 },
 {
 id: 'sub_mirror_instance',
 type: 'custom_test_sub_mirror',
 floorId: 'ground',
 x: 2.0,
 z: 2.0,
 elevation: 0.0
 },
 {
 id: 'metal_instance',
 type: 'custom_test_metal',
 floorId: 'ground',
 x: 3.0,
 z: 3.0,
 elevation: 0.0
 }
 ]
 };

 const doc = new FloorplanDocument(mockPlan);
 const renderer = new BabylonSceneRenderer(scene, doc);
 renderer.build();

 // ， executeWhenReady 
 await scene.whenReadyAsync();

 // (enableAdvancedRendering = false)
 // mesh
 const mainMirrorMesh = scene.getMeshByName('mirror_mesh_id');
 const subMirrorMesh = scene.getMeshByName('sub_glass_id');
 const metalMesh = scene.getMeshByName('metal_mesh_id');

 assert.ok(mainMirrorMesh, ' Mirror');
 assert.ok(subMirrorMesh, ' Mirror');
 assert.ok(metalMesh, ' Metal ');

 const mainMat = mainMirrorMesh.material;
 const subMat = subMirrorMesh.material;
 const metalMat = metalMesh.material;

 // （enableAdvancedRendering = false）
 // 1. Mirror： 256 MirrorTexture
 assert.ok(mainMat.reflectionTexture instanceof BABYLON.MirrorTexture, ' ， Mirror MirrorTexture');
 assert.equal(mainMat.reflectionTexture.getRenderWidth(), 256, ' ， Mirror 256');

 // 2. Mirror： ReflectionProbe ( )
 assert.ok(subMat.customReflectionProbe instanceof BABYLON.ReflectionProbe, ' ， Mirror ');
 assert.ok(!(subMat.reflectionTexture instanceof BABYLON.MirrorTexture), ' ， Mirror ');

 // 3. Metal： CubeMap（ saved， customReflectionProbe / ， ）
 assert.ok(!metalMat.customReflectionProbe, ' ，Metal ');

 // High Quality 
 renderer.setAdvancedRendering(true);

 // （enableAdvancedRendering = true）
 // 1. Mirror： 2048 MirrorTexture
 assert.ok(mainMat.reflectionTexture instanceof BABYLON.MirrorTexture, ' ， Mirror MirrorTexture');
 assert.equal(mainMat.reflectionTexture.getRenderWidth(), 2048, ' ， Mirror 2048');

 // 2. Mirror： 1024 MirrorTexture
 assert.ok(subMat.reflectionTexture instanceof BABYLON.MirrorTexture, ' ， Mirror MirrorTexture');
 assert.equal(subMat.reflectionTexture.getRenderWidth(), 1024, ' ， Mirror 1024');
 assert.ok(!subMat.customReflectionProbe, ' ， Mirror ');

 // 3. Metal： ReflectionProbe
 assert.ok(metalMat.customReflectionProbe instanceof BABYLON.ReflectionProbe, ' ，Metal ');

 // 
 renderer.setAdvancedRendering(false);

 // 
 assert.ok(mainMat.reflectionTexture instanceof BABYLON.MirrorTexture, ' ， Mirror ');
 assert.equal(mainMat.reflectionTexture.getRenderWidth(), 256, ' ， Mirror 256');
 assert.ok(subMat.customReflectionProbe instanceof BABYLON.ReflectionProbe, ' ， Mirror ');
 assert.ok(!metalMat.customReflectionProbe, ' ，Metal ');

 // Save ， Mirror Mirror 。
 let mirrorRefreshCount = 0;
 let probeRefreshCount = 0;
 mainMat.reflectionTexture.resetRefreshCounter = () => { mirrorRefreshCount += 1; };
 const subProbeRenderTarget = subMat.customReflectionProbe.cubeTexture;
 subProbeRenderTarget.resetRefreshCounter = () => { probeRefreshCount += 1; };

 renderer.requestReflectionTexturesUpdate();

 assert.equal(mirrorRefreshCount, 1, ' Mirror MirrorTexture');
 assert.equal(probeRefreshCount, 1, ' Mirror ReflectionProbe');

 scene.dispose();
 engine.dispose();
});
