import { boxComponent, cylinderComponent } from './_helpers.js';

// 1.   (Bookshelf)
export const bookshelfFurniture = {
  type: 'bookshelf',
  name: 'Bookshelf',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.3, height: 1.85 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: '#8a6b51' },
    { id: 'shelves', label: 'Component', defaultColor: '#a68065' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.04;
    const backT = 0.01;

    //  
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: size.height - wallT / 2, z: 0 } }, { parent: node });

    //  
    const baseH = 0.06;
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: size.width - wallT * 2, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: size.width, height: size.height, depth: backT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + backT / 2 } }, { parent: node });

    //  
    const innerW = size.width - wallT * 2;
    const shelfH = 0.03;
    const shelfD = size.depth - 0.02;
    [0.25, 0.50, 0.75].forEach((ratio) => {
      boxComponent(registry, item, bookshelfFurniture, 'shelves', {
        width: innerW, height: shelfH, depth: shelfD
      }, { position: { x: 0, y: size.height * ratio, z: backT / 2 } }, { parent: node });
    });
  }
};

// 2.   (Console)
export const consoleFurniture = {
  type: 'console',
  name: 'Console',
  unit: 'm',
  defaultSize: { width: 1.5, depth: 0.4, height: 0.5 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#e9e6e0' },
    { id: 'legs', label: 'Component', defaultColor: '#80776b' }
  ],
  build(registry, item, node, size) {
    const legH = size.height * 0.24;
    const cabH = size.height * 0.76;

    boxComponent(registry, item, consoleFurniture, 'cabinet', {
      width: size.width, height: cabH, depth: size.depth
    }, { position: { x: 0, y: legH + cabH / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, consoleFurniture, 'legs', {
      width: 0.015, height: cabH * 0.88, depth: 0.01
    }, { position: { x: 0, y: legH + cabH / 2, z: size.depth / 2 + 0.005 } }, { parent: node });

    const legW = Math.max(0.03, size.width * 0.05);
    const legD = Math.max(0.03, size.depth * 0.12);
    const xOffset = size.width * 0.42;
    const zOffset = size.depth * 0.36;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, consoleFurniture, 'legs', {
          width: legW, height: legH, depth: legD
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });
  }
};

// 3. Bedroom  (Wardrobe)
export const wardrobeFurniture = {
  type: 'wardrobe',
  name: 'Wardrobe',
  unit: 'm',
  defaultSize: { width: 1.05, depth: 0.6, height: 2.05 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#e9e3d5' },
    { id: 'doors', label: 'Component', defaultColor: '#d1c9b7' },
    { id: 'handles', label: 'Component', defaultColor: '#5c5547' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, wardrobeFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const doorT = 0.02;
    const doorW = (size.width - 0.06) / 2;
    const doorH = size.height * 0.94;
    const doorY = size.height * 0.49;
    const doorZ = size.depth / 2 + doorT / 2;

    boxComponent(registry, item, wardrobeFurniture, 'doors', {
      width: doorW, height: doorH, depth: doorT
    }, { position: { x: -doorW / 2 - 0.01, y: doorY, z: doorZ } }, { parent: node });

    boxComponent(registry, item, wardrobeFurniture, 'doors', {
      width: doorW, height: doorH, depth: doorT
    }, { position: { x: doorW / 2 + 0.01, y: doorY, z: doorZ } }, { parent: node });

    const handleW = 0.015;
    const handleH = size.height * 0.18;
    const handleD = 0.015;
    const handleZ = doorZ + doorT / 2 + handleD / 2;

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, wardrobeFurniture, 'handles', {
        width: handleW, height: handleH, depth: handleD
      }, { position: { x: side * 0.025, y: size.height * 0.5, z: handleZ } }, { parent: node });
    });
  }
};

// 4.  Headboard  (Nightstand)
export const nightstandFurniture = {
  type: 'nightstand',
  name: 'Nightstand',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.45, height: 0.6 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#e3dfd8' },
    { id: 'drawer', label: 'Component', defaultColor: '#bcaea0' },
    { id: 'legs', label: 'Component', defaultColor: '#6f6458' }
  ],
  build(registry, item, node, size) {
    const legH = size.height * 0.15;
    const cabH = size.height * 0.85;

    boxComponent(registry, item, nightstandFurniture, 'cabinet', {
      width: size.width, height: cabH, depth: size.depth
    }, { position: { x: 0, y: legH + cabH / 2, z: 0 } }, { parent: node });

    const dThick = 0.02;
    const dW = size.width * 0.88;
    const dH = cabH * 0.36;
    const dZ = size.depth / 2 + dThick / 2;

    boxComponent(registry, item, nightstandFurniture, 'drawer', {
      width: dW, height: dH, depth: dThick
    }, { position: { x: 0, y: legH + cabH * 0.26, z: dZ } }, { parent: node });

    boxComponent(registry, item, nightstandFurniture, 'drawer', {
      width: dW, height: dH, depth: dThick
    }, { position: { x: 0, y: legH + cabH * 0.70, z: dZ } }, { parent: node });

    const legW = Math.max(0.02, size.width * 0.1);
    const legD = Math.max(0.02, size.depth * 0.1);
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, nightstandFurniture, 'legs', {
          width: legW, height: legH, depth: legD
        }, { position: { x: x * (size.width / 2 - legW / 2), y: legH / 2, z: z * (size.depth / 2 - legD / 2) } }, { parent: node });
      });
    });
  }
};

// 6.   (Shoerack)
export const shoerackFurniture = {
  type: 'shoerack',
  name: 'Shoerack',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.3, height: 0.45 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: '#80634e' },
    { id: 'slats', label: 'Component', defaultColor: '#a1846f' }
  ],
  build(registry, item, node, size) {
    //  
    const sideW = 0.03;
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, shoerackFurniture, 'frame', {
        width: sideW, height: size.height, depth: size.depth
      }, { position: { x: side * (size.width / 2 - sideW / 2), y: size.height / 2, z: 0 } }, { parent: node });
    });

    // 2 
    const shelfW = size.width - sideW * 2;
    [0.32, 0.72].forEach((ratio) => {
      boxComponent(registry, item, shoerackFurniture, 'slats', {
        width: shelfW, height: 0.02, depth: size.depth * 0.88
      }, { position: { x: 0, y: size.height * ratio, z: 0 } }, { parent: node });
    });
  }
};

// 7.   (Chest Drawers)
export const chestDrawersFurniture = {
  type: 'chest_drawers',
  name: 'Chest Drawers',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.45, height: 1.2 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#e6d6c3' },
    { id: 'drawers', label: 'Component', defaultColor: '#d1bfad' },
    { id: 'knobs', label: 'Round knobs', defaultColor: '#594c3d' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, chestDrawersFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const dH = size.height * 0.17;
    const dW = size.width * 0.92;
    const dZ = size.depth / 2 + 0.01;

    [0.10, 0.28, 0.46, 0.64, 0.82].forEach((ratio) => {
      boxComponent(registry, item, chestDrawersFurniture, 'drawers', {
        width: dW, height: dH, depth: 0.02
      }, { position: { x: 0, y: size.height * ratio + dH / 2, z: dZ } }, { parent: node });

      //  
      boxComponent(registry, item, chestDrawersFurniture, 'knobs', {
        width: 0.025, height: 0.025, depth: 0.02
      }, { position: { x: 0, y: size.height * ratio + dH / 2, z: dZ + 0.015 } }, { parent: node });
    });
  }
};

// 8.   (Sideboard)
export const sideboardFurniture = {
  type: 'sideboard',
  name: 'Sideboard',
  unit: 'm',
  defaultSize: { width: 1.35, depth: 0.4, height: 0.8 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#ebd9c1' },
    { id: 'doors', label: 'Component', defaultColor: '#d1bfad' },
    { id: 'drawers', label: 'Component', defaultColor: '#d1bfad' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, sideboardFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    const midW = size.width * 0.36;
    const dH = size.height * 0.28;
    const dZ = size.depth / 2 + 0.01;
    [0.12, 0.44, 0.76].forEach((ratio) => {
      boxComponent(registry, item, sideboardFurniture, 'drawers', {
        width: midW, height: dH, depth: 0.02
      }, { position: { x: 0, y: size.height * ratio, z: dZ } }, { parent: node });
    });

    //  
    const doorW = (size.width - midW - 0.06) / 2;
    const doorH = size.height * 0.90;
    const doorY = size.height * 0.48;
    boxComponent(registry, item, sideboardFurniture, 'doors', {
      width: doorW, height: doorH, depth: 0.02
    }, { position: { x: -size.width / 2 + doorW / 2 + 0.015, y: doorY, z: dZ } }, { parent: node });

    boxComponent(registry, item, sideboardFurniture, 'doors', {
      width: doorW, height: doorH, depth: 0.02
    }, { position: { x: size.width / 2 - doorW / 2 - 0.015, y: doorY, z: dZ } }, { parent: node });
  }
};

// 9. Glass  (Display Cabinet)
export const displayCabinetFurniture = {
  type: 'display_cabinet',
  name: 'Display Cabinet',
  unit: 'm',
  defaultSize: { width: 0.7, depth: 0.35, height: 1.75 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#403c39' },
    { id: 'glass', label: 'Glass doors', defaultColor: '#d4efff' },
    { id: 'shelves', label: 'Component', defaultColor: '#c9bdad' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.04;
    const backT = 0.01;

    // 1.   ( 、 、 、 、 )
    //  
    boxComponent(registry, item, displayCabinetFurniture, 'cabinet', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, displayCabinetFurniture, 'cabinet', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, displayCabinetFurniture, 'cabinet', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: size.height - wallT / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, displayCabinetFurniture, 'cabinet', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: wallT / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, displayCabinetFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: backT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + backT / 2 } }, { parent: node });

    // 2. Glass  (Glass Panel) -  
    boxComponent(registry, item, displayCabinetFurniture, 'glass', {
      width: size.width - wallT * 1.5, height: size.height * 0.94, depth: 0.01
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 + 0.005 } }, { parent: node });

    // 3.  
    const innerW = size.width - wallT * 2;
    [0.28, 0.52, 0.76].forEach((ratio) => {
      boxComponent(registry, item, displayCabinetFurniture, 'shelves', {
        width: innerW, height: 0.02, depth: size.depth - 0.04
      }, { position: { x: 0, y: size.height * ratio, z: 0 } }, { parent: node });
    });
  }
};

// 10.   (Wall Shelf)
export const wallShelfFurniture = {
  type: 'wall_shelf',
  name: 'Wall Shelf',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.2, height: 0.05 },
  placeType: 'wall',
  components: [
    { id: 'board', label: 'Component', defaultColor: '#aa845d' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, wallShelfFurniture, 'board', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 11.   (Grid Cabinet)
export const gridCabinetFurniture = {
  type: 'grid_cabinet',
  name: 'Grid Cabinet',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.3, height: 1 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: '#f5f5f5' },
    { id: 'divider', label: 'Component', defaultColor: '#d2b48c' },
    { id: 'basket', label: 'Component', defaultColor: '#f4a460' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.03;
    const backT = 0.01;

    // 1.   ( 、 、 、 、 )
    //  
    boxComponent(registry, item, gridCabinetFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gridCabinetFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gridCabinetFurniture, 'frame', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: size.height - wallT / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gridCabinetFurniture, 'frame', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: wallT / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, gridCabinetFurniture, 'frame', {
      width: size.width, height: size.height, depth: backT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + backT / 2 } }, { parent: node });

    const innerW = size.width - wallT * 2;
    const innerH = size.height - wallT * 2;
    const shelfH = 0.02;

    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: innerW, height: shelfH, depth: size.depth - 0.01
    }, { position: { x: 0, y: size.height * 0.33, z: 0.005 } }, { parent: node });
    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: innerW, height: shelfH, depth: size.depth - 0.01
    }, { position: { x: 0, y: size.height * 0.66, z: 0.005 } }, { parent: node });

    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: shelfH, height: innerH, depth: size.depth - 0.01
    }, { position: { x: -size.width * 0.16, y: size.height / 2, z: 0.005 } }, { parent: node });
    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: shelfH, height: innerH, depth: size.depth - 0.01
    }, { position: { x: size.width * 0.16, y: size.height / 2, z: 0.005 } }, { parent: node });

    // boxComponent(registry, item, gridCabinetFurniture, 'basket', {
    //   width: size.width * 0.26, height: size.height * 0.26, depth: size.depth - 0.02
    // }, { position: { x: -size.width * 0.3, y: size.height * 0.8, z: 0.01 } }, { parent: node });

    // boxComponent(registry, item, gridCabinetFurniture, 'basket', {
    //   width: size.width * 0.26, height: size.height * 0.26, depth: size.depth - 0.02
    // }, { position: { x: size.width * 0.3, y: size.height * 0.2, z: 0.01 } }, { parent: node });
  }
};

// 12.   (Parcel Locker)
export const parcelLockerFurniture = {
  type: 'parcel_locker',
  name: 'Parcel Locker',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.45, height: 1.95 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#ff8800' },
    { id: 'doors', label: 'Component', defaultColor: '#d0d4d9' },
    { id: 'screen', label: 'Component', defaultColor: '#00aaff' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, parcelLockerFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const cols = 4;
    const rows = 5;
    const doorW = size.width / cols - 0.015;
    const doorH = size.height / rows - 0.015;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 2 && (c === 1 || c === 2)) continue;

        const posX = -size.width / 2 + doorW / 2 + c * (doorW + 0.01) + 0.007;
        const posY = doorH / 2 + r * (doorH + 0.01) + 0.007;
        boxComponent(registry, item, parcelLockerFurniture, 'doors', {
          width: doorW, height: doorH, depth: 0.008
        }, { position: { x: posX, y: posY, z: size.depth / 2 + 0.004 } }, { parent: node });
      }
    }

    boxComponent(registry, item, parcelLockerFurniture, 'screen', {
      width: doorW * 2, height: doorH, depth: 0.008
    }, { position: { x: 0, y: doorH / 2 + 2 * (doorH + 0.01), z: size.depth / 2 + 0.004 } }, { parent: node });
  }
};

// 13.   (Corner Shelf)
export const cornerShelfFurniture = {
  type: 'corner_shelf',
  name: 'Corner Shelf',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 1.5 },
  components: [
    { id: 'pole', label: 'Component', defaultColor: '#4e342e' },
    { id: 'shelves', label: 'Quarter-round shelves', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const poleD = 0.03;
    boxComponent(registry, item, cornerShelfFurniture, 'pole', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, cornerShelfFurniture, 'pole', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: size.width / 2 - poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, cornerShelfFurniture, 'pole', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: size.depth / 2 - poleD / 2 } }, { parent: node });

    const shelfH = 0.02;
    [0.15, 0.4, 0.65, 0.9].forEach(ratio => {
      boxComponent(registry, item, cornerShelfFurniture, 'shelves', {
        width: size.width - 0.02, height: shelfH, depth: size.depth - 0.02
      }, { position: { x: -0.01, y: size.height * ratio, z: -0.01 } }, { parent: node });
    });
  }
};

// 14.   (File Cabinet)
export const fileCabinetFurniture = {
  type: 'file_cabinet',
  name: 'File Cabinet',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.6, height: 1.25 },
  components: [
    { id: 'cabinet', label: 'Component', defaultColor: '#78909c' },
    { id: 'handles', label: 'Component', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, fileCabinetFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const drawH = size.height / 4;
    for (let i = 0; i < 4; i++) {
      boxComponent(registry, item, fileCabinetFurniture, 'handles', {
        width: size.width * 0.9, height: 0.005, depth: 0.002
      }, { position: { x: 0, y: drawH * i + drawH - 0.005, z: size.depth / 2 + 0.001 } }, { parent: node });

      boxComponent(registry, item, fileCabinetFurniture, 'handles', {
        width: size.width * 0.4, height: 0.02, depth: 0.015
      }, { position: { x: 0, y: drawH * i + drawH * 0.5, z: size.depth / 2 + 0.008 } }, { parent: node });
    }
  }
};

// 15.   (Wine Rack)
export const wineRackFurniture = {
  type: 'wine_rack',
  name: 'Wine Rack',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.3, height: 0.35 },
  components: [
    { id: 'frame', label: 'Component', defaultColor: '#5c4033' },
    { id: 'divider', label: 'Component', defaultColor: '#8a6b51' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.02;
    const backT = 0.01;

    // 1.   ( 、 、 、 、 )
    //  
    boxComponent(registry, item, wineRackFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, wineRackFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, wineRackFurniture, 'frame', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: size.height - wallT / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, wineRackFurniture, 'frame', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: wallT / 2, z: 0 } }, { parent: node });

    //  
    boxComponent(registry, item, wineRackFurniture, 'frame', {
      width: size.width, height: size.height, depth: backT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + backT / 2 } }, { parent: node });

    // 2.   (X )
    const innerW = size.width - wallT * 2;
    const innerH = size.height - wallT * 2;
    const shelfL = Math.sqrt(innerW * innerW + innerH * innerH);
    const shelfD = size.depth - backT - 0.01;
    const theta = Math.atan2(innerH, innerW);

    boxComponent(registry, item, wineRackFurniture, 'divider', {
      width: shelfL, height: 0.015, depth: shelfD
    }, {
      position: { x: 0, y: size.height / 2, z: backT / 2 },
      rotation: { x: 0, y: 0, z: theta }
    }, { parent: node });

    boxComponent(registry, item, wineRackFurniture, 'divider', {
      width: shelfL, height: 0.015, depth: shelfD
    }, {
      position: { x: 0, y: size.height / 2, z: backT / 2 },
      rotation: { x: 0, y: 0, z: -theta }
    }, { parent: node });
  }
};

// 16.   (Coat Rack)
export const coatRackFurniture = {
  type: 'coat_rack',
  name: 'Coat Rack',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 1.75 },
  components: [
    { id: 'base', label: 'Component', defaultColor: '#3e2723' },
    { id: 'pole', label: 'Component', defaultColor: '#4e342e' },
    { id: 'hooks', label: 'Component', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, coatRackFurniture, 'base', {
      diameterTop: size.width * 0.8, diameterBottom: size.width, height: size.height * 0.05
    }, { position: { x: 0, y: size.height * 0.025, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, coatRackFurniture, 'pole', {
      diameterTop: 0.04, diameterBottom: 0.06, height: size.height * 0.95
    }, { position: { x: 0, y: size.height * 0.5, z: 0 } }, { parent: node });

    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    angles.forEach((ang, idx) => {
      const hook = boxComponent(registry, item, coatRackFurniture, 'hooks', {
        width: 0.02, height: 0.03, depth: size.width * 0.28
      }, { position: { x: Math.sin(ang) * 0.08, y: size.height * 0.8 - idx * 0.04, z: Math.cos(ang) * 0.08 } }, { parent: node });
      hook.rotation.y = ang;
      hook.rotation.x = -Math.PI * 0.15;
    });
  }
};

// 17.   (Umbrella Stand)
export const umbrellaStandFurniture = {
  type: 'umbrella_stand',
  name: 'Umbrella Stand',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.55 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#263238' },
    { id: 'umbrella', label: 'Component', defaultColor: '#ffd54f' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, umbrellaStandFurniture, 'body', {
      diameterTop: size.width, diameterBottom: size.width * 0.9, height: size.height
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, umbrellaStandFurniture, 'umbrella', {
      diameterTop: 0.015, diameterBottom: 0.015, height: size.height * 0.6
    }, { position: { x: -size.width * 0.1, y: size.height * 1.1, z: size.depth * 0.1 } }, { parent: node });
  }
};

// 18.   (Drawer Cabinet)
export const drawerCabinetFurniture = {
  type: 'drawer_cabinet',
  name: 'Drawer Cabinet',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.45, height: 0.8 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#efebe9' },
    { id: 'drawers', label: 'Component', defaultColor: '#d7ccc8' },
    { id: 'handles', label: 'Component', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, drawerCabinetFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const layerH = size.height / 3 - 0.015;
    for (let i = 0; i < 3; i++) {
      const posY = layerH / 2 + i * (layerH + 0.01) + 0.01;
      boxComponent(registry, item, drawerCabinetFurniture, 'drawers', {
        width: size.width * 0.94, height: layerH, depth: 0.01
      }, { position: { x: 0, y: posY, z: size.depth / 2 + 0.002 } }, { parent: node });

      boxComponent(registry, item, drawerCabinetFurniture, 'handles', {
        width: size.width * 0.28, height: 0.02, depth: 0.02
      }, { position: { x: 0, y: posY, z: size.depth / 2 + 0.012 } }, { parent: node });
    }
  }
};
