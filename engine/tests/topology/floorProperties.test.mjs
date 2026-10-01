import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { BabylonSceneRenderer } from '../../src/index.js';
import { Blueprint3DTestMap } from '../../src/presets/blueprintTestMap.js';

test(' ： ， ', async () => {
 const engine = new BABYLON.NullEngine();
 const scene = new BABYLON.Scene(engine);

 // 1. Floorplan ， 
 const mockPlan = {
 unit: 'm',
 currentFloorId: 'first_floor',
 floors: [
 { id: 'first_floor', name: 'First Floor', level: 0, wallHeight: 3.0, floorHeight: 0.1, hideRoof: false, hideWall: false }
 ],
 floor: { rooms: [] },
 walls: [
 { id: 'wall_1', floorId: 'first_floor', from: [0.0, 0.0], to: [4.0, 0.0], color: '#e0e0e0' }
 ],
 openings: [],
 items: [],
 roofs: [
 { id: 'roof_1', floorId: 'first_floor', x: 2.0, z: 0.0, width: 4, depth: 4, height: 1.5, type: 'gable' }
 ]
 };

 const map = new Blueprint3DTestMap(scene);
 map.loadBuildingFile(mockPlan);

 // ， executeWhenReady 
 await scene.whenReadyAsync();

 // ： ， 
 const wallGroup = scene.getTransformNodeByName('wall_group_wall_1');
 const roofGroup = scene.getTransformNodeByName('roof_roof_1');

 assert.ok(wallGroup, ' ');
 assert.ok(roofGroup, ' ');

 // ， profiled wall mesh
 const wallMesh = scene.meshes.find(m => m.name.startsWith('wall_profiled_result_wall_1_') || m.name.startsWith('wall_sub_wall_1_'));
 assert.ok(wallMesh, ' Mesh ');
 let wallHeightBefore = wallMesh.getBoundingInfo().maximum.y - wallMesh.getBoundingInfo().minimum.y;
 assert.ok(wallHeightBefore > 2.0, ' 2.0 ');

 // 2. 
 map.changeFloorHideSettings('first_floor', true, true);
 await scene.whenReadyAsync();

 // 
 const roofGroupAfter = scene.getTransformNodeByName('roof_roof_1');
 assert.equal(roofGroupAfter, null, ' ， TransformNode');

 // 0.2 
 const wallMeshAfter = scene.meshes.find(m => m.name.startsWith('wall_profiled_result_wall_1_') || m.name.startsWith('wall_sub_wall_1_'));
 assert.ok(wallMeshAfter, ' Mesh ');
 const wallHeightAfter = wallMeshAfter.getBoundingInfo().maximum.y - wallMeshAfter.getBoundingInfo().minimum.y;
 assert.ok(wallHeightAfter < 0.35, ' ， （0.2 ） ');

 // 3. 4.5 ， / 
 map.changeFloorHideSettings('first_floor', false, false);
 map.changeFloorHeight('first_floor', 4.5);
 await scene.whenReadyAsync();

 // 
 const roofGroupRebuilt = scene.getTransformNodeByName('roof_roof_1');
 assert.ok(roofGroupRebuilt, ' ， ');

 // 4.5 
 const wallMesh45 = scene.meshes.find(m => m.name.startsWith('wall_profiled_result_wall_1_') || m.name.startsWith('wall_sub_wall_1_'));
 assert.ok(wallMesh45, ' Mesh ');
 const wallHeight45 = wallMesh45.getBoundingInfo().maximum.y - wallMesh45.getBoundingInfo().minimum.y;
 assert.ok(wallHeight45 > 4.0, ' 4.0 ');

 // 4. 
 map.changeFloorDefaultFloorHeight('first_floor', 0.25);
 assert.equal(map.getFloor('first_floor').floorHeight, 0.25, ' ');

 scene.dispose();
 engine.dispose();
});
