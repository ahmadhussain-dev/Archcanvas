import { pointInRoom, Topology } from '../../src/index.js';
const { getItemsOnBookshelf, getItemsOnTable, getItemSizeInMetres, isBigBedroomItem, isBigKitchenBathItem, isTabletopSurfaceDefinition, calculateSnappedPosition, snapToGridSegmentCenter } = Topology;

const INCHES_PER_UNIT = 39.37;

function captureBeforeState(item) {
  if (!item) return null;
  return {
    id: item.id,
    x: item.x,
    z: item.z,
    rotation: item.rotation,
    elevation: item.elevation,
    width: item.width,
    depth: item.depth,
    height: item.height,
    scale: item.scale,
    type: item.type
  };
}

function definitionSizeInMetres(definition, dimension) {
  const value = Number(definition?.defaultSize?.[dimension] || 0);
  return definition?.unit === 'm' ? value : value / INCHES_PER_UNIT;
}

function defaultWallElevation(itemHeight, wallHeight, preferredElevation = 0.85) {
  return Math.max(0, Math.min(preferredElevation, Math.max(0, wallHeight - itemHeight)));
}

/**
 * EntityManager.js — blueprint3d-babylon  /Furniture 
 *
 *  ：
 *   1.  Furniture 、2D  、 。
 *   2.  Furniture （ Furniture ， Furniture ）。
 *   3.  Furniture  2D  、 。
 */

export class EntityManager {
  /**
   * @param {object} opts
   * @param {object} opts.testMap -  
   * @param {() => boolean} opts.getSnapEnabled -  
   * @param {() => number} opts.getSnapSize -  
   * @param {(val: number) => number} opts.inchesToWorld -  
   * @param {() => string} opts.getMode -   (  'select')
   * @param {() => object[]} opts.getWalls -  
   * @param {() => object[]} opts.getRooms -  Room
   * @param {() => void} opts.pushHistory - Save （Undo/Redo）
   * @param {() => void} opts.refreshShadows -  
   * @param {() => void} opts.updateEditor -  
   * @param {() => void} opts.renderPlan -   2D Canvas  
   * @param {() => void} opts.clear3DEditHandles -   3D  
   * @param {(type: string, id: string|null) => void} opts.onSelectionChanged -  Select 
   * @param {(event: any) => {x: number, y: number}} opts.svgPointFromEvent - SVG  
   * @param {(x: number, y: number) => {x: number, z: number}} opts.svgToWorld - SVG  
   * @param {(event: any) => void} opts.rememberPointer -  / 
   * @param {(pointerId: number) => void} opts.setPointerCapture -  
   * @param {Map<number, object>} opts.activePointers -  
   * @param {(a: object, b: object) => number} opts.pointerDistance -  
   * @param {(a: object, b: object) => number} opts.pointerAngle -  
   * @param {(item: object, def: object) => boolean} opts.canPlaceOnTable -  
   * @param {(item: object) => object|null} opts.findTableBelow -  
   * @param {(item: object) => object|null} opts.findNearestSeat -  
   */
  constructor(opts) {
    this.opts = opts;

    /** 2D Furniture  */
    this.dragState = null;

    /** Furniture Rotate  */
    this.itemGestureState = null;
  }

  get selectedItemId() {
    return this.opts.getSelectedItemId();
  }

  set selectedItemId(val) {
    this.opts.setSelectedItemId(val);
  }

  /**
   *  Furniture “ ” 
   * @param {string} type - Furniture 
   * @returns {boolean}
   */
  shouldSnapToEdge(type) {
    const definition = this.opts.testMap.getFurnitureDefinition(type);
    if (!definition) return false;

    //  Furniture  snapToEdge  
    if (definition.snapToEdge !== undefined) {
      return !!definition.snapToEdge;
    }

    const category = definition.category || '';

    // 1. Storage  (storage)： 、 、 、 、  100%  
    if (category === 'storage') {
      return true;
    }

    // 2. Bedroom  (bedroom)： ； （ 、 、 ）
    if (category === 'bedroom') {
      return isBigBedroomItem(type);
    }

    // 3.  Appliances  (kitchen-bath/kitchen/bathroom)： All ； 、 、 
    if (category === 'kitchen-bath' || category === 'kitchen' || category === 'bathroom') {
      return isBigKitchenBathItem(type);
    }

    // Kitchen Appliances Furniture  appliances， 。
    if (category === 'appliances') {
      return isBigKitchenBathItem(type);
    }

    // 4. Tables  (tables)：  (desk)、Computer 、Headboard 、 、 / ；
    //      (roundTable)、 ， 
    if (category === 'tables') {
      return type !== 'roundTable' && type !== 'picnicTable';
    }

    // 5.   (seating)： 、 、 、 ；
    //     、 、 ， 
    if (category === 'seating') {
      return type === 'sofa' || type === 'loveseat' || type === 'bench' || type === 'bedBench';
    }

    return false;
  }



  /**
   *  Furniture 
   * @param {string} itemId
   */
  selectItem(itemId) {
    this.opts.clear3DEditHandles();
    this.selectedItemId = itemId;
    this.opts.onSelectionChanged('item', itemId);
    this.opts.testMap.setSelectedItem(itemId);
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  / Furniture 
   */
  deselect() {
    this.selectedItemId = null;
    this.opts.testMap.setSelectedItem(null);
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Furniture ， / 
   * @param {string} itemId -  ID
   * @param {number} x -   X
   * @param {number} z -   Z
   */
  moveItemTo(itemId, x, z, isFinished = false, placementHint = null) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;

    const beforeState = captureBeforeState(item);

    const definition = this.opts.testMap.getFurnitureDefinition(item.type);

    let finalX = x;
    let finalZ = z;

    const snapEnabled = this.opts.getSnapEnabled();
    const snapSize = this.opts.getSnapSize();
    const isCurtain = definition.placeType === 'wall'
      && (item.type.toLowerCase().includes('curtain') || item.type.toLowerCase().includes('blind'));

    // Curtains travel on a wall track, so their grid position is resolved after
    // projection onto that wall (the same half-cell rule used by openings).
    if (snapEnabled && snapSize && !isCurtain) {
      const snappedPos = calculateSnappedPosition({
        item,
        definition,
        x,
        z,
        snapSize,
        wallThickness: this.opts.testMap.getProjectMetadata().wallThickness,
        walls: this.opts.getWalls(),
        shouldSnapToEdge: this.shouldSnapToEdge(item.type),
        inchesToWorld: this.opts.inchesToWorld.bind(this.opts)
      });
      finalX = snappedPos.x;
      finalZ = snappedPos.z;
    }

    const snapped = {
      x: Number(finalX.toFixed(3)),
      z: Number(finalZ.toFixed(3))
    };

    let patch = {};

    if (definition.placeType === 'wall') {
      //  （ 、 ）
      let minDistance = Infinity;
      let bestProjX = snapped.x;
      let bestProjZ = snapped.z;
      let bestAngle = item.rotation || 0;
      let bestWall = null;

      //  
      const walls = this.opts.getWalls();
      const requestedWallId = placementHint?.wallId || (isFinished ? item.wallId : null);
      const requestedWall = requestedWallId
        ? walls.find((wall) => wall.id === requestedWallId)
        : null;
      (requestedWall ? [requestedWall] : walls).forEach((wall) => {
        const [x1, z1] = wall.from;
        const [x2, z2] = wall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len2 = dx * dx + dz * dz;
        if (len2 === 0) return;
        let t = ((snapped.x - x1) * dx + (snapped.z - z1) * dz) / len2;
        t = Math.max(0.02, Math.min(0.98, t));
        const projX = x1 + t * dx;
        const projZ = z1 + t * dz;
        const dist = Math.hypot(snapped.x - projX, snapped.z - projZ);
        if (dist < minDistance) {
          minDistance = dist;
          bestProjX = projX;
          bestProjZ = projZ;
          bestAngle = -Math.atan2(dz, dx);
          bestWall = wall;
        }
      });

      if (bestWall) {
        if (snapEnabled && snapSize) {
          const [x1, z1] = bestWall.from;
          const [x2, z2] = bestWall.to;
          const dx = x2 - x1;
          const dz = z2 - z1;
          const len2 = dx * dx + dz * dz;
          const gridPoint = snapToGridSegmentCenter(
            { x: bestProjX, z: bestProjZ },
            snapEnabled,
            snapSize
          );
          const t = Math.max(0.02, Math.min(0.98,
            ((gridPoint.x - x1) * dx + (gridPoint.z - z1) * dz) / len2
          ));
          bestProjX = x1 + t * dx;
          bestProjZ = z1 + t * dz;
        }

        const wallThickness = this.opts.testMap.getProjectMetadata().wallThickness;
        const itemScale = Number(item.scale || 1);
        const itemDepth = (item.depth ?? (definition.defaultSize.depth / INCHES_PER_UNIT)) * itemScale;

        const vx = snapped.x - bestProjX;
        const vz = snapped.z - bestProjZ;
        const vLen = Math.hypot(vx, vz);

        let offsetX = 0;
        let offsetZ = 0;
        const offsetDist = wallThickness / 2 + itemDepth / 2 + 0.002;

        const [x1, z1] = bestWall.from;
        const [x2, z2] = bestWall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz) || 1;
        const normalX = -dz / len;
        const normalZ = dx / len;

        if (isCurtain) {
          const rooms = this.opts.getRooms?.() || [];
          const eligibleRooms = rooms.filter((room) => !item.floorId || !room.floorId || room.floorId === item.floorId);
          const positiveInside = eligibleRooms.some((room) => pointInRoom(
            room,
            bestProjX + normalX * offsetDist,
            bestProjZ + normalZ * offsetDist
          ));
          const negativeInside = eligibleRooms.some((room) => pointInRoom(
            room,
            bestProjX - normalX * offsetDist,
            bestProjZ - normalZ * offsetDist
          ));
          let side = (vx * normalX + vz * normalZ) >= 0 ? 1 : -1;
          if (positiveInside !== negativeInside) side = positiveInside ? 1 : -1;
          offsetX = normalX * offsetDist * side;
          offsetZ = normalZ * offsetDist * side;
        } else if (placementHint?.side === 1 || placementHint?.side === -1) {
          offsetX = normalX * offsetDist * placementHint.side;
          offsetZ = normalZ * offsetDist * placementHint.side;
        } else if (vLen > 0.0001) {
          offsetX = (vx / vLen) * offsetDist;
          offsetZ = (vz / vLen) * offsetDist;
        } else {
          offsetX = normalX * offsetDist;
          offsetZ = normalZ * offsetDist;
        }

        patch.x = bestProjX + offsetX;
        patch.z = bestProjZ + offsetZ;
        patch.wallId = bestWall.id;

        const dot1 = Math.sin(bestAngle) * offsetX + Math.cos(bestAngle) * offsetZ;
        const dot2 = Math.sin(bestAngle + Math.PI) * offsetX + Math.cos(bestAngle + Math.PI) * offsetZ;
        patch.rotation = dot1 >= dot2 ? bestAngle : bestAngle + Math.PI;
      } else {
        patch.x = snapped.x;
        patch.z = snapped.z;
      }

      const itemHeight = (item.height ?? definitionSizeInMetres(definition, 'height')) * Number(item.scale || 1);
      const wallHeight = Number(this.opts.testMap.getProjectMetadata().wallHeight || 2.8);
      if (isCurtain) {
        if (item.elevation === undefined) {
          patch.elevation = 0;
        }
      } else if (item.elevation === undefined || item.elevation === 0) {
        patch.elevation = defaultWallElevation(itemHeight, wallHeight);
      }
    } else if (definition.placeType === 'ceiling') {
      //  
      patch.x = snapped.x;
      patch.z = snapped.z;
      patch.elevation = this.opts.testMap.getProjectMetadata().wallHeight - (item.height ?? (definition.defaultSize.height / INCHES_PER_UNIT)) * (item.scale || 1);
    } else {
      //  
      patch.x = snapped.x;
      patch.z = snapped.z;
      if (this.opts.canPlaceOnTable(item, definition)) {
        if (isFinished) {
          //  ： / 
          const bookshelfBelow = this.opts.findBookshelfNearby ? this.opts.findBookshelfNearby(item) : null;
          if (bookshelfBelow) {
            const snappedState = this.opts.snapToBookshelf ? this.opts.snapToBookshelf(item, bookshelfBelow) : null;
            if (snappedState) {
              patch.x = snappedState.x;
              patch.z = snappedState.z;
              patch.elevation = snappedState.elevation;
              patch.rotation = snappedState.rotation;
            }
          } else {
            const tableBelow = this.opts.findTableBelow({
              ...item,
              x: patch.x ?? snapped.x,
              z: patch.z ?? snapped.z
            });
            if (tableBelow) {
              const tableDef = this.opts.testMap.getFurnitureDefinition(tableBelow.type);
              patch.elevation = (tableBelow.elevation || 0) + getItemSizeInMetres(tableBelow, tableDef).height;
            } else {
              //  ： 
              let origElevation = 0;
              if (this.dragState && this.dragState.itemId === itemId) {
                origElevation = this.dragState.originalElevation || 0;
              } else if (this.opts.getDrag3DState) {
                const d3s = this.opts.getDrag3DState();
                if (d3s && d3s.itemId === itemId) {
                  origElevation = d3s.originalElevation || 0;
                }
              }
              patch.elevation = origElevation;
            }
          }
        } else {
          //  ： ，  X/Z/Rotation  
          let targetElevation = null;

          // 1.  
          const bookshelfBelow = this.opts.findBookshelfNearby ? this.opts.findBookshelfNearby(item) : null;
          if (bookshelfBelow) {
            const snappedState = this.opts.snapToBookshelf ? this.opts.snapToBookshelf(item, bookshelfBelow) : null;
            if (snappedState) {
              targetElevation = snappedState.elevation;
            }
          }

          // 2.  ， Tables 
          if (targetElevation === null) {
            const tableBelow = this.opts.findTableBelow({
              ...item,
              x: patch.x ?? snapped.x,
              z: patch.z ?? snapped.z
            });
            if (tableBelow) {
              const tableDef = this.opts.testMap.getFurnitureDefinition(tableBelow.type);
              targetElevation = (tableBelow.elevation || 0) + getItemSizeInMetres(tableBelow, tableDef).height;
            }
          }

          // 3.  ， 
          if (targetElevation === null) {
            let origElevation = 0;
            if (this.dragState && this.dragState.itemId === itemId) {
              origElevation = this.dragState.originalElevation || 0;
            } else if (this.opts.getDrag3DState) {
              const d3s = this.opts.getDrag3DState();
              if (d3s && d3s.itemId === itemId) {
                origElevation = d3s.originalElevation || 0;
              }
            }
            targetElevation = origElevation;
          }

          patch.elevation = targetElevation;
        }
      }
    }

    const updatedX = patch.x !== undefined ? patch.x : item.x;
    const updatedZ = patch.z !== undefined ? patch.z : item.z;
    const updatedRotation = patch.rotation !== undefined ? patch.rotation : (item.rotation || 0);
    const updatedElevation = patch.elevation !== undefined ? patch.elevation : (item.elevation || 0);

    const room = this.opts.testMap.getRoomAt(updatedX, updatedZ);
    if (room) {
      patch.roomId = room.id;
    } else {
      patch.roomId = null;
      if (definition.placeType !== 'wall' && definition.placeType !== 'ceiling') {
        patch.elevation = 0;
      }
    }

    let requiresRuntimeRebuild = false;
    if (item.type === 'mannequin' && item.pose && item.pose !== 'stand') {
      const seat = this.opts.findNearestSeat({ ...item, x: updatedX, z: updatedZ });
      if (!seat) {
        patch.pose = 'stand';
        patch.elevation = 0;
        requiresRuntimeRebuild = true;
      }
    }

    //   Command API  
    this.opts.testMap.executeCommand('updateItem', { itemId: item.id, patch, rebuild: false });
    if (room) {
      this.opts.testMap.executeCommand('assignItemToRoom', { itemId: item.id, roomId: room.id, rebuild: false });
    }

    if (requiresRuntimeRebuild) this.opts.testMap.refreshRendering();
    else this.opts.testMap.syncEntityPreview('item', item.id);
    this.updateChildrenOnBookshelf({ ...item, x: updatedX, z: updatedZ, rotation: updatedRotation, elevation: updatedElevation }, beforeState);
    this.opts.renderPlan();
  }

  /**
   *   2D  Furniture 
   * @param {any} event
   * @param {string} itemId
   */
  beginItemDrag(event, itemId) {
    if (event.button === 2) return;
    if (this.opts.getMode() !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    this.opts.rememberPointer(event);
    this.selectItem(itemId);
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;

    if (this.maybeBeginItemGesture(itemId)) {
      this.dragState = null;
      return;
    }

    const point = this.opts.svgPointFromEvent(event);
    const world = this.opts.svgToWorld(point.x, point.y);
    this.dragState = {
      itemId,
      offsetX: item.x - world.x,
      offsetZ: item.z - world.z,
      originalX: item.x,
      originalZ: item.z,
      originalElevation: item.elevation || 0,
      historyPushed: false
    };
    this.opts.setPointerCapture(event.pointerId);
  }

  /**
   *   2D  
   * @param {any} event
   */
  handleItemDrag(event) {
    if (!this.dragState) return;
    const point = this.opts.svgPointFromEvent(event);
    const world = this.opts.svgToWorld(point.x, point.y);
    const nextX = world.x + this.dragState.offsetX;
    const nextZ = world.z + this.dragState.offsetZ;

    if (!this.dragState.historyPushed && Math.hypot(nextX - this.dragState.originalX, nextZ - this.dragState.originalZ) > 0.02) {
      this.opts.pushHistory();
      this.dragState.historyPushed = true;
    }
    this.moveItemTo(this.dragState.itemId, nextX, nextZ);
  }

  /**
   *  Furniture 
   * @param {string} itemId
   * @returns {object[]}
   */
  getItemGesturePointers(itemId) {
    return [...this.opts.activePointers.values()].filter((pointer) => pointer.targetItemId === itemId).slice(0, 2);
  }

  /**
   *  （ Rotate/ ）
   * @param {string} itemId
   * @returns {boolean}  
   */
  maybeBeginItemGesture(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    const pointers = this.getItemGesturePointers(itemId);
    if (!item || pointers.length < 2) return false;

    this.itemGestureState = {
      itemId,
      startDistance: Math.max(1, this.opts.pointerDistance(pointers[0], pointers[1])),
      startAngle: this.opts.pointerAngle(pointers[0], pointers[1]),
      startRotation: item.rotation || 0,
      startScale: item.scale || 1,
      historyPushed: false
    };
    return true;
  }

  /**
   *  Rotate 
   */
  moveItemGesture() {
    if (!this.itemGestureState) return;
    const item = this.opts.testMap.getEntity('item', this.itemGestureState.itemId);
    const pointers = this.getItemGesturePointers(this.itemGestureState.itemId);
    if (!item || item.locked || pointers.length < 2) return;

    const nextScale = Math.max(0.5, Math.min(4, this.itemGestureState.startScale * this.opts.pointerDistance(pointers[0], pointers[1]) / this.itemGestureState.startDistance));
    const nextRotation = this.itemGestureState.startRotation + this.opts.pointerAngle(pointers[0], pointers[1]) - this.itemGestureState.startAngle;

    if (!this.itemGestureState.historyPushed) {
      this.opts.pushHistory();
      this.itemGestureState.historyPushed = true;
    }

    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    const isMeterDef = definition.unit === 'm';
    const defW = isMeterDef ? definition.defaultSize.width : (definition.defaultSize.width / 39.37);
    const defD = isMeterDef ? definition.defaultSize.depth : (definition.defaultSize.depth / 39.37);
    const defH = isMeterDef ? definition.defaultSize.height : (definition.defaultSize.height / 39.37);
    const patch = {
      rotation: nextRotation,
      width: Number((defW * nextScale).toFixed(3)),
      depth: Number((defD * nextScale).toFixed(3)),
      height: Number((defH * nextScale).toFixed(3)),
      scale: 1.0
    };
    if (definition.placeType === 'ceiling') {
      patch.elevation = this.opts.testMap.getProjectMetadata().wallHeight - patch.height;
    }

    this.opts.testMap.executeCommand('updateItem', { itemId: item.id, patch });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Furniture（ 、 、 ） 
   * @param {string} itemId - Furniture ID
   */
  toggleItemWater(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    const definition = item && this.opts.testMap.getFurnitureDefinition(item.type);
    if (!item || item.locked || definition?.waterControllable !== true) return;
    this.opts.pushHistory();
    const isWaterOn = item.waterEnabled !== false;
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { waterEnabled: !isWaterOn } });
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  
   * @param {string} itemId -  ID
   */
  toggleItemLid(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const isLidOpen = item.lidOpen === true;
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { lidOpen: !isLidOpen } });
    this.opts.renderPlan();
  }

  /**
   * DuplicateFurniture 
   * @param {string} itemId - Furniture ID
   * @returns {object|null} Duplicate 
   */
  copyItem(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item) return null;
    this.opts.pushHistory();
    const copyX = (item.x || 0) + 0.4;
    const copyZ = (item.z || 0) + 0.4;
    const targetRoom = this.opts.getRooms().find((room) => pointInRoom(room, copyX, copyZ));
    const copy = this.opts.testMap.executeCommand('addItem', {
      ...JSON.parse(JSON.stringify(item)),
      id: undefined,
      name: item.name,
      x: copyX,
      z: copyZ,
      roomId: targetRoom?.id,
      floorId: this.opts.testMap.getCurrentFloorId()
    });
    this.opts.refreshShadows();
    this.selectItem(copy.id);
    return copy;
  }

  /**
   * RotateFurniture  ( Rotate90 )
   * @param {string} itemId - Furniture ID
   */
  rotateItem(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const currentDegrees = Math.round(((item.rotation || 0) * 180 / Math.PI + 360) % 360);
    const nextDegrees = (currentDegrees + 90) % 360;
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { rotation: nextDegrees * Math.PI / 180 } });
    if (this.selectedItemId === itemId) {
      this.opts.updateEditor();
    }
    this.opts.refreshShadows();
    this.opts.renderPlan();
  }

  /**
   *  Furniture  ( Lighting Emissive )
   * @param {string} itemId - Furniture ID
   */
  toggleItemPower(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    const def = this.opts.testMap.getFurnitureDefinition(item.type);
    if (def && (def.category === 'lighting' || def.lightSource)) {
      this.updateItemLight(itemId, item.lightOn === false);
    } else {
      this.setItemPower(itemId, item.isOn !== true);
    }
  }

  /**
   *  FurnitureLock ， 3D 2D 
   *
   * @param {string} itemId - Furniture ID
   * @param {boolean} locked -  Lock
   */
  setItemLocked(itemId, locked) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item) return;
    this.opts.pushHistory();

    this.opts.testMap.executeCommand('setTargetLocked', { type: 'item', id: itemId, locked });

    //  Lock ，  3D  ， 
    if (locked) {
      this.opts.clear3DEditHandles();
    }

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  FurnitureLock/Unlock 
   * @param {string} itemId - Furniture ID
   */
  toggleItemLock(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item) return;
    this.setItemLocked(itemId, !item.locked);
  }

  /**
   * Delete Furniture 
   * @param {string} itemId - Furniture ID
   */
  deleteItem(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('deleteItem', { itemId });
    if (this.selectedItemId === itemId) {
      this.deselect();
    }
    this.opts.refreshShadows();
    this.opts.renderPlan();
  }

  /**
   *  ： Furniture 
   */
  updateItemSize(itemId, widthInches, depthInches, heightInches, elevationInches) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;

    const beforeState = captureBeforeState(item);

    this.opts.pushHistory();

    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    let elevation = elevationInches;

    if (definition.placeType === 'ceiling') {
      const curElev = Number((item.elevation || 0).toFixed(2));
      const inputElev = Number((elevationInches || 0).toFixed(2));
      if (curElev === inputElev) {
        //  Furniture 
        elevation = this.opts.testMap.getProjectMetadata().wallHeight - heightInches * (item.scale || 1);
      }
    } else if (definition.placeType === 'wall' && (item.type.includes('curtain') || item.type.includes('blind'))) {
      const curElev = Number((item.elevation || 0).toFixed(2));
      const inputElev = Number((elevationInches || 0).toFixed(2));
      if (curElev === inputElev && Number.isFinite(heightInches)) {
        //  ， 。
        const oldTop = (item.elevation || 0) + (item.height || 0) * Number(item.scale || 1);
        const wallHeight = Number(this.opts.testMap.getProjectMetadata().wallHeight || 2.8);
        elevation = Math.max(0, Math.min(oldTop - heightInches, Math.max(0, wallHeight - heightInches)));
      }
    }

    this.opts.testMap.executeCommand('updateItem', {
      itemId,
      patch: {
        width: widthInches,
        depth: depthInches,
        height: heightInches,
        elevation: elevation
      }
    });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  ： FurnitureRotate 
   */
  updateItemRotation(itemId, degrees) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;

    const beforeState = captureBeforeState(item);

    this.opts.pushHistory();
    this.opts.testMap.executeCommand('rotateItem', { itemId, rotationRadians: degrees * Math.PI / 180 });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  ： Furniture 
   */
  updateItemScale(itemId, scaleValue) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    this.opts.pushHistory();
    const scale = Math.max(0.5, Math.min(4, Number(scaleValue) || 1));
    
    const isMeterDef = definition.unit === 'm';
    const defW = isMeterDef ? definition.defaultSize.width : (definition.defaultSize.width / 39.37);
    const defD = isMeterDef ? definition.defaultSize.depth : (definition.defaultSize.depth / 39.37);
    const defH = isMeterDef ? definition.defaultSize.height : (definition.defaultSize.height / 39.37);
    const patch = {
      width: Number((defW * scale).toFixed(3)),
      depth: Number((defD * scale).toFixed(3)),
      height: Number((defH * scale).toFixed(3)),
      scale: 1.0
    };
    if (definition.placeType === 'ceiling') {
      patch.elevation = this.opts.testMap.getProjectMetadata().wallHeight - patch.height;
    }
    
    this.opts.testMap.executeCommand('updateItem', { itemId, patch });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  ： 
   */
  updateItemPose(itemId, newPose) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked || item.type !== 'mannequin') return;
    this.opts.pushHistory();
    
    let patch = { pose: newPose };
    if (newPose !== 'stand') {
      const seat = this.opts.findNearestSeat(item);
      if (seat) {
        patch.x = seat.worldPos.x;
        patch.z = seat.worldPos.z;
        patch.elevation = seat.worldPos.y;
        patch.rotation = seat.item.rotation || 0;
      }
    } else {
      patch.elevation = 0;
    }
    
    this.opts.testMap.executeCommand('updateItem', { itemId, patch });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  ： Emissive 
   */
  setItemSeason(itemId, season) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    const def = this.opts.testMap.getFurnitureDefinition(item.type);
    const seasonOptions = def?.seasonOptions || [];
    if (!seasonOptions.length) return;

    const nextSeason = seasonOptions.find((option) => option.value === season)?.value;
    if (!nextSeason || item.season === nextSeason) return;

    this.opts.pushHistory();
    this.opts.testMap.updateItem(itemId, { season: nextSeason });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  cycleItemSeason(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    const def = this.opts.testMap.getFurnitureDefinition(item.type);
    const seasonOptions = def?.seasonOptions || [];
    if (!seasonOptions.length) return;

    const currentIndex = seasonOptions.findIndex((option) => option.value === item.season);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % seasonOptions.length : 0;
    this.setItemSeason(itemId, seasonOptions[nextIndex].value);
  }

  updateItemLight(itemId, lightOn) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { lightOn } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   * Set a non-light appliance power state.
   */
  setItemPower(itemId, isOn) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { isOn: !!isOn } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Shortcuts： Furniture 
   * @param {string} itemId
   * @param {number} dx - X  （ ）
   * @param {number} dz - Z  （ ）
   */
  nudgeItem(itemId, dx, dz) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;

    const beforeState = captureBeforeState(item);

    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { x: item.x + dx, z: item.z + dz } });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Shortcuts：PageUp/PageDown  Furniture 
   * @param {string} itemId
   * @param {number} delta -  （ ）
   */
  adjustItemElevation(itemId, delta) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;

    const beforeState = captureBeforeState(item);

    this.opts.pushHistory();
    const newElev = Math.max(0, (item.elevation || 0) + delta);
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { elevation: newElev } });

    this.updateChildrenOnBookshelf(item, beforeState);

    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Shortcuts：+/-  Furniture
   * @param {string} itemId
   * @param {number} delta -   ( ， )
   */
  adjustItemScale(itemId, delta) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const nextScale = Math.max(0.5, Math.min(4.0, (item.scale || 1) + delta));
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { scale: nextScale } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Shortcuts：[/]  RotateFurniture
   * @param {string} itemId
   * @param {number} deltaDeg - Rotate  ( ， )
   */
  adjustItemRotation(itemId, deltaDeg) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const radStep = deltaDeg * Math.PI / 180;
    let rotation = (item.rotation || 0) + radStep;
    rotation = (rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { rotation } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Furniture 、 Rotate ， 
   * @param {Object} bookshelf -  Furniture 
   * @param {Object} beforeState -   { x, z, rotation, elevation }
   */
  updateChildrenOnBookshelf(bookshelf, beforeState) {
    const supportedTypes = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'];
    const definition = this.opts.testMap.getFurnitureDefinition(bookshelf.type);
    if (!definition) return;
    
    const isMannequin = definition.type.includes('clothing_mannequin');
    const isTable = isTabletopSurfaceDefinition(definition);
    if (!supportedTypes.includes(definition.type) && !isMannequin && !isTable) return;
    
    const dx = bookshelf.x - beforeState.x;
    const dz = bookshelf.z - beforeState.z;
    const dr = (bookshelf.rotation || 0) - (beforeState.rotation || 0);
    const de = (bookshelf.elevation || 0) - (beforeState.elevation || 0);

    const beforeSize = getItemSizeInMetres(beforeState, definition);
    const currentSize = getItemSizeInMetres(bookshelf, definition);

    const oldTopElevation = (beforeState.elevation || 0) + beforeSize.height;
    const newTopElevation = (bookshelf.elevation || 0) + currentSize.height;
    const deTop = newTopElevation - oldTopElevation;

    const dw = currentSize.width - beforeSize.width;
    const dd = currentSize.depth - beforeSize.depth;

    const deEffective = isTable ? deTop : (Math.abs(de) > 0.0001 ? de : deTop);

    if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001 && Math.abs(dr) < 0.0001 && Math.abs(deEffective) < 0.0001 && Math.abs(dw) < 0.0001 && Math.abs(dd) < 0.0001) return;
    
    let isDraggingThis = false;
    let initialChildrenIds = null;

    if (this.dragState && this.dragState.itemId === bookshelf.id) {
      isDraggingThis = true;
      initialChildrenIds = this.dragState.initialChildrenIds || null;
    } else if (this.opts.getDrag3DState) {
      const d3s = this.opts.getDrag3DState();
      if (d3s && d3s.type === 'item' && d3s.itemId === bookshelf.id) {
        isDraggingThis = true;
        initialChildrenIds = d3s.initialChildrenIds || null;
      }
    }

    let itemsOnShelf;
    if (isDraggingThis && initialChildrenIds) {
      itemsOnShelf = this.opts.testMap.getEntities('item').filter(item => initialChildrenIds.includes(item.id));
    } else {
      if (isMannequin) {
        itemsOnShelf = this.opts.testMap.getEntities('item').filter(item => {
          if (item.id === bookshelf.id) return false;
          if (!item.type.startsWith('clothing_') || item.type.includes('mannequin')) return false;

          const cdx = item.x - beforeState.x;
          const cdz = item.z - beforeState.z;
          const distSq = cdx * cdx + cdz * cdz;
          if (distSq > 0.05 * 0.05) return false;

          const modelH = (bookshelf.height ?? (definition.defaultSize.height / INCHES_PER_UNIT)) * (bookshelf.scale || 1);
          const itemElev = item.elevation || 0;
          const modelElev = beforeState.elevation || 0;
          return itemElev >= modelElev && itemElev <= modelElev + modelH + (5.0 / INCHES_PER_UNIT);
        });
      } else if (isTable) {
        const queryTableState = {
          ...beforeState,
          width: Math.max(beforeSize.width, currentSize.width),
          depth: Math.max(beforeSize.depth, currentSize.depth),
          height: beforeSize.height
        };
        itemsOnShelf = getItemsOnTable(
          queryTableState, 
          this.opts.testMap.getEntities('item'),
          (type) => this.opts.testMap.getFurnitureDefinition(type)
        );
      } else {
        itemsOnShelf = getItemsOnBookshelf(
          beforeState, 
          this.opts.testMap.getEntities('item'),
          (type) => this.opts.testMap.getFurnitureDefinition(type)
        );
      }
      
      if (isDraggingThis) {
        const ids = itemsOnShelf.map(item => item.id);
        if (this.dragState && this.dragState.itemId === bookshelf.id) {
          this.dragState.initialChildrenIds = ids;
        } else if (this.opts.getDrag3DState) {
          const d3s = this.opts.getDrag3DState();
          if (d3s && d3s.type === 'item' && d3s.itemId === bookshelf.id) {
            d3s.initialChildrenIds = ids;
          }
        }
      }
    }
    
    for (const childItem of itemsOnShelf) {
      const cx = beforeState.x;
      const cz = beforeState.z;
      const oRot = beforeState.rotation || 0;
      
      const cdx = childItem.x - cx;
      const cdz = childItem.z - cz;
      
      const cos = Math.cos(-oRot);
      const sin = Math.sin(-oRot);
      const lx = cdx * cos - cdz * sin;
      const lz = cdx * sin + cdz * cos;
      
      const nx = bookshelf.x;
      const nz = bookshelf.z;
      const nRot = bookshelf.rotation || 0;
      
      const cosRot = Math.cos(nRot);
      const sinRot = Math.sin(nRot);
      const newWx = nx + lx * cosRot + lz * sinRot;
      const newWz = nz - lx * sinRot + lz * cosRot;
      
      const newRot = (childItem.rotation || 0) + dr;
      const newElevation = (childItem.elevation || 0) + deEffective;
      
      this.opts.testMap.executeCommand('updateItem', {
        itemId: childItem.id,
        patch: {
          x: Number(newWx.toFixed(3)),
          z: Number(newWz.toFixed(3)),
          rotation: newRot,
          elevation: newElevation
        },
        rebuild: false
      });
      
      this.opts.testMap.syncEntityPreview('item', childItem.id);
    }
  }

  /**
   *  Furniture Furniture 
   * @param {string} type - Furniture 
   * @param {number} x -   X
   * @param {number} z -   Z
   * @param {object} [extraProps] -  （  elevation, roomId, floorId）
   * @returns {object}  Furniture item
   */
  addItem(type, x, z, extraProps = {}) {
    const definition = this.opts.testMap.getFurnitureDefinition(type);
    if (!definition) return null;
    this.opts.pushHistory();
    const isMeterDef = definition.unit === 'm';
    const height = isMeterDef ? definition.defaultSize.height : definition.defaultSize.height / INCHES_PER_UNIT;
    const resolvedExtraProps = { ...extraProps };
    if (definition.placeType === 'wall' && resolvedExtraProps.elevation === undefined) {
      const wallHeight = Number(this.opts.testMap.getProjectMetadata().wallHeight || 2.8);
      resolvedExtraProps.elevation = defaultWallElevation(height, wallHeight);
    }
    const item = this.opts.testMap.executeCommand('addItem', {
      type,
      width: isMeterDef ? definition.defaultSize.width : definition.defaultSize.width / INCHES_PER_UNIT,
      depth: isMeterDef ? definition.defaultSize.depth : definition.defaultSize.depth / INCHES_PER_UNIT,
      height,
      x,
      z,
      ...resolvedExtraProps
    });
    this.opts.refreshShadows();
    this.selectItem(item.id);
    return item;
  }

  /**
   *  Furniture 
   * @param {string} itemId
   */
  resetItemMaterial(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    const definition = this.opts.testMap.getFurnitureDefinition(item.type);
    
    const colors = {};
    const materials = {};
    if (definition && definition.components) {
      definition.components.forEach((component) => {
        colors[component.id] = component.defaultColor;
        materials[component.id] = component.defaultColor;
      });
    }
    
    this.opts.testMap.executeCommand('updateItem', { itemId, patch: { colors, materials } });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  （ ）
   * @param {string} itemId
   */
  resetItemPose(itemId) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item) return;
    if (item.pose && item.pose !== 'stand') {
      this.opts.testMap.executeCommand('updateItem', { itemId, patch: { pose: 'stand', elevation: 0 } });
      this.opts.refreshShadows();
      this.opts.updateEditor();
      this.opts.renderPlan();
    }
  }

  /**
   *  Furniture 
   * @param {string} itemId
   * @param {string} componentId
   * @param {string} color
   */
  updateItemComponentColor(itemId, componentId, color) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItemComponentColor', { itemId, componentId, color });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }

  /**
   *  Furniture 
   * @param {string} itemId
   * @param {string} componentId
   * @param {object} material
   */
  updateItemComponentMaterial(itemId, componentId, material) {
    const item = this.opts.testMap.getEntity('item', itemId);
    if (!item || item.locked) return;
    this.opts.pushHistory();
    this.opts.testMap.executeCommand('updateItemComponentMaterial', { itemId, componentId, material });
    this.opts.refreshShadows();
    this.opts.updateEditor();
    this.opts.renderPlan();
  }
}
