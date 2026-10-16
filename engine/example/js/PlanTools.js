// ArchCanvas 2D helpers for drawing and checking walls:
// - snapping a wall's ends onto other walls' ends and lines (so corners join),
//   or straight across or down from where the wall started;
// - a live preview of the wall being drawn, with its length;
// - the Measure tool: click two points to read the distance between them;
// - the clear inside width and depth of the selected room;
// - drawing a roof: click two opposite corners to roof just that area.
import { formatLength } from './Units.js';
import { dimension, wallThickness } from './PlanDrawing.js';
import { getRoomVertices } from '../../src/index.js';

const SNAP_PX = 12;
// Within this many degrees of straight, a wall is drawn straight.
const STRAIGHT_DEG = 7;

let measure = { a: null, b: null, hover: null };
let roofDraw = { a: null, hover: null };

const isRoofMode = (mode) => typeof mode === 'string' && mode.startsWith('add-roof');

function unitScale(r) {
  return Math.abs(r.worldToSvg(1, 0).x - r.worldToSvg(0, 0).x) || 1;
}

function straightAxis(start, p) {
  const angle = Math.abs(Math.atan2(p[1] - start[1], p[0] - start[0]) * 180 / Math.PI);
  if (angle < STRAIGHT_DEG || angle > 180 - STRAIGHT_DEG) return 'x';
  if (Math.abs(angle - 90) < STRAIGHT_DEG) return 'z';
  return null;
}

function straightOnto(start, p, a, b) {
  const axis = straightAxis(start, p);
  if (!axis) return null;
  // Moving along x keeps z = start z, and the other way round.
  const k = axis === 'x' ? 1 : 0;
  const span = b[k] - a[k];
  if (Math.abs(span) < 1e-9) return null;
  const t = (start[k] - a[k]) / span;
  if (t < 0 || t > 1) return null;
  const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  point[k] = start[k];
  return point;
}

function projectOnSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz;
  if (len2 < 1e-9) return null;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / len2;
  if (t < 0 || t > 1) return null;
  return [a[0] + dx * t, a[1] + dz * t];
}

/**
 * Where a click lands when drawing or measuring: a wall end first, then a
 * point on a wall (its centre line, or its faces with `faces`), then straight
 * across or down from `start`, else the grid.
 * @returns {{point:[number,number], kind:'end'|'wall'|'straight'|'grid'}}
 */
export function snapPlanPoint(r, world, start = null, { faces = false } = {}) {
  const tol = SNAP_PX / unitScale(r);
  const p = [world.x, world.z];
  const walls = r.ctx.currentWalls();
  let best = null;
  const offer = (point, kind, rank) => {
    const d = Math.hypot(point[0] - p[0], point[1] - p[1]);
    if (d > tol) return;
    if (!best || rank < best.rank || (rank === best.rank && d < best.d)) best = { point, kind, rank, d };
  };
  for (const wall of walls) {
    const t = faces ? wallThickness(r, wall) / 2 : 0;
    const len = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]) || 1;
    const n = [-(wall.to[1] - wall.from[1]) / len, (wall.to[0] - wall.from[0]) / len];
    for (const off of faces ? [0, t, -t] : [0]) {
      const a = [wall.from[0] + n[0] * off, wall.from[1] + n[1] * off];
      const b = [wall.to[0] + n[0] * off, wall.to[1] + n[1] * off];
      offer(a, 'end', 0);
      offer(b, 'end', 0);
      const on = projectOnSegment(p, a, b);
      if (on) offer(on, 'wall', 1);
      // Where a straight line from the start meets this wall, so a wall
      // drawn up to another one stays square to it.
      const square = start && straightOnto(start, p, a, b);
      if (square) offer(square, 'wall', 0.5);
    }
  }
  if (best) return { point: best.point.map((v) => Number(v.toFixed(3))), kind: best.kind };
  const axis = start && straightAxis(start, p);
  if (axis) {
    const grid = r.ctx.snapWorldPoint(world);
    if (axis === 'x') return { point: [Number(grid.x.toFixed(3)), start[1]], kind: 'straight' };
    return { point: [start[0], Number(grid.z.toFixed(3))], kind: 'straight' };
  }
  const grid = r.ctx.snapWorldPoint(world);
  return { point: [grid.x, grid.z], kind: 'grid' };
}

function overlay(r) {
  r.ctx.svg.querySelector('.plan-tool-overlay')?.remove();
  const layer = r.createSvgElement('g', { class: 'plan-tool-overlay', style: 'pointer-events:none' });
  r.ctx.svg.appendChild(layer);
  return layer;
}

function lengthLine(r, layer, a, b, colour) {
  const pa = r.worldToSvg(a[0], a[1]);
  const pb = r.worldToSvg(b[0], b[1]);
  layer.appendChild(r.createSvgElement('line', { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, stroke: colour, 'stroke-width': 2, 'stroke-dasharray': '6,4' }));
  for (const p of [pa, pb]) layer.appendChild(r.createSvgElement('circle', { cx: p.x, cy: p.y, r: 4, fill: '#ffffff', stroke: colour, 'stroke-width': 2 }));
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (length < 0.01) return;
  const label = formatLength(length);
  const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
  const w = label.length * 7 + 12;
  layer.appendChild(r.createSvgElement('rect', { x: mid.x - w / 2, y: mid.y - 22, width: w, height: 18, rx: 4, fill: colour }));
  const text = r.createSvgElement('text', { x: mid.x, y: mid.y - 9, 'text-anchor': 'middle', fill: '#ffffff', 'font-size': 12, 'font-family': 'IBM Plex Mono, monospace' });
  text.textContent = label;
  layer.appendChild(text);
}

function snapMarker(r, layer, snap) {
  if (snap.kind === 'grid') return;
  const p = r.worldToSvg(snap.point[0], snap.point[1]);
  const colour = '#1E5AA8';
  if (snap.kind === 'end') layer.appendChild(r.createSvgElement('rect', { x: p.x - 6, y: p.y - 6, width: 12, height: 12, fill: 'none', stroke: colour, 'stroke-width': 2 }));
  else layer.appendChild(r.createSvgElement('circle', { cx: p.x, cy: p.y, r: 6, fill: 'none', stroke: colour, 'stroke-width': 2 }));
}

/** While drawing a wall or measuring: the line to the pointer and its length. */
export function updatePlanToolPreview(r, event) {
  const mode = r.ctx.mode;
  if (mode !== 'draw-wall' && mode !== 'measure' && !isRoofMode(mode)) return;
  const point = r.ctx.svgPointFromEvent(event);
  const world = r.ctx.svgToWorld(point.x, point.y);
  if (isRoofMode(mode)) {
    roofDraw.hover = snapPlanPoint(r, world, null, { faces: true });
    drawRoofPreview(r);
    return;
  }
  if (mode === 'draw-wall') {
    const start = r.ctx.getDrawStart?.() ?? r.ctx.drawStart ?? null;
    const snap = snapPlanPoint(r, world, start);
    const layer = overlay(r);
    if (start) lengthLine(r, layer, start, snap.point, '#13202C');
    snapMarker(r, layer, snap);
    return;
  }
  const start = measure.a && !measure.b ? measure.a : null;
  measure.hover = snapPlanPoint(r, world, start, { faces: true });
  drawMeasure(r);
}

/** A click with the Measure tool: the first point, then the second. */
export function measureClick(r, event) {
  const point = r.ctx.svgPointFromEvent(event);
  const world = r.ctx.svgToWorld(point.x, point.y);
  const start = measure.a && !measure.b ? measure.a : null;
  const snap = snapPlanPoint(r, world, start, { faces: true });
  if (!start) measure = { a: snap.point, b: null, hover: null };
  else measure.b = snap.point;
  drawMeasure(r);
}

/**
 * A click with a roof tool: the first corner, then the opposite corner,
 * which adds a roof over just that rectangle. Returns the new roof's
 * size, or null while waiting for the second corner.
 */
export function roofClick(r, event) {
  const point = r.ctx.svgPointFromEvent(event);
  const world = r.ctx.svgToWorld(point.x, point.y);
  const snap = snapPlanPoint(r, world, null, { faces: true });
  if (!roofDraw.a) {
    roofDraw = { a: snap.point, hover: snap };
    drawRoofPreview(r);
    return null;
  }
  const [ax, az] = roofDraw.a;
  const [bx, bz] = snap.point;
  if (Math.abs(bx - ax) < 0.5 || Math.abs(bz - az) < 0.5) return null;
  roofDraw = { a: null, hover: null };
  return {
    x: Number(((ax + bx) / 2).toFixed(3)),
    z: Number(((az + bz) / 2).toFixed(3)),
    width: Number(Math.abs(bx - ax).toFixed(3)),
    depth: Number(Math.abs(bz - az).toFixed(3))
  };
}

function drawRoofPreview(r) {
  if (!isRoofMode(r.ctx.mode)) return;
  const layer = overlay(r);
  const { a, hover } = roofDraw;
  if (a && hover) {
    const b = hover.point;
    const pa = r.worldToSvg(a[0], a[1]);
    const pb = r.worldToSvg(b[0], b[1]);
    const colour = '#1E5AA8';
    layer.appendChild(r.createSvgElement('rect', {
      x: Math.min(pa.x, pb.x), y: Math.min(pa.y, pb.y),
      width: Math.abs(pb.x - pa.x), height: Math.abs(pb.y - pa.y),
      fill: colour, 'fill-opacity': 0.12, stroke: colour, 'stroke-width': 2, 'stroke-dasharray': '6,4'
    }));
    const label = `Roof ${formatLength(Math.abs(b[0] - a[0]))} × ${formatLength(Math.abs(b[1] - a[1]))}`;
    const w = label.length * 7 + 12;
    const cx = (pa.x + pb.x) / 2;
    const cy = Math.min(pa.y, pb.y);
    layer.appendChild(r.createSvgElement('rect', { x: cx - w / 2, y: cy - 24, width: w, height: 18, rx: 4, fill: colour }));
    const text = r.createSvgElement('text', { x: cx, y: cy - 11, 'text-anchor': 'middle', fill: '#ffffff', 'font-size': 12, 'font-family': 'IBM Plex Mono, monospace' });
    text.textContent = label;
    layer.appendChild(text);
  }
  if (hover) {
    snapMarker(r, layer, hover);
    const p = r.worldToSvg(hover.point[0], hover.point[1]);
    const hint = a ? 'Click the opposite corner' : 'Click a corner of the roof';
    const text = r.createSvgElement('text', { x: p.x + 12, y: p.y + 22, fill: '#13202C', 'font-size': 11, 'paint-order': 'stroke', stroke: '#ffffff', 'stroke-width': 3 });
    text.textContent = hint;
    layer.appendChild(text);
  }
}

export function clearRoofDraw() {
  roofDraw = { a: null, hover: null };
}

export function clearMeasure() {
  measure = { a: null, b: null, hover: null };
}

function drawMeasure(r) {
  if (r.ctx.mode !== 'measure') return;
  const layer = overlay(r);
  if (measure.a && measure.b) lengthLine(r, layer, measure.a, measure.b, '#B2441C');
  else if (measure.a && measure.hover) lengthLine(r, layer, measure.a, measure.hover.point, '#B2441C');
  if (measure.hover) snapMarker(r, layer, measure.hover);
}

/** Called after each 2D render: the measurement, and the selected room's inside sizes. */
export function renderPlanTools(r) {
  if (r.ctx.mode !== 'measure') clearMeasure();
  if (!isRoofMode(r.ctx.mode)) clearRoofDraw();
  drawMeasure(r);
  drawRoofPreview(r);
  const room = r.ctx.selectedRoomId ? r.ctx.testMap.getEntity('room', r.ctx.selectedRoomId) : null;
  if (room && room.id !== 'plot') renderInsideSizes(r, room);
}

// Clear width and depth between the wall faces, drawn inside the room.
function renderInsideSizes(r, room) {
  const vertices = getRoomVertices(room);
  if (vertices.length !== 4) return;
  const xs = vertices.map((v) => v.x);
  const zs = vertices.map((v) => v.z);
  const box = { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  // Only a plain rectangle, not a rotated or odd-shaped room.
  const onBox = vertices.every((v) => (Math.abs(v.x - box.minX) < 1e-3 || Math.abs(v.x - box.maxX) < 1e-3)
    && (Math.abs(v.z - box.minZ) < 1e-3 || Math.abs(v.z - box.maxZ) < 1e-3));
  if (!onBox) return;
  const t = wallThickness(r, null) / 2;
  const minX = box.minX + t;
  const maxX = box.maxX - t;
  const minZ = box.minZ + t;
  const maxZ = box.maxZ - t;
  if (maxX - minX < 0.3 || maxZ - minZ < 0.3) return;
  const layer = r.createSvgElement('g', { class: 'plan-dimensions plan-inside-sizes', style: 'pointer-events:none' });
  const P = (x, z) => r.worldToSvg(x, z);
  // Run the lines just inside the top and left walls, clear of the
  // room's name in the middle.
  const z = maxZ - Math.min(0.3, (maxZ - minZ) * 0.15);
  const x = minX + Math.min(0.3, (maxX - minX) * 0.15);
  dimension(r, layer, P(minX, z), P(maxX, z), 0, formatLength(maxX - minX));
  dimension(r, layer, P(x, minZ), P(x, maxZ), 0, formatLength(maxZ - minZ));
  r.ctx.svg.appendChild(layer);
}
