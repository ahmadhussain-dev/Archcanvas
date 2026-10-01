import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { createDocument } from '../../src/editor/EditorFacade.js';
import { createBlueprintMaterial } from '../../src/index.js';

test(' Undo ， descriptors ', () => {
 const document = createDocument();
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 try {
 // 1. 
 const initialSky = { kind: 'color', color: '#112233' };
 const initialGround = { kind: 'glass', color: '#88ccff', alpha: 0.35 };

 document.setEnvironmentMaterial('sky', initialSky);
 document.setEnvironmentMaterial('ground', initialGround);

 const snapshotA = document.createSnapshot();
 assert.equal(snapshotA.environment.skyMaterial.color, '#112233');
 assert.equal(snapshotA.environment.groundMaterial.alpha, 0.35);

 // Viewer3D A 
 let groundMaterial = createBlueprintMaterial(
 scene,
 'grassLawnMat',
 snapshotA.environment.groundMaterial,
 { isFloor: true, isEnvironmentGround: true }
 );
 assert.equal(groundMaterial.alpha, 0.35);

 // 2. B
 const updatedSky = { kind: 'color', color: '#ff9900' };
 const updatedGround = { kind: 'color', color: '#00ffaa', alpha: 0.8 };

 document.setEnvironmentMaterial('sky', updatedSky);
 document.setEnvironmentMaterial('ground', updatedGround);

 const snapshotB = document.createSnapshot();
 assert.equal(snapshotB.environment.skyMaterial.color, '#ff9900');
 assert.equal(snapshotB.environment.groundMaterial.alpha, 0.8);

 // 3. Undo / A ( )
 document.restoreSnapshot(snapshotA);

 const restoredSnapshot = document.createSnapshot();
 assert.equal(restoredSnapshot.environment.skyMaterial.color, '#112233', 'Undo Sky A ');
 assert.equal(restoredSnapshot.environment.groundMaterial.alpha, 0.35, 'Undo A alpha ');

 // createBlueprintMaterial 
 if (groundMaterial) groundMaterial.dispose();
 groundMaterial = createBlueprintMaterial(
 scene,
 'grassLawnMat',
 restoredSnapshot.environment.groundMaterial,
 { isFloor: true, isEnvironmentGround: true }
 );
 assert.equal(groundMaterial.alpha, 0.35, ' alpha A ');

 } finally {
 scene.dispose();
 engine.dispose();
 }
});
