import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';

function plan() {
  return new FloorplanDocument({
    unit: 'm', wallHeight: 3, wallThickness: 0.23, floorHeight: 0.15,
    floors: [{ id: 'floor_1', name: 'Ground', level: 0 }], currentFloorId: 'floor_1',
    floor: { rooms: [] }, walls: [], openings: [], items: []
  });
}

const close = (a, b) => Math.abs(a - b) < 1e-6;

test('moving a wall shared by two rooms resizes both rooms', () => {
  const doc = plan();
  // Two 4 x 4 m rooms side by side, sharing the wall at x = 0.
  const left = doc.addRoom({ id: 'left', x: -2, z: 0, width: 4, depth: 4, shape: 'square', floorId: 'floor_1' });
  const right = doc.addRoom({ id: 'right', x: 2, z: 0, width: 4, depth: 4, shape: 'square', floorId: 'floor_1' });
  const shared = doc.floorplan.walls.find((w) => Math.abs(w.from[0]) < 1e-6 && Math.abs(w.to[0]) < 1e-6);
  assert.ok(shared, 'the rooms share one wall');
  doc.moveWall(shared.id, 0.5, 0.3);
  const l = doc.getRoom(left.id);
  const r = doc.getRoom(right.id);
  assert.ok(close(l.width, 4.5) && close(l.x, -1.75), 'left room grows');
  assert.ok(close(r.width, 3.5) && close(r.x, 2.25), 'right room shrinks');
  assert.ok(close(l.depth, 4) && close(r.depth, 4), 'moving along the wall changes nothing');
});

test('a loose wall drags the ends of the walls joined to it', () => {
  const doc = plan();
  const a = doc.addWall([0, 0], [4, 0]);
  const b = doc.addWall([4, 0], [4, 3]);
  const c = doc.addWall([10, 10], [12, 10]);
  doc.moveWall(b.id, 0.25, 0);
  assert.deepEqual(doc.getWall(b.id).from, [4.25, 0]);
  assert.deepEqual(doc.getWall(a.id).to, [4.25, 0], 'the corner stays joined');
  assert.deepEqual(doc.getWall(a.id).from, [0, 0]);
  assert.deepEqual(doc.getWall(c.id).from, [10, 10], 'other walls stay put');
});

test('a room cannot be squeezed below 1 m', () => {
  const doc = plan();
  const room = doc.addRoom({ x: 0, z: 0, width: 1.2, depth: 3, shape: 'square', floorId: 'floor_1' });
  const wall = doc.floorplan.walls.find((w) => close(w.from[0], 0.6) && close(w.to[0], 0.6));
  assert.equal(doc.moveWall(wall.id, -0.5, 0), null);
  assert.ok(close(doc.getRoom(room.id).width, 1.2));
});

test('a shared wall keeps moving both rooms on every step', () => {
  const doc = plan();
  const left = doc.addRoom({ id: 'left', x: -2, z: 0, width: 4, depth: 4, shape: 'square', floorId: 'floor_1' });
  const right = doc.addRoom({ id: 'right', x: 2, z: 0, width: 4, depth: 4, shape: 'square', floorId: 'floor_1' });
  let wall = doc.floorplan.walls.find((w) => Math.abs(w.from[0]) < 1e-6 && Math.abs(w.to[0]) < 1e-6);
  for (let i = 0; i < 3; i += 1) wall = doc.moveWall(wall.id, 0.25, 0);
  assert.ok(close(wall.from[0], 0.75), 'the returned wall sits on the moved line');
  assert.ok(close(doc.getRoom(left.id).width, 4.75), 'left room grew each step');
  assert.ok(close(doc.getRoom(right.id).width, 3.25), 'right room shrank each step');
});
