import { boxComponent, cylinderComponent, sphereComponent, latheComponent, coneComponent } from './_helpers.js';

// Photo 5 inspired miniature palette: warm, matte and deliberately low saturation.
export const SOFT_LOW_POLY_OUTDOOR_PALETTE = Object.freeze({
  warmWood: '#a77b55',
  darkWood: '#6f5846',
  cream: '#eadfcd',
  fabric: '#d9ccb8',
  sage: '#8fa184',
  metal: '#777a75',
  lightMetal: '#b9b8af',
  stone: '#b8afa2',
  paleStone: '#d8d0c3',
  darkStone: '#5e5c58',
  soil: '#675142',
  water: '#91c7c9',
  flower: '#d69aa5',
  charcoal: '#454743',
  terracotta: '#b87555',
  classicRed: '#bd3a3a',
  mahjongWood: '#5b342a',
  mahjongDarkWood: '#3f2825',
  mahjongFelt: '#126d59',
  plasticPink: '#ed315d',
  plasticHole: '#a9143c',
  tileIvory: '#f2eedc',
  tileRed: '#d64b52',
  tileGreen: '#36856d',
  tileBlue: '#405c9e'
});

const lieInteraction = (yRatio = 0.42, zRatio = 0) => ({
  type: 'lie',
  getInteractionPoints(size) {
    return [{ x: 0, y: size.height * yRatio, z: size.depth * zRatio, rot: 0 }];
  }
});

const addBikeTube = (registry, item, definition, componentId, start, end, thickness, parent, depth = thickness) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const startZ = start.z ?? 0;
  const endZ = end.z ?? 0;
  const length = Math.max(thickness, Math.hypot(dx, dy));

  return boxComponent(registry, item, definition, componentId, {
    width: length,
    height: thickness,
    depth
  }, {
    position: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
      z: (startZ + endZ) / 2
    },
    rotation: {
      z: Math.atan2(dy, dx)
    }
  }, { parent });
};

const addBikeWheelSpokes = (registry, item, definition, componentId, center, radius, depth, parent) => {
  const spokeLength = radius * 1.72;
  const spokeThickness = Math.max(0.006, radius * 0.04);

  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 6) + (index * Math.PI / 3);
    boxComponent(registry, item, definition, componentId, {
      width: spokeLength,
      height: spokeThickness,
      depth
    }, {
      position: center,
      rotation: { z: angle }
    }, { parent });
  }
};

const addBikeWheel = (registry, item, definition, center, wheelRadius, wheelThickness, parent) => {
  const tireOuterR = wheelRadius;
  const tireInnerR = wheelRadius * 0.86;
  const tireHalfH = wheelThickness / 2;

  latheComponent(registry, item, definition, 'tires', {
    shape: [
      { x: tireInnerR, y: -tireHalfH },
      { x: tireOuterR, y: -tireHalfH },
      { x: tireOuterR, y: tireHalfH },
      { x: tireInnerR, y: tireHalfH },
      { x: tireInnerR, y: -tireHalfH }
    ],
    tessellation: 10
  }, {
    position: center,
    rotation: { x: Math.PI / 2 }
  }, { parent });

  const rimOuterR = tireInnerR;
  const rimInnerR = wheelRadius * 0.82;
  const rimHalfH = (wheelThickness * 0.68) / 2;

  latheComponent(registry, item, definition, 'frame', {
    shape: [
      { x: rimInnerR, y: -rimHalfH },
      { x: rimOuterR, y: -rimHalfH },
      { x: rimOuterR, y: rimHalfH },
      { x: rimInnerR, y: rimHalfH },
      { x: rimInnerR, y: -rimHalfH }
    ],
    tessellation: 10
  }, {
    position: center,
    rotation: { x: Math.PI / 2 }
  }, { parent });

  addBikeWheelSpokes(registry, item, definition, 'metal', center, rimInnerR, wheelThickness * 0.34, parent);

  cylinderComponent(registry, item, definition, 'metal', {
    diameterTop: wheelRadius * 0.12,
    diameterBottom: wheelRadius * 0.12,
    height: wheelThickness * 1.15,
    tessellation: 8
  }, {
    position: center,
    rotation: { x: Math.PI / 2 }
  }, { parent });
};

export const outdoorUmbrellaFurniture = {
  type: 'outdoor_umbrella',
  name: 'Outdoor Umbrella',
  unit: 'm',
  defaultSize: { width: 1.05, depth: 1.05, height: 2.25 },
  components: [
    { id: 'canopy', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'pole', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone }
  ],
  build(registry, item, node, size) {
    const canopyH = Math.max(0.06, size.height * 0.1);
    const poleH = size.height - canopyH - 0.04;
    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'canopy', {
      diameterTop: size.width * 0.2,
      diameterBottom: size.width,
      height: canopyH,
      tessellation: 10
    }, { position: { x: 0, y: poleH + canopyH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'pole', {
      diameterTop: 0.05,
      diameterBottom: 0.06,
      height: poleH,
      tessellation: 8
    }, { position: { x: 0, y: poleH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'base', {
      diameterTop: size.width * 0.22,
      diameterBottom: size.width * 0.26,
      height: 0.05,
      tessellation: 10
    }, { position: { x: 0, y: 0.025, z: 0 } }, { parent: node });
  }
};

export const pergolaFurniture = {
  type: 'pergola',
  name: 'Pergola',
  unit: 'm',
  defaultSize: { width: 2.45, depth: 1.5, height: 2.45 },
  components: [
    { id: 'posts', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'beams', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'vines', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.sage }
  ],
  build(registry, item, node, size) {
    const postW = Math.max(0.08, size.width * 0.03);
    const beamH = Math.max(0.08, size.height * 0.04);
    const xOffset = size.width / 2 - postW / 2;
    const zOffset = size.depth / 2 - postW / 2;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, pergolaFurniture, 'posts', {
          width: postW,
          height: size.height,
          depth: postW
        }, { position: { x: xSide * xOffset, y: size.height / 2, z: zSide * zOffset } }, { parent: node });
      });
    });

    boxComponent(registry, item, pergolaFurniture, 'beams', {
      width: size.width,
      height: beamH,
      depth: postW
    }, { position: { x: 0, y: size.height - beamH / 2, z: zOffset } }, { parent: node });
    boxComponent(registry, item, pergolaFurniture, 'beams', {
      width: size.width,
      height: beamH,
      depth: postW
    }, { position: { x: 0, y: size.height - beamH / 2, z: -zOffset } }, { parent: node });

    for (let index = -2; index <= 2; index += 1) {
      boxComponent(registry, item, pergolaFurniture, 'vines', {
        width: postW,
        height: beamH * 0.8,
        depth: size.depth * 0.9
      }, {
        position: {
          x: index * size.width * 0.18,
          y: size.height - beamH * 0.7,
          z: 0
        }
      }, { parent: node });
    }
  }
};

export const flowerArchFurniture = {
  type: 'flower_arch',
  name: 'Flower Arch',
  unit: 'm',
  defaultSize: { width: 1.85, depth: 0.5, height: 2.35 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'vines', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.sage },
    { id: 'flowers', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.flower }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const postW = Math.max(0.04, w * 0.02);
    const gridBarW = 0.018;
    const straightH = h * 0.65;
    const archRadius = (w - postW) / 2;

    // 1.   (Trellis Side Towers)
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - postW / 2);

      //  
      [-1, 1].forEach((zSide) => {
        const zPos = zSide * (d / 2 - postW / 2);
        boxComponent(registry, item, flowerArchFurniture, 'frame', {
          width: postW,
          height: straightH,
          depth: postW
        }, { position: { x: xPos, y: straightH / 2, z: zPos } }, { parent: node });
      });

      //  
      for (let i = 1; i <= 4; i += 1) {
        const yPos = (straightH / 5) * i;
        boxComponent(registry, item, flowerArchFurniture, 'frame', {
          width: postW,
          height: gridBarW,
          depth: d - postW
        }, { position: { x: xPos, y: yPos, z: 0 } }, { parent: node });
      }

      //  
      boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: postW * 0.8,
        height: straightH,
        depth: gridBarW
      }, { position: { x: xPos, y: straightH / 2, z: 0 } }, { parent: node });
    });

    // 2.   (Smooth Arch Ring)
    const archSegments = 10;
    [-1, 1].forEach((zSide) => {
      const zPos = zSide * (d / 2 - postW / 2);
      for (let i = 0; i < archSegments; i += 1) {
        const angle1 = (Math.PI / archSegments) * i;
        const angle2 = (Math.PI / archSegments) * (i + 1);

        const x1 = Math.cos(angle1) * archRadius;
        const y1 = straightH + Math.sin(angle1) * archRadius;
        const x2 = Math.cos(angle2) * archRadius;
        const y2 = straightH + Math.sin(angle2) * archRadius;

        const segLen = Math.hypot(x2 - x1, y2 - y1) * 1.05;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const rotZ = Math.atan2(y2 - y1, x2 - x1);

        boxComponent(registry, item, flowerArchFurniture, 'frame', {
          width: segLen,
          height: postW,
          depth: postW
        }, {
          position: { x: midX, y: midY, z: zPos },
          rotation: { z: rotZ }
        }, { parent: node });
      }
    });

    //  
    for (let i = 1; i < archSegments; i += 1) {
      const angle = (Math.PI / archSegments) * i;
      const x = Math.cos(angle) * archRadius;
      const y = straightH + Math.sin(angle) * archRadius;
      boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: postW,
        height: postW,
        depth: d - postW
      }, { position: { x, y, z: 0 } }, { parent: node });
    }

    // 3.   (Climbing Vines & Leaf Clusters)
    const vinePoints = [];

    //  
    for (let side of [-1, 1]) {
      for (let step = 0; step <= 5; step += 1) {
        const vY = (straightH / 5) * step + 0.05;
        vinePoints.push({
          x: side * (w / 2 - postW / 2) + (step % 2 === 0 ? 0.03 : -0.03) * side,
          y: vY,
          z: (step % 2 === 0 ? 0.06 : -0.06),
          size: 0.16 + (step % 3) * 0.04
        });
      }
    }

    //  
    for (let i = 0; i <= archSegments; i += 1) {
      const angle = (Math.PI / archSegments) * i;
      const vx = Math.cos(angle) * (archRadius + 0.02);
      const vy = straightH + Math.sin(angle) * (archRadius + 0.02);
      vinePoints.push({
        x: vx,
        y: vy,
        z: (i % 2 === 0 ? 0.05 : -0.05),
        size: 0.18 + (i % 3) * 0.05
      });
    }

    vinePoints.forEach((vp) => {
      //  
      sphereComponent(registry, item, flowerArchFurniture, 'vines', {
        diameterX: vp.size,
        diameterY: vp.size * 0.85,
        diameterZ: vp.size,
        segments: 6
      }, { position: { x: vp.x, y: vp.y, z: vp.z } }, { parent: node });
    });

    // 4.   (Rose Bloom Heads)
    vinePoints.forEach((vp, idx) => {
      if (idx % 2 === 0) {
        const roseS = vp.size * 0.48;
        sphereComponent(registry, item, flowerArchFurniture, 'flowers', {
          diameterX: roseS,
          diameterY: roseS,
          diameterZ: roseS,
          segments: 6
        }, {
          position: {
            x: vp.x + (idx % 3 === 0 ? 0.04 : -0.04),
            y: vp.y + (idx % 2 === 0 ? 0.02 : -0.02),
            z: vp.z + 0.05
          }
        }, { parent: node });
      }
    });

    // 5.   (Hitbox / Proxy Collision Box)
    const sideHitW = postW * 3.5;
    const sideHitD = d * 1.2;

    [-1, 1].forEach((side) => {
      const hb = boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: sideHitW,
        height: straightH,
        depth: sideHitD
      }, { position: { x: side * (w / 2 - postW / 2), y: straightH / 2, z: 0 } }, { parent: node });
      hb.visibility = 0;
      hb.isPickable = true;
      hb.metadata = { ...(hb.metadata || {}), blueprintItemId: item.id, blueprintFurnitureComponentId: 'frame', isHitbox: true };
    });

    const topHb = boxComponent(registry, item, flowerArchFurniture, 'frame', {
      width: w,
      height: archRadius + 0.1,
      depth: sideHitD
    }, { position: { x: 0, y: straightH + (archRadius + 0.1) / 2, z: 0 } }, { parent: node });
    topHb.visibility = 0;
    topHb.isPickable = true;
    topHb.metadata = { ...(topHb.metadata || {}), blueprintItemId: item.id, blueprintFurnitureComponentId: 'frame', isHitbox: true };
  }
};

export const gazeboFurniture = {
  type: 'gazebo',
  name: 'Gazebo',
  unit: 'm',
  defaultSize: { width: 3.2, depth: 3.2, height: 3.6 },
  components: [
    { id: 'posts', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'roof', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'rails', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const baseH = 0.28;
    const baseR = Math.min(w, d) * 0.44;
    const pillarR = 0.075;
    const pillarH = h * 0.54;
    const roofH = h * 0.35;
    const pillarRadiusPos = baseR * 0.85;

    // 1.   (Hexagonal Stone Base Platform)
    for (let i = 0; i < 6; i += 1) {
      const a1 = (Math.PI / 3) * i;
      const a2 = (Math.PI / 3) * (i + 1);

      const p1 = { x: Math.cos(a1) * baseR, z: Math.sin(a1) * baseR };
      const p2 = { x: Math.cos(a2) * baseR, z: Math.sin(a2) * baseR };

      const edgeLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z) + Math.PI / 2;

      //  
      boxComponent(registry, item, gazeboFurniture, 'rails', {
        width: edgeLen * 1.02,
        height: baseH,
        depth: baseR * 0.3
      }, {
        position: { x: midX * 0.85, y: baseH / 2, z: midZ * 0.85 },
        rotation: { y: rotY }
      }, { parent: node });
    }

    //  
    cylinderComponent(registry, item, gazeboFurniture, 'rails', {
      diameterTop: baseR * 1.9,
      diameterBottom: baseR * 1.95,
      height: baseH * 0.9,
      tessellation: 6
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 2.   (6 Pillars & Stone Bases)
    const pillarPositions = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const px = Math.cos(angle) * pillarRadiusPos;
      const pz = Math.sin(angle) * pillarRadiusPos;
      pillarPositions.push({ x: px, z: pz, angle });

      //   (Base)
      cylinderComponent(registry, item, gazeboFurniture, 'rails', {
        diameterTop: pillarR * 2.8,
        diameterBottom: pillarR * 3.2,
        height: 0.08,
        tessellation: 8
      }, { position: { x: px, y: baseH + 0.04, z: pz } }, { parent: node });

      //   (Pillar)
      cylinderComponent(registry, item, gazeboFurniture, 'posts', {
        diameterTop: pillarR * 1.9,
        diameterBottom: pillarR * 2.1,
        height: pillarH,
        tessellation: 8
      }, { position: { x: px, y: baseH + 0.08 + pillarH / 2, z: pz } }, { parent: node });
    }

    //   1   3  （Side 0     Side 2）
    const doorSidesSet = new Set([0, 2]);

    // 3.   (Flat Stepped Entrances on Both Openings)
    doorSidesSet.forEach((sideIdx) => {
      const p1 = pillarPositions[sideIdx];
      const p2 = pillarPositions[(sideIdx + 1) % 6];

      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const spanLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);

      //  
      const normLen = Math.hypot(midX, midZ);
      const normX = midX / normLen;
      const normZ = midZ / normLen;
      const rotNormY = Math.atan2(normX, normZ);

      //  
      const tanX = (p2.x - p1.x) / spanLen;
      const tanZ = (p2.z - p1.z) / spanLen;

      const stepW = spanLen * 0.72; //  
      const stepRun = 0.22; //  
      const stepCount = 3;
      const riserH = baseH / stepCount;

      // 3  
      for (let s = 1; s <= stepCount; s += 1) {
        const curH = riserH * (stepCount - s + 1);
        const distOut = stepRun * s;

        boxComponent(registry, item, gazeboFurniture, 'rails', {
          width: stepW,
          height: curH,
          depth: stepRun * 1.05
        }, {
          position: { x: midX + normX * distOut, y: curH / 2, z: midZ + normZ * distOut },
          rotation: { y: rotNormY }
        }, { parent: node });
      }

      //  /  ( )
      [-1, 1].forEach((handSide) => {
        const hx = midX + tanX * (stepW * 0.48 * handSide) + normX * (stepRun * 1.8);
        const hz = midZ + tanZ * (stepW * 0.48 * handSide) + normZ * (stepRun * 1.8);

        boxComponent(registry, item, gazeboFurniture, 'rails', {
          width: 0.06,
          height: baseH * 0.75,
          depth: stepRun * 3.2
        }, {
          position: { x: hx, y: baseH * 0.4, z: hz },
          rotation: { y: rotNormY }
        }, { parent: node });
      });
    });

    // 4.   (Upper Carved Wood Lattice - 6  All )
    const upperY = baseH + 0.08 + pillarH - 0.12;
    for (let i = 0; i < 6; i += 1) {
      const p1 = pillarPositions[i];
      const p2 = pillarPositions[(i + 1) % 6];

      const spanLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      //  
      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.12,
        height: 0.14,
        depth: spanLen * 1.05
      }, {
        position: { x: midX, y: upperY + 0.07, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });

      //  
      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.03,
        height: 0.18,
        depth: spanLen * 0.88
      }, {
        position: { x: midX, y: upperY - 0.08, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });
    }

    // 5.  /  (  4  )
    const lowerY = baseH + 0.08 + 0.35;
    for (let i = 0; i < 6; i += 1) {
      if (doorSidesSet.has(i)) {
        continue; // 1   3  
      }

      const p1 = pillarPositions[i];
      const p2 = pillarPositions[(i + 1) % 6];
      const spanLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      //  
      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.06,
        height: 0.04,
        depth: spanLen * 0.92
      }, {
        position: { x: midX, y: lowerY, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });

      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.05,
        height: 0.04,
        depth: spanLen * 0.92
      }, {
        position: { x: midX, y: baseH + 0.12, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });

      //  
      const railBarCount = 7;
      for (let b = 1; b <= railBarCount; b += 1) {
        const frac = b / (railBarCount + 1);
        const bx = p1.x + (p2.x - p1.x) * frac;
        const bz = p1.z + (p2.z - p1.z) * frac;

        boxComponent(registry, item, gazeboFurniture, 'posts', {
          width: 0.025,
          height: lowerY - (baseH + 0.12),
          depth: 0.025
        }, {
          position: { x: bx, y: (lowerY + baseH + 0.12) / 2, z: bz }
        }, { parent: node });
      }
    }

    // 6.   (  6  )
    const roofStartY = baseH + 0.08 + pillarH;
    const eaveR = baseR * 1.35;
    const coneRadiusBottom = eaveR * 1.02;

    //   (Hexagonal Main Roof Cone)
    cylinderComponent(registry, item, gazeboFurniture, 'roof', {
      diameterTop: 0.2,
      diameterBottom: coneRadiusBottom * 2,
      height: roofH,
      tessellation: 6
    }, { position: { x: 0, y: roofStartY + roofH / 2, z: 0 } }, { parent: node });

    // 6   6  
    for (let i = 0; i < 6; i += 1) {
      //  ：  (0, 60°, 120°, 180°, 240°, 300°)
      const ridgeAngle = (Math.PI / 3) * i;
      const ex = Math.cos(ridgeAngle) * coneRadiusBottom;
      const ez = Math.sin(ridgeAngle) * coneRadiusBottom;

      //  
      const ridgeLen = Math.hypot(coneRadiusBottom, roofH);
      const ridgeMidX = ex * 0.5;
      const ridgeMidZ = ez * 0.5;
      const ridgeMidY = roofStartY + roofH / 2;

      boxComponent(registry, item, gazeboFurniture, 'roof', {
        width: 0.06,
        height: 0.06,
        depth: ridgeLen
      }, {
        position: { x: ridgeMidX, y: ridgeMidY, z: ridgeMidZ },
        rotation: {
          y: -ridgeAngle + Math.PI / 2,
          x: Math.atan2(roofH, coneRadiusBottom)
        }
      }, { parent: node });

      //   (Upcurved Tip exactly on Ridge Corners)
      boxComponent(registry, item, gazeboFurniture, 'roof', {
        width: 0.1,
        height: 0.06,
        depth: 0.28
      }, {
        position: { x: ex * 1.02, y: roofStartY + 0.05, z: ez * 1.02 },
        rotation: {
          y: -ridgeAngle + Math.PI / 2,
          x: -Math.PI * 0.08
        }
      }, { parent: node });
    }

    // 7.  /  (Stupa Finial Ornament)
    const topY = roofStartY + roofH;

    //  
    cylinderComponent(registry, item, gazeboFurniture, 'roof', {
      diameterTop: 0.22,
      diameterBottom: 0.32,
      height: 0.12,
      tessellation: 8
    }, { position: { x: 0, y: topY + 0.06, z: 0 } }, { parent: node });

    //  
    sphereComponent(registry, item, gazeboFurniture, 'roof', {
      diameterX: 0.28,
      diameterY: 0.28,
      diameterZ: 0.28,
      segments: 8
    }, { position: { x: 0, y: topY + 0.24, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, gazeboFurniture, 'roof', {
      diameterTop: 0.12,
      diameterBottom: 0.16,
      height: 0.08,
      tessellation: 8
    }, { position: { x: 0, y: topY + 0.38, z: 0 } }, { parent: node });

    //  
    sphereComponent(registry, item, gazeboFurniture, 'roof', {
      diameterX: 0.18,
      diameterY: 0.2,
      diameterZ: 0.18,
      segments: 8
    }, { position: { x: 0, y: topY + 0.48, z: 0 } }, { parent: node });
  }
};

export const patioSwingFurniture = {
  type: 'patio_swing',
  name: 'Patio Swing',
  unit: 'm',
  defaultSize: { width: 2, depth: 1.3, height: 2 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'seat', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.fabric },
    { id: 'canopy', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: -size.width * 0.18, y: size.height * 0.38, z: 0, rot: 0 },
        { x: size.width * 0.18, y: size.height * 0.38, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const postW = Math.max(0.05, size.width * 0.025);
    const xOffset = size.width * 0.42;
    const zOffset = size.depth * 0.20;
    [-1, 1].forEach((side) => {
      const frontPost = boxComponent(registry, item, patioSwingFurniture, 'frame', {
        width: postW,
        height: size.height * 0.94,
        depth: postW
      }, { position: { x: side * xOffset, y: size.height * 0.47, z: zOffset } }, { parent: node });
      frontPost.rotation.x = -Math.PI * 0.08;
      // frontPost.rotation.z = -side * Math.PI * 0.08;

      const rearPost = boxComponent(registry, item, patioSwingFurniture, 'frame', {
        width: postW,
        height: size.height * 0.94,
        depth: postW
      }, { position: { x: side * xOffset, y: size.height * 0.47, z: -zOffset } }, { parent: node });
      rearPost.rotation.x = Math.PI * 0.08;
      // rearPost.rotation.z = side * Math.PI * 0.08;
    });

    boxComponent(registry, item, patioSwingFurniture, 'frame', {
      width: size.width * 0.92,
      height: postW,
      depth: postW
    }, { position: { x: 0, y: size.height * 0.92, z: 0 } }, { parent: node });

    boxComponent(registry, item, patioSwingFurniture, 'seat', {
      width: size.width * 0.58,
      height: 0.05,
      depth: size.depth * 0.34
    }, { position: { x: 0, y: size.height * 0.34, z: 0 } }, { parent: node });

    boxComponent(registry, item, patioSwingFurniture, 'seat', {
      width: size.width * 0.58,
      height: size.height * 0.16,
      depth: 0.05
    }, { position: { x: 0, y: size.height * 0.46, z: -size.depth * 0.13 } }, { parent: node });

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, patioSwingFurniture, 'frame', {
        width: 0.02,
        height: size.height * 0.42,
        depth: 0.02
      }, { position: { x: side * size.width * 0.22, y: size.height * 0.56, z: -size.depth * 0.06 } }, { parent: node });
    });

    boxComponent(registry, item, patioSwingFurniture, 'canopy', {
      width: size.width * 0.72,
      height: 0.04,
      depth: size.depth * 0.44
    }, { position: { x: 0, y: size.height * 0.82, z: 0 } }, { parent: node });
  }
};

export const hammockStandFurniture = {
  type: 'hammock_stand',
  name: 'Hammock Stand',
  unit: 'm',
  defaultSize: { width: 2.6, depth: 0.85, height: 1.2 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'bed', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: lieInteraction(0.45),
  build(registry, item, node, size) {
    const frameW = Math.max(0.04, size.width * 0.02);
    const beam = boxComponent(registry, item, hammockStandFurniture, 'frame', {
      width: size.width * 0.88,
      height: frameW,
      depth: frameW
    }, { position: { x: 0, y: size.height * 0.88, z: 0 } }, { parent: node });
    beam.rotation.z = Math.PI * 0.02;

    [-1, 1].forEach((side) => {
      const leg = boxComponent(registry, item, hammockStandFurniture, 'frame', {
        width: frameW,
        height: size.height,
        depth: frameW
      }, { position: { x: side * size.width * 0.42, y: size.height / 2, z: 0 } }, { parent: node });
      leg.rotation.z = -side * Math.PI * 0.18;
    });

    const bed = boxComponent(registry, item, hammockStandFurniture, 'bed', {
      width: size.width * 0.62,
      height: 0.03,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.38, z: 0 } }, { parent: node });
    bed.rotation.z = Math.PI * 0.05;
  }
};

export const firePitFurniture = {
  type: 'fire_pit',
  name: 'Fire Pit',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.75, height: 0.4 },
  components: [
    { id: 'bowl', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone },
    { id: 'base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'ring', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, firePitFurniture, 'base', {
      diameterTop: size.width * 0.46,
      diameterBottom: size.width * 0.6,
      height: size.height * 0.32,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.16, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, firePitFurniture, 'bowl', {
      diameterTop: size.width,
      diameterBottom: size.width * 0.74,
      height: size.height * 0.52,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, firePitFurniture, 'ring', {
      diameterTop: size.width * 0.86,
      diameterBottom: size.width * 0.86,
      height: 0.03,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.73, z: 0 } }, { parent: node });
  }
};

export const barbecueGrillFurniture = {
  type: 'barbecue_grill',
  name: 'Barbecue Grill',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.55, height: 1.05 },
  components: [
    { id: 'grill', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'legs', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.metal },
    { id: 'shelf', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    const bodyH = size.height * 0.38;
    boxComponent(registry, item, barbecueGrillFurniture, 'grill', {
      width: size.width * 0.8,
      height: bodyH,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.62, z: 0 } }, { parent: node });

    const lid = boxComponent(registry, item, barbecueGrillFurniture, 'grill', {
      width: size.width * 0.8,
      height: bodyH * 0.58,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.84, z: 0 } }, { parent: node });
    lid.rotation.x = Math.PI * 0.08;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, barbecueGrillFurniture, 'legs', {
          width: 0.04,
          height: size.height * 0.5,
          depth: 0.04
        }, { position: { x: xSide * size.width * 0.26, y: size.height * 0.25, z: zSide * size.depth * 0.22 } }, { parent: node });
      });
    });

    boxComponent(registry, item, barbecueGrillFurniture, 'shelf', {
      width: size.width * 0.72,
      height: 0.03,
      depth: size.depth * 0.48
    }, { position: { x: 0, y: size.height * 0.18, z: 0 } }, { parent: node });
  }
};

export const patioHeaterFurniture = {
  type: 'patio_heater',
  name: 'Patio Heater',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 2.15 },
  components: [
    { id: 'base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.metal },
    { id: 'pole', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.lightMetal },
    { id: 'hood', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, patioHeaterFurniture, 'base', {
      diameterTop: size.width * 0.5,
      diameterBottom: size.width * 0.62,
      height: size.height * 0.08,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.04, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, patioHeaterFurniture, 'pole', {
      diameterTop: 0.04,
      diameterBottom: 0.05,
      height: size.height * 0.76,
      tessellation: 8
    }, { position: { x: 0, y: size.height * 0.46, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, patioHeaterFurniture, 'hood', {
      diameterTop: size.width * 0.2,
      diameterBottom: size.width,
      height: size.height * 0.12,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.9, z: 0 } }, { parent: node });
  }
};

export const gardenFountainFurniture = {
  type: 'garden_fountain',
  waterControllable: true,
  name: 'Garden Fountain',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.8, height: 1.3 },
  components: [
    { id: 'base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'column', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone },
    { id: 'top', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'water', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water }
  ],
  build(registry, item, node, size) {
    // 1.  Circle  ( )
    const baseBottomH = 0.03;
    const baseH = size.height * 0.22;
    const baseWallT = 0.04;
    latheComponent(registry, item, gardenFountainFurniture, 'base', {
      shape: [
        { x: 0, y: 0 },
        { x: size.width / 2, y: 0 },
        { x: size.width / 2, y: baseH },
        { x: size.width / 2 - baseWallT, y: baseH },
        { x: size.width / 2 - baseWallT, y: baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2.  
    cylinderComponent(registry, item, gardenFountainFurniture, 'column', {
      diameterTop: size.width * 0.16,
      diameterBottom: size.width * 0.22,
      height: size.height * 0.44,
      tessellation: 8
    }, { position: { x: 0, y: size.height * 0.44, z: 0 } }, { parent: node });

    // 3.  Circle  ( )
    const topBottomH = 0.025;
    const topH = size.height * 0.16;
    const topY = size.height * 0.66;
    const topDiameter = size.width * 0.58;
    const topWallT = 0.03;
    latheComponent(registry, item, gardenFountainFurniture, 'top', {
      shape: [
        { x: 0, y: 0 },
        { x: topDiameter / 2, y: 0 },
        { x: topDiameter / 2, y: topH },
        { x: topDiameter / 2 - topWallT, y: topH },
        { x: topDiameter / 2 - topWallT, topBottomH },
        { x: 0, y: topBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: topY, z: 0 } }, { parent: node });

    // 4.   ( )
    if (item.waterEnabled !== false) {
      //   (  0.03 )
      cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
        diameterTop: size.width - baseWallT * 2 - 0.01,
        diameterBottom: size.width - baseWallT * 2 - 0.01,
        height: 0.005,
        tessellation: 10
      }, { position: { x: 0, y: baseH - 0.03, z: 0 } }, { parent: node });

      //   (  0.02 )
      cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
        diameterTop: topDiameter - topWallT * 2 - 0.01,
        diameterBottom: topDiameter - topWallT * 2 - 0.01,
        height: 0.005,
        tessellation: 8
      }, { position: { x: 0, y: topY + topH - 0.02, z: 0 } }, { parent: node });

      // 7. 8  ( )
      const streamR = topDiameter / 2 - 0.01;
      const streamH = (topY - baseH) + 0.04;
      const streamY = baseH + (topY - baseH) / 2;
      const streamD = 0.015; //  

      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8;
        const x = Math.cos(angle) * streamR;
        const z = Math.sin(angle) * streamR;

        cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
          diameterTop: streamD,
          diameterBottom: streamD,
          height: streamH,
          tessellation: 6
        }, {
          position: { x: x, y: streamY, z: z }
        }, { parent: node });
      }
    }
  }
};

export const birdbathFurniture = {
  type: 'birdbath',
  waterControllable: true,
  name: 'Birdbath',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.85 },
  components: [
    { id: 'base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'basin', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'water', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water }
  ],
  build(registry, item, node, size) {
    // 1.  
    cylinderComponent(registry, item, birdbathFurniture, 'base', {
      diameterTop: size.width * 0.18,
      diameterBottom: size.width * 0.26,
      height: size.height * 0.72,
      tessellation: 8
    }, { position: { x: 0, y: size.height * 0.36, z: 0 } }, { parent: node });

    // 2.  Circle 
    const basinBottomH = 0.03;
    const basinH = size.height * 0.16;
    const basinY = size.height * 0.72;
    const wallThickness = 0.04;
    const rBottom = size.width * 0.18; //  
    const rInnerBottom = size.width * 0.22; //   ( )

    latheComponent(registry, item, birdbathFurniture, 'basin', {
      shape: [
        { x: 0, y: 0 },
        { x: rBottom, y: 0 },
        { x: size.width / 2, y: basinH },
        { x: size.width / 2 - wallThickness, y: basinH },
        { x: rInnerBottom, y: basinBottomH },
        { x: 0, y: basinBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: basinY, z: 0 } }, { parent: node });

    // 3.   ( ， )
    if (item.waterEnabled !== false) {
      const waterLocalY = basinH - 0.03;
      const slopeRatio = (waterLocalY - basinBottomH) / (basinH - basinBottomH);
      const waterR = rInnerBottom + slopeRatio * (size.width / 2 - wallThickness - rInnerBottom);

      cylinderComponent(registry, item, birdbathFurniture, 'water', {
        diameterTop: waterR * 2,
        diameterBottom: waterR * 2,
        height: 0.005,
        tessellation: 10
      }, { position: { x: 0, y: basinY + waterLocalY, z: 0 } }, { parent: node });
    }
  }
};

export const planterBoxFurniture = {
  type: 'planter_box',
  name: 'Planter Box',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.35, height: 0.4 },
  components: [
    { id: 'box', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta },
    { id: 'legs', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'soil', label: 'Soil', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.soil }
  ],
  build(registry, item, node, size) {
    const boxW = size.width;
    const boxH = size.height * 0.68;
    const boxD = size.depth;
    const boxY = size.height * 0.56;
    const t = 0.03; //  

    // 1.  
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: boxW, height: boxH, depth: t
    }, { position: { x: 0, y: boxY, z: -boxD / 2 + t / 2 } }, { parent: node });

    // 2.  
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: boxW, height: boxH, depth: t
    }, { position: { x: 0, y: boxY, z: boxD / 2 - t / 2 } }, { parent: node });

    // 3.  
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: t, height: boxH, depth: boxD - t * 2
    }, { position: { x: -boxW / 2 + t / 2, y: boxY, z: 0 } }, { parent: node });

    // 4.  
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: t, height: boxH, depth: boxD - t * 2
    }, { position: { x: boxW / 2 - t / 2, y: boxY, z: 0 } }, { parent: node });

    // 5. Earth
    const soilH = 0.04;
    boxComponent(registry, item, planterBoxFurniture, 'soil', {
      width: boxW - t * 2, height: soilH, depth: boxD - t * 2
    }, { position: { x: 0, y: boxY + boxH / 2 - 0.02 - soilH / 2, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, planterBoxFurniture, 'legs', {
          width: 0.03,
          height: size.height * 0.34,
          depth: 0.03
        }, { position: { x: xSide * size.width * 0.42, y: size.height * 0.17, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });
  }
};

export const raisedGardenBedFurniture = {
  type: 'raised_garden_bed',
  name: 'Raised Garden Bed',
  unit: 'm',
  defaultSize: { width: 1.35, depth: 0.65, height: 0.55 },
  components: [
    { id: 'box', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'legs', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'rail', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, raisedGardenBedFurniture, 'box', {
      width: size.width,
      height: size.height * 0.52,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.62, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, raisedGardenBedFurniture, 'legs', {
          width: 0.04,
          height: size.height * 0.48,
          depth: 0.04
        }, { position: { x: xSide * size.width * 0.43, y: size.height * 0.24, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });

    boxComponent(registry, item, raisedGardenBedFurniture, 'rail', {
      width: size.width * 0.84,
      height: 0.03,
      depth: 0.03
    }, { position: { x: 0, y: size.height * 0.24, z: 0 } }, { parent: node });
  }
};

export const trellisScreenFurniture = {
  type: 'trellis_screen',
  name: 'Trellis Screen',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.15, height: 2 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'slats', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    const fWidth = 0.04; //  
    const fDepth = size.depth; //  

    // 1.  
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: fWidth,
      height: size.height,
      depth: fDepth
    }, { position: { x: -size.width / 2 + fWidth / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 2.  
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: fWidth,
      height: size.height,
      depth: fDepth
    }, { position: { x: size.width / 2 - fWidth / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 3.  
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: size.width - fWidth * 2,
      height: fWidth,
      depth: fDepth
    }, { position: { x: 0, y: size.height - fWidth / 2, z: 0 } }, { parent: node });

    // 4.  
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: size.width - fWidth * 2,
      height: fWidth,
      depth: fDepth
    }, { position: { x: 0, y: fWidth / 2, z: 0 } }, { parent: node });

    const innerWidth = size.width - fWidth * 2;
    const innerHeight = size.height - fWidth * 2;

    //  
    for (let index = -3; index <= 3; index += 1) {
      boxComponent(registry, item, trellisScreenFurniture, 'slats', {
        width: 0.03,
        height: innerHeight,
        depth: size.depth * 0.7
      }, { position: { x: index * innerWidth * 0.12, y: size.height * 0.5, z: 0 } }, { parent: node });
    }

    //  
    for (let index = -2; index <= 2; index += 1) {
      boxComponent(registry, item, trellisScreenFurniture, 'slats', {
        width: innerWidth,
        height: 0.03,
        depth: size.depth * 0.7
      }, { position: { x: 0, y: fWidth + innerHeight * (0.15 + (index + 2) * 0.175), z: 0 } }, { parent: node });
    }
  }
};

export const outdoorStorageBoxFurniture = {
  type: 'outdoor_storage_box',
  name: 'Outdoor Storage Box',
  unit: 'm',
  defaultSize: { width: 1.05, depth: 0.55, height: 0.6 },
  components: [
    { id: 'box', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'lid', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, outdoorStorageBoxFurniture, 'box', {
      width: size.width,
      height: size.height * 0.78,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.39, z: 0 } }, { parent: node });

    boxComponent(registry, item, outdoorStorageBoxFurniture, 'lid', {
      width: size.width * 1.02,
      height: size.height * 0.14,
      depth: size.depth * 1.02
    }, { position: { x: 0, y: size.height * 0.85, z: 0 } }, { parent: node });
  }
};

export const gardenBridgeFurniture = {
  type: 'garden_bridge',
  name: 'Garden Bridge',
  unit: 'm',
  defaultSize: { width: 1.7, depth: 0.5, height: 0.5 },
  components: [
    { id: 'deck', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'rails', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'supports', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood }
  ],
  build(registry, item, node, size) {
    const w_mid = size.width * 0.4;
    const w_slope = size.width * 0.3;
    const y_low = size.height * 0.15;
    const y_high = size.height * 0.55;
    const h_diff = y_high - y_low;
    const L_slope = Math.sqrt(w_slope * w_slope + h_diff * h_diff);
    const theta = Math.atan2(h_diff, w_slope);

    const deckHeight = size.height * 0.12;
    const deckDepth = size.depth * 0.8;
    const railH = size.height * 0.35;

    // 1.  
    //  
    boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: w_mid,
      height: deckHeight,
      depth: deckDepth
    }, { position: { x: 0, y: y_high, z: 0 } }, { parent: node });

    //  
    const deckLeft = boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: L_slope,
      height: deckHeight,
      depth: deckDepth
    }, { position: { x: -size.width * 0.35, y: (y_low + y_high) / 2, z: 0 } }, { parent: node });
    deckLeft.rotation.z = theta;

    //  
    const deckRight = boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: L_slope,
      height: deckHeight,
      depth: deckDepth
    }, { position: { x: size.width * 0.35, y: (y_low + y_high) / 2, z: 0 } }, { parent: node });
    deckRight.rotation.z = -theta;

    //  ：  X   y  
    const getDeckY = (x) => {
      const absX = Math.abs(x);
      if (absX <= size.width * 0.2) {
        return y_high;
      } else if (absX <= size.width * 0.5) {
        const ratio = (size.width * 0.5 - absX) / w_slope;
        return y_low + ratio * h_diff;
      }
      return y_low;
    };

    // 2.  
    [-1, 1].forEach((side) => {
      const zPos = side * size.depth * 0.36;

      //  
      boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: w_mid,
        height: 0.03,
        depth: 0.03
      }, { position: { x: 0, y: y_high + railH, z: zPos } }, { parent: node });

      //  
      const railLeft = boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: L_slope,
        height: 0.03,
        depth: 0.03
      }, { position: { x: -size.width * 0.35, y: (y_low + y_high) / 2 + railH, z: zPos } }, { parent: node });
      railLeft.rotation.z = theta;

      //  
      const railRight = boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: L_slope,
        height: 0.03,
        depth: 0.03
      }, { position: { x: size.width * 0.35, y: (y_low + y_high) / 2 + railH, z: zPos } }, { parent: node });
      railRight.rotation.z = -theta;

      // 4 
      const supportW = 0.04;
      const supportsX = [-size.width * 0.46, -size.width * 0.2, size.width * 0.2, size.width * 0.46];

      supportsX.forEach((xPos) => {
        const yTop = getDeckY(xPos) + railH;
        boxComponent(registry, item, gardenBridgeFurniture, 'supports', {
          width: supportW,
          height: yTop,
          depth: supportW
        }, { position: { x: xPos, y: yTop / 2, z: zPos } }, { parent: node });
      });
    });
  }
};

export const canopyTentFurniture = {
  type: 'canopy_tent',
  name: 'Canopy Tent',
  unit: 'm',
  defaultSize: { width: 2.45, depth: 2.45, height: 2.45 },
  components: [
    { id: 'canopy', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'posts', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.lightMetal },
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.metal }
  ],
  build(registry, item, node, size) {
    const postW = Math.max(0.04, size.width * 0.02);
    const xOffset = size.width / 2 - postW / 2;
    const zOffset = size.depth / 2 - postW / 2;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, canopyTentFurniture, 'posts', {
          width: postW,
          height: size.height * 0.9,
          depth: postW
        }, { position: { x: xSide * xOffset, y: size.height * 0.45, z: zSide * zOffset } }, { parent: node });
      });
    });

    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: size.width,
      height: 0.04,
      depth: postW
    }, { position: { x: 0, y: size.height * 0.86, z: zOffset } }, { parent: node });
    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: size.width,
      height: 0.04,
      depth: postW
    }, { position: { x: 0, y: size.height * 0.86, z: -zOffset } }, { parent: node });
    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: postW,
      height: 0.04,
      depth: size.depth
    }, { position: { x: xOffset, y: size.height * 0.86, z: 0 } }, { parent: node });
    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: postW,
      height: 0.04,
      depth: size.depth
    }, { position: { x: -xOffset, y: size.height * 0.86, z: 0 } }, { parent: node });

    boxComponent(registry, item, canopyTentFurniture, 'canopy', {
      width: size.width * 1.02,
      height: size.height * 0.1,
      depth: size.depth * 1.02
    }, { position: { x: 0, y: size.height * 0.94, z: 0 } }, { parent: node });
  }
};

export const poolsideDaybedFurniture = {
  type: 'poolside_daybed',
  name: 'Poolside Daybed',
  unit: 'm',
  defaultSize: { width: 2, depth: 0.85, height: 0.85 },
  components: [
    { id: 'bed', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.fabric },
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'canopy', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: lieInteraction(0.48),
  build(registry, item, node, size) {
    boxComponent(registry, item, poolsideDaybedFurniture, 'bed', {
      width: size.width * 0.92,
      height: size.height * 0.14,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.52, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, poolsideDaybedFurniture, 'frame', {
          width: 0.05,
          height: size.height * 0.46,
          depth: 0.05
        }, { position: { x: xSide * size.width * 0.38, y: size.height * 0.23, z: zSide * size.depth * 0.42 } }, { parent: node });
      });
    });

    boxComponent(registry, item, poolsideDaybedFurniture, 'frame', {
      width: size.width * 0.9,
      height: 0.04,
      depth: 0.04
    }, { position: { x: 0, y: size.height * 0.88, z: -size.depth * 0.42 } }, { parent: node });

    boxComponent(registry, item, poolsideDaybedFurniture, 'canopy', {
      width: size.width * 0.9,
      height: 0.04,
      depth: size.depth * 0.22
    }, { position: { x: 0, y: size.height * 0.88, z: -size.depth * 0.34 } }, { parent: node });
  }
};



export const pottingBenchFurniture = {
  type: 'potting_bench',
  name: 'Potting Bench',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.5, height: 1.5 },
  components: [
    { id: 'counter', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'shelf', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta },
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood }
  ],
  build(registry, item, node, size) {
    const legH = size.height * 0.72;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, pottingBenchFurniture, 'frame', {
          width: 0.04,
          height: legH,
          depth: 0.04
        }, { position: { x: xSide * size.width * 0.42, y: legH / 2, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });

    boxComponent(registry, item, pottingBenchFurniture, 'counter', {
      width: size.width,
      height: 0.04,
      depth: size.depth
    }, { position: { x: 0, y: legH, z: 0 } }, { parent: node });

    boxComponent(registry, item, pottingBenchFurniture, 'shelf', {
      width: size.width * 0.82,
      height: 0.03,
      depth: size.depth * 0.72
    }, { position: { x: 0, y: legH * 0.46, z: 0 } }, { parent: node });

    boxComponent(registry, item, pottingBenchFurniture, 'frame', {
      width: size.width * 0.86,
      height: 0.04,
      depth: 0.04
    }, { position: { x: 0, y: size.height * 0.92, z: -size.depth * 0.42 } }, { parent: node });
  }
};

export const sharedBicycleFurniture = {
  type: 'shared_bicycle',
  name: 'Shared Bicycle',
  unit: 'm',
  defaultSize: { width: 1.75, depth: 0.45, height: 1.1 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.sage },
    { id: 'tires', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'metal', label: 'Metal parts', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.lightMetal }
  ],
  build(registry, item, node, size) {
    // === 1.   ===
    const wheelRadius = Math.min(size.height * 0.34, size.width * 0.19); //  
    const wheelThickness = Math.max(0.015, size.depth * 0.08); //   ( )
    const rearWheelCenter = { x: -size.width * 0.32, y: wheelRadius, z: 0 }; //  
    const frontWheelCenter = { x: size.width * 0.32, y: wheelRadius, z: 0 }; //  
    const bottomBracket = { x: -size.width * 0.04, y: wheelRadius * 0.74, z: 0 }; //   ( )  
    const seatCluster = { x: -size.width * 0.17, y: size.height * 0.58, z: 0 }; //  
    const headBottom = { x: size.width * 0.21, y: size.height * 0.46, z: 0 }; //  
    const headTop = { x: size.width * 0.25, y: size.height * 0.73, z: 0 }; //  
    const seatTop = { x: -size.width * 0.16, y: size.height * 0.72, z: 0 }; //  
    const tubeThickness = Math.max(0.04, size.width * 0.026); //  
    const metalThickness = Math.max(0.018, size.width * 0.012); // Metal 

    // === 2.   ===
    //   ( 、 、 、Metal )
    addBikeWheel(registry, item, sharedBicycleFurniture, rearWheelCenter, wheelRadius, wheelThickness, node);
    //   ( 、 、 、Metal )
    addBikeWheel(registry, item, sharedBicycleFurniture, frontWheelCenter, wheelRadius, wheelThickness, node);

    // === 3.   (  'frame'  ) ===
    //   (  ->  )
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', rearWheelCenter, seatCluster, tubeThickness * 0.72, node);
    //   (  ->  )
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', rearWheelCenter, bottomBracket, tubeThickness * 0.68, node);
    //   (  ->  )
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', bottomBracket, seatTop, tubeThickness * 0.72, node);
    //  /  (  ->  )
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', seatCluster, headBottom, tubeThickness * 0.92, node, tubeThickness * 1.24);
    //   (  ->  )
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', headBottom, headTop, tubeThickness * 0.78, node);
    //   (  ->  )
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', frontWheelCenter, headBottom, tubeThickness * 0.62, node);

    // === 4.  Metal  ===
    //   (Metal  'metal')
    cylinderComponent(registry, item, sharedBicycleFurniture, 'metal', {
      diameterTop: metalThickness,
      diameterBottom: metalThickness,
      height: size.height * 0.16,
      tessellation: 8
    }, {
      position: { x: seatTop.x, y: seatTop.y - size.height * 0.03, z: 0 }
    }, { parent: node });

    //  /  ( ，  'tires')
    boxComponent(registry, item, sharedBicycleFurniture, 'tires', {
      width: size.width * 0.18,
      height: size.height * 0.045,
      depth: size.depth * 0.42
    }, {
      position: { x: seatTop.x - size.width * 0.015, y: seatTop.y + size.height * 0.05, z: 0 }
    }, { parent: node });

    // === 5.  Metal  ===
    //   (Metal  'metal')
    cylinderComponent(registry, item, sharedBicycleFurniture, 'metal', {
      diameterTop: metalThickness,
      diameterBottom: metalThickness,
      height: size.height * 0.16,
      tessellation: 8
    }, {
      position: { x: headTop.x, y: headTop.y + size.height * 0.02, z: 0 },
      rotation: { z: Math.PI * 0.08 }
    }, { parent: node });

    //   ( ，  'tires')
    boxComponent(registry, item, sharedBicycleFurniture, 'tires', {
      width: metalThickness * 1.5,
      height: metalThickness * 0.95,
      depth: size.depth * 0.85
    }, {
      position: { x: headTop.x - size.width * 0.015, y: headTop.y + size.height * 0.11, z: 0 },
      rotation: { z: Math.PI * 0.06 }
    }, { parent: node });

    // === 6.   ===
    //   ( ，  'frame')
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: size.width * 0.30,
      height: size.height * 0.11,
      depth: size.depth * 0.26
    }, {
      position: { x: -size.width * 0.2, y: wheelRadius * 0.85, z: 0 }
    }, { parent: node });

    //   (Metal  'metal')
    cylinderComponent(registry, item, sharedBicycleFurniture, 'metal', {
      diameterTop: wheelRadius * 0.13,
      diameterBottom: wheelRadius * 0.13,
      height: size.depth * 0.46,
      tessellation: 8
    }, {
      position: bottomBracket,
      rotation: { x: Math.PI / 2 }
    }, { parent: node });

    //  Metal  (Metal  'metal')
    boxComponent(registry, item, sharedBicycleFurniture, 'metal', {
      width: size.width * 0.1,
      height: metalThickness * 0.65,
      depth: metalThickness * 0.65
    }, {
      position: { x: bottomBracket.x, y: bottomBracket.y, z: 0 },
      rotation: { z: Math.PI * 0.2 }
    }, { parent: node });

    //   (  'tires')
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, sharedBicycleFurniture, 'tires', {
        width: size.width * 0.04,
        height: metalThickness * 0.72,
        depth: size.depth * 0.2
      }, {
        position: {
          x: bottomBracket.x + side * size.width * 0.052,
          y: bottomBracket.y - wheelRadius * 0.03,
          z: side * size.depth * 0.28
        }
      }, { parent: node });
    });

    // === 7.   (  'frame') ===
    const basketBaseY = headBottom.y + size.height * 0.12; //   Y ( )
    const basketWidth = size.width * 0.2; //  
    const basketDepth = size.depth * 0.8; //  
    const basketHeight = size.height * 0.16; //  
    const basketCenterX = frontWheelCenter.x + size.width * 0.05; //   X ( )
    const basketCenterY = basketBaseY + basketHeight * 0.5; //  
    const basketWall = Math.max(0.016, size.width * 0.012); //  

    //  
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWidth,
      height: basketWall,
      depth: basketDepth
    }, {
      position: { x: basketCenterX, y: basketBaseY, z: 0 }
    }, { parent: node });

    //  
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWidth,
      height: basketHeight,
      depth: basketWall
    }, {
      position: { x: basketCenterX, y: basketCenterY, z: basketDepth / 2 - basketWall / 2 }
    }, { parent: node });

    //  
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWidth * 0.92,
      height: basketHeight,
      depth: basketWall
    }, {
      position: { x: basketCenterX, y: basketCenterY, z: -basketDepth / 2 + basketWall / 2 }
    }, { parent: node });

    //  
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWall,
      height: basketHeight,
      depth: basketDepth
    }, {
      position: { x: basketCenterX - basketWidth / 2 + basketWall / 2, y: basketCenterY, z: 0 }
    }, { parent: node });

    //  
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWall,
      height: basketHeight * 0.92,
      depth: basketDepth * 0.92
    }, {
      position: { x: basketCenterX + basketWidth / 2 - basketWall / 2, y: basketCenterY, z: 0 }
    }, { parent: node });

    //  Metal  (  ->  ，Metal  'metal')
    addBikeTube(
      registry,
      item,
      sharedBicycleFurniture,
      'metal',
      { x: headBottom.x - size.width * 0.03, y: headBottom.y + size.height * 0.03, z: 0 },
      { x: basketCenterX - basketWidth * 0.18, y: basketBaseY + basketWall * 0.5, z: 0 },
      metalThickness * 0.7,
      node,
      metalThickness * 0.7
    );

    // === 8.   (  'frame') ===
    [-1, 1].forEach((side) => {
      //   (  ->  ， ， Triangle， )
      boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
        width: wheelRadius * 0.88,
        height: metalThickness * 0.8,
        depth: metalThickness * 1.2
      }, {
        position: {
          x: rearWheelCenter.x,
          y: rearWheelCenter.y + wheelRadius * 0.88,
          z: side * size.depth * 0.06
        },
        rotation: { z: Math.PI * 0.07 }
      }, { parent: node });

      //   (  ->  ， ， )
      boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
        width: wheelRadius * 0.78,
        height: metalThickness * 0.76,
        depth: metalThickness
      }, {
        position: {
          x: frontWheelCenter.x,
          y: frontWheelCenter.y + wheelRadius * 0.86,
          z: side * size.depth * 0.04
        },
        rotation: { z: Math.PI * 0.11 }
      }, { parent: node });
    });
  }
};

export const landscapeMarbleFountain = {
  type: 'landscape_marble_fountain',
  waterControllable: true,
  name: 'Marble Fountain',
  unit: 'm',
  defaultSize: { width: 1.4, depth: 1.4, height: 1.5 },
  components: [
    { id: 'fountain-marble', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'fountain-water', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.18;
    const baseBottomH = 0.02;
    const wallT = 0.04;

    // 1.   ( )
    latheComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      shape: [
        { x: 0, y: 0 },
        { x: size.width / 2, y: 0 },
        { x: size.width / 2, y: baseH },
        { x: size.width / 2 - wallT, y: baseH },
        { x: size.width / 2 - wallT, baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2.  
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: baseH - 0.02, z: 0 } }, { parent: node });
    }

    // 3.  
    const pillarH = size.height * 0.55;
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      diameterTop: size.width * 0.18, diameterBottom: size.width * 0.28, height: pillarH, tessellation: 12
    }, { position: { x: 0, y: baseH + pillarH / 2, z: 0 } }, { parent: node });

    // 4.   ( )
    const bowlH = size.height * 0.08;
    const bowlY = baseH + pillarH * 0.75;
    const bowlD = size.width * 0.65;
    const bowlWallT = 0.03;
    latheComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      shape: [
        { x: 0, y: 0 },
        { x: bowlD / 2, y: 0 },
        { x: bowlD / 2, y: bowlH },
        { x: bowlD / 2 - bowlWallT, y: bowlH },
        { x: bowlD / 2 - bowlWallT, baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: bowlY, z: 0 } }, { parent: node });

    // 5.  
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
        diameterTop: bowlD - bowlWallT * 2, diameterBottom: bowlD - bowlWallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: bowlY + bowlH - 0.015, z: 0 } }, { parent: node });

      sphereComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
        diameter: size.width * 0.32, segments: 10
      }, { position: { x: 0, y: size.height - size.height * 0.12, z: 0 } }, { parent: node });
    }
  }
};

export const landscapeEuroPondSculpture = {
  type: 'landscape_euro_pond_sculpture',
  waterControllable: true,
  name: 'European Pond Sculpture',
  unit: 'm',
  defaultSize: { width: 1.65, depth: 1.65, height: 1.85 },
  components: [
    { id: 'pond-basin', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'pond-water', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water },
    { id: 'pond-sculpture', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.2;
    const baseBottomH = 0.02;
    const wallT = 0.04;

    // 1.   ( )
    latheComponent(registry, item, landscapeEuroPondSculpture, 'pond-basin', {
      shape: [
        { x: 0, y: 0 },
        { x: size.width / 2, y: 0 },
        { x: size.width / 2, y: basinH },
        { x: size.width / 2 - wallT, y: basinH },
        { x: size.width / 2 - wallT, baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2.  
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeEuroPondSculpture, 'pond-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 10
      }, { position: { x: 0, y: basinH - 0.02, z: 0 } }, { parent: node });
    }

    const pedH = size.height * 0.22;
    boxComponent(registry, item, landscapeEuroPondSculpture, 'pond-sculpture', {
      width: size.width * 0.25, height: pedH, depth: size.width * 0.25
    }, { position: { x: 0, y: basinH + pedH / 2, z: 0 } }, { parent: node });

    const headD = size.width * 0.22;
    sphereComponent(registry, item, landscapeEuroPondSculpture, 'pond-sculpture', {
      diameter: headD, segments: 10
    }, { position: { x: 0, y: basinH + pedH + size.height * 0.22, z: 0 } }, { parent: node });

    const torsoH = size.height * 0.32;
    cylinderComponent(registry, item, landscapeEuroPondSculpture, 'pond-sculpture', {
      diameterTop: size.width * 0.16, diameterBottom: size.width * 0.2, height: torsoH, tessellation: 12
    }, { position: { x: 0, y: basinH + pedH + torsoH / 2, z: 0 } }, { parent: node });
  }
};

export const landscapeMarbleBridge = {
  type: 'landscape_marble_bridge',
  name: 'Landscape Marble Bridge',
  unit: 'm',
  defaultSize: { width: 1.85, depth: 0.75, height: 0.7 },
  components: [
    { id: 'bridge-marble', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'bridge-railing', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone }
  ],
  build(registry, item, node, size) {
    const deckH = size.height * 0.15;
    const baseArch = boxComponent(registry, item, landscapeMarbleBridge, 'bridge-marble', {
      width: size.width, height: deckH, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.4, z: 0 } }, { parent: node });
    baseArch.rotation.z = 0;

    [-1, 1].forEach((side) => {
      const ramp = boxComponent(registry, item, landscapeMarbleBridge, 'bridge-marble', {
        width: size.width * 0.45, height: deckH * 0.9, depth: size.depth
      }, { position: { x: side * size.width * 0.28, y: size.height * 0.22, z: 0 } }, { parent: node });
      ramp.rotation.z = -side * 0.3;
    });

    [-1, 1].forEach((zSide) => {
      const zPos = zSide * (size.depth / 2 - 0.02);
      [-0.4, -0.2, 0, 0.2, 0.4].forEach((xRatio) => {
        const xPos = xRatio * size.width;
        const yPos = xRatio === 0 ? size.height * 0.48 : (Math.abs(xRatio) === 0.2 ? size.height * 0.42 : size.height * 0.28);
        boxComponent(registry, item, landscapeMarbleBridge, 'bridge-railing', {
          width: size.width * 0.04, height: size.height * 0.4, depth: size.width * 0.04
        }, { position: { x: xPos, y: yPos + size.height * 0.2, z: zPos } }, { parent: node });
      });

      const handrail = boxComponent(registry, item, landscapeMarbleBridge, 'bridge-railing', {
        width: size.width, height: size.height * 0.05, depth: size.width * 0.04
      }, { position: { x: 0, y: size.height * 0.72, z: zPos } }, { parent: node });
    });
  }
};

export const outdoorStoneChessTable = {
  type: 'outdoor_stone_chess_table',
  name: 'Outdoor Stone Chess Table',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.8, height: 0.7 },
  components: [
    { id: 'table-base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'table-top', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'chess-board', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.08;
    const pillarH = size.height * 0.78;
    const topH = size.height * 0.14;

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-base', {
      diameterTop: size.width * 0.55,
      diameterBottom: size.width * 0.65,
      height: baseH,
      tessellation: 8
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-base', {
      diameterTop: size.width * 0.35,
      diameterBottom: size.width * 0.45,
      height: pillarH * 0.5,
      tessellation: 8
    }, { position: { x: 0, y: baseH + pillarH * 0.25, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-base', {
      diameterTop: size.width * 0.42,
      diameterBottom: size.width * 0.35,
      height: pillarH * 0.5,
      tessellation: 8
    }, { position: { x: 0, y: baseH + pillarH * 0.75, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-top', {
      diameterTop: size.width,
      diameterBottom: size.width * 0.95,
      height: topH,
      tessellation: 12
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const boardSize = size.width * 0.58;
    boxComponent(registry, item, outdoorStoneChessTable, 'chess-board', {
      width: boardSize,
      height: 0.006,
      depth: boardSize
    }, { position: { x: 0, y: size.height + 0.003, z: 0 } }, { parent: node });
  }
};

export const outdoorStoneStool = {
  type: 'outdoor_stone_stool',
  name: 'Stone Stool',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.4 },
  components: [
    { id: 'stone-body', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'stone-seat', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'stone-ornament', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.9, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const d = Math.min(size.width, size.depth);
    const h = size.height;

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-body', {
      diameterTop: d * 0.8,
      diameterBottom: d * 0.85,
      height: h * 0.12,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.06, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-body', {
      diameterTop: d * 0.98,
      diameterBottom: d * 0.8,
      height: h * 0.38,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.31, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-body', {
      diameterTop: d * 0.82,
      diameterBottom: d * 0.98,
      height: h * 0.38,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.69, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-ornament', {
      diameterTop: d * 0.9,
      diameterBottom: d * 0.9,
      height: h * 0.06,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.85, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-seat', {
      diameterTop: d * 0.85,
      diameterBottom: d * 0.85,
      height: h * 0.08,
      tessellation: 12
    }, { position: { x: 0, y: h * 0.92, z: 0 } }, { parent: node });
  }
};

export const outdoorDragonBubbleStoneStool = {
  type: 'outdoor_dragon_bubble_stone_stool',
  name: 'Outdoor Dragon Bubble Stone Stool',
  unit: 'm',
  defaultSize: { width: 0.56, depth: 0.52, height: 0.58 },
  components: [
    { id: 'dragon-body', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'dragon-features', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'dragon-base', label: 'Round base', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.94, z: 0, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const baseH = h * 0.16;
    const bodyH = h * 0.72;
    const bodyCenterY = baseH + bodyH * 0.48;
    const frontZ = d * 0.39;

    // 1.   (dragon-base)
    cylinderComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-base', {
      diameterTop: w * 0.94,
      diameterBottom: w * 0.98,
      height: baseH * 0.6,
      tessellation: 12
    }, { position: { x: 0, y: baseH * 0.3, z: 0 } }, { parent: node });

    // cylinderComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-base', {
    //   diameterTop: w * 0.86,
    //   diameterBottom: w * 0.92,
    //   height: baseH * 0.1,
    //   tessellation: 12
    // }, { position: { x: 0, y: baseH * 0.6, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-base', {
      diameterTop: w * 0.76,
      diameterBottom: w * 0.84,
      height: baseH * 0.1,
      tessellation: 12
    }, { position: { x: 0, y: baseH * 0.7, z: 0 } }, { parent: node });

    // 2.   4   (dragon-body)
    [-1, 1].forEach((sideX) => {
      [-1, 1].forEach((sideZ) => {
        sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-body', {
          diameterX: w * 0.22,
          diameterY: h * 0.22,
          diameterZ: d * 0.22,
          segments: 10
        }, { position: { x: sideX * w * 0.1, y: baseH + h * 0.045, z: sideZ * d * 0.1 } }, { parent: node });
      });
    });

    // 3.  /  (dragon-body)
    sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-body', {
      diameterX: w * 0.86,
      diameterY: bodyH,
      diameterZ: d * 0.84,
      segments: 20
    }, { position: { x: 0, y: bodyCenterY, z: 0 } }, { parent: node });

    // 4.   (dragon-features)
    [-1, 1].forEach((side) => {
      //   ( 、 ， )
      coneComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.2,
        height: h * 0.2
      }, {
        position: { x: side * w * 0.3, y: baseH + bodyH * 0.92, z: frontZ * 0.3 },
        rotation: {
          x: Math.PI * 0.05,
          z: -side * Math.PI * 0.1
        }
      }, { parent: node, tessellation: 12 });

      //   ( / )
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.2,
        diameterY: h * 0.2,
        diameterZ: d * 0.2,
        segments: 8
      }, {
        position: { x: side * w * 0.3, y: baseH + bodyH * 0.80, z: frontZ *  0.3 },
        rotation: {
          x: -Math.PI * 0.1,
          y: side * Math.PI * 0.12,
          z: -side * Math.PI * 0.2
        }
      }, { parent: node });

      // 5.  
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.065,
        diameterY: w * 0.065,
        diameterZ: d * 0.03,
        segments: 8
      }, { position: { x: side * w * 0.13, y: baseH + bodyH * 0.65, z: frontZ * 0.98 } }, { parent: node });

      // 6.  
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.17,
        height: h * 0.038,
        depth: d * 0.035
      }, {
        position: { x: side * w * 0.18, y: baseH + bodyH * 0.52, z: frontZ * 0.97 },
        rotation: {
          x: Math.PI * 0.06,
          y: side * Math.PI * 0.16,
          z: side * Math.PI * 0.04
        }
      }, { parent: node });

      // 7.  
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.13,
        diameterY: h * 0.12,
        diameterZ: d * 0.025,
        segments: 8
      }, { position: { x: side * w * 0.18, y: baseH + bodyH * 0.44, z: frontZ * 0.96 }, rotation: {
          x: 0,
          y: side * Math.PI * 0.16,
          z: 0
        } }, { parent: node });
    });

    // 8.  
    [0.08, -0.04, -0.16].forEach((zPos, idx) => {
      const finHeight = h * (idx === 0 ? 0.13 : idx === 1 ? 0.11 : 0.08);
      const finWidth = w * (idx === 0 ? 0.05 : idx === 1 ? 0.045 : 0.04);
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
            width: finWidth, height: finHeight, depth: finHeight
          }, { position: { x: 0, y: baseH + bodyH * 0.95 , z: d * zPos },rotation: { x: Math.PI * 0.2 } }, { parent: node });
    });

    // 9.  /  `ω`   
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.065,
        height: h * 0.016,
        depth: d * 0.025
      }, {
        position: { x: side * w * 0.028, y: baseH + bodyH * 0.33, z: frontZ },
        rotation: {
          x: Math.PI * 0.05,
          y: side * Math.PI * 0.1,
          z: -side * Math.PI * 0.18
        }
      }, { parent: node });
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.065,
        height: h * 0.016,
        depth: d * 0.025
      }, {
        position: { x: side * w * 0.05, y: baseH + bodyH * 0.35, z: frontZ },
        rotation: {
          x: Math.PI * 0.05,
          y: side * Math.PI * 0.1,
          z: side * Math.PI * 0.4
        }
      }, { parent: node });
    });

      // 10.  
      //  
      coneComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.2,
        height: h * 0.2
      }, {
        position: { x: 0, y: baseH + bodyH * 0.6, z: -d * 0.5 },
        rotation: { x: -Math.PI * 0.3
        }
      }, { parent: node, tessellation: 12 });

      //  
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.3,
        diameterY: h * 0.4,
        diameterZ: d * 0.4,
        segments: 8
      }, {
        position: { x: 0, y: baseH + bodyH * 0.5, z: -d * 0.28 },
      }, { parent: node });

  }
};

export const outdoorPhoneBoothFurniture = {
  type: 'outdoor_phone_booth',
  name: 'Outdoor Phone Booth',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.9, height: 2.35 },
  components: [
    { id: 'booth-body', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.classicRed },
    { id: 'booth-roof', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.classicRed },
    { id: 'booth-glass', label: 'Booth glass', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water },
    { id: 'booth-base', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone },
    { id: 'booth-interior', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'booth-sign', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: {
    type: 'stand',
    getInteractionPoints(size) {
      return [
        { x: 0, y: 0, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const baseH = 0.08;
    const signH = 0.16;
    const roofH = h * 0.15;
    const bodyH = h - baseH - signH - roofH;
    const postW = 0.05;
    const barW = 0.02;

    // 1.   base
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-base', {
      width: w,
      height: baseH,
      depth: d
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyCenterY = baseH + bodyH / 2;

    // 2. 4  frame / body
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: postW,
          height: bodyH,
          depth: postW
        }, {
          position: {
            x: xSide * (w / 2 - postW / 2),
            y: bodyCenterY,
            z: zSide * (d / 2 - postW / 2)
          }
        }, { parent: node });
      });
    });

    // 3.   (Perimeter Beams)
    [-1, 1].forEach((xSide) => {
      [baseH + barW / 2, baseH + bodyH - barW / 2].forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW,
          height: barW,
          depth: d - postW * 2
        }, { position: { x: xSide * (w / 2 - postW / 2), y: yPos, z: 0 } }, { parent: node });
      });
    });
    [-1, 1].forEach((zSide) => {
      [baseH + barW / 2, baseH + bodyH - barW / 2].forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: w - postW * 2,
          height: barW,
          depth: barW
        }, { position: { x: 0, y: yPos, z: zSide * (d / 2 - postW / 2) } }, { parent: node });
      });
    });

    // 4.  Glass ( 、 、 、 )
    const glassThick = 0.01;
    //  Glass
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-glass', {
      width: w - postW * 2,
      height: bodyH - barW * 2,
      depth: glassThick
    }, { position: { x: 0, y: bodyCenterY, z: -(d / 2 - postW / 2) } }, { parent: node });
    //  Glass
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-glass', {
      width: w - postW * 2,
      height: bodyH - barW * 2,
      depth: glassThick
    }, { position: { x: 0, y: bodyCenterY, z: d / 2 - postW / 2 } }, { parent: node });
    //  Glass
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-glass', {
        width: glassThick,
        height: bodyH - barW * 2,
        depth: d - postW * 2
      }, { position: { x: xSide * (w / 2 - postW / 2), y: bodyCenterY, z: 0 } }, { parent: node });
    });

    // 5.   (Multi-pane Grid / Mullions - 4  x 6 )
    const horizYPositions = [
      baseH + bodyH * 0.20,
      baseH + bodyH * 0.36,
      baseH + bodyH * 0.52,
      baseH + bodyH * 0.68,
      baseH + bodyH * 0.84
    ];
    const vertOffsets = [-(w - postW * 2) / 3.2, 0, (w - postW * 2) / 3.2];

    //   (Front & Back Grids)
    [-1, 1].forEach((zSide) => {
      const zPos = zSide * (d / 2 - postW / 2);
      // 3  
      vertOffsets.forEach((xOff) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW,
          height: bodyH - barW * 2,
          depth: barW * 1.2
        }, { position: { x: xOff, y: bodyCenterY, z: zPos } }, { parent: node });
      });

      // 5  
      horizYPositions.forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: w - postW * 2,
          height: barW,
          depth: barW * 1.2
        }, { position: { x: 0, y: yPos, z: zPos } }, { parent: node });
      });
    });

    //   (Left & Right Grids)
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - postW / 2);
      // 2  
      vertOffsets.forEach((zOff) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW * 1.2,
          height: bodyH - barW * 2,
          depth: barW
        }, { position: { x: xPos, y: bodyCenterY, z: zOff } }, { parent: node });
      });

      // 5  
      horizYPositions.forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW * 1.2,
          height: barW,
          depth: d - postW * 2
        }, { position: { x: xPos, y: yPos, z: 0 } }, { parent: node });
      });
    });

    // 6.   (Interior & Shelf)
    const phoneW = w * 0.28;
    const phoneH = bodyH * 0.22;
    const phoneD = d * 0.15;
    const phoneZ = -(d / 2 - postW - phoneD / 2 - 0.02);

    //  
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-interior', {
      width: phoneW,
      height: phoneH,
      depth: phoneD
    }, { position: { x: 0, y: baseH + bodyH * 0.58, z: phoneZ } }, { parent: node });

    //  / 
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-interior', {
      width: w * 0.45,
      height: 0.025,
      depth: d * 0.25
    }, { position: { x: 0, y: baseH + bodyH * 0.4, z: -(d / 2 - postW - d * 0.125) } }, { parent: node });

    //  
    cylinderComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-interior', {
      diameterTop: 0.035,
      diameterBottom: 0.035,
      height: 0.15,
      tessellation: 8
    }, {
      position: { x: -phoneW * 0.55, y: baseH + bodyH * 0.58, z: phoneZ + 0.03 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    // 7.   "TELEPHONE"   (Sign)
    const signY = baseH + bodyH + signH / 2;
    //  
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
      width: w * 0.94,
      height: signH * 0.4,
      depth: d * 0.94
    }, { position: { x: 0, y: signY - 0.1, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-sign', {
      width: w * 0.88,
      height: signH,
      depth: d * 0.88
    }, { position: { x: 0, y: signY, z: 0 } }, { parent: node });

    // 8.   Roof
    const roofStartY = baseH + bodyH + signH;
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-roof', {
      width: w * 0.96,
      height: roofH * 0.35,
      depth: d * 0.96
    }, { position: { x: 0, y: roofStartY + (roofH * 0.35) / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-roof', {
      width: w * 0.78,
      height: roofH * 0.45,
      depth: d * 0.78
    }, { position: { x: 0, y: roofStartY + roofH * 0.35 + (roofH * 0.45) / 2, z: 0 } }, { parent: node });

    //   dome tip
    cylinderComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-roof', {
      diameterTop: 0.05,
      diameterBottom: 0.12,
      height: roofH * 0.2,
      tessellation: 10
    }, { position: { x: 0, y: roofStartY + roofH * 0.8 + (roofH * 0.2) / 2, z: 0 } }, { parent: node });
  }
};

export const electricScooterFurniture = {
  type: 'electric_scooter',
  name: 'Electric Scooter',
  unit: 'm',
  defaultSize: { width: 1.5, depth: 0.6, height: 1.05 },
  components: [
    { id: 'body', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'seat', label: 'Seat', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'wheels', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'light', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'trunk', label: 'Storage box', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.55, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const wheelR = Math.min(h * 0.22, w * 0.14);
    const wheelThick = d * 0.18;
    const frontWheelCenter = { x: w * 0.36, y: wheelR, z: 0 };
    const rearWheelCenter = { x: -w * 0.32, y: wheelR, z: 0 };

    // 1.   (Wheels & Tires)
    [frontWheelCenter, rearWheelCenter].forEach((center) => {
      cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
        diameterTop: wheelR * 2,
        diameterBottom: wheelR * 2,
        height: wheelThick,
        tessellation: 12
      }, {
        position: center,
        rotation: { x: Math.PI / 2 }
      }, { parent: node });

      //  / 
      cylinderComponent(registry, item, electricScooterFurniture, 'light', {
        diameterTop: wheelR * 0.8,
        diameterBottom: wheelR * 0.8,
        height: wheelThick * 1.05,
        tessellation: 10
      }, {
        position: center,
        rotation: { x: Math.PI / 2 }
      }, { parent: node });
    });

    // 2.   (Front Mudguard)
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: wheelR * 2.5,
      height: 0.04,
      depth: wheelThick * 1.5
    }, {
      position: { x: frontWheelCenter.x, y: frontWheelCenter.y + wheelR * 0.9, z: 0 }
    }, { parent: node });

    // 3.   (Footrest Floor Deck & Chassis)
    const deckH = 0.12;
    const deckY = wheelR * 0.8;
    boxComponent(registry, item, electricScooterFurniture, 'seat', {
      width: w * 0.55,
      height: deckH,
      depth: d * 0.72
    }, {
      position: { x: 0, y: deckY, z: 0 }
    }, { parent: node });

    //  /  (Kickstand)
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: deckY * 1.2,
      tessellation: 6
    }, {
      position: { x: -w * 0.05, y: deckY * 0.5, z: -d * 0.32 },
      rotation: { z: -Math.PI / 6 }
    }, { parent: node });

    // 4.   (Front Shield / Fairing)
    const shieldW = w * 0.22;
    const shieldH = h * 0.55;
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: shieldW,
      height: shieldH,
      depth: d * 0.65
    }, {
      position: { x: w * 0.26, y: deckY + shieldH / 2, z: 0 },
      rotation: { z: -Math.PI / 16 }
    }, { parent: node });

    // 5.   (Front Headlight)
    cylinderComponent(registry, item, electricScooterFurniture, 'light', {
      diameterTop: d * 0.3,
      diameterBottom: d * 0.3,
      height: 0.06,
      tessellation: 12
    }, {
      position: { x: w * 0.38, y: deckY + shieldH * 0.75, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    // 6.  /  (Handlebars & Mirrors)
    const handlebarY = deckY + shieldH + 0.08;
    //  
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.04,
      diameterBottom: 0.04,
      height: 0.16,
      tessellation: 8
    }, {
      position: { x: w * 0.22, y: handlebarY - 0.08, z: 0 }
    }, { parent: node });

    //  
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.03,
      diameterBottom: 0.03,
      height: d * 0.95,
      tessellation: 8
    }, {
      position: { x: w * 0.22, y: handlebarY, z: 0 },
      rotation: { x: Math.PI / 2 }
    }, { parent: node });

    //  /  (Small Windshield / Dashboard Cover)
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: 0.02,
      height: 0.14,
      depth: d * 0.4
    }, {
      position: { x: w * 0.25, y: handlebarY + 0.07, z: 0 }
    }, { parent: node });

    //  Circle  (Rearview Mirrors)
    [-1, 1].forEach((zSide) => {
      //  
      cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
        diameterTop: 0.012,
        diameterBottom: 0.012,
        height: 0.18,
        tessellation: 6
      }, {
        position: { x: w * 0.22, y: handlebarY + 0.09, z: zSide * d * 0.38 },
        rotation: { z: Math.PI / 8 }
      }, { parent: node });

      //  
      cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
        diameterTop: d * 0.16,
        diameterBottom: d * 0.16,
        height: 0.02,
        tessellation: 10
      }, {
        position: { x: w * 0.19, y: handlebarY + 0.18, z: zSide * d * 0.42 },
        rotation: { z: Math.PI / 2 }
      }, { parent: node });
    });

    // 7.   (Rear Body Fairing & Seat Cushion)
    const rearBodyH = h * 0.38;
    const rearBodyY = deckY + rearBodyH / 2;
    //  
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: w * 0.52,
      height: rearBodyH,
      depth: d * 0.76
    }, {
      position: { x: -w * 0.14, y: rearBodyY, z: 0 }
    }, { parent: node });

    //  
    [-1, 1].forEach((zSide) => {
      cylinderComponent(registry, item, electricScooterFurniture, 'light', {
        diameterTop: d * 0.28,
        diameterBottom: d * 0.28,
        height: 0.015,
        tessellation: 10
      }, {
        position: { x: -w * 0.14, y: rearBodyY, z: zSide * (d * 0.38 + 0.008) },
        rotation: { x: Math.PI / 2 }
      }, { parent: node });
    });

    //   (Leather Seat Cushion)
    boxComponent(registry, item, electricScooterFurniture, 'seat', {
      width: w * 0.5,
      height: 0.1,
      depth: d * 0.72
    }, {
      position: { x: -w * 0.12, y: deckY + rearBodyH + 0.05, z: 0 }
    }, { parent: node });

    // 8.  Storage  (Rear Trunk / Helmet Box)
    const trunkX = -w * 0.4;
    const trunkY = deckY + rearBodyH + 0.18;
    //  
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: w * 0.2,
      tessellation: 6
    }, {
      position: { x: -w * 0.32, y: deckY + rearBodyH + 0.06, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    //  / 
    cylinderComponent(registry, item, electricScooterFurniture, 'trunk', {
      diameterTop: d * 0.65,
      diameterBottom: d * 0.58,
      height: d * 0.5,
      tessellation: 12
    }, {
      position: { x: trunkX - d * 0.2, y: trunkY, z: 0 },
      rotation: { z: Math.PI }
    }, { parent: node });

    //   (Trunk Backrest)
    boxComponent(registry, item, electricScooterFurniture, 'wheels', {
      width: 0.04,
      height: d * 0.25,
      depth: d * 0.32
    }, {
      position: { x: trunkX + d * 0.26, y: trunkY, z: 0 }
    }, { parent: node });
  }
};

export const stepladderFurniture = {
  type: 'stepladder',
  name: 'Stepladder',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.75, height: 1.15 },
  components: [
    { id: 'steps', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'hinge', label: 'Metal hinges', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal }
  ],
  interaction: {
    type: 'stand',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.9, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const topDepth = d * 0.32;
    const botDepth = d * 0.88;
    const strutWidth = 0.035;
    const strutDepth = 0.055;

    const effectiveH = h - 0.035;
    const dz = (botDepth - topDepth) / 2;
    const inclinationAngle = Math.atan2(dz, effectiveH);
    const strutLen = Math.hypot(effectiveH, dz);

    // 1.  /  (Top Platform)
    const topH = 0.035;
    boxComponent(registry, item, stepladderFurniture, 'steps', {
      width: w * 0.92,
      height: topH,
      depth: topDepth * 1.1
    }, { position: { x: 0, y: h - topH / 2, z: 0 } }, { parent: node });

    // 2.   (  A  ， )
    const strutZMid = (topDepth / 2 + botDepth / 2) / 2 - dz * 0.1;

    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - strutWidth / 2);

      //   (Front Strut) -   +Z  ，  (-Z)  
      boxComponent(registry, item, stepladderFurniture, 'frame', {
        width: strutWidth,
        height: strutLen,
        depth: strutDepth
      }, {
        position: { x: xPos, y: effectiveH / 2, z: strutZMid },
        rotation: { x: -inclinationAngle }
      }, { parent: node });

      //   (Rear Strut) -   -Z  ，  (+Z)  
      boxComponent(registry, item, stepladderFurniture, 'frame', {
        width: strutWidth * 0.9,
        height: strutLen,
        depth: strutDepth * 0.85
      }, {
        position: { x: xPos, y: effectiveH / 2, z: -strutZMid },
        rotation: { x: inclinationAngle }
      }, { parent: node });
    });

    // 3.   (3 Tread Steps)
    const stepCount = 3;
    for (let i = 1; i <= stepCount; i += 1) {
      const progress = i / (stepCount + 1);
      const stepY = effectiveH * progress;
      const stepZ = (botDepth / 2) - dz * progress;

      boxComponent(registry, item, stepladderFurniture, 'steps', {
        width: w * 0.84,
        height: 0.026,
        depth: 0.13
      }, { position: { x: 0, y: stepY, z: stepZ } }, { parent: node });
    }

    // 4.   (Rear Strut Cross Braces)
    [0.3, 0.65].forEach((prog) => {
      const braceY = effectiveH * prog;
      const braceZ = -((botDepth / 2) - dz * prog);
      boxComponent(registry, item, stepladderFurniture, 'frame', {
        width: w * 0.86,
        height: 0.028,
        depth: 0.025
      }, { position: { x: 0, y: braceY, z: braceZ } }, { parent: node });
    });

    // 5.  Metal  (Metal Hinge Brackets)
    const hingeY = effectiveH * 0.5;
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - strutWidth / 2);
      const hingeZMid = 0;
      const hingeLen = strutZMid * 1.6;

      boxComponent(registry, item, stepladderFurniture, 'hinge', {
        width: 0.015,
        height: 0.016,
        depth: hingeLen
      }, { position: { x: xPos, y: hingeY, z: hingeZMid } }, { parent: node });

      //  
      cylinderComponent(registry, item, stepladderFurniture, 'hinge', {
        diameterTop: 0.028,
        diameterBottom: 0.028,
        height: 0.022,
        tessellation: 8
      }, {
        position: { x: xPos, y: hingeY, z: hingeZMid },
        rotation: { z: Math.PI / 2 }
      }, { parent: node });
    });

    // 6.   (Anti-slip Feet Pads)
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - strutWidth / 2);
      const footZ = botDepth / 2;
      [-footZ, footZ].forEach((zPos) => {
        boxComponent(registry, item, stepladderFurniture, 'hinge', {
          width: strutWidth * 1.15,
          height: 0.022,
          depth: strutDepth * 1.15
        }, { position: { x: xPos, y: 0.011, z: zPos } }, { parent: node });
      });
    });
  }
};

export const outdoorMahjongTableFurniture = {
  type: 'outdoor_mahjong_table',
  name: 'Outdoor Mahjong Table',
  unit: 'm',
  tabletopSurface: true,
  defaultSize: { width: 0.82, depth: 0.82, height: 0.76 },
  components: [
    { id: 'mahjong-table-frame', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.mahjongWood },
    { id: 'mahjong-table-felt', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.mahjongFelt },
    { id: 'mahjong-table-braces', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.mahjongDarkWood }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;
    const topH = Math.max(0.045, h * 0.075);
    const railW = Math.max(0.045, Math.min(w, d) * 0.075);
    const legW = Math.max(0.035, Math.min(w, d) * 0.055);
    const legInsetX = w * 0.39;
    const legInsetZ = d * 0.39;
    const legH = h - topH;

    boxComponent(registry, item, outdoorMahjongTableFurniture, 'mahjong-table-frame', {
      width: w,
      height: topH,
      depth: d
    }, { position: { x: 0, y: h - topH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, outdoorMahjongTableFurniture, 'mahjong-table-felt', {
      width: Math.max(0.01, w - railW * 2.25),
      height: Math.max(0.006, topH * 0.16),
      depth: Math.max(0.01, d - railW * 2.25)
    }, { position: { x: 0, y: h + topH * 0.08, z: 0 } }, { parent: node });

    [-1, 1].forEach((zSide) => {
      boxComponent(registry, item, outdoorMahjongTableFurniture, 'mahjong-table-frame', {
        width: w,
        height: topH * 0.55,
        depth: railW
      }, {
        position: { x: 0, y: h + topH * 0.275, z: zSide * (d / 2 - railW / 2) }
      }, { parent: node });
    });
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, outdoorMahjongTableFurniture, 'mahjong-table-frame', {
        width: railW,
        height: topH * 0.55,
        depth: Math.max(0.01, d - railW * 2)
      }, {
        position: { x: xSide * (w / 2 - railW / 2), y: h + topH * 0.275, z: 0 }
      }, { parent: node });
    });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, outdoorMahjongTableFurniture, 'mahjong-table-frame', {
          width: legW,
          height: legH,
          depth: legW
        }, {
          position: { x: xSide * legInsetX, y: legH / 2, z: zSide * legInsetZ }
        }, { parent: node });
      });
    });

    const braceH = Math.max(0.025, h * 0.035);
    const braceY = h * 0.36;
    const diagonalLength = Math.hypot(w * 0.72, d * 0.72);
    [-1, 1].forEach((direction) => {
      boxComponent(registry, item, outdoorMahjongTableFurniture, 'mahjong-table-braces', {
        width: diagonalLength,
        height: braceH,
        depth: legW * 0.72
      }, {
        position: { x: 0, y: braceY + direction * braceH * 0.65, z: 0 },
        rotation: { y: direction * Math.atan2(d, w) }
      }, { parent: node });
    });
  }
};

export const outdoorPlasticStoolFurniture = {
  type: 'outdoor_plastic_stool',
  name: 'Plastic Stool',
  unit: 'm',
  defaultSize: { width: 0.36, depth: 0.36, height: 0.45 },
  components: [
    { id: 'plastic-stool-body', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.plasticPink },
    { id: 'plastic-stool-holes', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.plasticHole }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.96, z: 0, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;
    const seatH = Math.max(0.035, h * 0.11);
    const legW = Math.max(0.035, w * 0.12);
    const legD = Math.max(0.035, d * 0.12);
    const legH = h - seatH;
    const apronH = h * 0.14;

    boxComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-body', {
      width: w * 0.9,
      height: seatH,
      depth: d * 0.9
    }, { position: { x: 0, y: h - seatH / 2, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-body', {
          width: legW,
          height: legH,
          depth: legD
        }, {
          position: {
            x: xSide * (w / 2 - legW * 0.72),
            y: legH / 2,
            z: zSide * (d / 2 - legD * 0.72)
          },
          rotation: { x: -zSide * 0.045, z: xSide * 0.045 }
        }, { parent: node });
      });
    });

    [-1, 1].forEach((zSide) => {
      boxComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-body', {
        width: w * 0.82,
        height: apronH,
        depth: legD * 0.75
      }, {
        position: { x: 0, y: h - seatH - apronH / 2, z: zSide * (d / 2 - legD) }
      }, { parent: node });
    });
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-body', {
        width: legW * 0.75,
        height: apronH,
        depth: d * 0.82
      }, {
        position: { x: xSide * (w / 2 - legW), y: h - seatH - apronH / 2, z: 0 }
      }, { parent: node });
    });

    //  ： ， 。
    const baseRailH = Math.max(0.025, h * 0.065);
    const baseRailY = baseRailH / 2;
    [-1, 1].forEach((zSide) => {
      boxComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-body', {
        width: w * 0.9,
        height: baseRailH * 1.5,
        depth: legD * 0.5
      }, {
        position: { x: 0, y: baseRailY + 0.15 * h, z: zSide * (d / 2 - legD * 0.4) }
      }, { parent: node });
    });
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-body', {
        width: legW * 0.5,
        height: baseRailH * 1.5,
        depth: d * 0.9
      }, {
        position: { x: xSide * (w / 2 - legW * 0.4), y: baseRailY + 0.15 * h, z: 0 }
      }, { parent: node });
    });

    const holeDiameter = Math.min(w, d) * 0.045;
    for (let row = -2; row <= 2; row += 1) {
      for (let column = -2; column <= 2; column += 1) {
        cylinderComponent(registry, item, outdoorPlasticStoolFurniture, 'plastic-stool-holes', {
          diameterTop: holeDiameter,
          diameterBottom: holeDiameter,
          height: Math.max(0.002, seatH * 0.035),
          tessellation: 8
        }, {
          position: {
            x: column * w * 0.095,
            y: h + seatH * 0.02,
            z: row * d * 0.095
          }
        }, { parent: node });
      }
    }
  }
};

export const outdoorMahjongPileFurniture = {
  type: 'outdoor_mahjong_pile',
  name: 'Outdoor Mahjong Pile',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.38, height: 0.065 },
  components: [
    { id: 'mahjong-tiles', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.tileIvory },
    { id: 'mahjong-red-marks', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.tileRed },
    { id: 'mahjong-green-marks', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.tileGreen },
    { id: 'mahjong-blue-marks', label: 'Component', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.tileBlue }
  ],
  build(registry, item, node, size) {
    const tileW = size.width * 0.105;
    const tileD = size.depth * 0.16;
    const tileH = size.height * 0.72;
    const layouts = [
      [-0.38, -0.28, -0.18, 0], [-0.16, -0.32, 0.12, 0], [0.08, -0.31, -0.06, 0], [0.32, -0.25, 0.2, 0],
      [-0.32, -0.02, 0.08, 0], [-0.08, -0.08, -0.28, 0], [0.18, -0.04, 0.1, 0], [0.39, 0.02, -0.16, 0],
      [-0.4, 0.24, -0.12, 0], [-0.17, 0.22, 0.24, 0], [0.06, 0.25, -0.08, 0], [0.3, 0.27, 0.16, 0],
      [-0.22, -0.02, 0.32, 1], [0.02, 0.04, -0.22, 1], [0.25, -0.08, 0.28, 1], [-0.03, 0.24, 0.06, 1],
      [0.13, 0.2, -0.16, 2], [-0.3, 0.15, 0.18, 1]
    ];
    const markIds = ['mahjong-red-marks', 'mahjong-green-marks', 'mahjong-blue-marks'];

    layouts.forEach(([xRatio, zRatio, rotation, level], index) => {
      const x = xRatio * size.width;
      const z = zRatio * size.depth;
      const y = tileH / 2 + level * tileH * 0.78;
      boxComponent(registry, item, outdoorMahjongPileFurniture, 'mahjong-tiles', {
        width: tileW,
        height: tileH,
        depth: tileD
      }, {
        position: { x, y, z },
        rotation: { y: rotation }
      }, { parent: node });

      const markId = markIds[index % markIds.length];
      if (index % 3 === 0) {
        cylinderComponent(registry, item, outdoorMahjongPileFurniture, markId, {
          diameterTop: tileW * 0.24,
          diameterBottom: tileW * 0.24,
          height: Math.max(0.0015, tileH * 0.035),
          tessellation: 8
        }, {
          position: { x, y: y + tileH / 2 + tileH * 0.018, z },
          rotation: { y: rotation }
        }, { parent: node });
      } else {
        boxComponent(registry, item, outdoorMahjongPileFurniture, markId, {
          width: tileW * 0.16,
          height: Math.max(0.0015, tileH * 0.035),
          depth: tileD * 0.56
        }, {
          position: { x, y: y + tileH / 2 + tileH * 0.018, z },
          rotation: { y: rotation }
        }, { parent: node });
      }
    });
  }
};




