// Bottom status bar for ArchCanvas (embed mode only): current floor, snapping,
// units and the pointer position on the plan, measured from the plot corner.
import { svgToWorld } from './Render2D.js';

const M_PER_FT = 0.3048;

function feetInches(metres) {
  const inches = Math.round(Math.abs(metres) / M_PER_FT * 12);
  return `${metres < 0 ? '-' : ''}${Math.floor(inches / 12)}'-${inches % 12}"`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function initStatusBar(ctx, store) {
  const stage = document.getElementById('stage');
  const svg = document.getElementById('floorplan');
  if (!stage || !svg) return;

  const bar = el('div', 'ac-status-bar');
  bar.setAttribute('role', 'status');
  const floor = el('span', 'ac-status-item');
  const snap = el('button', 'ac-status-item ac-status-toggle');
  snap.type = 'button';
  snap.title = 'Snap to grid and wall ends';
  const units = el('span', 'ac-status-item', 'Units: ft-in');
  const pointer = el('span', 'ac-status-item ac-status-pointer');
  bar.append(floor, snap, units, pointer);
  stage.appendChild(bar);

  function refresh() {
    const current = ctx.testMap.getFloor(ctx.testMap.getCurrentFloorId());
    const name = current?.name || 'Floor';
    floor.textContent = /floor/i.test(name) ? name : `${name} floor`;
    snap.textContent = `Snap ${ctx.snapEnabled ? 'on' : 'off'}`;
    snap.setAttribute('aria-pressed', String(Boolean(ctx.snapEnabled)));
  }

  snap.addEventListener('click', () => {
    document.getElementById('btn-snap-toggle')?.click();
    refresh();
  });

  svg.addEventListener('pointermove', (event) => {
    const matrix = svg.getScreenCTM();
    const plot = ctx.testMap.getEntity('room', 'plot');
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const world = svgToWorld(point.x, point.y);
    const left = plot ? plot.x - plot.width / 2 : 0;
    const top = plot ? plot.z + plot.depth / 2 : 0;
    pointer.textContent = `X ${feetInches(world.x - left)}  Y ${feetInches(top - world.z)}`;
  });
  svg.addEventListener('pointerleave', () => {
    pointer.textContent = '';
  });

  store.on('historyChanged', refresh);
  const floors = document.getElementById('floor-floating-group');
  if (floors) new MutationObserver(refresh).observe(floors, { subtree: true, attributes: true, childList: true });
  document.getElementById('btn-snap-toggle')?.addEventListener('click', () => requestAnimationFrame(refresh));
  refresh();
}
