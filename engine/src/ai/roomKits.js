// Furnishes a room with the full set of things a room of its kind needs,
// arranged the way people actually lay out Pakistani homes: the bed against
// the wall facing the door with a side table on each side, the kitchen
// counter (sink, cooking range, cabinets, fridge) along a wall without a
// door, the commode and shower away from the bathroom door, the sofa facing
// the TV, the car porch left clear for a car.
//
// Everything is placed with its back to a wall and facing into the room,
// never in a door's swing space, never on the stairs, and tall pieces
// (wardrobes, fridges, showers) never in front of a window.
import { getFurnitureDefinition } from '../domain/FurnitureCatalog.js';
import { pointInRoom } from '../rooms/roomShapes.js';
import {
  EPS, round3, itemSize, footprint, overlaps, inside, opposite,
  roomLayout, pointOn, againstWall, facing
} from './layout.js';

export const ROOM_KINDS = [
  ['staircase', /stair/i],
  ['terrace', /terrace|balcony|lawn|garden|veranda/i],
  ['bathroom', /bath|wash\s*room|toilet|\bwc\b|powder|rest\s*room/i],
  ['kitchen', /kitchen/i],
  ['dining', /dining/i],
  ['car porch', /porch|garage|parking|\bcar\b/i],
  ['servant room', /servant|maid|driver/i],
  ['laundry', /laundry/i],
  ['store', /store|pantry/i],
  ['study', /study|office|library/i],
  ['lounge', /\btv\b|lounge|living|family|sitting/i],
  ['drawing room', /drawing|baithak/i],
  ['bedroom', /bed\s*room|master|guest|kids?\b|children|nursery/i]
];

export function roomKind(name) {
  return ROOM_KINDS.find(([, match]) => match.test(String(name || '')))?.[0] ?? null;
}

// Names used in the change list.
const NAMES = {
  bed_double: 'double bed', bed_single: 'single bed', nightstand: 'bedside table', wardrobe: 'wardrobe',
  vanity: 'dressing table', desk: 'study desk', computer_desk: 'computer desk', chair: 'chair', officechair: 'office chair',
  painting: 'wall painting', air_conditioner_wall: 'split AC', fridge: 'fridge', sink_kitchen: 'kitchen sink',
  stove: 'cooking range', cabinet_kitchen: 'kitchen cabinet', microwave: 'microwave', range_hood: 'cooker hood',
  shower_cabin: 'shower', toilet: 'commode', sink_bathroom: 'wash basin', mirror_bathroom: 'mirror',
  towel_rack: 'towel rail', bathroom_shelf: 'bathroom shelf', sofa: 'sofa (3 seat)', loveseat: 'sofa (2 seat)',
  armchair: 'armchair', coffee_table: 'centre table', side_table: 'side table', console: 'TV unit', tv: 'TV',
  rug: 'rug', plant: 'plant', terracotta_flower_urn: 'planter', display_cabinet: 'showcase', sideboard: 'sideboard',
  dining_table_long: 'dining table', round_table: 'round dining table', table: 'small table', shoerack: 'shoe rack',
  bookshelf: 'shelf', washing_machine: 'washing machine', water_dispenser: 'water dispenser', bistro_table: 'tea table', stairs: 'stairs'
};
// Front direction for a rotation. Rotations are stored to 3 decimals, so
// quarter turns are snapped back to exact ones to keep pieces flush.
function frontOf(rotation) {
  const quarter = Math.round(rotation / (Math.PI / 2));
  const r = Math.abs(rotation - quarter * (Math.PI / 2)) < 0.01 ? quarter * (Math.PI / 2) : rotation;
  return { x: Math.round(Math.sin(r) * 1e9) / 1e9, z: Math.round(Math.cos(r) * 1e9) / 1e9 };
}

const nameOf = (type) => NAMES[type] ?? getFurnitureDefinition(type).name.toLowerCase();
const plural = (name) => (/(s|sh|ch)$/.test(name) ? `${name}es` : /f$/.test(name) ? `${name.slice(0, -1)}ves` : `${name.replace(/y$/, 'ie')}s`);

/** "fridge, kitchen sink, 4 kitchen cabinets" */
export function describeItems(types) {
  const counts = new Map();
  for (const type of types) counts.set(type, (counts.get(type) || 0) + 1);
  return [...counts].map(([type, n]) => (n > 1 ? `${n} ${plural(nameOf(type))}` : nameOf(type))).join(', ');
}

// Keeps track of what is placed in one room and finds spots for more.
function planner(doc, room) {
  const layout = roomLayout(doc, room);
  const { sides, clear, entry } = layout;
  const placed = [];
  const missing = [];

  const add = (spot, extra = {}) => {
    const item = doc.addItem({
      type: spot.type,
      x: round3(spot.x),
      z: round3(spot.z),
      rotation: spot.rotation,
      roomId: room.id,
      floorId: room.floorId,
      ...extra
    });
    placed.push(item);
    return item;
  };

  const distanceToEntry = (s, at) => {
    const p = pointOn(s, at, 0);
    return Math.hypot(p.x - entry.x, p.z - entry.z);
  };

  // Spots along a side for an item `width` wide, best first. Spots that sit
  // flush against furniture already there come first among equals, so
  // counters and wardrobes line up without gaps.
  const positions = (s, width, pref, taken) => {
    const lo = s.lo + width / 2;
    const hi = s.hi - width / 2;
    if (hi < lo - EPS) return [];
    const list = [lo, hi];
    for (let p = lo; p <= hi + EPS; p += 0.05) list.push(p);
    for (const box of taken) {
      const [a, b] = s.axis === 'x' ? [box.minX, box.maxX] : [box.minZ, box.maxZ];
      list.push(a - width / 2, b + width / 2);
    }
    const mid = (s.lo + s.hi) / 2;
    const score = (p) => {
      if (typeof pref === 'number') return Math.abs(p - pref);
      if (pref === 'far') return -distanceToEntry(s, p);
      if (pref === 'near') return distanceToEntry(s, p);
      if (pref === 'corner') return Math.min(p - lo, hi - p);
      return Math.abs(p - mid);
    };
    return list.filter((p) => p >= lo - EPS && p <= hi + EPS).sort((a, b) => score(a) - score(b));
  };

  // Is the item (with `front` metres of space kept free in front of it and
  // `pad` metres at each side) clear of everything on the floor?
  const fits = (spot, taken, { front = 0, pad = 0 } = {}) => {
    const box = footprint(spot);
    if (!inside(box, clear)) return false;
    const reach = footprint({ ...spot, width: spot.width + pad * 2 });
    if (taken.some((zone) => overlaps(reach, zone))) return false;
    if (front > 0) {
      // The space in front only has to be free of furniture; a door's swing space can share it.
      const f = frontOf(spot.rotation);
      const ahead = { ...spot, depth: front, x: spot.x + f.x * (spot.depth + front) / 2, z: spot.z + f.z * (spot.depth + front) / 2 };
      const zone = footprint(ahead);
      if (!inside(zone, clear)) return false;
      if (layout.solidTaken().some((other) => overlaps(zone, other))) return false;
    }
    return true;
  };

  const blocksWindow = (s, at, width) => s.windows.some((w) => at + width / 2 > w.from + EPS && at - width / 2 < w.to - EPS);

  /** Places `type` against the first side in `onSides` with a free spot. */
  const place = (type, { onSides, pref = 'centre', tall = false, front = 0, pad = 0, width, optional = false } = {}) => {
    const size = itemSize(type);
    if (width) size.width = width;
    const taken = layout.floorTaken();
    for (const name of onSides) {
      const s = sides[name];
      if (!s) continue;
      for (const at of positions(s, size.width + pad * 2, pref, taken)) {
        if (tall && blocksWindow(s, at, size.width)) continue;
        const spot = againstWall(s, at, size, type);
        if (fits(spot, taken, { front, pad })) return add(spot, width ? { width: round3(width) } : {});
      }
    }
    if (!optional) missing.push(type);
    return null;
  };

  /** Places `type` at a given centre if it is free there. */
  const placeAt = (type, x, z, rotation, { quiet = false, check = true } = {}) => {
    const size = itemSize(type);
    const spot = { type, width: size.width, depth: size.depth, x, z, rotation: round3(rotation) };
    if (check ? fits(spot, layout.floorTaken()) : inside(footprint(spot), clear)) return add(spot);
    if (!quiet) missing.push(type);
    return null;
  };

  /** Hangs `type` on a wall, clear of doors, windows and other wall pieces. */
  const hang = (type, { onSides, pref = 'centre', elevation }) => {
    const size = itemSize(type);
    const taken = layout.wallTaken();
    for (const name of onSides) {
      const s = sides[name];
      if (!s) continue;
      for (const at of positions(s, size.width, pref, [])) {
        if (s.openings.some((o) => at + size.width / 2 > o.from - 0.05 && at - size.width / 2 < o.to + 0.05)) continue;
        const spot = againstWall(s, at, size, type);
        if (taken.some((box) => overlaps(footprint(spot), box))) continue;
        return add(spot, { elevation: round3(elevation) });
      }
    }
    return null;
  };

  /** Puts `type` on top of `base` (a microwave on the counter, a TV on its unit). */
  const onTop = (base, type, elevation, back = 0) => {
    const size = itemSize(type);
    const shift = (base.depth - size.depth) / 2 - back;
    const f = frontOf(base.rotation);
    return add({
      type,
      x: base.x - f.x * shift,
      z: base.z - f.z * shift,
      rotation: base.rotation
    }, { elevation: round3(elevation) });
  };

  /** Puts `type` right beside `base` against the same wall, on either side. */
  const beside = (base, type, gap = 0.03) => {
    const size = itemSize(type);
    const r = Number(base.rotation) || 0;
    const front = frontOf(r);
    const along = { x: front.z, z: -front.x };
    const back = base.depth / 2 - size.depth / 2;
    const taken = layout.floorTaken();
    for (const sign of [-1, 1]) {
      const offset = sign * (base.width / 2 + size.width / 2 + gap);
      const spot = {
        type, width: size.width, depth: size.depth, rotation: r,
        x: base.x - front.x * back + along.x * offset,
        z: base.z - front.z * back + along.z * offset
      };
      if (fits(spot, taken)) return add(spot);
    }
    return null;
  };

  const remove = (item) => {
    doc.floorplan.items = doc.floorplan.items.filter((other) => other !== item);
    placed.splice(placed.indexOf(item), 1);
  };

  /** The side `item` stands against and where along it. */
  const sideOf = (item) => {
    let best = null;
    for (const s of Object.values(sides)) {
      const back = pointOn(s, s.axis === 'x' ? item.x : item.z, item.depth / 2);
      const d = Math.hypot(back.x - item.x, back.z - item.z);
      if (Math.abs(item.rotation - s.rotation) < 0.01 && (!best || d < best.d)) best = { s, d };
    }
    return best ? { side: best.s.side, at: best.s.axis === 'x' ? item.x : item.z } : null;
  };

  // Sides in a useful order: the room's door side (bottom when it has none
  // yet), the side facing it, the other two (longest first).
  const doorSide = layout.doorSide ?? 'bottom';
  const far = opposite(doorSide);
  const across = Object.keys(sides).filter((name) => name !== doorSide && name !== far)
    .sort((a, b) => sides[b].length - sides[a].length);
  const withoutDoor = (names) => names.filter((name) => !sides[name].doors.length);
  const byLength = (names) => [...names].sort((a, b) => sides[b].length - sides[a].length);
  const allSides = ['top', 'bottom', 'left', 'right'];

  return {
    layout, sides, placed, missing, place, placeAt, hang, onTop, beside, sideOf, remove,
    doorSide, far, across, withoutDoor, byLength, allSides,
    shortSide: Math.min(clear.maxX - clear.minX, clear.maxZ - clear.minZ),
    longSide: Math.max(clear.maxX - clear.minX, clear.maxZ - clear.minZ),
    acHeight: layout.wallHeight - 0.55
  };
}

function bedroom(p, { kids = false, servant = false } = {}) {
  const others = (side) => p.allSides.filter((name) => name !== side);
  const bedSides = [p.far, ...p.across, p.doorSide];
  let beds;
  if (kids && p.longSide >= 3.4) {
    const first = p.place('bed_single', { onSides: bedSides, pref: 'corner', front: 0.6 });
    beds = first ? [first, p.place('bed_single', { onSides: [p.sideOf(first).side, ...bedSides], pref: 'corner', front: 0.6 })].filter(Boolean) : [];
  } else {
    const type = servant || p.shortSide < 2.6 ? 'bed_single' : 'bed_double';
    beds = [p.place(type, { onSides: bedSides, pref: 'centre', front: 0.6 })].filter(Boolean);
  }
  const bed = beds[0];
  const bedSide = bed ? p.sideOf(bed)?.side : null;
  for (const b of beds) {
    const tables = [p.beside(b, 'nightstand'), servant ? null : p.beside(b, 'nightstand')].filter(Boolean);
    if (!tables.length) p.missing.push('nightstand');
  }
  const rest = [...p.across, p.doorSide, p.far].filter((name) => name !== bedSide);
  const wardrobe = p.place('wardrobe', { onSides: rest, pref: 'corner', tall: true, front: 0.6 });
  if (wardrobe && !servant && p.layout.area >= 13) {
    const where = p.sideOf(wardrobe);
    p.place('wardrobe', { onSides: [where.side], pref: where.at, tall: true, front: 0.6, optional: true });
  }
  if (servant) {
    p.place('chair', { onSides: rest, pref: 'corner', optional: true });
    return;
  }
  p.place('vanity', { onSides: rest, pref: 'centre', tall: true, front: 0.5 });
  if (kids || p.layout.area >= 16) {
    const desk = p.place('desk', { onSides: rest, pref: 'centre', front: 0.8, optional: true });
    if (desk) chairAt(p, desk);
  }
  if (bed && bedSide) p.hang('painting', { onSides: [bedSide], pref: p.sideOf(bed).at, elevation: 1.45 });
  p.hang('air_conditioner_wall', { onSides: bedSide ? others(bedSide) : p.allSides, pref: 'centre', elevation: p.acHeight });
}

// A chair pulled up to a desk or table, facing it.
function chairAt(p, desk, type = 'chair') {
  const f = frontOf(desk.rotation);
  const size = itemSize(type);
  const reach = desk.depth / 2 + size.depth / 2 + 0.1;
  return p.placeAt(type, desk.x + f.x * reach, desk.z + f.z * reach, desk.rotation + Math.PI);
}

function kitchen(p) {
  // The counter runs along the longest wall without a door: sink (under the
  // window when there is one), cooking range with counter space beside it,
  // then cabinets, turning the corner into an L when the run is short.
  const withWindow = (name) => (p.sides[name].windows.length && p.sides[name].length >= 2.4 ? 1 : 0);
  const runSides = p.byLength(p.withoutDoor(p.allSides)).sort((a, b) => withWindow(b) - withWindow(a));
  const run = runSides[0] ?? p.byLength(p.allSides)[0];
  const counterSides = [run, ...runSides.slice(1)];
  const s = p.sides[run];
  const window = s.windows[0];
  p.place('sink_kitchen', { onSides: counterSides, pref: window ? window.at : 'far', front: 0.6 });
  const stove = p.place('stove', { onSides: counterSides, pref: 'far', pad: 0.4, front: 0.6, optional: true })
    ?? p.place('stove', { onSides: [...counterSides, ...p.across], pref: 'far', front: 0.6 });
  p.place('fridge', { onSides: [...counterSides, ...p.across, p.doorSide], pref: 'near', tall: true, front: 0.7 });
  const cabinetSides = [run];
  if (s.length < 3.2 || p.layout.area > 9) cabinetSides.push(...runSides.slice(1, 2));
  const cabinets = [];
  for (const side of cabinetSides) {
    for (const width of [1, 0.6, 0.45]) {
      while (cabinets.length < 8) {
        const cabinet = p.place('cabinet_kitchen', { onSides: [side], pref: 'far', width, optional: true });
        if (!cabinet) break;
        cabinets.push(cabinet);
      }
    }
  }
  if (!cabinets.length) p.missing.push('cabinet_kitchen');
  const counter = cabinets.find((c) => c.width >= 0.6) ?? cabinets[0];
  if (counter) p.onTop(counter, 'microwave', 0.9, 0.05);
  if (stove) p.onTop(stove, 'range_hood', 1.6);
  if (p.layout.area >= 11) p.place('water_dispenser', { onSides: p.across, pref: 'near', optional: true });
}

function bathroom(p) {
  p.place('shower_cabin', { onSides: [p.far, ...p.across], pref: 'far', tall: true });
  p.place('toilet', { onSides: [...p.across, p.far], pref: 'far', pad: 0.15, front: 0.5 });
  const basin = p.place('sink_bathroom', { onSides: [...p.across, p.doorSide, p.far], pref: 'near', pad: 0.1, front: 0.5 });
  if (basin) {
    const where = p.sideOf(basin);
    p.hang('mirror_bathroom', { onSides: [where.side], pref: where.at, elevation: 1.2 });
  }
  p.hang('towel_rack', { onSides: p.allSides, pref: 'centre', elevation: 1.3 });
  if (p.layout.area >= 5) p.place('bathroom_shelf', { onSides: p.allSides, pref: 'corner', tall: true, front: 0.4, optional: true });
}

function lounge(p, { tv = true } = {}) {
  // The sofa and what it faces (the TV unit, or a second sofa in a drawing
  // room) go on opposite walls; try wall pairs until both fit, walls without
  // doors first.
  const focusType = tv ? 'console' : 'loveseat';
  const order = [...new Set([...p.byLength(p.withoutDoor(p.allSides)), ...p.byLength(p.allSides)])];
  let sofa = null;
  let focus = null;
  for (const side of order) {
    focus = p.place(focusType, { onSides: [opposite(side)], pref: 'centre', front: 0.6, optional: true });
    if (!focus) continue;
    sofa = p.place('sofa', { onSides: [side], pref: p.sideOf(focus).at, front: 0.5, optional: true });
    if (sofa) break;
    p.remove(focus);
    focus = null;
  }
  if (!sofa) {
    sofa = p.place('sofa', { onSides: order, pref: 'centre', front: 0.5 });
    if (tv) p.missing.push('console');
  }
  if (focus && tv) p.onTop(focus, 'tv', 0.5, 0.05);
  const sofaAt = sofa ? p.sideOf(sofa) : null;
  const sides = sofaAt ? [sofaAt.side, opposite(sofaAt.side)] : order.slice(0, 2);
  const others = p.allSides.filter((name) => !sides.includes(name));

  // Centre table (on a rug) halfway between the sofa and what it faces.
  let middle = null;
  if (sofa) {
    p.beside(sofa, 'side_table', 0.05);
    const f = frontOf(sofa.rotation);
    const target = focus ?? { x: sofa.x + f.x * 2.4, z: sofa.z + f.z * 2.4 };
    middle = { x: (sofa.x + target.x) / 2, z: (sofa.z + target.z) / 2 };
    p.placeAt('coffee_table', middle.x, middle.z, sofa.rotation);
  }
  // Extra seats on the two walls left, one on each.
  const extra = tv ? p.place('loveseat', { onSides: others, pref: 'centre', front: 0.4, optional: true }) : null;
  const used = extra ? p.sideOf(extra)?.side : null;
  p.place('armchair', { onSides: others.filter((name) => name !== used).concat(others), pref: 'centre', front: 0.4, optional: true });
  if (!tv) {
    p.place('armchair', { onSides: others, pref: 'centre', front: 0.4, optional: true });
    p.place('display_cabinet', { onSides: [...others, sides[1]], pref: 'corner', tall: true, front: 0.4 });
  }
  p.place('plant', { onSides: p.allSides, pref: 'corner', optional: true });
  if (sofa) {
    p.hang('painting', { onSides: [sides[0]], pref: sofaAt.at, elevation: 1.4 });
    p.placeAt('rug', middle.x, middle.z, sofa.rotation + Math.PI / 2, { quiet: true, check: false });
  }
  p.hang('air_conditioner_wall', { onSides: [...others, sides[1]], pref: 'centre', elevation: p.acHeight });
}

function dining(p) {
  const { clear } = p.layout;
  const cx = (clear.minX + clear.maxX) / 2;
  const cz = (clear.minZ + clear.maxZ) / 2;
  const alongX = clear.maxX - clear.minX >= clear.maxZ - clear.minZ;
  let table = null;
  if (p.shortSide >= 2.4 && p.longSide >= 3.2) {
    table = p.placeAt('dining_table_long', cx, cz, alongX ? 0 : Math.PI / 2, { quiet: true });
    if (table) {
      // Two chairs along each long side, one at each end.
      for (const [along, across] of [[-0.45, 1], [0.45, 1], [-0.45, -1], [0.45, -1]]) {
        const offset = 0.45 + 0.3;
        const x = alongX ? cx + along : cx + across * offset;
        const z = alongX ? cz + across * offset : cz + along;
        p.placeAt('chair', x, z, alongX ? (across > 0 ? Math.PI : 0) : (across > 0 ? -Math.PI / 2 : Math.PI / 2));
      }
      for (const end of [-1, 1]) {
        const reach = 0.925 + 0.3;
        p.placeAt('chair', alongX ? cx + end * reach : cx, alongX ? cz : cz + end * reach,
          alongX ? (end > 0 ? -Math.PI / 2 : Math.PI / 2) : (end > 0 ? Math.PI : 0), { quiet: true });
      }
    }
  }
  if (!table) {
    table = p.placeAt('round_table', cx, cz, 0);
    if (table) {
      for (const [dx, dz, r] of [[0, 1, Math.PI], [0, -1, 0], [1, 0, -Math.PI / 2], [-1, 0, Math.PI / 2]]) {
        p.placeAt('chair', cx + dx * 0.95, cz + dz * 0.95, r);
      }
    }
  }
  p.place('sideboard', { onSides: p.byLength(p.withoutDoor(p.allSides)), pref: 'centre', optional: true });
}

function carPorch(p) {
  // The car parks along the porch, so only the long walls get anything:
  // planters in their corners, a shoe rack by the door into the house.
  const long = p.byLength(p.allSides).slice(0, 2);
  p.place('terracotta_flower_urn', { onSides: long, pref: 'corner' });
  p.place('terracotta_flower_urn', { onSides: long.slice().reverse(), pref: 'corner', optional: true });
  if (p.layout.doorSide) p.place('shoerack', { onSides: long, pref: 'near', optional: true });
}

function study(p) {
  const desk = p.place('computer_desk', { onSides: [p.far, ...p.across], pref: 'centre', front: 0.8 });
  if (desk) chairAt(p, desk, 'officechair');
  p.place('bookshelf', { onSides: [...p.across, p.doorSide], pref: 'corner', tall: true });
  p.place('bookshelf', { onSides: [...p.across, p.doorSide], pref: 'corner', tall: true, optional: true });
}

function store(p) {
  if (!p.place('bookshelf', { onSides: p.byLength(p.allSides), pref: 'far', tall: true, front: 0.5 })) return;
  for (let i = 0; i < 3; i += 1) {
    if (!p.place('bookshelf', { onSides: p.byLength(p.allSides), pref: 'far', tall: true, front: 0.5, optional: true })) break;
  }
}

function laundry(p) {
  p.place('washing_machine', { onSides: p.byLength(p.withoutDoor(p.allSides)).concat(p.across), pref: 'far', front: 0.6 });
  p.place('cabinet_kitchen', { onSides: p.byLength(p.allSides), pref: 'far', front: 0.6 });
}

function terrace(p) {
  // Plants in the corners and a small sitting set, the rest left open.
  p.place('terracotta_flower_urn', { onSides: p.byLength(p.allSides), pref: 'corner' });
  p.place('terracotta_flower_urn', { onSides: p.byLength(p.allSides), pref: 'corner', optional: true });
  if (p.shortSide >= 2) {
    const { clear } = p.layout;
    const table = p.placeAt('bistro_table', (clear.minX + clear.maxX) / 2, (clear.minZ + clear.maxZ) / 2, 0, { quiet: true });
    if (table) {
      p.placeAt('chair', table.x - 0.6, table.z, Math.PI / 2, { quiet: true });
      p.placeAt('chair', table.x + 0.6, table.z, -Math.PI / 2, { quiet: true });
    }
  }
}

const KITS = {
  bedroom: (p, room) => bedroom(p, { kids: /kids?\b|children|nursery/i.test(room.name || '') }),
  'servant room': (p) => bedroom(p, { servant: true }),
  kitchen,
  bathroom,
  lounge: (p) => lounge(p, { tv: true }),
  'drawing room': (p) => lounge(p, { tv: false }),
  dining,
  'car porch': carPorch,
  study,
  store,
  laundry,
  terrace,
  staircase: (p, room, doc) => flight(p, room, doc)
};

// A straight flight up the long side of an empty stair hall, starting at the
// door end so there is a landing to step onto.
function flight(p, room, doc) {
  const { clear, entry, wallHeight } = p.layout;
  const has = (doc.floorplan.stairs || []).some((s) => (s.floorId ?? room.floorId) === room.floorId
    && pointInRoom(room, s.x, s.z));
  if (has) return;
  const along = clear.maxX - clear.minX > clear.maxZ - clear.minZ ? 'x' : 'z';
  const long = along === 'x' ? clear.maxX - clear.minX : clear.maxZ - clear.minZ;
  const short = along === 'x' ? clear.maxZ - clear.minZ : clear.maxX - clear.minX;
  const run = Math.min(4.5, long - 0.9);
  if (run < 2 || short < 0.8) return;
  const width = Math.min(1.1, short - 0.05);
  const floor = (doc.floorplan.floors || []).find((f) => f.id === room.floorId);
  const height = wallHeight + Number(floor?.floorHeight ?? 0.15);
  // Up, away from the door: the flight sits against the far end.
  const lo = along === 'x' ? clear.minX : clear.minZ;
  const hi = along === 'x' ? clear.maxX : clear.maxZ;
  const door = along === 'x' ? entry.x : entry.z;
  const up = door - lo < hi - door ? 1 : -1;
  const mid = up > 0 ? hi - run / 2 : lo + run / 2;
  const cross = along === 'x' ? (clear.minZ + clear.maxZ) / 2 : (clear.minX + clear.maxX) / 2;
  doc.addStairs({
    id: `stairs_${room.id}`,
    floorId: room.floorId,
    x: round3(along === 'x' ? mid : cross),
    z: round3(along === 'x' ? cross : mid),
    width: round3(width),
    depth: round3(run),
    height: round3(height),
    steps: Math.max(8, Math.round(height / 0.175)),
    subtype: 'straight',
    rotation: round3(along === 'x' ? facing(up, 0) : facing(0, up))
  });
  p.placed.push({ type: 'stairs' });
}

export const FURNISHABLE_KINDS = Object.keys(KITS);

/**
 * Replaces the furniture in a rectangular room with a full set for its kind.
 * @returns {{ kind, placed: string[], missing: string[], removed: number } | null}
 *   null when the kind is unknown.
 */
export function furnishRoom(doc, room, kind = roomKind(room.name)) {
  const kit = KITS[kind];
  if (!kit) return null;
  const before = doc.floorplan.items.length;
  doc.floorplan.items = doc.floorplan.items.filter((item) => item.locked
    || item.floorId !== room.floorId
    || !(item.roomId === room.id || pointInRoom(room, item.x, item.z)));
  const removed = before - doc.floorplan.items.length;
  const p = planner(doc, room);
  kit(p, room, doc);
  return { kind, placed: p.placed.map((item) => item.type), missing: p.missing, removed };
}
