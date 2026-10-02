import { cancelFurniturePlacement, isFurniturePlacementActive } from './FurniturePlacementController.js';

const CAMERA_MOVE_KEYS = new Set(['w', 'a', 's', 'd']);
const CAMERA_MAX_SPEED = 5;
const CAMERA_ACCELERATION = 4.5;
const CAMERA_DECELERATION = 12;

function isTextInput(element) {
  return !!element && (
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
}

/**
 * Keep ordinary 3D camera movement independent from keyboard repeat timing.
 * Movement is integrated once per animation frame and eased in/out.
 */
export function createSmoothCameraKeyboardController(ctx, environment = {}) {
  const windowLike = environment.window || (typeof window !== 'undefined' ? window : {});
  const documentLike = environment.pageDocument || (typeof document !== 'undefined' ? document : {});
  const requestFrame = environment.requestAnimationFrame || windowLike.requestAnimationFrame.bind(windowLike);
  const cancelFrame = environment.cancelAnimationFrame || windowLike.cancelAnimationFrame.bind(windowLike);
  const getCurrentView = ctx.getCurrentView || (() => ctx.currentView);
  const pressed = new Set();
  const velocity = { x: 0, z: 0 };
  const delta = new ctx.BABYLON.Vector3(0, 0, 0);
  let frameId = null;
  let lastTimestamp = null;

  const frame = (timestamp) => {
    frameId = null;
    if (getCurrentView() !== '3d' || windowLike.firstPersonActive) {
      pressed.clear();
      velocity.x = 0;
      velocity.z = 0;
      lastTimestamp = null;
      return;
    }

    const dt = lastTimestamp == null
      ? 1 / 60
      : Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.05);
    lastTimestamp = timestamp;

    const forward = ctx.camera.target.subtract(ctx.camera.position);
    forward.y = 0;
    if (forward.lengthSquared() > 0.000001) forward.normalize();
    const rightX = -forward.z;
    const rightZ = forward.x;

    let desiredX = 0;
    let desiredZ = 0;
    if (pressed.has('w')) { desiredX += forward.x; desiredZ += forward.z; }
    if (pressed.has('s')) { desiredX -= forward.x; desiredZ -= forward.z; }
    if (pressed.has('a')) { desiredX += rightX; desiredZ += rightZ; }
    if (pressed.has('d')) { desiredX -= rightX; desiredZ -= rightZ; }

    const desiredLength = Math.hypot(desiredX, desiredZ);
    if (desiredLength > 1) {
      desiredX /= desiredLength;
      desiredZ /= desiredLength;
    }
    desiredX *= CAMERA_MAX_SPEED;
    desiredZ *= CAMERA_MAX_SPEED;

    const velocityDotDesired = velocity.x * desiredX + velocity.z * desiredZ;
    const changingDirection = desiredLength > 0 && velocityDotDesired < 0;
    const acceleration = pressed.size > 0 && !changingDirection
      ? CAMERA_ACCELERATION
      : CAMERA_DECELERATION;
    const changeX = desiredX - velocity.x;
    const changeZ = desiredZ - velocity.z;
    const changeLength = Math.hypot(changeX, changeZ);
    const maxVelocityChange = acceleration * dt;
    if (changeLength <= maxVelocityChange) {
      velocity.x = desiredX;
      velocity.z = desiredZ;
    } else if (changeLength > 0) {
      velocity.x += (changeX / changeLength) * maxVelocityChange;
      velocity.z += (changeZ / changeLength) * maxVelocityChange;
    }

    delta.set(velocity.x * dt, 0, velocity.z * dt);
    ctx.camera.target.addInPlace(delta);
    if (Math.abs(delta.x) + Math.abs(delta.z) > 0.000001) {
      ctx.setHasUserZoomedOrPanned?.(true);
    }

    const stillMoving = pressed.size > 0 || Math.hypot(velocity.x, velocity.z) > 0.01;
    if (stillMoving) {
      frameId = requestFrame(frame);
    } else {
      velocity.x = 0;
      velocity.z = 0;
      lastTimestamp = null;
    }
  };

  const start = () => {
    if (frameId == null) frameId = requestFrame(frame);
  };

  return {
    handleKeyDown(event) {
      const key = event.key.toLowerCase();
      if (
        getCurrentView() !== '3d' ||
        windowLike.firstPersonActive ||
        !CAMERA_MOVE_KEYS.has(key) ||
        isTextInput(event.target || documentLike.activeElement)
      ) return false;
      event.preventDefault();
      pressed.add(key);
      start();
      return true;
    },
    handleKeyUp(event) {
      const key = event.key.toLowerCase();
      if (!CAMERA_MOVE_KEYS.has(key)) return false;
      pressed.delete(key);
      if (frameId == null && Math.hypot(velocity.x, velocity.z) > 0.01) start();
      return true;
    },
    reset() {
      pressed.clear();
      if (frameId == null && Math.hypot(velocity.x, velocity.z) > 0.01) start();
    },
    dispose() {
      pressed.clear();
      if (frameId != null) cancelFrame(frameId);
      frameId = null;
      lastTimestamp = null;
    }
  };
}

export function handleHotkeys(event, ctx) {
  if (event.key === 'Escape' && isFurniturePlacementActive()) {
    event.preventDefault();
    cancelFurniturePlacement();
    return;
  }
  if (event.key === 'F12') {
    event.preventDefault();
    ctx.takePhoto();
    return;
  }
  if (event.key === 'F11') {
    event.preventDefault();
    document.getElementById('btn-first-person')?.click();
    return;
  }

  //  ， Shortcuts， 
  if (window.firstPersonActive) {
    return;
  }

  //  ， Shortcuts
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return;
  }

  const key = event.key.toLowerCase();

  // 1. WASD   (3D )
  if (ctx.currentView === '3d' && ['w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    return;
  }

  // 1.1 WASD   (2D )
  if (ctx.currentView === '2d' && ['w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    const stepX = (ctx.view.maxX - ctx.view.minX) * 0.05;
    const stepZ = (ctx.view.maxZ - ctx.view.minZ) * 0.05;

    if (key === 'w') {
      ctx.view.minZ += stepZ;
      ctx.view.maxZ += stepZ;
    }
    if (key === 's') {
      ctx.view.minZ -= stepZ;
      ctx.view.maxZ -= stepZ;
    }
    if (key === 'a') {
      ctx.view.minX -= stepX;
      ctx.view.maxX -= stepX;
    }
    if (key === 'd') {
      ctx.view.minX += stepX;
      ctx.view.maxX += stepX;
    }
    ctx.setHasUserZoomedOrPanned(true);
    ctx.renderPlan();
    return;
  }

  // 2.  /  ( )
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
    if (ctx.selectedItemId) {
      const step = 0.1; // 0.1  
      let dx = 0, dz = 0;
      if (key === 'arrowup') dz = step;
      if (key === 'arrowdown') dz = -step;
      if (key === 'arrowleft') dx = -step;
      if (key === 'arrowright') dx = step;
      ctx.entityManager.nudgeItem(ctx.selectedItemId, dx, dz);
    } else if (ctx.selectedOpeningId && ['arrowleft', 'arrowright'].includes(key)) {
      const opening = ctx.testMap.getEntity('opening', ctx.selectedOpeningId);
      const wall = opening ? ctx.testMap.getEntity('wall', opening.wallId) : null;
      if (opening && !opening.locked && wall) {
        const wallLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]) || 1;
        const step = 0.05; //   5  
        const deltaT = step / wallLength;
        let nextT = opening.t ?? 0.5;
        if (key === 'arrowleft') nextT -= deltaT;
        if (key === 'arrowright') nextT += deltaT;
        nextT = Math.max(0.01, Math.min(0.99, nextT));

        ctx.pushHistory();
        ctx.testMap.updateOpening(ctx.selectedOpeningId, { t: nextT });
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    }
    return;
  }

  // 3.  Z /  (PageUp / PageDown)
  if (event.key === 'PageUp' || event.key === 'PageDown') {
    event.preventDefault();
    if (ctx.selectedItemId) {
      const step = 0.05; // 0.05  ( )
      const delta = event.key === 'PageUp' ? step : -step;
      ctx.entityManager.adjustItemElevation(ctx.selectedItemId, delta);
    } else if (ctx.selectedOpeningId) {
      const opening = ctx.testMap.getEntity('opening', ctx.selectedOpeningId);
      if (opening && !opening.locked && opening.type === 'window') {
        ctx.pushHistory();
        const step = 0.05; // 0.05  
        let newSill = opening.sillHeight ?? 1.05;
        if (event.key === 'PageUp') newSill += step;
        if (event.key === 'PageDown') newSill = Math.max(0.1, newSill - step);

        ctx.testMap.updateOpening(ctx.selectedOpeningId, { sillHeight: Number(newSill.toFixed(3)) });
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    }
    return;
  }

  // 4.   (+ / - / =)
  if (key === '+' || key === '=' || key === '-') {
    event.preventDefault();
    if (ctx.selectedItemId) {
      const delta = (key === '+' || key === '=') ? 0.05 : -0.05;
      ctx.entityManager.adjustItemScale(ctx.selectedItemId, delta);
    }
    return;
  }

  // 5.  Rotate ([ / ])
  if (key === '[' || key === ']') {
    event.preventDefault();
    if (ctx.selectedItemId) {
      const deltaDeg = key === ']' ? 15 : -15;
      ctx.entityManager.adjustItemRotation(ctx.selectedItemId, deltaDeg);
    }
    return;
  }

  //   Delete / Backspace  Delete
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (ctx.selectedItemId) {
      event.preventDefault();
      ctx.entityManager.deleteItem(ctx.selectedItemId);
      return;
    }
    if (ctx.selectedOpeningId) {
      event.preventDefault();
      if (ctx.testMap.getEntity('opening', ctx.selectedOpeningId)?.locked) return;
      ctx.pushHistory();
      ctx.testMap.deleteOpening(ctx.selectedOpeningId);
      ctx.clearSelection();
      ctx.refreshShadows();
      return;
    }
    if (ctx.selectedWallId) {
      event.preventDefault();
      ctx.pushHistory();
      ctx.testMap.deleteWall(ctx.selectedWallId);
      ctx.clearSelection();
      ctx.refreshShadows();
      return;
    }
    if (ctx.selectedRoomId) {
      event.preventDefault();
      if (ctx.testMap.getEntity('room', ctx.selectedRoomId)?.locked) return;
      ctx.showCustomConfirm('Delete room', 'Delete the selected room? Furniture inside the room will also be deleted.').then((confirmed) => {
        if (confirmed) {
          ctx.pushHistory();
          ctx.testMap.deleteRoom(ctx.selectedRoomId);
          ctx.clearSelection();
          ctx.refreshShadows();
        }
      });
      return;
    }
    if (ctx.selectedRoofId) {
      event.preventDefault();
      if (ctx.testMap.getEntity('roof', ctx.selectedRoofId)?.locked) return;
      ctx.pushHistory();
      ctx.testMap.deleteRoof(ctx.selectedRoofId);
      ctx.clearSelection();
      ctx.refreshShadows();
      return;
    }
    if (ctx.selectedStairsId) {
      event.preventDefault();
      if (ctx.testMap.getEntity('stairs', ctx.selectedStairsId)?.locked) return;
      ctx.pushHistory();
      ctx.testMap.deleteStairs(ctx.selectedStairsId);
      ctx.clearSelection();
      ctx.refreshShadows();
      return;
    }
    if (ctx.selectedFenceId) {
      event.preventDefault();
      if (ctx.testMap.getEntity('fence', ctx.selectedFenceId)?.locked) return;
      ctx.pushHistory();
      ctx.testMap.deleteFence(ctx.selectedFenceId);
      ctx.clearSelection();
      ctx.refreshShadows();
      return;
    }
  }

  // Ctrl/Meta  
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      ctx.undo();
      return;
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      ctx.redo();
      return;
    } else if (key === 's') {
      event.preventDefault();
      document.getElementById('btn-save-local')?.click();
      return;
    } else if (key === 'o') {
      event.preventDefault();
      document.getElementById('btn-open-local')?.click();
      return;
    } else if (key === 'e') {
      event.preventDefault();
      document.getElementById('btn-save')?.click();
      return;
    } else if (key === 'i') {
      event.preventDefault();
      document.getElementById('btn-load')?.click();
      return;
    } else if (key === ',') {
      event.preventDefault();
      document.getElementById('btn-settings')?.click();
      return;
    } else if (key === 'n') {
      event.preventDefault();
      document.getElementById('btn-new')?.click();
      return;
    } else if (key === 'l') {
      event.preventDefault();
      const target = ctx.getSelectedTarget();
      if (target) {
        ctx.toggleTargetLock(target);
      }
      return;
    } else if (key === 'c' || key === 'd') {
      event.preventDefault();
      const target = ctx.getSelectedTarget();
      if (target) {
        ctx.copyTarget(target);
      }
      return;
    }
  }

  //  Shortcuts Ctrl+Alt+N (  Ctrl+N)
  if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    document.getElementById('btn-new')?.click();
    return;
  }

  // 5.5.  Lighting Shortcuts (L  )
  if (key === 'l' && ctx.selectedItemId) {
    const item = ctx.testMap.getEntity('item', ctx.selectedItemId);
    const definition = item ? ctx.testMap.getFurnitureDefinition(item.type) : null;
    if (item && (definition?.category === 'lighting' || definition?.lightSource)) {
      event.preventDefault();
      ctx.entityManager.toggleItemPower(ctx.selectedItemId);
      return;
    }
  }

  //  RotateShortcuts (R  )
  if (key === 'r') {
    const target = ctx.getSelectedTarget();
    if (target) {
      if (ctx.isAllowedTarget(target) && !ctx.isTargetLocked(target)) {
        event.preventDefault();
        ctx.rotateTarget(target);
        return;
      }
    }
  }

  //  Shortcuts (Space, Escape, L, E, R, D, W)
  let targetMode = null;

  if (event.key === ' ') {
    event.preventDefault(); //  
    targetMode = 'select';
  } else if (event.key === 'Escape') {
    targetMode = 'select';
  } else {
    const keyMap = {
      'l': 'draw-wall',
      'e': 'delete-wall',
      'r': 'add-room-square',
      'd': 'add-door-square',
      'w': 'add-window-square',
      'v': 'view'
    };
    targetMode = keyMap[key];
  }

  if (targetMode) {
    const button = document.querySelector(`.mode[data-mode="${targetMode}"]`);
    if (button) {
      button.click();
      return;
    }
  }

  // 5.8. Design Shortcuts (I, B, G, C)
  const designKeyMap = {
    'i': 'picker',
    'b': 'brush',
    'g': 'bucket',
    'c': 'eraser'
  };

  if (designKeyMap[key]) {
    event.preventDefault();
    const button = document.querySelector(`.design-mode[data-design-mode="${designKeyMap[key]}"]`);
    if (button) {
      button.click();
    }
  }
}
