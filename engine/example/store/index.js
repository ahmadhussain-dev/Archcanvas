/**
 * index.js —  
 */

import { UIStore } from './uiStore.js';
import { SelectionStore } from './selectionStore.js';
import { EditorPreviewStore } from './editorPreviewStore.js';

export const ui = new UIStore();
export const selection = new SelectionStore();
export const editor = new EditorPreviewStore();
