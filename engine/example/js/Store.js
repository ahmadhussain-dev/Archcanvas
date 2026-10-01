/**
 * Store.js — blueprint3d-babylon  
 *
 *  ：
 *   1. Undo/Redo 
 *   2. localStorage  
 *   3. 10  Save 
 *   4.  
 *   5.  
 */

// =============================================
// localStorage  
// =============================================
import { EMBEDDED } from './Embed.js';

const STORAGE_KEY_BUILDING = 'blueprint3d-building-data';
const STORAGE_KEY_MATERIAL = 'blueprint3d-material-library';
const STORAGE_KEY_UI_STATE = 'blueprint3d-ui-state';
const STORAGE_KEY_TOOL_GROUPS = 'blueprint3d-tool-groups';
const STORAGE_KEY_SAVE_TS = 'blueprint3d-save-timestamp';
const STORAGE_KEY_PROJECTS_INDEX = 'blueprint3d-projects-index';
const STORAGE_KEY_PROJECT_PREFIX = 'blueprint3d-project-';
const STORAGE_KEY_CURRENT_PROJECT = 'blueprint3d-current-project';

export function readLocalSave() {
  // Inside ArchCanvas the project comes from the server, not from this browser.
  if (EMBEDDED) return { buildingData: null, materialLibrary: null, uiState: null };
  try {
    const rawBuilding = localStorage.getItem(STORAGE_KEY_BUILDING);
    const rawMaterial = localStorage.getItem(STORAGE_KEY_MATERIAL);
    const rawUI = localStorage.getItem(STORAGE_KEY_UI_STATE);
    return {
      buildingData: rawBuilding ? JSON.parse(rawBuilding) : null,
      materialLibrary: rawMaterial ? JSON.parse(rawMaterial) : null,
      uiState: rawUI ? JSON.parse(rawUI) : null,
    };
  } catch (error) {
    console.error('Failed to read local save:', error);
    return { buildingData: null, materialLibrary: null, uiState: null };
  }
}

// =============================================
//   EventEmitter
// =============================================
class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   *  
   * @param {string} event
   * @param {Function} fn
   * @returns {() => void}  
   */
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }

  /**
   *  
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    const fns = this._listeners.get(event);
    if (fns) fns.forEach((fn) => fn(...args));
  }
}

// =============================================
// Store  
// =============================================
export class Store extends EventEmitter {
  /**
   * @param {object} opts
   * @param {() => object} opts.getSnapshot -  （  JSON  ）
   * @param {(data: object) => void} opts.applySnapshot -  
   * @param {number} [opts.maxHistory=80] -  
   * @param {number} [opts.autoSaveInterval=600000] -  Save （  10  ）
   */
  constructor({ getSnapshot, applySnapshot, maxHistory = 80, autoSaveInterval = 600000 }) {
    super();
    this._getSnapshot = getSnapshot;
    this._applySnapshot = applySnapshot;
    this._maxHistory = maxHistory;
    this._autoSaveInterval = autoSaveInterval;

    /** @type {object[]} Undo  */
    this.undoStack = [];
    /** @type {object[]} Redo  */
    this.redoStack = [];

    /**  Save  */
    this._dirty = false;
    /**  Save  ID */
    this._autoSaveTimer = null;

    /**  （ Save） */
    this.currentProjectName = null;
  }

  // =============================================
  //  
  // =============================================

  /**   */
  cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /**  （ ） */
  snapshot() {
    return this.cloneData(this._getSnapshot());
  }

  /**
   *  Undo 
   * @param {number} maxHistory
   */
  setMaxHistory(maxHistory) {
    const val = Math.max(20, Math.min(200, Number(maxHistory) || 80));
    this._maxHistory = val;
    while (this.undoStack.length > this._maxHistory) {
      this.undoStack.shift();
    }
  }

  /**  Undo  */
  getMaxHistory() {
    return this._maxHistory;
  }

  // =============================================
  // Undo/Redo
  // =============================================

  /**   */
  pushHistory() {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > this._maxHistory) this.undoStack.shift();
    this.redoStack = [];
    this._dirty = true;
    this.emit('historyChanged');
  }

  /**   */
  restoreSnapshot(data) {
    this._applySnapshot(data);
  }

  /** Undo */
  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.snapshot());
    this.restoreSnapshot(this.undoStack.pop());
    this._dirty = true;
    this.emit('historyChanged');
  }

  /** Redo */
  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.snapshot());
    this.restoreSnapshot(this.redoStack.pop());
    this._dirty = true;
    this.emit('historyChanged');
  }

  /**  Undo/Redo  */
  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  // =============================================
  // localStorage  
  // =============================================

  /**
   *  Save  localStorage
   * @param {object} [extra] -  Save  (  materialLibrary)
   * @returns {boolean}  Save 
   */
  saveToLocal(extra = {}) {
    try {
      const buildingData = this._getSnapshot();
      localStorage.setItem(STORAGE_KEY_BUILDING, JSON.stringify(buildingData));

      if (extra.materialLibrary) {
        localStorage.setItem(STORAGE_KEY_MATERIAL, JSON.stringify(extra.materialLibrary));
      }

      if (extra.uiState) {
        localStorage.setItem(STORAGE_KEY_UI_STATE, JSON.stringify(extra.uiState));
      }

      localStorage.setItem(STORAGE_KEY_SAVE_TS, String(Date.now()));
      this._dirty = false;
      this.emit('saved');
      return true;
    } catch (error) {
      console.error('Save Item localStorage  Item:', error);
      this.emit('saveError', error);
      return false;
    }
  }

  /**
   *   localStorage  
   * @returns {{ buildingData: object|null, materialLibrary: any[]|null, uiState: object|null }}
   */
  loadFromLocal() {
    try {
      const rawBuilding = localStorage.getItem(STORAGE_KEY_BUILDING);
      const rawMaterial = localStorage.getItem(STORAGE_KEY_MATERIAL);
      const rawUI = localStorage.getItem(STORAGE_KEY_UI_STATE);

      return {
        buildingData: rawBuilding ? JSON.parse(rawBuilding) : null,
        materialLibrary: rawMaterial ? JSON.parse(rawMaterial) : null,
        uiState: rawUI ? JSON.parse(rawUI) : null,
      };
    } catch (error) {
      console.error(' Item localStorage  Item:', error);
      return { buildingData: null, materialLibrary: null, uiState: null };
    }
  }

  /**   localStorage  Save  */
  hasLocalSave() {
    return localStorage.getItem(STORAGE_KEY_BUILDING) !== null;
  }

  /**  Save  */
  getLastSaveTime() {
    const ts = localStorage.getItem(STORAGE_KEY_SAVE_TS);
    return ts ? Number(ts) : null;
  }

  /**   localStorage  Save  */
  clearLocal() {
    try {
      localStorage.removeItem(STORAGE_KEY_BUILDING);
      localStorage.removeItem(STORAGE_KEY_MATERIAL);
      localStorage.removeItem(STORAGE_KEY_UI_STATE);
      localStorage.removeItem(STORAGE_KEY_SAVE_TS);
    } catch (error) {
      console.error(' Item localStorage  Item:', error);
    }
  }

  // =============================================
  //  （ ）
  // =============================================

  /**   */
  readToolGroupState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_TOOL_GROUPS) || '{}');
    } catch (error) {
      return {};
    }
  }

  /**   */
  writeToolGroupState(state) {
    try {
      localStorage.setItem(STORAGE_KEY_TOOL_GROUPS, JSON.stringify(state));
    } catch (error) {
      //  ； 
    }
  }

  // =============================================
  //  Save
  // =============================================

  /**
   *  Save
   * @param {() => object} getExtra -  Save （materialLibrary  ）
   */
  startAutoSave(getExtra = () => ({})) {
    this.stopAutoSave();
    if (EMBEDDED) return; // ArchCanvas saves versions to the server instead.
    this._getAutoSaveExtra = getExtra;
    this._autoSaveTimer = setInterval(() => {
      this._performAutoSave();
    }, this._autoSaveInterval);

    //  / Save
    this._visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this._performAutoSave();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    //  Save
    this._beforeUnloadHandler = () => {
      this._performAutoSave();
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  /**  Save */
  stopAutoSave() {
    if (this._autoSaveTimer !== null) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
  }

  /**  Save（ ） */
  _performAutoSave() {
    if (!this._dirty) return;
    const extra = this._getAutoSaveExtra ? this._getAutoSaveExtra() : {};
    const ok = this.saveToLocal(extra);
    if (ok) {
      this.emit('autoSaved');
    }
  }

  /**  （  pushHistory  ） */
  markDirty() {
    this._dirty = true;
  }

  // =============================================
  //  
  // =============================================

  /**
   *  
   * @returns {{ id: string, name: string, savedAt: number }[]}
   */
  listProjects() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS_INDEX) || '[]');
    } catch (error) {
      return [];
    }
  }

  /**   */
  _saveProjectIndex(index) {
    localStorage.setItem(STORAGE_KEY_PROJECTS_INDEX, JSON.stringify(index));
  }

  /**
   * Save 
   * @param {string} name -  
   * @param {object} [extra] -  
   * @returns {boolean}
   */
  saveProject(name, extra = {}) {
    try {
      const id = this._nameToId(name);
      const buildingData = this._getSnapshot();
      const projectPayload = {
        name,
        buildingData,
        materialLibrary: extra.materialLibrary || null,
        uiState: extra.uiState || null,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY_PROJECT_PREFIX + id, JSON.stringify(projectPayload));

      //  
      const index = this.listProjects();
      const existing = index.findIndex((p) => p.id === id);
      const meta = { id, name, savedAt: projectPayload.savedAt };
      if (existing >= 0) {
        index[existing] = meta;
      } else {
        index.unshift(meta);
      }
      this._saveProjectIndex(index);

      //  
      this.currentProjectName = name;
      localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, name);

      //  （ Save ）
      this.saveToLocal(extra);

      this._dirty = false;
      this.emit('saved');
      return true;
    } catch (error) {
      console.error('Save Item:', error);
      this.emit('saveError', error);
      return false;
    }
  }

  /**
   *  
   * @param {string} name
   * @returns {{ buildingData: object|null, materialLibrary: any[]|null, uiState: object|null, name: string }|null}
   */
  loadProject(name) {
    try {
      const id = this._nameToId(name);
      const raw = localStorage.getItem(STORAGE_KEY_PROJECT_PREFIX + id);
      if (!raw) return null;
      const data = JSON.parse(raw);
      this.currentProjectName = data.name || name;
      localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, this.currentProjectName);
      return data;
    } catch (error) {
      console.error(' Item:', error);
      return null;
    }
  }

  /**
   * Delete 
   * @param {string} name
   */
  deleteProject(name) {
    try {
      const id = this._nameToId(name);
      localStorage.removeItem(STORAGE_KEY_PROJECT_PREFIX + id);
      const index = this.listProjects().filter((p) => p.id !== id);
      this._saveProjectIndex(index);
    } catch (error) {
      console.error('Delete Item:', error);
    }
  }

  /**   */
  getCurrentProjectName() {
    if (this.currentProjectName) return this.currentProjectName;
    try {
      return localStorage.getItem(STORAGE_KEY_CURRENT_PROJECT) || null;
    } catch (error) {
      return null;
    }
  }

  /**   ID */
  _nameToId(name) {
    return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, '-'));
  }
}

// =============================================
// Toast  
// =============================================

/**
 *   toast  
 * @param {string} message -  
 * @param {number} [duration=2500] -  （ ）
 */
export function showToast(message, duration = 2500) {
  //  
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'store-toast';
  toast.textContent = message;
  toast.style.cssText = `
    padding: 8px 20px;
    background: rgba(30, 30, 30, 0.88);
    color: #fff;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: auto;
    white-space: nowrap;
  `;

  container.appendChild(toast);

  //  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  //  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 *  
 * @param {number} ts -  
 * @returns {string}
 */
export function formatTimestamp(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
