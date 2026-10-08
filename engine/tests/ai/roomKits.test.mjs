import assert from 'node:assert/strict';
import test from 'node:test';
import '../../src/furniture/index.js';
import { applyAiOperations } from '../../src/ai/applyAiPlan.js';
import { roomKind } from '../../src/ai/roomKits.js';
import { footprint, overlaps, isFloorObstacle } from '../../src/ai/layout.js';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';

// One room on an empty floor, with the doors and windows asked for.
function oneRoom(name, width, depth, openings = []) {
  const doc = new FloorplanDocument({
    unit: 'm',
    wallThickness: 0.23,
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    floors: [{ id: 'floor_1', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.15 }],
    currentFloorId: 'floor_1'
  });
  doc.addRoom({ id: 'r', name, x: 0, z: 0, width, depth, shape: 'square', floorId: 'floor_1' });
  const ops = openings.map(([kind, side]) => ({ op: 'add_opening', room: 'r', kind, side }));
  return applyAiOperations(doc.floorplan, ops).floorplan;
}

function furnish(plan, extra = {}) {
  return applyAiOperations(plan, [{ op: 'furnish_room', room: 'r', ...extra }]);
}

const types = (floorplan) => floorplan.items.map((item) => item.type);
const count = (floorplan, type) => types(floorplan).filter((t) => t === type).length;

// Nothing on the floor overlaps, everything is inside the walls.
function assertTidy(floorplan) {
  const room = floorplan.floor.rooms.find((r) => r.id === 'r');
  const floorItems = floorplan.items.filter(isFloorObstacle);
  for (const [i, a] of floorItems.entries()) {
    const box = footprint(a);
    assert.ok(box.minX >= room.x - room.width / 2 && box.maxX <= room.x + room.width / 2, `${a.type} is inside the room`);
    assert.ok(box.minZ >= room.z - room.depth / 2 && box.maxZ <= room.z + room.depth / 2, `${a.type} is inside the room`);
    for (const b of floorItems.slice(i + 1)) assert.ok(!overlaps(box, footprint(b)), `${a.type} and ${b.type} do not overlap`);
  }
}

// Nothing on the floor stands in the 0.9 m in front of a door.
function assertDoorsClear(floorplan) {
  for (const door of floorplan.openings.filter((o) => o.type === 'door')) {
    const wall = floorplan.walls.find((w) => w.id === door.wallId);
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const x = x1 + (x2 - x1) * door.t;
    const z = z1 + (z2 - z1) * door.t;
    const horizontal = Math.abs(z2 - z1) < Math.abs(x2 - x1);
    const zone = horizontal
      ? { minX: x - 0.45, maxX: x + 0.45, minZ: z - 0.85, maxZ: z + 0.85 }
      : { minX: x - 0.85, maxX: x + 0.85, minZ: z - 0.45, maxZ: z + 0.45 };
    for (const item of floorplan.items.filter(isFloorObstacle)) {
      assert.ok(!overlaps(footprint(item), zone), `${item.type} keeps the door clear`);
    }
  }
}

test('names tell the kind of room', () => {
  assert.equal(roomKind('Master Bedroom'), 'bedroom');
  assert.equal(roomKind('Attached Bath'), 'bathroom');
  assert.equal(roomKind('TV Lounge'), 'lounge');
  assert.equal(roomKind('Drawing Room'), 'drawing room');
  assert.equal(roomKind('Kitchen'), 'kitchen');
  assert.equal(roomKind('Car Porch'), 'car porch');
  assert.equal(roomKind('Hall'), null);
});

test('a kitchen gets a sink under the window, a cooking range, a fridge and cabinets', () => {
  const plan = oneRoom('Kitchen', 3, 3.6, [['door', 'right'], ['window', 'left']]);
  const { floorplan, applied, skipped } = furnish(plan);
  assert.deepEqual(skipped, []);
  for (const type of ['sink_kitchen', 'stove', 'fridge', 'cabinet_kitchen', 'microwave', 'range_hood']) {
    assert.ok(count(floorplan, type) >= 1, `has a ${type}`);
  }
  assert.match(applied[0].label, /^Furnish Kitchen \(\d+ items\): kitchen sink, cooking range, fridge/);
  const sink = floorplan.items.find((item) => item.type === 'sink_kitchen');
  assert.ok(sink.x < -1, 'the sink is on the window wall');
  assertTidy(floorplan);
  assertDoorsClear(floorplan);
});

test('a bathroom gets a shower, a commode and a basin, away from the door', () => {
  const plan = oneRoom('Bath', 2.2, 2.6, [['door', 'bottom']]);
  const { floorplan, skipped } = furnish(plan);
  assert.deepEqual(skipped, []);
  for (const type of ['shower_cabin', 'toilet', 'sink_bathroom', 'mirror_bathroom']) assert.equal(count(floorplan, type), 1, `has a ${type}`);
  const shower = floorplan.items.find((item) => item.type === 'shower_cabin');
  assert.ok(shower.z > 0, 'the shower is at the far end from the door');
  assertTidy(floorplan);
  assertDoorsClear(floorplan);
});

test('a bedroom bed faces the door with a side table on each side', () => {
  const plan = oneRoom('Bedroom 1', 4, 4.2, [['door', 'top'], ['window', 'left']]);
  const { floorplan, skipped } = furnish(plan);
  assert.deepEqual(skipped, []);
  const bed = floorplan.items.find((item) => item.type === 'bed_double');
  assert.ok(bed.z < 0 && Math.abs(bed.rotation) < 0.01, 'headboard against the wall opposite the door');
  const tables = floorplan.items.filter((item) => item.type === 'nightstand');
  assert.equal(tables.length, 2);
  assert.ok(tables.some((t) => t.x < bed.x) && tables.some((t) => t.x > bed.x));
  assert.equal(count(floorplan, 'wardrobe') >= 1, true);
  assert.equal(count(floorplan, 'air_conditioner_wall'), 1);
  // Tall pieces never stand in front of the window on the left wall.
  for (const item of floorplan.items.filter((i) => i.type === 'wardrobe' && i.x < -1.5)) {
    assert.ok(Math.abs(item.z) > 0.625 + item.width / 2 - 0.01, 'wardrobe not in front of the window');
  }
  assertTidy(floorplan);
  assertDoorsClear(floorplan);
});

test('a lounge gets a sofa facing the TV with a centre table between', () => {
  const plan = oneRoom('TV Lounge', 5, 4.5, [['door', 'bottom']]);
  const { floorplan, skipped } = furnish(plan);
  assert.deepEqual(skipped, []);
  const sofa = floorplan.items.find((item) => item.type === 'sofa');
  const unit = floorplan.items.find((item) => item.type === 'console');
  const table = floorplan.items.find((item) => item.type === 'coffee_table');
  assert.ok(sofa && unit && table && count(floorplan, 'tv') === 1);
  assert.ok(Math.abs(Math.abs(sofa.rotation - unit.rotation) - Math.PI) < 0.01, 'the sofa faces the TV');
  assert.ok(Math.min(sofa.z, unit.z) < table.z && table.z < Math.max(sofa.z, unit.z), 'the table is between them');
  assertTidy(floorplan);
  assertDoorsClear(floorplan);
});

test('dining, drawing room and car porch get their own sets', () => {
  const dining = furnish(oneRoom('Dining', 3.6, 4.2, [['door', 'bottom']])).floorplan;
  assert.equal(count(dining, 'dining_table_long'), 1);
  assert.equal(count(dining, 'chair'), 6);
  assertTidy(dining);
  const drawing = furnish(oneRoom('Drawing Room', 4.5, 4, [['door', 'right']])).floorplan;
  assert.ok(count(drawing, 'sofa') === 1 && count(drawing, 'display_cabinet') === 1 && count(drawing, 'tv') === 0);
  assertTidy(drawing);
  const porch = furnish(oneRoom('Car Porch', 3.6, 5.5, [['door', 'top']])).floorplan;
  assert.ok(porch.items.every((item) => Math.abs(item.x) > 0.6), 'the middle stays clear for a car');
});

test('furnishing replaces the old furniture but keeps locked pieces', () => {
  const plan = oneRoom('Bedroom', 4, 4, [['door', 'bottom']]);
  plan.items.push(
    { id: 'old', type: 'sofa', x: 0, z: 0, rotation: 0, floorId: 'floor_1', roomId: 'r' },
    { id: 'keep', type: 'plant', x: 1.5, z: 1.5, rotation: 0, floorId: 'floor_1', roomId: 'r', locked: true }
  );
  const { floorplan } = furnish(new FloorplanDocument(plan).floorplan);
  assert.ok(!floorplan.items.some((item) => item.id === 'old'));
  assert.ok(floorplan.items.some((item) => item.id === 'keep'));
  assertTidy(floorplan);
});

test('furniture keeps off the stairs', () => {
  const plan = oneRoom('TV Lounge', 5, 4.5, [['door', 'bottom']]);
  plan.stairs = [{ id: 's', x: -1.9, z: 0.2, width: 1, depth: 3, rotation: 0, floorId: 'floor_1' }];
  const { floorplan } = furnish(new FloorplanDocument(plan).floorplan);
  const stairs = { minX: -2.4, maxX: -1.4, minZ: -1.3, maxZ: 1.7 };
  for (const item of floorplan.items.filter(isFloorObstacle)) assert.ok(!overlaps(footprint(item), stairs), `${item.type} is off the stairs`);
});

test('an unknown kind of room is reported, not guessed', () => {
  const { applied, skipped } = furnish(oneRoom('Hall', 4, 4));
  assert.deepEqual(applied, []);
  assert.match(skipped[0].reason, /does not know what kind of room "Hall" is/);
  const asked = furnish(oneRoom('Hall', 4, 4), { kind: 'drawing room' });
  assert.equal(asked.skipped.length, 0);
  assert.match(asked.applied[0].label, /^Furnish Hall/);
});

test('a door goes where it is asked for', () => {
  const plan = oneRoom('Lounge', 6, 4);
  const { floorplan } = applyAiOperations(plan, [{ op: 'add_opening', room: 'r', kind: 'door', side: 'bottom', at: 2 }]);
  const door = floorplan.openings.find((o) => o.type === 'door');
  const wall = floorplan.walls.find((w) => w.id === door.wallId);
  const x = wall.from[0] + (wall.to[0] - wall.from[0]) * door.t;
  assert.ok(Math.abs(x - 2) < 0.15, `door at x ${x}`);
});

test('a stair hall gets a flight of stairs up from its door', () => {
  const plan = oneRoom('Staircase', 1.4, 4, [['door', 'bottom']]);
  const { floorplan, applied } = furnish(plan);
  assert.equal(floorplan.stairs.length, 1);
  const stairs = floorplan.stairs[0];
  assert.ok(stairs.depth >= 2.5 && stairs.width <= 1.2);
  assert.ok(stairs.z > 0, 'the landing is by the door at the bottom');
  assert.match(applied[0].label, /^Stairs up in Staircase/);
  // Asking again does not add a second flight.
  assert.equal(furnish(floorplan).floorplan.stairs.length, 1);
});

test('a terrace gets planters and a small sitting set', () => {
  const { floorplan } = furnish(oneRoom('Terrace', 3, 4, [['door', 'top']]));
  assert.equal(roomKind('Front Balcony'), 'terrace');
  assert.ok(count(floorplan, 'terracotta_flower_urn') >= 1 && count(floorplan, 'bistro_table') === 1);
  assertTidy(floorplan);
});
