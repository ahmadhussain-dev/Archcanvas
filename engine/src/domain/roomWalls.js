// Shared room walls ("wallModel: 'shared'", used by ArchCanvas).
//
// In the original engine every room drew its own four walls on its edges, so
// two rooms side by side got two walls next to each other and their corners
// never lined up. With shared walls the room walls of a floor are worked out
// from the rooms themselves, the way a plan is drawn:
//
// - a room's size is its overall size: its outside walls sit inside it, with
//   their outer face on the room's edge, so a 12 x 14 ft room on its own takes
//   exactly 12 x 14 ft of the plot;
// - where two rooms touch there is one wall, centred on the line between them
//   (half of it in each room);
// - outside walls are double brick (9 in) or single brick (4.5 in), inside
//   walls single brick by default, and any wall can be set to either;
// - corners meet cleanly, and inside walls stop at the face of the outside wall.
//
// Only plain rectangular rooms (not turned, not L-shaped etc.) take part, and
// never the plot outline; other rooms keep the engine's own walls.
//
// Walls are rebuilt whenever a room changes. Each new wall takes the id,
// paint and settings of the old wall it lies on, and doors and windows move
// onto the new wall at the same place, so nothing is lost.
import { MaterialResolver } from './MaterialResolver.js';

export const SHARED_WALLS = 'shared';
const INCH = 0.0254;
/** Wall thickness in metres for each brick setting. */
export const BRICK_THICKNESS = Object.freeze({ double: 9 * INCH, single: 4.5 * INCH });
const DEFAULT_FLOOR_ID = 'floor_1';
const EPS = 0.003;
const KEYS = { north: 'north', east: 'east', south: 'south', west: 'west' };

const positive = (value) => (Number(value) > 0 ? Number(value) : 0);
const q = (value) => Math.round(value * 1000) / 1000;

export const usesSharedWalls = (floorplan) => floorplan?.wallModel === SHARED_WALLS;

/** Outside wall thickness for the plan (double brick unless set). */
export function outsideWallThickness(floorplan) {
  return positive(floorplan?.outsideWallThickness) || BRICK_THICKNESS.double;
}

/** Inside wall thickness for the plan (single brick unless set). */
export function insideWallThickness(floorplan) {
  return positive(floorplan?.insideWallThickness) || BRICK_THICKNESS.single;
}

/** Thickness of one wall in metres. */
export function wallThicknessOf(floorplan, wall) {
  return positive(wall?.thickness) || positive(floorplan?.wallThickness) || 0.23;
}

/** A room whose walls are shared: a plain, unturned rectangle that is not the plot. */
export function isSharedWallRoom(room) {
  if (!room || room.id === 'plot' || room.noWalls) return false;
  const shape = String(room.shape || 'square').toLowerCase();
  return (shape === 'square' || shape === 'rect' || shape === 'rectangle') && !Number(room.rotation);
}

function rectOf(room) {
  return {
    minX: q(room.x - room.width / 2),
    maxX: q(room.x + room.width / 2),
    minZ: q(room.z - room.depth / 2),
    maxZ: q(room.z + room.depth / 2)
  };
}

// A point given as (along, across) for a line running along `axis`.
const toXZ = (axis, along, across) => (axis === 'x' ? [along, across] : [across, along]);

/**
 * The room walls of one floor as segments on the rooms' edges.
 * Each segment runs along `axis` ('x' or 'z') on the line `line` (the other
 * coordinate) from `a` to `b`. An inside wall has rooms on both sides; an
 * outside wall has them on one side only, `side` (+1 or -1, across the line).
 * @param {object[]} rooms plain rectangular rooms on one floor
 */
export function planRoomWalls(rooms) {
  const rects = rooms.map((room) => ({ room, ...rectOf(room) }));
  const covered = (x, z) => rects.some((r) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ);
  const groups = new Map();
  const addEdge = (axis, line, a, b, room) => {
    if (b - a < 0.001) return;
    const key = `${axis}:${line.toFixed(3)}`;
    if (!groups.has(key)) groups.set(key, { axis, line, edges: [] });
    groups.get(key).edges.push({ a, b, room });
  };
  for (const r of rects) {
    addEdge('x', r.minZ, r.minX, r.maxX, r.room);
    addEdge('x', r.maxZ, r.minX, r.maxX, r.room);
    addEdge('z', r.minX, r.minZ, r.maxZ, r.room);
    addEdge('z', r.maxX, r.minZ, r.maxZ, r.room);
  }

  const segments = [];
  for (const { axis, line, edges } of groups.values()) {
    const cuts = [...new Set(edges.flatMap((e) => [e.a, e.b]))].sort((m, n) => m - n);
    let open = null;
    for (let i = 0; i < cuts.length - 1; i += 1) {
      const a = cuts[i];
      const b = cuts[i + 1];
      if (b - a < 0.001) continue;
      const mid = (a + b) / 2;
      const owners = edges.filter((e) => e.a <= mid && e.b >= mid).map((e) => e.room.id);
      if (!owners.length) { open = null; continue; }
      const plus = covered(...toXZ(axis, mid, line + EPS));
      const minus = covered(...toXZ(axis, mid, line - EPS));
      if (!plus && !minus) { open = null; continue; }
      const kind = plus && minus ? 'inside' : 'outside';
      const side = kind === 'inside' ? 0 : (plus ? 1 : -1);
      const roomIds = [...new Set(owners)].sort();
      const key = `${kind}:${side}:${roomIds.join('|')}`;
      if (open && open.key === key && Math.abs(open.b - a) < 0.001) {
        open.b = b;
      } else {
        open = { key, axis, line, a, b, kind, side, roomIds };
        segments.push(open);
      }
    }
  }
  return { segments, covered };
}

/**
 * Centre line of each wall: outside walls moved in by half their thickness and
 * met at the corners, inside walls stopped at the outside walls' inner face.
 * Each segment needs `thickness` set first.
 */
export function placeRoomWalls(segments, covered) {
  const perpendicularOutside = (seg, at) => segments.find((other) => other.kind === 'outside'
    && other.axis !== seg.axis
    && Math.abs(other.line - at) < 0.002
    && seg.line >= other.a - 0.002 && seg.line <= other.b + 0.002);
  for (const seg of segments) {
    const quad = (end, dAlong, dAcross) => covered(...toXZ(seg.axis, end + dAlong * EPS, seg.line + dAcross * EPS));
    const placeEnd = (end, d) => {
      if (seg.kind === 'outside') {
        const roomBeyond = quad(end, d, seg.side);
        const openBeyond = quad(end, d, -seg.side);
        if (roomBeyond === openBeyond) {
          const other = perpendicularOutside(seg, end);
          if (!other) return end;
          // Outer corner: stop at the other wall's centre line inside the
          // corner. Inner corner (an L-shaped house): reach past the edge to it.
          return roomBeyond ? end + d * other.thickness / 2 : end - d * other.thickness / 2;
        }
        return end;
      }
      const onOutline = [[d, 1], [d, -1], [-d, 1], [-d, -1]].some(([u, v]) => !quad(end, u, v));
      if (!onOutline) return end;
      const other = perpendicularOutside(seg, end);
      return other ? end - d * other.thickness : end;
    };
    const across = seg.kind === 'outside' ? seg.line + seg.side * seg.thickness / 2 : seg.line;
    const a = placeEnd(seg.a, -1);
    const b = placeEnd(seg.b, 1);
    seg.from = toXZ(seg.axis, q(a), q(across));
    seg.to = toXZ(seg.axis, q(b), q(across));
  }
  return segments;
}

// The plot's edges, less the stretches where a house wall stands on them.
function plotSegments(plot, segments) {
  const r = rectOf(plot);
  const edges = [
    { axis: 'x', line: r.minZ, a: r.minX, b: r.maxX, side: 1 },
    { axis: 'x', line: r.maxZ, a: r.minX, b: r.maxX, side: -1 },
    { axis: 'z', line: r.minX, a: r.minZ, b: r.maxZ, side: 1 },
    { axis: 'z', line: r.maxX, a: r.minZ, b: r.maxZ, side: -1 }
  ];
  const out = [];
  for (const edge of edges) {
    const cuts = segments
      .filter((seg) => seg.kind === 'outside' && seg.axis === edge.axis && seg.side === edge.side && Math.abs(seg.line - edge.line) < 0.002)
      .map((seg) => [seg.a, seg.b])
      .sort((m, n) => m[0] - n[0]);
    let at = edge.a;
    const push = (a, b) => {
      if (b - a > 0.01) out.push({ axis: edge.axis, line: edge.line, a, b, kind: 'plot', side: edge.side, roomIds: ['plot'], corners: [a === edge.a, b === edge.b] });
    };
    for (const [a, b] of cuts) {
      push(at, Math.min(a, edge.b));
      at = Math.max(at, b);
    }
    push(at, edge.b);
  }
  return out;
}

// Plot walls sit inside the plot and meet at its corners.
function placePlotWalls(plot, segments) {
  const perpendicular = (seg, at) => segments.find((other) => (other.kind === 'plot' || other.kind === 'outside')
    && other.axis !== seg.axis && Math.abs(other.line - at) < 0.002
    && seg.line >= other.a - 0.002 && seg.line <= other.b + 0.002 && other.thickness);
  for (const seg of segments) {
    if (seg.kind !== 'plot') continue;
    const end = (value, d, corner) => {
      if (!corner) return value;
      const other = perpendicular(seg, value);
      return other ? value - d * other.thickness / 2 : value;
    };
    const across = seg.line + seg.side * seg.thickness / 2;
    seg.from = toXZ(seg.axis, q(end(seg.a, -1, seg.corners[0])), q(across));
    seg.to = toXZ(seg.axis, q(end(seg.b, 1, seg.corners[1])), q(across));
  }
}

function wallAxis(wall) {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  return Math.abs(dx) >= Math.abs(dz) ? 'x' : 'z';
}

function wallDirection(wall) {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dz) || 1;
  return [dx / length, dz / length];
}

// How much of an old wall lies along a new segment (0 if it is elsewhere).
function overlapWith(seg, wall) {
  if (wallAxis(wall) !== seg.axis) return 0;
  const i = seg.axis === 'x' ? 0 : 1;
  const j = 1 - i;
  const across = (wall.from[j] + wall.to[j]) / 2;
  if (Math.abs(wall.from[j] - wall.to[j]) > 0.01) return 0;
  const reach = Math.max(0.12, positive(wall.thickness) || 0.12) + 0.05;
  if (Math.abs(across - seg.line) > reach) return 0;
  const lo = Math.min(wall.from[i], wall.to[i]);
  const hi = Math.max(wall.from[i], wall.to[i]);
  return Math.min(hi, seg.b) - Math.max(lo, seg.a);
}

// Wall fields that are not settings to carry over.
const GEOMETRY_FIELDS = new Set(['id', 'from', 'to', 'roomId', 'kind', 'thickness', 'floorId', 'roomIds']);

/**
 * Rebuilds the shared room walls of one floor in place (walls, openings and
 * the rooms' wallIds). Other walls (drawn by hand, the plot, rooms that are not
 * plain rectangles) are left alone.
 */
export function rebuildSharedWalls(floorplan, floorId) {
  const rooms = (floorplan.floor?.rooms || []).filter((room) => (room.floorId ?? DEFAULT_FLOOR_ID) === floorId);
  const shared = rooms.filter(isSharedWallRoom);
  const sharedIds = new Set(shared.map((room) => room.id));
  // The plot's boundary walls are worked out too, inside the plot, and left
  // out where a house wall already stands on the plot line.
  const plot = rooms.find((room) => room.id === 'plot' && !Number(room.rotation)
    && String(room.shape || 'square').toLowerCase() === 'square') || null;
  const plotWallIds = new Set(Object.values(plot?.wallIds || {}));
  const isPlotWall = (wall) => !!plot && (wall.kind === 'plot' || wall.roomId === 'plot' || plotWallIds.has(wall.id));
  const kept = new Set(rooms.filter((room) => !isSharedWallRoom(room) && room !== plot).flatMap((room) => Object.values(room.wallIds || {})));
  const linked = new Set(shared.flatMap((room) => Object.values(room.wallIds || {})));
  const walls = floorplan.walls || [];
  const old = walls.filter((wall) => (wall.floorId ?? floorId) === floorId && !kept.has(wall.id)
    && (wall.kind === 'outside' || wall.kind === 'inside' || sharedIds.has(wall.roomId) || linked.has(wall.id) || isPlotWall(wall)));
  const oldIds = new Set(old.map((wall) => wall.id));

  // Doors and windows on the old walls, by where they are.
  const openings = (floorplan.openings || []).filter((opening) => oldIds.has(opening.wallId)).map((opening) => {
    const wall = old.find((w) => w.id === opening.wallId);
    const t = opening.t ?? 0.5;
    return {
      opening,
      x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
      z: wall.from[1] + (wall.to[1] - wall.from[1]) * t,
      dir: wallDirection(wall)
    };
  });

  const { segments, covered } = planRoomWalls(shared);
  const outside = outsideWallThickness(floorplan);
  const inside = insideWallThickness(floorplan);
  const houseCount = segments.length;
  if (plot) segments.push(...plotSegments(plot, segments));

  // Each segment takes its settings from the old wall lying most along it,
  // and that wall's id when no longer segment claimed it first.
  const pairs = [];
  segments.forEach((seg, s) => old.forEach((wall) => {
    if ((seg.kind === 'plot') !== isPlotWall(wall)) return;
    const overlap = overlapWith(seg, wall);
    if (overlap > 0.05) pairs.push({ s, wall, overlap });
  }));
  pairs.sort((m, n) => n.overlap - m.overlap);
  const source = new Map();
  const reused = new Map();
  const taken = new Set();
  for (const { s, wall } of pairs) {
    if (!source.has(s)) source.set(s, wall);
    if (!reused.has(s) && !taken.has(wall.id)) {
      reused.set(s, wall.id);
      taken.add(wall.id);
    }
  }

  segments.forEach((seg, s) => {
    const brick = source.get(s)?.brick;
    const plain = seg.kind === 'plot' ? wallThicknessOf(floorplan, null) : (seg.kind === 'outside' ? outside : inside);
    seg.thickness = BRICK_THICKNESS[brick] || plain;
  });
  placeRoomWalls(segments.slice(0, houseCount), covered);
  if (plot) placePlotWalls(plot, segments);

  const usedIds = new Set(walls.filter((wall) => !oldIds.has(wall.id)).map((wall) => wall.id));
  const created = segments.map((seg, s) => {
    const from = source.get(s);
    let id = reused.get(s);
    if (!id || usedIds.has(id)) {
      const base = `${seg.roomIds[0]}_wall_${seg.axis}${Math.round(seg.line * 100)}`;
      id = base;
      for (let n = 2; usedIds.has(id); n += 1) id = `${base}_${n}`;
    }
    usedIds.add(id);
    const settings = {};
    if (from) for (const [key, value] of Object.entries(from)) if (!GEOMETRY_FIELDS.has(key)) settings[key] = value;
    let start = seg.from;
    let end = seg.to;
    // Keep the old wall's direction, so its front and back paint stay on the same sides.
    if (from) {
      const [ox, oz] = wallDirection(from);
      const dot = ox * (end[0] - start[0]) + oz * (end[1] - start[1]);
      if (dot < 0) [start, end] = [end, start];
    }
    const wall = {
      color: '#f9fbff',
      ...settings,
      id,
      from: [...start],
      to: [...end],
      floorId,
      roomId: seg.roomIds[0],
      kind: seg.kind,
      thickness: Number(seg.thickness.toFixed(4))
    };
    MaterialResolver.normalizeWallDecorSettings(wall);
    seg.wall = wall;
    return wall;
  }).filter((wall) => Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]) > 0.01);

  floorplan.walls = [...walls.filter((wall) => !oldIds.has(wall.id)), ...created];

  // Each room lists every wall along its edges.
  for (const room of shared) {
    const r = rectOf(room);
    const ids = {};
    const add = (key, id) => {
      let name = key;
      for (let n = 2; ids[name]; n += 1) name = `${key}_${n}`;
      ids[name] = id;
    };
    for (const seg of segments) {
      if (!seg.wall || !seg.roomIds.includes(room.id) || !created.includes(seg.wall)) continue;
      const key = seg.axis === 'x'
        ? (Math.abs(seg.line - r.minZ) < 0.002 ? KEYS.north : KEYS.south)
        : (Math.abs(seg.line - r.minX) < 0.002 ? KEYS.west : KEYS.east);
      add(key, seg.wall.id);
    }
    room.wallIds = ids;
  }
  if (plot) {
    const ids = {};
    const r = rectOf(plot);
    for (const seg of segments) {
      if (seg.kind !== 'plot' || !seg.wall || !created.includes(seg.wall)) continue;
      const side = seg.axis === 'x'
        ? (Math.abs(seg.line - r.minZ) < 0.002 ? KEYS.north : KEYS.south)
        : (Math.abs(seg.line - r.minX) < 0.002 ? KEYS.west : KEYS.east);
      let name = side;
      for (let n = 2; ids[name]; n += 1) name = `${side}_${n}`;
      ids[name] = seg.wall.id;
    }
    plot.wallIds = ids;
  }

  // Doors and windows go onto the new wall at the same spot.
  const lost = new Set();
  for (const { opening, x, z, dir } of openings) {
    let best = null;
    for (const wall of created) {
      if (wall.removed) continue;
      const [ux, uz] = wallDirection(wall);
      const cross = ux * dir[1] - uz * dir[0];
      if (Math.abs(cross) > 0.01) continue;
      const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
      const along = (x - wall.from[0]) * ux + (z - wall.from[1]) * uz;
      const off = Math.abs((x - wall.from[0]) * uz - (z - wall.from[1]) * ux);
      if (along < -0.05 || along > length + 0.05 || off > 0.35) continue;
      if (!best || off < best.off) best = { wall, along, length, off, reversed: ux * dir[0] + uz * dir[1] < 0 };
    }
    if (!best) { lost.add(opening.id); continue; }
    opening.wallId = best.wall.id;
    opening.t = Number(Math.max(0, Math.min(1, best.along / (best.length || 1))).toFixed(4));
    if (best.reversed) {
      opening.isFlippedIO = !opening.isFlippedIO;
      opening.isFlippedLR = !opening.isFlippedLR;
    }
  }
  if (lost.size) floorplan.openings = floorplan.openings.filter((opening) => !lost.has(opening.id));
  return floorplan;
}

/** Rebuilds the shared room walls on every floor. */
export function rebuildAllSharedWalls(floorplan) {
  const floorIds = new Set([
    ...(floorplan.floors || []).map((floor) => floor.id),
    ...(floorplan.floor?.rooms || []).map((room) => room.floorId ?? DEFAULT_FLOOR_ID)
  ]);
  floorIds.forEach((floorId) => rebuildSharedWalls(floorplan, floorId));
  return floorplan;
}

/**
 * How far each wall reaches into a room from its edges (metres), by side as
 * on the plan ('top' is +z). A room with no wall on a side gets 0 there.
 */
export function roomWallInsets(floorplan, room) {
  const fallback = wallThicknessOf(floorplan, null) / 2;
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  const r = rectOf(room);
  if (room.noWalls) return insets;
  const listed = Object.values(room.wallIds || {}).map((id) => (floorplan.walls || []).find((wall) => wall.id === id)).filter(Boolean);
  if (!listed.length) return { top: fallback, bottom: fallback, left: fallback, right: fallback };
  // A wall taken out for an open plan leaves that side open.
  const walls = listed.filter((wall) => !wall.removed);
  for (const wall of walls) {
    const t = wallThicknessOf(floorplan, wall);
    if (wallAxis(wall) === 'x') {
      const z = (wall.from[1] + wall.to[1]) / 2;
      if (Math.abs(z - r.maxZ) <= Math.abs(z - r.minZ)) insets.top = Math.max(insets.top, r.maxZ - (z - t / 2));
      else insets.bottom = Math.max(insets.bottom, z + t / 2 - r.minZ);
    } else {
      const x = (wall.from[0] + wall.to[0]) / 2;
      if (Math.abs(x - r.maxX) <= Math.abs(x - r.minX)) insets.right = Math.max(insets.right, r.maxX - (x - t / 2));
      else insets.left = Math.max(insets.left, x + t / 2 - r.minX);
    }
  }
  for (const key of Object.keys(insets)) insets[key] = Math.max(0, Number(insets[key].toFixed(4)));
  return insets;
}

/** A plain room's clear floor between its wall faces, or null. */
export function roomClearBox(floorplan, room) {
  const shape = String(room?.shape || 'square').toLowerCase();
  if (!room || shape !== 'square' || Number(room.rotation)) return null;
  const r = rectOf(room);
  const inset = roomWallInsets(floorplan, room);
  return { minX: r.minX + inset.left, maxX: r.maxX - inset.right, minZ: r.minZ + inset.bottom, maxZ: r.maxZ - inset.top };
}
