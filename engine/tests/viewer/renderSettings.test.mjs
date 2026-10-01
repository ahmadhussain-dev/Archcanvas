import assert from 'node:assert/strict';
import test from 'node:test';
import { DirectionalLight, Scene, ShadowGenerator, Vector3 } from '../../src/index.js';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Viewer3D } from '../../example/js/Viewer3D.js';

test('Viewer3D: 、 API ', () => {
 const dummyEngine = new NullEngine();
 const dummyScene = new Scene(dummyEngine);

 const viewer = Object.create(Viewer3D.prototype);
 viewer.engine = dummyEngine;
 viewer.scene = dummyScene;

 // 1. 
 viewer.setGraphicsPreset('ultra');
 assert.equal(viewer.graphicsPreset, 'ultra');
 assert.ok(dummyEngine.getHardwareScalingLevel() > 0);

 viewer.setGraphicsPreset('low');
 assert.equal(viewer.graphicsPreset, 'low');

 // 2. 
 viewer.setReflectionQuality('medium');
 assert.equal(viewer.reflectionQuality, 'medium');

 viewer.setReflectionQuality('ultra');
 assert.equal(viewer.reflectionQuality, 'ultra');

 viewer.setReflectionQuality('low');
 assert.equal(viewer.reflectionQuality, 'low');

 // 3. （ shadowGenerator ）
 viewer.sun = new DirectionalLight('sun', new Vector3(-0.4, -1, -0.5), dummyScene);
 viewer.shadowGenerator = new ShadowGenerator(512, viewer.sun);

 viewer.setShadowQuality('high');
 assert.equal(viewer.shadowQuality, 'high');
 assert.ok(viewer.shadowGenerator instanceof ShadowGenerator);

 viewer.setShadowQuality('medium');
 assert.equal(viewer.shadowQuality, 'medium');
 assert.ok(viewer.shadowGenerator instanceof ShadowGenerator);

 viewer.setShadowQuality('off');
 assert.equal(viewer.shadowQuality, 'off');
});


