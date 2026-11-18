// Bottom status bar for ArchCanvas (embed mode only): current floor, snapping,
// units and the pointer position on the plan, measured from the plot corner.
import { BRICK_THICKNESS } from '../../src/index.js';
import { svgToWorld } from './Render2D.js';
import { itemsOnPlan, setItemsOnPlan } from './PlanDrawing.js';

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
  const items = el('button', 'ac-status-item ac-status-toggle');
  items.type = 'button';
  items.title = 'Show furniture and other items on the 2D plan';
  const units = el('span', 'ac-status-item', 'Units: ft-in');
  // Room wall thickness for the whole plan: double (9 in) or single (4.5 in) brick.
  const brickSelect = (label, title) => {
    const wrap = el('label', 'ac-status-item ac-status-select', label);
    wrap.title = title;
    const select = el('select');
    for (const [value, text] of [['double', '9 in'], ['single', '4.5 in']]) {
      const option = el('option', null, text);
      option.value = value;
      select.appendChild(option);
    }
    wrap.appendChild(select);
    return { wrap, select };
  };
  const outside = brickSelect('Outside walls', 'Outside walls: double brick (9 in) or single brick (4.5 in)');
  const inside = brickSelect('Inside walls', 'Walls between rooms: single brick (4.5 in) or double brick (9 in)');
  const lineUp = el('button', 'ac-status-item ac-status-toggle', 'Line up rooms');
  lineUp.type = 'button';
  lineUp.title = 'Move every room on this floor onto the 1 ft grid, so rooms that nearly touch share one wall';
  const pointer = el('span', 'ac-status-item ac-status-pointer');
  bar.append(floor, snap, items, outside.wrap, inside.wrap, lineUp, units, pointer);
  stage.appendChild(bar);

  const brickOf = (thickness) => (Math.abs(thickness - BRICK_THICKNESS.single) < 0.01 ? 'single' : 'double');
  const afterChange = () => {
    ctx.refreshShadows?.();
    ctx.updateEditor?.();
    ctx.renderPlan();
    refresh();
  };
  const setThickness = (key, value) => {
    ctx.pushHistory();
    ctx.testMap.setRoomWallThickness({ [key]: BRICK_THICKNESS[value] });
    afterChange();
  };
  outside.select.addEventListener('change', () => setThickness('outside', outside.select.value));
  inside.select.addEventListener('change', () => setThickness('inside', inside.select.value));
  lineUp.addEventListener('click', () => {
    const plot = ctx.testMap.getEntity('room', 'plot');
    const origin = plot ? { x: plot.x - plot.width / 2, z: plot.z - plot.depth / 2 } : { x: 0, z: 0 };
    ctx.pushHistory();
    const moved = ctx.testMap.lineUpRooms(ctx.testMap.getCurrentFloorId(), M_PER_FT, origin);
    afterChange();
    ctx.showToast?.(moved ? `Lined up ${moved} room${moved === 1 ? '' : 's'} on the 1 ft grid.` : 'All rooms are already on the grid.');
  });

  function refresh() {
    const current = ctx.testMap.getFloor(ctx.testMap.getCurrentFloorId());
    const name = current?.name || 'Floor';
    floor.textContent = /floor/i.test(name) ? name : `${name} floor`;
    snap.textContent = `Snap 1 ft: ${ctx.snapEnabled ? 'on' : 'off'}`;
    const meta = ctx.testMap.getProjectMetadata?.() || {};
    outside.select.value = brickOf(Number(meta.outsideWallThickness) || BRICK_THICKNESS.double);
    inside.select.value = brickOf(Number(meta.insideWallThickness) || BRICK_THICKNESS.single);
    snap.setAttribute('aria-pressed', String(Boolean(ctx.snapEnabled)));
    items.textContent = `Furniture on plan: ${itemsOnPlan() ? 'on' : 'off'}`;
    items.setAttribute('aria-pressed', String(itemsOnPlan()));
  }

  items.addEventListener('click', () => {
    setItemsOnPlan(!itemsOnPlan());
    ctx.renderPlan();
    refresh();
  });

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
