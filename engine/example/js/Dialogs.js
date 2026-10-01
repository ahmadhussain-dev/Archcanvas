import { formatTimestamp } from './Store.js';
import { toggleFirstPerson, exitFirstPerson, updateFirstPersonConfig } from './FirstPersonController.js';
import { set2DPanSpeed } from './SvgEvents.js';
import furnitureUploadExampleSource from '../downloads/custom-furniture-example.js?raw';
import furnitureUploadSkillSource from '../../skills/furniture-upload/SKILL.md?raw';
import buildingExampleSource from '../downloads/loft-building-example.b3dbuilding.json?raw';
import buildingSkillSource from '../../skills/create-buildings/SKILL.md?raw';

// ==========================================
// Custom  ( Glass)
// ==========================================

export function showCustomConfirm(title, message = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = ' Item';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">${finalMessage}</div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel"> Item</button>
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-confirm"> Item</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      resolve(value);
    };

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#custom-modal-confirm').addEventListener('click', () => cleanup(true));
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(false);
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        cleanup(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

export function showCustomAlert(title, message = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = ' Item';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">${finalMessage}</div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-ok"> Item</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      resolve();
    };

    backdrop.querySelector('#custom-modal-ok').addEventListener('click', cleanup);
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup();
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        cleanup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

/**
 *  
 * @param {string} title -  
 * @param {string} message -  
 * @param {string} [defaultValue=''] -  
 * @returns {Promise<string|null>}  ，  null
 */
export function showCustomPrompt(title, message = '', defaultValue = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';

    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = ' Item';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">
          <p style="margin:0 0 12px 0">${finalMessage}</p>
          <input type="text" id="custom-modal-input" class="custom-modal-input" value="${defaultValue.replace(/"/g, '&quot;')}" autocomplete="off" />
        </div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel"> Item</button>
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-confirm"> Item</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');

    const inputEl = backdrop.querySelector('#custom-modal-input');
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });

    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => backdrop.remove(), 200);
      resolve(value);
    };

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(null));
    backdrop.querySelector('#custom-modal-confirm').addEventListener('click', () => {
      const val = inputEl.value.trim();
      cleanup(val || null);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(null);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const val = inputEl.value.trim();
        cleanup(val || null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

/**
 *  ， Open Delete
 * @param {{ id: string, name: string, savedAt: number }[]} projects
 * @returns {Promise<{ action: 'open'|'delete', name: string }|null>}
 */
export function showProjectListModal(projects) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';

    const listHtml = projects.map((p) => {
      const timeStr = formatTimestamp(p.savedAt);
      return `
        <div class="project-list-item" data-name="${p.name.replace(/"/g, '&quot;')}">
          <div class="project-list-item-info">
            <span class="project-list-item-name">${p.name}</span>
            <span class="project-list-item-time">${timeStr}</span>
          </div>
          <div class="project-list-item-actions">
            <button type="button" class="custom-modal-btn btn-primary btn-sm project-open-btn" title="Open">Open</button>
            <button type="button" class="custom-modal-btn btn-danger btn-sm project-delete-btn" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="custom-modal-container" style="max-width:480px">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="custom-modal-title">Open Item</h3>
        </div>
        <div class="custom-modal-body" style="margin-bottom:16px">
          <div class="project-list">${listHtml}</div>
        </div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel"> Item</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');

    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => backdrop.remove(), 200);
      resolve(value);
    };

    // Open 
    backdrop.querySelectorAll('.project-open-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.project-list-item');
        cleanup({ action: 'open', name: item.dataset.name });
      });
    });

    // Delete 
    backdrop.querySelectorAll('.project-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.project-list-item');
        cleanup({ action: 'delete', name: item.dataset.name });
      });
    });

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(null));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(null);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

export function show3MFExportDialog() {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    backdrop.innerHTML = `
      <div class="custom-modal-container" style="max-width: 420px; position: relative; max-height: 90vh; overflow-y: auto;">
        <button type="button" class="custom-modal-close" id="export-close-btn" aria-label=" Item">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3 class="custom-modal-title">Export 3MF  Item</h3>
        </div>
        <div class="custom-modal-body" style="text-align: center; font-size: 14px; color: var(--text-secondary, #666); line-height: 1.5;">

          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <input type="checkbox" id="enable-tenon-joint" checked style="cursor: pointer; width: 15px; height: 15px; margin: 0;">
            <label for="enable-tenon-joint" style="cursor: pointer; font-size: 13px; color: var(--text-primary, #333); user-select: none;"> Item ( Item)</label>
          </div>
        </div>
        <div class="custom-modal-footer" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
          <button type="button" class="custom-modal-btn btn-primary" id="export-building-only" style="width: 100%; margin: 0; padding: 12px 16px;"> ItemExport Item ( Item、 Item、 Item、 Item)</button>
          <button type="button" class="custom-modal-btn btn-primary" id="export-furniture-only" style="width: 100%; margin: 0; padding: 12px 16px;"> ItemExportFurniture ( Item)</button>
          <button type="button" class="custom-modal-btn btn-secondary" id="export-all" style="width: 100%; margin: 0; padding: 12px 16px; border: 1px solid var(--border-color, #ddd);">ExportAll ( Item 3MF  Item)</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = (choice) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      
      if (choice) {
        resolve({
          category: choice,
          enableTenon: backdrop.querySelector('#enable-tenon-joint').checked
        });
      } else {
        resolve(null);
      }
    };

    backdrop.querySelector('#export-building-only').addEventListener('click', () => cleanup('building'));
    backdrop.querySelector('#export-furniture-only').addEventListener('click', () => cleanup('furniture'));
    backdrop.querySelector('#export-all').addEventListener('click', () => cleanup('all'));
    backdrop.querySelector('#export-close-btn').addEventListener('click', () => cleanup(null));
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(null);
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

function downloadTextFile(content, fileName, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function showFurnitureUploadHelp() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-modal-backdrop';
  backdrop.innerHTML = `
    <div class="custom-modal-container furniture-upload-modal" role="dialog" aria-modal="true" aria-labelledby="furniture-upload-modal-title">
      <div class="custom-modal-header">
        <h3 id="furniture-upload-modal-title" class="custom-modal-title"> ItemFurniture</h3>
      </div>
      <div class="custom-modal-body furniture-upload-modal-body">
        <p> ItemCustom <code>.js</code>  Item <code>.mjs</code>  Item， ItemFurniture ItemCustom Item。</p>
        <p class="furniture-upload-tip"> Item： Item， Item。</p>
        <div class="furniture-upload-links">
          <button id="btn-download-furniture-example" type="button" class="custom-modal-btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> Furniture 
          </button>
          <button id="btn-download-furniture-skill" type="button" class="custom-modal-btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>  AI  
          </button>
        </div>
      </div>
      <div class="custom-modal-footer">
        <button id="btn-close-furniture-upload-help" type="button" class="custom-modal-btn btn-primary"> Item</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.getBoundingClientRect();
  backdrop.classList.add('active');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    backdrop.classList.remove('active');
    window.removeEventListener('keydown', handleKeyDown);
    setTimeout(() => backdrop.remove(), 200);
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cleanup();
    }
  };

  backdrop.querySelector('#btn-download-furniture-example').addEventListener('click', () => {
    downloadTextFile(furnitureUploadExampleSource, 'custom-furniture-example.js', 'text/javascript;charset=utf-8');
  });
  backdrop.querySelector('#btn-download-furniture-skill').addEventListener('click', () => {
    downloadTextFile(furnitureUploadSkillSource, 'SKILL.md', 'text/markdown;charset=utf-8');
  });
  backdrop.querySelector('#btn-close-furniture-upload-help').addEventListener('click', cleanup);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) cleanup();
  });
  window.addEventListener('keydown', handleKeyDown);
}

export function showAiBuildingHelp() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-modal-backdrop';
  backdrop.innerHTML = `
    <div class="custom-modal-container furniture-upload-modal" role="dialog" aria-modal="true" aria-labelledby="ai-building-modal-title">
      <div class="custom-modal-header">
        <h3 id="ai-building-modal-title" class="custom-modal-title">AI  Item 3D  Item</h3>
      </div>
      <div class="custom-modal-body furniture-upload-modal-body">
        <p> Item AI  Item， ItemFloorplan Item <code>blueprint3d-babylon.building.v1</code>  Item <code>.b3dbuilding.json</code>  Item。</p>
        <p class="furniture-upload-tip"> Item： Item AI  Item JSON  Item， Item 3D  ItemDesign Item。</p>
        <div class="furniture-upload-links">
          <button id="btn-download-building-example" type="button" class="custom-modal-btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> 
          </button>
          <button id="btn-download-building-skill" type="button" class="custom-modal-btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>  AI  
          </button>
        </div>
      </div>
      <div class="custom-modal-footer">
        <button id="btn-close-ai-building-help" type="button" class="custom-modal-btn btn-primary"> Item</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.getBoundingClientRect();
  backdrop.classList.add('active');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    backdrop.classList.remove('active');
    window.removeEventListener('keydown', handleKeyDown);
    setTimeout(() => backdrop.remove(), 200);
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cleanup();
    }
  };

  backdrop.querySelector('#btn-download-building-example').addEventListener('click', () => {
    downloadTextFile(buildingExampleSource, 'loft-building-example.b3dbuilding.json', 'application/json;charset=utf-8');
  });
  backdrop.querySelector('#btn-download-building-skill').addEventListener('click', () => {
    downloadTextFile(buildingSkillSource, 'SKILL.md', 'text/markdown;charset=utf-8');
  });
  backdrop.querySelector('#btn-close-ai-building-help').addEventListener('click', cleanup);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) cleanup();
  });
  window.addEventListener('keydown', handleKeyDown);
}

/**
 *  Rotate 
 * @param {string} title -  
 * @param {string} message -  
 * @returns {Object}   close()  ， 
 */
export function showLoading(title, message = '') {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-modal-backdrop';
  
  let finalTitle = title;
  let finalMessage = message;
  if (!message) {
    finalTitle = ' Item';
    finalMessage = title;
  }

  backdrop.innerHTML = `
    <div class="custom-modal-container" role="dialog" aria-modal="true" style="text-align: center; padding: 30px; max-width: 320px;">
      <div class="custom-modal-spinner" style="margin: 0 auto 20px auto; width: 36px; height: 36px; border: 3px solid rgba(0, 0, 0, 0.08); border-top-color: var(--primary-color, #2563eb); border-radius: 50%; animation: custom-modal-spin 0.8s linear infinite;"></div>
      <style>
        @keyframes custom-modal-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <h3 class="custom-modal-title" style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${finalTitle}</h3>
      <div class="custom-modal-body" style="padding: 0; font-size: 14px; color: var(--text-secondary-color, #666); line-height: 1.5;">${finalMessage}</div>
    </div>
  `;
  
  document.body.appendChild(backdrop);
  backdrop.getBoundingClientRect();
  backdrop.classList.add('active');
  
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    backdrop.classList.remove('active');
    setTimeout(() => {
      backdrop.remove();
    }, 200);
  };

  return {
    close: cleanup
  };
}

/**
 *  
 * @param {Object} [appContext] -  
 */
export function showSettingsModal(appContext = {}) {
  //  
  document.querySelectorAll('.settings-modal-backdrop').forEach(el => el.remove());

  const backdrop = document.createElement('div');
  backdrop.className = 'custom-modal-backdrop settings-modal-backdrop';

  //  （ ）
  const skyboxEl = document.getElementById('floor-skybox-enabled');
  const advRenderEl = document.getElementById('show-advanced-rendering');
  const showAllFloorsEl = document.getElementById('show-all-floors');
  const snapToggleBtn = document.getElementById('btn-snap-toggle');
  
  const currentSkybox = skyboxEl ? skyboxEl.checked : true;
  const currentAdvRender = advRenderEl ? advRenderEl.checked : false;
  const currentShowAllFloors = showAllFloorsEl ? showAllFloorsEl.checked : false;
  const currentSnapEnabled = snapToggleBtn ? !snapToggleBtn.classList.contains('off') : true;

  const cameraSettings = appContext.cameraSettings || {
    pan2DSpeed: 1.0,
    pan3DSpeed: 1.0,
    rotate3DSpeed: 1.0,
    camera3DFov: 60,
    fpMoveSpeed: 1.0,
    fpLookSensitivity: 1.0,
    fpFov: 75,
  };
  const isFPActive = !!window.firstPersonActive;
  const currentUndoSteps = appContext.store?.getMaxHistory() ?? 80;
  const renderSettings = appContext.renderSettings || {
    reflectionQuality: 'medium',
    shadowQuality: 'high',
    graphicsPreset: 'high',
  };

  backdrop.innerHTML = `
    <div class="custom-modal-container settings-modal-container" role="dialog" aria-modal="true">
      <div class="settings-modal-header">
        <div class="settings-modal-title-wrapper">
          <svg class="settings-header-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <h3> Item</h3>
        </div>
        <button type="button" class="custom-modal-close" id="btn-close-settings" aria-label=" Item">✕</button>
      </div>

      <div class="settings-modal-body">
        <!--  Item 5  Item -->
        <nav class="settings-tabs-sidebar" aria-label=" Item">
          <div class="settings-tabs-slider" id="settings-tabs-slider"></div>
          <button type="button" class="settings-tab-item active" data-tab="tab-rendering">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10"/></svg>
            <span> Item</span>
          </button>
          <button type="button" class="settings-tab-item" data-tab="tab-editor">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
            <span> Item</span>
          </button>
          <button type="button" class="settings-tab-item" data-tab="tab-camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>
            <span> Item</span>
          </button>
          <button type="button" class="settings-tab-item" data-tab="tab-simulation">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            <span> Item</span>
          </button>
          <button type="button" class="settings-tab-item" data-tab="tab-ai">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>
            <span> Item AI</span>
          </button>
        </nav>

        <!--  Item -->
        <div class="settings-tab-content">

          <!-- 1.  Item -->
          <div class="settings-panel active" id="tab-rendering">
            <h4 class="panel-section-title"> Item</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> ItemSky Item</span>
                <span class="setting-desc"> Item 360  ItemSky Item</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="set-skybox" ${currentSkybox ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item 3D  Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="set-grid" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="set-show-all-floors" ${currentShowAllFloors ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <h4 class="panel-section-title"> Item</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-graphics-preset">
                  <option value="ultra" ${renderSettings.graphicsPreset === 'ultra' ? 'selected' : ''}> Item</option>
                  <option value="high" ${renderSettings.graphicsPreset === 'high' ? 'selected' : ''}> Item</option>
                  <option value="medium" ${renderSettings.graphicsPreset === 'medium' ? 'selected' : ''}> Item</option>
                  <option value="low" ${renderSettings.graphicsPreset === 'low' ? 'selected' : ''}> Item</option>
                </select>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-shadow-quality">
                  <option value="ultra" ${renderSettings.shadowQuality === 'ultra' ? 'selected' : ''}> Item</option>
                  <option value="high" ${renderSettings.shadowQuality === 'high' ? 'selected' : ''}> Item</option>
                  <option value="medium" ${renderSettings.shadowQuality === 'medium' ? 'selected' : ''}> Item</option>
                  <option value="off" ${renderSettings.shadowQuality === 'off' ? 'selected' : ''}> Item</option>
                </select>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> ItemHigh Quality， ItemMirror Item</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-reflection-quality">
                  <option value="ultra" ${renderSettings.reflectionQuality === 'ultra' ? 'selected' : ''}> Item</option>
                  <option value="high" ${renderSettings.reflectionQuality === 'high' ? 'selected' : ''}> Item</option>
                  <option value="medium" ${renderSettings.reflectionQuality === 'medium' ? 'selected' : ''}> Item</option>
                  <option value="low" ${renderSettings.reflectionQuality === 'low' ? 'selected' : ''}> Item</option>
                </select>
              </div>
            </div>

          </div>

          <!-- 2.  Item -->
          <div class="settings-panel" id="tab-editor">
            <h4 class="panel-section-title"> Item</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> ItemFurniture Item</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="set-snap" ${currentSnapEnabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item（ Item 1m）</span>
              </div>
              <div class="setting-control">
                <input type="text" class="settings-input" value="1m" disabled readonly style="width: 90px; text-align: center; font-weight: bold; background: #f1f5f9; color: #94a3b8; cursor: not-allowed;" />
              </div>
            </div>

            <h4 class="panel-section-title"> Item</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> ItemUndo Item</span>
                <span class="setting-desc"> ItemUndo/Redo Item（ Item 80  Item）</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-undo-steps" min="20" max="200" step="5" value="${currentUndoSteps}">
                  <span class="range-val" id="val-undo-steps">${currentUndoSteps}  Item</span>
                  <button type="button" class="btn-range-reset" data-target="set-undo-steps" data-val-target="val-undo-steps" data-default="80" data-suffix="  Item" title=" Item 80  Item" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3.  Item -->
          <div class="settings-panel" id="tab-camera">
            <h4 class="panel-section-title"> Item</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">2D  Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-2d-speed" min="0.5" max="2.0" step="0.1" value="${cameraSettings.pan2DSpeed ?? 1.0}">
                  <span class="range-val" id="val-2d-speed">${cameraSettings.pan2DSpeed ?? 1.0}x</span>
                  <button type="button" class="btn-range-reset" data-target="set-2d-speed" data-val-target="val-2d-speed" data-default="1.0" data-suffix="x" title=" Item 1.0x" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">3D  Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-3d-pan" min="0.5" max="2.0" step="0.1" value="${cameraSettings.pan3DSpeed ?? 1.0}">
                  <span class="range-val" id="val-3d-pan">${cameraSettings.pan3DSpeed ?? 1.0}x</span>
                  <button type="button" class="btn-range-reset" data-target="set-3d-pan" data-val-target="val-3d-pan" data-default="1.0" data-suffix="x" title=" Item 1.0x" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">3D  ItemRotate Item</span>
                <span class="setting-desc"> ItemRotate Item</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-3d-rotate" min="0.5" max="2.0" step="0.1" value="${cameraSettings.rotate3DSpeed ?? 1.0}">
                  <span class="range-val" id="val-3d-rotate">${cameraSettings.rotate3DSpeed ?? 1.0}x</span>
                  <button type="button" class="btn-range-reset" data-target="set-3d-rotate" data-val-target="val-3d-rotate" data-default="1.0" data-suffix="x" title=" Item 1.0x" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">3D  Item (FOV)</span>
                <span class="setting-desc"> Item ( Item 60°)</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-3d-fov" min="30" max="120" step="1" value="${cameraSettings.camera3DFov ?? 60}">
                  <span class="range-val" id="val-3d-fov">${cameraSettings.camera3DFov ?? 60}°</span>
                  <button type="button" class="btn-range-reset" data-target="set-3d-fov" data-val-target="val-3d-fov" data-default="60" data-suffix="°" title=" Item 60°" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <h4 class="panel-section-title"> Item</h4>
             <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item 3D  Item</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="set-fp-mode" ${isFPActive ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item WASD  Item</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-fp-move" min="0.5" max="2.0" step="0.1" value="${cameraSettings.fpMoveSpeed ?? 1.0}">
                  <span class="range-val" id="val-fp-move">${cameraSettings.fpMoveSpeed ?? 1.0}x</span>
                  <button type="button" class="btn-range-reset" data-target="set-fp-move" data-val-target="val-fp-move" data-default="1.0" data-suffix="x" title=" Item 1.0x" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-fp-look" min="0.5" max="2.0" step="0.1" value="${cameraSettings.fpLookSensitivity ?? 1.0}">
                  <span class="range-val" id="val-fp-look">${cameraSettings.fpLookSensitivity ?? 1.0}x</span>
                  <button type="button" class="btn-range-reset" data-target="set-fp-look" data-val-target="val-fp-look" data-default="1.0" data-suffix="x" title=" Item 1.0x" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> Item (FOV)</span>
              </div>
              <div class="setting-control">
                <div class="slider-with-val">
                  <input type="range" class="settings-range" id="set-fp-fov" min="60" max="110" step="5" value="${cameraSettings.fpFov ?? 75}">
                  <span class="range-val" id="val-fp-fov">${cameraSettings.fpFov ?? 75}°</span>
                  <button type="button" class="btn-range-reset" data-target="set-fp-fov" data-val-target="val-fp-fov" data-default="75" data-suffix="°" title=" Item 75°" aria-label=" Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4.  Item -->
          <div class="settings-panel" id="tab-simulation">
            <h4 class="panel-section-title"> ItemSave</h4>
            <div class="setting-item disabled">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> ItemDesign、 Item（ Item）</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-game-mode" disabled>
                  <option value="architect" selected> ItemDesign Item</option>
                  <option value="management"> Item</option>
                  <option value="tour"> Item</option>
                </select>
              </div>
            </div>

            <div class="setting-item disabled">
              <div class="setting-info">
                <span class="setting-label"> ItemSave Item</span>
                <span class="setting-desc"> Item（ Item）</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-autosave" disabled>
                  <option value="0"> ItemSave</option>
                  <option value="5" selected> Item 5  Item</option>
                  <option value="10"> Item 10  Item</option>
                  <option value="30"> Item 30  Item</option>
                </select>
              </div>
            </div>

            <h4 class="panel-section-title"> Item</h4>
            <div class="setting-item disabled">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc">Select Item（ Item）</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-language" disabled>
                  <option value="zh-CN" selected> Item (zh-CN)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </div>
            </div>

            <div class="setting-item disabled">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc"> ItemDisplay Mode（ Item）</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-theme" disabled>
                  <option value="light" selected> Item (Light)</option>
                  <option value="dark"> Item (Dark)</option>
                  <option value="system"> Item</option>
                </select>
              </div>
            </div>

            <div class="setting-item disabled">
              <div class="setting-info">
                <span class="setting-label"> Item</span>
                <span class="setting-desc">Select Item（ Item m）</span>
              </div>
              <div class="setting-control">
                <select class="settings-select" id="set-unit" disabled>
                  <option value="m" selected> Item (m)</option>
                  <option value="cm"> Item (cm)</option>
                  <option value="in"> Item (in)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 5.  Item AI -->
          <div class="settings-panel" id="tab-ai">
            
            <div class="ai-feature-card">
              <div class="ai-card-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
                <div>
                  <strong class="ai-card-title">AI  Item 3D  Item</strong>
                  <div class="ai-card-desc">
                    <p style="margin: 0 0 4px 0;"> Item AI  Item， ItemFloorplan Item <code>blueprint3d-babylon.building.v1</code>  Item <code>.b3dbuilding.json</code>  Item。 Item“ Item” Item。</p>
                    <p style="margin: 0; font-size: 11.5px; color: #64748b;"> Item： Item AI  Item JSON  Item。</p>
                  </div>
                </div>
              </div>
              <div class="ai-card-actions-row">
                <button type="button" class="custom-modal-btn btn-secondary btn-sm" id="btn-settings-download-building-example">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> 
                </button>
                <button type="button" class="custom-modal-btn btn-secondary btn-sm" id="btn-settings-download-building-skill">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>  AI  
                </button>
                <button type="button" class="custom-modal-btn btn-primary btn-sm" id="btn-settings-import-building">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 
                </button>
              </div>
            </div>

            <div class="ai-feature-card" style="margin-top: 10px;">
              <div class="ai-card-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5"/><path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2Z"/><path d="M6 18v2"/><path d="M18 18v2"/></svg>
                <div>
                  <strong class="ai-card-title">AI  ItemFurniture</strong>
                  <div class="ai-card-desc">
                    <p style="margin: 0 0 4px 0;"> Item AI  ItemCustom 3D Furniture Item (<code>.js</code>  Item <code>.mjs</code>)  Item， Item“ ItemFurniture”Select ItemCustomFurniture Item。</p>
                    <p style="margin: 0; font-size: 11.5px; color: #64748b;"> Item： Item， Item。</p>
                  </div>
                </div>
              </div>
              <div class="ai-card-actions-row">
                <button type="button" class="custom-modal-btn btn-secondary btn-sm" id="btn-settings-download-furniture-example">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> Furniture 
                </button>
                <button type="button" class="custom-modal-btn btn-secondary btn-sm" id="btn-settings-download-furniture-skill">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>  AI  
                </button>
                <button type="button" class="custom-modal-btn btn-primary btn-sm" id="btn-settings-upload-furniture">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Furniture
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
      <div class="settings-modal-footer">
        <button type="button" class="custom-modal-btn btn-secondary" id="btn-reset-settings"> Item</button>
        <div class="footer-actions-right">
          <button type="button" class="custom-modal-btn btn-secondary" id="btn-cancel-settings"> Item</button>
          <button type="button" class="custom-modal-btn btn-primary" id="btn-apply-settings"> Item</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.getBoundingClientRect();
  backdrop.classList.add('active');

  let isCleaned = false;
  const cleanup = () => {
    if (isCleaned) return;
    isCleaned = true;
    backdrop.classList.remove('active');
    window.removeEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      backdrop.remove();
    }, 200);
  };

  // 1. Tab  
  const tabButtons = Array.from(backdrop.querySelectorAll('.settings-tab-item'));
  const tabPanels = Array.from(backdrop.querySelectorAll('.settings-panel'));
  const sliderEl = backdrop.querySelector('#settings-tabs-slider');

  const updateSlider = (activeBtn) => {
    if (!activeBtn || !sliderEl) return;
    sliderEl.style.transform = `translateY(${activeBtn.offsetTop}px)`;
    sliderEl.style.height = `${activeBtn.offsetHeight}px`;
  };

  //   DOM  
  setTimeout(() => {
    const initialActive = backdrop.querySelector('.settings-tab-item.active');
    if (initialActive) updateSlider(initialActive);
  }, 10);

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      backdrop.querySelector(`#${targetTab}`)?.classList.add('active');
      updateSlider(btn);
    });
  });

  // 2.  
  const ranges = [
    { rangeId: 'set-undo-steps', valId: 'val-undo-steps', suffix: '  Item' },
    { rangeId: 'set-2d-speed', valId: 'val-2d-speed', suffix: 'x' },
    { rangeId: 'set-3d-rotate', valId: 'val-3d-rotate', suffix: 'x' },
    { rangeId: 'set-3d-pan', valId: 'val-3d-pan', suffix: 'x' },
    { rangeId: 'set-3d-fov', valId: 'val-3d-fov', suffix: '°' },
    { rangeId: 'set-fp-move', valId: 'val-fp-move', suffix: 'x' },
    { rangeId: 'set-fp-look', valId: 'val-fp-look', suffix: 'x' },
    { rangeId: 'set-fp-fov', valId: 'val-fp-fov', suffix: '°' },
  ];
  ranges.forEach(({ rangeId, valId, suffix }) => {
    const rangeEl = backdrop.querySelector(`#${rangeId}`);
    const valEl = backdrop.querySelector(`#${valId}`);
    if (rangeEl && valEl) {
      rangeEl.addEventListener('input', () => {
        valEl.textContent = rangeEl.value + suffix;
      });
    }
  });

  // 3.   1   (Sky , 3D , High Quality,  )
  backdrop.querySelector('#set-skybox')?.addEventListener('change', (e) => {
    if (skyboxEl) {
      skyboxEl.checked = e.target.checked;
      skyboxEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  backdrop.querySelector('#set-adv-render')?.addEventListener('change', (e) => {
    if (advRenderEl) {
      advRenderEl.checked = e.target.checked;
      advRenderEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const selectEl = backdrop.querySelector('#set-reflection-quality');
    if (e.target.checked) {
      renderSettings.reflectionQuality = 'high';
      if (selectEl) selectEl.value = 'high';
      appContext.viewer3d?.setReflectionQuality('high');
    } else {
      renderSettings.reflectionQuality = 'medium';
      if (selectEl) selectEl.value = 'medium';
      appContext.viewer3d?.setReflectionQuality('medium');
    }
    saveCamera();
  });

  backdrop.querySelector('#set-reflection-quality')?.addEventListener('change', (e) => {
    renderSettings.reflectionQuality = e.target.value;
    const isHighOrUltra = ['ultra', 'high'].includes(renderSettings.reflectionQuality);
    const advToggle = backdrop.querySelector('#set-adv-render');
    if (advToggle) advToggle.checked = isHighOrUltra;
    if (advRenderEl) {
      advRenderEl.checked = isHighOrUltra;
      advRenderEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    appContext.viewer3d?.setReflectionQuality(renderSettings.reflectionQuality);
    saveCamera();
  });

  backdrop.querySelector('#set-shadow-quality')?.addEventListener('change', (e) => {
    renderSettings.shadowQuality = e.target.value;
    appContext.viewer3d?.setShadowQuality(renderSettings.shadowQuality);
    saveCamera();
  });

  backdrop.querySelector('#set-graphics-preset')?.addEventListener('change', (e) => {
    renderSettings.graphicsPreset = e.target.value;
    appContext.viewer3d?.setGraphicsPreset(renderSettings.graphicsPreset);
    saveCamera();
  });

  backdrop.querySelector('#set-show-all-floors')?.addEventListener('change', (e) => {
    if (showAllFloorsEl) {
      showAllFloorsEl.checked = e.target.checked;
      showAllFloorsEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // 4.   2  Undo 
  backdrop.querySelector('#set-snap')?.addEventListener('change', (e) => {
    if (snapToggleBtn) {
      const isCurrentlyOff = snapToggleBtn.classList.contains('off');
      if (e.target.checked && isCurrentlyOff) {
        snapToggleBtn.click();
      } else if (!e.target.checked && !isCurrentlyOff) {
        snapToggleBtn.click();
      }
    }
  });

  backdrop.querySelector('#set-undo-steps')?.addEventListener('input', (e) => {
    const steps = Number(e.target.value);
    appContext.store?.setMaxHistory(steps);
    saveCamera();
  });

  //   3  
  const saveCamera = () => appContext.saveCameraSettings?.();

  backdrop.querySelector('#set-2d-speed')?.addEventListener('input', (e) => {
    cameraSettings.pan2DSpeed = Number(e.target.value);
    set2DPanSpeed(cameraSettings.pan2DSpeed);
    saveCamera();
  });

  backdrop.querySelector('#set-3d-pan')?.addEventListener('input', (e) => {
    cameraSettings.pan3DSpeed = Number(e.target.value);
    appContext.viewer3d?.set3DPanSpeed(cameraSettings.pan3DSpeed);
    saveCamera();
  });

  backdrop.querySelector('#set-3d-rotate')?.addEventListener('input', (e) => {
    cameraSettings.rotate3DSpeed = Number(e.target.value);
    appContext.viewer3d?.set3DRotateSpeed(cameraSettings.rotate3DSpeed);
    saveCamera();
  });

  backdrop.querySelector('#set-3d-fov')?.addEventListener('input', (e) => {
    cameraSettings.camera3DFov = Number(e.target.value);
    appContext.viewer3d?.setCameraFOV(cameraSettings.camera3DFov);
    saveCamera();
  });

  backdrop.querySelector('#set-fp-mode')?.addEventListener('change', (e) => {
    if (e.target.checked && !window.firstPersonActive) {
      cleanup();
      if (appContext.currentView !== '3d') {
        appContext.setView?.('3d');
      }
      toggleFirstPerson(appContext);
    } else if (!e.target.checked && window.firstPersonActive) {
      exitFirstPerson(appContext);
    }
  });

  backdrop.querySelector('#set-fp-move')?.addEventListener('input', (e) => {
    cameraSettings.fpMoveSpeed = Number(e.target.value);
    updateFirstPersonConfig({ moveSpeedScale: cameraSettings.fpMoveSpeed });
    saveCamera();
  });

  backdrop.querySelector('#set-fp-look')?.addEventListener('input', (e) => {
    cameraSettings.fpLookSensitivity = Number(e.target.value);
    updateFirstPersonConfig({ lookSensitivityScale: cameraSettings.fpLookSensitivity });
    saveCamera();
  });

  backdrop.querySelector('#set-fp-fov')?.addEventListener('input', (e) => {
    cameraSettings.fpFov = Number(e.target.value);
    updateFirstPersonConfig({ fovDeg: cameraSettings.fpFov });
    saveCamera();
  });

  //  
  backdrop.querySelectorAll('.btn-range-reset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const defaultVal = btn.getAttribute('data-default');
      const rangeEl = backdrop.querySelector(`#${targetId}`);
      if (rangeEl && defaultVal !== null) {
        rangeEl.value = defaultVal;
        rangeEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  // 5.   5 AI  / 
  backdrop.querySelector('#btn-settings-import-building')?.addEventListener('click', () => {
    cleanup();
    const input = document.getElementById('building-file-input');
    if (input) {
      input.value = '';
      input.click();
    }
  });
  backdrop.querySelector('#btn-settings-upload-furniture')?.addEventListener('click', () => {
    cleanup();
    const input = document.getElementById('furniture-upload-input');
    if (input) {
      input.value = '';
      input.click();
    }
  });
  backdrop.querySelector('#btn-settings-download-building-example')?.addEventListener('click', () => {
    downloadTextFile(buildingExampleSource, 'loft-building-example.b3dbuilding.json', 'application/json;charset=utf-8');
  });
  backdrop.querySelector('#btn-settings-download-building-skill')?.addEventListener('click', () => {
    downloadTextFile(buildingSkillSource, 'SKILL.md', 'text/markdown;charset=utf-8');
  });
  backdrop.querySelector('#btn-settings-download-furniture-example')?.addEventListener('click', () => {
    downloadTextFile(furnitureUploadExampleSource, 'custom-furniture-example.js', 'text/javascript;charset=utf-8');
  });
  backdrop.querySelector('#btn-settings-download-furniture-skill')?.addEventListener('click', () => {
    downloadTextFile(furnitureUploadSkillSource, 'SKILL.md', 'text/markdown;charset=utf-8');
  });

  // 6.  、 
  const initialCameraSettings = { ...cameraSettings };
  const initialRenderSettings = { ...renderSettings };
  const initialUndoSteps = appContext.store?.getMaxHistory() ?? 80;

  const cancelAndRestore = () => {
    Object.assign(cameraSettings, initialCameraSettings);
    Object.assign(renderSettings, initialRenderSettings);
    appContext.store?.setMaxHistory(initialUndoSteps);
    set2DPanSpeed(cameraSettings.pan2DSpeed);
    appContext.viewer3d?.set3DPanSpeed(cameraSettings.pan3DSpeed);
    appContext.viewer3d?.set3DRotateSpeed(cameraSettings.rotate3DSpeed);
    appContext.viewer3d?.setCameraFOV(cameraSettings.camera3DFov ?? 60);
    appContext.viewer3d?.setReflectionQuality(renderSettings.reflectionQuality);
    appContext.viewer3d?.setShadowQuality(renderSettings.shadowQuality);
    appContext.viewer3d?.setGraphicsPreset(renderSettings.graphicsPreset);
    updateFirstPersonConfig({
      moveSpeedScale: cameraSettings.fpMoveSpeed,
      lookSensitivityScale: cameraSettings.fpLookSensitivity,
      fovDeg: cameraSettings.fpFov ?? 75,
    });
    cleanup();
  };

  backdrop.querySelector('#btn-reset-settings')?.addEventListener('click', async () => {
    const ok = await showCustomConfirm(' Item？', ' Item、 Item？');
    if (!ok) return;

    //  All 
    cameraSettings.pan2DSpeed = 1.0;
    cameraSettings.pan3DSpeed = 1.0;
    cameraSettings.rotate3DSpeed = 1.0;
    cameraSettings.camera3DFov = 60;
    cameraSettings.fpMoveSpeed = 1.0;
    cameraSettings.fpLookSensitivity = 1.0;
    cameraSettings.fpFov = 75;

    appContext.viewer3d?.setCameraFOV(60);
    updateFirstPersonConfig({ fovDeg: 75 });

    renderSettings.reflectionQuality = 'medium';
    renderSettings.shadowQuality = 'high';
    renderSettings.graphicsPreset = 'high';

    appContext.viewer3d?.setReflectionQuality('medium');
    appContext.viewer3d?.setShadowQuality('high');
    appContext.viewer3d?.setGraphicsPreset('high');

    appContext.store?.setMaxHistory(80);

    //   3   DOM  
    const selectRef = backdrop.querySelector('#set-reflection-quality');
    if (selectRef) selectRef.value = 'medium';

    const selectSha = backdrop.querySelector('#set-shadow-quality');
    if (selectSha) selectSha.value = 'high';

    const selectGra = backdrop.querySelector('#set-graphics-preset');
    if (selectGra) selectGra.value = 'high';

    //  High Quality Toggle  
    const toggleAdv = backdrop.querySelector('#set-adv-render');
    if (toggleAdv) toggleAdv.checked = false;

    //  
    backdrop.querySelectorAll('.btn-range-reset').forEach((btn) => {
      const targetId = btn.getAttribute('data-target');
      const valId = btn.getAttribute('data-val-target');
      const defaultVal = btn.getAttribute('data-default');
      const suffix = btn.getAttribute('data-suffix') || '';
      const rangeEl = backdrop.querySelector(`#${targetId}`);
      const valEl = backdrop.querySelector(`#${valId}`);
      if (rangeEl && defaultVal !== null) {
        rangeEl.value = defaultVal;
      }
      if (valEl && defaultVal !== null) {
        valEl.textContent = defaultVal + suffix;
      }
    });
    saveCamera();
  });

  backdrop.querySelector('#btn-cancel-settings')?.addEventListener('click', cancelAndRestore);
  backdrop.querySelector('#btn-apply-settings')?.addEventListener('click', () => {
    saveCamera();
    cleanup();
  });

  backdrop.querySelector('#btn-close-settings')?.addEventListener('click', cancelAndRestore);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) cancelAndRestore();
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelAndRestore();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
}


