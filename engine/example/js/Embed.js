/**
 * ArchCanvas embed bridge.
 *
 * When this editor runs inside the ArchCanvas web app (an iframe at /editor/?embed=1),
 * the parent page owns the project: it sends the saved building file (or the plot
 * size for a new project), and asks for the current building file when it saves.
 * In embed mode the editor does not read or write its own localStorage project.
 *
 * Messages (same origin only), all tagged with source 'archcanvas':
 *   editor -> app : ready | loaded | changed | snapshot {requestId, building} | error {message}
 *   app -> editor : load {building, plot, name} | snapshot {requestId} | view {view: '2d'|'3d'|'split'}
 *
 * Ask ArchCanvas (AI changes, see src/ai/applyAiPlan.js):
 *   app -> editor : aiPreview {requestId, operations} | aiShow {which: 'before'|'after'} | aiAccept | aiReject
 *   editor -> app : aiPreviewed {requestId, applied, skipped} | error {requestId, message}
 * A preview is one undo step. Rejecting it puts the plan back as it was.
 */
import { FloorplanDocument, stringifyBuildingFile, applyAiOperations } from '../../src/index.js';
import { initDisplayUnits } from './Units.js';
import { initSplitView, setEmbedView } from './SplitView.js';
import { initStatusBar } from './StatusBar.js';
import { enablePlanDrawing } from './PlanDrawing.js';

export const EMBEDDED = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('embed')
  && window.parent !== window;

const FT = 0.3048;
const SOURCE = 'archcanvas';

/** An empty floorplan, used at startup in embed mode so no demo house flashes up. */
export function blankFloorplan({ floors = 1, roofHeightFt = 10.5, name = 'ArchCanvas project' } = {}) {
  const wallHeight = Math.round(roofHeightFt * FT * 100) / 100;
  return {
    name,
    unit: 'm',
    wallHeight,
    wallThickness: 0.23, // 9 inch brick wall
    floorHeight: 0.15,
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    floors: Array.from({ length: Math.max(1, floors) }, (_, i) => ({
      id: `floor_${i + 1}`,
      name: i === 0 ? 'Ground' : `Floor ${i + 1}`,
      level: i,
      wallHeight,
      floorHeight: 0.15
    })),
    currentFloorId: 'floor_1'
  };
}

/** A new project: the plot boundary as one room with four walls on the ground floor. */
export function plotBuildingFile({ widthFt, depthFt, floors, roofHeightFt, name }) {
  const doc = new FloorplanDocument(blankFloorplan({ floors, roofHeightFt, name }));
  doc.addRoom({
    id: 'plot',
    name: 'Plot',
    x: 0,
    z: 0,
    width: Math.round(widthFt * FT * 1000) / 1000,
    depth: Math.round(depthFt * FT * 1000) / 1000,
    shape: 'square',
    floorId: 'floor_1'
  });
  return stringifyBuildingFile(doc.floorplan, { name });
}

/**
 * @param {object} ctx
 * @param {object} ctx.testMap the EditorFacade
 * @param {object} ctx.store the undo/redo Store
 * @param {(text: string) => Promise<void>} ctx.loadBuildingText loads a building file and refreshes the UI
 */
export function initEmbedBridge({ testMap, store, loadBuildingText }) {
  if (!EMBEDDED) return;
  document.documentElement.classList.add('archcanvas-embed');
  initDisplayUnits();
  enablePlanDrawing();
  initSplitView(window.appState, store);
  initStatusBar(window.appState, store);
  let listening = false;
  // The AI change being previewed: plans before and after, and its undo entry.
  let aiPreview = null;

  const post = (type, data = {}) => window.parent.postMessage({ source: SOURCE, type, ...data }, window.location.origin);

  store.on('historyChanged', () => {
    if (listening) post('changed');
  });

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || msg.source !== SOURCE) return;

    if (msg.type === 'load') {
      listening = false;
      aiPreview = null;
      try {
        const text = msg.building
          ? (typeof msg.building === 'string' ? msg.building : JSON.stringify(msg.building))
          : plotBuildingFile({ ...msg.plot, name: msg.name });
        await loadBuildingText(text);
        // A fresh project starts with an empty undo history.
        store.undoStack = [];
        store.redoStack = [];
        store.emit('historyChanged');
        post('loaded');
      } catch (error) {
        console.error(error);
        post('error', { message: 'This plan could not be opened.' });
      } finally {
        listening = true;
      }
    }

    if (msg.type === 'view') setEmbedView(msg.view);

    if (msg.type === 'aiPreview') {
      try {
        const before = store.snapshot();
        const { floorplan, applied, skipped } = applyAiOperations(before, msg.operations || []);
        if (applied.length) {
          store.pushHistory();
          store.restoreSnapshot(floorplan);
          aiPreview = { before, after: store.snapshot(), entry: store.undoStack[store.undoStack.length - 1], showing: 'after' };
        }
        post('aiPreviewed', { requestId: msg.requestId, applied, skipped });
      } catch (error) {
        console.error(error);
        post('error', { requestId: msg.requestId, message: 'The editor could not apply these changes.' });
      }
    }

    if (msg.type === 'aiShow' && aiPreview && msg.which !== aiPreview.showing) {
      aiPreview.showing = msg.which === 'before' ? 'before' : 'after';
      store.restoreSnapshot(aiPreview[aiPreview.showing]);
    }

    if ((msg.type === 'aiAccept' || msg.type === 'aiReject') && aiPreview) {
      const preview = aiPreview;
      aiPreview = null;
      if (msg.type === 'aiAccept') {
        if (preview.showing !== 'after') store.restoreSnapshot(preview.after);
      } else {
        store.restoreSnapshot(preview.before);
        // Drop the preview's undo step if nothing was done on top of it.
        if (store.undoStack[store.undoStack.length - 1] === preview.entry) store.undoStack.pop();
        store.emit('historyChanged');
      }
    }

    if (msg.type === 'snapshot') {
      try {
        post('snapshot', { requestId: msg.requestId, building: testMap.stringifyBuildingFile({ name: msg.name }) });
      } catch (error) {
        console.error(error);
        post('error', { requestId: msg.requestId, message: 'The plan could not be read for saving.' });
      }
    }
  });

  post('ready');
}
