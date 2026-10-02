// Architectural 2D plan for ArchCanvas (embed mode only).
// The plan shows what a drawn floor plan shows: walls at their real thickness,
// door swings, window symbols, each room's clear inside size, and outside
// dimension lines (chains and overall sizes for the house and the plot). Furniture and
// other items stay in 3D unless the person turns them on from the status bar.
import { getRoomVertices } from '../../src/index.js';
import { formatLength } from './Units.js';

const PLAN_INK = '#13202c';
const DIM_INK = '#4a5867';
const GAP_FILL = '#ffffff';

let enabled = false;
let showItems = false;

export function enablePlanDrawing() {
  enabled = true;
}

export function isPlanDrawing() {
  return enabled;
}

/** Whether furniture and other items are drawn on the 2D plan. */
export function itemsOnPlan() {
  return !enabled || showItems;
}

export function setItemsOnPlan(value) {
  showItems = !!value;
}

function unitScale(r) {
  return Math.abs(r.worldToSvg(1, 0).x - r.worldToSvg(0, 0).x);
}

export function wallThickness(r, wall) {
  return Math.max(0.05, Number(wall?.thickness ?? r.ctx.testMap.getProjectMetadata?.()?.wallThickness ?? 0.23));
}

/** Stroke width for a wall line so it is drawn at its real thickness. */
export function wallStrokeStyle(r, wall) {
  return `stroke-width:${Math.max(2, wallThickness(r, wall) * unitScale(r))}px`;
}

function toSvg(r, p) {
  return r.worldToSvg(p.x, p.z);
}

function line(r, parent, a, b, attrs = {}) {
  parent.appendChild(r.createSvgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, ...attrs }));
}

function polygon(r, parent, points, attrs = {}) {
  parent.appendChild(r.createSvgElement('polygon', {
    points: points.map((p) => `${p.x},${p.y}`).join(' '),
    ...attrs
  }));
}

/** Door swings and window symbols, drawn over the wall lines. */
export function renderOpeningSymbols(r) {
  const layer = r.createSvgElement('g', { class: 'plan-openings', style: 'pointer-events:none' });
  const thin = { stroke: PLAN_INK, 'stroke-width': 1, fill: 'none' };
  for (const opening of r.ctx.currentOpenings()) {
    const wall = r.ctx.testMap.getEntity('wall', opening.wallId);
    if (!wall) continue;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const length = Math.hypot(x2 - x1, z2 - z1) || 1;
    const u = { x: (x2 - x1) / length, z: (z2 - z1) / length };
    const n = { x: -u.z, z: u.x };
    const half = Math.min(length, Number(opening.width) || 1) / 2;
    const mid = (opening.t ?? 0.5) * length;
    const at = (along, across) => ({ x: x1 + u.x * along + n.x * across, z: z1 + u.z * along + n.z * across });
    const t = wallThickness(r, wall) / 2;
    const s0 = mid - half;
    const s1 = mid + half;

    // Clear the wall where the opening is, with a jamb line at each side.
    polygon(r, layer, [at(s0, -t - 0.01), at(s1, -t - 0.01), at(s1, t + 0.01), at(s0, t + 0.01)].map((p) => toSvg(r, p)), { fill: GAP_FILL, stroke: 'none' });
    line(r, layer, toSvg(r, at(s0, -t)), toSvg(r, at(s0, t)), thin);
    line(r, layer, toSvg(r, at(s1, -t)), toSvg(r, at(s1, t)), thin);

    if (opening.type !== 'door') {
      // Window: the frame across the wall with the glass line in the middle.
      line(r, layer, toSvg(r, at(s0, -t)), toSvg(r, at(s1, -t)), thin);
      line(r, layer, toSvg(r, at(s0, t)), toSvg(r, at(s1, t)), thin);
      line(r, layer, toSvg(r, at(s0, 0)), toSvg(r, at(s1, 0)), thin);
      continue;
    }

    // Door: leaf drawn open at 90 degrees with its swing arc. The side and
    // hinge follow the 3D door (isFlippedIO / isFlippedLR).
    const side = opening.isFlippedIO ? -1 : 1;
    const leaves = opening.doubleDoor
      ? [{ hinge: s0, tip: mid }, { hinge: s1, tip: mid }]
      : [opening.isFlippedLR ? { hinge: s1, tip: s0 } : { hinge: s0, tip: s1 }];
    for (const leaf of leaves) {
      const radius = Math.abs(leaf.tip - leaf.hinge);
      const face = side * t;
      const hinge = at(leaf.hinge, face);
      const open = at(leaf.hinge, face + side * radius);
      line(r, layer, toSvg(r, hinge), toSvg(r, open), { stroke: PLAN_INK, 'stroke-width': 1.6 });
      const points = [];
      for (let i = 0; i <= 18; i += 1) {
        const angle = (Math.PI / 2) * (i / 18);
        const along = leaf.hinge + Math.sign(leaf.tip - leaf.hinge) * radius * Math.sin(angle);
        points.push(toSvg(r, at(along, face + side * radius * Math.cos(angle))));
      }
      layer.appendChild(r.createSvgElement('polyline', {
        points: points.map((p) => `${p.x},${p.y}`).join(' '),
        ...thin,
        'stroke-width': 0.8
      }));
    }
  }
  r.ctx.svg.appendChild(layer);
}

// A dimension line between two plan points (svg units), pushed `offset` units
// to the left of a -> b, with extension lines, tick marks and its label.
function dimension(r, parent, a, b, offset, label) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const nx = dy / len;
  const ny = -dx / len;
  const pa = { x: a.x + nx * offset, y: a.y + ny * offset };
  const pb = { x: b.x + nx * offset, y: b.y + ny * offset };
  const ink = { stroke: DIM_INK, 'stroke-width': 0.7 };
  const gap = Math.sign(offset) * 3;
  const over = Math.sign(offset) * 4;
  line(r, parent, { x: a.x + nx * gap, y: a.y + ny * gap }, { x: pa.x + nx * over, y: pa.y + ny * over }, ink);
  line(r, parent, { x: b.x + nx * gap, y: b.y + ny * gap }, { x: pb.x + nx * over, y: pb.y + ny * over }, ink);
  line(r, parent, pa, pb, ink);
  const tick = (p) => line(r, parent,
    { x: p.x - (dx / len + nx) * 3, y: p.y - (dy / len + ny) * 3 },
    { x: p.x + (dx / len + nx) * 3, y: p.y + (dy / len + ny) * 3 },
    { stroke: DIM_INK, 'stroke-width': 1.2 });
  tick(pa);
  tick(pb);

  const text = r.createSvgElement('text', {
    class: 'plan-dimension-label',
    x: (pa.x + pb.x) / 2,
    y: (pa.y + pb.y) / 2,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle'
  });
  text.textContent = label;
  // Labels read left to right or bottom to top, set on a white band.
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle >= 90 || angle < -90) angle += 180;
  text.setAttribute('transform', `rotate(${angle} ${(pa.x + pb.x) / 2} ${(pa.y + pb.y) / 2})`);
  parent.appendChild(text);
}

function labelFits(lengthPx, label) {
  return lengthPx >= label.length * 5.6 + 10;
}

// Axis-aligned rectangle of a room's wall centre lines, or null.
function roomBox(room) {
  const vertices = getRoomVertices(room);
  if (vertices.length !== 4) return null;
  const xs = vertices.map((v) => v.x);
  const zs = vertices.map((v) => v.z);
  const box = { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  const onEdge = vertices.every((v) => (Math.abs(v.x - box.minX) < 1e-3 || Math.abs(v.x - box.maxX) < 1e-3)
    && (Math.abs(v.z - box.minZ) < 1e-3 || Math.abs(v.z - box.maxZ) < 1e-3));
  return onEdge ? box : null;
}

function uniqueSorted(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1] > 0.02);
}

/** A room's clear inside size (between wall faces), or '' if not a rectangle. */
export function roomClearSize(r, room) {
  const box = roomBox(room);
  if (!box) return '';
  const t = wallThickness(r, null);
  return `${formatLength(box.maxX - box.minX - t)} × ${formatLength(box.maxZ - box.minZ - t)}`;
}

/** Outside dimension lines for the house and the plot on the current floor. */
export function renderDimensions(r) {
  const layer = r.createSvgElement('g', { class: 'plan-dimensions', style: 'pointer-events:none' });
  const t = wallThickness(r, null);
  const ht = t / 2;
  const P = (x, z) => r.worldToSvg(x, z);
  const rooms = r.ctx.currentRooms().map((room) => ({ room, box: roomBox(room) })).filter((entry) => entry.box);
  const plot = rooms.find((entry) => entry.room.id === 'plot');
  const house = rooms.filter((entry) => entry.room.id !== 'plot');

  // Outside: a chain at each room wall and the overall size, above and to the
  // left of the house.
  if (house.length) {
    const minX = Math.min(...house.map((e) => e.box.minX)) - ht;
    const maxX = Math.max(...house.map((e) => e.box.maxX)) + ht;
    const minZ = Math.min(...house.map((e) => e.box.minZ)) - ht;
    const maxZ = Math.max(...house.map((e) => e.box.maxZ)) + ht;
    // Chains use the walls that meet the top and the left side.
    const onTop = house.filter((e) => Math.abs(e.box.maxZ + ht - maxZ) < 0.02);
    const onLeft = house.filter((e) => Math.abs(e.box.minX - ht - minX) < 0.02);
    const xs = uniqueSorted([minX, maxX, ...onTop.flatMap((e) => [e.box.minX, e.box.maxX]).filter((x) => x - minX > ht + 0.02 && maxX - x > ht + 0.02)]);
    const zs = uniqueSorted([minZ, maxZ, ...onLeft.flatMap((e) => [e.box.minZ, e.box.maxZ]).filter((z) => z - minZ > ht + 0.02 && maxZ - z > ht + 0.02)]);
    if (xs.length > 2) {
      for (let i = 0; i < xs.length - 1; i += 1) {
        const label = formatLength(xs[i + 1] - xs[i]);
        const a = P(xs[i], maxZ);
        const b = P(xs[i + 1], maxZ);
        if (labelFits(Math.abs(b.x - a.x), label)) dimension(r, layer, a, b, 18, label);
      }
    }
    dimension(r, layer, P(minX, maxZ), P(maxX, maxZ), xs.length > 2 ? 36 : 18, formatLength(maxX - minX));
    if (zs.length > 2) {
      for (let i = 0; i < zs.length - 1; i += 1) {
        const label = formatLength(zs[i + 1] - zs[i]);
        const a = P(minX, zs[i]);
        const b = P(minX, zs[i + 1]);
        if (labelFits(Math.abs(b.y - a.y), label)) dimension(r, layer, a, b, 18, label);
      }
    }
    dimension(r, layer, P(minX, minZ), P(minX, maxZ), zs.length > 2 ? 36 : 18, formatLength(maxZ - minZ));
  }

  // The plot: its boundary size (wall centre lines) below and to the right.
  if (plot) {
    const { box } = plot;
    dimension(r, layer, P(box.maxX, box.minZ - ht), P(box.minX, box.minZ - ht), 18, formatLength(box.maxX - box.minX));
    dimension(r, layer, P(box.maxX + ht, box.maxZ), P(box.maxX + ht, box.minZ), 18, formatLength(box.maxZ - box.minZ));
  }
  r.ctx.svg.appendChild(layer);
}
