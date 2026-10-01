import test from 'node:test';
import assert from 'node:assert/strict';
import { ceilingLight, chandelierLight, floorLampLight, deskLampLight } from '../../src/furniture/lighting.js';

test('Lighting : ', () => {
 const lights = [ceilingLight, chandelierLight, floorLampLight, deskLampLight];
 
 lights.forEach(lightDef => {
 assert.equal(lightDef.unit, 'm', `${lightDef.name} unit 'm'`);
 assert.ok(lightDef.lightSource, `${lightDef.name} lightSource`);
 
 // range 1m 10m （ 100~240 ）
 assert.ok(
 lightDef.lightSource.range >= 1.0 && lightDef.lightSource.range <= 10.0,
 `${lightDef.name} lightSource.range (${lightDef.lightSource.range}) 1m~10m `
 );

 // y 5 
 const offsetY = lightDef.lightSource.offset?.y ?? 0;
 assert.ok(
 Math.abs(offsetY) <= 5.0,
 `${lightDef.name} lightSource.offset.y (${offsetY}) -5m~5m `
 );
 });
});
