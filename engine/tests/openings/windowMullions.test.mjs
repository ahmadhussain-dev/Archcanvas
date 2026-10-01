import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { buildWindowMullions } from '../../src/openings/geometry.js';

describe(' (Mullions) ', () => {
 it(' Save horizontalBars verticalBars ', () => {
 const doc = new FloorplanDocument({
 walls: [
 { id: 'w1', from: [0, 0], to: [5, 0] }
 ],
 openings: [
 {
 id: 'win1', type: 'window', wallId: 'w1', t: 0.5, width: 1.2, height: 1.5,
 horizontalBars: 2, verticalBars: 3, concentricBars: 2, radialBars: 5
 },
 {
 id: 'door1', type: 'door', wallId: 'w1', t: 0.25, width: 0.9, height: 2.05,
 horizontalBars: 1.9, verticalBars: -2, concentricBars: 2.8, radialBars: 7.2
 }
 ]
 });

 const win1 = doc.getOpening('win1');
 assert.equal(win1.horizontalBars, 2);
 assert.equal(win1.verticalBars, 3);
 assert.equal(win1.concentricBars, 2);
 assert.equal(win1.radialBars, 5);
 const door1 = doc.getOpening('door1');
 assert.equal(door1.horizontalBars, 1);
 assert.equal(door1.verticalBars, 0);
 assert.equal(door1.concentricBars, 2);
 assert.equal(door1.radialBars, 7);

 doc.updateOpening('win1', {
 horizontalBars: 4,
 verticalBars: 1,
 concentricBars: 3,
 radialBars: 9,
 frameHidden: true
 });
 assert.equal(win1.horizontalBars, 4);
 assert.equal(win1.verticalBars, 1);
 assert.equal(win1.concentricBars, 3);
 assert.equal(win1.radialBars, 9);
 assert.equal(win1.frameHidden, true);

 doc.updateOpeningMaterial('win1', 'mullion', '#ff0000');
 assert.equal(win1.mullionMaterial.color, '#ff0000');

 const copyData = JSON.parse(JSON.stringify(win1));
 delete copyData.id;
 delete copyData.wallId;
 const win2 = doc.addOpening('w1', 'window', 0.8);
 doc.updateOpening(win2.id, copyData);
 assert.equal(win2.horizontalBars, 4);
 assert.equal(win2.verticalBars, 1);
 assert.equal(win2.concentricBars, 3);
 assert.equal(win2.radialBars, 9);
 assert.equal(win2.frameHidden, true);
 assert.equal(win2.mullionMaterial.color, '#ff0000');
 });

 it(' buildWindowMullions 3D ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const createdMeshes = [];
 const registry = {
 scene,
 materials: { trim: null },
 add(mesh) {
 createdMeshes.push(mesh);
 return mesh;
 }
 };

 const opening = {
 id: 'test_win',
 type: 'window',
 shape: 'square',
 width: 1.2,
 height: 1.0,
 horizontalBars: 2,
 verticalBars: 2
 };

 const parent = new BABYLON.TransformNode('parent', scene);
 buildWindowMullions(registry, opening, parent, { frameW: 0.04 });

 const hbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'hbar');
 const vbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'vbar');

 assert.equal(hbars.length, 2, ' 2 ');
 assert.equal(vbars.length, 2, ' 2 ');

 engine.dispose();
 });

 it(' （round-arch） ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const createdMeshes = [];
 const registry = {
 scene,
 materials: { trim: null },
 add(mesh) {
 createdMeshes.push(mesh);
 return mesh;
 }
 };

 const opening = {
 id: 'arch_win',
 type: 'window',
 shape: 'round-arch',
 width: 1.2,
 height: 1.5,
 horizontalBars: 1,
 verticalBars: 2
 };

 const parent = new BABYLON.TransformNode('parent', scene);
 buildWindowMullions(registry, opening, parent, { frameW: 0.04 });

 const hbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'hbar');
 const vbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'vbar');

 assert.equal(hbars.length, 1);
 assert.equal(vbars.length, 2);

 engine.dispose();
 });

 it(' ， ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const createdMeshes = [];
 const registry = {
 scene,
 materials: { trim: null },
 add(mesh, options = {}) {
 if (options.parent) mesh.parent = options.parent;
 createdMeshes.push(mesh);
 return mesh;
 }
 };
 const opening = {
 id: 'sunburst_window',
 type: 'window',
 shape: 'square',
 width: 2,
 height: 2,
 concentricBars: 2,
 radialBars: 8
 };

 buildWindowMullions(registry, opening, new BABYLON.TransformNode('parent', scene), { frameW: 0.05 });

 const concentric = createdMeshes.filter((mesh) => mesh.metadata?.blueprintOpeningComponentId === 'cbar');
 const radial = createdMeshes.filter((mesh) => mesh.metadata?.blueprintOpeningComponentId === 'rbar');
 assert.equal(concentric.length, 8, 'Square ');
 assert.equal(radial.length, 8);
 assert.ok(radial.every((mesh) => Math.hypot(mesh.position.x, mesh.position.y) > 0.2), ' ');

 engine.dispose();
 });

 it(' ', () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const createdMeshes = [];
 const registry = {
 scene,
 materials: { trim: null },
 add(mesh, options = {}) {
 if (options.parent) mesh.parent = options.parent;
 createdMeshes.push(mesh);
 return mesh;
 }
 };

 buildWindowMullions(registry, {
 id: 'connected_sunburst',
 type: 'window',
 shape: 'square',
 width: 2,
 height: 2,
 concentricBars: 0,
 radialBars: 8
 }, new BABYLON.TransformNode('parent', scene), { frameW: 0.05 });

 const radial = createdMeshes.filter((mesh) => mesh.metadata?.blueprintOpeningComponentId === 'rbar');
 assert.equal(radial.length, 8);
 assert.ok(radial.every((mesh) => {
 const halfLength = mesh.getBoundingInfo().boundingBox.extendSize.x;
 const startX = mesh.position.x - Math.cos(mesh.rotation.z) * halfLength;
 const startY = mesh.position.y - Math.sin(mesh.rotation.z) * halfLength;
 return Math.hypot(startX, startY) < 1e-6;
 }), ' ');

 engine.dispose();
 });

 it('Semicircle、Sector Triangle ', () => {
 const cases = [
 { shape: 'semicircle', width: 2, height: 1, concentricSegments: 16, center: { x: 0, y: -0.5 } },
 { shape: 'quarter-sector', width: 2, height: 2, concentricSegments: 12, center: { x: -1, y: -1 } },
 { shape: 'right-triangle', width: 2, height: 2, concentricSegments: 1, center: { x: -1, y: -1 } }
 ];

 cases.forEach(({ shape, width, height, concentricSegments, center }) => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);
 const createdMeshes = [];
 const registry = {
 scene,
 materials: { trim: null },
 add(mesh, options = {}) {
 if (options.parent) mesh.parent = options.parent;
 createdMeshes.push(mesh);
 return mesh;
 }
 };

 buildWindowMullions(registry, {
 id: `radial_${shape}`,
 type: 'window',
 shape,
 width,
 height,
 concentricBars: 1,
 radialBars: 5
 }, new BABYLON.TransformNode('parent', scene), { frameW: 0.05 });

 const concentric = createdMeshes.filter((mesh) => mesh.metadata?.blueprintOpeningComponentId === 'cbar');
 const radial = createdMeshes.filter((mesh) => mesh.metadata?.blueprintOpeningComponentId === 'rbar');
 assert.equal(concentric.length, concentricSegments, `${shape} `);
 assert.equal(radial.length, 5);
 assert.ok(radial.every((mesh) => {
 const halfLength = mesh.getBoundingInfo().boundingBox.extendSize.x;
 const lineStartX = mesh.position.x - Math.cos(mesh.rotation.z) * halfLength;
 const lineStartY = mesh.position.y - Math.sin(mesh.rotation.z) * halfLength;
 const directionX = Math.cos(mesh.rotation.z);
 const directionY = Math.sin(mesh.rotation.z);
 return Math.abs((center.x - lineStartX) * directionY - (center.y - lineStartY) * directionX) < 1e-6;
 }), `${shape} `);

 engine.dispose();
 });
 });
});
