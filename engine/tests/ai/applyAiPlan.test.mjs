import assert from 'node:assert/strict';
import test from 'node:test';
import '../../src/furniture/index.js';
import { applyAiOperations } from '../../src/ai/applyAiPlan.js';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';

// A 25 x 45 ft plot (7.62 x 13.716 m) centred on the origin, like a new ArchCanvas project.
function plotPlan() {
  const doc = new FloorplanDocument({
    unit: 'm',
    wallThickness: 0.23,
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    floors: [{ id: 'floor_1', name: 'Ground', level: 0, wallHeight: 3.2, floorHeight: 0.15 }],
    currentFloorId: 'floor_1'
  });
  doc.addRoom({ id: 'plot', name: 'Plot', x: 0, z: 0, width: 7.62, depth: 13.716, shape: 'square', floorId: 'floor_1' });
  return doc.floorplan;
}

const bedroom = { op: 'add_room', id: 'room_ai_1', name: 'Bedroom', x: -1.981, z: 4.808, width: 3.658, depth: 4.1, label: 'Add Bedroom' };

test('adds a room with its four walls', () => {
  const { floorplan, applied, skipped } = applyAiOperations(plotPlan(), [bedroom]);
  assert.deepEqual(skipped, []);
  assert.equal(applied[0].label, 'Add Bedroom');
  const room = floorplan.floor.rooms.find((r) => r.id === 'room_ai_1');
  assert.equal(room.name, 'Bedroom');
  assert.equal(Object.keys(room.wallIds).length, 4);
});

test('does not change the floorplan it was given', () => {
  const plan = plotPlan();
  const before = JSON.stringify(plan);
  applyAiOperations(plan, [bedroom]);
  assert.equal(JSON.stringify(plan), before);
});

test('paints only the inside faces of the room walls', () => {
  const { floorplan } = applyAiOperations(plotPlan(), [bedroom, { op: 'paint_walls', room: 'Bedroom', color: '#8BA3B5' }]);
  const room = floorplan.floor.rooms.find((r) => r.id === 'room_ai_1');
  const walls = Object.values(room.wallIds).map((id) => floorplan.walls.find((w) => w.id === id));
  for (const wall of walls) {
    const painted = [wall.colorFront, wall.colorBack].filter((c) => c === '#8ba3b5');
    assert.equal(painted.length, 1, `wall ${wall.id} painted on one side`);
  }
});

test('places furniture inside the room without overlaps and away from the door', () => {
  const { floorplan, skipped } = applyAiOperations(plotPlan(), [
    bedroom,
    { op: 'add_opening', room: 'room_ai_1', kind: 'door', side: 'bottom' },
    { op: 'add_furniture', room: 'room_ai_1', type: 'bed_double' },
    { op: 'add_furniture', room: 'room_ai_1', type: 'wardrobe' },
    { op: 'add_furniture', room: 'room_ai_1', type: 'nightstand', count: 2 }
  ]);
  assert.deepEqual(skipped, []);
  const items = floorplan.items;
  assert.equal(items.length, 4);
  const half = (item) => {
    const quarter = Math.round(item.rotation / (Math.PI / 2)) % 2 !== 0;
    return { w: (quarter ? item.depth : item.width) / 2, d: (quarter ? item.width : item.depth) / 2 };
  };
  const room = { minX: -1.981 - 1.829, maxX: -1.981 + 1.829, minZ: 4.808 - 2.05, maxZ: 4.808 + 2.05 };
  for (const item of items) {
    const { w, d } = half(item);
    assert.ok(item.x - w >= room.minX && item.x + w <= room.maxX, `${item.type} inside in x`);
    assert.ok(item.z - d >= room.minZ && item.z + d <= room.maxZ, `${item.type} inside in z`);
    assert.equal(item.roomId, 'room_ai_1');
  }
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      const sep = Math.abs(a.x - b.x) >= half(a).w + half(b).w - 1e-3 || Math.abs(a.z - b.z) >= half(a).d + half(b).d - 1e-3;
      assert.ok(sep, `${a.type} and ${b.type} do not overlap`);
    }
  }
  // The double bed is placed against a wall with its back to it.
  const bed = items.find((item) => item.type === 'bed_double');
  const gaps = [
    bed.x - half(bed).w - room.minX, room.maxX - bed.x - half(bed).w,
    bed.z - half(bed).d - room.minZ, room.maxZ - bed.z - half(bed).d
  ];
  assert.ok(gaps.some((gap) => gap < 0.2), `bed touches a wall: ${gaps}`);
});

test('reports what does not fit', () => {
  const { skipped } = applyAiOperations(plotPlan(), [
    { op: 'add_room', id: 'room_ai_2', name: 'Store', x: 0, z: 0, width: 1.6, depth: 1.6 },
    { op: 'add_furniture', room: 'room_ai_2', type: 'bed_double', label: 'Add a double bed' }
  ]);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].label, 'Add a double bed');
  assert.match(skipped[0].reason, /no free space/);
});

test('adds a door and a window on the asked sides and keeps them apart', () => {
  const { floorplan, skipped } = applyAiOperations(plotPlan(), [
    bedroom,
    { op: 'add_opening', room: 'room_ai_1', kind: 'door', side: 'bottom' },
    { op: 'add_opening', room: 'room_ai_1', kind: 'window', side: 'bottom' },
    { op: 'add_opening', room: 'room_ai_1', kind: 'window', side: 'left' }
  ]);
  assert.deepEqual(skipped, []);
  const room = floorplan.floor.rooms.find((r) => r.id === 'room_ai_1');
  const wallById = (id) => floorplan.walls.find((w) => w.id === id);
  const [door, window1, window2] = floorplan.openings;
  const bottom = wallById(door.wallId);
  assert.ok(Math.abs(bottom.from[1] - (room.z - room.depth / 2)) < 1e-3 && Math.abs(bottom.to[1] - bottom.from[1]) < 1e-3);
  assert.equal(window1.wallId, door.wallId);
  const length = Math.abs(bottom.to[0] - bottom.from[0]);
  assert.ok(Math.abs(window1.t - door.t) * length >= (0.9 + 1.25) / 2);
  const left = wallById(window2.wallId);
  assert.ok(Math.abs(left.from[0] - (room.x - room.width / 2)) < 1e-3 && Math.abs(left.to[0] - left.from[0]) < 1e-3);
  // The left side is the plot's boundary wall, so the window must land within the bedroom's part of it.
  const z = left.from[1] + (left.to[1] - left.from[1]) * window2.t;
  assert.ok(z - 0.625 >= room.z - room.depth / 2 && z + 0.625 <= room.z + room.depth / 2, `window at z=${z}`);
});

test('sets a catalog floor, renames, resizes and deletes rooms', () => {
  const { floorplan, applied, skipped } = applyAiOperations(plotPlan(), [
    bedroom,
    { op: 'set_floor', room: 'room_ai_1', material: 'wood-plank-oak-light' },
    { op: 'update_room', room: 'room_ai_1', name: 'Master Bedroom', width: 4 },
    { op: 'add_room', id: 'room_ai_2', name: 'Bath', x: 2, z: 5, width: 1.6, depth: 2.2 },
    { op: 'delete_room', room: 'Bath' }
  ]);
  assert.deepEqual(skipped, []);
  assert.equal(applied.length, 5);
  const room = floorplan.floor.rooms.find((r) => r.id === 'room_ai_1');
  assert.equal(room.material.id, 'wood-plank-oak-light');
  assert.equal(room.name, 'Master Bedroom');
  assert.equal(room.width, 4);
  assert.equal(floorplan.floor.rooms.some((r) => r.id === 'room_ai_2'), false);
});

test('never edits the plot boundary as a room', () => {
  const { skipped } = applyAiOperations(plotPlan(), [{ op: 'delete_room', room: 'plot' }]);
  assert.equal(skipped.length, 1);
});
