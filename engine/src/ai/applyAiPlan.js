// Applies "Ask ArchCanvas" changes to a floorplan.
//
// The ArchCanvas API turns a person's request into a short list of checked
// operations in world metres (x/z is a room's centre, as everywhere in the
// engine). This module applies them to a copy of the floorplan, so the editor
// can show the result, and undo it in one step if the person rejects it.
//
// Operations:
//   add_room       { id, name, x, z, width, depth }
//   update_room    { room, name?, x?, z?, width?, depth? }
//   delete_room    { room }
//   set_floor      { room, material }           material id from the catalog
//   paint_walls    { room, color }              '#rrggbb', inside faces only
//   add_furniture  { room, type, count? }       placed along the walls or centred
//   furnish_room   { room, kind? }              a full set for the room's kind (roomKits.js)
//   remove_furniture { room, type? }
//   add_opening    { room, kind, side, at?, width? }  kind door|window, side top|right|bottom|left (as on the 2D plan),
//                                               at: where along the wall (world x, or z on a left/right wall), width in metres
// Every operation may carry a `label` that is reported back as is.
import { FloorplanDocument } from '../domain/FloorplanDocument.js';
import { hasFurnitureDefinition } from '../domain/FurnitureCatalog.js';
import { pointInRoom, normalizeRoomShape } from '../rooms/roomShapes.js';
import { DEFAULT_MATERIAL_PACKS } from '../core/materialCatalog.js';
import {
  EPS, round3, rectOf, wallSide, roomWalls, itemSize, footprint, overlaps, inside, facing, roomLayout
} from './layout.js';
import { furnishRoom, describeItems, roomKind } from './roomKits.js';

// Items that stand in the middle of a room rather than against a wall.
const CENTRE_TYPES = new Set([
  'coffee_table', 'dining_table_long', 'oval_table', 'round_table', 'table',
  'rattan_coffee_table', 'triangular_round_coffee_table', 'bistro_table', 'picnic_table', 'patio_dining_table'
]);

function isPlainRect(room) {
  return normalizeRoomShape(room.shape) === 'square' && !Number(room.rotation);
}

/** The face of a wall ('front' or 'back') that looks into the room. */
function insideFace(room, wall) {
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  const length = Math.hypot(x2 - x1, z2 - z1) || 1;
  // Same front normal as the 3D renderer: (-dz, dx) / length.
  const nx = -(z2 - z1) / length;
  const nz = (x2 - x1) / length;
  const mx = (x1 + x2) / 2 + nx * 0.2;
  const mz = (z1 + z2) / 2 + nz * 0.2;
  return pointInRoom(room, mx, mz) ? 'front' : 'back';
}

function paintDescriptor(color) {
  return { id: `paint-${color.slice(1)}`, name: `Custom color (${color})`, category: 'paint', kind: 'paint', color };
}

/** Finds a free spot for a new item in a rectangular room, or null. */
function findSpot(doc, room, type) {
  const size = itemSize(type);
  const { clear, floorTaken } = roomLayout(doc, room);
  const taken = floorTaken();
  const free = (candidate) => inside(footprint(candidate), clear) && !taken.some((zone) => overlaps(footprint(candidate), zone));
  const base = { type, width: size.width, depth: size.depth };

  // Bedside tables go on either side of a bed, against the same wall.
  if (type === 'nightstand') {
    const beds = (doc.floorplan.items || []).filter((item) => /^bed|_bed$/.test(item.type) && item.type !== 'bed_bench'
      && item.floorId === room.floorId && pointInRoom(room, item.x, item.z));
    for (const bed of beds) {
      const r = Number(bed.rotation) || 0;
      const front = { x: Math.sin(r), z: Math.cos(r) };
      const along = { x: Math.cos(r), z: -Math.sin(r) };
      const back = (bed.depth / 2) - size.depth / 2;
      for (const sign of [-1, 1]) {
        const offset = sign * (bed.width / 2 + size.width / 2 + 0.03);
        const candidate = {
          ...base,
          x: bed.x - front.x * back + along.x * offset,
          z: bed.z - front.z * back + along.z * offset,
          rotation: r
        };
        if (free(candidate)) return candidate;
      }
    }
  }

  if (CENTRE_TYPES.has(type)) {
    const centre = { ...base, x: room.x, z: room.z, rotation: size.width >= size.depth === (room.width >= room.depth) ? 0 : Math.PI / 2 };
    if (free(centre)) return centre;
  }

  // Against each wall, back to the wall and facing into the room. Longer walls first.
  const sides = [
    { side: 'top', along: 'x', at: clear.maxZ - size.depth / 2, rotation: facing(0, -1), length: clear.maxX - clear.minX },
    { side: 'bottom', along: 'x', at: clear.minZ + size.depth / 2, rotation: facing(0, 1), length: clear.maxX - clear.minX },
    { side: 'left', along: 'z', at: clear.minX + size.depth / 2, rotation: facing(1, 0), length: clear.maxZ - clear.minZ },
    { side: 'right', along: 'z', at: clear.maxX - size.depth / 2, rotation: facing(-1, 0), length: clear.maxZ - clear.minZ }
  ].sort((a, b) => b.length - a.length);
  const step = 0.1;
  for (const s of sides) {
    const [lo, hi] = s.along === 'x' ? [clear.minX, clear.maxX] : [clear.minZ, clear.maxZ];
    const span = hi - lo - size.width;
    if (span < -EPS) continue;
    // Try the middle of the wall first, then move out towards the corners.
    const offsets = [0];
    for (let d = step; d <= span / 2 + EPS; d += step) offsets.push(-d, d);
    offsets.push(-span / 2, span / 2);
    for (const offset of offsets) {
      const mid = (lo + hi) / 2 + offset;
      const candidate = s.along === 'x'
        ? { ...base, x: mid, z: s.at, rotation: s.rotation }
        : { ...base, x: s.at, z: mid, rotation: s.rotation };
      if (free(candidate)) return candidate;
    }
  }

  // Anywhere else on a grid.
  for (let z = clear.minZ + size.depth / 2; z <= clear.maxZ - size.depth / 2 + EPS; z += step) {
    for (let x = clear.minX + size.width / 2; x <= clear.maxX - size.width / 2 + EPS; x += step) {
      const candidate = { ...base, x, z, rotation: 0 };
      if (free(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * A spot along the wall (0..1) for a new opening, inside the part of the wall
 * that bounds `room` (a shared or boundary wall can be longer than the room)
 * and clear of the openings already on it. Doors go near a corner, windows in
 * the middle.
 */
function freeT(doc, room, wall, kind, width, near = null) {
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length < EPS) return null;
  const ux = (x2 - x1) / length;
  const uz = (z2 - z1) / length;
  const box = rectOf(room);
  const along = (x, z) => (x - x1) * ux + (z - z1) * uz;
  const ends = Math.abs(ux) > Math.abs(uz)
    ? [along(box.minX, z1), along(box.maxX, z1)]
    : [along(x1, box.minZ), along(x1, box.maxZ)];
  const corner = Number(doc.floorplan.wallThickness || 0.23) / 2 + 0.1;
  // The engine keeps openings between 8% and 92% of the wall.
  const lo = Math.max(Math.max(0, Math.min(...ends)) + corner, 0.08 * length) + width / 2;
  const hi = Math.min(Math.min(length, Math.max(...ends)) - corner, 0.92 * length) - width / 2;
  if (hi < lo - EPS) return null;
  const others = (doc.floorplan.openings || []).filter((o) => o.wallId === wall.id);
  const fits = (a) => others.every((o) => Math.abs(o.t * length - a) >= (width + (Number(o.width) || 0.9)) / 2 + 0.15);
  const mid = (lo + hi) / 2;
  const candidates = kind === 'door' ? [lo, hi, mid] : [mid];
  for (let d = 0.1; d <= (hi - lo) / 2 + EPS; d += 0.1) {
    if (kind === 'door') candidates.push(lo + d, hi - d); else candidates.push(mid - d, mid + d);
  }
  // Asked for a spot (a world x on a wall running along x, else a z): closest first.
  if (Number.isFinite(near)) {
    const target = Math.abs(ux) > Math.abs(uz) ? along(near, z1) : along(x1, near);
    candidates.sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
  }
  const a = candidates.find((value) => value >= lo - EPS && value <= hi + EPS && fits(value));
  return a === undefined ? null : round3(a / length);
}

function resolveRoom(doc, ref) {
  if (!ref) return null;
  const rooms = doc.floorplan.floor.rooms || [];
  return rooms.find((room) => room.id === ref)
    || rooms.find((room) => String(room.name || '').toLowerCase() === String(ref).toLowerCase())
    || null;
}

const materialById = (id) => DEFAULT_MATERIAL_PACKS.find((material) => material.id === id) || null;

/**
 * Applies operations to a copy of `floorplan`.
 * @returns {{ floorplan: object, applied: object[], skipped: object[] }}
 *   applied and skipped hold { op, label } (skipped also has a reason).
 */
export function applyAiOperations(floorplan, operations = []) {
  const doc = new FloorplanDocument(JSON.parse(JSON.stringify(floorplan)));
  const applied = [];
  const skipped = [];
  const done = (op) => applied.push({ op: op.op, label: op.label || op.op });
  const skip = (op, reason) => skipped.push({ op: op.op, label: op.label || op.op, reason });

  for (const op of operations) {
    const room = resolveRoom(doc, op.room);
    const needsRoom = op.op !== 'add_room';
    if (needsRoom && !room) {
      skip(op, 'That room is not on this floor.');
      continue;
    }
    if (needsRoom && room.id === 'plot' && !['set_floor'].includes(op.op)) {
      skip(op, 'The plot boundary is not a room.');
      continue;
    }

    switch (op.op) {
      case 'add_room': {
        const created = doc.addRoom({
          id: op.id,
          name: op.name,
          x: round3(op.x),
          z: round3(op.z),
          width: round3(op.width),
          depth: round3(op.depth),
          shape: 'square'
        });
        if (created) done(op); else skip(op, 'The room could not be added.');
        break;
      }
      case 'update_room': {
        if (room.locked) { skip(op, `${room.name} is locked.`); break; }
        const patch = {};
        for (const key of ['name', 'x', 'z', 'width', 'depth']) {
          if (op[key] !== undefined && op[key] !== null) patch[key] = key === 'name' ? String(op[key]) : round3(op[key]);
        }
        doc.updateRoom(room.id, patch, { moveItems: true });
        done(op);
        break;
      }
      case 'delete_room': {
        if (doc.deleteRoom(room.id)) done(op); else skip(op, `${room.name} is locked.`);
        break;
      }
      case 'set_floor': {
        const material = materialById(op.material);
        if (!material) { skip(op, 'Unknown floor material.'); break; }
        doc.setRoomFloorMaterial(room.id, material);
        done(op);
        break;
      }
      case 'paint_walls': {
        const color = String(op.color || '').toLowerCase();
        if (!/^#[0-9a-f]{6}$/.test(color)) { skip(op, 'Unknown colour.'); break; }
        const walls = roomWalls(doc, room);
        for (const wall of walls) {
          const face = insideFace(room, wall);
          const fields = face === 'front' ? ['materialFront', 'colorFront'] : ['materialBack', 'colorBack'];
          doc.updateWall(wall.id, { [fields[0]]: paintDescriptor(color), [fields[1]]: color });
        }
        if (walls.length) done(op); else skip(op, `${room.name} has no walls to paint.`);
        break;
      }
      case 'add_furniture': {
        if (!hasFurnitureDefinition(op.type)) { skip(op, 'Unknown furniture.'); break; }
        if (!isPlainRect(room)) { skip(op, `Furniture is only placed automatically in rectangular rooms.`); break; }
        const count = Math.max(1, Math.min(8, Math.round(Number(op.count) || 1)));
        let placed = 0;
        for (let i = 0; i < count; i += 1) {
          const spot = findSpot(doc, room, op.type);
          if (!spot) break;
          doc.addItem({ type: op.type, x: round3(spot.x), z: round3(spot.z), rotation: spot.rotation, roomId: room.id, floorId: room.floorId });
          placed += 1;
        }
        if (placed === count) done(op);
        else if (placed > 0) {
          done(op);
          skip(op, `Only ${placed} of ${count} fit in ${room.name}.`);
        } else skip(op, `There is no free space for it in ${room.name}.`);
        break;
      }
      case 'furnish_room': {
        if (!isPlainRect(room)) { skip(op, 'Furniture is only placed automatically in rectangular rooms.'); break; }
        const kind = op.kind || roomKind(room.name);
        const result = furnishRoom(doc, room, kind);
        if (!result) {
          skip(op, `ArchCanvas does not know what kind of room "${room.name}" is. Rename it (for example Bedroom 2 or Kitchen) or ask for furniture piece by piece.`);
          break;
        }
        const name = room.name || 'Room';
        if (kind === 'staircase') {
          applied.push({ op: op.op, label: result.placed.length ? `Stairs up in ${name}` : `${name} kept clear` });
        } else if (result.placed.length) {
          applied.push({ op: op.op, label: `Furnish ${name} (${result.placed.length} items): ${describeItems(result.placed)}` });
        }
        if (result.missing.length) {
          skip(op, 'There was no free space left for it.');
          skipped[skipped.length - 1].label = `${name}: ${describeItems(result.missing)}`;
        } else if (!result.placed.length && kind !== 'staircase') {
          skip(op, `There is no free space in ${name}.`);
        }
        break;
      }
      case 'remove_furniture': {
        const before = doc.floorplan.items.length;
        doc.floorplan.items = doc.floorplan.items.filter((item) => item.locked
          || item.floorId !== room.floorId
          || !(item.roomId === room.id || pointInRoom(room, item.x, item.z))
          || (op.type && item.type !== op.type));
        if (doc.floorplan.items.length < before) done(op); else skip(op, `Nothing like that in ${room.name}.`);
        break;
      }
      case 'add_opening': {
        const kind = op.kind === 'window' ? 'window' : 'door';
        const wall = roomWalls(doc, room).find((candidate) => wallSide(room, candidate) === op.side);
        if (!wall) { skip(op, `${room.name} has no wall on that side.`); break; }
        const width = Number(op.width) > 0 ? Number(op.width) : kind === 'door' ? 0.9 : 1.25;
        const t = freeT(doc, room, wall, kind, width, op.at === undefined ? null : Number(op.at));
        if (t === null) { skip(op, `That wall of ${room.name} has no room for another ${kind}.`); break; }
        doc.addOpening({ wallId: wall.id, type: kind, t, width });
        done(op);
        break;
      }
      default:
        skip(op, 'Unknown change.');
    }
  }

  return { floorplan: doc.floorplan, applied, skipped };
}
