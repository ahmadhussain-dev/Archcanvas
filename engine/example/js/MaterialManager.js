import { FENCE_SUBTYPE_DEFAULTS, MaterialResolver, resolveMaterialAssetDescriptor } from '../../src/index.js';
import { TARGET_TYPES } from './types.js';
import { isTargetLocked } from './TargetHandler.js';
import { selection, editor } from '../store/index.js';

let ctx = null;

export function initMaterialManager(context) {
  ctx = context;
}

export function saveCustomMaterialToLocalStorage(id, src) {
  try {
    const storedStr = localStorage.getItem('custom_material_sources');
    const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
    sourcesMap[id] = src;
    localStorage.setItem('custom_material_sources', JSON.stringify(sourcesMap));
  } catch (e) {
    console.error('Failed to save custom material source to localStorage:', e);
  }
}

export function removeCustomMaterialFromLocalStorage(id) {
  try {
    const storedStr = localStorage.getItem('custom_material_sources');
    if (!storedStr) return;
    const sourcesMap = JSON.parse(storedStr);
    delete sourcesMap[id];
    localStorage.setItem('custom_material_sources', JSON.stringify(sourcesMap));
  } catch (e) {
    console.error('Failed to remove custom material source from localStorage:', e);
  }
}

// --- Custom （Paint/Emissive ）  localStorage   ---
const CUSTOM_COLOR_STORAGE_KEY = 'custom_color_materials';

export function saveCustomColorMaterial(descriptor) {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) || '[]');
    const idx = stored.findIndex((m) => m.id === descriptor.id);
    if (idx >= 0) {
      stored[idx] = descriptor;
    } else {
      stored.push(descriptor);
    }
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to save custom material to localStorage:', e);
  }
}

export function removeCustomColorMaterial(id) {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) || '[]');
    const filtered = stored.filter((m) => m.id !== id);
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove custom material from localStorage:', e);
  }
}

export function loadCustomColorMaterials() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function setCustomColorMaterials(materials) {
  try {
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, JSON.stringify(materials));
  } catch (e) {
    console.error('Failed to save custom material to localStorage:', e);
  }
}

const COLOR_PICKER_CATEGORIES = ['paint', 'emissive', 'glass', 'metal', 'mirror'];

/**   ID  Select Custom  */
export function isCustomColorMaterial(id) {
  if (typeof id !== 'string') return false;
  return COLOR_PICKER_CATEGORIES.some((cat) => id.startsWith(`custom-${cat}-`));
}

export function getActiveMaterialDisplayName(mat) {
  if (!mat) return 'No material selected';
  if (typeof mat === 'string') {
    if (mat.startsWith('#')) return `Color: ${mat}`;
    return mat;
  }
  
  const isPureColor = (
    (mat.kind === 'color' || mat.kind === 'paint') ||
    (!mat.kind && mat.color && !mat.src)
  );
  
  if (isPureColor) {
    const colorVal = mat.color || '#ffffff';
    if (!mat.name || mat.name === ' Item' || mat.name === 'Custom material' || mat.name.startsWith('Picked color')) {
      return `Color: ${colorVal}`;
    }
  }
  return mat.name || 'Custom material';
}

export function getActiveMaterialArrayDisplayName(matArray) {
  if (!matArray || matArray.length === 0) return 'No material selected';
  const names = matArray.map(item => {
    const mat = item.material || item;
    return getActiveMaterialDisplayName(mat);
  });
  const uniqueNames = [...new Set(names)];
  return uniqueNames.join('、');
}


function isTextureMaterial(material) {
  if (!material || typeof material === 'string') return false;
  return (material.kind === 'texture' || material.kind === 'emissive') && !!(material.src || material.url);
}

function applySwatchStyle(button, material) {
  button.style.background = '';
  button.style.backgroundImage = '';
  button.style.backgroundColor = '';
  button.style.backgroundBlendMode = '';
  button.style.backgroundPosition = '';
  button.style.backgroundSize = '';
  button.style.boxShadow = '';
  button.style.border = '';

  if (!material) {
    button.style.backgroundColor = '#ffffff';
    return;
  }

  if (typeof material === 'string') {
    button.style.backgroundColor = material;
    return;
  }

  const color = material.color || '#ffffff';
  if (isTextureMaterial(material)) {
    const resolved = resolveMaterialAssetDescriptor(material);
    const src = resolved?.src || material.src || material.url;
    button.style.backgroundImage = `linear-gradient(${color}cc, ${color}cc), url(${src})`;
    button.style.backgroundBlendMode = 'multiply';
    button.style.backgroundPosition = 'center';
    button.style.backgroundSize = 'cover';
    button.style.backgroundColor = color;
    return;
  }

  if (material.kind === 'mirror') {
    button.style.background = `linear-gradient(135deg, ${color} 0%, #ffffff 45%, ${color} 55%, #ffffff 100%)`;
    return;
  }

  if (material.kind === 'stained-glass') {
    button.style.background = 'conic-gradient(from 18deg at 42% 55%, #f27462 0 14%, #2b2023 14% 15%, #f2c95c 15% 29%, #2b2023 29% 30%, #4238de 30% 42%, #2b2023 42% 43%, #cf4b91 43% 62%, #2b2023 62% 63%, #ef9f58 63% 82%, #2b2023 82% 83%, #7557c9 83%)';
    button.style.backgroundSize = '38px 38px';
    button.style.boxShadow = 'inset 0 0 8px rgba(255,255,255,0.35), 0 0 7px rgba(142,76,201,0.3)';
    return;
  }

  if (material.kind === 'glass') {
    button.style.background = `linear-gradient(${color}99, ${color}99), repeating-conic-gradient(#d0d0d0 0% 25%, #f5f5f5 0% 50%) 0 0 / 8px 8px`;
    return;
  }

  if (material.kind === 'emissive') {
    const src = material.src || material.url;
    if (src) {
      const resolved = resolveMaterialAssetDescriptor(material);
      const finalSrc = resolved?.src || src;
      button.style.backgroundImage = `linear-gradient(${color}cc, ${color}cc), url(${finalSrc})`;
      button.style.backgroundBlendMode = 'multiply';
      button.style.backgroundPosition = 'center';
      button.style.backgroundSize = 'cover';
    }
    button.style.backgroundColor = color;
    button.style.boxShadow = `inset 0 0 4px rgba(255,255,255,0.8), 0 0 10px ${color}88`;
    button.style.border = '1px solid rgba(255,255,255,0.4)';
    return;
  }

  if (material.kind === 'metal') {
    const isMatte = material.roughness !== undefined && material.roughness > 0.4;
    if (isMatte) {
      button.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%), linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.15) 100%), ${color}`;
      button.style.boxShadow = 'inset 0 0 8px rgba(0,0,0,0.25)';
    } else {
      button.style.background = `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.8) 45%, rgba(0,0,0,0.3) 60%, rgba(255,255,255,0.3) 80%, rgba(0,0,0,0.1) 100%), ${color}`;
      button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)';
    }
    return;
  }

  button.style.backgroundColor = color;
}

function upsertMaterialDescriptor(descriptor) {
  const existingIndex = editor.materialLibrary.findIndex((material) => material.id === descriptor.id);
  if (existingIndex >= 0) {
    const nextLibrary = [...editor.materialLibrary];
    nextLibrary[existingIndex] = descriptor;
    editor.materialLibrary = nextLibrary;
    return;
  }

  editor.materialLibrary = [descriptor, ...editor.materialLibrary];
}

function getBaseMaterialName(name) {
  if (!name) return 'Texture';
  return name.replace(/(\s*\((?:Tintable|#[0-9a-fA-F]{3,8})\))+$/gi, '').trim();
}

function createTintedTextureDescriptor(material, color) {
  const sourceId = String(material.id || 'texture');
  const isCustomSource = sourceId.startsWith('custom_');
  const derivedId = isCustomSource
    ? sourceId
    : `derived_texture_${sourceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const baseName = getBaseMaterialName(material.name || (isCustomSource ? 'Custom material' : 'Texture'));
  const name = color ? `${baseName} (${color})` : baseName;

  return {
    ...material,
    id: derivedId,
    kind: material.kind || 'texture',
    category: material.category || 'custom',
    src: material.src || material.url,
    color,
    derivedFrom: material.derivedFrom || material.id || null,
    name
  };
}

export function renderMaterialLibrary(isSwitchingCategory = false) {
  ctx.updateDesignCursor();
  const materialCategorySelect = document.getElementById('material-category');
  const materialLibraryPanel = document.getElementById('material-library');
  if (!materialCategorySelect || !materialLibraryPanel) return;

  const category = materialCategorySelect.value;
  const materials = editor.materialLibrary.filter((material) => material.category === category);
  if (isSwitchingCategory && !editor.activeMaterialArray?.length) {
    const activeExistsInCategory = editor.activeMaterialDescriptor
      ? materials.some((material) => material.id === editor.activeMaterialDescriptor.id)
      : false;
    if (!activeExistsInCategory) {
      editor.activeMaterialDescriptor = materials[0] || null;
    }
  }
  materialLibraryPanel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'material-library-header';
  let activeName = 'No material selected';
  if (editor.activeMaterialArray && editor.activeMaterialArray.length > 0) {
    activeName = getActiveMaterialArrayDisplayName(editor.activeMaterialArray);
  } else if (editor.activeMaterialDescriptor) {
    activeName = getActiveMaterialDisplayName(editor.activeMaterialDescriptor);
  }
   const grid = document.createElement('div');
  grid.className = 'material-grid';

  // Paint、Emissive、Glass、Metal Mirror ： Select （ ）
  if (COLOR_PICKER_CATEGORIES.includes(category)) {
    const colorPickerControl = document.createElement('div');
    colorPickerControl.className = 'material-swatch upload-swatch';
    colorPickerControl.style.position = 'relative';
    const categoryTitles = {
      paint: 'Custom paint color',
      emissive: 'Custom emissive color',
      glass: 'Custom glass color',
      metal: 'Custom metal color',
      mirror: 'Custom mirror color'
    };
    const pickerTitle = categoryTitles[category] || 'Custom color';
    colorPickerControl.title = pickerTitle;
    colorPickerControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
    //  ，  iPad Safari  。
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#ffffff';
    colorInput.title = pickerTitle;
    colorInput.setAttribute('aria-label', pickerTitle);
    colorInput.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.001;cursor:pointer;z-index:2;padding:0;border:0;';
    colorPickerControl.appendChild(colorInput);
    colorInput.addEventListener('change', (e) => {
      const color = e.target.value;
      const hex = color.replace('#', '');
      const prefix = `custom-${category}`;
      const kind = category;
      const namePrefixes = {
        paint: 'Custom paint',
        emissive: 'Custom emissive',
        glass: 'Custom glass',
        metal: 'Custom metal',
        mirror: 'Custom mirror'
      };
      const namePrefix = namePrefixes[category] || 'Custom material';
      const descriptor = {
        id: `${prefix}-${hex}`,
        name: `${namePrefix} (${color})`,
        category,
        kind,
        color
      };
      //  
      if (!editor.materialLibrary.some((m) => m.id === descriptor.id)) {
        editor.materialLibrary = [descriptor, ...editor.materialLibrary];
      }
      saveCustomColorMaterial(descriptor);
      editor.activeMaterialDescriptor = descriptor;
      editor.activeMaterialArray = null;
      renderMaterialLibrary();
      ctx.updateEditor();
    });
    grid.appendChild(colorPickerControl);
  } else {
    //  
    const uploadButton = document.createElement('button');
    uploadButton.type = 'button';
    uploadButton.className = 'material-swatch upload-swatch';
    uploadButton.title = 'Upload custom texture';
    uploadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
    uploadButton.addEventListener('click', () => {
      document.getElementById('material-upload').click();
    });
    grid.appendChild(uploadButton);
  }

  materials.forEach((material) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `material-swatch ${editor.activeMaterialDescriptor?.id === material.id ? 'active' : ''}`;
    button.title = material.name;
    applySwatchStyle(button, material);
    button.addEventListener('click', () => {
      editor.activeMaterialDescriptor = material;
      editor.activeMaterialArray = null; //  
      renderMaterialLibrary();
      ctx.updateEditor();
    });
    grid.appendChild(button);
  });
  materialLibraryPanel.appendChild(grid);

  const activeTextureMaterial = editor.activeMaterialArray?.length
    ? null
    : (isTextureMaterial(editor.activeMaterialDescriptor) ? editor.activeMaterialDescriptor : null);

  if (activeTextureMaterial && activeTextureMaterial.category === category) {
    const tintPanel = document.createElement('div');
    tintPanel.className = 'custom-emissive-container';
    tintPanel.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 12px 0 0; padding: 4px 10px; background: rgba(42, 65, 92, 0.04); border-radius: 6px; border: 1px solid rgba(42, 65, 92, 0.12);';

    const textWrapper = document.createElement('div');
    textWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

    const label = document.createElement('span');
    label.textContent = 'Tint color';
    label.style.cssText = 'font-size: 13px; font-weight: 500; color: #172033;';

    const hint = document.createElement('span');
    // hint.textContent = ' ， ';
    // hint.style.cssText = 'font-size: 11px; color: #66758f;';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = activeTextureMaterial.color || '#ffffff';
    picker.style.cssText = 'border: none;background: none; width: 44px; height: 28px; cursor: pointer; padding: 0; overflow: hidden;';
    // picker.style.cssText = 'border: 1px solid rgba(42, 65, 92, 0.16); background: none; width: 44px; height: 28px; cursor: pointer; padding: 0; border-radius: 4px; overflow: hidden;';

    picker.addEventListener('change', (event) => {
      const tintedDescriptor = createTintedTextureDescriptor(activeTextureMaterial, event.target.value);
      upsertMaterialDescriptor(tintedDescriptor);
      editor.activeMaterialDescriptor = tintedDescriptor;
      editor.activeMaterialArray = null;
      renderMaterialLibrary();
      ctx.updateEditor();
    });

    textWrapper.append(label, hint);
    tintPanel.append(textWrapper, picker);
    materialLibraryPanel.appendChild(tintPanel);
  }

  //  Custom ， Delete 
  const activeId = editor.activeMaterialDescriptor?.id ? String(editor.activeMaterialDescriptor.id) : '';
  const isUploadedCustom = activeId.startsWith('custom_') && category === 'custom';
  const isColorCustom = isCustomColorMaterial(activeId) && COLOR_PICKER_CATEGORIES.includes(category);
  if (isUploadedCustom || isColorCustom) {
    //  Custom 
    if (isUploadedCustom) {
      const fieldLabel = document.createElement('label');
      fieldLabel.className = 'field';
      fieldLabel.style.marginTop = '12px';

      const span = document.createElement('span');
      span.textContent = 'Material name';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = editor.activeMaterialDescriptor.name || '';

      const handleSaveName = () => {
        const newName = input.value.trim();
        if (!newName) return;
        editor.activeMaterialDescriptor.name = newName;
        const foundInLib = editor.materialLibrary.find(m => m.id === editor.activeMaterialDescriptor.id);
        if (foundInLib) foundInLib.name = newName;
        ctx.pushHistory();
        renderMaterialLibrary();
        ctx.updateEditor();
      };

      input.addEventListener('change', handleSaveName);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      });

      fieldLabel.appendChild(span);
      fieldLabel.appendChild(input);
      materialLibraryPanel.appendChild(fieldLabel);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'danger';
    deleteBtn.textContent = 'Delete material';
    deleteBtn.style.width = '100%';
    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = await ctx.showCustomConfirm('Delete material', `Delete custom material "${editor.activeMaterialDescriptor.name}"?`);
      if (confirmDelete) {
        if (isUploadedCustom) {
          removeCustomMaterialFromLocalStorage(editor.activeMaterialDescriptor.id);
        } else {
          removeCustomColorMaterial(editor.activeMaterialDescriptor.id);
        }
        editor.materialLibrary = editor.materialLibrary.filter(m => m.id !== editor.activeMaterialDescriptor.id);
        const remaining = editor.materialLibrary.filter(m => m.category === category);
        editor.activeMaterialDescriptor = remaining[0] || null;
        ctx.pushHistory();
        renderMaterialLibrary();
        ctx.updateEditor();
      }
    });
    materialLibraryPanel.appendChild(deleteBtn);
  }
}

export function updateComponentMaterial(type, id, part, material, rebuild = true) {
  if (!id || !material) return;
  if (isTargetLocked({ type, id })) {
    ctx.showToast('This object is locked');
    return;
  }
  ctx.pushHistory();

  let defaultColor = '#ffffff';
  if (type === 'wall') {
    defaultColor = '#f9fbff';
  } else if (type === 'stairs') {
    defaultColor = '#d8c0a0';
  } else if (type === 'roof') {
    defaultColor = '#b75b54';
  } else if (type === 'fence' || type === 'fence_gate') {
    const item = type === 'fence' ? ctx.testMap.getEntity('fence', id) : ctx.testMap.getEntity('fence_gate', id);
    const subtype = item ? item.subtype : 'picket_wood';
    const defaults = FENCE_SUBTYPE_DEFAULTS[subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
    if (part === 'frame') {
      defaultColor = defaults.frameColor || defaults.color;
    } else if (part === 'panel') {
      defaultColor = defaults.panelColor || defaults.color;
    } else {
      defaultColor = defaults.color;
    }
  }

  const color = typeof material === 'string' ? material : (material.color || defaultColor);
  const matVal = typeof material === 'string' ? material : {
    ...material,
    src: material.src || material.url,
    color: color
  };

  let patch = {};
  if (type === 'wall') {
    if (part === 'front') {
      patch = buildWallSurfacePatch('front', 'main', matVal, color);
    } else if (part === 'back') {
      patch = buildWallSurfacePatch('back', 'main', matVal, color);
    } else if (part === 'front-baseboard') {
      patch = buildWallSurfacePatch('front', 'baseboard', matVal, color);
    } else if (part === 'back-baseboard') {
      patch = buildWallSurfacePatch('back', 'baseboard', matVal, color);
    } else if (part === 'front-wainscot') {
      patch = buildWallSurfacePatch('front', 'wainscot', matVal, color);
    } else if (part === 'back-wainscot') {
      patch = buildWallSurfacePatch('back', 'wainscot', matVal, color);
    } else {
      patch = { material: matVal, color: color };
    }
    ctx.testMap.executeCommand('updateWall', { wallId: id, patch, rebuild });
  } else if (type === 'stairs') {
    if (part === 'top') {
      patch = { material: matVal, color: color };
    } else if (part === 'side') {
      patch = { sideMaterial: matVal, sideColor: color };
    }
    ctx.testMap.executeCommand('updateStairs', { stairsId: id, patch, rebuild });
  } else if (type === 'roof') {
    if (part === 'top') {
      patch = { material: matVal, color: color };
    } else if (part === 'side') {
      patch = { sideMaterial: matVal, sideColor: color };
    } else if (part === 'bottom') {
      patch = { bottomMaterial: matVal, bottomColor: color };
    } else if (part === 'frame') {
      patch = { frameMaterial: matVal, frameColor: color };
    }
    ctx.testMap.executeCommand('updateRoof', { roofId: id, patch, rebuild });
  } else if (type === 'fence') {
    if (part === 'frame') {
      patch = { frameMaterial: matVal, frameColor: color };
    } else if (part === 'panel') {
      patch = { panelMaterial: matVal, panelColor: color };
    } else {
      patch = {
        material: matVal,
        color: color,
        frameMaterial: matVal,
        frameColor: color,
        panelMaterial: matVal,
        panelColor: color
      };
    }
    ctx.testMap.executeCommand('updateFence', { fenceId: id, patch, rebuild });
  } else if (type === 'fence_gate') {
    if (part === 'frame') {
      patch = { frameMaterial: matVal, frameColor: color };
    } else if (part === 'panel') {
      patch = { panelMaterial: matVal, panelColor: color };
    } else {
      patch = {
        frameMaterial: matVal,
        frameColor: color,
        panelMaterial: matVal,
        panelColor: color
      };
    }
    ctx.testMap.executeCommand('updateFenceGate', { gateId: id, patch, rebuild });
  } else if (type === 'opening') {
    if (part === 'frame') {
      patch = { frameMaterial: matVal };
    } else if (part === 'mullion' || part === 'bars') {
      patch = { mullionMaterial: matVal };
    } else if (part === 'panel') {
      patch = { panelMaterial: matVal };
    } else if (part === 'glass') {
      patch = { glassMaterial: matVal };
    } else {
      patch = {
        material: matVal,
        color: color,
        frameMaterial: matVal,
        mullionMaterial: matVal,
        panelMaterial: matVal
      };
    }
    ctx.testMap.executeCommand('updateOpening', { openingId: id, patch, rebuild });
  } else if (type === 'room') {
    ctx.testMap.executeCommand('setRoomFloorMaterial', { roomId: id, material });
  }

  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function applyMaterialToItemComponent(componentId, material) {
  if (!selection.selectedItemId || !material) return;
  if (isTargetLocked({ type: 'item', id: selection.selectedItemId })) {
    ctx.showToast('This object is locked');
    return;
  }
  ctx.entityManager.updateItemComponentMaterial(selection.selectedItemId, componentId, material);
}

// ==========================================
//  （Pick Material） （ ）
// ==========================================

function findMetadataFromNode(node, key) {
  let current = node;
  while (current) {
    if (current.metadata?.[key]) return current.metadata[key];
    current = current.parent;
  }
  return null;
}

function findWallSideFromNode(node) {
  let current = node;
  while (current) {
    if (current.metadata?.side) return current.metadata.side;
    current = current.parent;
  }
  return null;
}

function findWallComponentFromNode(node) {
  let current = node;
  while (current) {
    if (current.metadata?.wallComponent) return current.metadata.wallComponent;
    current = current.parent;
  }
  return 'main';
}

function getWallSurfaceFields(side, component = 'main') {
  return MaterialResolver.getWallSurfaceFields(side, component);
}

function getWallSurfaceValue(wall, side, component = 'main') {
  return MaterialResolver.getWallSurfaceValue(wall, side, component);
}

function buildWallSurfacePatch(side, component, material, color) {
  return MaterialResolver.buildWallSurfacePatch(side, component, material, color);
}

function get2DWallSideFromPoint(wall, point) {
  if (!wall || !point) return null;
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length < 0.01) return null;

  const ux = dx / length;
  const uz = dz / length;
  const nx = -uz;
  const nz = ux;

  const px = point.x !== undefined ? point.x : point[0];
  const pz = point.z !== undefined ? point.z : point[1];

  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;

  const vx = px - mx;
  const vz = pz - mz;

  const dot = vx * nx + vz * nz;
  return dot >= 0 ? 'front' : 'back';
}

function findRoofComponentIdFromNode(node) {
  let current = node;
  while (current) {
    if (current.name) {
      if (current.name.includes('roof_frame')) return 'frame';
      if (current.name.includes('roof_side')) return 'side';
      if (current.name.includes('roof_bottom')) return 'bottom';
      if (current.name.includes('roof_top')) return 'top';
    }
    current = current.parent;
  }
  return null;
}

function getFenceDefaultColor(subtype, componentId) {
  const defaults = FENCE_SUBTYPE_DEFAULTS[subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
  if (componentId === 'frame') return defaults.frameColor;
  if (componentId === 'panel') return defaults.panelColor;
  return defaults.color;
}

function getOpeningDefaultColor(openingType, componentId) {
  if (openingType === 'door') {
    if (componentId === 'frame') return '#b8c4d4'; // trim
    if (componentId === 'panel') return '#8c5a32'; // door
    return '#8c5a32';
  } else {
    // window
    if (componentId === 'frame') return '#b8c4d4'; // trim
    if (componentId === 'glass') return '#75d7ff'; // window
    return '#75d7ff';
  }
}

export function tryUpdateToFullMaterial(matOrColor) {
  if (!matOrColor) return null;

  // 1.   (id / src / kind)  ， 
  if (typeof matOrColor === 'object') {
    if (matOrColor.id || matOrColor.src || (matOrColor.kind && matOrColor.kind !== 'color' && matOrColor.kind !== 'paint')) {
      // Picked materials may contain an absolute URL from a previous preview
      // deployment. Resolve it before the descriptor is copied to another
      // surface so painting never reloads an expired tunnel/certificate URL.
      return resolveMaterialAssetDescriptor(matOrColor);
    }
  }

  let colorVal = typeof matOrColor === 'string' ? matOrColor : matOrColor.color;
  if (!colorVal) return matOrColor;

  // 2.   Paint Paint/  (  'paint-pure-white')
  const foundPaint = editor.materialLibrary.find(m =>
    m.color === colorVal &&
    (m.category === 'paint' || m.kind === 'paint' || m.kind === 'color')
  );
  if (foundPaint) return foundPaint;

  // 3.  Sky(sky)、 (src)  ( Metal、Mirror、Glass )
  const foundRich = editor.materialLibrary.find(m =>
    m.color === colorVal &&
    m.category !== 'sky' &&
    !m.src &&
    m.kind && m.kind !== 'color' && m.kind !== 'paint'
  );
  if (foundRich) return foundRich;

  // 4.  Sky(sky)、 (src) 
  const foundAny = editor.materialLibrary.find(m =>
    m.color === colorVal &&
    m.category !== 'sky' &&
    !m.src
  );
  if (foundAny) return foundAny;

  // 5.   ( Custom  HEX)，  Paint  ， 
  if (typeof matOrColor === 'string') {
    const isPureWhite = colorVal.toLowerCase() === '#ffffff';
    return {
      id: 'paint-' + colorVal.replace('#', ''),
      name: isPureWhite ? 'Pure White' : `Picked color (${colorVal})`,
      category: 'paint',
      kind: 'paint',
      color: colorVal
    };
  }
  return matOrColor;
}

export function extractMaterial(target, precise = true) {
  if (!target) return;
  
  if (precise) {
    // 1.  Pick Material
    let pickedMaterial = null;
    let pickedColor = null;

    if (target.type === 'room') {
      const room = ctx.testMap.getEntity('room', target.id);
      if (room) {
        pickedMaterial = room.material;
        pickedColor = room.color;
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getEntity('wall', target.id);
      if (wall) {
        const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
        const component = target.pick ? findWallComponentFromNode(target.pick.pickedMesh) : 'main';
        if (side === 'front' || side === 'back') {
          const surface = getWallSurfaceValue(wall, side, component);
          pickedMaterial = surface.material;
          pickedColor = surface.color;
        } else {
          pickedMaterial = wall.material;
          pickedColor = wall.color;
        }
      }
    } else if (target.type === 'item') {
      const item = ctx.testMap.getEntity('item', target.id);
      if (item) {
        let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
        if (!componentId) {
          const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
          componentId = definition?.components?.[0]?.id;
        }
        if (componentId) {
          pickedMaterial = item.materials?.[componentId];
          pickedColor = item.colors?.[componentId];
          if (!pickedMaterial && !pickedColor) {
            const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
            const component = definition?.components?.find(c => c.id === componentId);
            pickedColor = component?.defaultColor || '#ffffff';
          }
        } else {
          if (item.materials && Object.keys(item.materials).length > 0) {
            pickedMaterial = Object.values(item.materials)[0];
          } else if (item.colors && Object.keys(item.colors).length > 0) {
            pickedColor = Object.values(item.colors)[0];
          }
        }
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getEntity('fence', target.id);
      if (fence) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = fence.frameMaterial || fence.material;
          pickedColor = fence.frameColor || fence.color || getFenceDefaultColor(fence.subtype, 'frame');
        } else if (componentId === 'panel') {
          pickedMaterial = fence.panelMaterial || fence.material;
          pickedColor = fence.panelColor || fence.color || getFenceDefaultColor(fence.subtype, 'panel');
        } else {
          pickedMaterial = fence.material;
          pickedColor = fence.color || getFenceDefaultColor(fence.subtype, 'color');
        }
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getEntity('fence_gate', target.id);
      if (gate) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = gate.frameMaterial || gate.material;
          pickedColor = gate.frameColor || gate.color || getFenceDefaultColor(gate.subtype, 'frame');
        } else if (componentId === 'panel') {
          pickedMaterial = gate.panelMaterial || gate.material;
          pickedColor = gate.panelColor || gate.color || getFenceDefaultColor(gate.subtype, 'panel');
        } else {
          pickedMaterial = gate.frameMaterial || gate.panelMaterial || gate.material;
          pickedColor = gate.frameColor || gate.panelColor || gate.color || getFenceDefaultColor(gate.subtype, 'frame');
        }
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getEntity('opening', target.id);
      if (opening) {
        let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
        if (componentId === 'hbar' || componentId === 'vbar') componentId = 'mullion';
        if (componentId === 'mullion') {
          pickedMaterial = opening.mullionMaterial || opening.frameMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'frame');
        } else if (componentId === 'frame') {
          pickedMaterial = opening.frameMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'frame');
        } else if (componentId === 'panel') {
          pickedMaterial = opening.panelMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'panel');
        } else if (componentId === 'glass') {
          pickedMaterial = opening.glassMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'glass');
        } else {
          pickedMaterial = opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'color');
        }
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getEntity('roof', target.id);
      if (roof) {
        const componentId = target.pick ? findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
        if (componentId === 'frame') {
          pickedMaterial = roof.frameMaterial || null;
          pickedColor = roof.frameColor || '#333333';
        } else if (componentId === 'side') {
          pickedMaterial = roof.sideMaterial || roof.material;
          pickedColor = roof.sideColor || roof.color || '#b75b54';
        } else if (componentId === 'bottom') {
          pickedMaterial = roof.bottomMaterial || roof.material;
          pickedColor = roof.bottomColor || roof.color || '#b75b54';
        } else {
          pickedMaterial = roof.material;
          pickedColor = roof.color || '#b75b54';
        }
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getEntity('stairs', target.id);
      if (stairs) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
        if (componentId === 'side') {
          pickedMaterial = stairs.sideMaterial || stairs.material;
          pickedColor = stairs.sideColor || stairs.color || '#d8c0a0';
        } else {
          pickedMaterial = stairs.material;
          pickedColor = stairs.color || '#d8c0a0';
        }
      }
    }

    if (pickedMaterial || pickedColor) {
      editor.activeMaterialDescriptor = tryUpdateToFullMaterial(pickedMaterial || pickedColor);
      editor.activeMaterialArray = null; //  
      const displayName = getActiveMaterialDisplayName(editor.activeMaterialDescriptor);
      ctx.showToast(`Picked material: ${displayName}`);

      //  
      const catSelect = document.getElementById('material-category');
      if (catSelect && editor.activeMaterialDescriptor.category && catSelect.value !== editor.activeMaterialDescriptor.category) {
        window.isProgrammaticMaterialCategoryChange = true;
        catSelect.value = editor.activeMaterialDescriptor.category;
        catSelect.dispatchEvent(new Event('change'));
        window.isProgrammaticMaterialCategoryChange = false;
      } else {
        renderMaterialLibrary();
      }

      ctx.updateEditor();
      ctx.setDesignMode('brush', false);
    } else {
      ctx.showToast('No material found here');
      ctx.setDesignMode('select');
    }
  } else {
    // 2.  Pick Material（ / Pick Material）
    let materialsArray = [];
    materialsArray.sourceType = target.type;

    if (target.type === 'room') {
      const room = ctx.testMap.getEntity('room', target.id);
      if (room) {
        const rawMat = room.material || null;
        const rawCol = room.color || '#ffffff';
        materialsArray.push({
          componentId: 'floor',
          material: tryUpdateToFullMaterial(rawMat || rawCol),
          color: rawCol
        });
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getEntity('wall', target.id);
      if (wall) {
        const frontMain = getWallSurfaceValue(wall, 'front', 'main');
        const backMain = getWallSurfaceValue(wall, 'back', 'main');
        materialsArray.push({
          componentId: 'front',
          material: tryUpdateToFullMaterial(frontMain.material || frontMain.color),
          color: frontMain.color
        });
        materialsArray.push({
          componentId: 'back',
          material: tryUpdateToFullMaterial(backMain.material || backMain.color),
          color: backMain.color
        });
        if (wall.baseboardEnabled) {
          const frontBaseboard = getWallSurfaceValue(wall, 'front', 'baseboard');
          const backBaseboard = getWallSurfaceValue(wall, 'back', 'baseboard');
          materialsArray.push({
            componentId: 'front-baseboard',
            material: tryUpdateToFullMaterial(frontBaseboard.material || frontBaseboard.color),
            color: frontBaseboard.color
          });
          materialsArray.push({
            componentId: 'back-baseboard',
            material: tryUpdateToFullMaterial(backBaseboard.material || backBaseboard.color),
            color: backBaseboard.color
          });
        }
        if (wall.wainscotEnabled) {
          const frontWainscot = getWallSurfaceValue(wall, 'front', 'wainscot');
          const backWainscot = getWallSurfaceValue(wall, 'back', 'wainscot');
          materialsArray.push({
            componentId: 'front-wainscot',
            material: tryUpdateToFullMaterial(frontWainscot.material || frontWainscot.color),
            color: frontWainscot.color
          });
          materialsArray.push({
            componentId: 'back-wainscot',
            material: tryUpdateToFullMaterial(backWainscot.material || backWainscot.color),
            color: backWainscot.color
          });
        }
      }
    } else if (target.type === 'item') {
      const item = ctx.testMap.getEntity('item', target.id);
      if (item) {
        materialsArray.sourceItemType = item.type;
        const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
        if (definition && definition.components) {
          definition.components.forEach(comp => {
            const rawMat = item.materials?.[comp.id] || null;
            const rawCol = item.colors?.[comp.id] || comp.defaultColor || '#ffffff';
            materialsArray.push({
              componentId: comp.id,
              material: tryUpdateToFullMaterial(rawMat || rawCol),
              color: rawCol
            });
          });
        } else {
          const matKeys = Object.keys(item.materials || {});
          const colKeys = Object.keys(item.colors || {});
          const allKeys = Array.from(new Set([...matKeys, ...colKeys]));
          allKeys.forEach(k => {
            const rawMat = item.materials?.[k] || null;
            const rawCol = item.colors?.[k] || '#ffffff';
            materialsArray.push({
              componentId: k,
              material: tryUpdateToFullMaterial(rawMat || rawCol),
              color: rawCol
            });
          });
        }
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getEntity('fence', target.id);
      if (fence) {
        const rawMatFrame = fence.frameMaterial || fence.material || null;
        const rawColFrame = fence.frameColor || fence.color || getFenceDefaultColor(fence.subtype, 'frame');
        const rawMatPanel = fence.panelMaterial || fence.material || null;
        const rawColPanel = fence.panelColor || fence.color || getFenceDefaultColor(fence.subtype, 'panel');
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
        materialsArray.push({
          componentId: 'panel',
          material: tryUpdateToFullMaterial(rawMatPanel || rawColPanel),
          color: rawColPanel
        });
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getEntity('fence_gate', target.id);
      if (gate) {
        const rawMatFrame = gate.frameMaterial || gate.material || null;
        const rawColFrame = gate.frameColor || gate.color || getFenceDefaultColor(gate.subtype, 'frame');
        const rawMatPanel = gate.panelMaterial || gate.material || null;
        const rawColPanel = gate.panelColor || gate.color || getFenceDefaultColor(gate.subtype, 'panel');
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
        materialsArray.push({
          componentId: 'panel',
          material: tryUpdateToFullMaterial(rawMatPanel || rawColPanel),
          color: rawColPanel
        });
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getEntity('opening', target.id);
      if (opening) {
        const rawMatFrame = opening.frameMaterial || opening.material || null;
        const rawColFrame = opening.color || getOpeningDefaultColor(opening.type, 'frame');
        const rawMatPanel = opening.panelMaterial || opening.material || null;
        const rawColPanel = opening.color || getOpeningDefaultColor(opening.type, 'panel');
        const rawMatGlass = opening.glassMaterial || opening.material || null;
        const rawColGlass = opening.color || getOpeningDefaultColor(opening.type, 'glass');
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
        materialsArray.push({
          componentId: 'panel',
          material: tryUpdateToFullMaterial(rawMatPanel || rawColPanel),
          color: rawColPanel
        });
        materialsArray.push({
          componentId: 'glass',
          material: tryUpdateToFullMaterial(rawMatGlass || rawColGlass),
          color: rawColGlass
        });
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getEntity('roof', target.id);
      if (roof) {
        const rawMatTop = roof.material || null;
        const rawColTop = roof.color || '#b75b54';
        const rawMatSide = roof.sideMaterial || null;
        const rawColSide = roof.sideColor || '#b75b54';
        const rawMatBottom = roof.bottomMaterial || null;
        const rawColBottom = roof.bottomColor || '#b75b54';
        const rawMatFrame = roof.frameMaterial || null;
        const rawColFrame = roof.frameColor || '#333333';
        materialsArray.push({
          componentId: 'top',
          material: tryUpdateToFullMaterial(rawMatTop || rawColTop),
          color: rawColTop
        });
        materialsArray.push({
          componentId: 'side',
          material: tryUpdateToFullMaterial(rawMatSide || rawColSide),
          color: rawColSide
        });
        materialsArray.push({
          componentId: 'bottom',
          material: tryUpdateToFullMaterial(rawMatBottom || rawColBottom),
          color: rawColBottom
        });
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getEntity('stairs', target.id);
      if (stairs) {
        const rawMatTop = stairs.material || null;
        const rawColTop = stairs.color || '#d8c0a0';
        const rawMatSide = stairs.sideMaterial || null;
        const rawColSide = stairs.sideColor || '#d8c0a0';
        materialsArray.push({
          componentId: 'top',
          material: tryUpdateToFullMaterial(rawMatTop || rawColTop),
          color: rawColTop
        });
        materialsArray.push({
          componentId: 'side',
          material: tryUpdateToFullMaterial(rawMatSide || rawColSide),
          color: rawColSide
        });
      }
    }

    if (materialsArray.length > 0) {
      editor.activeMaterialArray = materialsArray;
      editor.activeMaterialDescriptor = null; //  
      ctx.showToast('Copied all materials from this object');
      renderMaterialLibrary();
      ctx.updateEditor();
      ctx.setDesignMode('brush', false);
    } else {
      ctx.showToast('No material found here');
    }
  }
}

export function applyMaterial(target, designMode) {
  if (!target) return;
  if (isTargetLocked(target)) {
    ctx.showToast('This object is locked');
    return;
  }

  const isArrayMode = !!(editor.activeMaterialArray && editor.activeMaterialArray.length > 0);
  const activeMaterialDescriptor = editor.activeMaterialDescriptor;
  const activeMaterialArray = editor.activeMaterialArray;

  if (!isArrayMode && !activeMaterialDescriptor) {
    ctx.showToast('Select a material or use the picker first');
    return;
  }

  // 1.   (brush)
  if (designMode === 'brush') {
    if (isArrayMode) {
      // 1.1   ->  Furniture/ （ ）
      ctx.pushHistory();

      if (target.type === 'item') {
        const targetItem = ctx.testMap.getEntity('item', target.id);
        if (targetItem) {
          const definition = ctx.testMap.getFurnitureDefinition?.(targetItem.type);
          const targetComponents = definition?.components || [];
          targetItem.materials ||= {};
          targetItem.colors ||= {};

          //  ID 
          const targetCompIds = new Set(targetComponents.map(c => c.id));
          const hasAnyMatchingId = activeMaterialArray.some(entry => targetCompIds.has(entry.componentId));

          if (hasAnyMatchingId && targetItem.type === activeMaterialArray.sourceItemType) {
            //   componentId  
            activeMaterialArray.forEach(entry => {
              if (targetCompIds.has(entry.componentId)) {
                if (entry.material) {
                  targetItem.materials[entry.componentId] = entry.material;
                } else {
                  delete targetItem.materials[entry.componentId];
                }
                if (entry.color) {
                  targetItem.colors[entry.componentId] = entry.color;
                }
              }
            });
          } else {
            //  ， 
            targetComponents.forEach((comp, index) => {
              const srcEntry = activeMaterialArray[index % activeMaterialArray.length];
              if (srcEntry.material) {
                targetItem.materials[comp.id] = srcEntry.material;
              } else {
                delete targetItem.materials[comp.id];
              }
              if (srcEntry.color) {
                targetItem.colors[comp.id] = srcEntry.color;
              }
            });
          }

          ctx.testMap.updateItem(target.id, { materials: targetItem.materials, colors: targetItem.colors });
        }
      } else if (target.type === 'room') {
        ctx.testMap.setRoomFloorMaterial(target.id, activeMaterialArray[0].material);
      } else if (target.type === 'wall') {
        //  
        const frontEntry = activeMaterialArray.find(e => e.componentId === 'front') || activeMaterialArray[0];
        const wall = ctx.testMap.getEntity('wall', target.id);
        if (wall) {
          const backEntry = activeMaterialArray.find(e => e.componentId === 'back') || activeMaterialArray[1] || frontEntry;
          const patch = {
            ...buildWallSurfacePatch('front', 'main', frontEntry.material, frontEntry.color),
            ...buildWallSurfacePatch('back', 'main', backEntry.material, backEntry.color)
          };

          const hasBaseboardEntry = activeMaterialArray.some(e => e.componentId === 'front-baseboard' || e.componentId === 'back-baseboard');
          if (wall.baseboardEnabled || hasBaseboardEntry) {
            if (hasBaseboardEntry) {
              patch.baseboardEnabled = true;
            }
            const frontBaseboard = activeMaterialArray.find(e => e.componentId === 'front-baseboard') || frontEntry;
            const backBaseboard = activeMaterialArray.find(e => e.componentId === 'back-baseboard') || backEntry;
            Object.assign(
              patch,
              buildWallSurfacePatch('front', 'baseboard', frontBaseboard.material, frontBaseboard.color),
              buildWallSurfacePatch('back', 'baseboard', backBaseboard.material, backBaseboard.color)
            );
          }

          const hasWainscotEntry = activeMaterialArray.some(e => e.componentId === 'front-wainscot' || e.componentId === 'back-wainscot');
          if (wall.wainscotEnabled || hasWainscotEntry) {
            if (hasWainscotEntry) {
              patch.wainscotEnabled = true;
            }
            const frontWainscot = activeMaterialArray.find(e => e.componentId === 'front-wainscot') || frontEntry;
            const backWainscot = activeMaterialArray.find(e => e.componentId === 'back-wainscot') || backEntry;
            Object.assign(
              patch,
              buildWallSurfacePatch('front', 'wainscot', frontWainscot.material, frontWainscot.color),
              buildWallSurfacePatch('back', 'wainscot', backWainscot.material, backWainscot.color)
            );
          }

          ctx.testMap.updateWall(target.id, patch);
        }
      } else if (target.type === 'fence') {
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame') || activeMaterialArray[0];
        const panelEntry = activeMaterialArray.find(e => e.componentId === 'panel') || activeMaterialArray[1] || frameEntry;
        
        ctx.testMap.updateFence(target.id, {
          frameMaterial: frameEntry.material,
          frameColor: frameEntry.color,
          panelMaterial: panelEntry.material,
          panelColor: panelEntry.color,
          material: frameEntry.material || panelEntry.material || null,
          color: frameEntry.color || panelEntry.color || '#ffffff'
        });
      } else if (target.type === 'fence_gate') {
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame') || activeMaterialArray[0];
        const panelEntry = activeMaterialArray.find(e => e.componentId === 'panel') || activeMaterialArray[1] || frameEntry;
        
        ctx.testMap.updateFenceGate(target.id, {
          frameMaterial: frameEntry.material,
          frameColor: frameEntry.color,
          panelMaterial: panelEntry.material,
          panelColor: panelEntry.color
        });
      } else if (target.type === 'opening') {
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame') || activeMaterialArray[0];
        const panelEntry = activeMaterialArray.find(e => e.componentId === 'panel') || activeMaterialArray[1] || frameEntry;
        const glassEntry = activeMaterialArray.find(e => e.componentId === 'glass') || activeMaterialArray[2] || panelEntry;
        
        ctx.testMap.updateOpening(target.id, {
          frameMaterial: frameEntry.material,
          panelMaterial: panelEntry.material,
          glassMaterial: glassEntry.material,
          material: frameEntry.material || panelEntry.material || null,
          color: frameEntry.color || panelEntry.color || '#ffffff'
        });
      } else if (target.type === 'roof') {
        const topEntry = activeMaterialArray.find(e => e.componentId === 'top') || activeMaterialArray[0];
        const sideEntry = activeMaterialArray.find(e => e.componentId === 'side') || activeMaterialArray[1] || topEntry;
        const bottomEntry = activeMaterialArray.find(e => e.componentId === 'bottom') || activeMaterialArray[2] || sideEntry;
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame');
        
        ctx.testMap.updateRoof(target.id, {
          material: topEntry.material,
          color: topEntry.color,
          sideMaterial: sideEntry.material,
          sideColor: sideEntry.color,
          bottomMaterial: bottomEntry.material,
          bottomColor: bottomEntry.color,
          frameMaterial: frameEntry ? frameEntry.material : undefined,
          frameColor: frameEntry ? frameEntry.color : undefined
        });
      } else if (target.type === 'stairs') {
        const topEntry = activeMaterialArray.find(e => e.componentId === 'top') || activeMaterialArray[0];
        const sideEntry = activeMaterialArray.find(e => e.componentId === 'side') || activeMaterialArray[1] || topEntry;
        
        ctx.testMap.updateStairs(target.id, {
          material: topEntry.material,
          color: topEntry.color,
          sideMaterial: sideEntry.material,
          sideColor: sideEntry.color
        });
      }

      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
    } else {
      // 1.2   ->  （ ）
      if (target.type === 'room') {
        ctx.pushHistory();
        ctx.testMap.setRoomFloorMaterial(target.id, activeMaterialDescriptor);
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      } else if (target.type === 'wall') {
        const wall = ctx.testMap.getEntity('wall', target.id);
        if (wall) {
          const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
          const component = target.pick ? findWallComponentFromNode(target.pick.pickedMesh) : 'main';
          if (side === 'front') {
            updateComponentMaterial('wall', target.id, component === 'main' ? 'front' : `front-${component}`, activeMaterialDescriptor);
          } else if (side === 'back') {
            updateComponentMaterial('wall', target.id, component === 'main' ? 'back' : `back-${component}`, activeMaterialDescriptor);
          } else {
            updateComponentMaterial('wall', target.id, 'all', activeMaterialDescriptor);
          }
        }
      } else if (target.type === 'item') {
        const item = ctx.testMap.getEntity('item', target.id);
        let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
        if (!componentId && item) {
          const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
          componentId = definition?.components?.[0]?.id;
        }
        if (componentId) {
          if (isTargetLocked({ type: 'item', id: target.id })) {
            ctx.showToast('This object is locked');
            return;
          }
          ctx.entityManager.updateItemComponentMaterial(target.id, componentId, activeMaterialDescriptor);
        } else {
          ctx.showToast('No paintable part found on this furniture');
        }
      } else if (target.type === 'fence') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          updateComponentMaterial('fence', target.id, 'frame', activeMaterialDescriptor);
        } else if (componentId === 'panel') {
          updateComponentMaterial('fence', target.id, 'panel', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('fence', target.id, 'all', activeMaterialDescriptor);
        }
      } else if (target.type === 'fence_gate') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          updateComponentMaterial('fence_gate', target.id, 'frame', activeMaterialDescriptor);
        } else if (componentId === 'panel') {
          updateComponentMaterial('fence_gate', target.id, 'panel', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('fence_gate', target.id, 'all', activeMaterialDescriptor);
        }
      } else if (target.type === 'opening') {
        let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
        if (componentId === 'hbar' || componentId === 'vbar') componentId = 'mullion';
        if (componentId === 'mullion') {
          updateComponentMaterial('opening', target.id, 'mullion', activeMaterialDescriptor);
        } else if (componentId === 'frame') {
          updateComponentMaterial('opening', target.id, 'frame', activeMaterialDescriptor);
        } else if (componentId === 'panel') {
          updateComponentMaterial('opening', target.id, 'panel', activeMaterialDescriptor);
        } else if (componentId === 'glass') {
          updateComponentMaterial('opening', target.id, 'glass', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('opening', target.id, 'all', activeMaterialDescriptor);
        }
      } else if (target.type === 'roof') {
        const componentId = target.pick ? findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
        if (componentId === 'side') {
          updateComponentMaterial('roof', target.id, 'side', activeMaterialDescriptor);
        } else if (componentId === 'bottom') {
          updateComponentMaterial('roof', target.id, 'bottom', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('roof', target.id, 'top', activeMaterialDescriptor);
        }
      } else if (target.type === 'stairs') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
        if (componentId === 'side') {
          updateComponentMaterial('stairs', target.id, 'side', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('stairs', target.id, 'top', activeMaterialDescriptor);
        }
      }
    }
  }
  else if (designMode === 'bucket') {
    if (target.type === 'room') {
      if (activeMaterialDescriptor || isArrayMode) {
        ctx.pushHistory();
        const material = isArrayMode ? activeMaterialArray[0].material : activeMaterialDescriptor;
        ctx.testMap.setRoomFloorMaterial(target.id, material);
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      } else {
        ctx.showToast('Select a material first');
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getEntity('wall', target.id);
      if (!wall) return;
      const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
      if (!side) return;
      const component = target.pick ? findWallComponentFromNode(target.pick.pickedMesh) : 'main';

      //  
      const srcMaterial = side === 'front' 
        ? (wall.materialFront !== undefined && wall.materialFront !== null ? wall.materialFront : wall.material) 
        : (wall.materialBack !== undefined && wall.materialBack !== null ? wall.materialBack : wall.material);
      const srcColor = side === 'front'
        ? (wall.colorFront !== undefined && wall.colorFront !== null ? wall.colorFront : wall.color)
        : (wall.colorBack !== undefined && wall.colorBack !== null ? wall.colorBack : wall.color);
      const wallSurface = getWallSurfaceValue(wall, side, component);
      const srcWallMaterial = wallSurface.material;
      const srcWallColor = wallSurface.color;

      //  Room
      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length < 0.01) return;

      const ux = dx / length;
      const uz = dz / length;
      const nx = -uz;
      const nz = ux;

      const offsetMultiplier = side === 'front' ? 0.15 : -0.15;
      const checkX = (x1 + x2) / 2 + offsetMultiplier * nx;
      const checkZ = (z1 + z2) / 2 + offsetMultiplier * nz;

      const room = ctx.testMap.getRoomAt(checkX, checkZ);
      if (!room) {
        //  Room（ ）， 
        ctx.pushHistory();
        ctx.testMap.updateWall(wall.id, buildWallSurfacePatch(side, component, srcWallMaterial, srcWallColor));
        ctx.showToast('Applied to this wall only (not part of a room)');
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
        return;
      }

      ctx.pushHistory();
      const roomWallIds = Object.values(room.wallIds || {});
      let count = 0;
      roomWallIds.forEach(wallId => {
        const w = ctx.testMap.getEntity('wall', wallId);
        if (!w || w.locked) return;

        const [wx1, wz1] = w.from;
        const [wx2, wz2] = w.to;
        const wdx = wx2 - wx1;
        const wdz = wz2 - wz1;
        const wlen = Math.sqrt(wdx * wdx + wdx * wdx); //  ， 
        const realLen = Math.sqrt(wdx * wdx + wdz * wdz);
        if (realLen < 0.01) return;

        const wux = wdx / realLen;
        const wuz = wdz / realLen;
        const wnx = -wuz;
        const wnz = wux;

        const fX = (wx1 + wx2) / 2 + 0.1 * wnx;
        const fZ = (wz1 + wz2) / 2 + 0.1 * wnz;
        const bX = (wx1 + wx2) / 2 - 0.1 * wnx;
        const bZ = (wz1 + wz2) / 2 - 0.1 * wnz;

        const roomF = ctx.testMap.getRoomAt(fX, fZ);
        const roomB = ctx.testMap.getRoomAt(bX, bZ);

        const isF = roomF && roomF.id === room.id;
        const isB = roomB && roomB.id === room.id;

        if (isF) {
          ctx.testMap.updateWall(w.id, buildWallSurfacePatch('front', component, srcWallMaterial, srcWallColor));
          count++;
        } else if (isB) {
          ctx.testMap.updateWall(w.id, buildWallSurfacePatch('back', component, srcWallMaterial, srcWallColor));
          count++;
        } else if (component === 'main') {
          ctx.testMap.updateWall(w.id, { material: srcMaterial, color: srcColor });
          count++;
        }
      });

      ctx.showToast(`Applied to ${count} walls in this room`);
      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
    } else if (target.type === 'item') {
      const updatedItem = ctx.testMap.getEntity('item', target.id);
      if (updatedItem) {
        ctx.pushHistory();
        if (ctx.testMap.refreshItemRoomLinks) {
          ctx.testMap.refreshItemRoomLinks();
        }
        const currentRoomId = updatedItem.roomId;

        const items = ctx.testMap.getEntities('item');
        let count = 0;
        items.forEach(it => {
          const isSameRoom = (currentRoomId && it.roomId === currentRoomId) || (!currentRoomId && !it.roomId);
          if (it.type === updatedItem.type && isSameRoom && it.id !== updatedItem.id && !isTargetLocked({ type: 'item', id: it.id })) {
            it.materials = JSON.parse(JSON.stringify(updatedItem.materials || {}));
            it.colors = JSON.parse(JSON.stringify(updatedItem.colors || {}));
            ctx.testMap.updateItem(it.id, { materials: it.materials, colors: it.colors });
            count++;
          }
        });

        if (currentRoomId) {
          ctx.showToast(`Applied to ${count} other matching furniture in this room`);
        } else {
          ctx.showToast(`Applied to ${count} other matching furniture outside rooms`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getEntity('fence', target.id);
      if (fence) {
        ctx.pushHistory();

        //   fence  Room 
        let fenceRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) fenceRoomId = room.id;
        } else {
          const mx = (fence.from[0] + fence.to[0]) / 2;
          const mz = (fence.from[1] + fence.to[1]) / 2;
          const room = ctx.testMap.getRoomAt(mx, mz);
          if (room) fenceRoomId = room.id;
        }

        const fences = ctx.testMap.getEntities('fence');
        let count = 0;
        fences.forEach(f => {
          if (f.floorId === fence.floorId && f.subtype === fence.subtype && f.id !== fence.id && !isTargetLocked({ type: 'fence', id: f.id })) {
            const fmx = (f.from[0] + f.to[0]) / 2;
            const fmz = (f.from[1] + f.to[1]) / 2;
            const fRoom = ctx.testMap.getRoomAt(fmx, fmz);
            const fRoomId = fRoom ? fRoom.id : null;

            const isSameRoom = (fenceRoomId && fRoomId === fenceRoomId) || (!fenceRoomId && !fRoomId);
            if (isSameRoom) {
              ctx.testMap.updateFence(f.id, {
                material: fence.material,
                color: fence.color,
                frameMaterial: fence.frameMaterial,
                frameColor: fence.frameColor,
                panelMaterial: fence.panelMaterial,
                panelColor: fence.panelColor
              });
              count++;
            }
          }
        });

        if (fenceRoomId) {
          ctx.showToast(`Applied to ${count} other fences in this room`);
        } else {
          ctx.showToast(`Applied to ${count} other fences outside rooms`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getEntity('fence_gate', target.id);
      if (gate) {
        ctx.pushHistory();

        //   gate  Room 
        let gateRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) gateRoomId = room.id;
        } else {
          const gmx = (gate.from[0] + gate.to[0]) / 2;
          const gmz = (gate.from[1] + gate.to[1]) / 2;
          const room = ctx.testMap.getRoomAt(gmx, gmz);
          if (room) gateRoomId = room.id;
        }

        const gates = ctx.testMap.getEntities('fence_gate');
        let count = 0;
        gates.forEach(g => {
          if (g.floorId === gate.floorId && g.subtype === gate.subtype && g.id !== gate.id && !isTargetLocked({ type: 'fence_gate', id: g.id })) {
            const gmx = (g.from[0] + g.to[0]) / 2;
            const gmz = (g.from[1] + g.to[1]) / 2;
            const gRoom = ctx.testMap.getRoomAt(gmx, gmz);
            const gRoomId = gRoom ? gRoom.id : null;

            const isSameRoom = (gateRoomId && gRoomId === gateRoomId) || (!gateRoomId && !gRoomId);
            if (isSameRoom) {
              ctx.testMap.updateFenceGate(g.id, {
                frameMaterial: gate.frameMaterial,
                frameColor: gate.frameColor,
                panelMaterial: gate.panelMaterial,
                panelColor: gate.panelColor
              });
              count++;
            }
          }
        });

        if (gateRoomId) {
          ctx.showToast(`Applied to ${count} other gates in this room`);
        } else {
          ctx.showToast(`Applied to ${count} other gates outside rooms`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getEntity('opening', target.id);
      if (opening) {
        ctx.pushHistory();

        //   opening  Room 
        let opRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) opRoomId = room.id;
        }
        if (!opRoomId) {
          const wall = opening ? ctx.testMap.getEntity('wall', opening.wallId) : null;
          if (wall) {
            const mx = (wall.from[0] + wall.to[0]) / 2;
            const mz = (wall.from[1] + wall.to[1]) / 2;
            const room = ctx.testMap.getRoomAt(mx, mz);
            if (room) opRoomId = room.id;
          }
        }

        const openings = ctx.testMap.getEntities('opening');
        let count = 0;

        let roomWallSet = new Set();
        if (opRoomId) {
          const roomObj = ctx.testMap.getEntity('room', opRoomId);
          const roomWallIds = roomObj ? Object.values(roomObj.wallIds || {}) : [];
          roomWallSet = new Set(roomWallIds);
        }

        openings.forEach(op => {
          if (op.floorId === opening.floorId && op.type === opening.type && op.id !== opening.id && !isTargetLocked({ type: 'opening', id: op.id })) {
            if (opRoomId) {
              if (roomWallSet.has(op.wallId)) {
                ctx.testMap.updateOpening(op.id, {
                  material: opening.material,
                  color: opening.color,
                  frameMaterial: opening.frameMaterial,
                  panelMaterial: opening.panelMaterial,
                  glassMaterial: opening.glassMaterial
                });
                count++;
              }
            } else {
              const opWall = ctx.testMap.getEntity('wall', op.wallId);
              let opWallRoomId = null;
              if (opWall) {
                const opmx = (opWall.from[0] + opWall.to[0]) / 2;
                const opmz = (opWall.from[1] + opWall.to[1]) / 2;
                const opRoom = ctx.testMap.getRoomAt(opmx, opmz);
                if (opRoom) opWallRoomId = opRoom.id;
              }
              if (!opWallRoomId) {
                ctx.testMap.updateOpening(op.id, {
                  material: opening.material,
                  color: opening.color,
                  frameMaterial: opening.frameMaterial,
                  panelMaterial: opening.panelMaterial,
                  glassMaterial: opening.glassMaterial
                });
                count++;
              }
            }
          }
        });

        if (opRoomId) {
          ctx.showToast(`Applied to ${count} other doors/windows in this room`);
        } else {
          ctx.showToast(`Applied to ${count} other doors/windows outside rooms`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getEntity('roof', target.id);
      if (roof) {
        ctx.pushHistory();

        //   roof  Room 
        let roofRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) roofRoomId = room.id;
        }

        const roofs = ctx.testMap.getEntities('roof');
        let count = 0;
        roofs.forEach(r => {
          if (r.floorId === roof.floorId && r.id !== roof.id && !isTargetLocked({ type: 'roof', id: r.id })) {
            const rRoom = ctx.testMap.getRoomAt(r.x || 0, r.z || 0);
            const rRoomId = rRoom ? rRoom.id : null;

            const isSameRoom = (roofRoomId && rRoomId === roofRoomId) || (!roofRoomId && !rRoomId);
            if (isSameRoom) {
              ctx.testMap.updateRoof(r.id, {
                material: roof.material,
                color: roof.color,
                sideMaterial: roof.sideMaterial,
                sideColor: roof.sideColor,
                bottomMaterial: roof.bottomMaterial,
                bottomColor: roof.bottomColor,
                frameMaterial: roof.frameMaterial,
                frameColor: roof.frameColor
              });
              count++;
            }
          }
        });

        if (roofRoomId) {
          ctx.showToast(`Applied to ${count} other roofs in this room`);
        } else {
          ctx.showToast(`Applied to ${count} other roofs outside rooms`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getEntity('stairs', target.id);
      if (stairs) {
        ctx.pushHistory();

        //   stairs  Room 
        let stairsRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) stairsRoomId = room.id;
        }

        const stairsList = ctx.testMap.getEntities('stairs');
        let count = 0;
        stairsList.forEach(st => {
          if (st.floorId === stairs.floorId && st.id !== stairs.id && !isTargetLocked({ type: 'stairs', id: st.id })) {
            const stRoom = ctx.testMap.getRoomAt(st.x || 0, st.z || 0);
            const stRoomId = stRoom ? stRoom.id : null;

            const isSameRoom = (stairsRoomId && stRoomId === stairsRoomId) || (!stairsRoomId && !stRoomId);
            if (isSameRoom) {
              ctx.testMap.updateStairs(st.id, {
                material: stairs.material,
                color: stairs.color,
                sideMaterial: stairs.sideMaterial,
                sideColor: stairs.sideColor
              });
              count++;
            }
          }
        });

        if (stairsRoomId) {
          ctx.showToast(`Applied to ${count} other stairs in this room`);
        } else {
          ctx.showToast(`Applied to ${count} other stairs outside rooms`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    }
  }
}
