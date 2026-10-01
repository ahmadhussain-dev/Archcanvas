import { test } from 'node:test';
import assert from 'node:assert/strict';

test('V4-03: / Delete ', () => {
 const menus = [
 { id: 'rotate', label: 'Rotate', color: 'default' },
 { id: 'duplicate', label: 'Duplicate', color: 'default' },
 { id: 'delete', label: 'Delete', color: 'danger' }
 ];

 const deleteItem = menus.find(i => i.id === 'delete');
 assert.ok(deleteItem);
 assert.equal(deleteItem.color, 'danger');
});
