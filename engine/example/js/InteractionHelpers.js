import { Topology } from '../../src/index.js';
import { svgPointFromEvent, svgToWorld } from './Render2D.js';
import { snapNumber } from './ViewController.js';

let Context = null;

export function initInteractionHelpers(appState) { Context = appState; }

export function getStructure(type, id) {
  if (type === 'roof') return Context.testMap.getEntity('roof', id);
  if (type === 'stairs') return Context.testMap.getEntity('stairs', id);
  if (type === 'fence') return Context.testMap.getEntity('fence', id);
  return null;
}

export function updateStructure(type, id, patch, rebuild = true) {
  return Context.testMap.executeCommand('updateStructure', { type, id, patch, rebuild });
}

export function moveStructureTo(type, id, x, z, options = {}) {
  const structure = getStructure(type, id);
  if (structure?.locked) return;
  const width = structure?.width || (type === 'stairs' ? 1.2 : 4);
  const depth = structure?.depth || (type === 'stairs' ? 3.2 : 4);
  const nextX = Number((snapNumber(x - width / 2) + width / 2).toFixed(3));
  const nextZ = Number((snapNumber(z - depth / 2) + depth / 2).toFixed(3));
  const rebuild = options.rebuild !== false;
  if (rebuild) updateStructure(type, id, { x: nextX, z: nextZ }, true);
  else Context.testMap.updateEntityPreview(type, id, { x: nextX, z: nextZ });
  if (rebuild || options.refresh !== false) Context.refreshShadows();
  Context.updateEditor();
  if (Context.currentView !== '3d') Context.renderPlan();
}

export function beginRoofResize(event, roofId, side) {
  if (event.button === 2 || Context.mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  Context.selectRoof(roofId);
  const roof = Context.testMap.getEntity('roof', roofId);
  if (!roof || roof.locked) return;
  const original = { x: roof.x || 0, z: roof.z || 0, width: roof.width || 6, depth: roof.depth || 6 };
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  Context.roofResizeState = {
    roofId, side, original,
    offsetX: side === 'west' ? original.x - original.width / 2 - world.x : side === 'east' ? original.x + original.width / 2 - world.x : 0,
    offsetZ: side === 'north' ? original.z + original.depth / 2 - world.z : side === 'south' ? original.z - original.depth / 2 - world.z : 0,
    historyPushed: false
  };
  Context.svg.setPointerCapture(event.pointerId);
}

export function moveRoofResize(event) {
  const state = Context.roofResizeState;
  if (!state) return;
  const roof = Context.testMap.getEntity('roof', state.roofId);
  if (!roof || roof.locked) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  const { original, side } = state;
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  const patch = { ...original };
  if (side === 'west') {
    const edge = Math.min(snapNumber(world.x + state.offsetX), right - 1);
    patch.width = snapNumber(right - edge); patch.x = right - patch.width / 2;
  } else if (side === 'east') {
    const edge = Math.max(snapNumber(world.x + state.offsetX), left + 1);
    patch.width = snapNumber(edge - left); patch.x = left + patch.width / 2;
  } else if (side === 'north') {
    const edge = Math.max(snapNumber(world.z + state.offsetZ), top + 1);
    patch.depth = snapNumber(edge - top); patch.z = top + patch.depth / 2;
  } else if (side === 'south') {
    const edge = Math.min(snapNumber(world.z + state.offsetZ), bottom - 1);
    patch.depth = snapNumber(bottom - edge); patch.z = bottom - patch.depth / 2;
  }
  if (!state.historyPushed && (Math.abs(patch.width - original.width) > 0.02 || Math.abs(patch.depth - original.depth) > 0.02)) {
    Context.pushHistory(); state.historyPushed = true;
  }
  Context.testMap.updateRoof?.(roof.id, patch);
  Context.refreshShadows(); Context.updateEditor(); Context.renderPlan();
}

export function finishRoofResize() { Context.roofResizeState = null; }
export function rememberPointer(event) {
  Context.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY, targetItemId: event.target.closest?.('[data-item-id]')?.dataset.itemId || Context.selectedItemId });
}
export function updatePointer(event) {
  const pointer = Context.activePointers.get(event.pointerId);
  if (pointer) Object.assign(pointer, { x: event.clientX, y: event.clientY });
}
export function forgetPointer(event) { Context.activePointers.delete(event.pointerId); }
export function pointerDistance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
export function pointerAngle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
export function getShelfLayerHeights(bookshelf) { return Topology.getShelfLayerHeights(bookshelf, (type) => Context.testMap.getFurnitureDefinition(type)); }
export function getItemsCountOnBookshelf(bookshelf, items) { return Topology.getItemsCountOnBookshelf(bookshelf, items, (type) => Context.testMap.getFurnitureDefinition(type)); }
export function moveItemTo(itemId, x, z, placementHint) { return Context.entityManager.moveItemTo(itemId, x, z, false, placementHint); }

export function findMetadataFromNode(node, key) {
  for (let current = node; current; current = current.parent) if (current.metadata?.[key]) return current.metadata[key];
  return null;
}
export function findRoofComponentIdFromNode(node) {
  for (let current = node; current; current = current.parent) {
    if (current.name?.includes('roof_side')) return 'side';
    if (current.name?.includes('roof_bottom')) return 'bottom';
    if (current.name?.includes('roof_top')) return 'top';
  }
  return null;
}
export const findOpeningIdFromNode = (node) => findMetadataFromNode(node, 'blueprintOpeningId');
export const findItemIdFromNode = (node) => findMetadataFromNode(node, 'blueprintItemId');
export const findWallIdFromNode = (node) => findMetadataFromNode(node, 'blueprintWallId');
export const findRoomIdFromNode = (node) => findMetadataFromNode(node, 'blueprintRoomId');
export const findStairsIdFromNode = (node) => findMetadataFromNode(node, 'blueprintStairsId');
export const findFenceIdFromNode = (node) => findMetadataFromNode(node, 'blueprintFenceId');
export const findFenceGateIdFromNode = (node) => findMetadataFromNode(node, 'blueprintFenceGateId');
export function findRoofIdFromNode(node) {
  const id = findMetadataFromNode(node, 'blueprintRoofId');
  const roof = id ? Context.testMap.getEntity('roof', id) : null;
  return roof && Context.testMap.getFloor(roof.floorId)?.hideRoof ? null : id;
}
export function groundPointFromPointer() { return Context.viewer3d.groundPointFromPointer(Context.testMap.getFloorElevation?.(Context.testMap.getCurrentFloorId()) || 0); }
export function wallPointFromPointer() {
  return Context.viewer3d.wallPointFromPointer(Context.currentWalls(), {
    floorY: Context.testMap.getFloorElevation?.(Context.testMap.getCurrentFloorId()) || 0,
    wallHeight: Number(Context.testMap.getProjectMetadata().wallHeight || 2.8)
  });
}
export function findWallSideFromNode(node) {
  for (let current = node; current; current = current.parent) if (current.metadata?.side) return current.metadata.side;
  return null;
}
export function get2DWallSideFromPoint(wall, point) {
  if (!wall || !point) return null;
  const [x1, z1] = wall.from; const [x2, z2] = wall.to;
  const dx = x2 - x1; const dz = z2 - z1; const length = Math.hypot(dx, dz);
  if (length < 0.01) return null;
  const px = point.x ?? point[0]; const pz = point.z ?? point[1];
  return ((px - (x1 + x2) / 2) * (-dz / length) + (pz - (z1 + z2) / 2) * (dx / length)) >= 0 ? 'front' : 'back';
}
