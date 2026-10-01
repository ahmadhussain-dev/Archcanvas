import assert from 'node:assert/strict';
import test from 'node:test';
import { FURNITURE_DEFINITIONS, Topology } from '../../src/index.js';
import { EntityManager } from '../../example/js/EntityManager.js';

function createTestManager(initials = [], options = {}) {
 const entities = new Map(initials.map((item) => [item.id, item]));
 const updates = [];
 const testMap = {
 getFurnitureDefinition: (type) => FURNITURE_DEFINITIONS[type],
 getEntity: (_kind, id) => entities.get(id),
 getEntities: (kind) => (kind === 'item' ? [...entities.values()] : []),
 getProjectMetadata: () => ({ wallHeight: 2.8, wallThickness: 0.15 }),
 getRoomAt: options.getRoomAt || (() => null),
 syncEntityPreview() {},
 executeCommand(command, payload) {
 if (command === 'update' || command === 'updateItem') {
 updates.push(payload);
 const item = entities.get(payload.itemId);
 if (item) {
 Object.assign(item, payload.patch);
 }
 return item;
 }
 if (command === 'rotate' || command === 'rotateItem') {
 updates.push(payload);
 const item = entities.get(payload.itemId);
 if (item) {
 item.rotation = payload.rotationRadians;
 }
 return item;
 }
 return null;
 }
 };

 const manager = new EntityManager({
 testMap,
 getSnapEnabled: () => false,
 getSnapSize: () => 1,
 inchesToWorld: (value) => value / 39.37,
 getWalls: () => [],
 getRooms: () => [],
 pushHistory() {},
 refreshShadows() {},
 updateEditor() {},
 renderPlan() {},
 clear3DEditHandles() {},
 onSelectionChanged() {},
 canPlaceOnTable: Topology.canPlaceOnTable,
 findTableBelow: (item) => Topology.findTableBelow(
 item,
 [...entities.values()],
 item.floorId || 'floor-1',
 (type) => FURNITURE_DEFINITIONS[type]
 )
 });

 return { manager, entities, updates };
}

test(' （< 10cm） ', () => {
 const shelf = {
 id: 'shelf-1',
 type: 'bookshelf',
 x: 0,
 z: 0,
 elevation: 0,
 rotation: 0,
 scale: 1
 };
 const bottom = {
 id: 'apple-bottom',
 type: 'apple',
 x: 0,
 z: 0,
 elevation: 0.05, // bottomElevation ~ bottomElevation + 0.1m 
 rotation: 0,
 scale: 1
 };

 const { manager, entities } = createTestManager([shelf, bottom]);

 // 
 manager.moveItemTo('shelf-1', 5, 5);

 assert.equal(shelf.x, 5);
 assert.equal(shelf.z, 5);
 // (5, 5)
 assert.equal(bottom.x, 5);
 assert.equal(bottom.z, 5);
});

test('Tables 0-10cm ', () => {
 const deskDef = FURNITURE_DEFINITIONS.table;
 const deskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

 const desk = {
 id: 'desk-1',
 type: deskDef.type,
 x: 10,
 z: 10,
 elevation: 0,
 rotation: 0,
 scale: 1
 };

 // ： 5cm
 const itemOnDesk = {
 id: 'cup-1',
 type: 'apple',
 x: 10,
 z: 10,
 elevation: deskHeight + 0.05,
 rotation: 0,
 scale: 1
 };

 // ： 0
 const itemOnFloor = {
 id: 'floor-item',
 type: 'apple',
 x: 10,
 z: 10,
 elevation: 0,
 rotation: 0,
 scale: 1
 };

 const { manager } = createTestManager([desk, itemOnDesk, itemOnFloor]);

 // Tables (12, 14)
 manager.moveItemTo('desk-1', 12, 14);

 // 
 assert.equal(itemOnDesk.x, 12);
 assert.equal(itemOnDesk.z, 14);

 // 
 assert.equal(itemOnFloor.x, 10);
 assert.equal(itemOnFloor.z, 10);
});

test('TablesRotate 0-10cm Rotate ', () => {
 const deskDef = FURNITURE_DEFINITIONS.table;
 const deskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

 const desk = {
 id: 'desk-2',
 type: deskDef.type,
 x: 0,
 z: 0,
 elevation: 0,
 rotation: 0,
 scale: 1
 };

 const itemOnDesk = {
 id: 'cup-2',
 type: 'apple',
 x: 0.15, // 
 z: 0,
 elevation: deskHeight + 0.02,
 rotation: 0,
 scale: 1
 };

 const { manager } = createTestManager([desk, itemOnDesk]);

 // RotateTables 90 (Math.PI / 2)
 manager.updateItemRotation('desk-2', 90);

 // Rotate ：(0.15, 0) Rotate 90 (0, -0.15) 
 assert.ok(Math.abs(itemOnDesk.x - 0) < 0.02);
 assert.ok(Math.abs(itemOnDesk.z - (-0.15)) < 0.02);
 assert.ok(Math.abs(itemOnDesk.rotation - (Math.PI / 2)) < 0.001);
});

test(' ', () => {
 const deskDef = FURNITURE_DEFINITIONS.table;
 const origDeskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

 const desk = {
 id: 'desk-3',
 type: deskDef.type,
 x: 0,
 z: 0,
 elevation: 0,
 rotation: 0,
 scale: 1
 };

 const itemOnDesk = {
 id: 'cup-3',
 type: 'apple',
 x: 0,
 z: 0,
 elevation: origDeskHeight + 0.02,
 rotation: 0,
 scale: 1
 };

 const { manager } = createTestManager([desk, itemOnDesk]);

 // 0.3 
 const newHeightMeters = origDeskHeight + 0.3;

 manager.updateItemSize(
 'desk-3',
 deskDef.defaultSize.width,
 deskDef.defaultSize.depth,
 newHeightMeters,
 0
 );

 // 1. 0.3 
 assert.ok(Math.abs(itemOnDesk.elevation - (origDeskHeight + 0.32)) < 0.01);

 // 2. ， ， 
 manager.moveItemTo('desk-3', 4, 4);
 assert.equal(itemOnDesk.x, 4);
 assert.equal(itemOnDesk.z, 4);
});

test(' ', () => {
 const deskDef = FURNITURE_DEFINITIONS.table;
 const deskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

 const desk = {
 id: 'desk-4',
 type: deskDef.type,
 x: 0,
 z: 0,
 elevation: 0,
 rotation: 0,
 scale: 1
 };

 const itemOnDesk = {
 id: 'cup-4',
 type: 'apple',
 x: 0.8, // 0.8m 
 z: 0,
 elevation: deskHeight + 0.02,
 rotation: 0,
 scale: 1
 };

 const { manager } = createTestManager([desk, itemOnDesk]);

 // updateSize 2.0m（ ）
 manager.updateItemSize(
 'desk-4',
 2.0,
 deskDef.defaultSize.depth,
 deskDef.defaultSize.height,
 0
 );

 // (3, 3)
 manager.moveItemTo('desk-4', 3, 3);

 // 0.8m 
 assert.equal(itemOnDesk.x, 3.8);
 assert.equal(itemOnDesk.z, 3);
});

test('Outdoor ', () => {
 const tableDef = FURNITURE_DEFINITIONS.outdoor_mahjong_table;
 const pileDef = FURNITURE_DEFINITIONS.outdoor_mahjong_pile;
 const tableHeight = Topology.getItemSizeInMetres({ type: tableDef.type, scale: 1 }, tableDef).height;
 const table = {
 id: 'mahjong-table-1', type: tableDef.type, floorId: 'floor-1',
 x: 1, z: 2, elevation: 0, rotation: 0, scale: 1
 };
 const pile = {
 id: 'mahjong-pile-1', type: pileDef.type, floorId: 'floor-1',
 x: 0, z: 0, elevation: 0, rotation: 0, scale: 1
 };
 const definitions = (type) => FURNITURE_DEFINITIONS[type];

 assert.equal(Topology.isTabletopSurfaceDefinition(tableDef), true);
 assert.equal(Topology.canPlaceOnTable(pile, pileDef), true);
 const pileOnTable = { ...pile, x: 1.1, z: 2, elevation: tableHeight };
 assert.equal(Topology.findTableBelow(pileOnTable, [table, pileOnTable], 'floor-1', definitions)?.id, table.id);
 assert.deepEqual(Topology.getItemsOnTable(table, [table, pileOnTable], definitions).map(({ id }) => id), [pile.id]);

 const { manager } = createTestManager([table, pile], { getRoomAt: () => ({ id: 'room-1' }) });

 manager.moveItemTo(pile.id, 1.1, 2, true);
 assert.equal(pile.elevation, tableHeight, ' ');

 manager.moveItemTo(table.id, 3, 4);
 assert.equal(pile.x, 3.1);
 assert.equal(pile.z, 4);
 assert.equal(pile.elevation, tableHeight);

 manager.updateItemRotation(table.id, 90);
 assert.ok(Math.abs(pile.x - 3) < 0.001);
 assert.ok(Math.abs(pile.z - 3.9) < 0.001);
 assert.ok(Math.abs(pile.rotation - Math.PI / 2) < 0.001);

 manager.updateItemSize(table.id, tableDef.defaultSize.width, tableDef.defaultSize.depth, tableHeight + 0.1, 0);
 assert.ok(Math.abs(pile.elevation - (tableHeight + 0.1)) < 0.001);
});
