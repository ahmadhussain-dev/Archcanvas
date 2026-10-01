import assert from 'node:assert/strict';
import test from 'node:test';
import {
 FURNITURE_LIST,
 APPLIANCE_POWER_EFFECTS
} from '../../src/furniture/index.js';

test('1. Floor Standing AC， build ', () => {
 const wallAc = FURNITURE_LIST.find(item => item.type === 'air_conditioner_wall');
 assert.ok(wallAc, 'Wall AC ');
 assert.equal(wallAc.name, 'Wall AC');
 assert.equal(wallAc.category, 'appliances');
 assert.ok(typeof wallAc.build === 'function');
 assert.ok(APPLIANCE_POWER_EFFECTS.air_conditioner_wall, 'Wall AC ');

 const floorAc = FURNITURE_LIST.find(item => item.type === 'air_conditioner_floor');
 assert.ok(floorAc, 'Floor Standing AC ');
 assert.equal(floorAc.name, 'Floor Standing AC');
 assert.equal(floorAc.category, 'appliances');
 assert.ok(typeof floorAc.build === 'function');
 assert.ok(APPLIANCE_POWER_EFFECTS.air_conditioner_floor, 'Floor Standing AC ');
});

test('2. Oval Table and Triangular Round Coffee Table', () => {
 const ovalTable = FURNITURE_LIST.find(item => item.type === 'oval_table');
 assert.ok(ovalTable, 'Oval Table should exist');
 assert.equal(ovalTable.name, 'Oval Table');
 assert.equal(ovalTable.category, 'tables');
 assert.ok(typeof ovalTable.build === 'function');

 const triCoffeeTable = FURNITURE_LIST.find(item => item.type === 'triangular_round_coffee_table');
 assert.ok(triCoffeeTable, 'Triangular Round Coffee Table should exist');
 assert.equal(triCoffeeTable.name, 'Triangular Round Coffee Table');
 assert.equal(triCoffeeTable.category, 'tables');
 assert.ok(typeof triCoffeeTable.build === 'function');
});

test('3. Sink Cabinet', () => {
 const sinkCabinet = FURNITURE_LIST.find(item => item.type === 'sink_cabinet');
 assert.ok(sinkCabinet, 'Sink Cabinet should exist');
 assert.equal(sinkCabinet.name, 'Sink Cabinet');
 assert.equal(sinkCabinet.category, 'kitchen');
 assert.ok(typeof sinkCabinet.build === 'function');
});

test('4. Kitchen FurnitureAll Kitchen ', () => {
 for (const type of ['fridge', 'microwave', 'stove', 'range_hood', 'dishwasher', 'sink_kitchen', 'sink_cabinet', 'kitchenware', 'knife_block']) {
 const definition = FURNITURE_LIST.find(item => item.type === type);
 assert.equal(definition.category, 'kitchen', `${type} kitchen`);
 }
});

test('5. ', () => {
 const stove = FURNITURE_LIST.find(item => item.type === 'stove');
 assert.equal(stove.defaultSize.width, 1);

 const componentIds = new Set(stove.components.map(component => component.id));
 assert.ok(componentIds.has('oven_frame'));
 assert.ok(componentIds.has('oven_glass'));
 assert.ok(componentIds.has('oven_handle'));
});

test('6. Kitchen Appliances ', () => {
 for (const type of ['cabinet_kitchen', 'sink_kitchen', 'sink_cabinet', 'stove', 'dishwasher', 'fridge', 'range_hood']) {
 const definition = FURNITURE_LIST.find(item => item.type === type);
 const width = definition.defaultSize.width;
 assert.ok(width >= 0.9 && width <= 1.0, `${type} `);
 }
});

test('7. Dishwasher ', () => {
 const dishwasher = FURNITURE_LIST.find(item => item.type === 'dishwasher');
 assert.equal(dishwasher.defaultSize.height, 0.9);
 assert.equal(dishwasher.defaultSize.depth, 0.6);
});
