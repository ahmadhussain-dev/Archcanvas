import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import fs from 'node:fs';

import { FloorplanDocument, BabylonSceneRenderer } from '../../src/index.js';
import { FURNITURE_LIST } from '../../src/furniture/index.js';
import { buildStairsGeometry } from '../../src/geometry/stairsGeometry.js';

function minimalPlan(overrides = {}) {
 return {
 unit: 'm',
 currentFloorId: 'floor_1',
 floors: [{ id: 'floor_1', name: '1F', level: 0 }],
 floor: { rooms: [] },
 walls: [],
 openings: [],
 items: [],
 roofs: [],
 stairs: [],
 fences: [],
 fenceGates: [],
 ...overrides
 };
}

test('Sky Save ', () => {
 const document = new FloorplanDocument(minimalPlan());
 const sky = { kind: 'texture', src: 'data:image/png;base64,sky', scale: 1, color: '#ffffff' };

 document.setEnvironmentMaterial('sky', sky);
 document.setEnvironmentMaterial('ground', '#446633');

 const snapshot = document.createSnapshot();
 assert.equal(snapshot.environment.skyMaterial.src, sky.src);
 assert.equal(snapshot.environment.groundMaterial.color, '#446633');
 assert.equal(document.setEnvironmentMaterial('unsupported', '#000000'), null);

 document.setEnvironmentMaterial('sky', null);
 assert.equal(document.floorplan.environment.skyMaterial, null);
 assert.equal(document.floorplan.environment.groundMaterial.color, '#446633');
});

test('L Save ', () => {
 const document = new FloorplanDocument(minimalPlan({
 stairs: [{
 id: 'stairs_l', floorId: 'floor_1', subtype: 'lshape', width: 1,
 depth: 3, height: 3, steps: 10, cornerStep: 4,
 runBeforeCorner: 2.4, runAfterCorner: 1.6
 }]
 }));
 const stairs = document.floorplan.stairs[0];
 assert.equal(stairs.runBeforeCorner, 2.4);
 assert.equal(stairs.runAfterCorner, 1.6);

 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const group = new BABYLON.TransformNode('stairs-test', scene);
 const material = new BABYLON.StandardMaterial('stairs-material', scene);
 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || group;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };

 buildStairsGeometry(registry, group, stairs, material, stairs.width, stairs.depth, stairs.height, stairs.steps);
 const firstRun = group.getChildMeshes().filter((mesh) => mesh.name.includes('_l1_tread_'));
 const secondRun = group.getChildMeshes().filter((mesh) => mesh.name.includes('_l2_tread_'));
 assert.equal(firstRun.length, 4);
 assert.equal(secondRun.length, 6);
 assert.ok(Math.abs(firstRun[0].getBoundingInfo().boundingBox.extendSizeWorld.z * 2 - 0.6) < 0.001);
 assert.ok(Math.abs(secondRun[0].getBoundingInfo().boundingBox.extendSizeWorld.x * 2 - (1.6 / 6)) < 0.001);

 scene.dispose();
 engine.dispose();
});

test(' / Mesh', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const group = new BABYLON.TransformNode('straight-stairs-test', scene);
 const material = new BABYLON.StandardMaterial('treadMat', scene);
 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || group;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };

 const straightStairs = {
 id: 'st_straight_12',
 subtype: 'straight',
 width: 1.2,
 depth: 3.6,
 height: 3.0,
 steps: 12,
 sideColor: '#f0f0f0'
 };

 buildStairsGeometry(registry, group, straightStairs, material, straightStairs.width, straightStairs.depth, straightStairs.height, straightStairs.steps);

 const meshes = group.getChildMeshes();
 const sideMeshes = meshes.filter((m) => m.metadata?.blueprintStairsComponentId === 'side');
 const treadMeshes = meshes.filter((m) => m.name.includes('stairs_step_tread_'));

 assert.equal(treadMeshes.length, 12, ' 12 Mesh');
 assert.equal(sideMeshes.length, 1, '12 / 1 Mesh');
 assert.equal(sideMeshes[0].name, 'stairs_side_base_st_straight_12');

 scene.dispose();
 engine.dispose();
});

test('buildStairsGeometry supports ladder and slide subtypes correctly', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const material = new BABYLON.StandardMaterial('treadMat', scene);
 const group = new BABYLON.TransformNode('stairsGroup', scene);

 const ladderStairs = {
 id: 'test_ladder',
 subtype: 'ladder',
 width: 0.6,
 depth: 0.2,
 height: 3,
 steps: 10
 };

 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || group;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };

 buildStairsGeometry(registry, group, ladderStairs, material, ladderStairs.width, ladderStairs.depth, ladderStairs.height, ladderStairs.steps);
 const rungs = group.getChildMeshes().filter((mesh) => mesh.name.includes('stairs_rung_'));
 assert.equal(rungs.length, 10);
 assert.equal(rungs[0].metadata?.blueprintStairsComponentId, 'top');

 group.dispose();
 const groupSlide = new BABYLON.TransformNode('slideGroup', scene);
 const slideStairs = {
 id: 'test_slide',
 subtype: 'slide',
 width: 0.9,
 depth: 3,
 height: 1.8,
 steps: 1
 };

 buildStairsGeometry(registry, groupSlide, slideStairs, material, slideStairs.width, slideStairs.depth, slideStairs.height, slideStairs.steps);
 const chute = groupSlide.getChildMeshes().find((mesh) => mesh.name.includes('stairs_slide_chute_'));
 const rails = groupSlide.getChildMeshes().filter((mesh) => mesh.name.includes('stairs_slide_rail_'));
 assert.ok(chute);
 assert.equal(chute.metadata?.blueprintStairsComponentId, 'top');
 assert.equal(rails.length, 2);
 assert.equal(rails[0].metadata?.blueprintStairsComponentId, 'side');

 const hitbox = groupSlide.getChildMeshes().find((mesh) => mesh.name.includes('stairs_hitbox_'));
 assert.ok(hitbox);
 assert.equal(hitbox.visibility, 0);
 assert.equal(hitbox.isPickable, true);

 const groupFloating2 = new BABYLON.TransformNode('floating2Group', scene);
 const floatingStairs2 = {
 id: 'test_floating_2',
 subtype: 'floating',
 width: 1,
 depth: 3,
 height: 3,
 steps: 12,
 beamCount: 2
 };
 buildStairsGeometry(registry, groupFloating2, floatingStairs2, material, floatingStairs2.width, floatingStairs2.depth, floatingStairs2.height, floatingStairs2.steps);
 const beams2 = groupFloating2.getChildMeshes().filter((mesh) => mesh.name.includes('stairs_beam_'));
 assert.equal(beams2.length, 2);
 assert.equal(beams2[0].metadata?.blueprintStairsComponentId, 'side');

 scene.dispose();
 engine.dispose();
});

test('Decor Furniture 、 Tables ', () => {
 const byType = (type) => FURNITURE_LIST.find((definition) => definition.type === type);
 const poster = byType('poster');
 const triptychPoster = byType('triptych_poster');
 const quadPoster = byType('quad_poster');
 const coffeeTable = byType('coffee_table');
 const sideTable = byType('side_table');
 const screen = byType('modern_slat_screen');

 assert.equal(poster.placeType, 'wall');
 assert.equal(poster.defaultSize.depth, 0.08);
 assert.deepEqual(poster.components.map((component) => component.id), ['poster']);
 assert.deepEqual(triptychPoster.components.map((component) => component.id), ['frame', 'poster']);
 assert.deepEqual(quadPoster.components.map((component) => component.id), ['frame', 'poster']);
 assert.equal(poster.components[0].defaultMaterial.id, 'poster-celestial-moons');
 assert.equal(triptychPoster.components[1].defaultMaterial.id, 'poster-botanical-sage');
 assert.equal(quadPoster.components[1].defaultMaterial.id, 'poster-abstract-arches');
 assert.deepEqual(coffeeTable.defaultSize, { width: 0.7, depth: 0.7, height: 0.45 });
 assert.deepEqual(sideTable.defaultSize, { width: 0.45, depth: 0.45, height: 0.55 });
 assert.equal(screen.components[0].id, 'base');
 assert.equal(screen.components[1].id, 'slats');
});

test(' New ', () => {
 const document = new FloorplanDocument(minimalPlan());
 assert.equal(document.addItem({ type: 'poster' }).materials.poster.id, 'poster-celestial-moons');
 assert.equal(document.addItem({ type: 'triptych_poster' }).materials.poster.id, 'poster-botanical-sage');
 assert.equal(document.addItem({ type: 'quad_poster' }).materials.poster.id, 'poster-abstract-arches');
 assert.equal(document.addItem({ type: 'landscape_painting' }).materials.canvas.id, 'wallpaper-ink-bamboo-mist');
 assert.equal(document.addItem({ type: 'painting' }).materials.canvas.id, 'poster-bauhaus-primary');
});

test(' First Floor ， ', () => {
 const definition = FURNITURE_LIST.find((item) => item.type === 'poster');
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const node = new BABYLON.TransformNode('poster-test', scene);
 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || node;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };
 definition.build(registry, { id: 'poster', colors: {}, materials: {} }, node, { width: 0.46, depth: 0.002, height: 0.61 });
 const meshes = node.getChildMeshes();
 assert.equal(meshes.length, 1);
 assert.equal(meshes[0].metadata.blueprintFurnitureComponentId, 'poster');
 assert.ok(meshes[0].getBoundingInfo().boundingBox.extendSizeWorld.z * 2 <= 0.003);
 scene.dispose();
 engine.dispose();
});

test(' ', () => {
 const definition = FURNITURE_LIST.find((item) => item.type === 'single_blackout_curtain');
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const node = new BABYLON.TransformNode('single-curtain-test', scene);
 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || node;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };

 definition.build(registry, { id: 'curtain', isOn: true, colors: {}, materials: {} }, node, {
 width: 1.22, depth: 0.076, height: 2.03
 });
 node.computeWorldMatrix(true);

 const rods = node.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'rod');
 const visibleFabric = node.getChildMeshes().filter((mesh) => (
 mesh.metadata?.blueprintFurnitureComponentId === 'fabric' && mesh.visibility > 0.5
 ));
 assert.equal(rods.length, 2);
 assert.ok(visibleFabric.length >= 9);

 const bounds = visibleFabric.reduce((result, mesh) => {
 mesh.computeWorldMatrix(true);
 const box = mesh.getBoundingInfo().boundingBox;
 return {
 min: Math.min(result.min, box.minimumWorld.x),
 max: Math.max(result.max, box.maximumWorld.x)
 };
 }, { min: Infinity, max: -Infinity });
 assert.ok(bounds.max - bounds.min > 1.22 * 0.56);
 assert.ok(bounds.max - bounds.min < 1.22 * 0.70);
 assert.ok(bounds.min < -1.22 * 0.44);

 scene.dispose();
 engine.dispose();
});

test(' ', () => {
 const source = fs.readFileSync(new URL('../../example/js/EditorUi.js', import.meta.url), 'utf8');
 const colorField = source.slice(source.indexOf('export function createColorField'), source.indexOf('export function createApplyMaterialButton'));

 assert.match(colorField, /input\.type = 'color'/);
 assert.match(colorField, /inset: 0; width: 100%; height: 30px/);
 assert.doesNotMatch(colorField, /input\.style\.pointerEvents\s*=\s*'none'/);
 assert.doesNotMatch(colorField, /showPicker\(/);
});

test(' ', () => {
 const definition = FURNITURE_LIST.find((item) => item.type === 'triptych_poster');
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const node = new BABYLON.TransformNode('triptych-poster-test', scene);
 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || node;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };
 const texture = {
 kind: 'texture',
 src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO7EAAAAASUVORK5CYII=',
 color: '#ffffff'
 };
 definition.build(registry, {
 id: 'triptych-poster',
 colors: {},
 materials: { poster: texture }
 }, node, { width: 1.2, depth: 0.03, height: 0.7 });

 const panels = node.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'poster');
 assert.equal(panels.length, 3);
 assert.deepEqual(panels.map((mesh) => mesh.material.diffuseTexture.uOffset), [0, 1 / 3, 2 / 3]);
 panels.forEach((mesh) => {
 assert.equal(mesh.material.diffuseTexture.uScale, 1 / 3);
 assert.equal(mesh.material.diffuseTexture.vScale, 1);
 });
 scene.dispose();
 engine.dispose();
});

test(' Custom ', () => {
 const definition = FURNITURE_LIST.find((item) => item.type === 'quad_poster');
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const node = new BABYLON.TransformNode('quad-poster-test', scene);
 const registry = {
 scene,
 materialCache: new Map(),
 add(mesh, options = {}) {
 mesh.parent = options.parent || node;
 if (options.material) mesh.material = options.material;
 return mesh;
 }
 };
 const texture = {
 kind: 'texture',
 src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO7EAAAAASUVORK5CYII=',
 color: '#ffffff'
 };

 definition.build(registry, {
 id: 'quad-poster',
 colors: {},
 materials: { poster: texture }
 }, node, { width: 1, depth: 0.03, height: 1 });

 const panels = node.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'poster');
 assert.equal(panels.length, 4);
 assert.deepEqual(
 panels.map((mesh) => [mesh.material.diffuseTexture.uOffset, mesh.material.diffuseTexture.vOffset]),
 [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]]
 );
 panels.forEach((mesh) => {
 assert.equal(mesh.material.diffuseTexture.uScale, 0.5);
 assert.equal(mesh.material.diffuseTexture.vScale, 0.5);
 });

 scene.dispose();
 engine.dispose();
});

test('L ', () => {
 const document = new FloorplanDocument(minimalPlan({
 floors: [
 { id: 'floor_1', name: '1F', level: 0 },
 { id: 'floor_2', name: '2F', level: 1 }
 ],
 floor: {
 rooms: [
 { id: 'room_upper', floorId: 'floor_2', shape: 'square', x: 0, z: 0, width: 10, depth: 10 }
 ]
 },
 stairs: [{
 id: 'stairs_l', floorId: 'floor_1', subtype: 'lshape', x: 0, z: 0, width: 1,
 depth: 3, height: 3, steps: 10, cornerStep: 4,
 runBeforeCorner: 2.0, runAfterCorner: 1.5, mirrored: false
 }]
 }));

 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const renderer = new BabylonSceneRenderer(scene, document);

 const room = document.floorplan.floor.rooms[0];
 const holes = renderer.getStairFloorHoles(room);

 assert.equal(holes.length, 2, 'L 2 （ ）');
 // 1 X [-0.5, 0.5] （ ）
 const h1 = holes.find((h) => Math.abs(h.left - (-0.5)) < 0.01 && Math.abs(h.right - 0.5) < 0.01);
 assert.ok(h1, ' X ');
 // 2 X [0.5, 2.0]（ runAfterCorner = 1.5）
 const h2 = holes.find((h) => Math.abs(h.left - 0.5) < 0.01 && Math.abs(h.right - 2.0) < 0.01);
 assert.ok(h2, ' X ');

 scene.dispose();
 engine.dispose();
});

