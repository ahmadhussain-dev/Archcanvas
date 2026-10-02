// 2D, 3D and Split views for ArchCanvas (embed mode only).
// The editor itself only knows one active view at a time (Context.currentView).
// Split shows both cards side by side and makes whichever pane the pointer
// enters the active one, while the 3D render loop keeps running and the plan
// is redrawn after every change, so both panes stay in step.

let mode = '2d';
let stage = null;
let ctx = null;

function keep3DRunning() {
  ctx.viewer3d.prepareFor3D();
  requestAnimationFrame(() => ctx.engine.resize());
}

function activate(view) {
  if (ctx.currentView !== view) ctx.setView(view);
  if (view === '2d') keep3DRunning();
  else ctx.renderPlan();
}

// Point the 3D camera at the whole plan, sized to the pane's shape.
function frameHouse() {
  const rooms = ctx.testMap.getEntities('room') || [];
  if (!rooms.length) {
    ctx.viewer3d.resetCamera();
    return;
  }
  let minX = Infinity; let maxX = -Infinity; let minZ = Infinity; let maxZ = -Infinity;
  for (const r of rooms) {
    minX = Math.min(minX, r.x - r.width / 2); maxX = Math.max(maxX, r.x + r.width / 2);
    minZ = Math.min(minZ, r.z - r.depth / 2); maxZ = Math.max(maxZ, r.z + r.depth / 2);
  }
  const camera = ctx.viewer3d.camera;
  const span = Math.hypot(maxX - minX, maxZ - minZ);
  const aspect = ctx.engine.getAspectRatio(camera);
  const fit = span / (2 * Math.tan(camera.fov / 2)) / Math.min(1, aspect);
  camera.setTarget(new camera.target.constructor((minX + maxX) / 2, 0, (minZ + maxZ) / 2));
  camera.alpha = -Math.PI / 3;
  camera.beta = Math.PI / 3;
  camera.radius = fit * 1.4;
}

function relayout() {
  requestAnimationFrame(() => {
    ctx.engine.resize();
    // The 3D pane changed shape, so frame the house again.
    if (mode !== '2d') frameHouse();
    ctx.renderPlan();
  });
}

/** Switch to '2d', '3d' or 'split'. */
export function setEmbedView(view) {
  if (!stage || !['2d', '3d', 'split'].includes(view)) return;
  mode = view;
  stage.dataset.split = String(view === 'split');
  if (view === 'split') {
    // Build the 3D scene once, then start with the plan as the active pane.
    if (ctx.currentView !== '3d') ctx.setView('3d');
    activate('2d');
  } else {
    ctx.setView(view);
  }
  relayout();
}

export function getEmbedView() {
  return mode;
}

export function initSplitView(appContext, store) {
  ctx = appContext;
  stage = document.getElementById('stage');
  const planCard = stage?.querySelector('[data-view-card="2d"]');
  const canvasCard = stage?.querySelector('[data-view-card="3d"]');
  if (!stage || !planCard || !canvasCard) return;

  planCard.addEventListener('pointerenter', () => {
    if (mode === 'split' && ctx.currentView !== '2d') activate('2d');
  });
  canvasCard.addEventListener('pointerenter', () => {
    if (mode === 'split' && ctx.currentView !== '3d') activate('3d');
  });
  // Edits made in the 3D pane show up on the plan straight away.
  store.on('historyChanged', () => {
    if (mode === 'split' && ctx.currentView === '3d') requestAnimationFrame(() => ctx.renderPlan());
  });
}
