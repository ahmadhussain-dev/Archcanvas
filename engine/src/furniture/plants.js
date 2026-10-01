import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const plantFurniture = {
  type: 'plant',
  name: 'Plant',
  unit: 'm',
  defaultSize: { width: 0.7, depth: 0.7, height: 1.15 },
  components: [
    { id: 'leaf-upper', label: 'Component', defaultColor: '#a8c8a0' },
    { id: 'leaf-mid', label: 'Component', defaultColor: '#88ad86' },
    { id: 'leaf-lower', label: 'Component', defaultColor: '#6f9674' },
    { id: 'trunk', label: 'Component', defaultColor: '#8a6d55' },
    { id: 'dirt', label: 'Component', defaultColor: '#6f5947' },
    { id: 'pot', label: 'Component', defaultColor: '#c99572' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.28;
    const dirtH = size.height * 0.04;
    const trunkH = size.height * 0.44;

    cylinderComponent(registry, item, plantFurniture, 'pot', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.72, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, plantFurniture, 'dirt', {
      diameterTop: size.width * 0.84, diameterBottom: size.width * 0.84, height: dirtH, tessellation: 8
    }, { position: { x: 0, y: potH - dirtH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, plantFurniture, 'trunk', {
      diameterTop: Math.max(0.015, size.width * 0.08), diameterBottom: Math.max(0.018, size.width * 0.1), height: trunkH, tessellation: 6
    }, { position: { x: 0, y: potH + trunkH / 2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, plantFurniture, 'leaf-lower', {
      diameter: size.width * 0.88, segments: 6
    }, { position: { x: -size.width * 0.08, y: potH + trunkH * 0.52, z: 0 }, scaling: { x: 1.05, y: 0.72, z: 0.92 } }, { parent: node });

    sphereComponent(registry, item, plantFurniture, 'leaf-mid', {
      diameter: size.width * 0.74, segments: 6
    }, { position: { x: size.width * 0.1, y: potH + trunkH * 0.90, z: -size.depth * 0.04 }, scaling: { x: 1.08, y: 0.76, z: 0.96 } }, { parent: node });

    sphereComponent(registry, item, plantFurniture, 'leaf-upper', {
      diameter: size.width * 0.58, segments: 6
    }, { position: { x: -size.width * 0.04, y: potH + trunkH * 1.22, z: size.depth * 0.06 }, scaling: { x: 0.96, y: 0.82, z: 1.04 } }, { parent: node });
  }
};

export const plantPotFurniture = {
  type: 'plant_pot',
  name: 'Plant Pot',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 1 },
  placeType: 'ceiling',
  components: [
    { id: 'leaf', label: 'Component', defaultColor: '#43a047' },
    { id: 'leaf-variegated', label: 'Component', defaultColor: '#aed581' },
    { id: 'pot', label: 'Component', defaultColor: '#ffffff' },
    { id: 'rope', label: 'Component', defaultColor: '#7a6652' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.18;
    const ropeH = size.height * 0.72;
    const potTopY = size.height - ropeH;

    // 1.   (Rope)
    cylinderComponent(registry, item, plantPotFurniture, 'rope', {
      diameterTop: 0.008, diameterBottom: 0.008, height: ropeH, tessellation: 6
    }, { position: { x: 0, y: size.height - ropeH / 2, z: 0 } }, { parent: node });

    // 2.   (Pot)
    cylinderComponent(registry, item, plantPotFurniture, 'pot', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.52, height: potH, tessellation: 8
    }, { position: { x: 0, y: potTopY - potH / 2, z: 0 } }, { parent: node });

    // 3.  （ ）
    const leafCount = 16;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const radiusPct = 0.35 + (i % 3) * 0.12;
      const leafLen = size.width * radiusPct;
      const isVariegated = i % 3 === 0;
      const compId = isVariegated ? 'leaf-variegated' : 'leaf';

      boxComponent(registry, item, plantPotFurniture, compId, {
        width: size.width * 0.045, height: 0.004, depth: leafLen
      }, {
        position: {
          x: Math.sin(angle) * leafLen * 0.45,
          y: potTopY - 0.01 - (i % 2) * 0.02,
          z: Math.cos(angle) * leafLen * 0.45
        },
        rotation: {
          x: Math.PI * 0.18 + (i % 3) * 0.1,
          y: angle,
          z: (i % 2 === 0 ? 0.08 : -0.08)
        }
      }, { parent: node });
    }

    // 4. 2  
    const stolons = [
      { angle: Math.PI * 0.25, len: size.height * 0.25 },
      { angle: Math.PI * 1.35, len: size.height * 0.32 }
    ];

    stolons.forEach((st) => {
      const sx = Math.sin(st.angle) * size.width * 0.38;
      const sz = Math.cos(st.angle) * size.depth * 0.38;
      const sy = potTopY - st.len / 2;

      cylinderComponent(registry, item, plantPotFurniture, 'leaf', {
        diameterTop: 0.006, diameterBottom: 0.004, height: st.len, tessellation: 6
      }, {
        position: { x: sx, y: sy, z: sz },
        rotation: { x: 0.1, y: 0, z: (sx > 0 ? -0.15 : 0.15) }
      }, { parent: node });

      sphereComponent(registry, item, plantPotFurniture, 'leaf-variegated', {
        diameter: size.width * 0.18, segments: 6
      }, {
        position: { x: sx * 1.1, y: potTopY - st.len, z: sz * 1.1 },
        scaling: { x: 1.0, y: 0.6, z: 1.0 }
      }, { parent: node });
    });
  }
};

export const cactusFurniture = {
  type: 'cactus',
  name: 'Cactus',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.4 },
  components: [
    { id: 'cactus-body', label: 'Component', defaultColor: '#4caf50' },
    { id: 'cactus-pot', label: 'Component', defaultColor: '#d7ccc8' },
    { id: 'cactus-flower', label: 'Component', defaultColor: '#ff4081' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.38;
    const bodyD = size.width * 0.86;
    const flowerD = size.width * 0.22;

    cylinderComponent(registry, item, cactusFurniture, 'cactus-pot', {
      diameterTop: size.width * 0.86, diameterBottom: size.width * 0.72, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, cactusFurniture, 'cactus-body', {
      diameter: bodyD, segments: 8
    }, { position: { x: 0, y: potH + bodyD / 2 - 0.01, z: 0 } }, { parent: node });

    sphereComponent(registry, item, cactusFurniture, 'cactus-flower', {
      diameter: flowerD, segments: 8
    }, { position: { x: 0, y: potH + bodyD - 0.02, z: 0 } }, { parent: node });
  }
};

export const monsteraFurniture = {
  type: 'monstera',
  name: 'Monstera',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.8, height: 1.2 },
  components: [
    { id: 'monstera-leaf', label: 'Component', defaultColor: '#52765c' },
    { id: 'monstera-stem', label: 'Component', defaultColor: '#71906f' },
    { id: 'monstera-pot', label: 'Component', defaultColor: '#e8dfd2' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.25;
    const stemH = size.height * 0.75;

    cylinderComponent(registry, item, monsteraFurniture, 'monstera-pot', {
      diameterTop: size.width * 0.62, diameterBottom: size.width * 0.50, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, monsteraFurniture, 'monstera-stem', {
      diameterTop: 0.012, diameterBottom: 0.016, height: stemH, tessellation: 8
    }, { position: { x: 0, y: potH + stemH / 2, z: 0 } }, { parent: node });

    const leafCount = 5;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / leafCount;
      const leafH = potH + stemH * (0.32 + i * 0.14);
      
      const subStem = cylinderComponent(registry, item, monsteraFurniture, 'monstera-stem', {
        diameterTop: 0.008, diameterBottom: 0.008, height: size.width * 0.38, tessellation: 6
      }, { position: { x: Math.cos(angle) * size.width * 0.12, y: leafH, z: Math.sin(angle) * size.width * 0.12 } }, { parent: node });
      subStem.rotation.z = Math.sin(angle) * 0.4;
      subStem.rotation.x = Math.cos(angle) * 0.4;

      const leaf = sphereComponent(registry, item, monsteraFurniture, 'monstera-leaf', {
        diameter: size.width * 0.42, segments: 6
      }, {
        position: { x: Math.cos(angle) * size.width * 0.29, y: leafH + size.height * 0.015, z: Math.sin(angle) * size.width * 0.29 },
        scaling: { x: 0.72, y: 0.08, z: 1.05 }
      }, { parent: node });
      leaf.rotation.y = -angle;
      leaf.rotation.x = 0.18 + (i % 2) * 0.08;
    }
  }
};

export const succulentFurniture = {
  type: 'succulent',
  name: 'Succulent',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.25 },
  components: [
    { id: 'succulent-leaves', label: 'Component', defaultColor: '#80cbc4' },
    { id: 'succulent-pot', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.44;
    const leafSize = size.width * 0.24;

    cylinderComponent(registry, item, succulentFurniture, 'succulent-pot', {
      diameterTop: size.width * 0.94, diameterBottom: size.width * 0.84, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const leafCount = 6;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / leafCount;
      const radius = size.width * 0.22;
      const leaf = sphereComponent(registry, item, succulentFurniture, 'succulent-leaves', {
        diameter: leafSize, segments: 8
      }, { position: { x: Math.cos(angle) * radius, y: potH + 0.01, z: Math.sin(angle) * radius } }, { parent: node });
      leaf.scaling.y = 0.6;
    }
    const centerLeaf = sphereComponent(registry, item, succulentFurniture, 'succulent-leaves', {
      diameter: leafSize * 0.8, segments: 8
    }, { position: { x: 0, y: potH + 0.02, z: 0 } }, { parent: node });
    centerLeaf.scaling.y = 0.8;
  }
};

export const bambooFurniture = {
  type: 'bamboo',
  name: 'Bamboo',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 1.35 },
  components: [
    { id: 'bamboo-stem', label: 'Component', defaultColor: '#388e3c' },
    { id: 'bamboo-vase', label: 'Glass Item', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    const vaseH = size.height * 0.35;
    const stemH = size.height * 0.94;

    cylinderComponent(registry, item, bambooFurniture, 'bamboo-vase', {
      diameterTop: size.width * 0.52, diameterBottom: size.width * 0.62, height: vaseH, tessellation: 8
    }, { position: { x: 0, y: vaseH / 2, z: 0 } }, { parent: node });

    const offsets = [
      { x: -0.015, z: -0.015, rx: 0.08, rz: -0.04, h: stemH },
      { x: 0.02, z: -0.01, rx: -0.06, rz: 0.06, h: stemH * 0.92 },
      { x: -0.005, z: 0.02, rx: 0.04, rz: -0.08, h: stemH * 0.86 }
    ];

    offsets.forEach((offset) => {
      const stem = cylinderComponent(registry, item, bambooFurniture, 'bamboo-stem', {
        diameterTop: 0.01, diameterBottom: 0.014, height: offset.h, tessellation: 8
      }, { position: { x: offset.x, y: offset.h / 2, z: offset.z } }, { parent: node });
      stem.rotation.x = offset.rx;
      stem.rotation.z = offset.rz;
    });
  }
};

export const fernFurniture = {
  type: 'fern',
  name: 'Fern',
  unit: 'm',
  defaultSize: { width: 0.7, depth: 0.7, height: 0.65 },
  components: [
    { id: 'fern-leaves', label: 'Component', defaultColor: '#1b5e20' },
    { id: 'fern-pot', label: 'Component', defaultColor: '#b0bec5' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.38;

    cylinderComponent(registry, item, fernFurniture, 'fern-pot', {
      diameterTop: size.width * 0.58, diameterBottom: size.width * 0.44, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / leafCount;
      const leafL = size.width * 0.48;
      const leafW = size.width * 0.16;

      const leaf = boxComponent(registry, item, fernFurniture, 'fern-leaves', {
        width: leafW, height: 0.006, depth: leafL
      }, { position: { x: Math.cos(angle) * leafL * 0.38, y: potH + 0.02, z: Math.sin(angle) * leafL * 0.38 } }, { parent: node });
      
      leaf.rotation.y = -angle;
      leaf.rotation.x = 0.4;
    }
  }
};

export const bonsaiFurniture = {
  type: 'bonsai',
  name: 'Bonsai',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.6, height: 0.8 },
  components: [
    { id: 'bonsai-leaves', label: 'Component', defaultColor: '#004d40' },
    { id: 'bonsai-trunk', label: 'Component', defaultColor: '#3e2723' },
    { id: 'bonsai-pot', label: 'Component', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    const potFeetH = size.height * 0.03;
    const potH = size.height * 0.15;
    const potTotalH = potFeetH + potH;

    // 1.   (4 )
    const footX = size.width * 0.38;
    const footZ = size.depth * 0.38;
    const feetPos = [
      { x: -footX, z: footZ },
      { x: footX, z: footZ },
      { x: -footX, z: -footZ },
      { x: footX, z: -footZ }
    ];
    feetPos.forEach((pos) => {
      boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
        width: size.width * 0.08, height: potFeetH, depth: size.depth * 0.08
      }, { position: { x: pos.x, y: potFeetH / 2, z: pos.z } }, { parent: node });
    });

    // 2.  
    boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
      width: size.width * 0.86, height: potH * 0.8, depth: size.depth * 0.86
    }, { position: { x: 0, y: potFeetH + potH * 0.4, z: 0 } }, { parent: node });

    // 3.  
    boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
      width: size.width * 0.90, height: potH * 0.2, depth: size.depth * 0.90
    }, { position: { x: 0, y: potFeetH + potH - (potH * 0.1), z: 0 } }, { parent: node });

    // 4.  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.3, segments: 8
    }, { position: { x: -size.width * 0.05, y: potTotalH - 0.01, z: size.depth * 0.05 }, scaling: { x: 1.2, y: 0.18, z: 1.0 } }, { parent: node });

    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.35, segments: 8
    }, { position: { x: size.width * 0.08, y: potTotalH - 0.02, z: -size.depth * 0.05 }, scaling: { x: 1.1, y: 0.14, z: 1.1 } }, { parent: node });

    // 5.  
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.06, height: size.height * 0.07, tessellation: 6
    }, { position: { x: -size.width * 0.12, y: potTotalH + size.height * 0.02, z: size.depth * 0.02 }, rotation: { x: 0.2, y: 0, z: 0.45 } }, { parent: node });

    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: size.height * 0.06, tessellation: 6
    }, { position: { x: -size.width * 0.03, y: potTotalH + size.height * 0.015, z: -size.depth * 0.04 }, rotation: { x: -0.3, y: 0.1, z: -0.35 } }, { parent: node });

    // 6.   (3 )
    const trunkH1 = size.height * 0.18;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.075, diameterBottom: size.width * 0.09, height: trunkH1, tessellation: 8
    }, { position: { x: -size.width * 0.05, y: potTotalH + trunkH1 / 2, z: 0 }, rotation: { x: 0.05, y: 0, z: -0.2 } }, { parent: node });

    const trunkH2 = size.height * 0.16;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.075, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.02, y: potTotalH + trunkH1 + trunkH2 / 2 - 0.05, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0.1, z: 0.3 } }, { parent: node });

    const trunkH3 = size.height * 0.14;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.06, height: trunkH3, tessellation: 8
    }, { position: { x: -size.width * 0.01, y: potTotalH + trunkH1 + trunkH2 + trunkH3 / 2 - 0.1, z: size.depth * 0.01 }, rotation: { x: 0.05, y: -0.1, z: -0.15 } }, { parent: node });

    // 7.  
    const branchL = size.width * 0.25;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: branchL, tessellation: 6
    }, { position: { x: -size.width * 0.12, y: potTotalH + trunkH1 + 0.08, z: size.depth * 0.03 }, rotation: { x: 0.1, y: 0, z: 1.1 } }, { parent: node });

    const rightL = size.width * 0.18;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.038, height: rightL, tessellation: 6
    }, { position: { x: size.width * 0.12, y: potTotalH + trunkH1 + trunkH2 * 0.8, z: -size.depth * 0.02 }, rotation: { x: -0.1, y: 0, z: -0.85 } }, { parent: node });

    // 8.   (6 )
    //  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: -size.width * 0.32, y: potTotalH + trunkH1 - 0.12, z: size.depth * 0.04 }, scaling: { x: 1.35, y: 0.16, z: 0.95 } }, { parent: node });

    //  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.28, segments: 8
    }, { position: { x: -size.width * 0.2, y: potTotalH + trunkH1 + trunkH2 * 0.3, z: size.depth * 0.08 }, scaling: { x: 1.25, y: 0.15, z: 0.9 } }, { parent: node });

    //  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.42, segments: 8
    }, { position: { x: -size.width * 0.02, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.05, z: size.depth * 0.04 }, scaling: { x: 1.3, y: 0.15, z: 1.0 } }, { parent: node });

    //  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: size.width * 0.1, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.12, z: -size.depth * 0.05 }, scaling: { x: 1.2, y: 0.14, z: 0.95 } }, { parent: node });

    //  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.34, segments: 8
    }, { position: { x: size.width * 0.24, y: potTotalH + trunkH1 + trunkH2 * 0.7, z: -size.depth * 0.02 }, scaling: { x: 1.3, y: 0.15, z: 0.95 } }, { parent: node });

    //  
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.30, segments: 8
    }, { position: { x: size.width * 0.0, y: potTotalH + trunkH1 + trunkH2 * 0.8, z: -size.depth * 0.2 }, scaling: { x: 1.2, y: 0.16, z: 0.9 } }, { parent: node });
  }

};

export const flowerRoseFurniture = {
  type: 'flower_rose',
  name: 'Potted Plants',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.7 },
  components: [
    { id: 'rose-pot', label: 'Component', defaultColor: '#f5f5f5' },
    { id: 'rose-stem', label: 'Component', defaultColor: '#2e7d32' },
    { id: 'rose-bloom', label: 'Component', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.28;
    const stemH = size.height * 0.58;

    cylinderComponent(registry, item, flowerRoseFurniture, 'rose-pot', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.58, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, flowerRoseFurniture, 'rose-stem', {
      diameterTop: 0.008, diameterBottom: 0.012, height: stemH, tessellation: 6
    }, { position: { x: 0, y: potH + stemH / 2, z: 0 } }, { parent: node });

    const blooms = [
      { x: 0, y: potH + stemH, z: 0, d: size.width * 0.28 },
      { x: -size.width * 0.12, y: potH + stemH * 0.86, z: size.depth * 0.08, d: size.width * 0.24 },
      { x: size.width * 0.1, y: potH + stemH * 0.78, z: -size.depth * 0.1, d: size.width * 0.22 }
    ];

    blooms.forEach((bloom) => {
      if (bloom.x !== 0) {
        const subStem = cylinderComponent(registry, item, flowerRoseFurniture, 'rose-stem', {
          diameterTop: 0.006, diameterBottom: 0.006, height: size.width * 0.22, tessellation: 6
        }, { position: { x: bloom.x * 0.5, y: bloom.y - 0.02, z: bloom.z * 0.5 } }, { parent: node });
        subStem.rotation.z = bloom.x < 0 ? 0.6 : -0.6;
      }

      sphereComponent(registry, item, flowerRoseFurniture, 'rose-bloom', {
        diameter: bloom.d, segments: 6
      }, { position: { x: bloom.x, y: bloom.y, z: bloom.z } }, { parent: node });
    });
  }
};

export const snakePlantFurniture = {
  type: 'snake_plant',
  name: 'Snake Plant',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 1.05 },
  components: [
    { id: 'snake-pot', label: 'Component', defaultColor: '#cfd8dc' },
    { id: 'snake-leaves', label: 'Component', defaultColor: '#2d5a27' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.32;

    cylinderComponent(registry, item, snakePlantFurniture, 'snake-pot', {
      diameterTop: size.width * 0.84, diameterBottom: size.width * 0.84, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const leaves = [
      { ry: 0, h: size.height * 0.64, w: size.width * 0.24, x: -size.width * 0.1, z: 0, rx: 0.1, rz: 0.05 },
      { ry: Math.PI * 0.4, h: size.height * 0.58, w: size.width * 0.22, x: size.width * 0.08, z: -size.width * 0.06, rx: -0.08, rz: -0.06 },
      { ry: Math.PI * 0.8, h: size.height * 0.68, w: size.width * 0.24, x: size.width * 0.05, z: size.width * 0.08, rx: 0.05, rz: -0.1 },
      { ry: Math.PI * 1.2, h: size.height * 0.52, w: size.width * 0.20, x: -size.width * 0.08, z: -size.width * 0.08, rx: -0.1, rz: 0.08 },
      { ry: Math.PI * 1.6, h: size.height * 0.48, w: size.width * 0.18, x: 0, z: -size.width * 0.1, rx: -0.05, rz: 0.05 }
    ];

    leaves.forEach((l) => {
      const leaf = boxComponent(registry, item, snakePlantFurniture, 'snake-leaves', {
        width: l.w, height: l.h, depth: size.width * 0.038
      }, { position: { x: l.x, y: potH + l.h / 2 - 0.02, z: l.z } }, { parent: node });
      
      leaf.rotation.y = l.ry;
      leaf.rotation.x = l.rx;
      leaf.rotation.z = l.rz;
    });
  }
};

export const sunflowerPotFurniture = {
  type: 'sunflower_pot',
  name: 'Sunflower Pot',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 0.9 },
  components: [
    { id: 'pot', label: 'Component', defaultColor: '#c37960' },
    { id: 'stem', label: 'Component', defaultColor: '#4c9f50' },
    { id: 'flower', label: 'Component', defaultColor: '#ffd700' },
    { id: 'center', label: 'Component', defaultColor: '#5c4033' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, sunflowerPotFurniture, 'pot', {
      diameterTop: size.width * 0.45, diameterBottom: size.width * 0.35, height: size.height * 0.28
    }, { position: { x: 0, y: size.height * 0.14, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, sunflowerPotFurniture, 'stem', {
      diameterTop: 0.02, diameterBottom: 0.02, height: size.height * 0.55
    }, { position: { x: 0, y: size.height * 0.55, z: 0 } }, { parent: node });

    const flowerD = size.width * 0.8;
    cylinderComponent(registry, item, sunflowerPotFurniture, 'flower', {
      diameterTop: flowerD, diameterBottom: flowerD, height: 0.02
    }, { position: { x: 0, y: size.height * 0.88, z: size.depth * 0.08 } }, { parent: node });

    const coreD = size.width * 0.35;
    cylinderComponent(registry, item, sunflowerPotFurniture, 'center', {
      diameterTop: coreD, diameterBottom: coreD, height: 0.025
    }, { position: { x: 0, y: size.height * 0.88, z: size.depth * 0.095 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.endsWith('_flower') || m.name.endsWith('_center')) {
        m.rotation.x = Math.PI * 0.42;
      }
    });
  }
};

export const pachiraTreeFurniture = {
  type: 'pachira_tree',
  name: 'Pachira Tree',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.55, height: 0.85 },
  components: [
    { id: 'pot', label: 'Component', defaultColor: '#8b5a2b' },
    { id: 'trunk', label: 'Component', defaultColor: '#5c3818' },
    { id: 'leaves', label: 'Component', defaultColor: '#55a846' },
    { id: 'coin', label: 'Component', defaultColor: '#f7c873' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    // 1.   (Pot)
    const potH = h * 0.32;
    const potTopR = w * 0.32;
    const potBotR = w * 0.24;

    //  
    cylinderComponent(registry, item, pachiraTreeFurniture, 'pot', {
      diameterTop: potTopR * 2,
      diameterBottom: potBotR * 2,
      height: potH * 0.85,
      tessellation: 8
    }, { position: { x: 0, y: potH * 0.425, z: 0 } }, { parent: node });

    //   (Rim)
    cylinderComponent(registry, item, pachiraTreeFurniture, 'pot', {
      diameterTop: potTopR * 2.12,
      diameterBottom: potTopR * 2.05,
      height: potH * 0.2,
      tessellation: 8
    }, { position: { x: 0, y: potH * 0.9, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, pachiraTreeFurniture, 'trunk', {
      diameterTop: potTopR * 1.95,
      diameterBottom: potTopR * 1.95,
      height: 0.02,
      tessellation: 8
    }, { position: { x: 0, y: potH * 0.96, z: 0 } }, { parent: node });

    // 2.  /  (Trunk / Spring)
    const trunkH = h * 0.25;
    const trunkY = potH + trunkH / 2;
    //  
    cylinderComponent(registry, item, pachiraTreeFurniture, 'trunk', {
      diameterTop: 0.04,
      diameterBottom: 0.05,
      height: trunkH,
      tessellation: 8
    }, { position: { x: 0, y: trunkY, z: 0 } }, { parent: node });

    // Metal /  (Coiled Spring)
    for (let i = 0; i < 4; i += 1) {
      const spY = potH + trunkH * (0.2 + i * 0.2);
      cylinderComponent(registry, item, pachiraTreeFurniture, 'coin', {
        diameterTop: 0.075 + (i % 2 === 0 ? 0.015 : 0),
        diameterBottom: 0.075 + (i % 2 === 0 ? 0.015 : 0),
        height: 0.018,
        tessellation: 8
      }, { position: { x: 0, y: spY, z: 0 } }, { parent: node });
    }

    // 3.   (Cloud Canopy)
    const canopyCenterY = potH + trunkH + h * 0.22;
    const canopyR = w * 0.42;

    //  
    sphereComponent(registry, item, pachiraTreeFurniture, 'leaves', {
      diameterX: canopyR * 2,
      diameterY: canopyR * 1.5,
      diameterZ: canopyR * 2,
      segments: 8
    }, { position: { x: 0, y: canopyCenterY, z: 0 } }, { parent: node });

    //  /  (Bulging Cloud Puffs)
    const cloudOffsets = [
      { x: -w * 0.15, y: canopyCenterY + 0.03, z: 0, scale: 0.8 },
      { x: w * 0.15, y: canopyCenterY + 0.03, z: 0, scale: 0.8 },
      { x: 0, y: canopyCenterY + 0.05, z: d * 0.14, scale: 0.75 },
      { x: 0, y: canopyCenterY + 0.05, z: -d * 0.14, scale: 0.75 },
      { x: 0, y: canopyCenterY + h * 0.12, z: 0, scale: 0.7 }
    ];

    cloudOffsets.forEach((conf) => {
      sphereComponent(registry, item, pachiraTreeFurniture, 'leaves', {
        diameterX: canopyR * 2 * conf.scale,
        diameterY: canopyR * 1.4 * conf.scale,
        diameterZ: canopyR * 2 * conf.scale,
        segments: 8
      }, { position: { x: conf.x, y: conf.y, z: conf.z } }, { parent: node });
    });

    // 4.   (Embedded Gold Coins)
    const coinR = 0.045;
    const coinThick = 0.012;
    const embeddedCoins = [
      { pos: { x: -w * 0.22, y: canopyCenterY + 0.08, z: d * 0.22 }, rot: { x: -Math.PI / 6, y: -Math.PI / 4, z: 0 } },
      { pos: { x: 0, y: canopyCenterY + 0.16, z: d * 0.28 }, rot: { x: -Math.PI / 8, y: 0, z: 0 } },
      { pos: { x: w * 0.22, y: canopyCenterY + 0.08, z: d * 0.22 }, rot: { x: -Math.PI / 6, y: Math.PI / 4, z: 0 } },
      { pos: { x: 0, y: canopyCenterY + 0.24, z: 0 }, rot: { x: 0, y: 0, z: 0 } }
    ];

    embeddedCoins.forEach((c) => {
      //  
      cylinderComponent(registry, item, pachiraTreeFurniture, 'coin', {
        diameterTop: coinR * 2,
        diameterBottom: coinR * 2,
        height: coinThick,
        tessellation: 8
      }, { position: c.pos, rotation: c.rot }, { parent: node });

      //  
      boxComponent(registry, item, pachiraTreeFurniture, 'trunk', {
        width: coinR * 0.65,
        height: coinThick * 1.1,
        depth: coinR * 0.65
      }, { position: c.pos, rotation: c.rot }, { parent: node });
    });

    // 5.   (Hanging Gold Coin Charms)
    const hangingCoins = [
      { x: -w * 0.28, z: d * 0.15, chainLen: 0.12 },
      { x: -w * 0.12, z: d * 0.28, chainLen: 0.15 },
      { x: w * 0.12, z: d * 0.28, chainLen: 0.14 },
      { x: w * 0.28, z: d * 0.15, chainLen: 0.11 },
      { x: 0, z: -d * 0.26, chainLen: 0.13 }
    ];

    hangingCoins.forEach((hc) => {
      const topY = canopyCenterY - canopyR * 0.4;
      const bottomY = topY - hc.chainLen;

      //  
      cylinderComponent(registry, item, pachiraTreeFurniture, 'coin', {
        diameterTop: 0.008,
        diameterBottom: 0.008,
        height: hc.chainLen,
        tessellation: 6
      }, { position: { x: hc.x, y: topY - hc.chainLen / 2, z: hc.z } }, { parent: node });

      //  
      cylinderComponent(registry, item, pachiraTreeFurniture, 'coin', {
        diameterTop: coinR * 1.6,
        diameterBottom: coinR * 1.6,
        height: coinThick * 0.8,
        tessellation: 8
      }, {
        position: { x: hc.x, y: bottomY, z: hc.z },
        rotation: { x: Math.PI / 2 }
      }, { parent: node });

      //  
      boxComponent(registry, item, pachiraTreeFurniture, 'trunk', {
        width: coinR * 0.55,
        height: coinThick * 0.9,
        depth: coinR * 0.55
      }, {
        position: { x: hc.x, y: bottomY, z: hc.z },
        rotation: { x: Math.PI / 2 }
      }, { parent: node });
    });
  }
};

export const lavenderPotFurniture = {
  type: 'lavender_pot',
  name: 'Lavender Pot',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.5 },
  components: [
    { id: 'pot', label: 'Component', defaultColor: '#e0dcd3' },
    { id: 'stem', label: 'Component', defaultColor: '#43a047' },
    { id: 'flower', label: 'Component', defaultColor: '#ba68c8' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, lavenderPotFurniture, 'pot', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.35, height: size.height * 0.35
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lavenderPotFurniture, 'stem', {
      diameterTop: size.width * 0.65, diameterBottom: size.width * 0.45, height: size.height * 0.28
    }, { position: { x: 0, y: size.height * 0.45, z: 0 } }, { parent: node });

    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      cylinderComponent(registry, item, lavenderPotFurniture, 'flower', {
        diameterTop: 0.015, diameterBottom: 0.015, height: size.height * 0.4
      }, { position: { x: i * 0.035, y: size.height * 0.75, z: (i % 2 === 0 ? 0.02 : -0.02) } }, { parent: node });
    }
  }
};

export const tulipVaseFurniture = {
  type: 'tulip_vase',
  name: 'Tulip Vase',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.6 },
  components: [
    { id: 'glass', label: 'Component', defaultColor: '#ffffff' },
    { id: 'stem', label: 'Component', defaultColor: '#81c784' },
    { id: 'flower', label: 'Component', defaultColor: '#f48fb1' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, tulipVaseFurniture, 'glass', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.45, height: size.height * 0.48
    }, { position: { x: 0, y: size.height * 0.24, z: 0 } }, { parent: node });

    const offsets = [
      { x: -0.04, y: 0.65, z: 0.02, rx: -0.15, ry: 0 },
      { x: 0.04, y: 0.68, z: -0.02, rx: 0.15, ry: 0.2 },
      { x: 0, y: 0.75, z: 0, rx: 0, ry: 0 }
    ];

    offsets.forEach(off => {
      const st = cylinderComponent(registry, item, tulipVaseFurniture, 'stem', {
        diameterTop: 0.012, diameterBottom: 0.012, height: size.height * 0.45
      }, { position: { x: off.x, y: size.height * 0.48, z: off.z } }, { parent: node });
      st.rotation.x = off.rx;

      const fl = sphereComponent(registry, item, tulipVaseFurniture, 'flower', {
        diameterX: 0.06, diameterY: 0.08, diameterZ: 0.06
      }, { position: { x: off.x * 1.5, y: size.height * 0.88, z: off.z * 1.5 } }, { parent: node });
      fl.rotation.x = off.rx;
    });
  }
};

export const orchidPotFurniture = {
  type: 'orchid_pot',
  name: 'Orchid Pot',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 0.7 },
  components: [
    { id: 'flower', label: 'Component', defaultColor: '#e91e63' },
    { id: 'orchid-leaves', label: 'Component', defaultColor: '#2e7d32' },
    { id: 'stem', label: 'Component', defaultColor: '#4caf50' },
    { id: 'flower-core', label: 'Component', defaultColor: '#fff59d' },
    { id: 'pot', label: 'Component', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.3;
    const potCenterY = potH / 2;

    // 1.  
    cylinderComponent(registry, item, orchidPotFurniture, 'pot', {
      diameterTop: size.width * 0.55, diameterBottom: size.width * 0.4, height: potH
    }, { position: { x: 0, y: potCenterY, z: 0 } }, { parent: node });

    // 2.  （ ， ）
    const baseLeaves = [
      { angle: 0, len: size.width * 0.38, w: size.width * 0.18, rotX: 0.35 },
      { angle: Math.PI * 0.8, len: size.width * 0.4, w: size.width * 0.19, rotX: 0.3 },
      { angle: Math.PI * 1.5, len: size.width * 0.36, w: size.width * 0.17, rotX: 0.4 },
      { angle: Math.PI * 0.4, len: size.width * 0.32, w: size.width * 0.15, rotX: 0.25 }
    ];

    baseLeaves.forEach((bl) => {
      const lx = Math.sin(bl.angle) * bl.len * 0.45;
      const lz = Math.cos(bl.angle) * bl.len * 0.45;
      const ly = potH + 0.015;

      const leafMesh = sphereComponent(registry, item, orchidPotFurniture, 'orchid-leaves', {
        diameter: bl.len, segments: 7
      }, {
        position: { x: lx, y: ly, z: lz },
        scaling: { x: bl.w / bl.len, y: 0.12, z: 1.0 }
      }, { parent: node });

      leafMesh.rotation.y = bl.angle;
      leafMesh.rotation.x = bl.rotX;
    });

    // 3.  
    const stemH = size.height * 0.55;
    const branch = cylinderComponent(registry, item, orchidPotFurniture, 'stem', {
      diameterTop: 0.008, diameterBottom: 0.014, height: stemH, tessellation: 6
    }, { position: { x: -size.width * 0.05, y: potH + stemH / 2, z: 0 } }, { parent: node });
    branch.rotation.z = Math.PI * 0.12;

    // 4.  
    for (let i = 0; i < 5; i++) {
      const fx = (i * 0.045 - size.width * 0.05);
      const fy = potH + stemH * 0.45 + i * size.height * 0.06;
      const fz = (i % 2 === 0 ? 0.04 : -0.04);
      const flowerRadius = size.width * 0.09;

      //  
      sphereComponent(registry, item, orchidPotFurniture, 'flower', {
        diameter: flowerRadius * 2, segments: 7
      }, {
        position: { x: fx, y: fy, z: fz },
        scaling: { x: 1.1, y: 0.85, z: 0.35 }
      }, { parent: node });

      //  
      sphereComponent(registry, item, orchidPotFurniture, 'flower-core', {
        diameter: flowerRadius * 0.6, segments: 6
      }, { position: { x: fx, y: fy, z: fz + 0.015 } }, { parent: node });
    }
  }
};

export const dwarfMonsteraFurniture = {
  type: 'dwarf_monstera',
  name: 'Dwarf Monstera',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.5, height: 0.6 },
  components: [
    { id: 'leaves', label: 'Component', defaultColor: '#5f8068' },
    { id: 'pot', label: 'Component', defaultColor: '#c9c1b5' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, dwarfMonsteraFurniture, 'pot', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.4, height: size.height * 0.35, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    angles.forEach((ang, idx) => {
      const leaf = sphereComponent(registry, item, dwarfMonsteraFurniture, 'leaves', {
        diameter: size.width * 0.42, segments: 6
      }, { position: { x: Math.sin(ang) * size.width * 0.2, y: size.height * 0.56 + idx * size.height * 0.025, z: Math.cos(ang) * size.depth * 0.2 }, scaling: { x: 0.7, y: 0.08, z: 1 } }, { parent: node });
      leaf.rotation.y = ang;
      leaf.rotation.x = Math.PI * 0.12;
    });
  }
};

export const largeCactusFurniture = {
  type: 'large_cactus',
  name: 'Large Cactus',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 1.2 },
  components: [
    { id: 'pot', label: 'Component', defaultColor: '#bcaaa4' },
    { id: 'body', label: 'Component', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, largeCactusFurniture, 'pot', {
      diameterTop: size.width * 0.52, diameterBottom: size.width * 0.4, height: size.height * 0.22
    }, { position: { x: 0, y: size.height * 0.11, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.09, diameterBottom: 0.09, height: size.height * 0.72
    }, { position: { x: 0, y: size.height * 0.55, z: 0 } }, { parent: node });

    const side1 = cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.05, diameterBottom: 0.05, height: size.height * 0.25
    }, { position: { x: size.width * 0.18, y: size.height * 0.62, z: 0 } }, { parent: node });
    side1.rotation.z = -Math.PI * 0.12;

    const side2 = cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.05, diameterBottom: 0.05, height: size.height * 0.2
    }, { position: { x: -size.width * 0.16, y: size.height * 0.5, z: size.depth * 0.05 } }, { parent: node });
    side2.rotation.z = Math.PI * 0.12;
  }
};

export const eucalyptusVaseFurniture = {
  type: 'eucalyptus_vase',
  name: 'Eucalyptus Vase',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.8 },
  components: [
    { id: 'glass', label: 'Component', defaultColor: '#80deea' },
    { id: 'leaves', label: 'Component', defaultColor: '#546e7a' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, eucalyptusVaseFurniture, 'glass', {
      diameterTop: size.width * 0.3, diameterBottom: size.width * 0.45, height: size.height * 0.35
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    for (let c = -1; c <= 1; c += 2) {
      const stem = cylinderComponent(registry, item, eucalyptusVaseFurniture, 'leaves', {
        diameterTop: 0.01, diameterBottom: 0.015, height: size.height * 0.7
      }, { position: { x: c * 0.04, y: size.height * 0.5, z: 0 } }, { parent: node });
      stem.rotation.z = -c * Math.PI * 0.08;

      for (let l = 0; l < 5; l++) {
        sphereComponent(registry, item, eucalyptusVaseFurniture, 'leaves', {
          diameterX: 0.07, diameterY: 0.01, diameterZ: 0.07
        }, { position: { x: c * (0.04 + l * 0.035), y: size.height * 0.45 + l * 0.08, z: (l % 2 === 0 ? 0.015 : -0.015) } }, { parent: node });
      }
    }
  }
};

export const cherryBlossomBonsaiFurniture = {
  type: 'cherry_blossom_bonsai',
  name: 'Cherry Blossom Bonsai',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.65 },
  components: [
    { id: 'flower', label: 'Component', defaultColor: '#ff8a80' },
    { id: 'trunk', label: 'Component', defaultColor: '#5d4037' },
    { id: 'pot', label: 'Component', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, cherryBlossomBonsaiFurniture, 'pot', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.5, height: size.height * 0.2
    }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });

    const tr = cylinderComponent(registry, item, cherryBlossomBonsaiFurniture, 'trunk', {
      diameterTop: 0.035, diameterBottom: 0.055, height: size.height * 0.5
    }, { position: { x: -size.width * 0.08, y: size.height * 0.32, z: 0 } }, { parent: node });
    tr.rotation.z = Math.PI * 0.15;

    sphereComponent(registry, item, cherryBlossomBonsaiFurniture, 'flower', {
      diameterX: size.width * 0.42, diameterY: size.width * 0.35, diameterZ: size.width * 0.42
    }, { position: { x: size.width * 0.15, y: size.height * 0.62, z: 0.03 } }, { parent: node });

    sphereComponent(registry, item, cherryBlossomBonsaiFurniture, 'flower', {
      diameterX: size.width * 0.32, diameterY: size.width * 0.28, diameterZ: size.width * 0.32
    }, { position: { x: -size.width * 0.15, y: size.height * 0.52, z: -0.03 } }, { parent: node });
  }
};

export const hangingIvyFurniture = {
  type: 'hanging_ivy',
  name: 'Hanging Ivy',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.25, height: 0.6 },
  placeType: 'wall',
  components: [
    { id: 'pot', label: 'Component', defaultColor: '#d7ccc8' },
    { id: 'leaves', label: 'Component', defaultColor: '#4caf50' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, hangingIvyFurniture, 'pot', {
      width: size.width * 0.48, height: size.height * 0.2, depth: size.depth * 0.45
    }, { position: { x: 0, y: size.height * 0.7, z: size.depth * 0.2 } }, { parent: node });

    for (let c = -1; c <= 1; c++) {
      boxComponent(registry, item, hangingIvyFurniture, 'leaves', {
        width: size.width * 0.1, height: size.height * 0.55 - Math.abs(c) * 0.08, depth: 0.015
      }, { position: { x: c * size.width * 0.14, y: size.height * 0.35, z: size.depth * 0.3 } }, { parent: node });
    }
  }
};

export const landscapeWelcomeBonsai = {
  type: 'landscape_welcome_bonsai',
  name: 'Landscape Welcome Bonsai',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.5, height: 0.9 },
  components: [
    { id: 'bonsai-pot', label: 'Component', defaultColor: '#4e342e' },
    { id: 'bonsai-stone', label: 'Component', defaultColor: '#37474f' },
    { id: 'bonsai-tree', label: 'Component', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const potFeetH = size.height * 0.03;
    const potH = size.height * 0.15;
    const potTotalH = potFeetH + potH;

    const footX = size.width * 0.38;
    const footZ = size.depth * 0.38;
    const feetPos = [
      { x: -footX, z: footZ },
      { x: footX, z: footZ },
      { x: -footX, z: -footZ },
      { x: footX, z: -footZ }
    ];
    feetPos.forEach((pos) => {
      boxComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-pot', {
        width: size.width * 0.08, height: potFeetH, depth: size.depth * 0.08
      }, { position: { x: pos.x, y: potFeetH / 2, z: pos.z } }, { parent: node });
    });

    boxComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-pot', {
      width: size.width * 0.86, height: potH * 0.8, depth: size.depth * 0.86
    }, { position: { x: 0, y: potFeetH + potH * 0.4, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-pot', {
      width: size.width * 0.90, height: potH * 0.2, depth: size.depth * 0.90
    }, { position: { x: 0, y: potFeetH + potH - (potH * 0.1), z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameter: size.width * 0.8, segments: 8
    }, { position: { x: 0, y: potTotalH, z: 0 }, scaling: { x: 1.05, y: 0.12, z: 1.05 } }, { parent: node });

    const stoneD1 = size.width * 0.34;
    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-stone', {
      diameter: stoneD1, segments: 6
    }, { 
      position: { x: -size.width * 0.15, y: potTotalH + stoneD1 * 0.6, z: size.depth * 0.02 }, 
      scaling: { x: 0.65, y: 1.6, z: 0.8 }, 
      rotation: { x: 0.12, y: 0.25, z: 0.08 } 
    }, { parent: node });

    const stoneD2 = size.width * 0.26;
    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-stone', {
      diameter: stoneD2, segments: 6
    }, { 
      position: { x: -size.width * 0.16, y: potTotalH + stoneD1 * 1.0, z: -size.depth * 0.04 }, 
      scaling: { x: 1.25, y: 0.85, z: 0.65 }, 
      rotation: { x: -0.22, y: -0.3, z: -0.38 } 
    }, { parent: node });

    const stoneD3 = size.width * 0.22;
    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-stone', {
      diameter: stoneD3, segments: 5
    }, { 
      position: { x: -size.width * 0.06, y: potTotalH + stoneD3 * 0.5, z: size.depth * 0.08 }, 
      scaling: { x: 1.4, y: 0.58, z: 1.15 }, 
      rotation: { x: 0.38, y: 0.75, z: -0.18 } 
    }, { parent: node });

    const trunkH1 = size.height * 0.2;
    const trunkH2 = size.height * 0.18;
    const trunkH3 = size.height * 0.16;

    cylinderComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.065, height: trunkH1, tessellation: 8
    }, { position: { x: size.width * 0.05, y: potTotalH + trunkH1 / 2, z: size.depth * 0.02 }, rotation: { x: -0.12, y: 0.05, z: -0.55 } }, { parent: node });

    cylinderComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.045, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.15, y: potTotalH + trunkH1 + trunkH2 / 2 - size.height * 0.06, z: -size.depth * 0.02 }, rotation: { x: 0.08, y: -0.15, z: -0.82 } }, { parent: node });

    cylinderComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameterTop: size.width * 0.022, diameterBottom: size.width * 0.035, height: trunkH3, tessellation: 6
    }, { position: { x: size.width * 0.24, y: potTotalH + trunkH1 + trunkH2 - size.height * 0.11, z: size.depth * 0.02 }, rotation: { x: -0.18, y: 0.2, z: -0.32 } }, { parent: node });

    const cloudNeedles = [
      { x: 0.24, y: 0.46, z: 0.06, sizeMult: 0.36, scale: { x: 1.35, y: 0.16, z: 0.9 } },
      { x: 0.36, y: 0.32, z: -0.06, sizeMult: 0.3, scale: { x: 1.3, y: 0.15, z: 0.85 } },
      { x: 0.17, y: 0.36, z: 0.08, sizeMult: 0.32, scale: { x: 1.25, y: 0.15, z: 0.95 } },
      { x: -0.02, y: 0.34, z: 0.12, sizeMult: 0.24, scale: { x: 1.2, y: 0.13, z: 0.85 } },
      { x: 0.1, y: 0.42, z: -0.16, sizeMult: 0.28, scale: { x: 1.25, y: 0.15, z: 0.9 } }
    ];

    cloudNeedles.forEach((cloud) => {
      sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
        diameter: size.width * cloud.sizeMult, segments: 8
      }, {
        position: { x: cloud.x * size.width, y: potTotalH + cloud.y * size.height, z: cloud.z * size.depth },
        scaling: { x: cloud.scale.x, y: cloud.scale.y, z: cloud.scale.z }
      }, { parent: node });
    });
  }

};

export const landscapePineBonsai = {
  type: 'landscape_pine_bonsai',
  name: 'Landscape Pine Bonsai',
  unit: 'm',
  defaultSize: { width: 1.1, depth: 0.8, height: 1.4 },
  components: [
    { id: 'pine-pot', label: 'Component', defaultColor: '#5d4037' },
    { id: 'pine-trunk', label: 'Component', defaultColor: '#4e342e' },
    { id: 'pine-leaves', label: 'Component', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const potFeetH = size.height * 0.025;
    const potH = size.height * 0.12;
    const potTotalH = potFeetH + potH;

    // 1.   (4 )
    const footX = size.width * 0.28;
    const footZ = size.depth * 0.20;
    const feetPositions = [
      { x: -footX, z: footZ },
      { x: footX, z: footZ },
      { x: -footX, z: -footZ },
      { x: footX, z: -footZ }
    ];
    feetPositions.forEach((pos) => {
      boxComponent(registry, item, landscapePineBonsai, 'pine-pot', {
        width: size.width * 0.08, height: potFeetH, depth: size.depth * 0.08
      }, { position: { x: pos.x, y: potFeetH / 2, z: pos.z } }, { parent: node });
    });

    // 2.   ( )
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-pot', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.72, height: potH * 0.8, tessellation: 8
    }, { position: { x: 0, y: potFeetH + potH * 0.4, z: 0 }, scaling: { x: 1.0, y: 1.0, z: 0.7 } }, { parent: node });

    // 3.   ( )
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-pot', {
      diameterTop: size.width * 0.81, diameterBottom: size.width * 0.81, height: potH * 0.2, tessellation: 8
    }, { position: { x: 0, y: potFeetH + potH - (potH * 0.1), z: 0 }, scaling: { x: 1.0, y: 1.0, z: 0.7 } }, { parent: node });

    // 4.   ( )
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.35, segments: 8
    }, { position: { x: -size.width * 0.08, y: potTotalH - 0.01, z: size.depth * 0.04 }, scaling: { x: 1.2, y: 0.2, z: 1.0 } }, { parent: node });

    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.40, segments: 8
    }, { position: { x: size.width * 0.08, y: potTotalH - 0.02, z: -size.depth * 0.02 }, scaling: { x: 1.1, y: 0.15, z: 1.1 } }, { parent: node });

    // 5.   (3 )
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.06, height: size.height * 0.08, tessellation: 6
    }, { position: { x: -size.width * 0.13, y: potTotalH + size.height * 0.02, z: size.depth * 0.02 }, rotation: { x: 0.2, y: 0, z: 0.5 } }, { parent: node });

    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.05, height: size.height * 0.08, tessellation: 6
    }, { position: { x: -size.width * 0.03, y: potTotalH + size.height * 0.015, z: -size.depth * 0.04 }, rotation: { x: -0.3, y: 0.2, z: -0.4 } }, { parent: node });

    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: size.height * 0.07, tessellation: 6
    }, { position: { x: -size.width * 0.07, y: potTotalH + size.height * 0.015, z: size.depth * 0.06 }, rotation: { x: 0.6, y: -0.3, z: 0.1 } }, { parent: node });

    // 6.   ( )
    const trunkH1 = size.height * 0.15;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.09, diameterBottom: size.width * 0.11, height: trunkH1, tessellation: 6
    }, { position: { x: -size.width * 0.05, y: potTotalH + trunkH1 / 2, z: 0 }, rotation: { x: 0.05, y: 0, z: -0.15 } }, { parent: node });

    const trunkH2 = size.height * 0.14;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.075, diameterBottom: size.width * 0.09, height: trunkH2, tessellation: 8
    }, { position: { x: 0, y: potTotalH + trunkH1 + trunkH2 / 2 - 0.05, z: size.depth * 0.01 }, rotation: { x: -0.05, y: 0.1, z: -0.38 } }, { parent: node });

    const trunkH3 = size.height * 0.13;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.07, height: trunkH3, tessellation: 8
    }, { position: { x: size.width * 0.07, y: potTotalH + trunkH1 + trunkH2 + trunkH3 / 2 - 0.08, z: size.depth * 0.02 }, rotation: { x: 0.05, y: -0.1, z: 0.22 } }, { parent: node });

    const trunkH4 = size.height * 0.12;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.05, height: trunkH4, tessellation: 8
    }, { position: { x: size.width * 0.04, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4 / 2 - 0.10, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0, z: 0.1 } }, { parent: node });

    // 7.  
    //   1
    const branchL1 = size.width * 0.26;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.055, height: branchL1, tessellation: 6
    }, { position: { x: -size.width * 0.14, y: potTotalH + trunkH1 + 0.10, z: size.depth * 0.03 }, rotation: { x: 0.1, y: 0, z: 1.15 } }, { parent: node });

    //   2 ( )
    const branchL2 = size.width * 0.24;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.04, height: branchL2, tessellation: 6
    }, { position: { x: -size.width * 0.32, y: potTotalH + trunkH1 - 0.22, z: size.depth * 0.05 }, rotation: { x: -0.1, y: -0.1, z: 1.4 } }, { parent: node });

    //  
    const branchL3 = size.width * 0.15;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: 0.015, diameterBottom: 0.022, height: branchL3, tessellation: 4
    }, { position: { x: -size.width * 0.24, y: potTotalH + trunkH1 - 0.05, z: -size.depth * 0.08 }, rotation: { x: -0.7, y: -0.2, z: 1.25 } }, { parent: node });

    //   1
    const rightL1 = size.width * 0.22;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: rightL1, tessellation: 6
    }, { position: { x: size.width * 0.14, y: potTotalH + trunkH1 + trunkH2 + 0.12, z: -size.depth * 0.02 }, rotation: { x: -0.1, y: 0, z: -0.8 } }, { parent: node });

    //   2
    const rightL2 = size.width * 0.14;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: 0.015, diameterBottom: 0.022, height: rightL2, tessellation: 4
    }, { position: { x: size.width * 0.23, y: potTotalH + trunkH1 + trunkH2 + 0.30, z: size.depth * 0.06 }, rotation: { x: 0.6, y: 0.2, z: -1.0 } }, { parent: node });

    //  
    const backL1 = size.height * 0.16;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: 0.02, diameterBottom: 0.03, height: backL1, tessellation: 6
    }, { position: { x: size.width * 0.01, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.10, z: -size.depth * 0.14 }, rotation: { x: -0.8, y: 0, z: -0.1 } }, { parent: node });

    // 8.   (10 )
    //   1 -   ( )
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.45, segments: 6
    }, { position: { x: -size.width * 0.44, y: potTotalH + trunkH1 - 0.32, z: size.depth * 0.05 }, scaling: { x: 1.4, y: 0.16, z: 1.0 } }, { parent: node });

    //   2 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.36, segments: 8
    }, { position: { x: -size.width * 0.32, y: potTotalH + trunkH1 - 0.15, z: size.depth * 0.12 }, scaling: { x: 1.25, y: 0.15, z: 0.9 } }, { parent: node });

    //   3 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: -size.width * 0.24, y: potTotalH + trunkH1 - 0.02, z: -size.depth * 0.12 }, scaling: { x: 1.2, y: 0.14, z: 0.95 } }, { parent: node });

    //   4 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: size.width * 0.28, y: potTotalH + trunkH1 + trunkH2 + 0.25, z: size.depth * 0.02 }, scaling: { x: 1.3, y: 0.16, z: 1.0 } }, { parent: node });

    //   5 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.30, segments: 8
    }, { position: { x: size.width * 0.22, y: potTotalH + trunkH1 + trunkH2 + 0.12, z: -size.depth * 0.14 }, scaling: { x: 1.15, y: 0.14, z: 0.9 } }, { parent: node });

    //   6 -   ( )
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.48, segments: 6
    }, { position: { x: size.width * 0.02, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4, z: size.depth * 0.05 }, scaling: { x: 1.35, y: 0.16, z: 1.05 } }, { parent: node });

    //   7 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.36, segments: 8
    }, { position: { x: -size.width * 0.10, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.12, z: size.depth * 0.12 }, scaling: { x: 1.2, y: 0.15, z: 0.9 } }, { parent: node });

    //   8 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.36, segments: 8
    }, { position: { x: size.width * 0.14, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.08, z: -size.depth * 0.08 }, scaling: { x: 1.25, y: 0.15, z: 0.95 } }, { parent: node });

    //   9 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: size.width * 0.0, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.05, z: -size.depth * 0.25 }, scaling: { x: 1.2, y: 0.16, z: 0.95 } }, { parent: node });

    //   10 -  
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.26, segments: 8
    }, { position: { x: -size.width * 0.08, y: potTotalH + trunkH1 + trunkH2 * 0.8, z: -size.depth * 0.04 }, scaling: { x: 1.1, y: 0.14, z: 0.9 } }, { parent: node });
  }
};

export const landscapeMapleBonsai = {
  type: 'landscape_maple_bonsai',
  name: 'Landscape Maple Bonsai',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.55, height: 1.1 },
  components: [
    { id: 'maple-leaves', label: 'Component', defaultColor: '#b71c1c' },
    { id: 'maple-trunk', label: 'Component', defaultColor: '#3e2723' },
    { id: 'maple-pot', label: 'Component', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.16;
    boxComponent(registry, item, landscapeMapleBonsai, 'maple-pot', {
      width: size.width * 0.9, height: potH, depth: size.depth * 0.9
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    // 1.  
    const trunkH = size.height * 0.48;
    const trunk = cylinderComponent(registry, item, landscapeMapleBonsai, 'maple-trunk', {
      diameterTop: 0.018, diameterBottom: 0.032, height: trunkH, tessellation: 8
    }, { position: { x: -size.width * 0.08, y: potH + trunkH / 2, z: 0 } }, { parent: node });
    trunk.rotation.z = -0.15;

    // 2.  
    const branchPositions = [
      { x: -size.width * 0.18, y: potH + trunkH * 0.7, z: size.depth * 0.12, rotZ: 0.45, len: size.width * 0.35 },
      { x: size.width * 0.08, y: potH + trunkH * 0.85, z: -size.depth * 0.1, rotZ: -0.5, len: size.width * 0.38 }
    ];

    branchPositions.forEach((bp) => {
      const b = cylinderComponent(registry, item, landscapeMapleBonsai, 'maple-trunk', {
        diameterTop: 0.01, diameterBottom: 0.016, height: bp.len, tessellation: 6
      }, { position: { x: bp.x, y: bp.y, z: bp.z } }, { parent: node });
      b.rotation.z = bp.rotZ;
    });

    // 3.  ！  5  
    const foliageClusters = [
      { x: -size.width * 0.08, y: potH + trunkH + size.height * 0.15, z: 0, r: size.width * 0.22, scaleY: 0.35 },
      { x: -size.width * 0.28, y: potH + trunkH + size.height * 0.06, z: size.depth * 0.2, r: size.width * 0.18, scaleY: 0.3 },
      { x: size.width * 0.18, y: potH + trunkH + size.height * 0.08, z: -size.depth * 0.18, r: size.width * 0.2, scaleY: 0.32 },
      { x: size.width * 0.02, y: potH + trunkH - size.height * 0.02, z: size.depth * 0.22, r: size.width * 0.16, scaleY: 0.28 },
      { x: -size.width * 0.2, y: potH + trunkH + size.height * 0.22, z: -size.depth * 0.1, r: size.width * 0.15, scaleY: 0.25 }
    ];

    foliageClusters.forEach((fc) => {
      const leafMesh = sphereComponent(registry, item, landscapeMapleBonsai, 'maple-leaves', {
        diameter: fc.r * 2, segments: 7
      }, {
        position: { x: fc.x, y: fc.y, z: fc.z },
        scaling: { x: 1.15, y: fc.scaleY, z: 1.05 }
      }, { parent: node });
      leafMesh.rotation.z = 0.08;
    });
  }
};

export const landscapeMossMicro = {
  type: 'landscape_moss_micro',
  name: 'Landscape Moss Micro',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.35 },
  components: [
    { id: 'moss-glass', label: ' ItemGlass Item', defaultColor: '#e0f2f1' },
    { id: 'moss-green', label: 'Component', defaultColor: '#558b2f' },
    { id: 'moss-decor', label: ' Item/ Item', defaultColor: '#d84315' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, landscapeMossMicro, 'moss-glass', {
      diameter: size.width, segments: 8
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const mossD = size.width * 0.88;
    cylinderComponent(registry, item, landscapeMossMicro, 'moss-green', {
      diameterTop: mossD, diameterBottom: mossD * 0.5, height: size.height * 0.2, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.3, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeMossMicro, 'moss-decor', {
      diameter: size.width * 0.2, segments: 6
    }, { position: { x: -size.width * 0.15, y: size.height * 0.48, z: size.depth * 0.08 } }, { parent: node });
  }
};

export const arecaPalmPlant = {
  type: 'areca_palm_plant',
  name: 'Areca Palm Plant',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.75, height: 1.4 },
  components: [
    { id: 'areca-pot', label: 'Component', defaultColor: '#e8dfd2' },
    { id: 'areca-stems', label: 'Component', defaultColor: '#8a9b69' },
    { id: 'areca-leaves', label: 'Component', defaultColor: '#66876d' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.35;
    
    // 1.  Square  (4 )
    const potW = size.width * 0.32;
    const potD = size.depth * 0.32;
    const steps = 4;
    const stepH = potH / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = 0.72 + (i / (steps - 1)) * 0.28; //   72%   100%
      boxComponent(registry, item, arecaPalmPlant, 'areca-pot', {
        width: potW * ratio,
        height: stepH,
        depth: potD * ratio
      }, {
        position: { x: 0, y: stepH * (i + 0.5), z: 0 }
      }, { parent: node });
    }

    // 2.  
    const stemCount = 6;
    for (let i = 0; i < stemCount; i++) {
      //  
      const angleY = (i * Math.PI * 2) / stemCount + (i % 2 === 0 ? 0.15 : -0.1);
      //   ( ，  12   24  )
      const tilt = 0.22 + (i % 3) * 0.06;
      //  ， 
      const stemH = size.height * (0.45 + (i % 3) * 0.08);

      const dirX = Math.sin(angleY);
      const dirZ = Math.cos(angleY);

      //  ， 
      const rootOffset = size.width * 0.03;
      const rootX = dirX * rootOffset;
      const rootZ = dirZ * rootOffset;

      //  
      const endX = rootX + dirX * stemH * Math.sin(tilt);
      const endZ = rootZ + dirZ * stemH * Math.sin(tilt);
      const endY = potH + stemH * Math.cos(tilt);

      //  
      const centerX = (rootX + endX) / 2;
      const centerZ = (rootZ + endZ) / 2;
      const centerY = (potH + endY) / 2;

      //  
      cylinderComponent(registry, item, arecaPalmPlant, 'areca-stems', {
        diameterTop: size.width * 0.008,
        diameterBottom: size.width * 0.018,
        height: stemH,
        tessellation: 6
      }, {
        position: { x: centerX, y: centerY, z: centerZ },
        // Z Rotate ，X Rotate 
        rotation: { x: dirZ * tilt, y: 0, z: -dirX * tilt }
      }, { parent: node });

      // 3.  ， 
      //   35% ~ 100%  ，  6  （12 ） 
      const leafPairs = 4;
      const startPct = 0.35;
      for (let j = 0; j < leafPairs; j++) {
        const pct = startPct + ((1 - startPct) * j) / (leafPairs - 1);
        const currentH = stemH * pct;
        
        //  
        const lpX = rootX + dirX * currentH * Math.sin(tilt);
        const lpZ = rootZ + dirZ * currentH * Math.sin(tilt);
        const lpY = potH + currentH * Math.cos(tilt);

        //  ， / 
        const leafLen = size.width * 0.22 * (1.1 - pct * 0.5);
        const leafWidth = size.width * 0.045 * (1.0 - pct * 0.3);

        //  
        const sideX = -dirZ;
        const sideZ = dirX;

        //  
        const offset = leafLen * 0.45; //  
        const leftX = lpX + sideX * offset;
        const leftZ = lpZ + sideZ * offset;
        const rightX = lpX - sideX * offset;
        const rightZ = lpZ - sideZ * offset;

        //  ： ， 
        const droop = 0.15 + pct * 0.25;

        //  
        boxComponent(registry, item, arecaPalmPlant, 'areca-leaves', {
          width: leafWidth,
          height: size.height * 0.003,
          depth: leafLen
        }, {
          position: { x: leftX, y: lpY - Math.sin(droop) * offset, z: leftZ },
          rotation: {
            x: -sideZ * droop + dirZ * 0.1,
            y: angleY + Math.PI / 2 + 0.2, //  
            z: sideX * droop - dirX * 0.1
          }
        }, { parent: node });

        //  
        boxComponent(registry, item, arecaPalmPlant, 'areca-leaves', {
          width: leafWidth,
          height: size.height * 0.003,
          depth: leafLen
        }, {
          position: { x: rightX, y: lpY - Math.sin(droop) * offset, z: rightZ },
          rotation: {
            x: sideZ * droop + dirZ * 0.1,
            y: angleY - Math.PI / 2 - 0.2, //  
            z: -sideX * droop - dirX * 0.1
          }
        }, { parent: node });
      }
    }
  }
};

export const balconyFlowerBox = {
  type: 'balcony_flower_box',
  name: 'Balcony Flower Box',
  unit: 'm',
  defaultSize: { width: 0.85, depth: 0.28, height: 0.32 },
  components: [
    { id: 'pink-blooms', label: 'Component', defaultColor: '#f48fb1' },
    { id: 'flower-leaves', label: 'Component', defaultColor: '#487e4c' },
    { id: 'white-blooms', label: 'Component', defaultColor: '#ffffff' },
    { id: 'box-container', label: 'Component', defaultColor: '#ffffff' },
    { id: 'soil', label: 'Component', defaultColor: '#4a3b32' }
  ],
  build(registry, item, node, size) {

    const boxH = size.height * 0.45;
    const boxW = size.width;
    const boxD = size.depth;
    const rimT = Math.min(boxW, boxD) * 0.08;

    boxComponent(registry, item, balconyFlowerBox, 'box-container', {
      width: boxW, height: size.height * 0.04, depth: boxD
    }, { position: { x: 0, y: size.height * 0.02, z: 0 } }, { parent: node });

    boxComponent(registry, item, balconyFlowerBox, 'box-container', {
      width: boxW, height: boxH, depth: rimT
    }, { position: { x: 0, y: boxH / 2, z: (boxD - rimT) / 2 } }, { parent: node });

    boxComponent(registry, item, balconyFlowerBox, 'box-container', {
      width: boxW, height: boxH, depth: rimT
    }, { position: { x: 0, y: boxH / 2, z: -(boxD - rimT) / 2 } }, { parent: node });

    boxComponent(registry, item, balconyFlowerBox, 'box-container', {
      width: rimT, height: boxH, depth: Math.max(0.01, boxD - rimT * 2)
    }, { position: { x: (boxW - rimT) / 2, y: boxH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, balconyFlowerBox, 'box-container', {
      width: rimT, height: boxH, depth: Math.max(0.01, boxD - rimT * 2)
    }, { position: { x: -(boxW - rimT) / 2, y: boxH / 2, z: 0 } }, { parent: node });

    const soilH = size.height * 0.05;
    boxComponent(registry, item, balconyFlowerBox, 'soil', {
      width: boxW - rimT * 1.5, height: soilH, depth: boxD - rimT * 1.5
    }, { position: { x: 0, y: boxH - soilH / 2, z: 0 } }, { parent: node });

    const flowerClusters = [
      { x: -0.32, z: -0.04, r: 0.1, isPink: true, yOff: 0.04 },
      { x: -0.22, z: 0.04, r: 0.09, isPink: false, yOff: 0.08 },
      { x: -0.1, z: -0.05, r: 0.11, isPink: true, yOff: 0.07 },
      { x: 0.02, z: 0.03, r: 0.1, isPink: false, yOff: 0.09 },
      { x: 0.14, z: -0.04, r: 0.12, isPink: true, yOff: 0.06 },
      { x: 0.25, z: 0.05, r: 0.09, isPink: true, yOff: 0.08 },
      { x: 0.33, z: -0.02, r: 0.1, isPink: false, yOff: 0.05 }
    ];

    flowerClusters.forEach((fc) => {
      const px = fc.x * boxW;
      const pz = fc.z * boxD;
      const py = boxH + fc.yOff * size.height;
      const radius = fc.r * size.width;

      sphereComponent(registry, item, balconyFlowerBox, 'flower-leaves', {
        diameter: radius * 2.2, segments: 6
      }, {
        position: { x: px, y: py - 0.02, z: pz },
        scaling: { x: 1.2, y: 0.7, z: 1.1 }
      }, { parent: node });

      const compId = fc.isPink ? 'pink-blooms' : 'white-blooms';
      sphereComponent(registry, item, balconyFlowerBox, compId, {
        diameter: radius * 1.6, segments: 6
      }, {
        position: { x: px, y: py + radius * 0.5, z: pz },
        scaling: { x: 1.0, y: 0.85, z: 0.95 }
      }, { parent: node });

      sphereComponent(registry, item, balconyFlowerBox, compId, {
        diameter: radius * 0.8, segments: 5
      }, {
        position: { x: px + radius * 0.5, y: py + radius * 0.8, z: pz + radius * 0.3 }
      }, { parent: node });
    });
  }
};

export const terracottaFlowerUrn = {
  type: 'terracotta_flower_urn',
  name: 'Terracotta Flower Urn',
  unit: 'm',
  defaultSize: { width: 0.65, depth: 0.65, height: 1.1 },
  components: [
    { id: 'hydrangea-blooms', label: 'Component', defaultColor: '#ff80ab' },
    { id: 'hydrangea-leaves', label: 'Component', defaultColor: '#2e7d32' },
    { id: 'urn-pot', label: 'Component', defaultColor: '#e0d6c8' },
    { id: 'urn-dirt', label: 'Component', defaultColor: '#4a3628' }
  ],
  build(registry, item, node, size) {

    const urnH = size.height * 0.52;
    const baseW = size.width * 0.55;
    const stemD = size.width * 0.25;
    const rimD = size.width * 0.85;

    boxComponent(registry, item, terracottaFlowerUrn, 'urn-pot', {
      width: baseW, height: size.height * 0.08, depth: baseW
    }, { position: { x: 0, y: size.height * 0.04, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, terracottaFlowerUrn, 'urn-pot', {
      diameterTop: stemD * 0.9, diameterBottom: stemD * 1.3, height: size.height * 0.12, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.14, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, terracottaFlowerUrn, 'urn-pot', {
      diameterTop: rimD, diameterBottom: stemD * 0.9, height: Math.max(0.01, urnH - size.height * 0.2), tessellation: 8
    }, { position: { x: 0, y: size.height * 0.3, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, terracottaFlowerUrn, 'urn-pot', {
      diameterTop: rimD * 1.08, diameterBottom: rimD * 1.02, height: size.height * 0.05, tessellation: 8
    }, { position: { x: 0, y: urnH - size.height * 0.025, z: 0 } }, { parent: node });

    const dirtH = size.height * 0.04;
    cylinderComponent(registry, item, terracottaFlowerUrn, 'urn-dirt', {
      diameterTop: rimD * 0.92, diameterBottom: rimD * 0.92, height: dirtH, tessellation: 8
    }, { position: { x: 0, y: urnH - dirtH / 2, z: 0 } }, { parent: node });

    const centerBloomRadius = size.width * 0.32;
    const leafRadius = size.width * 0.42;
    const leafCenterY = urnH + size.height * 0.1;

    sphereComponent(registry, item, terracottaFlowerUrn, 'hydrangea-leaves', {
      diameter: leafRadius * 2, segments: 8
    }, {
      position: { x: 0, y: leafCenterY, z: 0 },
      scaling: { x: 1.1, y: 0.5, z: 1.1 }
    }, { parent: node });

    const bloomPositions = [
      { x: 0, y: leafCenterY + centerBloomRadius * 0.45, z: 0, scale: 1.0 },
      { x: centerBloomRadius * 0.55, y: leafCenterY + centerBloomRadius * 0.22, z: centerBloomRadius * 0.3, scale: 0.85 },
      { x: -centerBloomRadius * 0.55, y: leafCenterY + centerBloomRadius * 0.25, z: centerBloomRadius * 0.2, scale: 0.88 },
      { x: centerBloomRadius * 0.2, y: leafCenterY + centerBloomRadius * 0.2, z: -centerBloomRadius * 0.55, scale: 0.82 },
      { x: -centerBloomRadius * 0.3, y: leafCenterY + centerBloomRadius * 0.22, z: -centerBloomRadius * 0.5, scale: 0.85 },
      { x: 0, y: leafCenterY + centerBloomRadius * 0.18, z: centerBloomRadius * 0.58, scale: 0.8 }
    ];

    bloomPositions.forEach((bp) => {
      sphereComponent(registry, item, terracottaFlowerUrn, 'hydrangea-blooms', {
        diameter: centerBloomRadius * 2 * bp.scale, segments: 8
      }, {
        position: { x: bp.x, y: bp.y, z: bp.z }
      }, { parent: node });
    });
  }
};


export const pottedPinkRose = {
  type: 'potted_pink_rose',
  name: 'Potted Plants',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.55, height: 0.95 },

  components: [
    { id: 'pink-rose-blooms', label: 'Component', defaultColor: '#ff4081' },
    { id: 'rose-leaves', label: 'Component', defaultColor: '#2e7d32' },
    { id: 'pot', label: 'Component', defaultColor: '#f5f0eb' },
    { id: 'dirt', label: 'Component', defaultColor: '#5c4033' },
    { id: 'stem', label: 'Component', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.32;
    const potD = size.width * 0.75;

    cylinderComponent(registry, item, pottedPinkRose, 'pot', {
      diameterTop: potD, diameterBottom: potD * 0.65, height: potH, tessellation: 8
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, pottedPinkRose, 'dirt', {
      diameterTop: potD * 0.92, diameterBottom: potD * 0.92, height: 0.03, tessellation: 8
    }, { position: { x: 0, y: potH - 0.015, z: 0 } }, { parent: node });

    const stemH = size.height * 0.45;
    cylinderComponent(registry, item, pottedPinkRose, 'stem', {
      diameterTop: 0.02, diameterBottom: 0.032, height: stemH, tessellation: 6
    }, { position: { x: 0, y: potH + stemH / 2, z: 0 } }, { parent: node });

    const crownCenterY = potH + stemH;
    const crownWidth = size.width * 0.8;
    const crownHeight = size.height * 0.32;
    const crownDepth = size.depth * 0.8;

    // 1.  
    sphereComponent(registry, item, pottedPinkRose, 'rose-leaves', {
      diameter: crownWidth, segments: 7
    }, {
      position: { x: 0, y: crownCenterY, z: 0 },
      scaling: { x: 1.0, y: crownHeight / crownWidth, z: crownDepth / crownWidth }
    }, { parent: node });

    // 2.  （  size  ）
    const bloomRadius = Math.min(size.width, size.depth) * 0.08;
    const roseBlooms = [
      { x: 0, y: crownCenterY + crownHeight * 0.52 + bloomRadius * 0.5, z: 0, r: bloomRadius * 1.1 },
      { x: size.width * 0.28, y: crownCenterY + crownHeight * 0.25, z: size.depth * 0.22, r: bloomRadius * 0.95 },
      { x: -size.width * 0.3, y: crownCenterY + crownHeight * 0.28, z: -size.depth * 0.18, r: bloomRadius * 0.9 },
      { x: -size.width * 0.2, y: crownCenterY + crownHeight * 0.12, z: size.depth * 0.3, r: bloomRadius * 0.85 },
      { x: size.width * 0.25, y: crownCenterY + crownHeight * 0.15, z: -size.depth * 0.26, r: bloomRadius * 0.9 }
    ];

    roseBlooms.forEach((rb) => {
      sphereComponent(registry, item, pottedPinkRose, 'pink-rose-blooms', {
        diameter: rb.r * 2, segments: 6
      }, { position: { x: rb.x, y: rb.y, z: rb.z } }, { parent: node });
    });
  }
};



