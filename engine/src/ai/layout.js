// Room geometry shared by the "Ask ArchCanvas" furniture placement: where a
// rectangular room's walls, doors and windows are, what already stands in it,
// and whether a new item fits.
//
// Sides are named as on the 2D plan, where +z is the top: top, bottom, left,
// right. Items face into the room with their back to the wall; an item's
// front is +z at rotation 0.
import { getFurnitureDefinition } from '../domain/FurnitureCatalog.js';
import { pointInRoom } from '../rooms/roomShapes.js';

export const EPS = 1e-3;
// Space kept clear inside a door, in metres.
export const DOOR_CLEARANCE = 0.9;
const WALL_GAP = 0.02;

export const round3 = (value) => Number(Number(value).toFixed(3));

export function rectOf(room) {
  return {
    minX: room.x - room.width / 2,
    maxX: room.x + room.width / 2,
    minZ: room.z - room.depth / 2,
    maxZ: room.z + room.depth / 2
  };
}

/** Which side of the room a wall is on, as seen on the 2D plan (top is +z). */
export function wallSide(room, wall) {
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  if (Math.abs(z2 - z1) < Math.abs(x2 - x1)) return (z1 + z2) / 2 > room.z ? 'top' : 'bottom';
  return (x1 + x2) / 2 > room.x ? 'right' : 'left';
}

export function roomWalls(doc, room) {
  return Object.values(room.wallIds || {}).map((id) => doc.getWall(id)).filter(Boolean);
}

export function itemSize(type) {
  const definition = getFurnitureDefinition(type);
  const divisor = definition.unit === 'm' ? 1 : 39.37;
  return {
    width: Number(definition.defaultSize?.width || 0.5) / divisor,
    depth: Number(definition.defaultSize?.depth || 0.5) / divisor,
    height: Number(definition.defaultSize?.height || 0.5) / divisor
  };
}

export function footprint(item) {
  // Items are turned in quarter turns here, so a 90 degree turn swaps width and depth.
  const quarter = Math.round(((Number(item.rotation) || 0) / (Math.PI / 2))) % 2 !== 0;
  const w = quarter ? item.depth : item.width;
  const d = quarter ? item.width : item.depth;
  return { minX: item.x - w / 2, maxX: item.x + w / 2, minZ: item.z - d / 2, maxZ: item.z + d / 2 };
}

// The box around a turned rectangle (stairs can be at any angle).
function turnedBox(x, z, width, depth, rotation = 0) {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const w = width * c + depth * s;
  const d = width * s + depth * c;
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

export const overlaps = (a, b) => a.minX < b.maxX - EPS && b.minX < a.maxX - EPS && a.minZ < b.maxZ - EPS && b.minZ < a.maxZ - EPS;
export const inside = (a, box) => a.minX >= box.minX - EPS && a.maxX <= box.maxX + EPS && a.minZ >= box.minZ - EPS && a.maxZ <= box.maxZ + EPS;

// Rotation that turns an item's front (+z at rotation 0) to face (fx, fz).
export const facing = (fx, fz) => round3(Math.atan2(fx, fz));

const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
export const opposite = (side) => OPPOSITE[side];

/** Hangs on a wall or ceiling, or lies flat (rugs), so floor furniture can share its spot. */
export function isFloorObstacle(item) {
  const definition = getFurnitureDefinition(item.type);
  if (definition.placeType === 'wall' || definition.placeType === 'ceiling') return false;
  if ((Number(item.elevation) || 0) > 0.05) return false;
  return (Number(item.height) || 1) > 0.05;
}

export const isWallItem = (item) => getFurnitureDefinition(item.type).placeType === 'wall';

/**
 * Everything needed to place furniture in a rectangular room: the clear
 * floor inside the walls, each side with its doors and windows, and the
 * spots already taken (furniture, stairs, the swing space inside doors).
 */
export function roomLayout(doc, room) {
  const wallThickness = Number(doc.floorplan.wallThickness) || 0.23;
  const box = rectOf(room);
  const inset = wallThickness / 2 + WALL_GAP;
  const clear = { minX: box.minX + inset, maxX: box.maxX - inset, minZ: box.minZ + inset, maxZ: box.maxZ - inset };
  const wallHeight = Number((doc.floorplan.floors || []).find((f) => f.id === room.floorId)?.wallHeight ?? doc.floorplan.wallHeight ?? 2.8);

  const sides = {
    top: { side: 'top', axis: 'x', lo: clear.minX, hi: clear.maxX, wall: clear.maxZ, normal: [0, -1] },
    bottom: { side: 'bottom', axis: 'x', lo: clear.minX, hi: clear.maxX, wall: clear.minZ, normal: [0, 1] },
    left: { side: 'left', axis: 'z', lo: clear.minZ, hi: clear.maxZ, wall: clear.minX, normal: [1, 0] },
    right: { side: 'right', axis: 'z', lo: clear.minZ, hi: clear.maxZ, wall: clear.maxX, normal: [-1, 0] }
  };
  for (const s of Object.values(sides)) {
    s.length = s.hi - s.lo;
    s.rotation = facing(s.normal[0], s.normal[1]);
    s.openings = [];
  }

  const doorZones = [];
  for (const wall of roomWalls(doc, room)) {
    const side = sides[wallSide(room, wall)];
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    for (const opening of (doc.floorplan.openings || []).filter((o) => o.wallId === wall.id)) {
      const cx = x1 + (x2 - x1) * opening.t;
      const cz = z1 + (z2 - z1) * opening.t;
      const at = side.axis === 'x' ? cx : cz;
      // A shared wall can run past this room; only openings on this room's stretch count.
      if (at < side.lo - 0.3 || at > side.hi + 0.3) continue;
      const width = Number(opening.width) || 0.9;
      const kind = opening.type === 'door' ? 'door' : 'window';
      side.openings.push({ kind, at, from: at - width / 2, to: at + width / 2 });
      if (kind !== 'door') continue;
      const half = Math.max(width, DOOR_CLEARANCE) / 2 + 0.1;
      doorZones.push(side.axis === 'x'
        ? { minX: cx - half, maxX: cx + half, minZ: cz - DOOR_CLEARANCE, maxZ: cz + DOOR_CLEARANCE }
        : { minX: cx - DOOR_CLEARANCE, maxX: cx + DOOR_CLEARANCE, minZ: cz - half, maxZ: cz + half });
    }
  }
  for (const s of Object.values(sides)) {
    s.doors = s.openings.filter((o) => o.kind === 'door');
    s.windows = s.openings.filter((o) => o.kind === 'window');
  }

  // The room's main door: its first door, or the middle of the bottom (the
  // front of the plan) when it has none yet.
  const doorSide = Object.values(sides).find((s) => s.doors.length) ?? null;
  const entry = doorSide
    ? pointOn(doorSide, doorSide.doors[0].at, 0)
    : { x: room.x, z: clear.minZ };

  const roomItems = () => (doc.floorplan.items || [])
    .filter((item) => item.floorId === room.floorId && (item.roomId === room.id || pointInRoom(room, item.x, item.z)));
  const stairs = (doc.floorplan.stairs || [])
    .filter((s) => (s.floorId ?? room.floorId) === room.floorId)
    .map((s) => turnedBox(s.x, s.z, s.width, s.depth, Number(s.rotation) || 0));

  return {
    room,
    clear,
    sides,
    wallHeight,
    doorSide: doorSide?.side ?? null,
    entry,
    area: (clear.maxX - clear.minX) * (clear.maxZ - clear.minZ),
    roomItems,
    solidTaken: () => [...roomItems().filter(isFloorObstacle).map(footprint), ...stairs],
    floorTaken: () => [...roomItems().filter(isFloorObstacle).map(footprint), ...stairs, ...doorZones],
    wallTaken: () => roomItems().filter(isWallItem).map(footprint)
  };
}

/** The point `offset` metres into the room from side `s` at `at` along it. */
export function pointOn(s, at, offset) {
  return s.axis === 'x'
    ? { x: at, z: s.wall + s.normal[1] * offset }
    : { x: s.wall + s.normal[0] * offset, z: at };
}

/** An item of `size` with its back against side `s`, centred at `at` along it. */
export function againstWall(s, at, size, type) {
  const centre = pointOn(s, at, size.depth / 2);
  return { type, width: size.width, depth: size.depth, x: centre.x, z: centre.z, rotation: s.rotation };
}
