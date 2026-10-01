import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const toiletFurniture = {
  type: 'toilet',
  name: 'Toilet',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.7, height: 0.75 },
  components: [
    { id: 'bowl', label: 'Component', defaultColor: '#f7f9fa' },
    { id: 'tank', label: 'Component', defaultColor: '#f0f2f5' },
    { id: 'lid', label: 'Component', defaultColor: '#ffffff' },
    { id: 'water', label: 'Component', defaultColor: '#aae3ff' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const bowlHeight = size.height * 0.54;
      const lidHeight = 0.025;
      return [
        { x: 0, y: bowlHeight + lidHeight, z: size.depth * 0.12, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const bowlHeight = size.height * 0.54;
    const tankHeight = size.height * 0.46;
    const tankDepth = size.depth * 0.28;

    // 1.  ， 
    const solidH = bowlHeight * 0.7;
    const rimH = bowlHeight * 0.3;
    const t = size.width * 0.12; //  

    //  
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88, height: solidH, depth: size.depth * 0.72
    }, { position: { x: 0, y: solidH / 2, z: size.depth * 0.12 } }, { parent: node });

    //  
    //  
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: t, height: rimH, depth: size.depth * 0.72
    }, { position: { x: -size.width * 0.88 / 2 + t / 2, y: solidH + rimH / 2, z: size.depth * 0.12 } }, { parent: node });

    //  
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: t, height: rimH, depth: size.depth * 0.72
    }, { position: { x: size.width * 0.88 / 2 - t / 2, y: solidH + rimH / 2, z: size.depth * 0.12 } }, { parent: node });

    //  
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88 - 2 * t, height: rimH, depth: t
    }, { position: { x: 0, y: solidH + rimH / 2, z: size.depth * 0.12 + size.depth * 0.72 / 2 - t / 2 } }, { parent: node });

    //  
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88 - 2 * t, height: rimH, depth: t
    }, { position: { x: 0, y: solidH + rimH / 2, z: size.depth * 0.12 - size.depth * 0.72 / 2 + t / 2 } }, { parent: node });

    // 2.  
    boxComponent(registry, item, toiletFurniture, 'water', {
      width: size.width * 0.88 - 2 * t - 0.002, height: 0.001, depth: size.depth * 0.72 - 2 * t - 0.002
    }, { position: { x: 0, y: solidH + 0.001, z: size.depth * 0.12 } }, { parent: node });

    // 3.  
    boxComponent(registry, item, toiletFurniture, 'tank', {
      width: size.width, height: tankHeight, depth: tankDepth
    }, { position: { x: 0, y: bowlHeight + tankHeight / 2, z: -size.depth / 2 + tankDepth / 2 } }, { parent: node });

    // 4.  （  lidOpen  ）
    const lidHeight = 0.025;
    const isLidOpen = item.lidOpen === true;

    if (isLidOpen) {
      //  ， 
      const lidD = size.depth * 0.68;
      boxComponent(registry, item, toiletFurniture, 'lid', {
        width: size.width * 0.84, height: lidHeight, depth: lidD
      }, {
        position: {
          x: 0,
          y: bowlHeight + (lidD / 2) * 0.985,
          z: -size.depth / 2 + tankDepth + 0.01 + (lidD / 2) * 0.17
        },
        rotation: { x: -Math.PI * 0.45, y: 0, z: 0 }
      }, { parent: node });
    } else {
      //  
      boxComponent(registry, item, toiletFurniture, 'lid', {
        width: size.width * 0.84, height: lidHeight, depth: size.depth * 0.68
      }, { position: { x: 0, y: bowlHeight + lidHeight / 2, z: size.depth * 0.12 } }, { parent: node });
    }

    // 5.  
    cylinderComponent(registry, item, toiletFurniture, 'lid', {
      diameterTop: 0.038, diameterBottom: 0.038, height: 0.008, tessellation: 12
    }, { position: { x: 0, y: size.height + 0.004, z: -size.depth / 2 + tankDepth / 2 } }, { parent: node });
  }
};

export const bathtubFurniture = {
  type: 'bathtub',
  waterControllable: true,
  name: ' Item',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 1.65, height: 0.6 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#f0f7fa' },
    { id: 'water', label: 'Component', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    //  （ ，  32   1.33  ）
    const t = Math.max(0.04, Math.min(size.width * 0.08, 0.1)); //   0.08  (8 )
    const bottomH = Math.max(0.06, size.height * 0.15);         //   0.15  (15 )
    const wallH = size.height - bottomH;

    // 1.   (Body)
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width, height: bottomH, depth: size.depth
    }, { position: { x: 0, y: bottomH / 2, z: 0 } }, { parent: node });

    // 2.   (Body)
    //  
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: -size.width / 2 + t / 2, y: bottomH + wallH / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: size.width / 2 - t / 2, y: bottomH + wallH / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: bottomH + wallH / 2, z: size.depth / 2 - t / 2 } }, { parent: node });

    //  
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: bottomH + wallH / 2, z: -size.depth / 2 + t / 2 } }, { parent: node });

    // 3.   (Water Surface) -  
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, bathtubFurniture, 'water', {
        width: size.width - 2 * t - 0.01, height: 0.002, depth: size.depth - 2 * t - 0.01
      }, { position: { x: 0, y: bottomH + wallH * 0.7, z: 0 } }, { parent: node });
    }
  }
};

export const sinkBathroomFurniture = {
  type: 'sink_bathroom',
  waterControllable: true,
  name: ' Item',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.45, height: 0.85 },
  components: [
    { id: 'basin', label: 'Component', defaultColor: '#f2f6f7' },
    { id: 'pillar', label: 'Component', defaultColor: '#e1e6e8' },
    { id: 'faucet', label: 'Component', defaultColor: '#b3bdc4' },
    { id: 'water', label: 'Component', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.24;
    const pillarH = size.height - basinH;

    //  
    cylinderComponent(registry, item, sinkBathroomFurniture, 'pillar', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.44, height: pillarH, tessellation: 16
    }, { position: { x: 0, y: pillarH / 2, z: 0 } }, { parent: node });

    //   ( ， )
    const bottomH = basinH * 0.35; //  
    const wallH = basinH - bottomH; //  
    const t = Math.max(0.02, size.width * 0.08); //  

    // 1.   (basin)
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width, height: bottomH, depth: size.depth
    }, { position: { x: 0, y: pillarH + bottomH / 2, z: 0 } }, { parent: node });

    // 2.   (basin)
    //  
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: -size.width / 2 + t / 2, y: pillarH + bottomH + wallH / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: size.width / 2 - t / 2, y: pillarH + bottomH + wallH / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: pillarH + bottomH + wallH / 2, z: size.depth / 2 - t / 2 } }, { parent: node });

    //  
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: pillarH + bottomH + wallH / 2, z: -size.depth / 2 + t / 2 } }, { parent: node });

    // 3.   (faucet ) -  15%， 0.002
    cylinderComponent(registry, item, sinkBathroomFurniture, 'faucet', {
      diameterTop: size.width * 0.15, diameterBottom: size.width * 0.15, height: 0.002, tessellation: 12
    }, { position: { x: 0, y: pillarH + bottomH + 0.001, z: 0 } }, { parent: node });

    // 4.   (Water Surface) -  
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, sinkBathroomFurniture, 'water', {
        width: size.width - 2 * t - 0.002, height: 0.001, depth: size.depth - 2 * t - 0.002
      }, { position: { x: 0, y: pillarH + bottomH + wallH * 0.7, z: 0 } }, { parent: node });
    }

    // Metal 
    boxComponent(registry, item, sinkBathroomFurniture, 'faucet', {
      width: 0.03, height: 0.06, depth: 0.08
    }, { position: { x: 0, y: size.height + 0.03, z: -size.depth / 2 + 0.04 } }, { parent: node });
  }
};

export const showerCabinFurniture = {
  type: 'shower_cabin',
  name: 'Shower Cabin',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.9, height: 2.05 },
  components: [
    { id: 'tray', label: 'Component', defaultColor: '#ffffff' },
    { id: 'glass', label: ' ItemGlass', defaultColor: '#d6efff' },
    { id: 'shower', label: 'Component', defaultColor: '#cccccc' }
  ],
  build(registry, item, node, size) {
    const trayH = 0.08;
    // 1.  
    boxComponent(registry, item, showerCabinFurniture, 'tray', {
      width: size.width, height: trayH, depth: size.depth
    }, { position: { x: 0, y: trayH / 2, z: 0 } }, { parent: node });

    // 2.  Glass  ( ， Glass )
    const glassT = 0.01;
    const glassH = size.height - trayH;
    //  Glass 
    boxComponent(registry, item, showerCabinFurniture, 'glass', {
      width: size.width, height: glassH, depth: glassT
    }, { position: { x: 0, y: trayH + glassH / 2, z: size.depth / 2 - glassT / 2 } }, { parent: node });

    boxComponent(registry, item, showerCabinFurniture, 'glass', {
      width: glassT, height: glassH, depth: size.depth
    }, { position: { x: size.width / 2 - glassT / 2, y: trayH + glassH / 2, z: 0 } }, { parent: node });

    // 3.   (Shower Rod)
    cylinderComponent(registry, item, showerCabinFurniture, 'shower', {
      diameterTop: 0.016, diameterBottom: 0.016, height: size.height * 0.72, tessellation: 8
    }, { position: { x: -size.width / 2 + 0.06, y: trayH + (size.height * 0.72) / 2, z: -size.depth / 2 + 0.06 } }, { parent: node });
  }
};

export const mirrorBathroomFurniture = {
  type: 'mirror_bathroom',
  name: 'Mirror Bathroom',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.05, height: 0.6 },
  placeType: 'wall',
  isMirror: true,
  components: [
    { id: 'mirror', label: 'Mirror', defaultColor: '#edf3f7' },
    { id: 'frame', label: ' ItemEmissive Item', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const frameD = size.width;
    cylinderComponent(registry, item, mirrorBathroomFurniture, 'frame', {
      diameterTop: frameD, diameterBottom: frameD, height: 0.016, tessellation: 32
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const mirrorD = size.width * 0.90;
    cylinderComponent(registry, item, mirrorBathroomFurniture, 'mirror', {
      diameterTop: mirrorD, diameterBottom: mirrorD, height: 0.01, tessellation: 32
    }, { position: { x: 0, y: size.height / 2, z: 0.005 } }, { parent: node });

    //  
    const meshes = node.getChildren();
    meshes.forEach(m => {
      m.rotation.x = Math.PI * 0.5;
    });
  }
};

export const towelRackFurniture = {
  type: 'towel_rack',
  name: 'Towel Rack',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.15, height: 0.1 },
  placeType: 'wall',
  components: [
    { id: 'holder', label: 'Component', defaultColor: '#b0bec5' },
    { id: 'bar', label: 'Component', defaultColor: '#eceff1' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, towelRackFurniture, 'holder', {
      width: 0.02, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + 0.01, y: size.height / 2, z: size.depth / 2 } }, { parent: node });

    boxComponent(registry, item, towelRackFurniture, 'holder', {
      width: 0.02, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - 0.01, y: size.height / 2, z: size.depth / 2 } }, { parent: node });

    cylinderComponent(registry, item, towelRackFurniture, 'bar', {
      diameterTop: 0.016, diameterBottom: 0.016, height: size.width - 0.04
    }, { position: { x: 0, y: size.height * 0.8, z: size.depth * 0.8 } }, { parent: node });

    cylinderComponent(registry, item, towelRackFurniture, 'bar', {
      diameterTop: 0.016, diameterBottom: 0.016, height: size.width - 0.04
    }, { position: { x: 0, y: size.height * 0.4, z: size.depth * 0.3 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('bar')) {
        m.rotation.z = Math.PI * 0.5;
      }
    });
  }
};

export const toiletriesFurniture = {
  type: 'toiletries',
  name: 'Toiletries',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.15, height: 0.25 },
  components: [
    { id: 'basket', label: 'Component', defaultColor: '#90a4ae' },
    { id: 'bottles', label: 'Component', defaultColor: '#80cbc4' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, toiletriesFurniture, 'basket', {
      width: size.width, height: size.height * 0.25, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.125, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, toiletriesFurniture, 'bottles', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.35, height: size.height * 0.75
    }, { position: { x: -size.width * 0.22, y: size.height * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, toiletriesFurniture, 'bottles', {
      diameterTop: size.width * 0.3, diameterBottom: size.width * 0.3, height: size.height * 0.85
    }, { position: { x: size.width * 0.22, y: size.height * 0.55, z: 0 } }, { parent: node });
  }
};

export const soapDispenserFurniture = {
  type: 'soap_dispenser',
  name: 'Soap Dispenser',
  unit: 'm',
  defaultSize: { width: 0.1, depth: 0.1, height: 0.2 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#eceff1' },
    { id: 'nozzle', label: 'Component', defaultColor: '#455a64' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, soapDispenserFurniture, 'body', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height * 0.85
    }, { position: { x: 0, y: size.height * 0.425, z: 0 } }, { parent: node });

    boxComponent(registry, item, soapDispenserFurniture, 'nozzle', {
      width: size.width * 0.7, height: size.height * 0.1, depth: size.depth * 0.2
    }, { position: { x: size.width * 0.2, y: size.height * 0.9, z: 0 } }, { parent: node });
  }
};

export const bathroomShelfFurniture = {
  type: 'bathroom_shelf',
  name: 'Bathroom Shelf',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.3, height: 1.65 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: '#212121' },
    { id: 'shelves', label: 'Component', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const poleD = 0.02;
    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: size.width / 2 - poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: size.depth / 2 - poleD / 2 } }, { parent: node });

    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: size.width / 2 - poleD / 2, y: size.height / 2, z: size.depth / 2 - poleD / 2 } }, { parent: node });

    const shelfH = 0.02;
    [0.2, 0.45, 0.7, 0.95].forEach(ratio => {
      boxComponent(registry, item, bathroomShelfFurniture, 'shelves', {
        width: size.width - 0.01, height: shelfH, depth: size.depth - 0.01
      }, { position: { x: 0, y: size.height * ratio, z: 0 } }, { parent: node });
    });
  }
};

export const bathroomMirrorCabinetFurniture = {
  type: 'bathroom_mirror_cabinet',
  name: 'Bathroom',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.15, height: 0.75 },
  placeType: 'wall',
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#f5f5f5' },
    { id: 'mirror', label: 'Mirror Item', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, bathroomMirrorCabinetFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, bathroomMirrorCabinetFurniture, 'mirror', {
      width: size.width * 0.98, height: size.height * 0.98, depth: 0.01
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 + 0.005 } }, { parent: node });
  }
};
