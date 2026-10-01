import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getFurnitureDefinition } from '../../src/furniture/index.js';
import { snapToGridSegmentCenter } from '../../src/editor/Topology.js';

test(' ', async (t) => {
 await t.test(' Furniture 0 ', () => {
 const curtainDef = getFurnitureDefinition('double_sheer_curtain');
 const singleCurtainDef = getFurnitureDefinition('single_blackout_curtain');

 assert.equal(curtainDef.placeType, 'wall');
 assert.equal(singleCurtainDef.placeType, 'wall');

 const doc = new FloorplanDocument({
 unit: 'm',
 floors: [{ id: 'floor_1', level: 0 }],
 currentFloorId: 'floor_1',
 rooms: [],
 items: []
 });

 const curtain = doc.addItem({
 type: 'double_sheer_curtain',
 x: 0,
 z: 0,
 elevation: 0
 });

 assert.equal(curtain.elevation, 0);
 });

 await t.test('snapToGridSegmentCenter ', () => {
 const snapEnabled = true;
 const snapSize = 0.5;

 // (1.12, 2.38)
 const rawPoint = { x: 1.12, z: 2.38 };
 const snapped = snapToGridSegmentCenter(rawPoint, snapEnabled, snapSize);

 // snapToGridSegmentCenter 
 assert.equal(snapped.x % 0.25 === 0 || snapped.x % 0.5 === 0, true);
 assert.equal(snapped.z % 0.25 === 0 || snapped.z % 0.5 === 0, true);
 });
});
