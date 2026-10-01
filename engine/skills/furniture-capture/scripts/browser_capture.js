/**
 * 3D  Design  -  Furniture 
 * 
 *  ：
 * 1.   3D  （alpha、beta、target） 。
 * 2.   3D  。
 * 3.  （minZ）  lowerRadiusLimit  Furniture 。
 * 4.  Furniture，  150ms  Furniture ， Snapshot。
 * 5.   Base64   3001   of  Save ， All 。
 */
(async () => {
  //  （ ）
  //  ：  'all'  All；  'missing'  Furniture；  category（  'seating'） ；  type   name  Furniture
  const CAPTURE_CATEGORIES = ['missing'];

  //   3D  （Rotate 180  ）
  const DEFAULT_CAMERA = {
    alpha: -1.0471975511965976 + Math.PI,
    beta: 1.0471975511965976,
    target: [0, 0, -2.2]
  };

  //   appState
  if (!window.appState) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const app = window.appState || {};
  const testMap = app.testMap || window.testMap;
  const viewer3d = app.viewer3d;
  const scene = app.scene || window.scene;
  const camera = app.camera;
  const engine = app.engine;
  const FURNITURE_LIST = app.FURNITURE_LIST || window.FURNITURE_LIST || (await import('/example/app.js')).FURNITURE_LIST;
  const BABYLON = app.BABYLON || window.BABYLON || (await import('/example/app.js')).BABYLON;

  //   build   scene  
  window.scene = scene;

  console.log(" Item（ Item 150ms  Item）...");

  // 1.  
  const backupData = testMap.exportJSON();

  // 2.   3D  （ ）
  const originalGridState = viewer3d.show3DGrid;
  viewer3d.show3DGrid = false; //  
  viewer3d.clear3DGrid();

  // 3.   meshes  Save 
  const hiddenNodes = [];
  scene.meshes.forEach((mesh) => {
    if (mesh && (mesh.metadata?.blueprintEditHandle || mesh.name.includes("Handle")) && mesh.isEnabled()) {
      mesh.setEnabled(false);
      hiddenNodes.push(mesh);
    }
  });

  // 4.  
  const originalCameraTarget = camera.target.clone();
  const originalCameraRadius = camera.radius;
  const originalCameraAlpha = camera.alpha;
  const originalCameraBeta = camera.beta;
  const originalCameraLowerRadiusLimit = camera.lowerRadiusLimit;
  const originalCameraMinZ = camera.minZ;

  //  ： ， 
  camera.lowerRadiusLimit = 0.01;
  camera.minZ = 0.005; 

  // 5.   of  
  const emptyScene = JSON.parse(JSON.stringify(backupData));
  
  // 5.1  
  emptyScene.walls = [];
  emptyScene.rooms = [];
  emptyScene.items = [];
  emptyScene.openings = [];
  emptyScene.roofs = [];
  emptyScene.stairs = [];
  emptyScene.fences = [];
  emptyScene.gates = [];
  
  // 5.2   floor   ( )
  if (emptyScene.floor) {
    emptyScene.floor.walls = [];
    emptyScene.floor.rooms = [];
    emptyScene.floor.items = [];
    emptyScene.floor.openings = [];
    emptyScene.floor.roofs = [];
    emptyScene.floor.stairs = [];
    emptyScene.floor.fences = [];
    emptyScene.floor.gates = [];
  }
  
  // 5.3  
  if (emptyScene.floors) {
    const clearFloor = (floor) => {
      floor.walls = [];
      floor.rooms = [];
      floor.items = [];
      floor.openings = [];
      floor.roofs = [];
      floor.stairs = [];
      floor.fences = [];
      floor.gates = [];
    };
    if (Array.isArray(emptyScene.floors)) {
      emptyScene.floors.forEach(clearFloor);
    } else {
      for (const floorId in emptyScene.floors) {
        clearFloor(emptyScene.floors[floorId]);
      }
    }
  }

  // 6.  Snapshot Furniture 
  let itemsToCapture = [];
  if (CAPTURE_CATEGORIES.includes('all')) {
    itemsToCapture = FURNITURE_LIST;
  } else {
    const specifiedTypes = new Set(CAPTURE_CATEGORIES);
    const capturedMap = new Map();

    if (specifiedTypes.has('missing')) {
      console.log(" ItemFurniture...");
      const checkPromises = FURNITURE_LIST.map((def) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ def, exists: true });
          img.onerror = () => resolve({ def, exists: false });
          img.src = `/src/furniture/image/${def.type}.png`;
        });
      });
      const results = await Promise.all(checkPromises);
      results.filter(r => !r.exists).forEach(r => capturedMap.set(r.def.type, r.def));
    }

    FURNITURE_LIST.forEach(def => {
      if (specifiedTypes.has(def.category) || specifiedTypes.has(def.type) || specifiedTypes.has(def.name)) {
        capturedMap.set(def.type, def);
      }
    });

    itemsToCapture = Array.from(capturedMap.values());
  }

  console.log(` ItemSnapshotFurniture Item: ${itemsToCapture.length}`);

  for (const def of itemsToCapture) {
    console.log(` Item: ${def.name} (${def.type})`);
    
    //   3D  ，  2D   buildItem   defer  
    viewer3d.renderingEnabled = true;

    //  
    testMap.loadJSON(emptyScene);
    viewer3d.renderingEnabled = true;
    viewer3d.clear3DGrid();
    
    //   2D  ，  3D  
    const stage = document.getElementById('stage');
    const viewToggleBtn = document.getElementById('btn-view-toggle');
    if (stage && stage.dataset.view !== '3d' && viewToggleBtn) {
      viewToggleBtn.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    //   testMap.addItem，  selectItem  
    const currentFloorId = testMap.getCurrentFloorId?.() || 'f0';
    const item = testMap.addItem({
      type: def.type,
      floorId: currentFloorId,
      x: 0,
      z: 0,
      y: 0,
      rotation: 0,
      scale: 1
    });
    
    if (!item) {
      console.warn(`[ITEM ADD FAILED] Furniture Item: ${def.name} (${def.type})`);
      continue;
    }

    let node = (viewer3d.itemNodes && viewer3d.itemNodes.get(item.id)) || 
               (testMap.itemNodes && testMap.itemNodes.get(item.id)) ||
               scene.getNodeByName(`item_${item.id}`) ||
               scene.getTransformNodeByName(`item_${item.id}`);
    
    if (!node) {
      try {
        if (typeof viewer3d.buildItem === 'function') {
          viewer3d.buildItem(item);
        } else if (typeof viewer3d.build === 'function') {
          viewer3d.build({ rebuildType: 'all' });
        }
      } catch (err) {
        console.error(`[BUILDITEM ERROR] ${def.type}:`, err);
      }
      node = (viewer3d.itemNodes && viewer3d.itemNodes.get(item.id)) || 
             (testMap.itemNodes && testMap.itemNodes.get(item.id)) ||
             scene.getNodeByName(`item_${item.id}`) ||
             scene.getTransformNodeByName(`item_${item.id}`);
    }

    if (!node) {
      console.warn(`[NODE MISSING]  Item 3D  Item: ${def.name} (${def.type}), item.id=${item.id}`);
      continue;
    }

    node.computeWorldMatrix(true);
    const bounds = node.getHierarchyBoundingVectors(true);
    const min = bounds.min;
    const max = bounds.max;
    const size = max.subtract(min);
    const center = min.add(max).scale(0.5);
    let maxDim = Math.max(size.x, size.y, size.z);
    if (isNaN(maxDim) || maxDim <= 0) {
      maxDim = 0.1;
    }

    //  ： Furniture  meshes，  scene   meshes
    const furnitureMeshes = new Set();
    node.getChildMeshes(false).forEach(m => furnitureMeshes.add(m));
    furnitureMeshes.add(node);

    const tempHiddenNodes = [];
    scene.meshes.forEach((mesh) => {
      if (mesh && mesh.isEnabled() && !furnitureMeshes.has(mesh)) {
        mesh.setEnabled(false);
        tempHiddenNodes.push(mesh);
      }
    });

    //  ，  alpha/beta  
    camera.target = center;
    camera.alpha = DEFAULT_CAMERA.alpha;
    camera.beta = DEFAULT_CAMERA.beta;
    camera.radius = Math.max(0.18, maxDim * 2.3);

    //  ， 
    camera.getViewMatrix(true);

    //  
    scene.render();

    //   150  ， Furniture 
    await new Promise(resolve => setTimeout(resolve, 150));

    scene.render();

    //  
    try {
      const dataUrl = await BABYLON.Tools.CreateScreenshotAsync(engine, camera, { precision: 1 });
      let savedOk = false;
      try {
        const response = await fetch('http://localhost:3001/save-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: def.type, image: dataUrl })
        });
        if (response.ok) savedOk = true;
      } catch (e) {}

      if (!savedOk) {
        const fallbackRes = await fetch('/api/save-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: def.type, image: dataUrl })
        });
        if (!fallbackRes.ok) {
          throw new Error(`Save image failed with status ${fallbackRes.status}`);
        }
      }
      console.log(`[CAPTURE SUCCESS]  Item: ${def.name} (${def.type})`);
    } catch (err) {
      console.error(`Error capturing ${def.name}:`, err);
    } finally {
      // Snapshot ，  meshes，  loadJSON  
      tempHiddenNodes.forEach((mesh) => {
        if (mesh && !mesh.isDisposed()) {
          mesh.setEnabled(true);
        }
      });
    }
  }

  // 7.  
  console.log(" ItemAll Item， Item...");
  testMap.loadJSON(backupData);

  camera.target = originalCameraTarget;
  camera.radius = originalCameraRadius;
  camera.alpha = DEFAULT_CAMERA.alpha;
  camera.beta = DEFAULT_CAMERA.beta;
  camera.lowerRadiusLimit = originalCameraLowerRadiusLimit;
  camera.minZ = originalCameraMinZ;

  hiddenNodes.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      mesh.setEnabled(true);
    }
  });

  viewer3d.show3DGrid = originalGridState;
  if (originalGridState && typeof refresh3DGrid === 'function') {
    refresh3DGrid();
  }

  scene.render();
  console.log("✓  Item！");
  window.__CAPTURE_FINISHED__ = true;
})();
