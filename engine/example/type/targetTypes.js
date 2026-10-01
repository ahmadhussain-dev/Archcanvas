/**
 * targetTypes.js —  Furniture 
 */

export const BUILDING_TARGET_TYPES = {
  ROOM: 'room',
  WALL: 'wall',
  OPENING: 'opening',
  ROOF: 'roof',
  STAIRS: 'stairs',
  FENCE: 'fence',
  FENCE_GATE: 'fence_gate'
};

export const TARGET_TYPES = {
  ITEM: 'item',
  ...BUILDING_TARGET_TYPES
};
