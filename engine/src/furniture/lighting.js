import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1.   (Ceiling Light)
export const ceilingLight = {
  type: 'ceiling_light',
  name: 'Ceiling Light',
  placeType: 'ceiling',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 0.1 },
  emissiveComponents: ['bulb', 'glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -0.05, z: 0 },
    color: '#fffbe6',
    intensity: 0.9,
    range: 4.5
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#dcdcdc' },
    { id: 'glow', label: 'Component', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.25;
    const glowH = size.height * 0.75;

    //  
    cylinderComponent(registry, item, ceilingLight, 'base', {
      diameterTop: size.width * 0.95, diameterBottom: size.width, height: baseH, tessellation: 24
    }, { position: { x: 0, y: size.height - baseH / 2, z: 0 } }, { parent: node });

    //  Emissive 
    cylinderComponent(registry, item, ceilingLight, 'glow', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.82, height: glowH, tessellation: 24
    }, { position: { x: 0, y: (size.height - baseH) - glowH / 2, z: 0 } }, { parent: node });
  }
};

// 2.   (Chandelier)
export const chandelierLight = {
  type: 'chandelier_light',
  name: 'Chandelier Light',
  placeType: 'ceiling',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.6, height: 0.8 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -0.4, z: 0 },
    color: '#fffae6',
    intensity: 1.0,
    range: 5.0
  },
  components: [
    { id: 'rod', label: 'Metal rod', defaultColor: '#434343' },
    { id: 'hub', label: 'Component', defaultColor: '#c5a059' },
    { id: 'arm', label: 'Component', defaultColor: '#aa8040' },
    { id: 'bulb', label: 'Bulb', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const rodH = size.height * 0.45;
    const hubH = size.height * 0.1;
    const armH = size.height * 0.3;
    const bulbD = size.width * 0.12;

    //  
    cylinderComponent(registry, item, chandelierLight, 'rod', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.03, height: rodH, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, chandelierLight, 'hub', {
      diameterTop: size.width * 0.25, diameterBottom: size.width * 0.25, height: hubH, tessellation: 12
    }, { position: { x: 0, y: size.height - rodH - hubH / 2, z: 0 } }, { parent: node });

    //  （Diamond ）
    const offsetDist = size.width * 0.35;
    const directions = [
      { x: 1, z: 1 },
      { x: -1, z: 1 },
      { x: 1, z: -1 },
      { x: -1, z: -1 }
    ];

    directions.forEach((dir, index) => {
      //  
      const armX = dir.x * offsetDist * 0.5;
      const armZ = dir.z * offsetDist * 0.5;
      const armY = size.height - rodH - hubH - armH * 0.5;

      cylinderComponent(registry, item, chandelierLight, 'arm', {
        diameterTop: size.width * 0.02, diameterBottom: size.width * 0.03, height: armH, tessellation: 8
      }, { position: { x: armX, y: armY, z: armZ } }, { parent: node });

      //  
      const bulbX = dir.x * offsetDist;
      const bulbZ = dir.z * offsetDist;
      const bulbY = size.height - rodH - hubH - armH + bulbD / 2;

      sphereComponent(registry, item, chandelierLight, 'bulb', {
        diameter: bulbD, segments: 12
      }, { position: { x: bulbX, y: bulbY, z: bulbZ } }, { parent: node });
    });
  }
};

// 3.   (Wall Sconce)
export const wallSconceLight = {
  type: 'wall_sconce_light',
  name: 'Wall Sconce Light',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.25, height: 0.3 },
  placeType: 'wall',
  emissiveComponents: ['bulb', 'glow'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'spot',
    offset: { x: 0, y: -0.05, z: 0.15 },
    direction: { x: 0, y: -1, z: 0.1 },
    angle: Math.PI / 3,
    exponent: 2.5,
    color: '#fffae6',
    intensity: 0.85,
    range: 3.5
  },
  components: [
    { id: 'mount', label: 'Component', defaultColor: '#2b2b2b' },
    { id: 'arm', label: 'Component', defaultColor: '#bf9c60' },
    { id: 'shade', label: 'Metal shade', defaultColor: '#424242' },
    { id: 'bulb', label: 'Bulb', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const mountD = size.depth * 0.15;
    const shadeH = size.height * 0.4;
    const bulbD = size.width * 0.35;

    //  
    boxComponent(registry, item, wallSconceLight, 'mount', {
      width: size.width * 0.6, height: size.height * 0.4, depth: mountD
    }, { position: { x: 0, y: size.height * 0.5, z: -size.depth / 2 + mountD / 2 } }, { parent: node });

    //  
    cylinderComponent(registry, item, wallSconceLight, 'arm', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.05, height: size.depth * 0.7, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.62, z: -size.depth * 0.1 } }, { parent: node });
    const armMesh = node.getChildren().find(child => child.name.includes('arm'));
    if (armMesh) {
      armMesh.rotation.x = Math.PI * 0.5;
    }

    //  
    cylinderComponent(registry, item, wallSconceLight, 'shade', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.95, height: shadeH, tessellation: 16
    }, { position: { x: 0, y: size.height * 0.62 - shadeH / 2, z: size.depth / 2 - size.width * 0.4 } }, { parent: node });

    //  
    sphereComponent(registry, item, wallSconceLight, 'bulb', {
      diameter: bulbD, segments: 12
    }, { position: { x: 0, y: size.height * 0.62 - shadeH, z: size.depth / 2 - size.width * 0.4 } }, { parent: node });
  }
};

// 4.   (Floor Lamp)
export const floorLampLight = {
  type: 'floor_lamp_light',
  name: 'Floor Lamp Light',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 1.65 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 1.4, z: 0 },
    color: '#fffae6',
    intensity: 0.85,
    range: 4.0
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#303030' },
    { id: 'pole', label: 'Component', defaultColor: '#1d1d1d' },
    { id: 'shade', label: 'Fabric shade', defaultColor: '#ece7db' },
    { id: 'glow', label: 'Light glow', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.03;
    const shadeH = size.height * 0.16;
    const poleH = size.height * 0.81;

    //  
    cylinderComponent(registry, item, floorLampLight, 'base', {
      diameterTop: size.width * 0.85, diameterBottom: size.width * 0.9, height: baseH, tessellation: 20
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, floorLampLight, 'pole', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.08, height: poleH, tessellation: 12
    }, { position: { x: 0, y: baseH + poleH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, floorLampLight, 'shade', {
      diameterTop: size.width * 0.75, diameterBottom: size.width * 0.95, height: shadeH, tessellation: 20
    }, { position: { x: 0, y: size.height - shadeH / 2, z: 0 } }, { parent: node });

    //  Emissive 
    cylinderComponent(registry, item, floorLampLight, 'glow', {
      diameterTop: size.width * 0.45, diameterBottom: size.width * 0.55, height: shadeH * 0.8, tessellation: 12
    }, { position: { x: 0, y: size.height - shadeH * 0.9, z: 0 } }, { parent: node });
  }
};

// 5.  ：  type  。
export const arcFloorLampLight = {
  type: 'arc_floor_lamp_light',
  name: 'Arc Floor Lamp Light',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.4, height: 1.65 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0.35, y: 1.4, z: 0 },
    color: '#fffae6',
    intensity: 0.85,
    range: 4.0
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#303030' },
    { id: 'pole', label: 'Component', defaultColor: '#1d1d1d' },
    { id: 'shade', label: 'Component', defaultColor: '#ece7db' },
    { id: 'glow', label: 'Light glow', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.03;
    cylinderComponent(registry, item, arcFloorLampLight, 'base', {
      diameterTop: size.depth * 0.72, diameterBottom: size.depth * 0.8,
      height: baseH, tessellation: 24
    }, { position: { x: -size.width * 0.32, y: baseH / 2, z: 0 } }, { parent: node });

    const points = [];
    const segments = 10;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const angle = Math.PI * 0.5 * t;
      points.push({
        x: -size.width * 0.32 + size.width * 0.7 * (1 - Math.cos(angle)),
        y: baseH + size.height * 0.82 * Math.sin(angle),
        z: 0
      });
    }
    for (let index = 0; index < segments; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      const segment = cylinderComponent(registry, item, arcFloorLampLight, 'pole', {
        diameterTop: size.depth * 0.055, diameterBottom: size.depth * 0.055,
        height: length * 1.04, tessellation: 12
      }, { position: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, z: 0 } }, { parent: node });
      segment.rotation.z = -Math.atan2(dx, dy);
    }

    const shadeH = size.height * 0.15;
    const lampX = size.width * 0.38;
    const lampY = size.height * 0.82;
    cylinderComponent(registry, item, arcFloorLampLight, 'shade', {
      diameterTop: size.depth * 0.48, diameterBottom: size.depth * 0.86,
      height: shadeH, tessellation: 24
    }, { position: { x: lampX, y: lampY - shadeH / 2, z: 0 } }, { parent: node });
    cylinderComponent(registry, item, arcFloorLampLight, 'glow', {
      diameterTop: size.depth * 0.34, diameterBottom: size.depth * 0.5,
      height: shadeH * 0.7, tessellation: 16
    }, { position: { x: lampX, y: lampY - shadeH * 0.82, z: 0 } }, { parent: node });
  }
};

// 6.   (Desk Lamp)
export const deskLampLight = {
  type: 'desk_lamp_light',
  name: 'Desk Lamp Light',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.25, height: 0.4 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'spot',
    offset: { x: 0, y: 0.3, z: 0.1 },
    direction: { x: 0.2, y: -1, z: 0.2 },
    angle: Math.PI / 4,
    exponent: 2.0,
    color: '#fffbe6',
    intensity: 0.9,
    range: 3.0
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#607d8b' },
    { id: 'arm', label: 'Component', defaultColor: '#cfd8dc' },
    { id: 'shade', label: 'Component', defaultColor: '#546e7a' },
    { id: 'bulb', label: 'LED bulb', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.08;
    const shadeH = size.height * 0.25;
    const armH = size.height * 0.67;

    //  
    cylinderComponent(registry, item, deskLampLight, 'base', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.78, height: baseH, tessellation: 16
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, deskLampLight, 'arm', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.04, height: armH, tessellation: 8
    }, { position: { x: -size.width * 0.12, y: baseH + armH / 2, z: -size.depth * 0.05 } }, { parent: node });
    const armMesh = node.getChildren().find(child => child.name.includes('arm'));
    if (armMesh) {
      armMesh.rotation.x = Math.PI * 0.08;
      armMesh.rotation.z = -Math.PI * 0.05;
    }

    //  
    const shadeMesh = cylinderComponent(registry, item, deskLampLight, 'shade', {
      diameterTop: size.width * 0.44, diameterBottom: size.width * 0.75, height: shadeH, tessellation: 16
    }, { position: { x: 0, y: size.height - shadeH / 2, z: size.depth * 0.2 } }, { parent: node });
    if (shadeMesh) {
      shadeMesh.rotation.x = -Math.PI * 0.1;
      shadeMesh.rotation.z = Math.PI * 0.1; 
    }

    // EmissiveLED，  parent   shadeMesh， 
    sphereComponent(registry, item, deskLampLight, 'bulb', {
      diameter: size.width * 0.3, segments: 10
    }, { position: { x: 0, y: -shadeH * 0.22, z: 0 } }, { parent: shadeMesh });
  }
};

// 6.  Headboard  (Bedside Lamp)
export const bedsideLampLight = {
  type: 'bedside_lamp_light',
  name: 'Bedside Lamp Light',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.35 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0.2, z: 0 },
    color: '#ffe6b3',
    intensity: 0.7,
    range: 3.0
  },
  components: [
    { id: 'ceramic', label: 'Component', defaultColor: '#e0dfdb' },
    { id: 'glow', label: 'Component', defaultColor: '#ffebd2' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.42;
    const shadeH = size.height * 0.58;

    //  
    cylinderComponent(registry, item, bedsideLampLight, 'ceramic', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.75, height: baseH, tessellation: 16
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, bedsideLampLight, 'glow', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.98, height: shadeH, tessellation: 20
    }, { position: { x: 0, y: baseH + shadeH / 2, z: 0 } }, { parent: node });
  }
};

// 7.   (Track Spotlight)
export const trackLight = {
  type: 'track_light',
  name: 'Track Light',
  placeType: 'ceiling',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.1, height: 0.2 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -0.15, z: 0 },
    color: '#ffffff',
    intensity: 0.95,
    range: 4.5
  },
  components: [
    { id: 'rail', label: 'Component', defaultColor: '#1a1a1a' },
    { id: 'body', label: 'Component', defaultColor: '#2b2b2b' },
    { id: 'bulb', label: 'Component', defaultColor: '#fcfcfc' }
  ],
  build(registry, item, node, size) {
    const railH = size.height * 0.15;
    const bodyH = size.height * 0.45;
    const bulbD = size.depth * 0.6;

    //  
    boxComponent(registry, item, trackLight, 'rail', {
      width: size.width, height: railH, depth: size.depth * 0.4
    }, { position: { x: 0, y: size.height - railH / 2, z: 0 } }, { parent: node });

    // 3  
    const spots = [-size.width * 0.32, 0, size.width * 0.32];
    const angles = [Math.PI * 0.08, -Math.PI * 0.04, Math.PI * 0.12];

    spots.forEach((posX, idx) => {
      const rotZ = angles[idx];

      //  
      cylinderComponent(registry, item, trackLight, 'body', {
        diameterTop: size.depth * 0.8, diameterBottom: size.depth * 0.8, height: bodyH, tessellation: 12
      }, { position: { x: posX, y: size.height - railH - bodyH / 2, z: 0 } }, { parent: node });

      // Emissive 
      sphereComponent(registry, item, trackLight, 'bulb', {
        diameter: bulbD, segments: 10
      }, { position: { x: posX - Math.sin(rotZ) * 0.1, y: size.height - railH - bodyH, z: 0 } }, { parent: node });
    });
  }
};

// 8.   (Neon Wall Lamp)
export const neonSignLight = {
  type: 'neon_sign_light',
  name: 'Neon Sign Light',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.05, height: 0.5 },
  placeType: 'wall',
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0, z: 0.05 },
    color: '#33ffcc',
    intensity: 0.7,
    range: 3.0
  },
  components: [
    { id: 'mount', label: 'Component', defaultColor: '#121212' },
    { id: 'glow', label: 'Component', defaultColor: '#33ffcc' }
  ],
  build(registry, item, node, size) {
    const mountT = 0.02;

    //  
    boxComponent(registry, item, neonSignLight, 'mount', {
      width: size.width * 0.85, height: size.height * 0.85, depth: mountT
    }, { position: { x: 0, y: size.height * 0.5, z: -size.depth / 2 + mountT / 2 } }, { parent: node });

    const neonRadius = size.width * 0.18;
    const neonThickness = size.width * 0.05;

    //  
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2, tessellation: 8
    }, { position: { x: -neonRadius * 0.75, y: size.height * 0.58, z: 0.03 } }, { parent: node });

    //  
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2, tessellation: 8
    }, { position: { x: neonRadius * 0.75, y: size.height * 0.58, z: 0.03 } }, { parent: node });

    //  
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2.8, tessellation: 8
    }, { position: { x: -neonRadius * 0.88, y: size.height * 0.32, z: 0.03 } }, { parent: node });
    const tipL = node.getChildren().filter(c => c.name.includes('glow'))[2];
    if (tipL) tipL.rotation.z = Math.PI * 0.18;

    //  
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2.8, tessellation: 8
    }, { position: { x: neonRadius * 0.88, y: size.height * 0.32, z: 0.03 } }, { parent: node });
    const tipR = node.getChildren().filter(c => c.name.includes('glow'))[3];
    if (tipR) tipR.rotation.z = -Math.PI * 0.18;
  }
};

// 9.   (Globe Pendant Lamp)
export const globePendantLight = {
  type: 'globe_pendant_light',
  name: 'Globe Pendant Light',
  placeType: 'ceiling',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.9 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -0.45, z: 0 },
    color: '#fffae6',
    intensity: 0.8,
    range: 4.5
  },
  components: [
    { id: 'cord', label: 'Component', defaultColor: '#1d1d1d' },
    { id: 'glow', label: 'Component', defaultColor: '#fbfbf8' }
  ],
  build(registry, item, node, size) {
    const cordH = size.height * 0.5;
    const sphereD = size.width;

    //  
    cylinderComponent(registry, item, globePendantLight, 'cord', {
      diameterTop: size.width * 0.02, diameterBottom: size.width * 0.02, height: cordH, tessellation: 6
    }, { position: { x: 0, y: size.height - cordH / 2, z: 0 } }, { parent: node });

    //  
    sphereComponent(registry, item, globePendantLight, 'glow', {
      diameter: sphereD, segments: 16
    }, { position: { x: 0, y: size.height - cordH - sphereD / 2, z: 0 } }, { parent: node });
  }
};

// 10.   (Lava Lamp)
export const lavaLampLight = {
  type: 'lava_lamp_light',
  name: 'Lava Lamp Light',
  unit: 'm',
  defaultSize: { width: 0.15, depth: 0.15, height: 0.45 },
  emissiveComponents: ['glow', 'lava'],
  lightColorComponent: 'lava',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0.25, z: 0 },
    color: '#ff33aa',
    intensity: 0.8,
    range: 2.5
  },
  components: [
    { id: 'base', label: 'Metal base', defaultColor: '#a1a1a1' },
    { id: 'glass', label: 'Glass bottle', defaultColor: '#ffffff' },
    { id: 'glow', label: 'Component', defaultColor: '#ff99ff' },
    { id: 'lava', label: 'Component', defaultColor: '#ff33aa' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.22;
    const capH = size.height * 0.12;
    const bodyH = size.height * 0.66;

    // Metal 
    cylinderComponent(registry, item, lavaLampLight, 'base', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.98, height: baseH, tessellation: 16
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // Glass 
    cylinderComponent(registry, item, lavaLampLight, 'glass', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.72, height: bodyH, tessellation: 16
    }, { position: { x: 0, y: baseH + bodyH / 2, z: 0 } }, { parent: node });

    // Metal 
    cylinderComponent(registry, item, lavaLampLight, 'base', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.62, height: capH, tessellation: 16
    }, { position: { x: 0, y: size.height - capH / 2, z: 0 } }, { parent: node });

    // Emissive 
    cylinderComponent(registry, item, lavaLampLight, 'glow', {
      diameterTop: size.width * 0.68, diameterBottom: size.width * 0.68, height: 0.04, tessellation: 12
    }, { position: { x: 0, y: baseH + 0.02, z: 0 } }, { parent: node });

    //   1
    sphereComponent(registry, item, lavaLampLight, 'lava', {
      diameter: size.width * 0.42, segments: 10
    }, { position: { x: 0, y: baseH + bodyH * 0.32, z: 0 } }, { parent: node });

    //   2
    sphereComponent(registry, item, lavaLampLight, 'lava', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: size.width * 0.08, y: baseH + bodyH * 0.75, z: -size.width * 0.04 } }, { parent: node });
  }
};

// 11.   (Garden Lantern Post)
export const gardenLanternPostFurniture = {
  type: 'garden_lantern_post',
  name: 'Garden Lantern Post',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 2.15 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 1.9, z: 0 },
    color: '#fffae6',
    intensity: 0.85,
    range: 5.0
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#75777d' },
    { id: 'pole', label: 'Component', defaultColor: '#555a62' },
    { id: 'glass', label: 'Glass shade', defaultColor: '#ffffff' },
    { id: 'cap', label: 'Component', defaultColor: '#3a3a3a' },
    { id: 'bulb', label: 'Component', defaultColor: '#f7e5a6' }
  ],
  build(registry, item, node, size) {
    //  
    boxComponent(registry, item, gardenLanternPostFurniture, 'base', {
      width: size.width * 0.6,
      height: size.height * 0.08,
      depth: size.depth * 0.6
    }, { position: { x: 0, y: size.height * 0.04, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, gardenLanternPostFurniture, 'pole', {
      diameterTop: 0.04,
      diameterBottom: 0.05,
      height: size.height * 0.78,
      tessellation: 16
    }, { position: { x: 0, y: size.height * 0.47, z: 0 } }, { parent: node });

    const lampH = size.height * 0.14;
    const lampY = size.height * 0.88;
    const glassW = size.width * 0.8;
    const glassD = size.depth * 0.8;
    const t = 0.01; // Glass 

    //  Glass 
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: glassW, height: lampH - t, depth: t
    }, { position: { x: 0, y: lampY - t / 2, z: -glassD / 2 + t / 2 } }, { parent: node });

    //  Glass 
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: glassW, height: lampH - t, depth: t
    }, { position: { x: 0, y: lampY - t / 2, z: glassD / 2 - t / 2 } }, { parent: node });

    //  Glass 
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: t, height: lampH - t, depth: glassD - t * 2
    }, { position: { x: -glassW / 2 + t / 2, y: lampY - t / 2, z: 0 } }, { parent: node });

    //  Glass 
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: t, height: lampH - t, depth: glassD - t * 2
    }, { position: { x: glassW / 2 - t / 2, y: lampY - t / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gardenLanternPostFurniture, 'cap', {
      width: size.width,
      height: t * 2,
      depth: size.depth
    }, { position: { x: 0, y: lampY + lampH / 2 - t, z: 0 } }, { parent: node });

    //   (Emissive )
    sphereComponent(registry, item, gardenLanternPostFurniture, 'bulb', {
      diameter: size.width * 0.35, segments: 12
    }, { position: { x: 0, y: lampY, z: 0 } }, { parent: node });
  }
};

// 12.   (Garden Bollard Light)
export const gardenBollardLightFurniture = {
  type: 'garden_bollard_light',
  name: 'Garden Bollard Light',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.2, height: 0.5 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0.35, z: 0 },
    color: '#ffebb3',
    intensity: 0.7,
    range: 3.5
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#474747' },
    { id: 'pole', label: 'Component', defaultColor: '#5c5c5c' },
    { id: 'glass', label: 'Glass shade', defaultColor: '#ffffff' },
    { id: 'cap', label: 'Component', defaultColor: '#3a3a3a' },
    { id: 'bulb', label: 'Component', defaultColor: '#ffebb3' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.1;
    const poleH = size.height * 0.4;
    const glassH = size.height * 0.4;
    const capH = size.height * 0.1;

    //  
    boxComponent(registry, item, gardenBollardLightFurniture, 'base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, gardenBollardLightFurniture, 'pole', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.35, height: poleH, tessellation: 12
    }, { position: { x: 0, y: baseH + poleH / 2, z: 0 } }, { parent: node });

    const glassY = baseH + poleH + glassH / 2;
    const glassW = size.width * 0.78;
    const glassD = size.depth * 0.78;
    const t = 0.01;

    //  Glass 
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: glassW, height: glassH - t, depth: t
    }, { position: { x: 0, y: glassY - t / 2, z: -glassD / 2 + t / 2 } }, { parent: node });

    //  Glass 
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: glassW, height: glassH - t, depth: t
    }, { position: { x: 0, y: glassY - t / 2, z: glassD / 2 - t / 2 } }, { parent: node });

    //  Glass 
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: t, height: glassH - t, depth: glassD - t * 2
    }, { position: { x: -glassW / 2 + t / 2, y: glassY - t / 2, z: 0 } }, { parent: node });

    //  Glass 
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: t, height: glassH - t, depth: glassD - t * 2
    }, { position: { x: glassW / 2 - t / 2, y: glassY - t / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gardenBollardLightFurniture, 'cap', {
      width: size.width * 1.1, height: capH, depth: size.depth * 1.1
    }, { position: { x: 0, y: baseH + poleH + glassH + capH / 2, z: 0 } }, { parent: node });

    //  
    sphereComponent(registry, item, gardenBollardLightFurniture, 'bulb', {
      diameter: size.width * 0.3, segments: 12
    }, { position: { x: 0, y: baseH + poleH + glassH / 2, z: 0 } }, { parent: node });
  }
};

// 13.   (Garden Lantern)
export const gardenLanternFurniture = {
  type: 'garden_lantern',
  name: 'Garden Lantern',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.6 },
  emissiveComponents: ['paper'],
  lightColorComponent: 'paper',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0.3, z: 0 },
    color: '#ffe6b3',
    intensity: 0.8,
    range: 3.5
  },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#807d79' },
    { id: 'body', label: 'Component', defaultColor: '#4a443a' },
    { id: 'paper', label: 'Component', defaultColor: '#fffae6' },
    { id: 'roof', label: 'Component', defaultColor: '#6e6659' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    const lanternH = size.height * 0.7;
    const roofH = size.height * 0.15;

    //  
    boxComponent(registry, item, gardenLanternFurniture, 'base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyY = baseH + lanternH / 2;
    const postW = 0.02;
    // Diamond 
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, gardenLanternFurniture, 'body', {
          width: postW, height: lanternH, depth: postW
        }, { position: { x: xSide * (size.width / 2 - postW / 2), y: bodyY, z: zSide * (size.depth / 2 - postW / 2) } }, { parent: node });
      });
    });

    //  Emissive 
    boxComponent(registry, item, gardenLanternFurniture, 'paper', {
      width: size.width * 0.76, height: lanternH * 0.9, depth: size.depth * 0.76
    }, { position: { x: 0, y: bodyY, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gardenLanternFurniture, 'roof', {
      width: size.width * 1.15, height: roofH, depth: size.depth * 1.15
    }, { position: { x: 0, y: baseH + lanternH + roofH / 2, z: 0 } }, { parent: node });
  }
};

export const lampFurniture = {
  type: 'lamp',
  name: 'Lamp',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 1.55 },
  components: [
    { id: 'shade', label: 'Component', defaultColor: '#fffae6' },
    { id: 'pole', label: 'Component', defaultColor: '#3d3d3d' },
    { id: 'base', label: 'Component', defaultColor: '#5c5c5c' }
  ],
  build(registry, item, node, size) {
    const baseHeight = size.height * 0.04;
    const shadeHeight = size.height * 0.20;
    const poleHeight = size.height * 0.76;

    cylinderComponent(registry, item, lampFurniture, 'base', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.92, height: baseHeight, tessellation: 24
    }, { position: { x: 0, y: baseHeight / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lampFurniture, 'pole', {
      diameterTop: Math.max(0.015, size.width * 0.08), diameterBottom: Math.max(0.015, size.width * 0.08), height: poleHeight, tessellation: 12
    }, { position: { x: 0, y: baseHeight + poleHeight / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lampFurniture, 'shade', {
      diameterTop: size.width * 0.76, diameterBottom: size.width * 0.96, height: shadeHeight, tessellation: 24
    }, { position: { x: 0, y: size.height - shadeHeight / 2, z: 0 } }, { parent: node });
  }
};

export const chandelierFurniture = {
  type: 'chandelier',
  name: 'Chandelier',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.5, height: 0.9 },
  placeType: 'ceiling',
  components: [
    { id: 'shade', label: 'Shade', defaultColor: '#ffffff' },
    { id: 'light', label: 'Component', defaultColor: '#fff5d6' },
    { id: 'cord', label: 'Component', defaultColor: '#2b2b2b' }
  ],
  build(registry, item, node, size) {
    const cordH = size.height * 0.64;
    const shadeH = size.height * 0.28;
    const bulbH = size.height * 0.08;

    // 1.  
    cylinderComponent(registry, item, chandelierFurniture, 'cord', {
      diameterTop: 0.008, diameterBottom: 0.008, height: cordH, tessellation: 6
    }, { position: { x: 0, y: size.height - cordH / 2, z: 0 } }, { parent: node });

    // 2.  
    cylinderComponent(registry, item, chandelierFurniture, 'shade', {
      diameterTop: size.width * 0.16, diameterBottom: size.width, height: shadeH, tessellation: 24
    }, { position: { x: 0, y: size.height - cordH - shadeH / 2, z: 0 } }, { parent: node });

    // 3.  / 
    sphereComponent(registry, item, chandelierFurniture, 'light', {
      diameter: bulbH * 1.5, segments: 12
    }, { position: { x: 0, y: size.height - cordH - shadeH + bulbH / 2, z: 0 } }, { parent: node });
  }
};

export const landscapeStoneLantern = {
  type: 'landscape_stone_lantern',
  name: 'Landscape Stone Lantern',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 0.9 },
  components: [
    { id: 'lantern-stone', label: 'Stone lantern', defaultColor: '#b0bec5' },
    { id: 'lantern-light', label: 'Component', defaultColor: '#ffe082' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    boxComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const pillarH = size.height * 0.35;
    cylinderComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      diameterTop: size.width * 0.4, diameterBottom: size.width * 0.5, height: pillarH, tessellation: 12
    }, { position: { x: 0, y: baseH + pillarH / 2, z: 0 } }, { parent: node });

    const midH = size.height * 0.1;
    boxComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      width: size.width * 0.9, height: midH, depth: size.depth * 0.9
    }, { position: { x: 0, y: baseH + pillarH + midH / 2, z: 0 } }, { parent: node });

    const lightH = size.height * 0.18;
    cylinderComponent(registry, item, landscapeStoneLantern, 'lantern-light', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.5, height: lightH, tessellation: 6
    }, { position: { x: 0, y: baseH + pillarH + midH + lightH / 2, z: 0 } }, { parent: node });

    const roofH = size.height * 0.15;
    cylinderComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      diameterTop: 0.01, diameterBottom: size.width * 1.1, height: roofH, tessellation: 6
    }, { position: { x: 0, y: baseH + pillarH + midH + lightH + roofH / 2, z: 0 } }, { parent: node });

    const jewelH = size.height * 0.07;
    sphereComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      diameter: size.width * 0.25, segments: 8
    }, { position: { x: 0, y: size.height - jewelH, z: 0 } }, { parent: node });
  }
};

// 11.   (Wall Lantern)
export const wallLanternLight = {
  type: 'wall_lantern_light',
  name: 'Wall Lantern Light',
  unit: 'm',
  defaultSize: { width: 0.38, depth: 0.45, height: 0.68 },
  placeType: 'wall',
  emissiveComponents: ['lantern_shade'],
  lightColorComponent: 'lantern_shade',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0.32, z: 0.12 },
    color: '#ff9933',
    intensity: 0.85,
    range: 4.5
  },
  components: [
    { id: 'lantern_shade', label: 'Component', defaultColor: '#e64a19' },
    { id: 'frame', label: 'Component', defaultColor: '#3e2723' },
    { id: 'mount_arm', label: 'Component', defaultColor: '#261c14' },
    { id: 'tassel', label: 'Component', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    const mountDepth = 0.03;
    const mountH = size.height * 0.45;
    const mountW = size.width * 0.28;

    // 1.  
    boxComponent(registry, item, wallLanternLight, 'mount_arm', {
      width: mountW, height: mountH, depth: mountDepth
    }, { position: { x: 0, y: size.height * 0.55, z: -size.depth / 2 + mountDepth / 2 } }, { parent: node });

    // 2.   (  +  )
    const armThickness = 0.024;
    const armLength = size.depth * 0.72;
    boxComponent(registry, item, wallLanternLight, 'mount_arm', {
      width: armThickness, height: armThickness, depth: armLength
    }, { position: { x: 0, y: size.height * 0.72, z: -size.depth / 2 + armLength / 2 } }, { parent: node });

    //  
    const braceH = size.height * 0.28;
    cylinderComponent(registry, item, wallLanternLight, 'mount_arm', {
      diameterTop: armThickness * 0.8, diameterBottom: armThickness * 0.8, height: braceH, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.48, z: -size.depth * 0.18 } }, { parent: node });
    const braceMesh = node.getChildren().filter(c => c.name.includes('mount_arm'))[2];
    if (braceMesh) braceMesh.rotation.x = -Math.PI * 0.25;

    // 3.  
    const capH = size.height * 0.1;
    cylinderComponent(registry, item, wallLanternLight, 'frame', {
      diameterTop: size.width * 0.12, diameterBottom: size.width * 0.65, height: capH, tessellation: 12
    }, { position: { x: 0, y: size.height * 0.64, z: size.depth * 0.15 } }, { parent: node });

    // 4.   ( )
    const shadeH = size.height * 0.42;
    cylinderComponent(registry, item, wallLanternLight, 'lantern_shade', {
      diameterTop: size.width * 0.65, diameterBottom: size.width * 0.88, height: shadeH * 0.5, tessellation: 16
    }, { position: { x: 0, y: size.height * 0.64 - capH / 2 - shadeH * 0.25, z: size.depth * 0.15 } }, { parent: node });

    cylinderComponent(registry, item, wallLanternLight, 'lantern_shade', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.45, height: shadeH * 0.5, tessellation: 16
    }, { position: { x: 0, y: size.height * 0.64 - capH / 2 - shadeH * 0.75, z: size.depth * 0.15 } }, { parent: node });

    // 5.  
    const botFrameH = size.height * 0.05;
    cylinderComponent(registry, item, wallLanternLight, 'frame', {
      diameterTop: size.width * 0.45, diameterBottom: size.width * 0.3, height: botFrameH, tessellation: 12
    }, { position: { x: 0, y: size.height * 0.64 - capH / 2 - shadeH - botFrameH / 2, z: size.depth * 0.15 } }, { parent: node });

    // 6.  
    const tasselH = size.height * 0.22;
    cylinderComponent(registry, item, wallLanternLight, 'tassel', {
      diameterTop: 0.012, diameterBottom: 0.035, height: tasselH, tessellation: 10
    }, { position: { x: 0, y: size.height * 0.64 - capH / 2 - shadeH - botFrameH - tasselH / 2, z: size.depth * 0.15 } }, { parent: node });

    sphereComponent(registry, item, wallLanternLight, 'tassel', {
      diameter: 0.045, segments: 10
    }, { position: { x: 0, y: size.height * 0.64 - capH / 2 - shadeH - botFrameH - tasselH * 0.2, z: size.depth * 0.15 } }, { parent: node });
  }
};

// 12.   (Deluxe Crystal Chandelier)
export const deluxeCrystalChandelier = {
  type: 'deluxe_crystal_chandelier',
  name: 'Deluxe Crystal Chandelier',
  unit: 'm',
  defaultSize: { width: 0.85, depth: 0.85, height: 1.1 },
  placeType: 'ceiling',
  emissiveComponents: ['bulbs', 'crystals'],
  lightColorComponent: 'bulbs',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -0.6, z: 0 },
    color: '#fff8e7',
    intensity: 1.25,
    range: 6.5
  },
  components: [
    { id: 'crystals', label: 'Component', defaultColor: '#e0f7fa' },
    { id: 'frame', label: 'Component', defaultColor: '#d4af37' },
    { id: 'bulbs', label: 'Component', defaultColor: '#fffde7' },
    { id: 'chain', label: 'Component', defaultColor: '#b8860b' }
  ],
  build(registry, item, node, size) {
    const totalH = size.height;
    const chainH = totalH * 0.3;
    const bodyH = totalH * 0.7;

    // 1.  
    cylinderComponent(registry, item, deluxeCrystalChandelier, 'chain', {
      diameterTop: size.width * 0.22, diameterBottom: size.width * 0.18, height: totalH * 0.05, tessellation: 16
    }, { position: { x: 0, y: totalH - totalH * 0.025, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, deluxeCrystalChandelier, 'chain', {
      diameterTop: 0.025, diameterBottom: 0.025, height: chainH, tessellation: 8
    }, { position: { x: 0, y: totalH - chainH / 2, z: 0 } }, { parent: node });

    // 2.  
    const centerColH = bodyH * 0.85;
    cylinderComponent(registry, item, deluxeCrystalChandelier, 'frame', {
      diameterTop: size.width * 0.08, diameterBottom: size.width * 0.12, height: centerColH, tessellation: 12
    }, { position: { x: 0, y: totalH - chainH - centerColH / 2, z: 0 } }, { parent: node });

    //  
    const upperDishY = totalH - chainH - centerColH * 0.25;
    cylinderComponent(registry, item, deluxeCrystalChandelier, 'frame', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.22, height: totalH * 0.04, tessellation: 16
    }, { position: { x: 0, y: upperDishY, z: 0 } }, { parent: node });

    const lowerDishY = totalH - chainH - centerColH * 0.75;
    cylinderComponent(registry, item, deluxeCrystalChandelier, 'frame', {
      diameterTop: size.width * 0.45, diameterBottom: size.width * 0.35, height: totalH * 0.05, tessellation: 16
    }, { position: { x: 0, y: lowerDishY, z: 0 } }, { parent: node });

    // 3.   (6 )
    const armCount = 6;
    const armRadius = size.width * 0.4;
    const candleH = totalH * 0.12;

    for (let i = 0; i < armCount; i++) {
      const angle = (i * Math.PI * 2) / armCount;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const armEndX = cosA * armRadius;
      const armEndZ = sinA * armRadius;
      const armY = lowerDishY + totalH * 0.05;

      //  Metal 
      cylinderComponent(registry, item, deluxeCrystalChandelier, 'frame', {
        diameterTop: 0.018, diameterBottom: 0.024, height: armRadius, tessellation: 8
      }, { position: { x: armEndX * 0.5, y: lowerDishY, z: armEndZ * 0.5 } }, { parent: node });

      //  
      cylinderComponent(registry, item, deluxeCrystalChandelier, 'frame', {
        diameterTop: size.width * 0.1, diameterBottom: size.width * 0.08, height: totalH * 0.02, tessellation: 12
      }, { position: { x: armEndX, y: armY, z: armEndZ } }, { parent: node });

      //  Emissive 
      cylinderComponent(registry, item, deluxeCrystalChandelier, 'bulbs', {
        diameterTop: 0.022, diameterBottom: 0.022, height: candleH, tessellation: 10
      }, { position: { x: armEndX, y: armY + candleH / 2, z: armEndZ } }, { parent: node });

      sphereComponent(registry, item, deluxeCrystalChandelier, 'bulbs', {
        diameter: 0.045, segments: 10
      }, { position: { x: armEndX, y: armY + candleH + 0.025, z: armEndZ } }, { parent: node });

      //  
      sphereComponent(registry, item, deluxeCrystalChandelier, 'crystals', {
        diameter: 0.038, segments: 8
      }, { position: { x: armEndX, y: armY - 0.05, z: armEndZ } }, { parent: node });
    }

    // 4.  （  +  ）
    const innerCrystalCount = 8;
    for (let j = 0; j < innerCrystalCount; j++) {
      const angle = (j * Math.PI * 2) / innerCrystalCount;
      const r = armRadius * 0.55;
      const cx = Math.cos(angle) * r;
      const cz = Math.sin(angle) * r;

      cylinderComponent(registry, item, deluxeCrystalChandelier, 'crystals', {
        diameterTop: 0.015, diameterBottom: 0.02, height: totalH * 0.22, tessellation: 8
      }, { position: { x: cx, y: upperDishY - totalH * 0.12, z: cz } }, { parent: node });
    }

    //  
    sphereComponent(registry, item, deluxeCrystalChandelier, 'crystals', {
      diameter: size.width * 0.14, segments: 12
    }, { position: { x: 0, y: totalH - chainH - centerColH - 0.04, z: 0 } }, { parent: node });
  }
};

// 13.   (Chinese Red Lantern)
export const chineseRedLantern = {
  type: 'chinese_red_lantern',
  name: 'Chinese Red Lantern',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.6, height: 0.85 },
  placeType: 'ceiling',
  emissiveComponents: ['lantern_body'],
  lightColorComponent: 'lantern_body',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -0.3, z: 0 },
    color: '#ff2a00',
    intensity: 1.0,
    range: 5.0
  },
  components: [
    { id: 'lantern_body', label: 'Component', defaultColor: '#d32f2f' },
    { id: 'gold_trim', label: 'Component', defaultColor: '#ffb300' },
    { id: 'frame', label: 'Component', defaultColor: '#3e2723' },
    { id: 'tassel', label: 'Component', defaultColor: '#b71c1c' },
    { id: 'cord', label: 'Component', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const totalH = size.height;
    const cordH = totalH * 0.22;
    const mainH = totalH * 0.52;
    const tasselH = totalH * 0.26;

    const lanternW = size.width;

    // 1.  / 
    cylinderComponent(registry, item, chineseRedLantern, 'cord', {
      diameterTop: 0.012, diameterBottom: 0.012, height: cordH, tessellation: 8
    }, { position: { x: 0, y: totalH - cordH / 2, z: 0 } }, { parent: node });

    //  
    sphereComponent(registry, item, chineseRedLantern, 'gold_trim', {
      diameter: 0.05, segments: 10
    }, { position: { x: 0, y: totalH - cordH, z: 0 } }, { parent: node });

    // 2.   (  +  )
    const topCapH = mainH * 0.12;
    const topCapY = totalH - cordH - topCapH / 2;
    cylinderComponent(registry, item, chineseRedLantern, 'frame', {
      diameterTop: lanternW * 0.35, diameterBottom: lanternW * 0.52, height: topCapH, tessellation: 16
    }, { position: { x: 0, y: topCapY, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, chineseRedLantern, 'gold_trim', {
      diameterTop: lanternW * 0.53, diameterBottom: lanternW * 0.53, height: topCapH * 0.25, tessellation: 16
    }, { position: { x: 0, y: totalH - cordH - topCapH + topCapH * 0.125, z: 0 } }, { parent: node });

    // 3.   (3 )
    const bodyTopY = totalH - cordH - topCapH; //  
    const shadeH = mainH * 0.76;
    const subH = shadeH / 3;

    //  
    cylinderComponent(registry, item, chineseRedLantern, 'lantern_body', {
      diameterTop: lanternW * 0.52, diameterBottom: lanternW * 0.96, height: subH, tessellation: 24
    }, { position: { x: 0, y: bodyTopY - subH / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, chineseRedLantern, 'lantern_body', {
      diameterTop: lanternW * 0.96, diameterBottom: lanternW * 0.96, height: subH, tessellation: 24
    }, { position: { x: 0, y: bodyTopY - subH * 1.5, z: 0 } }, { parent: node });

    //   ( )
    cylinderComponent(registry, item, chineseRedLantern, 'lantern_body', {
      diameterTop: lanternW * 0.96, diameterBottom: lanternW * 0.52, height: subH, tessellation: 24
    }, { position: { x: 0, y: bodyTopY - subH * 2.5, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, chineseRedLantern, 'gold_trim', {
      diameterTop: lanternW * 0.97, diameterBottom: lanternW * 0.97, height: 0.02, tessellation: 24
    }, { position: { x: 0, y: bodyTopY - subH * 1.5, z: 0 } }, { parent: node });

    // 4.   (  bodyBottomY)
    const bodyBottomY = bodyTopY - shadeH; //   Y  
    const botCapH = mainH * 0.14;

    //  
    cylinderComponent(registry, item, chineseRedLantern, 'gold_trim', {
      diameterTop: lanternW * 0.53, diameterBottom: lanternW * 0.53, height: botCapH * 0.3, tessellation: 16
    }, { position: { x: 0, y: bodyBottomY - (botCapH * 0.3) / 2, z: 0 } }, { parent: node });

    //  
    cylinderComponent(registry, item, chineseRedLantern, 'frame', {
      diameterTop: lanternW * 0.52, diameterBottom: lanternW * 0.35, height: botCapH, tessellation: 16
    }, { position: { x: 0, y: bodyBottomY - botCapH / 2, z: 0 } }, { parent: node });

    // 5.  
    const botCapBottomY = bodyBottomY - botCapH; //   Y  
    sphereComponent(registry, item, chineseRedLantern, 'gold_trim', {
      diameter: 0.055, segments: 10
    }, { position: { x: 0, y: botCapBottomY - 0.025, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, chineseRedLantern, 'tassel', {
      diameterTop: 0.025, diameterBottom: 0.075, height: tasselH * 0.8, tessellation: 12
    }, { position: { x: 0, y: botCapBottomY - 0.025 - (tasselH * 0.8) / 2, z: 0 } }, { parent: node });
  }
};



