import { pointInRoom } from '../rooms/index.js';

export const INCHES_PER_UNIT = 39.37;
export const DEFAULT_FLOOR_ID = 'floor_1';
export const DEFAULT_WALL_THICKNESS = 0.18;

export function escXml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]));
}

export function itemSize(item) {
  const scale = Number(item.scale || 1);
  return {
    width: Number(item.width || 0) * scale,
    depth: Number(item.depth || 0) * scale,
    height: Number(item.height || 0.6) * scale
  };
}

export function rotatePoint(x, z, angle) {
  const c = Math.cos(angle || 0);
  const s = Math.sin(angle || 0);
  return { x: x * c - z * s, z: x * s + z * c };
}

export function itemCorners(item) {
  const size = itemSize(item);
  const hw = size.width / 2;
  const hd = size.depth / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => {
    const rotated = rotatePoint(x, z, item.rotation || 0);
    return { x: Number(item.x || 0) + rotated.x, z: Number(item.z || 0) + rotated.z };
  });
}

export function safeName(name = 'blueprint-building') {
  return String(name).trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'blueprint-building';
}

export function orderedFloors(floorplan) {
  const floors = floorplan.floors?.length
    ? floorplan.floors
    : [{ id: floorplan.currentFloorId || DEFAULT_FLOOR_ID, name: '1F', level: 0 }];
  return [...floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
}

export function firstFloorId(floorplan) {
  return orderedFloors(floorplan)[0]?.id || DEFAULT_FLOOR_ID;
}

export function entityFloorId(floorplan, entity) {
  return entity?.floorId || firstFloorId(floorplan);
}

export function floorEntities(floorplan, collectionName, floorId) {
  const collection = collectionName === 'rooms' ? floorplan.floor?.rooms : floorplan[collectionName];
  return (collection || []).filter((entity) => entityFloorId(floorplan, entity) === floorId);
}

export function floorPrefix(index) {
  return `F${String(index + 1).padStart(2, '0')}`;
}

export function wallBasis(wall) {
  const x1 = Number(wall.from?.[0] || 0);
  const z1 = Number(wall.from?.[1] || 0);
  const x2 = Number(wall.to?.[0] || 0);
  const z2 = Number(wall.to?.[1] || 0);
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length <= 0.00001) return null;
  const ux = (x2 - x1) / length;
  const uz = (z2 - z1) / length;
  return { x1, z1, x2, z2, length, ux, uz, nx: -uz, nz: ux };
}

export function wallOpeningSpans(floorplan, wall, basis) {
  return (floorplan.openings || [])
    .filter((opening) => opening.wallId === wall.id)
    .map((opening) => {
      const center = Math.max(0, Math.min(basis.length, Number(opening.t ?? 0.5) * basis.length));
      const half = Math.max(0.05, Number(opening.width || (opening.type === 'door' ? 0.9 : 1.25))) / 2;
      return { opening, start: Math.max(0, center - half), end: Math.min(basis.length, center + half) };
    })
    .filter((span) => span.end - span.start > 0.001)
    .sort((a, b) => a.start - b.start);
}

export function pointAlongWall(basis, distance, normalOffset = 0) {
  return {
    x: basis.x1 + basis.ux * distance + basis.nx * normalOffset,
    z: basis.z1 + basis.uz * distance + basis.nz * normalOffset
  };
}

export function getFloor(floorplan, floorId) {
  const floors = orderedFloors(floorplan);
  return floors.find((floor) => floor.id === floorId) || floors[0];
}

export function getFloorElevation(floorplan, floorId) {
  const targetFloor = getFloor(floorplan, floorId);
  if (!targetFloor) return 0;
  const targetLevel = Number(targetFloor.level || 0);
  let elevation = 0;
  for (const floor of orderedFloors(floorplan)) {
    if (Number(floor.level || 0) >= targetLevel) continue;
    elevation += Number(floor.wallHeight ?? floorplan.wallHeight ?? 2.8) + Number(floor.floorHeight ?? floorplan.floorHeight ?? 0.2);
  }
  //  ， （ ） 
  const currentFH = Number(targetFloor.floorHeight ?? floorplan.floorHeight ?? 0.2);
  return elevation + currentFH;
}

export function getFloorWallRenderHeight(floorplan, floorId) {
  const floor = getFloor(floorplan, floorId);
  if (!floor) return floorplan.wallHeight ?? 2.8;
  const baseHeight = Number(floor.wallHeight ?? floorplan.wallHeight ?? 2.8);

  const sortedFloors = [...(floorplan.floors || [])].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
  const index = sortedFloors.findIndex((f) => f.id === floorId);
  if (index >= 0 && index < sortedFloors.length - 1) {
    const nextFloor = sortedFloors[index + 1];
    const nextFH = Number(nextFloor.floorHeight ?? floorplan.floorHeight ?? 0.2);
    return baseHeight + nextFH;
  }
  return baseHeight;
}

export function getItemRoomElevationOffset(floorplan, item) {
  const rooms = floorplan.floor?.rooms || [];
  const room = rooms.find((candidate) => candidate.id === item.roomId)
    || rooms.find((candidate) => entityFloorId(floorplan, candidate) === entityFloorId(floorplan, item) && pointInRoom(candidate, item.x, item.z));
  if (room) {
    return Number(room.elevation || 0);
  }
  const floorId = entityFloorId(floorplan, item);
  const floor = getFloor(floorplan, floorId);
  const floorHeight = Number(floor?.floorHeight ?? floorplan.floorHeight ?? 0.2);
  return -floorHeight;
}

/**
 *  / 
 * @param {Object} item  
 * @param {Array<Object>} items  
 * @param {Function} [getFurnitureDefinition]  ， Furniture 
 * @returns {boolean}  
 */
export function isItemSnappedToBookshelfOrMannequin(item, items, getFurnitureDefinition) {
  if (!items || !item) return false;
  
  const INCHES_PER_UNIT = 39.37;
  
  for (const other of items) {
    if (other.id === item.id) continue;
    
    let isBookshelf = false;
    let isMannequin = false;
    let otherWidth = Number(other.width || 0);
    let otherDepth = Number(other.depth || 0);
    let otherHeight = Number(other.height || 0);
    
    if (getFurnitureDefinition) {
      const otherDef = getFurnitureDefinition(other.type);
      if (otherDef) {
        const type = otherDef.type || '';
        isBookshelf = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'].includes(type);
        isMannequin = type.includes('mannequin') || type.includes('clothing_mannequin');
        
        if (!other.width && otherDef.defaultSize?.width) otherWidth = otherDef.unit === 'm' ? otherDef.defaultSize.width : otherDef.defaultSize.width / INCHES_PER_UNIT;
        if (!other.depth && otherDef.defaultSize?.depth) otherDepth = otherDef.unit === 'm' ? otherDef.defaultSize.depth : otherDef.defaultSize.depth / INCHES_PER_UNIT;
        if (!other.height && otherDef.defaultSize?.height) otherHeight = otherDef.unit === 'm' ? otherDef.defaultSize.height : otherDef.defaultSize.height / INCHES_PER_UNIT;
      }
    }
    
    //  / （  CAD Export ）
    if (!isBookshelf && !isMannequin) {
      const typeLower = (other.type || '').toLowerCase();
      const nameLower = (other.name || '').toLowerCase();
      
      isBookshelf = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'].some(t => typeLower.includes(t)) ||
                    [' Item', ' Item', ' Item', ' Item', ' Item', 'Storage Item', ' Item'].some(k => nameLower.includes(k));
      isMannequin = typeLower.includes('mannequin') || [' Item', ' Item'].some(k => nameLower.includes(k));
      
      if (otherWidth <= 0) otherWidth = 1.0;
      if (otherDepth <= 0) otherDepth = 0.4;
      if (otherHeight <= 0) otherHeight = 1.8;
    }
    
    if (!isBookshelf && !isMannequin) continue;
    
    const scale = Number(other.scale || 1);
    const itemElev = Number(item.elevation || 0);
    const otherElev = Number(other.elevation || 0);
    const otherH = otherHeight * scale;
    
    if (isBookshelf) {
      // 1.  ： 
      if (itemElev < otherElev + 0.05 || itemElev > otherElev + otherH + (5.0 / INCHES_PER_UNIT)) {
        continue;
      }
      // 2.  
      const dx = item.x - other.x;
      const dz = item.z - other.z;
      const angle = other.rotation || 0;
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const localX = dx * cos - dz * sin;
      const localZ = dx * sin + dz * cos;
      
      const halfW = (otherWidth * scale) / 2;
      const halfD = (otherDepth * scale) / 2;
      const snapMargin = 0.05; //  
      
      if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
        return true;
      }
    } else if (isMannequin) {
      // 1.  ：  clothing_  ， 
      const itemType = (item.type || '').toLowerCase();
      if (!itemType.startsWith('clothing_') || itemType.includes('mannequin')) {
        continue;
      }
      // 2.  ： 
      if (itemElev < otherElev - (2.0 / INCHES_PER_UNIT) || itemElev > otherElev + otherH + (5.0 / INCHES_PER_UNIT)) {
        continue;
      }
      // 3.  ： 
      const dx = item.x - other.x;
      const dz = item.z - other.z;
      const distSq = dx * dx + dz * dz;
      if (distSq <= 0.05 * 0.05) {
        return true;
      }
    }
  }
  
  return false;
}
