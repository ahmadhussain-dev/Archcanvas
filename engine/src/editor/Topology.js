import { getRoomVertices } from '../rooms/index.js';

/**
 *  
 */

/**
 *  
 * @param {number} value  
 * @param {boolean} snapEnabled  
 * @param {number} snapSize  
 * @returns {number}  
 */
export function snapValue(value, snapEnabled, snapSize) {
  if (!snapEnabled || !snapSize) return value;
  return Math.round(value / snapSize) * snapSize;
}

/**
 *  （Vertex Alignment）
 * @param {{x: number, z: number}} world  
 * @param {boolean} snapEnabled  
 * @param {number} snapSize  
 * @returns {{x: number, z: number}}  
 */
export function snapWorldPoint(world, snapEnabled, snapSize) {
  return {
    x: Number(snapValue(world.x, snapEnabled, snapSize).toFixed(3)),
    z: Number(snapValue(world.z, snapEnabled, snapSize).toFixed(3))
  };
}

/**
 *  （Edge Segment Center Alignment）
 * @param {{x: number, z: number}} point  
 * @param {boolean} snapEnabled  
 * @param {number} snapSize  
 * @returns {{x: number, z: number}}  
 */
export function snapToGridSegmentCenter(point, snapEnabled, snapSize) {
  if (!snapEnabled || !snapSize) return point;
  const S = snapSize;
  const x = point.x;
  const z = point.z;

  //   1：  (z   j*S，x   0.5*S  ， )
  const x1 = Math.round(x / (0.5 * S)) * (0.5 * S);
  const z1 = Math.round(z / S) * S;
  const d1 = (x - x1) * (x - x1) + (z - z1) * (z - z1);

  //   2：  (x   k*S，z   0.5*S  ， )
  const x2 = Math.round(x / S) * S;
  const z2 = Math.round(z / (0.5 * S)) * (0.5 * S);
  const d2 = (x - x2) * (x - x2) + (z - z2) * (z - z2);

  if (d1 < d2) {
    return {
      x: Number(x1.toFixed(3)),
      z: Number(z1.toFixed(3))
    };
  } else {
    return {
      x: Number(x2.toFixed(3)),
      z: Number(z2.toFixed(3))
    };
  }
}

/**
 *  
 * @param {number} value  
 * @param {boolean} snapEnabled  
 * @param {number} snapSize  
 * @returns {number}  
 */
export function snapNumber(value, snapEnabled, snapSize) {
  return Number(snapValue(value, snapEnabled, snapSize).toFixed(3));
}

/**
 *  
 * @param {Object} room Room （ ）
 * @param {{x: number, z: number}} defaultPos  （ Room ）
 * @param {number} wallThickness  
 * @returns {{x: number, z: number, width: number, depth: number}}  
 */
export function calculateAutoRoofBounds(room, defaultPos, wallThickness = 0.15) {
  if (room) {
    return {
      x: room.x,
      z: room.z,
      width: room.width + wallThickness,
      depth: room.depth + wallThickness
    };
  }
  return {
    x: defaultPos.x,
    z: defaultPos.z,
    width: 6,
    depth: 6
  };
}

/**
 *   T  ， 
 * @param {{x: number, z: number}} point  
 * @param {Object} fence  
 * @param {boolean} snapEnabled  
 * @param {number} snapSize  
 * @returns {{t: number, distance: number}}   T  
 */
export function projectPointToFence(point, fence, snapEnabled, snapSize) {
  const [ax, az] = fence.from;
  const [bx, bz] = fence.to;
  const fdx = bx - ax;
  const fdz = bz - az;
  const lenSq = fdx * fdx + fdz * fdz;
  if (lenSq <= 0.001) return { t: 0.5, distance: Infinity };

  const rawT = Math.max(0.01, Math.min(0.99, ((point.x - ax) * fdx + (point.z - az) * fdz) / lenSq));
  const rawProjX = ax + fdx * rawT;
  const rawProjZ = az + fdz * rawT;
  const rawDistance = Math.hypot(point.x - rawProjX, point.z - rawProjZ);

  let t = rawT;
  if (snapEnabled && snapSize) {
    const rawCenterX = ax + fdx * t;
    const rawCenterZ = az + fdz * t;
    const snapped = snapToGridSegmentCenter({ x: rawCenterX, z: rawCenterZ }, snapEnabled, snapSize);
    t = Math.max(0.01, Math.min(0.99, ((snapped.x - ax) * fdx + (snapped.z - az) * fdz) / lenSq));
  }

  return { t, distance: rawDistance };
}

/**
 *  
 * @param {{x: number, z: number}} point  / 
 * @param {Array<Object>} fences  
 * @param {boolean} snapEnabled  
 * @param {number} snapSize  
 * @returns {{fence: Object|null, t: number, distance: number}}  、  T  
 */
export function findNearestFenceTrack(point, fences, snapEnabled, snapSize) {
  let nearestFence = null;
  let nearestDist = Infinity;
  let projectionT = 0.5;

  for (const fence of fences) {
    const { t, distance } = projectPointToFence(point, fence, snapEnabled, snapSize);
    if (distance < nearestDist) {
      nearestDist = distance;
      nearestFence = fence;
      projectionT = t;
    }
  }

  return { fence: nearestFence, t: projectionT, distance: nearestDist };
}

const INCHES_PER_UNIT = 39.37;

/**
 *  Bedroom Furniture
 * @param {string} type
 * @returns {boolean}
 */
export function isBigBedroomItem(type) {
  return type.includes('bed') || type.includes('crib') || type === 'mattress' || type === 'vanity' || type === 'hammock';
}

/**
 *  Appliances 
 * @param {string} type
 * @returns {boolean}
 */
export function isBigKitchenBathItem(type) {
  return type === 'fridge' || type === 'toilet' || type === 'bathtub' || 
         type === 'washing_machine' || type === 'stove' || type === 'shower_cabin' || 
         type === 'dishwasher' || type === 'water_dispenser' || type === 'range_hood' ||
         type === 'sink_kitchen' || type === 'sink_cabinet' || type === 'sink_bathroom';
}

/**
 *  Furniture 
 * @param {Object} item  
 * @param {Object} definition  Furniture 
 * @returns {boolean}  
 */
export function canPlaceOnTable(item, definition) {
  if (!definition) return false;
  if (definition.placeType === 'wall' || definition.placeType === 'ceiling') {
    return false;
  }
  
  const type = definition.type || '';
  const category = definition.category || '';
  
  // 1.  、 
  if (isTabletopSurfaceDefinition(definition) || category === 'storage') {
    return false;
  }
  
  // 2.  、 （seating）  cushion（ ） 
  if (category === 'seating') {
    if (type !== 'cushion') {
      return false;
    }
  }
  
  // 3. Bedroom ： / ， （ 、 、 、 ） 
  if (category === 'bedroom') {
    if (isBigBedroomItem(type)) {
      return false;
    }
  }
  
  // 4.  ： （ Refrigerator、 、 、Washing Machine、 ） ， （ Coffee Maker、 、 、 、 ） 
  if (category === 'kitchen-bath' || category === 'kitchen' || category === 'bathroom') {
    if (isBigKitchenBathItem(type)) {
      return false;
    }
  }
  
  // 5. Lighting ： ， / Lighting 
  if (category === 'lighting') {
    if (type.includes('floor')) {
      return false;
    }
    if (!type.includes('lamp') && !type.includes('light')) {
      return false;
    }
  }
  
  
  // 6. Textiles  ：  cushion（ ） ，  textiles（ ） 
  if (category === 'textiles') {
    if (type !== 'cushion') {
      return false;
    }
  }

  // 7.  ： 32 30 ， 24 
  const isMeterDef = definition.unit === 'm';
  const wInches = item.width ? item.width * INCHES_PER_UNIT : (isMeterDef ? definition.defaultSize.width * INCHES_PER_UNIT : definition.defaultSize.width);
  const dInches = item.depth ? item.depth * INCHES_PER_UNIT : (isMeterDef ? definition.defaultSize.depth * INCHES_PER_UNIT : definition.defaultSize.depth);
  if (wInches > 32 || dInches > 24) {
    return false;
  }
  return true;
}

/**
 *  Furniture 。
 *  Outdoor 。
 * @param {Object} definition Furniture 
 * @returns {boolean}
 */
export function isTabletopSurfaceDefinition(definition) {
  return !!definition && (definition.category === 'tables' || definition.tabletopSurface === true);
}

/**
 *   x_grid  Furniture
 * @param {number} x_grid -  
 * @param {number} targetZ - Furniture  Z  
 * @param {number} halfD - Furniture Rotate （Z ）
 * @param {Array<Object>} walls -  
 * @returns {boolean}
 */
export function hasVerticalWallAt(x_grid, targetZ, halfD, walls) {
  const tolerance = 0.05; //  
  for (const wall of walls) {
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    //  
    if (Math.abs(x1 - x2) < 0.01) {
      const wallX = (x1 + x2) / 2;
      if (Math.abs(x_grid - wallX) < tolerance) {
        //   Z  
        const minZ = Math.min(z1, z2);
        const maxZ = Math.max(z1, z2);
        if (targetZ + halfD >= minZ - tolerance && targetZ - halfD <= maxZ + tolerance) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 *   z_grid  Furniture
 * @param {number} z_grid -  
 * @param {number} targetX - Furniture  X  
 * @param {number} halfW - Furniture Rotate （X ）
 * @param {Array<Object>} walls -  
 * @returns {boolean}
 */
export function hasHorizontalWallAt(z_grid, targetX, halfW, walls) {
  const tolerance = 0.05; //  
  for (const wall of walls) {
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    //  
    if (Math.abs(z1 - z2) < 0.01) {
      const wallZ = (z1 + z2) / 2;
      if (Math.abs(z_grid - wallZ) < tolerance) {
        //   X  
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        if (targetX + halfW >= minX - tolerance && targetX - halfW <= maxX + tolerance) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 *  / 
 * @returns {{x: number, z: number}}
 */
export function calculateSnappedPosition({
  item,
  definition,
  x,
  z,
  snapSize,
  wallThickness,
  walls,
  shouldSnapToEdge,
  inchesToWorld
}) {
  let finalX = x;
  let finalZ = z;

  if (shouldSnapToEdge) {
    //  Furniture： ，  wallThickness / 2  
    // item.width/depth   FloorplanDocument  ， 。
    //  ， Furniture  unit  。
    const itemSize = getItemSizeInMetres(item, definition);
    const w_world = itemSize.width;
    const d_world = itemSize.depth;
    const rotation = item.rotation || 0;

    //  Rotate ， Furniture  X、Z  
    const cosVal = Math.abs(Math.cos(rotation));
    const sinVal = Math.abs(Math.sin(rotation));
    const halfW = (w_world / 2) * cosVal + (d_world / 2) * sinVal;
    const halfD = (w_world / 2) * sinVal + (d_world / 2) * cosVal;

    // X ： 
    const x_grid_left = Math.round((x - halfW) / snapSize) * snapSize;
    const x_grid_right = Math.round((x + halfW) / snapSize) * snapSize;

    //  
    const hasWallLeft = hasVerticalWallAt(x_grid_left, z, halfD, walls);
    const hasWallRight = hasVerticalWallAt(x_grid_right, z, halfD, walls);

    //  ，  wallThickness / 2
    const offsetLeft = hasWallLeft ? wallThickness / 2 : 0;
    const offsetRight = hasWallRight ? wallThickness / 2 : 0;

    const snapLeft = x_grid_left + offsetLeft + halfW;
    const snapRight = x_grid_right - offsetRight - halfW;
    finalX = Math.abs(snapLeft - x) < Math.abs(snapRight - x) ? snapLeft : snapRight;

    // Z ： 
    const z_grid_bottom = Math.round((z - halfD) / snapSize) * snapSize;
    const z_grid_top = Math.round((z + halfD) / snapSize) * snapSize;

    //  
    const hasWallBottom = hasHorizontalWallAt(z_grid_bottom, x, halfW, walls);
    const hasWallTop = hasHorizontalWallAt(z_grid_top, x, halfW, walls);

    //  ，  wallThickness / 2
    const offsetBottom = hasWallBottom ? wallThickness / 2 : 0;
    const offsetTop = hasWallTop ? wallThickness / 2 : 0;

    const snapBottom = z_grid_bottom + offsetBottom + halfD;
    const snapTop = z_grid_top - offsetTop - halfD;
    finalZ = Math.abs(snapBottom - z) < Math.abs(snapTop - z) ? snapBottom : snapTop;
  } else {
    //  Furniture： 
    finalX = Math.round((x - snapSize / 2) / snapSize) * snapSize + snapSize / 2;
    finalZ = Math.round((z - snapSize / 2) / snapSize) * snapSize + snapSize / 2;
  }

  return { x: finalX, z: finalZ };
}

/**
 *  Furniture （ ），  scale  
 * @param {Object} item - Furniture 
 * @param {Object} definition - Furniture 
 * @returns {{width: number, depth: number, height: number}}  
 */
export function getItemSizeInMetres(item, definition) {
  if (!definition) return { width: 0, depth: 0, height: 0 };
  const scale = Number(item?.scale || 1);
  const isMeterDef = definition.unit === 'm';

  const defW = isMeterDef ? definition.defaultSize.width : definition.defaultSize.width / INCHES_PER_UNIT;
  const defD = isMeterDef ? definition.defaultSize.depth : definition.defaultSize.depth / INCHES_PER_UNIT;
  const defH = isMeterDef ? definition.defaultSize.height : definition.defaultSize.height / INCHES_PER_UNIT;

  const w = item?.width !== undefined && item?.width !== null ? item.width : defW;
  const d = item?.depth !== undefined && item?.depth !== null ? item.depth : defD;
  const h = item?.height !== undefined && item?.height !== null ? item.height : defH;

  return {
    width: Number(w || 0) * scale,
    depth: Number(d || 0) * scale,
    height: Number(h || 0) * scale
  };
}

/**
 *  Storage 
 * @param {Object} item  
 * @param {Array<Object>} items  
 * @param {string} currentFloorId  ID
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Object|null}  Storage 
 */
export function findTableBelow(item, items, currentFloorId, getFurnitureDefinition) {
  const allItems = items || [];
  const itemFloorId = item.floorId || currentFloorId;
  const itemElev = item.elevation ?? 0;
  
  const candidates = [];
  
  for (const other of allItems) {
    if (other.id === item.id) continue;
    if (other.floorId !== itemFloorId) continue;
    
    const otherDef = getFurnitureDefinition(other.type);
    if (!otherDef) continue;
    
    if (!isTabletopSurfaceDefinition(otherDef) && otherDef.category !== 'storage') {
      continue;
    }
    if (otherDef.placeType === 'ceiling') {
      continue;
    }
    
    const cx = other.x;
    const cz = other.z;
    const angle = other.rotation || 0;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    const size = getItemSizeInMetres(other, otherDef);
    const halfW = size.width / 2;
    const halfD = size.depth / 2;
    
    if (Math.abs(localX) <= halfW && Math.abs(localZ) <= halfD) {
      const bottom = other.elevation || 0;
      const surface = bottom + size.height;
      candidates.push({
        item: other,
        bottom,
        surface,
        size
      });
    }
  }
  
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].item;

  //   (X,Z)  / ，  Y  
  const validCandidates = candidates.filter((c) => {
    return itemElev >= c.bottom - 0.3 && itemElev <= c.surface + 0.8;
  });

  const pool = validCandidates.length > 0 ? validCandidates : candidates;

  //   itemElev   |itemElev - surface|  
  pool.sort((a, b) => {
    const distA = Math.abs(itemElev - a.surface);
    const distB = Math.abs(itemElev - b.surface);
    if (Math.abs(distA - distB) < 1e-4) {
      return a.surface - b.surface;
    }
    return distA - distB;
  });

  return pool[0].item;
}

/**
 *  
 * @param {Object} mannequinItem  （ ） 
 * @param {Array<Object>} items  
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Object|null}  
 */
export function findNearestSeat(mannequinItem, items, getFurnitureDefinition) {
  let nearest = null;
  let minDistance = 1.2; // 1.2  
  
  const allItems = items || [];
  allItems.forEach((other) => {
    const definition = getFurnitureDefinition(other.type);
    if (!definition || !definition.interaction || typeof definition.interaction.getInteractionPoints !== 'function') return;
    
    const otherSize = getItemSizeInMetres(other, definition);
    
    const localPoints = definition.interaction.getInteractionPoints(otherSize);
    localPoints.forEach((p, index) => {
      // XZ  
      const cos = Math.cos(other.rotation || 0);
      const sin = Math.sin(other.rotation || 0);
      const wx = other.x + p.x * cos + p.z * sin;
      const wz = other.z - p.x * sin + p.z * cos;
      const wy = (other.elevation || 0) + p.y;
      
      const dx = mannequinItem.x - wx;
      const dz = mannequinItem.z - wz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < minDistance) {
        minDistance = dist;
        nearest = {
          item: other,
          pointIndex: index,
          pointType: definition.interaction.type,
          worldPos: { x: wx, y: wy, z: wz }
        };
      }
    });
  });
  
  return nearest;
}

/**
 *   XZ  
 */
export function pointToSegmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  if (l2 === 0) return Math.hypot(p.x - a[0], p.z - a[1]);
  let t = ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a[0] + t * dx;
  const projZ = a[1] + t * dz;
  return Math.hypot(p.x - projX, p.z - projZ);
}

/**
 *  
 */
export function isEdgeWallFree(p1, p2, walls) {
  const mid = { x: (p1.x + p2.x) / 2, z: (p1.z + p2.z) / 2 };
  for (const wall of walls) {
    const dist = pointToSegmentDistance(mid, wall.from, wall.to);
    if (dist < 0.15) {
      return false;
    }
  }
  return true;
}

/**
 *  （ ） 
 */
export function getFreeFloorEdges(rooms, walls) {
  const edges = [];
  rooms.forEach(room => {
    const vertices = getRoomVertices(room);
    if (!vertices || vertices.length < 3) return;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % n];
      if (isEdgeWallFree(p1, p2, walls)) {
        const isDuplicate = edges.some(e => 
          (Math.hypot(e.p1.x - p1.x, e.p1.z - p1.z) < 0.05 && Math.hypot(e.p2.x - p2.x, e.p2.z - p2.z) < 0.05) ||
          (Math.hypot(e.p1.x - p2.x, e.p1.z - p2.z) < 0.05 && Math.hypot(e.p2.x - p1.x, e.p2.z - p1.z) < 0.05)
        );
        if (!isDuplicate) {
          edges.push({ p1: { x: p1.x, z: p1.z }, p2: { x: p2.x, z: p2.z } });
        }
      }
    }
  });
  return edges;
}

/**
 *  、 
 */
export function getStairsRailingSegments(stairs, testMap) {
  const segments = [];
  if (!stairs) return segments;

  const width = Math.max(0.1, Number(stairs.width || 0.6));
  const depth = Math.max(0.1, Number(stairs.depth || 0.2));
  const height = testMap.getStairsAutoHeight(stairs);

  function getWordPos(lx, lz) {
    const rot = stairs.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    //   Babylon.js   (group.rotation.y)   3D  
    const wx = (stairs.x || 0) + lx * cos + lz * sin;
    const wz = (stairs.z || 0) - lx * sin + lz * cos;
    return [wx, wz];
  }

  const subtype = stairs.subtype || 'straight';
  const flipX = stairs.mirrored ? -1 : 1;

  if (subtype === 'straight' || subtype === 'floating') {
    const tilt = Math.atan2(height, depth);
    const yOffset = height / 2;

    segments.push({
      sectionId: `${stairs.id}_left`,
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2),
      tilt,
      yOffset
    });

    segments.push({
      sectionId: `${stairs.id}_right`,
      from: getWordPos(width / 2, -depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt,
      yOffset
    });
  } else if (subtype === 'lshape') {
    const n1 = Math.max(1, Math.min(stairs.steps || 9, stairs.cornerStep ?? Math.floor((stairs.steps || 9) / 2)));
    const stepHeight = height / (stairs.steps || 9);
    const landHeight = stepHeight * n1;
    const runBeforeCorner = Math.max(0.2, Number(stairs.runBeforeCorner ?? (depth - width)));
    const runAfterCorner = Math.max(0.2, Number(stairs.runAfterCorner ?? (depth - width)));
    const landingZ = runBeforeCorner / 2;

    const l1Depth = runBeforeCorner;
    const tilt1 = Math.atan2(landHeight, l1Depth);
    const yOffset1 = landHeight / 2;

    //  
    segments.push({
      sectionId: `${stairs.id}_l1_left`,
      from: getWordPos(-width / 2, -(runBeforeCorner + width) / 2),
      to: getWordPos(-width / 2, landingZ - width / 2),
      tilt: tilt1,
      yOffset: yOffset1
    });

    segments.push({
      sectionId: `${stairs.id}_l1_right`,
      from: getWordPos(width / 2, -(runBeforeCorner + width) / 2),
      to: getWordPos(width / 2, landingZ - width / 2),
      tilt: tilt1,
      yOffset: yOffset1
    });

    //  
    const l2Length = runAfterCorner;
    const tilt2 = Math.atan2(height - landHeight, l2Length);
    const yOffset2 = landHeight + (height - landHeight) / 2;
    const lxStart = (width / 2) * flipX;
    const lxEnd = (width / 2 + runAfterCorner) * flipX;

    segments.push({
      sectionId: `${stairs.id}_l2_front`,
      from: getWordPos(lxStart, landingZ + width / 2),
      to: getWordPos(lxEnd, landingZ + width / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });

    segments.push({
      sectionId: `${stairs.id}_l2_back`,
      from: getWordPos(lxStart, landingZ - width / 2),
      to: getWordPos(lxEnd, landingZ - width / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });
  } else if (subtype === 'ushape') {
    const halfSteps = Math.floor((stairs.steps || 9) / 2);
    const slotW = stairs.uSlotWidth ?? 0.1;
    const voidL = stairs.uVoidLength ?? (depth - 1);
    const landDepth = Math.max(0.4, Math.min(depth - 0.2, depth - voidL));
    const stepHeight = (height / 2) / halfSteps;
    const landHeight = height / 2;

    const u1Depth = depth - landDepth;
    const tilt1 = Math.atan2(landHeight, u1Depth);
    const yOffset1 = landHeight / 2;

    //  
    segments.push({
      sectionId: `${stairs.id}_u1_outer`,
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2 - landDepth),
      tilt: tilt1,
      yOffset: yOffset1
    });

    segments.push({
      sectionId: `${stairs.id}_u1_inner`,
      from: getWordPos(-slotW / 2, -depth / 2),
      to: getWordPos(-slotW / 2, depth / 2 - landDepth),
      tilt: tilt1,
      yOffset: yOffset1
    });

    //  
    const tilt2 = Math.atan2(height - landHeight, u1Depth);
    const yOffset2 = landHeight + (height - landHeight) / 2;

    segments.push({
      sectionId: `${stairs.id}_u2_inner`,
      from: getWordPos(slotW / 2, depth / 2 - landDepth),
      to: getWordPos(slotW / 2, -depth / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });

    segments.push({
      sectionId: `${stairs.id}_u2_outer`,
      from: getWordPos(width / 2, depth / 2 - landDepth),
      to: getWordPos(width / 2, -depth / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });

    //  
    segments.push({
      sectionId: `${stairs.id}_landing`,
      from: getWordPos(-width / 2, depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt: 0,
      yOffset: landHeight
    });
  } else if (subtype === 'spiral') {
    const radius = Math.max(width, depth) / 2;
    const totalRad = ((stairs.spiralDegrees ?? 360) * Math.PI) / 180;
    const N = Math.max(6, Math.round((totalRad / Math.PI) * 12));

    for (let i = 0; i < N; i++) {
      const angStart = (i / N) * totalRad;
      const angEnd = ((i + 1) / N) * totalRad;

      const lx1 = radius * Math.sin(angStart) * flipX;
      const lz1 = -radius * Math.cos(angStart);
      const y1 = (i / N) * height;

      const lx2 = radius * Math.sin(angEnd) * flipX;
      const lz2 = -radius * Math.cos(angEnd);
      const y2 = ((i + 1) / N) * height;

      const fromPos = getWordPos(lx1, lz1);
      const toPos = getWordPos(lx2, lz2);
      const len = Math.hypot(lx2 - lx1, lz2 - lz1);
      const tilt = Math.atan2(y2 - y1, len);
      const yOffset = (y1 + y2) / 2;

      segments.push({
        sectionId: `${stairs.id}_outer`,
        from: fromPos,
        to: toPos,
        tilt: tilt,
        yOffset: yOffset,
        skipStartPost: false,
        skipEndPost: i < N - 1
      });
    }
  } else if (subtype === 'curved') {
    const outerR = depth;
    const innerR = Math.max(0.2, depth - width);
    const totalRad = ((stairs.spiralDegrees ?? 90) * Math.PI) / 180;
    const N = Math.max(6, Math.round((totalRad / Math.PI) * 12));

    for (let i = 0; i < N; i++) {
      const angStart = (i / N) * totalRad;
      const angEnd = ((i + 1) / N) * totalRad;
      const y1 = (i / N) * height;
      const y2 = ((i + 1) / N) * height;

      //  
      const olx1 = (-width / 2 + outerR * Math.sin(angStart)) * flipX;
      const olz1 = -depth / 2 + outerR * Math.cos(angStart);
      const olx2 = (-width / 2 + outerR * Math.sin(angEnd)) * flipX;
      const olz2 = -depth / 2 + outerR * Math.cos(angEnd);

      const ofrom = getWordPos(olx1, olz1);
      const oto = getWordPos(olx2, olz2);
      const olen = Math.hypot(olx2 - olx1, olz2 - olz1);
      const otilt = Math.atan2(y2 - y1, olen);
      const oyOffset = (y1 + y2) / 2;

      segments.push({
        sectionId: `${stairs.id}_outer`,
        from: ofrom,
        to: oto,
        tilt: otilt,
        yOffset: oyOffset,
        skipStartPost: false,
        skipEndPost: i < N - 1
      });

      //  
      const ilx1 = (-width / 2 + innerR * Math.sin(angStart)) * flipX;
      const ilz1 = -depth / 2 + innerR * Math.cos(angStart);
      const ilx2 = (-width / 2 + innerR * Math.sin(angEnd)) * flipX;
      const ilz2 = -depth / 2 + innerR * Math.cos(angEnd);

      const ifrom = getWordPos(ilx1, ilz1);
      const ito = getWordPos(ilx2, ilz2);
      const ilen = Math.hypot(ilx2 - ilx1, ilz2 - ilz1);
      const itilt = Math.atan2(y2 - y1, ilen);
      const iyOffset = (y1 + y2) / 2;

      segments.push({
        sectionId: `${stairs.id}_inner`,
        from: ifrom,
        to: ito,
        tilt: itilt,
        yOffset: iyOffset,
        skipStartPost: false,
        skipEndPost: i < N - 1
      });
    }
  } else if (subtype === 'ladder') {
    segments.push({
      sectionId: `${stairs.id}_left`,
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2),
      tilt: 0,
      yOffset: height / 2
    });
    segments.push({
      sectionId: `${stairs.id}_right`,
      from: getWordPos(width / 2, -depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt: 0,
      yOffset: height / 2
    });
  } else {
    const tilt = Math.atan2(height, depth);
    const yOffset = height / 2;

    segments.push({
      sectionId: `${stairs.id}_left`,
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2),
      tilt,
      yOffset
    });

    segments.push({
      sectionId: `${stairs.id}_right`,
      from: getWordPos(width / 2, -depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt,
      yOffset
    });
  }

  return segments;
}

/**
 *  （XZ  ） Storage （ 、 、 、 、 ）
 * @param {Object} item  
 * @param {Array<Object>} items  
 * @param {string} currentFloorId  ID
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Object|null}  Storage 
 */
export function findBookshelfNearby(item, items, currentFloorId, getFurnitureDefinition) {
  let nearestBookshelf = null;
  let minDistance = Infinity;
  
  const allItems = items || [];
  const itemFloorId = item.floorId || currentFloorId;
  const snapMargin = 0.30; // 30  ， 

  const supportedTypes = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'];

  for (const other of allItems) {
    if (other.id === item.id) continue;
    if (other.floorId !== itemFloorId) continue;
    
    const otherDef = getFurnitureDefinition(other.type);
    if (!otherDef || !supportedTypes.includes(otherDef.type)) continue;
    
    const cx = other.x;
    const cz = other.z;
    const angle = other.rotation || 0;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    //  Storage 
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    const size = getItemSizeInMetres(other, otherDef);
    const halfW = size.width / 2;
    const halfD = size.depth / 2;
    
    //  Storage （ ）
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      const dist = Math.hypot(localX, localZ);
      if (dist < minDistance) {
        minDistance = dist;
        nearestBookshelf = other;
      }
    }
  }
  return nearestBookshelf;
}

/**
 *  Storage Rotate
 * @param {Object} item  
 * @param {Object} bookshelf  Storage 
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Object|null}   { x, z, elevation, rotation }
 */
export function snapToBookshelf(item, bookshelf, getFurnitureDefinition) {
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return null;
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const bWidth = bSize.width;
  
  //   y  （ ） 
  const worldShelvesY = getShelfLayerHeights(bookshelf, getFurnitureDefinition);
  if (worldShelvesY.length === 0) return null;
  
  //   Y  （ ）
  const itemYWorld = item.elevation || 0;
  
  //  
  let closestShelfY = worldShelvesY[0];
  let minDiff = Infinity;
  worldShelvesY.forEach(y => {
    const diff = Math.abs(itemYWorld - y);
    if (diff < minDiff) {
      minDiff = diff;
      closestShelfY = y;
    }
  });
  
  //   X, Z  
  const cx = bookshelf.x;
  const cz = bookshelf.z;
  const angle = bookshelf.rotation || 0;
  
  const dx = item.x - cx;
  const dz = item.z - cz;
  
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const localX = dx * cos - dz * sin;
  
  //   and  
  let clampedLocalX = localX;
  let clampedLocalZ = 0.0; //  Lock （ Z = 0）
  
  const scale = bookshelf.scale || 1;
  if (bookshelfDef.type === 'corner_shelf') {
    const maxLocalX = bWidth / 2 - 0.02 * scale;
    clampedLocalX = Math.max(-maxLocalX, Math.min(maxLocalX, localX));
    clampedLocalZ = 0.0;
  } else {
    //  （ ），Lock 
    const sideWallT = (bookshelfDef.type === 'shoerack' ? 0.03 : 0.04) * scale;
    const maxLocalX = bWidth / 2 - sideWallT;
    clampedLocalX = Math.max(-maxLocalX, Math.min(maxLocalX, localX));
    clampedLocalZ = 0.0;
  }
  
  //  
  const cosRot = Math.cos(angle);
  const sinRot = Math.sin(angle);
  const worldX = cx + clampedLocalX * cosRot + clampedLocalZ * sinRot;
  const worldZ = cz - clampedLocalX * sinRot + clampedLocalZ * cosRot;
  const worldY = closestShelfY;
  
  return {
    x: Number(worldX.toFixed(3)),
    z: Number(worldZ.toFixed(3)),
    elevation: Number(worldY.toFixed(3)),
    rotation: angle
  };
}

/**
 *  Storage （ 、 ） （ ，  elevation）
 * @param {Object} bookshelf  Storage 
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Array<number>}  
 */
export function getShelfLayerHeights(bookshelf, getFurnitureDefinition) {
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return [];
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const bHeight = bSize.height;
  
  let localShelvesY = [];
  const scale = bookshelf.scale || 1;
  if (bookshelfDef.type === 'bookshelf') {
    //  ： 0.06m， 0.03m（ 0.015m），  0.25, 0.50, 0.75， 1.0
    localShelvesY = [
      0.06 * scale,
      bHeight * 0.25 + 0.015 * scale,
      bHeight * 0.50 + 0.015 * scale,
      bHeight * 0.75 + 0.015 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'shoerack') {
    //  ：  0.32, 0.72， 0.02m（ 0.01m）， 1.0
    localShelvesY = [
      0.0,
      bHeight * 0.32 + 0.01 * scale,
      bHeight * 0.72 + 0.01 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'display_cabinet') {
    // Glass ：  0.28, 0.52, 0.76， 0.02m， 1.0
    localShelvesY = [
      0.04 * scale, //   0.04m
      bHeight * 0.28 + 0.01 * scale,
      bHeight * 0.52 + 0.01 * scale,
      bHeight * 0.76 + 0.01 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'grid_cabinet') {
    //  ：  0.33, 0.66， 0.02m， 1.0
    localShelvesY = [
      0.03 * scale, //   0.03m
      bHeight * 0.33 + 0.01 * scale,
      bHeight * 0.66 + 0.01 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'corner_shelf') {
    //  ：  0.15, 0.40, 0.65, 0.90， 0.02m
    localShelvesY = [
      bHeight * 0.15 + 0.01 * scale,
      bHeight * 0.40 + 0.01 * scale,
      bHeight * 0.65 + 0.01 * scale,
      bHeight * 0.90 + 0.01 * scale
    ];
  } else {
    //   fallback
    localShelvesY = [0, bHeight];
  }
  
  const bElevationWorld = bookshelf.elevation || 0; //  
  return localShelvesY.map(y => bElevationWorld + y);
}

/**
 *  Storage 
 * @param {Object} bookshelf  Storage 
 * @param {Array<Object>} items  
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {number}  
 */
export function getItemsCountOnBookshelf(bookshelf, items, getFurnitureDefinition) {
  let count = 0;
  const allItems = items || [];
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return 0;
  
  const cx = bookshelf.x;
  const cz = bookshelf.z;
  const angle = bookshelf.rotation || 0;
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const halfW = bSize.width / 2;
  const halfD = bSize.depth / 2;
  const snapMargin = 0.0; //  ， 
  
  for (const item of allItems) {
    if (item.id === bookshelf.id) continue;
    const itemDef = getFurnitureDefinition(item.type);
    if (!itemDef) continue;
    if (!canPlaceOnTable(item, itemDef)) continue;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      count++;
    }
  }
  return count;
}

/**
 *  Storage 
 * @param {Object} bookshelf  Storage 
 * @param {Array<Object>} items  
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Array<Object>}  
 */
export function getItemsOnBookshelf(bookshelf, items, getFurnitureDefinition) {
  const result = [];
  const allItems = items || [];
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return [];
  
  const cx = bookshelf.x;
  const cz = bookshelf.z;
  const angle = bookshelf.rotation || 0;
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const halfW = bSize.width / 2;
  const halfD = bSize.depth / 2;
  const snapMargin = 0.0; //  ， 
  
  const topElevation = (bookshelf.elevation || 0) + bSize.height;
  const bottomElevation = bookshelf.elevation || 0;

  for (const item of allItems) {
    if (item.id === bookshelf.id) continue;
    const itemDef = getFurnitureDefinition(item.type);
    if (!itemDef) continue;
    if (!canPlaceOnTable(item, itemDef)) continue;
    
    //  ， 、 
    const itemElev = item.elevation || 0;
    if (itemElev < bottomElevation - 0.02 || itemElev > topElevation + 5.0) continue;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      result.push(item);
    }
  }
  return result;
}

/**
 *  Tables/ （0-10cm） 
 * @param {Object} table  TablesFurniture
 * @param {Array<Object>} items  
 * @param {Function} getFurnitureDefinition  Furniture 
 * @returns {Array<Object>}  
 */
export function getItemsOnTable(table, items, getFurnitureDefinition) {
  const result = [];
  const allItems = items || [];
  const tableDef = getFurnitureDefinition(table.type);
  if (!tableDef) return [];
  if (!isTabletopSurfaceDefinition(tableDef)) return [];

  const cx = table.x;
  const cz = table.z;
  const angle = table.rotation || 0;
  
  const size = getItemSizeInMetres(table, tableDef);
  const halfW = size.width / 2;
  const halfD = size.depth / 2;
  const snapMargin = 0.02; //  
  
  const tableTopElevation = (table.elevation || 0) + size.height;
  
  for (const item of allItems) {
    if (item.id === table.id) continue;
    const itemDef = getFurnitureDefinition(item.type);
    if (!itemDef) continue;
    if (!canPlaceOnTable(item, itemDef)) continue;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;

    //   0 ~ 10cm（0 ~ 0.10m） 
    const itemElev = item.elevation || 0;
    if (itemElev < tableTopElevation - 0.02 || itemElev > tableTopElevation + 0.10) {
      continue;
    }
    
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      result.push(item);
    }
  }
  return result;
}

