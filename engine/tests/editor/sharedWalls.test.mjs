import assert from 'node:assert/strict';
import test from 'node:test';
import '../../src/furniture/index.js';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { BRICK_THICKNESS, roomClearBox, rebuildAllSharedWalls } from '../../src/domain/roomWalls.js';
import { applyAiOperations } from '../../src/ai/applyAiPlan.js';
import { footprint, isFloorObstacle } from '../../src/ai/layout.js';

const FT = 0.3048;
const OUT = BRICK_THICKNESS.double;
const IN = BRICK_THICKNESS.single;
const close = (a, b, eps = 1e-3) => Math.abs(a - b) < eps;

function base(extra = {}) {
  return {
    unit: 'm', wallHeight: 3, wallThickness: 0.23, floorHeight: 0.15,
    floors: [{ id: 'floor_1', name: 'Ground', level: 0 }], currentFloorId: 'floor_1',
    floor: { rooms: [] }, walls: [], openings: [], items: [],
    wallModel: 'shared',
    ...extra
  };
}

const plan = (extra) => new FloorplanDocument(base(extra));
const room = (doc, id, minX, minZ, width, depth) => doc.addRoom({ id, name: id, x: minX + width / 2, z: minZ + depth / 2, width, depth, shape: 'square', floorId: 'floor_1' });
const wallsOf = (doc, kind) => doc.floorplan.walls.filter((w) => !kind || w.kind === kind);
const box = (wall) => {
  const t = wall.thickness;
  const horizontal = Math.abs(wall.to[1] - wall.from[1]) < Math.abs(wall.to[0] - wall.from[0]);
  const xs = [wall.from[0], wall.to[0]];
  const zs = [wall.from[1], wall.to[1]];
  return horizontal
    ? { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: zs[0] - t / 2, maxZ: zs[0] + t / 2 }
    : { minX: xs[0] - t / 2, maxX: xs[0] + t / 2, minZ: Math.min(...zs), maxZ: Math.max(...zs) };
};

test('a 12 x 14 ft room keeps its walls inside its size', () => {
  const doc = plan();
  room(doc, 'bed', 0, 0, 12 * FT, 14 * FT);
  const walls = wallsOf(doc);
  assert.equal(walls.length, 4);
  for (const wall of walls) {
    assert.equal(wall.kind, 'outside');
    assert.ok(close(wall.thickness, OUT, 1e-4), 'outside walls are double brick');
    const b = box(wall);
    assert.ok(b.minX >= -1e-3 && b.maxX <= 12 * FT + 1e-3 && b.minZ >= -1e-3 && b.maxZ <= 14 * FT + 1e-3, 'the wall stays inside the room');
  }
  const clear = roomClearBox(doc.floorplan, doc.getRoom('bed'));
  assert.ok(close(clear.maxX - clear.minX, 12 * FT - 2 * OUT), 'clear width is the size less two walls');
  assert.ok(close(clear.maxZ - clear.minZ, 14 * FT - 2 * OUT));
});

test('rooms side by side share one wall on the line between them', () => {
  const doc = plan();
  room(doc, 'a', 0, 0, 3, 4);
  room(doc, 'b', 3, 0, 3, 4);
  const inside = wallsOf(doc, 'inside');
  assert.equal(inside.length, 1, 'one wall between the rooms');
  const [shared] = inside;
  assert.ok(close(shared.from[0], 3) && close(shared.to[0], 3), 'centred on the line between them');
  assert.ok(close(shared.thickness, IN, 1e-4), 'inside walls are single brick');
  // It stops at the inner face of the outside walls.
  const zs = [shared.from[1], shared.to[1]].sort((m, n) => m - n);
  assert.ok(close(zs[0], OUT) && close(zs[1], 4 - OUT));
  // Both rooms list it, and nothing else lies along x = 3.
  assert.ok(Object.values(doc.getRoom('a').wallIds).includes(shared.id));
  assert.ok(Object.values(doc.getRoom('b').wallIds).includes(shared.id));
  assert.equal(wallsOf(doc).filter((w) => Math.abs(w.from[0] - w.to[0]) < 1e-6 && Math.abs(w.from[0] - 3) < 0.3).length, 1);
  // Outside walls meet at the corners: 6 outside walls (top and bottom split per room).
  assert.equal(wallsOf(doc, 'outside').length, 6);
  const clearA = roomClearBox(doc.floorplan, doc.getRoom('a'));
  assert.ok(close(clearA.maxX - clearA.minX, 3 - OUT - IN / 2));
});

test('an L-shaped house gets a clean inner corner', () => {
  const doc = plan();
  room(doc, 'lounge', 0, 0, 10, 10);
  room(doc, 'porch', 5, -5, 5, 5);
  const outside = wallsOf(doc, 'outside');
  // The lounge's front wall and the porch's side wall meet just inside the corner at (5, 0).
  const front = outside.find((w) => close(w.from[1], OUT / 2) && close(w.to[1], OUT / 2) && Math.min(w.from[0], w.to[0]) < 1);
  const side = outside.find((w) => close(w.from[0], 5 + OUT / 2) && close(w.to[0], 5 + OUT / 2));
  assert.ok(front && side);
  assert.ok(close(Math.max(front.from[0], front.to[0]), 5 + OUT / 2));
  assert.ok(close(Math.max(side.from[1], side.to[1]), OUT / 2));
  const between = wallsOf(doc, 'inside');
  assert.equal(between.length, 1);
  assert.ok(close(Math.min(between[0].from[0], between[0].to[0]), 5 + OUT), 'stops at the side wall face');
});

test('rebuilding again changes nothing', () => {
  const doc = plan();
  room(doc, 'a', 0, 0, 3, 4);
  room(doc, 'b', 3, 0, 3, 4);
  room(doc, 'c', 0, 4, 6, 3);
  doc.addOpening({ wallId: wallsOf(doc, 'inside')[0].id, type: 'door', t: 0.5 });
  const before = JSON.parse(JSON.stringify(doc.floorplan));
  rebuildAllSharedWalls(doc.floorplan);
  assert.deepEqual(JSON.parse(JSON.stringify(doc.floorplan)), before);
});

test('an older plan with a wall per room is brought up to date, keeping its doors and paint', () => {
  // Two rooms drawn the old way: each with its own four walls, a double wall between them.
  const legacy = new FloorplanDocument(base({ wallModel: undefined }));
  legacy.addRoom({ id: 'a', x: 1.5, z: 2, width: 3, depth: 4, shape: 'square', floorId: 'floor_1' });
  legacy.addRoom({ id: 'b', x: 4.6, z: 2, width: 3, depth: 4, shape: 'square', floorId: 'floor_1' });
  const own = legacy.floorplan.walls.find((w) => w.roomId === 'a' && close(w.from[0], 3) && close(w.to[0], 3));
  legacy.updateWall(own.id, { frontColor: '#123456' });
  legacy.addOpening({ wallId: own.id, type: 'door', t: 0.5 });
  const saved = JSON.parse(JSON.stringify(legacy.floorplan));
  saved.wallModel = 'shared';
  // Line the rooms up first: b sits 0.1 m off, so it only shares once lined up.
  const doc = new FloorplanDocument(saved);
  assert.equal(doc.floorplan.openings.length, 1, 'the door is kept');
  doc.lineUpRooms('floor_1', FT, { x: 0, z: 0 });
  const inside = wallsOf(doc, 'inside');
  assert.equal(inside.length, 1, 'one shared wall after lining up');
  const door = doc.floorplan.openings[0];
  assert.equal(door.wallId, inside[0].id, 'the door is on the shared wall');
  assert.ok(wallsOf(doc).every((w) => w.kind), 'every room wall is a shared wall now');
});

test('a door on a wall stays put when its room is resized', () => {
  const doc = plan();
  room(doc, 'a', 0, 0, 4, 4);
  room(doc, 'b', 4, 0, 4, 4);
  const shared = wallsOf(doc, 'inside')[0];
  doc.addOpening({ wallId: shared.id, type: 'door', t: 0.3 });
  const at = () => {
    const opening = doc.floorplan.openings[0];
    const wall = doc.getWall(opening.wallId);
    return [wall.from[0] + (wall.to[0] - wall.from[0]) * opening.t, wall.from[1] + (wall.to[1] - wall.from[1]) * opening.t];
  };
  const [x0, z0] = at();
  doc.updateRoom('a', { depth: 5, z: 2.5 });
  const [x1, z1] = at();
  assert.ok(close(x0, x1) && close(z0, z1), 'same spot after the rebuild');
});

test('dragging a shared wall resizes both rooms', () => {
  const doc = plan();
  room(doc, 'a', 0, 0, 4, 4);
  room(doc, 'b', 4, 0, 4, 4);
  const shared = wallsOf(doc, 'inside')[0];
  const moved = doc.moveWall(shared.id, 0.5, 0);
  assert.ok(close(doc.getRoom('a').width, 4.5) && close(doc.getRoom('b').width, 3.5));
  assert.ok(moved && close(moved.from[0], 4.5), 'returns the wall on the new line');
  // An outside wall moves its room's edge.
  const right = wallsOf(doc, 'outside').find((w) => close(w.from[0], 8 - OUT / 2) && close(w.to[0], 8 - OUT / 2));
  doc.moveWall(right.id, 1, 0);
  assert.ok(close(doc.getRoom('b').width, 4.5));
});

test('outside walls can be single brick, for the plan or one wall', () => {
  const doc = plan();
  room(doc, 'a', 0, 0, 4, 4);
  room(doc, 'b', 4, 0, 4, 4);
  doc.setRoomWallThickness({ outside: BRICK_THICKNESS.single });
  assert.ok(wallsOf(doc, 'outside').every((w) => close(w.thickness, IN, 1e-4)));
  doc.setRoomWallThickness({ outside: BRICK_THICKNESS.double });
  const front = wallsOf(doc, 'outside').find((w) => Object.values(doc.getRoom('a').wallIds).includes(w.id) && close(w.from[1], OUT / 2));
  doc.updateWall(front.id, { brick: 'single' });
  const after = doc.getWall(front.id);
  assert.ok(close(after.thickness, IN, 1e-4) && close(after.from[1], IN / 2), 'single brick, still inside the room');
  doc.updateRoom('a', { width: 5, x: 2.5 });
  assert.ok(wallsOf(doc).some((w) => w.brick === 'single' && close(w.thickness, IN, 1e-4)), 'kept after a rebuild');
});

test('deleting a room turns the shared wall into the neighbour\'s outside wall', () => {
  const doc = plan();
  room(doc, 'a', 0, 0, 4, 4);
  room(doc, 'b', 4, 0, 4, 4);
  doc.addOpening({ wallId: wallsOf(doc, 'inside')[0].id, type: 'door', t: 0.5 });
  doc.deleteRoom('a');
  assert.equal(wallsOf(doc, 'inside').length, 0);
  assert.equal(wallsOf(doc, 'outside').length, 4);
  const door = doc.floorplan.openings[0];
  assert.ok(door && doc.getWall(door.wallId)?.kind === 'outside', 'the door moves onto the outside wall');
});

test('the plot wall sits inside the plot and gives way to a house wall on the plot line', () => {
  const doc = plan();
  doc.addRoom({ id: 'plot', name: 'Plot', x: 5, z: 5, width: 10, depth: 10, shape: 'square', floorId: 'floor_1' });
  assert.equal(Object.values(doc.getRoom('plot').wallIds).length, 4);
  room(doc, 'a', 0, 0, 4, 4);
  const plotWalls = Object.values(doc.getRoom('plot').wallIds).map((id) => doc.getWall(id));
  assert.ok(plotWalls.every((w) => w.kind === 'plot'));
  // The room stands in the plot's corner: the plot walls there start where the room ends.
  const front = plotWalls.find((w) => close(w.from[1], 0.115, 0.01) && close(w.to[1], 0.115, 0.01));
  assert.ok(front && close(Math.min(front.from[0], front.to[0]), 4), 'front plot wall starts at the room');
  for (const w of plotWalls) {
    const b = box(w);
    assert.ok(b.minX >= -1e-3 && b.maxX <= 10 + 1e-3 && b.minZ >= -1e-3 && b.maxZ <= 10 + 1e-3, 'inside the plot');
  }
});

test('drawn walls and turned rooms keep their own walls', () => {
  const doc = plan();
  const loose = doc.addWall([20, 0], [22, 0]);
  room(doc, 'a', 0, 0, 4, 4);
  doc.addRoom({ id: 't', x: 15, z: 15, width: 3, depth: 3, rotation: 0.5, shape: 'square', floorId: 'floor_1' });
  assert.ok(doc.getWall(loose.id), 'a drawn wall stays');
  assert.equal(Object.values(doc.getRoom('t').wallIds).length, 4, 'the turned room has its own four walls');
  assert.ok(Object.values(doc.getRoom('t').wallIds).every((id) => !doc.getWall(id).kind));
});

test('Ask ArchCanvas rooms share walls and furniture stays clear of them', () => {
  const doc = plan();
  const ops = [
    { op: 'add_room', id: 'k', name: 'Kitchen', x: 1.5, z: 2, width: 3, depth: 4 },
    { op: 'add_room', id: 'l', name: 'Lounge', x: 5, z: 2, width: 4, depth: 4 },
    { op: 'add_opening', room: 'k', kind: 'door', side: 'right' },
    { op: 'add_opening', room: 'k', kind: 'window', side: 'left' },
    { op: 'furnish_room', room: 'k' },
    { op: 'furnish_room', room: 'l' }
  ];
  const { floorplan, skipped } = applyAiOperations(doc.floorplan, ops);
  assert.deepEqual(skipped.filter((s) => !/fit/i.test(s.reason || '')), []);
  assert.equal(floorplan.walls.filter((w) => w.kind === 'inside').length, 1);
  const door = floorplan.openings.find((o) => o.type === 'door');
  assert.equal(floorplan.walls.find((w) => w.id === door.wallId).kind, 'inside', 'the door is in the shared wall');
  for (const id of ['k', 'l']) {
    const r = floorplan.floor.rooms.find((x) => x.id === id);
    const clear = roomClearBox(floorplan, r);
    for (const item of floorplan.items.filter((i) => i.roomId === id && isFloorObstacle(i))) {
      const b = footprint(item);
      assert.ok(b.minX >= clear.minX - 1e-3 && b.maxX <= clear.maxX + 1e-3 && b.minZ >= clear.minZ - 1e-3 && b.maxZ <= clear.maxZ + 1e-3, `${item.type} stays off the walls in ${r.name}`);
    }
  }
  assert.ok(floorplan.items.some((i) => i.roomId === 'k'), 'the kitchen is furnished');
});
