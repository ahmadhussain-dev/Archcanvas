import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getFurnitureDefinition } from '../../src/furniture/index.js';

test('Furniture Name Auto-Sync Update: Loading saved state automatically updates item names to latest definition names', () => {
 // 1. Retrieve an existing furniture definition, e.g. type 'chair'
 const chairDef = getFurnitureDefinition('chair');
 assert.ok(chairDef && chairDef.name, 'Definition for chair furniture item must exist with a valid name');

 // 2. Create mock legacy floorplan data containing an outdated furniture name
 const mockOldFloorplan = {
 name: 'Test Floorplan',
 unit: 'm',
 currentFloorId: 'ground',
 floors: [
 { id: 'ground', name: 'Ground Floor', level: 0, wallHeight: 3, floorHeight: 0.1 }
 ],
 floor: {
 rooms: []
 },
 walls: [],
 openings: [],
 items: [
 {
 id: 'test_chair_1',
 type: 'chair',
 name: 'Legacy-Chair-Name', // Outdated name
 floorId: 'ground',
 x: 1,
 z: 1
 }
 ]
 };

 // 3. Initialize FloorplanDocument
 const doc = new FloorplanDocument(mockOldFloorplan);
 const normalized = doc.floorplan;

 // 4. Verify item name was updated
 const item = normalized.items.find(i => i.id === 'test_chair_1');
 assert.ok(item, 'Furniture item must exist in normalized floorplan');
 assert.equal(item.name, chairDef.name, ` name should be updated to latest definition name "${chairDef.name}"`);
});
