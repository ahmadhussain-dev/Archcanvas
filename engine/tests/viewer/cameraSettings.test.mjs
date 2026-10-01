import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { Viewer3D } from '../../example/js/Viewer3D.js';
import { updateFirstPersonConfig } from '../../example/js/FirstPersonController.js';
import { set2DPanSpeed, pan2DSpeed } from '../../example/js/SvgEvents.js';

test('Viewer3D: 3D 、Rotate FOV ', () => {
 const canvas = {
 addEventListener: () => {},
 removeEventListener: () => {},
 getBoundingClientRect: () => ({ width: 800, height: 600 }),
 style: {}
 };
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 // Mock Viewer3D
 const mockViewer = {
 scene,
 camera: new BABYLON.ArcRotateCamera('testCam', 0, 0, 10, BABYLON.Vector3.Zero(), scene)
 };

 // 
 Viewer3D.prototype.set3DPanSpeed.call(mockViewer, 2.0);
 assert.equal(mockViewer.camera.panningSensibility, 600, ' 2.0x panningSensibility 600');

 Viewer3D.prototype.set3DPanSpeed.call(mockViewer, 0.5);
 assert.equal(mockViewer.camera.panningSensibility, 2400, ' 0.5x panningSensibility 2400');

 Viewer3D.prototype.set3DRotateSpeed.call(mockViewer, 2.0);
 assert.equal(mockViewer.camera.angularSensibilityX, 1250, 'Rotate 2.0x angularSensibilityX 1250');
 assert.equal(mockViewer.camera.angularSensibilityY, 1250, 'Rotate 2.0x angularSensibilityY 1250');

 Viewer3D.prototype.setCameraFOV.call(mockViewer, 90);
 assert.equal(Math.round((mockViewer.camera.fov * 180) / Math.PI), 90, ' 90°');

 engine.dispose();
});

test('SvgEvents & FirstPersonController: 2D ', () => {
 set2DPanSpeed(1.5);
 assert.equal(pan2DSpeed, 1.5, '2D 1.5');

 set2DPanSpeed(0.8);
 assert.equal(pan2DSpeed, 0.8, '2D 0.8');

 // 
 assert.doesNotThrow(() => {
 updateFirstPersonConfig({
 moveSpeedScale: 1.2,
 lookSensitivityScale: 1.5,
 fovDeg: 80
 });
 });
});
