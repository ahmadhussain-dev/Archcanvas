import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapToGridSegmentCenter } from '../../src/editor/Topology.js';
import { rotatePoint } from '../../src/core/exporterUtils.js';

test('V4-24: Furniture Rotate ', () => {
 // 1. 
 const snapped = snapToGridSegmentCenter(1.23, 0.5);
 assert.equal(typeof snapped, 'number');

 // 2. 45°, 90°, 180° Rotate Rotate 
 const p1 = rotatePoint(1, 0, Math.PI / 2);
 assert.ok(Math.abs(p1.x) < 1e-6);
 assert.ok(Math.abs(p1.z - 1) < 1e-6);
});
