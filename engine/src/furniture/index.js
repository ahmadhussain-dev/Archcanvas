import { FURNITURE_DEFINITIONS as DOMAIN_FURNITURE_DEFINITIONS } from '../domain/FurnitureCatalog.js';
export * from './seating.js';
export * from './tables.js';
export * from './storage.js';
export * from './bedroom.js';
export * from './appliances.js';
export * from './kitchen.js';
export * from './bathroom.js';
export * from './textiles.js';
export * from './decor.js';
export * from './food.js';
export * from './plants.js';
export * from './flora.js';
export * from './landscape.js';
export * from './outdoor.js';
export * from './lighting.js';
export * from './custom.js';
export * from './clothing.js';

import * as seatingModule from './seating.js';
import * as tablesModule from './tables.js';
import * as storageModule from './storage.js';
import * as bedroomModule from './bedroom.js';
import * as appliancesModule from './appliances.js';
import * as kitchenModule from './kitchen.js';
import * as bathroomModule from './bathroom.js';
import * as textilesModule from './textiles.js';
import * as decorModule from './decor.js';
import * as foodModule from './food.js';
import * as plantsModule from './plants.js';
import * as floraModule from './flora.js';
import * as landscapeModule from './landscape.js';
import * as outdoorModule from './outdoor.js';
import * as lightingModule from './lighting.js';
import * as customModule from './custom.js';
import * as clothingModule from './clothing.js';

export const FURNITURE_CATEGORIES = [
  { id: 'all', label: 'All', icon: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>' },
  { id: 'seating', label: 'Seating', icon: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M5 11h14"/><path d="M2 9h20"/><path d="M6 18v2"/><path d="M18 18v2"/>' },
  { id: 'tables', label: 'Tables', icon: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>' },
  { id: 'storage', label: 'Storage', icon: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" x2="14" y1="12" y2="12"/>' },
  { id: 'bedroom', label: 'Bedroom', icon: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
  { id: 'appliances', label: 'Appliances', icon: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M5 6h14"/><path d="M12 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>' },
  { id: 'kitchen', label: 'Kitchen', icon: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3ZM19 15v7"/>' },
  { id: 'bathroom', label: 'Bathroom', icon: '<path d="M4 12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3H4v3ZM2 11h20M6 18v2M18 18v2M8 5a4 4 0 0 1 8 0v2"/>' },
  { id: 'textiles', label: 'Textiles', icon: '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="m16 8-8 8M12 6v12M6 12h12"/>' },
  { id: 'decor', label: 'Decor', icon: '<path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4Z"/><path d="M12 10H8a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4Z"/><path d="M12 10h4a4 4 0 0 0 4-4 4 4 0 0 0-4-4h-4Z"/><path d="M12 10v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4Z"/><path d="M12 10V6a4 4 0 0 0-4-4 4 4 0 0 0-4 6v4Z"/><path d="M12 10v12"/>' },
  { id: 'food', label: 'Food', icon: '<path d="M12 2a8 8 0 0 0-8 8v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a8 8 0 0 0-8-8Z"/><path d="M6 10h12"/><path d="M12 2v8"/>' },
  { id: 'plants', label: 'Potted Plants', icon: '<path d="M12 22V12M12 12c-3-2-3-5.5 0-8M12 12c3-2 3-5.5 0-8M12 14c-4 0-6-3-6-3M12 14c4 0 6-3 6-3"/>' },
  { id: 'flora', label: 'Flora & Trees', icon: '<path d="M12 21V11"/><path d="M7 14c0-3 2-5 5-6"/><path d="M17 14c0-3-2-5-5-6"/><path d="M8 19c0-2 1.5-3.5 4-4"/><path d="M16 19c0-2-1.5-3.5-4-4"/>' },
  { id: 'landscape', label: 'Landscape', icon: '<path d="M2 20h20M5 17l4-8 5 10M11 17l5-10 6 10"/>' },
  { id: 'outdoor', label: 'Outdoor', icon: '<path d="M12 3v18"/><path d="M5 9c0-3.5 3.1-6 7-6s7 2.5 7 6c0 0-2 1-7 1S5 9 5 9Z"/><path d="M8 21h8"/>' },
  { id: 'lighting', label: 'Lighting', icon: '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6"/><path d="M8 22h8"/><path d="m16 18-2.25-2.25"/>' },
  { id: 'clothing', label: 'Clothing', icon: '<path d="M2 17h20a1 1 0 0 0 .7-1.7l-9.3-9.3c.4-.7.6-1.5.6-2.3a3 3 0 1 0-6 0c0 .8.2 1.6.6 2.3L1.3 15.3A1 1 0 0 0 2 17Z"/>' },
  { id: 'custom', label: 'Custom', icon: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' }
];

export const APPLIANCE_POWER_EFFECTS = Object.freeze({
  washing_machine: { label: 'Washing Machine', glowComponents: ['panel', 'glass'], color: '#4fc3f7', pulse: true },
  tv: { label: 'TV', glowComponents: ['screen'], color: '#64b5f6', pulse: true },
  computer: { label: 'Computer', glowComponents: ['screen', 'keyboard'], color: '#81d4fa', pulse: true },
  projector: {
    label: 'Projector',
    glowComponents: ['lens'],
    color: '#d7eeff',
    lightSource: { type: 'spot', offset: { x: 0.06, y: 0.05, z: 0.13 }, direction: { x: 0, y: 0, z: 1 }, intensity: 0.7, range: 3.0, angle: Math.PI / 5 }
  },
  game_console: { label: 'Game Console', glowComponents: ['accent'], color: '#2979ff', pulse: true },
  smart_speaker: {
    label: 'Smart Speaker',
    glowComponents: ['top'],
    color: '#77ddaa',
    pulse: true,
    pulseScaleComponents: ['body'],
    audio: 'healing'
  },
  vintage_record_player: {
    label: 'Record Player',
    glowComponents: ['accent', 'label'],
    color: '#f7c873',
    pulse: true,
    spinNodes: ['turntable'],
    spinSpeed: 2.2,
    audio: 'healing'
  },
  stereo_speaker: {
    label: 'Speaker',
    glowComponents: ['accent', 'tweeter'],
    color: '#77ddaa',
    pulse: true,
    pulseScaleComponents: ['woofer'],
    audio: 'healing'
  },
  electric_fan: { label: 'Electric Fan', glowComponents: ['base'], color: '#80cbc4', motion: 'oscillate' },
  aroma_diffuser: { label: 'Aroma Diffuser', glowComponents: ['body'], color: '#b2ebf2', pulse: true },
  hair_dryer: { label: 'Hair Dryer', glowComponents: ['nozzle'], color: '#ff8a65', motion: 'vibrate' },
  fridge: { label: 'Refrigerator', glowComponents: ['display'], color: '#80d8ff', pulse: true },
  microwave: { label: 'Microwave', glowComponents: ['window', 'button'], color: '#ffb74d', pulse: true },
  stove: { label: 'Stove', glowComponents: ['burners'], color: '#40c4ff', pulse: true },
  range_hood: { label: 'Range Hood', glowComponents: ['glass'], color: '#fff59d', pulse: true },
  coffee_maker: { label: 'Coffee Maker', glowComponents: ['accent', 'pot'], color: '#ffcc80', pulse: true },
  toaster: { label: 'Toaster', glowComponents: ['slots'], color: '#ff7043', pulse: true },
  electric_kettle: { label: 'Electric Kettle', glowComponents: ['base'], color: '#ef5350', pulse: true },
  dishwasher: { label: 'Dishwasher', glowComponents: ['handle'], color: '#80d8ff', pulse: true },
  water_dispenser: { label: 'Water Dispenser', glowComponents: ['bottle', 'outlet'], color: '#4dd0e1', pulse: true },
  rice_cooker: { label: 'Rice Cooker', glowComponents: ['panel'], color: '#69f0ae', pulse: true },
  air_fryer: { label: 'Air Fryer', glowComponents: ['display'], color: '#40c4ff', pulse: true },
  blender: { label: 'Blender', glowComponents: ['base'], color: '#76ff03', motion: 'vibrate' },
  air_conditioner_wall: { label: 'Wall AC', glowComponents: ['display'], color: '#a5d6a7', pulse: true },
  air_conditioner_floor: { label: 'Floor Standing AC', glowComponents: ['display'], color: '#a5d6a7', pulse: true },
  vending_machine: { label: 'Vending Machine', glowComponents: ['glassDisplay', 'selectionButtons'], color: '#00e5ff', pulse: true }
});

export const FURNITURE_DEFINITIONS = DOMAIN_FURNITURE_DEFINITIONS;


const furnitureModules = [
  { module: seatingModule, category: 'seating' },
  { module: tablesModule, category: 'tables' },
  { module: storageModule, category: 'storage' },
  { module: bedroomModule, category: 'bedroom' },
  { module: appliancesModule, category: 'appliances' },
  { module: kitchenModule, category: 'kitchen' },
  { module: bathroomModule, category: 'bathroom' },
  { module: textilesModule, category: 'textiles' },
  { module: decorModule, category: 'decor' },
  { module: foodModule, category: 'food' },
  { module: plantsModule, category: 'plants' },
  { module: floraModule, category: 'flora' },
  { module: landscapeModule, category: 'landscape' },
  { module: outdoorModule, category: 'outdoor' },
  { module: lightingModule, category: 'lighting' },
  { module: customModule, category: 'custom' },
  { module: clothingModule, category: 'clothing' }
];

export const FURNITURE_LIST = [];

for (const { module, category } of furnitureModules) {
  const items = module.DECOR_FURNITURE_LIST || module.TEXTILES_FURNITURE_LIST || module.FOOD_FURNITURE_LIST || Object.values(module);
  for (const item of items) {
    if (!item || typeof item !== 'object' || !item.type) continue;

    item.category = category;

    if (APPLIANCE_POWER_EFFECTS[item.type]) {
      item.isSwitchable = true;
      item.powerEffect = APPLIANCE_POWER_EFFECTS[item.type];
    }

    if (!FURNITURE_DEFINITIONS[item.type]) {
      FURNITURE_LIST.push(item);
    }
    FURNITURE_DEFINITIONS[item.type] = item;
  }
}


export function getFurnitureDefinition(type) {
  return FURNITURE_DEFINITIONS[type] || tablesModule.tableFurniture;
}

export function isPowerControllable(definition) {
  return !!definition && (
    definition.isSwitchable === true ||
    !!definition.powerEffect ||
    definition.category === 'lighting' ||
    !!definition.lightSource
  );
}

export function isWaterControllable(definition) {
  return definition?.waterControllable === true;
}

export function isAppliancePowerOn(item) {
  return item?.isOn === true;
}
