const WINDING_EPSILON = 1e-7;

function triangleNeedsOutwardFlip(positions, a, b, c, surface) {
  const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
  const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
  const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  if (surface === 'top') return ny < -WINDING_EPSILON;
  if (surface === 'bottom') return ny > WINDING_EPSILON;

  const centerX = (ax + bx + cx) / 3;
  const centerZ = (az + bz + cz) / 3;
  const horizontalDirection = nx * centerX + nz * centerZ;
  if (Math.abs(horizontalDirection) > WINDING_EPSILON) return horizontalDirection < 0;
  return ny < -WINDING_EPSILON;
}

function orientSurfaceTriangles(positions, indices, surface) {
  for (let i = 0; i < indices.length; i += 3) {
    if (triangleNeedsOutwardFlip(
      positions,
      indices[i],
      indices[i + 1],
      indices[i + 2],
      surface
    )) {
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    }
  }
}

function normalizeRoofGeometryWinding(geometry) {
  orientSurfaceTriangles(geometry.positions, geometry.topIndices || [], 'top');
  orientSurfaceTriangles(geometry.positions, geometry.sideIndices || [], 'side');
  orientSurfaceTriangles(geometry.positions, geometry.bottomIndices || [], 'bottom');
  return geometry;
}

function boundaryLoops(indices) {
  const edges = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = [indices[i], indices[i + 1], indices[i + 2]];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j];
      const b = triangle[(j + 1) % 3];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const entry = edges.get(key);
      if (entry) entry.count += 1;
      else edges.set(key, { a, b, count: 1 });
    }
  }

  const adjacency = new Map();
  for (const edge of edges.values()) {
    if (edge.count !== 1) continue;
    if (!adjacency.has(edge.a)) adjacency.set(edge.a, []);
    if (!adjacency.has(edge.b)) adjacency.set(edge.b, []);
    adjacency.get(edge.a).push(edge.b);
    adjacency.get(edge.b).push(edge.a);
  }

  const loops = [];
  const visitedEdges = new Set();
  for (const [start, neighbors] of adjacency) {
    for (const first of neighbors) {
      const firstKey = start < first ? `${start}:${first}` : `${first}:${start}`;
      if (visitedEdges.has(firstKey)) continue;
      const loop = [start];
      let previous = start;
      let current = first;
      while (current !== start && loop.length <= adjacency.size + 1) {
        loop.push(current);
        const candidates = adjacency.get(current) || [];
        const next = candidates.find((candidate) => {
          if (candidate === previous) return false;
          const key = current < candidate ? `${current}:${candidate}` : `${candidate}:${current}`;
          return !visitedEdges.has(key);
        }) ?? candidates.find((candidate) => candidate !== previous);
        const edgeKey = previous < current ? `${previous}:${current}` : `${current}:${previous}`;
        visitedEdges.add(edgeKey);
        if (next === undefined) break;
        previous = current;
        current = next;
      }
      if (current === start && loop.length >= 3) {
        const closingKey = previous < start ? `${previous}:${start}` : `${start}:${previous}`;
        visitedEdges.add(closingKey);
        loops.push(loop);
      }
    }
  }
  return loops;
}

function projectedLoopArea(positions, loop) {
  let area = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i] * 3;
    const b = loop[(i + 1) % loop.length] * 3;
    area += positions[a] * positions[b + 2] - positions[b] * positions[a + 2];
  }
  return area / 2;
}

function buildRoofEave(positions, topIndices, overhang, thickness = 0.1, subtype = '') {
  if (!(overhang > WINDING_EPSILON) || topIndices.length < 3) return [];
  const loops = subtype === 'dome'
    ? [Array.from({ length: 16 }, (_, index) => index)]
    : boundaryLoops(topIndices);
  if (!loops.length) return [];
  const loop = loops.reduce((largest, candidate) => (
    Math.abs(projectedLoopArea(positions, candidate))
      > Math.abs(projectedLoopArea(positions, largest))
      ? candidate
      : largest
  ));
  const area = projectedLoopArea(positions, loop);
  const orientation = area >= 0 ? 1 : -1;
  const incidentTriangles = new Map();
  for (let i = 0; i < topIndices.length; i += 3) {
    const triangle = topIndices.slice(i, i + 3);
    for (const vertex of triangle) {
      if (!incidentTriangles.has(vertex)) incidentTriangles.set(vertex, []);
      incidentTriangles.get(vertex).push(triangle);
    }
  }

  const outer = loop.map((vertexIndex, i) => {
    const previousIndex = loop[(i - 1 + loop.length) % loop.length];
    const nextIndex = loop[(i + 1) % loop.length];
    const offset = vertexIndex * 3;
    const previousOffset = previousIndex * 3;
    const nextOffset = nextIndex * 3;
    const x = positions[offset];
    const y = positions[offset + 1];
    const z = positions[offset + 2];
    const prevDx = x - positions[previousOffset];
    const prevDz = z - positions[previousOffset + 2];
    const nextDx = positions[nextOffset] - x;
    const nextDz = positions[nextOffset + 2] - z;
    const prevLength = Math.hypot(prevDx, prevDz) || 1;
    const nextLength = Math.hypot(nextDx, nextDz) || 1;
    const prevNormal = orientation > 0
      ? { x: prevDz / prevLength, z: -prevDx / prevLength }
      : { x: -prevDz / prevLength, z: prevDx / prevLength };
    const nextNormal = orientation > 0
      ? { x: nextDz / nextLength, z: -nextDx / nextLength }
      : { x: -nextDz / nextLength, z: nextDx / nextLength };
    let mx = prevNormal.x + nextNormal.x;
    let mz = prevNormal.z + nextNormal.z;
    const miterLength = Math.hypot(mx, mz);
    if (miterLength < WINDING_EPSILON) {
      mx = nextNormal.x;
      mz = nextNormal.z;
    } else {
      mx /= miterLength;
      mz /= miterLength;
    }
    const denominator = Math.max(0.25, Math.abs(mx * nextNormal.x + mz * nextNormal.z));
    const distance = Math.min(overhang / denominator, overhang * 4);
    const outerX = x + mx * distance;
    const outerZ = z + mz * distance;
    const heights = [];
    for (const triangle of incidentTriangles.get(vertexIndex) || []) {
      const a = triangle[0] * 3;
      const b = triangle[1] * 3;
      const c = triangle[2] * 3;
      const abx = positions[b] - positions[a];
      const aby = positions[b + 1] - positions[a + 1];
      const abz = positions[b + 2] - positions[a + 2];
      const acx = positions[c] - positions[a];
      const acy = positions[c + 1] - positions[a + 1];
      const acz = positions[c + 2] - positions[a + 2];
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      if (Math.abs(ny) < 1e-4) continue;
      heights.push(y - (nx * (outerX - x) + nz * (outerZ - z)) / ny);
    }
    const predictedY = heights.length
      ? heights.reduce((sum, value) => sum + value, 0) / heights.length
      : y;
    const maxDelta = Math.max(0.1, overhang);
    return {
      x: outerX,
      y: Math.max(y - maxDelta, Math.min(y + maxDelta, predictedY)),
      z: outerZ
    };
  });

  const outerTop = [];
  const innerBottom = [];
  const outerBottom = [];
  for (let i = 0; i < loop.length; i++) {
    outerTop.push(positions.length / 3);
    positions.push(outer[i].x, outer[i].y, outer[i].z);
    const innerOffset = loop[i] * 3;
    innerBottom.push(positions.length / 3);
    positions.push(
      positions[innerOffset],
      positions[innerOffset + 1] - thickness,
      positions[innerOffset + 2]
    );
    outerBottom.push(positions.length / 3);
    positions.push(outer[i].x, outer[i].y - thickness, outer[i].z);
  }

  const eaveIndices = [];
  const pushOriented = (a, b, c, surface, invertSide = false) => {
    const triangle = [a, b, c];
    if (surface === 'side' && invertSide) {
      if (!triangleNeedsOutwardFlip(positions, a, b, c, 'side')) {
        [triangle[1], triangle[2]] = [triangle[2], triangle[1]];
      }
    } else if (triangleNeedsOutwardFlip(positions, a, b, c, surface)) {
      [triangle[1], triangle[2]] = [triangle[2], triangle[1]];
    }
    eaveIndices.push(...triangle);
  };

  for (let i = 0; i < loop.length; i++) {
    const next = (i + 1) % loop.length;
    pushOriented(loop[i], loop[next], outerTop[next], 'top');
    pushOriented(loop[i], outerTop[next], outerTop[i], 'top');
    pushOriented(innerBottom[i], outerBottom[next], innerBottom[next], 'bottom');
    pushOriented(innerBottom[i], outerBottom[i], outerBottom[next], 'bottom');
    pushOriented(outerTop[i], outerTop[next], outerBottom[next], 'side');
    pushOriented(outerTop[i], outerBottom[next], outerBottom[i], 'side');
    pushOriented(loop[i], innerBottom[next], loop[next], 'side', true);
    pushOriented(loop[i], innerBottom[i], innerBottom[next], 'side', true);
  }
  return eaveIndices;
}

/**
 *  ，  3D   (positions)   (indices)
 * @param {string} subtype   ('gable' | 'shed' | 'arch' | 'dome' | 'trapezoid' | 'hip' | 'flat')
 * @param {number} width  
 * @param {number} depth  
 * @param {number} height  
 * @returns {{positions: number[], topIndices: number[], sideIndices: number[]}}
 */
export function getRoofGeometryData(subtype, width, depth, height, curve = 0, options = {}) {
  let positions = [];
  let topIndices = [];
  let sideIndices = [];
  let bottomIndices = [];

  if (subtype === 'gable') {
    // 1.   ( ，  curve  )
    const segments = 16;
    const n = 2 * segments + 1;
    
    //   (z = -depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 1) * width / 2;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = t * width / 2;
      const y = (1 - t) * height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    
    //   (z = depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 1) * width / 2;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = t * width / 2;
      const y = (1 - t) * height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    
    //   (  CCW)
    for (let i = 0; i < n - 1; i++) {
      topIndices.push(i, i + 1, i + n);
      topIndices.push(i + 1, i + n + 1, i + n);
    }
    
    //  
    positions.push(0, 0, -depth / 2); //   2 * n
    positions.push(0, 0, depth / 2);  //   2 * n + 1
    
    //  
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(2 * n, i + 1, i);          //   (  CCW)
      sideIndices.push(2 * n + 1, i + n, i + n + 1); //   (  CCW)
    }
    
    //  
    bottomIndices = [n - 1, 0, n, n - 1, n, 2 * n - 1];
  } else if (subtype === 'shed') {
    // 2.   ( ，  curve  )
    const segments = 16;
    const n = segments + 1;
    
    //   (z = -depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    
    //   (z = depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    
    //  
    for (let i = 0; i < n - 1; i++) {
      topIndices.push(i, i + 1, i + n);
      topIndices.push(i + 1, i + n + 1, i + n);
    }
    
    //   ( )
    positions.push(width / 2, 0, -depth / 2); //   2 * n
    positions.push(width / 2, 0, depth / 2);  //   2 * n + 1
    
    const A = 2 * n;
    const B = 2 * n + 1;
    
    //   (  A  )
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(A, i + 1, i);
    }
    
    //   (  B  )
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(B, i + n, i + n + 1);
    }
    
    //  
    sideIndices.push(A, n - 1, 2 * n - 1);
    sideIndices.push(A, 2 * n - 1, B);
    
    //  
    bottomIndices = [A, 0, n, A, n, B];
  } else if (subtype === 'arch') {
    // 3.   (  effectiveHeight = max(0.05, height + curve)  Semicircle/ )
    const effectiveHeight = Math.max(0.05, height + curve);
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = effectiveHeight * Math.cos(alpha);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = effectiveHeight * Math.cos(alpha);
      positions.push(x, y, depth / 2);
    }
    
    for (let i = 0; i < segments; i++) {
      topIndices.push(i, i + 1, i + 18);
      topIndices.push(i, i + 18, i + 17);
    }
    
    bottomIndices = [16, 0, 17, 16, 17, 33];
    
    positions.push(0, 0, -depth / 2); // 34
    for (let i = 0; i < segments; i++) {
      sideIndices.push(34, i + 1, i);
    }
    positions.push(0, 0, depth / 2); // 35
    for (let i = 0; i < segments; i++) {
      sideIndices.push(35, i + 17, i + 18);
    }
  } else if (subtype === 'dome') {
    // 4.   ( ，  curve  )
    const latSegments = 8;
    const lonSegments = 16;
    
    for (let lat = 0; lat <= latSegments; lat++) {
      const theta = (lat / latSegments) * (Math.PI / 2);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const t = lat / latSegments;
      
      for (let lon = 0; lon <= lonSegments; lon++) {
        const phi = (lon / lonSegments) * 2 * Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        const x = (width / 2) * cosTheta * cosPhi;
        const y = height * sinTheta + curve * 4 * t * (1 - t);
        const z = (depth / 2) * cosTheta * sinPhi;
        positions.push(x, y, z);
      }
    }
    
    const stride = lonSegments + 1;
    for (let lat = 0; lat < latSegments; lat++) {
      for (let lon = 0; lon < lonSegments; lon++) {
        const first = lat * stride + lon;
        const second = first + stride;
        
        topIndices.push(first, first + 1, second + 1);
        topIndices.push(first, second + 1, second);
      }
    }
    
    const centerIndex = positions.length / 3;
    positions.push(0, 0, 0);
    
    for (let lon = 0; lon < lonSegments; lon++) {
      bottomIndices.push(centerIndex, lon, lon + 1);
    }
    sideIndices = [];
  } else if (subtype === 'trapezoid') {
    // 5.   ( ，  topWidth / topDepth   curve  )
    const tw = (options.topWidth !== undefined ? Math.min(width - 0.1, Math.max(0.1, options.topWidth)) : width * 0.5) / 2;
    const td = (options.topDepth !== undefined ? Math.min(depth - 0.1, Math.max(0.1, options.topDepth)) : depth * 0.5) / 2;
    const layers = 16;
    
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height;
      const w = (width / 2) * (1 - t) + tw * t + curve * 4 * t * (1 - t);
      const d = (depth / 2) * (1 - t) + td * t + curve * 4 * t * (1 - t);
      
      positions.push(-w, y, -d);
      positions.push(w, y, -d);
      positions.push(w, y, d);
      positions.push(-w, y, d);
    }
    
    for (let j = 0; j < layers; j++) {
      const p0 = 4 * j, p1 = p0 + 1, p2 = p0 + 2, p3 = p0 + 3;
      const q0 = p0 + 4, q1 = p0 + 5, q2 = p0 + 6, q3 = p0 + 7;
      
      topIndices.push(p0, p1, q1, p0, q1, q0);
      topIndices.push(p1, p2, q2, p1, q2, q1);
      topIndices.push(p2, p3, q3, p2, q3, q2);
      topIndices.push(p3, p0, q0, p3, q0, q3);
    }
    
    const topOffset = 4 * layers;
    sideIndices.push(topOffset, topOffset + 1, topOffset + 2, topOffset, topOffset + 2, topOffset + 3);
    bottomIndices = [1, 0, 3, 1, 3, 2];
  } else if (subtype === 'hip') {
    // 6. Diamond  (  curve  )
    const layers = 16;
    
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height + curve * 4 * t * (1 - t);
      
      if (width >= depth) {
        const d = (depth / 2) * (1 - t);
        const xLeft = -width / 2 + t * (depth / 2);
        const xRight = width / 2 - t * (depth / 2);
        positions.push(xLeft, y, -d);
        positions.push(xRight, y, -d);
        positions.push(xRight, y, d);
        positions.push(xLeft, y, d);
      } else {
        const w = (width / 2) * (1 - t);
        const zFront = -depth / 2 + t * (width / 2);
        const zBack = depth / 2 - t * (width / 2);
        positions.push(-w, y, zFront);
        positions.push(w, y, zFront);
        positions.push(w, y, zBack);
        positions.push(-w, y, zBack);
      }
    }
    
    for (let j = 0; j < layers; j++) {
      const p0 = 4 * j, p1 = p0 + 1, p2 = p0 + 2, p3 = p0 + 3;
      const q0 = p0 + 4, q1 = p0 + 5, q2 = p0 + 6, q3 = p0 + 7;
      
      topIndices.push(p0, p1, q1, p0, q1, q0);
      topIndices.push(p1, p2, q2, p1, q2, q1);
      topIndices.push(p2, p3, q3, p2, q3, q2);
      topIndices.push(p3, p0, q0, p3, q0, q3);
    }
    
    bottomIndices = [1, 0, 3, 1, 3, 2];
    sideIndices = [];
  } else if (subtype === 'flat') {
    // 7.   (  X  )
    const segments = 16;
    const n = segments + 1;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      positions.push(x, 0, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      positions.push(x, 0, depth / 2);
    }
    
    for (let i = 0; i < n - 1; i++) {
      topIndices.push(i, i + 1, i + n);
      topIndices.push(i + 1, i + n + 1, i + n);
    }
    
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(i, i + 2 * n + 1, i + 1);
      sideIndices.push(i, i + 2 * n, i + 2 * n + 1);
    }
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(i + n, i + 1 + n, i + 3 * n + 1);
      sideIndices.push(i + n, i + 3 * n + 1, i + 3 * n);
    }
    sideIndices.push(0, n, 3 * n);
    sideIndices.push(0, 3 * n, 2 * n);
    sideIndices.push(n - 1, 3 * n - 1, 4 * n - 1);
    sideIndices.push(n - 1, 4 * n - 1, 2 * n - 1);
    
    for (let i = 0; i < n - 1; i++) {
      bottomIndices.push(i + 2 * n + 1, i + 2 * n, i + 3 * n);
      bottomIndices.push(i + 2 * n + 1, i + 3 * n, i + 3 * n + 1);
    }
  }

  const geometry = normalizeRoofGeometryWinding({ positions, topIndices, sideIndices, bottomIndices });
  geometry.eaveIndices = buildRoofEave(
    geometry.positions,
    geometry.topIndices,
    Math.max(0, Number(options.eaveOverhang || 0)),
    0.1,
    subtype
  );
  return geometry;
}

/**
 *  ，  targetGridSize (  1.0m)   (Polyline paths)
 * @param {string} subtype   ('gable' | 'shed' | 'arch' | 'dome' | 'trapezoid' | 'hip' | 'flat')
 * @param {number} width  
 * @param {number} depth  
 * @param {number} height  
 * @param {number} [curve=0]  
 * @param {number} [targetGridSize=1.0]  （ ： ）
 * @returns {Array<Array<{x: number, y: number, z: number}>>}  
 */
export function getRoofFramePaths(subtype, width, depth, height, curve = 0, targetGridSize = 1.0, includeSide = true, options = {}) {
  const step = Math.max(0.2, targetGridSize);
  const paths = [];

  if (subtype === 'arch') {
    // 1.   (Arch):   effectiveHeight  
    const effectiveHeight = Math.max(0.05, height + curve);
    const rx = width / 2;
    const arcLen = Math.PI * Math.sqrt((rx * rx + effectiveHeight * effectiveHeight) / 2);
    const arcSegments = Math.max(2, Math.round(arcLen / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    // A.   Z   (Ribs)
    for (let j = 0; j <= depthSegments; j++) {
      const tz = j / depthSegments;
      const z = -depth / 2 + tz * depth;
      const ribPath = [];
      for (let i = 0; i <= arcSegments * 2; i++) {
        const t = i / (arcSegments * 2);
        const alpha = -Math.PI / 2 + t * Math.PI;
        const x = rx * Math.sin(alpha);
        const y = effectiveHeight * Math.cos(alpha);
        ribPath.push({ x, y, z });
      }
      paths.push(ribPath);
    }

    // B.   (Purlins)
    for (let i = 0; i <= arcSegments; i++) {
      const t = i / arcSegments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = rx * Math.sin(alpha);
      const y = effectiveHeight * Math.cos(alpha);
      paths.push([
        { x, y, z: -depth / 2 },
        { x, y, z: depth / 2 }
      ]);
    }

    // C.   (1m   + 100%  )
    if (includeSide) {
      const zPositions = [-depth / 2, depth / 2];
      const minRadius = Math.min(rx, effectiveHeight);
      const numInnerRings = Math.max(2, Math.round(minRadius / step));
      const ratios = [];
      for (let r = 1; r < numInnerRings; r++) {
        ratios.push(r / numInnerRings);
      }

      //   ( -60°, -30°, 0°, 30°, 60° )
      const spokeAngles = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];

      zPositions.forEach((z) => {
        // 1.  
        paths.push([
          { x: -rx, y: 0, z },
          { x: rx, y: 0, z }
        ]);

        // 2. 1m  Semicircle 
        const innerSegments = 16;
        ratios.forEach((ratio) => {
          const archPath = [];
          for (let i = 0; i <= innerSegments; i++) {
            const tInner = i / innerSegments;
            const theta = -Math.PI / 2 + tInner * Math.PI;
            const xi = rx * ratio * Math.sin(theta);
            const yi = effectiveHeight * ratio * Math.cos(theta);
            archPath.push({ x: xi, y: yi, z });
          }
          paths.push(archPath);
        });

        // 3.   (Sunburst Spokes)：  ( / )
        const ringRatios = [...ratios, 1];
        spokeAngles.forEach((alpha) => {
          const outerX = rx * Math.sin(alpha);
          const outerY = effectiveHeight * Math.cos(alpha);

          for (let r = 0; r < ringRatios.length - 1; r++) {
            const rCurrent = ringRatios[r];
            const rNext = ringRatios[r + 1];

            const x1 = outerX * rCurrent;
            const y1 = outerY * rCurrent;
            const x2 = outerX * rNext;
            const y2 = outerY * rNext;

            paths.push([
              { x: x1, y: y1, z },
              { x: x2, y: y2, z }
            ]);
          }
        });
      });
    }
  } else if (subtype === 'dome') {
    // 2.   (Dome):   +   (  lat = 0  )
    const rx = width / 2;
    const rz = depth / 2;
    const approxEquator = Math.PI * (rx + rz);
    const lonSegments = Math.max(4, Math.round(approxEquator / step));
    const approxMeridian = (Math.PI / 2) * Math.sqrt((((rx + rz) / 2) ** 2 + height ** 2) / 2);
    const latSegments = Math.max(2, Math.round(approxMeridian / step));

    // A.   (Latitudes，  lat = 0  )
    for (let lat = 0; lat <= latSegments; lat++) {
      const tLat = lat / latSegments;
      const theta = tLat * (Math.PI / 2);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const y = height * sinTheta + curve * 4 * tLat * (1 - tLat);

      const ringPath = [];
      const numPoints = lonSegments * 2;
      for (let i = 0; i <= numPoints; i++) {
        const phi = (i / numPoints) * 2 * Math.PI;
        const x = rx * cosTheta * Math.cos(phi);
        const z = rz * cosTheta * Math.sin(phi);
        ringPath.push({ x, y, z });
      }
      paths.push(ringPath);
    }

    // B.   (Longitudes)
    for (let lon = 0; lon < lonSegments; lon++) {
      const phi = (lon / lonSegments) * 2 * Math.PI;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const meridianPath = [];
      const numPts = latSegments * 2;
      for (let lat = 0; lat <= numPts; lat++) {
        const tLat = lat / numPts;
        const theta = tLat * (Math.PI / 2);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const x = rx * cosTheta * cosPhi;
        const y = height * sinTheta + curve * 4 * tLat * (1 - tLat);
        const z = rz * cosTheta * sinPhi;
        meridianPath.push({ x, y, z });
      }
      paths.push(meridianPath);
    }
  } else if (subtype === 'gable') {
    // 3.   (Gable):  、  curve  
    const slopeLen = Math.sqrt((width / 2) ** 2 + height ** 2);
    const slopeSegments = Math.max(1, Math.round(slopeLen / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    // A.   (Rafters)
    for (let j = 0; j <= depthSegments; j++) {
      const z = -depth / 2 + (j / depthSegments) * depth;
      const rafterPath = [];
      for (let i = 0; i <= slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = (t - 1) * (width / 2);
        const y = t * height + curve * 4 * t * (1 - t);
        rafterPath.push({ x, y, z });
      }
      for (let i = 1; i <= slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = t * (width / 2);
        const y = (1 - t) * height + curve * 4 * t * (1 - t);
        rafterPath.push({ x, y, z });
      }
      paths.push(rafterPath);
    }

    // B.   (Purlins)
    for (let i = 0; i <= slopeSegments; i++) {
      const t = i / slopeSegments;
      const xLeft = (t - 1) * (width / 2);
      const yLeft = t * height + curve * 4 * t * (1 - t);
      paths.push([
        { x: xLeft, y: yLeft, z: -depth / 2 },
        { x: xLeft, y: yLeft, z: depth / 2 }
      ]);
      if (i > 0) {
        const xRight = t * (width / 2);
        const yRight = (1 - t) * height + curve * 4 * t * (1 - t);
        paths.push([
          { x: xRight, y: yRight, z: -depth / 2 },
          { x: xRight, y: yRight, z: depth / 2 }
        ]);
      }
    }

    // C.   (  sideHidden  )
    if (includeSide) {
      // 1.  
      paths.push([
        { x: -width / 2, y: 0, z: -depth / 2 },
        { x: width / 2, y: 0, z: -depth / 2 }
      ]);
      paths.push([
        { x: -width / 2, y: 0, z: depth / 2 },
        { x: width / 2, y: 0, z: depth / 2 }
      ]);
      // 2. 1m   (  curve)
      const xSegs = Math.max(1, Math.round(width / step));
      for (let i = 1; i < xSegs; i++) {
        const tx = i / xSegs;
        const x = -width / 2 + tx * width;
        let y = 0;
        if (x <= 0) {
          const t = 1 + x / (width / 2);
          y = t * height + curve * 4 * t * (1 - t);
        } else {
          const t = x / (width / 2);
          y = (1 - t) * height + curve * 4 * t * (1 - t);
        }
        paths.push([{ x, y: 0, z: -depth / 2 }, { x, y, z: -depth / 2 }]);
        paths.push([{ x, y: 0, z: depth / 2 }, { x, y, z: depth / 2 }]);
      }
    }
  } else if (subtype === 'shed') {
    // 4.   (Shed)
    const slopeLen = Math.sqrt(width ** 2 + height ** 2);
    const slopeSegments = Math.max(1, Math.round(slopeLen / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    // A.  
    for (let j = 0; j <= depthSegments; j++) {
      const z = -depth / 2 + (j / depthSegments) * depth;
      const rafterPath = [];
      for (let i = 0; i <= slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = -width / 2 + t * width;
        const y = t * height + curve * 4 * t * (1 - t);
        rafterPath.push({ x, y, z });
      }
      paths.push(rafterPath);
    }

    for (let i = 0; i <= slopeSegments; i++) {
      const t = i / slopeSegments;
      const x = -width / 2 + t * width;
      const y = t * height + curve * 4 * t * (1 - t);
      paths.push([
        { x, y, z: -depth / 2 },
        { x, y, z: depth / 2 }
      ]);
    }

    //  /  ( )
    paths.push([
      { x: -width / 2, y: 0, z: -depth / 2 },
      { x: -width / 2, y: 0, z: depth / 2 }
    ]);
    paths.push([
      { x: width / 2, y: height, z: -depth / 2 },
      { x: width / 2, y: height, z: depth / 2 }
    ]);

    // B.  / Square 
    if (includeSide) {
      // 1.   (x = width / 2, y = 0)
      paths.push([
        { x: width / 2, y: 0, z: -depth / 2 },
        { x: width / 2, y: 0, z: depth / 2 }
      ]);
      // 2.  Square  1m  
      for (let j = 0; j <= depthSegments; j++) {
        const z = -depth / 2 + (j / depthSegments) * depth;
        paths.push([
          { x: width / 2, y: 0, z },
          { x: width / 2, y: height, z }
        ]);
      }
      // 4.  
      paths.push([
        { x: -width / 2, y: 0, z: -depth / 2 },
        { x: width / 2, y: 0, z: -depth / 2 }
      ]);
      paths.push([
        { x: -width / 2, y: 0, z: depth / 2 },
        { x: width / 2, y: 0, z: depth / 2 }
      ]);

      for (let i = 1; i < slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = -width / 2 + t * width;
        const y = t * height + curve * 4 * t * (1 - t);
        paths.push([{ x, y: 0, z: -depth / 2 }, { x, y, z: -depth / 2 }]);
        paths.push([{ x, y: 0, z: depth / 2 }, { x, y, z: depth / 2 }]);
      }
    }
  } else if (subtype === 'trapezoid') {
    // 5.   (Trapezoid):  ，  curve  
    const tw = (options.topWidth !== undefined ? Math.min(width - 0.1, Math.max(0.1, options.topWidth)) : width * 0.5) / 2;
    const td = (options.topDepth !== undefined ? Math.min(depth - 0.1, Math.max(0.1, options.topDepth)) : depth * 0.5) / 2;

    const layers = Math.max(4, Math.round(height / step) * 2);
    const cornerPaths = [[], [], [], []];

    // A.  First Floor  (  curve  )
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height + curve * 4 * t * (1 - t);
      const w = (width / 2) * (1 - t) + tw * t;
      const d = (depth / 2) * (1 - t) + td * t;

      const p0 = { x: -w, y, z: -d };
      const p1 = { x: w, y, z: -d };
      const p2 = { x: w, y, z: d };
      const p3 = { x: -w, y, z: d };

      //   step  
      if (j % Math.max(1, Math.round(layers / Math.max(1, Math.round(height / step)))) === 0 || j === layers) {
        paths.push([p0, p1, p2, p3, p0]);
      }

      cornerPaths[0].push(p0);
      cornerPaths[1].push(p1);
      cornerPaths[2].push(p2);
      cornerPaths[3].push(p3);
    }

    // B. Diamond 
    cornerPaths.forEach((cornerPath) => paths.push(cornerPath));

    // C.   (  X   1m  )
    const xSegs = Math.max(1, Math.round(width / step));
    for (let i = 1; i < xSegs; i++) {
      const xVal = -width / 2 + (i / xSegs) * width;
      const frontRafter = [];
      const backRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const w = (width / 2) * (1 - t) + tw * t;
        const d = (depth / 2) * (1 - t) + td * t;
        const y = t * height + curve * 4 * t * (1 - t);
        if (Math.abs(xVal) <= w + 1e-4) {
          frontRafter.push({ x: xVal, y, z: -d });
          backRafter.push({ x: xVal, y, z: d });
        }
      }
      if (frontRafter.length >= 2) paths.push(frontRafter);
      if (backRafter.length >= 2) paths.push(backRafter);
    }

    // D.   (  Z   1m  )
    const zSegs = Math.max(1, Math.round(depth / step));
    for (let k = 1; k < zSegs; k++) {
      const zVal = -depth / 2 + (k / zSegs) * depth;
      const leftRafter = [];
      const rightRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const w = (width / 2) * (1 - t) + tw * t;
        const d = (depth / 2) * (1 - t) + td * t;
        const y = t * height + curve * 4 * t * (1 - t);
        if (Math.abs(zVal) <= d + 1e-4) {
          leftRafter.push({ x: -w, y, z: zVal });
          rightRafter.push({ x: w, y, z: zVal });
        }
      }
      if (leftRafter.length >= 2) paths.push(leftRafter);
      if (rightRafter.length >= 2) paths.push(rightRafter);
    }

    // E.  
    const topXSegs = Math.max(1, Math.round((tw * 2) / step));
    const topDSegs = Math.max(1, Math.round((td * 2) / step));
    const topY = height;

    for (let i = 1; i < topXSegs; i++) {
      const tx = i / topXSegs;
      const x = -tw + tx * tw * 2;
      paths.push([
        { x, y: topY, z: -td },
        { x, y: topY, z: td }
      ]);
    }
    for (let j = 1; j < topDSegs; j++) {
      const tz = j / topDSegs;
      const z = -td + tz * td * 2;
      paths.push([
        { x: -tw, y: topY, z },
        { x: tw, y: topY, z }
      ]);
    }
  } else if (subtype === 'hip') {
    // 6. Diamond  (Hip):  ，  curve  
    const layers = Math.max(4, Math.round(height / step) * 2);
    const cornerPaths = [[], [], [], []];

    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height + curve * 4 * t * (1 - t);

      let p0, p1, p2, p3;
      if (width >= depth) {
        const d = (depth / 2) * (1 - t);
        const xLeft = -width / 2 + t * (depth / 2);
        const xRight = width / 2 - t * (depth / 2);
        p0 = { x: xLeft, y, z: -d };
        p1 = { x: xRight, y, z: -d };
        p2 = { x: xRight, y, z: d };
        p3 = { x: xLeft, y, z: d };
      } else {
        const w = (width / 2) * (1 - t);
        const zFront = -depth / 2 + t * (width / 2);
        const zBack = depth / 2 - t * (width / 2);
        p0 = { x: -w, y, z: zFront };
        p1 = { x: w, y, z: zFront };
        p2 = { x: w, y, z: zBack };
        p3 = { x: -w, y, z: zBack };
      }

      if (j % Math.max(1, Math.round(layers / Math.max(1, Math.round(height / step)))) === 0 || j === layers) {
        paths.push([p0, p1, p2, p3, p0]);
      }

      cornerPaths[0].push(p0);
      cornerPaths[1].push(p1);
      cornerPaths[2].push(p2);
      cornerPaths[3].push(p3);
    }

    // Diamond 
    cornerPaths.forEach((cornerPath) => paths.push(cornerPath));

    //   (  X   1m  )
    const xSegs = Math.max(1, Math.round(width / step));
    for (let i = 1; i < xSegs; i++) {
      const xVal = -width / 2 + (i / xSegs) * width;
      const frontRafter = [];
      const backRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const y = t * height + curve * 4 * t * (1 - t);
        if (width >= depth) {
          const d = (depth / 2) * (1 - t);
          const xLeft = -width / 2 + t * (depth / 2);
          const xRight = width / 2 - t * (depth / 2);
          if (xVal >= xLeft - 1e-4 && xVal <= xRight + 1e-4) {
            frontRafter.push({ x: xVal, y, z: -d });
            backRafter.push({ x: xVal, y, z: d });
          }
        } else {
          const w = (width / 2) * (1 - t);
          const zFront = -depth / 2 + t * (width / 2);
          const zBack = depth / 2 - t * (width / 2);
          if (Math.abs(xVal) <= w + 1e-4) {
            frontRafter.push({ x: xVal, y, z: zFront });
            backRafter.push({ x: xVal, y, z: zBack });
          }
        }
      }
      if (frontRafter.length >= 2) paths.push(frontRafter);
      if (backRafter.length >= 2) paths.push(backRafter);
    }

    //   (  Z   1m  )
    const zSegs = Math.max(1, Math.round(depth / step));
    for (let k = 1; k < zSegs; k++) {
      const zVal = -depth / 2 + (k / zSegs) * depth;
      const leftRafter = [];
      const rightRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const y = t * height + curve * 4 * t * (1 - t);
        if (width >= depth) {
          const d = (depth / 2) * (1 - t);
          const xLeft = -width / 2 + t * (depth / 2);
          const xRight = width / 2 - t * (depth / 2);
          if (Math.abs(zVal) <= d + 1e-4) {
            leftRafter.push({ x: xLeft, y, z: zVal });
            rightRafter.push({ x: xRight, y, z: zVal });
          }
        } else {
          const w = (width / 2) * (1 - t);
          const zFront = -depth / 2 + t * (width / 2);
          const zBack = depth / 2 - t * (width / 2);
          if (zVal >= zFront - 1e-4 && zVal <= zBack + 1e-4) {
            leftRafter.push({ x: -w, y, z: zVal });
            rightRafter.push({ x: w, y, z: zVal });
          }
        }
      }
      if (leftRafter.length >= 2) paths.push(leftRafter);
      if (rightRafter.length >= 2) paths.push(rightRafter);
    }
  } else {
    // 7.   (Flat)
    const xSegments = Math.max(1, Math.round(width / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    for (let i = 0; i <= xSegments; i++) {
      const t = i / xSegments;
      const x = -width / 2 + t * width;
      const y = height + curve * 4 * t * (1 - t);
      paths.push([
        { x, y, z: -depth / 2 },
        { x, y, z: depth / 2 }
      ]);
    }
    for (let j = 0; j <= depthSegments; j++) {
      const tz = j / depthSegments;
      const z = -depth / 2 + tz * depth;
      const pathLine = [];
      for (let i = 0; i <= xSegments; i++) {
        const t = i / xSegments;
        const x = -width / 2 + t * width;
        const y = height + curve * 4 * t * (1 - t);
        pathLine.push({ x, y, z });
      }
      paths.push(pathLine);
    }
  }

  return paths;
}
