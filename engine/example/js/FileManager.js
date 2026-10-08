import JSZip from 'jszip';
import { getEditHandleNodes } from './Viewer3DHandles.js';
import { showLoading, showAiBuildingHelp, showSettingsModal } from './Dialogs.js';
import {
  Tools,
  createBuildingFileName,
  createDXFFileName,
  create3MFFileName
} from '../../src/index.js';
const BABYLON = { Tools };
import { createStoreProxy } from '../store/proxyHelper.js';

let rawCtx = null;
const ctx = createStoreProxy(() => rawCtx);

function getProjectName(fallback = 'blueprint-building') {
  return ctx.store?.getCurrentProjectName?.() || ctx.testMap.getProjectMetadata().name || fallback;
}

/**
 *   FileManager。 / 。
 * @param {Object} appContext  
 */
export function initFileManager(appContext) {
  rawCtx = appContext;

  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    btnSave.addEventListener('click', downloadBuildingFile);
  }

  const btnExportZip = document.getElementById('btn-export-zip');
  if (btnExportZip) {
    btnExportZip.addEventListener('click', downloadBuildingZIP);
  }

  const btnSaveLocal = document.getElementById('btn-save-local');
  if (btnSaveLocal) {
    btnSaveLocal.addEventListener('click', saveToLocalStorage);
  }

  const btnExportDXF = document.getElementById('btn-export-dxf');
  if (btnExportDXF) {
    btnExportDXF.addEventListener('click', downloadDXFFile);
  }

  const btnExport3MF = document.getElementById('btn-export-3mf');
  if (btnExport3MF) {
    btnExport3MF.addEventListener('click', download3MFFile);
  }

  const btnLoad = document.getElementById('btn-load');
  const buildingFileInput = document.getElementById('building-file-input');
  if (btnLoad && buildingFileInput) {
    btnLoad.addEventListener('click', () => {
      buildingFileInput.value = '';
      buildingFileInput.click();
    });
  }

  if (buildingFileInput) {
    buildingFileInput.addEventListener('change', onFileInputChange);
  }

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      showSettingsModal(ctx);
    });
  }

  const btnOpenLocal = document.getElementById('btn-open-local');
  if (btnOpenLocal) {
    btnOpenLocal.addEventListener('click', openLocalStorageList);
  }

  updateLocalProjectCount();

  const btnTakePhoto = document.getElementById('btn-take-photo');
  if (btnTakePhoto) {
    btnTakePhoto.addEventListener('click', takePhoto);
  }
}

/**
 * Export  .json  
 */
export function downloadBuildingFile() {
  const json = ctx.testMap.stringifyBuildingFile({ name: getProjectName() });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createBuildingFileName(getProjectName());
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export  DXF  
 */
export function downloadDXFFile() {
  const dxfText = ctx.testMap.stringifyDXF();
  const blob = new Blob([dxfText], { type: 'image/vnd.dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createDXFFileName(getProjectName());
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export  3MF  
 */
export async function download3MFFile() {
  const result = await ctx.show3MFExportDialog();
  if (!result) return;
  const { category, enableTenon } = result;

  //  Export Furniture（'furniture'   'all'）  3D  ， 
  const needsRendering = (category === 'furniture' || category === 'all') && !ctx.testMap.renderingEnabled;
  const loading = showLoading('Exporting 3MF', 'Preparing 3D models, please wait...');

  try {
    if (needsRendering) {
      ctx.testMap.enableRendering();
    }

    const bytes = ctx.testMap.create3MFPackage({ category, enableTenon });
    const blob = new Blob([bytes], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const baseName = getProjectName();
    let exportName = baseName;
    if (category === 'building') {
      exportName = `${baseName}-building`;
    } else if (category === 'furniture') {
      exportName = `${baseName}-furniture`;
    }
    
    link.download = create3MFFileName(exportName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } finally {
    loading.close();
    if (needsRendering) {
      ctx.testMap.disableRendering();
      ctx.testMap.clearBuiltMeshes();
    }
  }
}

/**
 *  Select  .json  
 * @param {File} file  
 */
export async function loadBuildingFile(file) {
  if (!file) return;
  const text = await file.text();
  ctx.pushHistory();
  ctx.testMap.loadBuildingFile(text);
  ctx.syncFloorControls();
  ctx.setHasUserZoomedOrPanned(false);
  ctx.resetInteractionState();
  ctx.refreshShadows();
  if (typeof ctx.updateSkyboxFromCurrentFloor === 'function') ctx.updateSkyboxFromCurrentFloor();
  ctx.updateEditor();
  ctx.renderPlan();
  if (ctx.currentView === '3d') {
    requestAnimationFrame(() => {
      ctx.engine.resize();
      ctx.scene.render();
    });
  }
}

async function onFileInputChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.name.endsWith('.zip')) {
      await loadBuildingZIP(file);
    } else {
      await loadBuildingFile(file);
    }
  } catch (error) {
    console.error(error);
    await ctx.showCustomAlert('Import failed', 'Could not read this file. Please choose a blueprint3d-babylon building file or ZIP package.');
  }
}

/**
 * Save  LocalStorage  
 */
export async function saveToLocalStorage() {
  const defaultName = ctx.store.getCurrentProjectName() || getProjectName('');
  const name = await ctx.showCustomPrompt('Save project', 'Project name:', defaultName || 'Untitled project');
  if (!name) return;

  const ok = ctx.store.saveProject(name, {
    materialLibrary: ctx.getMaterialLibrary()
      .filter((m) => !ctx.DEFAULT_MATERIAL_PACKS.some((d) => d.id === m.id))
      .map((m) => {
        if (m.id && String(m.id).startsWith('custom_')) {
          const copy = { ...m };
          delete copy.src;
          return copy;
        }
        return m;
      }),
    uiState: { currentFloorId: ctx.testMap.getCurrentFloorId(), currentView: ctx.currentView },
  });
  if (ok) {
    updateLocalProjectCount();
  }
  ctx.showToast(ok ? `✓ Saved "${name}"` : '⚠ Save failed');
}

/**
 *   LocalStorage  （Open、Delete ）
 */
export async function openLocalStorageList() {
  const projects = ctx.store.listProjects();
  if (!projects.length) {
    await ctx.showCustomAlert('No saved projects', 'You have no saved projects yet. Use "Save project" first.');
    return;
  }
  const result = await ctx.showProjectListModal(projects);
  if (!result) return;
  if (result.action === 'open') {
    const data = ctx.store.loadProject(result.name);
    if (data && data.buildingData) {
      ctx.pushHistory();
      
      //  Custom  src
      const restoreFloorplanMaterials = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.id && String(obj.id).startsWith('custom_') && (!obj.src || obj.src.startsWith('materials/'))) {
          const storedStr = localStorage.getItem('custom_material_sources');
          const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
          const base64 = sourcesMap[obj.id];
          if (base64) obj.src = base64;
        }
        for (const key of Object.keys(obj)) {
          if (obj[key] && typeof obj[key] === 'object') {
            restoreFloorplanMaterials(obj[key]);
          }
        }
      };
      restoreFloorplanMaterials(data.buildingData);

      ctx.testMap.loadJSON(data.buildingData);
      ctx.ensureVisibleCurrentFloor?.({ reason: 'file-import', silent: true });
      ctx.syncFloorControls();
      ctx.setHasUserZoomedOrPanned(false);
      ctx.resetInteractionState();
      ctx.refreshShadows();
      if (typeof ctx.updateSkyboxFromCurrentFloor === 'function') ctx.updateSkyboxFromCurrentFloor();
      ctx.updateEditor();
      ctx.renderPlan();
      if (data.materialLibrary && data.materialLibrary.length) {
        const materialLibrary = ctx.getMaterialLibrary();
        const storedStr = localStorage.getItem('custom_material_sources');
        const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
        data.materialLibrary.forEach((m) => {
          if (m.id && String(m.id).startsWith('custom_')) {
            m.src = sourcesMap[m.id] || m.src;
          }
          if (!materialLibrary.some((existing) => existing.id === m.id)) {
            materialLibrary.push(m);
          }
        });
      }
      ctx.showToast(`✓ Opened "${result.name}"`);
    } else {
      await ctx.showCustomAlert('Open failed', 'Could not load this project.');
    }
  } else if (result.action === 'delete') {
    const confirmed = await ctx.showCustomConfirm('Delete project', `Delete "${result.name}"? This cannot be undone.`);
    if (confirmed) {
      ctx.store.deleteProject(result.name);
      updateLocalProjectCount();
      ctx.showToast(`Deleted "${result.name}"`);
    }
  }
}

/**
 *   LocalStorage  Save 
 */
export function updateLocalProjectCount() {
  const badge = document.getElementById('open-project-badge');
  if (badge) {
    const count = ctx.store.listProjects().length;
    badge.textContent = count;
    if (count === 0) {
      badge.classList.add('zero');
    } else {
      badge.classList.remove('zero');
    }
  }
}

/**
 *  Custom 
 */
function processCustomMaterials(obj, onMaterialFound) {
  if (!obj || typeof obj !== 'object') return;

  //   ID  Custom  ID  
  if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('custom_')) {
    //   Base64  
    const storedStr = localStorage.getItem('custom_material_sources');
    const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
    const base64 = sourcesMap[obj.id];
    if (base64) {
      obj.src = base64;
      onMaterialFound(obj);
    }
  }

  //  
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      processCustomMaterials(obj[key], onMaterialFound);
    }
  }
}

/**
 *   Base64 Data URL   Uint8Array
 */
function dataURLtoUint8Array(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { data: u8arr, mime };
}

/**
 *   MIME  
 */
function mimeToExt(mime) {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'png';
}

/**
 * ArrayBuffer   Base64  （ ）
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Export  ZIP  ， JSON、Custom CustomFurnitureJS 
 */
export async function downloadBuildingZIP() {
  try {
    ctx.showToast('Exporting ZIP package...');
    const zip = new JSZip();

    // 1.  
    const buildingFileObj = ctx.testMap.exportBuildingFile({ name: getProjectName() });
    
    const usedCustomMaterials = [];
    const zipMaterialsFolder = zip.folder('materials');

    // 2.  Custom  src  
    processCustomMaterials(buildingFileObj.floorplan, (matDesc) => {
      try {
        const { data, mime } = dataURLtoUint8Array(matDesc.src);
        const ext = mimeToExt(mime);
        const fileName = `${matDesc.id}.${ext}`;
        
        if (!usedCustomMaterials.some(m => m.id === matDesc.id)) {
          zipMaterialsFolder.file(fileName, data);
          
          const matCopy = { ...matDesc };
          matCopy.src = `materials/${fileName}`;
          usedCustomMaterials.push(matCopy);
        }
        
        matDesc.src = `materials/${fileName}`;
      } catch (err) {
        console.error('Failed to extract custom material:', matDesc, err);
      }
    });

    // Save  materials.json
    if (usedCustomMaterials.length > 0) {
      zip.file('materials.json', JSON.stringify(usedCustomMaterials, null, 2));
    }

    // 3.  CustomFurniture 
    const usedCustomFurnitureTypes = new Set();
    if (buildingFileObj.floorplan.items && Array.isArray(buildingFileObj.floorplan.items)) {
      const furnitureDefinitions = ctx.getFurnitureDefinitions();
      for (const item of buildingFileObj.floorplan.items) {
        const type = item.type;
        if (type && furnitureDefinitions[type]) {
          const def = furnitureDefinitions[type];
          if (def.category === 'custom') {
            usedCustomFurnitureTypes.add(type);
          }
        }
      }
    }

    if (usedCustomFurnitureTypes.size > 0) {
      const zipFurnitureFolder = zip.folder('furniture');
      const customFurnitureSourcesStr = localStorage.getItem('custom_furniture_sources');
      const sourcesMap = customFurnitureSourcesStr ? JSON.parse(customFurnitureSourcesStr) : {};
      
      for (const type of usedCustomFurnitureTypes) {
        const source = sourcesMap[type];
        if (source) {
          zipFurnitureFolder.file(`${type}.js`, source);
        } else {
          console.warn(`Custom furniture source code not found for type: ${type}`);
        }
      }
    }

    // 4.   b3dbuilding.json
    const safeName = String(getProjectName())
      .trim()
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'blueprint-building';
    
    zip.file(`${safeName}.b3dbuilding.json`, JSON.stringify(buildingFileObj, null, 2));

    // 5.  
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    
    ctx.showToast('✓ ZIP exported');
  } catch (error) {
    console.error('Failed to export ZIP:', error);
    ctx.showCustomAlert('Export failed', 'ZIP export failed: ' + (error.message || error));
  }
}

/**
 *   ZIP  ， Furniture， 
 */
export async function loadBuildingZIP(file) {
  if (!file) return;
  
  ctx.showToast('Importing ZIP package...');
  
  try {
    const zip = await JSZip.loadAsync(file);
    
    // 1.   *.b3dbuilding.json  
    let mainJsonFile = null;
    let mainJsonFileName = '';
    zip.forEach((relativePath, fileEntry) => {
      if (relativePath.endsWith('.b3dbuilding.json') && !relativePath.includes('/')) {
        mainJsonFile = fileEntry;
        mainJsonFileName = relativePath;
      }
    });
    
    if (!mainJsonFile) {
      throw new Error('No *.b3dbuilding.json file found in the ZIP root');
    }
    
    const mainJsonText = await mainJsonFile.async('text');
    const buildingFileObj = JSON.parse(mainJsonText);
    
    // 2.  CustomFurniture
    const furnitureFiles = [];
    zip.forEach((relativePath, fileEntry) => {
      if (relativePath.startsWith('furniture/') && relativePath.endsWith('.js')) {
        const type = relativePath.replace('furniture/', '').replace('.js', '');
        furnitureFiles.push({ type, entry: fileEntry });
      }
    });
    
    if (furnitureFiles.length > 0) {
      ctx.showToast(`Found ${furnitureFiles.length} custom furniture files, loading...`);
      for (const fFile of furnitureFiles) {
        try {
          const source = await fFile.entry.async('text');
          await ctx.registerCustomFurniture(source);
          ctx.saveCustomFurnitureToLocalStorage(fFile.type, source);
        } catch (err) {
          console.error(`Failed to register custom furniture from ZIP: ${fFile.type}`, err);
        }
      }
      ctx.renderFurnitureGrid();
    }
    
    // 3.  Custom 
    let materialsMeta = [];
    const materialsMetaFile = zip.file('materials.json');
    if (materialsMetaFile) {
      const metaText = await materialsMetaFile.async('text');
      materialsMeta = JSON.parse(metaText);
    }
    
    const pathToBase64Map = {};
    const materialsFiles = [];
    zip.forEach((relativePath, fileEntry) => {
      if (relativePath.startsWith('materials/') && !relativePath.endsWith('.json')) {
        materialsFiles.push({ path: relativePath, entry: fileEntry });
      }
    });
    
    if (materialsFiles.length > 0) {
      ctx.showToast(`Found ${materialsFiles.length} custom materials, loading...`);
      for (const mFile of materialsFiles) {
        try {
          const buffer = await mFile.entry.async('arraybuffer');
          const ext = mFile.path.split('.').pop().toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
          
          const base64Src = `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
          pathToBase64Map[mFile.path] = base64Src;
          
          const meta = materialsMeta.find(m => m.src === mFile.path);
          if (meta) {
            const descriptor = {
              ...meta,
              src: base64Src
            };
            
            const materialLibrary = ctx.materialLibrary;
            if (!materialLibrary.some(existing => existing.id === descriptor.id)) {
              materialLibrary.unshift(descriptor);
            }
            
            //  
            try {
              const storedStr = localStorage.getItem('custom_material_sources');
              const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
              sourcesMap[descriptor.id] = base64Src;
              localStorage.setItem('custom_material_sources', JSON.stringify(sourcesMap));
            } catch (err) {
              console.error('Failed to sync custom material from ZIP to localStorage:', err);
            }
          }
        } catch (err) {
          console.error(`Failed to load custom material from ZIP: ${mFile.path}`, err);
        }
      }
      ctx.renderMaterialLibrary();
    }
    
    // 4.   JSON   src   Base64 URL  
    function restoreCustomMaterials(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.src && typeof obj.src === 'string' && obj.src.startsWith('materials/')) {
        const base64Src = pathToBase64Map[obj.src];
        if (base64Src) {
          obj.src = base64Src;
        } else {
          console.warn(`Base64 data not found for: ${obj.src}`);
        }
      }
      
      for (const key of Object.keys(obj)) {
        if (obj[key] && typeof obj[key] === 'object') {
          restoreCustomMaterials(obj[key]);
        }
      }
    }
    
    restoreCustomMaterials(buildingFileObj.floorplan);
    
    // 5.  
    const restoredJSONString = JSON.stringify(buildingFileObj, null, 2);
    ctx.pushHistory();
    ctx.testMap.loadBuildingFile(restoredJSONString);
    
    ctx.syncFloorControls();
    ctx.setHasUserZoomedOrPanned(false);
    ctx.resetInteractionState();
    ctx.refreshShadows();
    if (typeof ctx.updateSkyboxFromCurrentFloor === 'function') ctx.updateSkyboxFromCurrentFloor();
    ctx.updateEditor();
    ctx.renderPlan();
    
    if (ctx.currentView === '3d') {
      requestAnimationFrame(() => {
        ctx.engine.resize();
        ctx.scene.render();
      });
    }
    
    ctx.showToast(`✓ Imported ZIP project "${buildingFileObj.name || 'Untitled'}"`);
  } catch (error) {
    console.error('Failed to import ZIP:', error);
    ctx.showCustomAlert('Import failed', 'ZIP import failed. Make sure it is a blueprint3d-babylon package: ' + (error.message || error));
  }
}

export function takePhoto() {
  if (ctx.currentView === '3d') {
    ctx.showToast('Capturing 3D screenshot...');
    
    // 1.   3D  
    const originalGridState = ctx.viewer3d.show3DGrid;
    if (originalGridState) {
      ctx.viewer3d.clear3DGrid();
    }
    const hiddenNodes = [];
    getEditHandleNodes().forEach((node) => {
      if (node && !node.isDisposed() && node.isEnabled()) {
        node.setEnabled(false);
        hiddenNodes.push(node);
      }
    });

    // 2.  
    ctx.scene.render();

    // 3.   Babylon  
    BABYLON.Tools.CreateScreenshotAsync(ctx.engine, ctx.camera, { precision: 1 })
      .then((dataUrl) => {
        const filename = `screenshot_3d_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ctx.showToast('✓ 3D screenshot saved');
      })
      .catch((err) => {
        console.error('3D screenshot failed:', err);
        ctx.showToast('⚠ 3D screenshot failed');
      })
      .finally(() => {
        // 4.   3D  
        if (originalGridState) {
          ctx.refresh3DGrid();
        }
        hiddenNodes.forEach((node) => {
          if (node && !node.isDisposed()) {
            node.setEnabled(true);
          }
        });
      });
  } else {
    ctx.showToast('Capturing 2D screenshot...');
    get2DPlanScreenshot()
      .then((dataUrl) => {
        const filename = `screenshot_2d_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ctx.showToast('✓ 2D screenshot saved');
      })
      .catch((err) => {
        console.error('2D screenshot failed:', err);
        ctx.showToast('⚠ 2D screenshot failed');
      });
  }
}

function get2DPlanScreenshot() {
  return new Promise((resolve, reject) => {
    const svgEl = document.getElementById('floorplan');
    if (!svgEl) {
      reject(new Error('Floor plan SVG not found'));
      return;
    }
    
    const svgClone = svgEl.cloneNode(true);
    
    //   style  
    let styleString = '';
    for (const styleSheet of document.styleSheets) {
      try {
        const rules = styleSheet.cssRules || styleSheet.rules;
        if (rules) {
          for (const rule of rules) {
            styleString += rule.cssText;
          }
        }
      } catch (e) {
        //  
      }
    }
    
    const styleEl = document.createElement('style');
    styleEl.textContent = styleString;
    svgClone.insertBefore(styleEl, svgClone.firstChild);
    
    //  ， Image 
    const rect = svgEl.getBoundingClientRect();
    const width = rect.width || 720;
    const height = rect.height || 520;
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2 
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        try {
          const pngUrl = canvas.toDataURL('image/png');
          resolve(pngUrl);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('Could not get 2D canvas context'));
      }
      URL.revokeObjectURL(blobURL);
    };
    
    image.onerror = (err) => {
      URL.revokeObjectURL(blobURL);
      reject(err);
    };
    
    image.src = blobURL;
  });
}
