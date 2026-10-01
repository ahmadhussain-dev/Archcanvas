import assert from 'node:assert';
import { test } from 'node:test';
import { getRoofGeometryData, getRoofFramePaths } from '../src/geometry/roofGeometry.js';
import { getRoofFramePaths as getRoofFramePathsFromApi } from '../src/api/index.js';

test('all roof subtypes generate a 0.1m-thick overhanging eave as roof geometry', () => {
 for (const subtype of ['gable', 'shed', 'arch', 'dome', 'trapezoid', 'hip', 'flat']) {
 const geometry = getRoofGeometryData(subtype, 6, 5, 2, 0, { eaveOverhang: 0.4 });
 assert.ok(geometry.eaveIndices.length > 0, `${subtype} should generate eave triangles`);
 assert.equal(geometry.positions.some(Number.isNaN), false);

 const eaveVertices = [...new Set(geometry.eaveIndices)];
 const hasThicknessPair = eaveVertices.some((a, index) => {
 const ao = a * 3;
 return eaveVertices.slice(index + 1).some((b) => {
 const bo = b * 3;
 return Math.abs(geometry.positions[ao] - geometry.positions[bo]) < 1e-6
 && Math.abs(geometry.positions[ao + 2] - geometry.positions[bo + 2]) < 1e-6
 && Math.abs(Math.abs(geometry.positions[ao + 1] - geometry.positions[bo + 1]) - 0.1) < 1e-6;
 });
 });
 assert.equal(hasThicknessPair, true, `${subtype} eave should have fixed 0.1m thickness`);
 }

 const withoutEave = getRoofGeometryData('gable', 6, 5, 2);
 assert.deepEqual(withoutEave.eaveIndices, []);
});

test('getRoofFramePaths Export', () => {
 assert.strictEqual(typeof getRoofFramePathsFromApi, 'function');
 assert.strictEqual(getRoofFramePathsFromApi, getRoofFramePaths);
});

test('getRoofFramePaths - (arch) 1m ', () => {
 const width = 4;
 const depth = 3;
 const height = 2;
 const paths = getRoofFramePaths('arch', width, depth, height, 0, 1.0);

 assert.ok(Array.isArray(paths));
 assert.ok(paths.length > 0);

 paths.forEach((path) => {
 assert.ok(Array.isArray(path));
 assert.ok(path.length >= 2);
 path.forEach((pt) => {
 assert.strictEqual(typeof pt.x, 'number');
 assert.strictEqual(typeof pt.y, 'number');
 assert.strictEqual(typeof pt.z, 'number');
 assert.strictEqual(Number.isNaN(pt.x), false);
 assert.strictEqual(Number.isNaN(pt.y), false);
 assert.strictEqual(Number.isNaN(pt.z), false);
 });
 });
});

test('getRoofFramePaths - (dome) 1m ', () => {
 const width = 4;
 const depth = 4;
 const height = 2;
 const paths = getRoofFramePaths('dome', width, depth, height, 0, 1.0);

 assert.ok(Array.isArray(paths));
 assert.ok(paths.length > 0);

 paths.forEach((path) => {
 assert.ok(Array.isArray(path));
 assert.ok(path.length >= 2);
 path.forEach((pt) => {
 assert.strictEqual(Number.isNaN(pt.x), false);
 assert.strictEqual(Number.isNaN(pt.y), false);
 assert.strictEqual(Number.isNaN(pt.z), false);
 });
 });
});

test('getRoofFramePaths - 7 subtype (gable, shed, arch, dome, trapezoid, hip, flat)', () => {
 const subtypes = ['gable', 'shed', 'arch', 'dome', 'trapezoid', 'hip', 'flat'];
 subtypes.forEach((subtype) => {
 const paths = getRoofFramePaths(subtype, 5, 4, 2.5, 0, 1.0);
 assert.ok(Array.isArray(paths), ` ${subtype} `);
 assert.ok(paths.length > 0, ` ${subtype} `);
 });
});

test('getRoofFramePaths - includeSide ', () => {
 const withSide = getRoofFramePaths('arch', 4, 4, 2, 0, 1.0, true);
 const withoutSide = getRoofFramePaths('arch', 4, 4, 2, 0, 1.0, false);
 assert.ok(withSide.length > withoutSide.length, ' includeSide ');
});

test('getRoofFramePaths - Diamond (hip) (trapezoid) ', () => {
 const hipPaths = getRoofFramePaths('hip', 6, 6, 3, 0, 1.0);
 const trapezoidPaths = getRoofFramePaths('trapezoid', 6, 6, 3, 0, 1.0);

 const hipYValues = hipPaths.flat().map((pt) => pt.y);
 const trapezoidYValues = trapezoidPaths.flat().map((pt) => pt.y);

 assert.ok(hipYValues.some((y) => y === 0), 'Diamond y=0 ');
 assert.ok(hipYValues.some((y) => y > 0 && y < 3), 'Diamond y ');

 assert.ok(trapezoidYValues.some((y) => y === 0), ' y=0 ');
 assert.ok(trapezoidYValues.some((y) => y > 0 && y < 3), ' y ');
});

test('getRoofFramePaths - (dome) y=0 ', () => {
 const domePaths = getRoofFramePaths('dome', 4, 4, 2, 0, 1.0);
 const bottomRing = domePaths.find((path) => path.every((pt) => Math.abs(pt.y) < 1e-4));
 assert.ok(bottomRing, ' y=0 ');
});

test('getRoofFramePaths - (shed) Square ', () => {
 const shedSidePaths = getRoofFramePaths('shed', 6, 4, 2, 0, 1.0, true);
 const highSidePillar = shedSidePaths.find((path) =>
 path.length === 2 &&
 Math.abs(path[0].x - 3) < 1e-4 &&
 Math.abs(path[1].x - 3) < 1e-4 &&
 Math.abs(path[0].y - 0) < 1e-4 &&
 Math.abs(path[1].y - 2) < 1e-4
 );
 assert.ok(highSidePillar, ' Square ');
});

test('getRoofFramePaths - (trapezoid) Diamond (hip) 1m ', () => {
 const hipPaths = getRoofFramePaths('hip', 6, 6, 3, 0, 1.0);
 const trapezoidPaths = getRoofFramePaths('trapezoid', 6, 6, 3, 0, 1.0);

 assert.ok(hipPaths.length > 10, 'Diamond ');
 assert.ok(trapezoidPaths.length > 10, ' ');
});

test('getRoofFramePaths & getRoofGeometryData - Custom topWidth topDepth', () => {
 const customOptions = { topWidth: 4.0, topDepth: 3.0 };
 const geoData = getRoofGeometryData('trapezoid', 8, 6, 3, 0, customOptions);
 const framePaths = getRoofFramePaths('trapezoid', 8, 6, 3, 0, 1.0, true, customOptions);

 assert.ok(geoData.positions.length > 0, ' Custom positions');
 assert.ok(framePaths.length > 0, ' Custom ');
 const topYPaths = framePaths.flat().filter((pt) => Math.abs(pt.y - 3.0) < 1e-4);
 const maxTopX = Math.max(...topYPaths.map((pt) => Math.abs(pt.x)));
 assert.ok(Math.abs(maxTopX - 2.0) < 0.1, ' x topWidth = 4.0');
});

