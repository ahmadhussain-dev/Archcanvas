import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';
// ==================== 7.   (3 ) ====================

export const clothing_mannequin_male = {
  type: 'clothing_mannequin_male',
  name: 'Clothing Mannequin Male',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.2, height: 1.85 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#e0d0c0' },
    { id: 'base', label: 'Component', defaultColor: '#8c6c50' }
  ],
  build(registry, item, node, size) {
    buildMannequin(registry, item, clothing_mannequin_male, node, size, 'male');
  }
};

export const clothing_mannequin_female = {
  type: 'clothing_mannequin_female',
  name: 'Clothing Mannequin Female',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.18, height: 1.7 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#e0d0c0' },
    { id: 'base', label: 'Component', defaultColor: '#8c6c50' }
  ],
  build(registry, item, node, size) {
    buildMannequin(registry, item, clothing_mannequin_female, node, size, 'female');
  }
};

export const clothing_mannequin_child = {
  type: 'clothing_mannequin_child',
  name: 'Clothing Mannequin Child',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.15, height: 1.1 },
  components: [
    { id: 'body', label: 'Component', defaultColor: '#e0d0c0' },
    { id: 'base', label: 'Component', defaultColor: '#8c6c50' }
  ],
  build(registry, item, node, size) {
    buildMannequin(registry, item, clothing_mannequin_child, node, size, 'child');
  }
};

/**
 * 1.  /  ( ， )
 */
export function buildCloth(registry, item, definition, node, size, options = {}) {
  const sleeveType = options.sleeveType || 'short'; // 'none', 'short', 'long', 'strap'
  const hasCollar = options.hasCollar !== false;
  const hasHood = !!options.hasHood;
  const skirtType = options.skirtType || 'none'; // 'none', 'straight', 'flare'
  const isLolita = !!options.isLolita;

  node.getChildMeshes().forEach(m => m.dispose());

  //   (Body)
  const isShortCloth = skirtType === 'none';
  const bottomY = isShortCloth ? size.height * 0.08 : size.height * 0.02;
  const topY = size.height * 0.98;
  const bodyH = topY - bottomY;

  const topBodyH = isShortCloth ? bodyH : bodyH * 0.45;
  const topBodyY = topY - topBodyH / 2;

  boxComponent(registry, item, definition, 'fabric', {
    width: size.width * 0.8,
    height: topBodyH,
    depth: size.depth * 0.85
  }, {
    position: { x: 0, y: topBodyY, z: 0 }
  }, { parent: node });

  //   ( )
  if (skirtType === 'straight') {
    const skirtH = bodyH * 0.55;
    boxComponent(registry, item, definition, 'fabric', {
      width: size.width * 0.84,
      height: skirtH,
      depth: size.depth * 0.88
    }, {
      position: { x: 0, y: bottomY + skirtH / 2, z: 0 }
    }, { parent: node });
  } else if (skirtType === 'flare') {
    const skirtH = bodyH * 0.55;
    cylinderComponent(registry, item, definition, 'fabric', {
      height: skirtH,
      diameterTop: size.width * 0.8,
      diameterBottom: isLolita ? size.width * 1.4 : size.width * 1.05,
      tessellation: 16
    }, {
      position: { x: 0, y: bottomY + skirtH / 2, z: 0 }
    }, { parent: node });
  }

  //   (Sleeves)
  if (sleeveType === 'short') {
    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.18,
        height: size.height * 0.2,
        depth: size.depth * 0.85
      }, {
        position: { x: side * size.width * 0.45, y: size.height * 0.84, z: 0 },
        rotation: { x: 0, y: 0, z: -side * 0.4 }
      }, { parent: node });
    });
  } else if (sleeveType === 'long') {
    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.14,
        height: size.height * 0.5,
        depth: size.depth * 0.8
      }, {
        position: { x: side * size.width * 0.42, y: size.height * 0.65, z: 0 },
        rotation: { x: 0, y: 0, z: -side * 0.18 }
      }, { parent: node });
    });
  } else if (sleeveType === 'strap') {
    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'collar', {
        width: size.width * 0.04,
        height: size.height * 0.1,
        depth: size.depth * 0.12
      }, {
        position: { x: side * size.width * 0.25, y: size.height * 0.93, z: 0 }
      }, { parent: node });
    });
  }

  //   (Collar)
  if (hasCollar) {
    boxComponent(registry, item, definition, 'collar', {
      width: size.width * 0.36,
      height: size.height * 0.05,
      depth: size.depth * 0.9
    }, {
      position: { x: 0, y: size.height * 0.96, z: 0 }
    }, { parent: node });
  }

  //   (Hood)
  if (hasHood) {
    sphereComponent(registry, item, definition, 'collar', {
      diameter: size.width * 0.3
    }, {
      position: { x: 0, y: size.height * 0.95, z: -size.depth * 0.15 }
    }, { parent: node });
  }
}

/**
 * 2.  /  ( ， )
 */
export function buildPantsOrSkirt(registry, item, definition, node, size, options = {}) {
  const isSkirt = !!options.isSkirt;
  const pantsLength = options.pantsLength || 'long';
  const skirtType = options.skirtType || 'straight';

  node.getChildMeshes().forEach(m => m.dispose());

  const topY = size.height * 0.98;
  const bottomY = size.height * 0.02;
  const garmentH = topY - bottomY;

  if (isSkirt) {
    if (skirtType === 'pleated') {
      cylinderComponent(registry, item, definition, 'fabric', {
        height: garmentH,
        diameterTop: size.width * 0.7,
        diameterBottom: size.width * 1.05,
        tessellation: 20
      }, {
        position: { x: 0, y: bottomY + garmentH / 2, z: 0 }
      }, { parent: node });
    } else if (skirtType === 'a_line') {
      cylinderComponent(registry, item, definition, 'fabric', {
        height: garmentH,
        diameterTop: size.width * 0.68,
        diameterBottom: size.width * 0.98,
        tessellation: 12
      }, {
        position: { x: 0, y: bottomY + garmentH / 2, z: 0 }
      }, { parent: node });
    } else {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.72,
        height: garmentH,
        depth: size.depth * 0.85
      }, {
        position: { x: 0, y: bottomY + garmentH / 2, z: 0 }
      }, { parent: node });
    }
  } else {
    const waistH = size.height * 0.1;
    boxComponent(registry, item, definition, 'detail', {
      width: size.width * 0.8,
      height: waistH,
      depth: size.depth * 0.8
    }, {
      position: { x: 0, y: topY - waistH / 2, z: 0 }
    }, { parent: node });

    let legBottomY = bottomY;
    if (pantsLength === 'short') {
      legBottomY = size.height * 0.5;
    } else if (pantsLength === 'medium') {
      legBottomY = size.height * 0.3;
    }
    const legH = (topY - waistH) - legBottomY;

    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.35,
        height: legH,
        depth: size.depth * 0.78
      }, {
        position: { x: side * size.width * 0.2, y: legBottomY + legH / 2, z: 0 }
      }, { parent: node });
    });

    if (options.hasCargoPockets) {
      [-1, 1].forEach(side => {
        boxComponent(registry, item, definition, 'detail', {
          width: size.width * 0.07,
          height: legH * 0.3,
          depth: size.depth * 0.84
        }, {
          position: { x: side * (size.width * 0.35 + size.width * 0.04), y: legBottomY + legH * 0.5, z: 0 }
        }, { parent: node });
      });
    }
  }
}

/**
 * 3.   ( )
 */
export function buildHat(registry, item, definition, node, size, options = {}) {
  const brimType = options.brimType || 'round'; // 'round', 'front', 'none', 'downward', 'cowboy'
  const crownType = options.crownType || 'sphere'; // 'sphere', 'cylinder', 'flat'

  node.getChildMeshes().forEach(m => m.dispose());

  const brimH = size.height * 0.08;
  if (brimType === 'round') {
    cylinderComponent(registry, item, definition, 'brim', {
      height: brimH,
      diameterTop: size.width,
      diameterBottom: size.width,
      tessellation: 24
    }, {
      position: { x: 0, y: brimH / 2, z: 0 }
    }, { parent: node });
  } else if (brimType === 'front') {
    boxComponent(registry, item, definition, 'brim', {
      width: size.width * 0.75,
      height: brimH,
      depth: size.depth * 0.45
    }, {
      position: { x: 0, y: brimH / 2, z: size.depth * 0.25 },
      rotation: { x: 0.1, y: 0, z: 0 }
    }, { parent: node });
  } else if (brimType === 'downward') {
    cylinderComponent(registry, item, definition, 'brim', {
      height: size.height * 0.22,
      diameterTop: size.width * 0.65,
      diameterBottom: size.width,
      tessellation: 20
    }, {
      position: { x: 0, y: size.height * 0.11, z: 0 }
    }, { parent: node });
  } else if (brimType === 'cowboy') {
    cylinderComponent(registry, item, definition, 'brim', {
      height: brimH,
      diameterTop: size.width,
      diameterBottom: size.width,
      tessellation: 20
    }, {
      position: { x: 0, y: size.height * 0.12, z: 0 },
      rotation: { x: 0.08, y: 0, z: 0.12 }
    }, { parent: node });
  }

  const crownYStart = brimType === 'downward' ? size.height * 0.22 : (brimType === 'cowboy' ? size.height * 0.15 : brimH);
  const crownH = size.height - crownYStart;

  if (crownType === 'sphere') {
    sphereComponent(registry, item, definition, 'fabric', {
      diameter: size.width * 0.68
    }, {
      position: { x: 0, y: crownYStart + crownH * 0.4, z: brimType === 'front' ? -size.depth * 0.05 : 0 }
    }, { parent: node });
  } else if (crownType === 'cylinder') {
    cylinderComponent(registry, item, definition, 'fabric', {
      height: crownH,
      diameterTop: size.width * 0.6,
      diameterBottom: size.width * 0.62,
      tessellation: 20
    }, {
      position: { x: 0, y: crownYStart + crownH / 2, z: 0 }
    }, { parent: node });
  } else if (crownType === 'flat') {
    cylinderComponent(registry, item, definition, 'fabric', {
      height: crownH,
      diameterTop: size.width * 0.68,
      diameterBottom: size.width * 0.72,
      tessellation: 20
    }, {
      position: { x: 0, y: crownYStart + crownH / 2, z: 0 }
    }, { parent: node });
  }

  if (options.hasBand) {
    const bandH = crownH * 0.25;
    cylinderComponent(registry, item, definition, 'detail', {
      height: bandH,
      diameterTop: size.width * 0.63,
      diameterBottom: size.width * 0.64,
      tessellation: 20
    }, {
      position: { x: 0, y: crownYStart + bandH / 2, z: 0 }
    }, { parent: node });
  }
}

/**
 * 4.   ( )
 */
export function buildShoes(registry, item, definition, node, size, options = {}) {
  const heelType = options.heelType || 'flat';
  const shaftType = options.shaftType || 'low';
  const isOpen = !!options.isOpen;

  node.getChildMeshes().forEach(m => m.dispose());

  const shoeWidth = size.width * 0.38;
  const shoeDepth = size.depth * 0.95;

  [-1, 1].forEach(side => {
    const xOffset = side * size.width * 0.26;

    const soleH = size.height * 0.12;
    const heelH = heelType === 'heel' ? size.height * 0.48 : 0;

    // 1.  
    if (heelType === 'heel') {
      //  
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth,
        height: soleH,
        depth: shoeDepth * 0.5
      }, {
        position: { x: xOffset, y: heelH + soleH / 2, z: -shoeDepth * 0.25 }
      }, { parent: node });

      //  
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth,
        height: soleH,
        depth: shoeDepth * 0.5
      }, {
        position: { x: xOffset, y: soleH / 2, z: shoeDepth * 0.25 }
      }, { parent: node });

      //  
      const middleD = shoeDepth * 0.22;
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth * 0.98,
        height: soleH * 0.9,
        depth: middleD
      }, {
        position: { x: xOffset, y: heelH / 2 + soleH / 2, z: 0 },
        rotation: { x: -Math.atan2(heelH, shoeDepth * 0.5), y: 0, z: 0 }
      }, { parent: node });

      //  
      cylinderComponent(registry, item, definition, 'sole', {
        height: heelH,
        diameterTop: size.width * 0.04,
        diameterBottom: size.width * 0.04
      }, {
        position: { x: xOffset, y: heelH / 2, z: -shoeDepth * 0.38 }
      }, { parent: node });
    } else {
      //  
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth,
        height: soleH,
        depth: shoeDepth
      }, {
        position: { x: xOffset, y: soleH / 2, z: 0 }
      }, { parent: node });
    }

    // 2.  
    const frontH = size.height * 0.25;
    const frontD = shoeDepth * 0.55;
    boxComponent(registry, item, definition, 'fabric', {
      width: shoeWidth * 0.95,
      height: frontH,
      depth: frontD
    }, {
      position: { x: xOffset, y: soleH + frontH / 2, z: shoeDepth * 0.20 }
    }, { parent: node });

    // 3.  
    if (!isOpen) {
      let shaftH = size.height * 0.3;
      if (shaftType === 'high') {
        shaftH = size.height * 0.78;
      } else if (shaftType === 'mid') {
        shaftH = size.height * 0.52;
      }
      boxComponent(registry, item, definition, 'fabric', {
        width: shoeWidth * 0.95,
        height: shaftH,
        depth: shoeDepth * 0.45
      }, {
        position: { x: xOffset, y: heelH + soleH + shaftH / 2, z: -shoeDepth * 0.22 }
      }, { parent: node });
    }

    // 4.  
    if (options.hasLaces && !isOpen) {
      boxComponent(registry, item, definition, 'detail', {
        width: shoeWidth * 0.5,
        height: size.height * 0.05,
        depth: shoeDepth * 0.25
      }, {
        position: { x: xOffset, y: soleH + frontH + size.height * 0.03, z: shoeDepth * 0.05 }
      }, { parent: node });
    }
  });
}

/**
 * 5.   ( 、 、 )
 */
export function buildMannequin(registry, item, definition, node, size, gender) {
  node.getChildMeshes().forEach(m => m.dispose());

  //  、 Y ， 
  const plateH = size.height * 0.03;
  const rodH = size.height * 0.48;
  const hipsY = plateH + rodH;
  const hipsH = size.height * 0.12;
  const chestY = hipsY + hipsH;
  const chestH = size.height * 0.24;
  const neckY = chestY + chestH;
  const neckH = size.height * 0.05;
  const headY = neckY + neckH;
  const headD = gender === 'child' ? size.width * 0.5 : size.width * 0.4;

  // 1.  
  cylinderComponent(registry, item, definition, 'base', {
    height: plateH,
    diameterTop: size.width,
    diameterBottom: size.width,
    tessellation: 20
  }, {
    position: { x: 0, y: plateH / 2, z: 0 }
  }, { parent: node });

  // 2.  
  cylinderComponent(registry, item, definition, 'base', {
    height: rodH,
    diameterTop: size.width * 0.05,
    diameterBottom: size.width * 0.05,
    tessellation: 8
  }, {
    position: { x: 0, y: plateH + rodH / 2, z: 0 }
  }, { parent: node });

  // 3.  
  boxComponent(registry, item, definition, 'body', {
    width: size.width * 0.8,
    height: hipsH,
    depth: size.depth * 0.7
  }, {
    position: { x: 0, y: hipsY + hipsH / 2, z: 0 }
  }, { parent: node });

  // 4.  
  if (gender === 'female') {
    //  
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.64,
      height: chestH * 0.5,
      depth: size.depth * 0.48
    }, {
      position: { x: 0, y: chestY + chestH * 0.25, z: 0 }
    }, { parent: node });

    //  
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.74,
      height: chestH * 0.5,
      depth: size.depth * 0.52
    }, {
      position: { x: 0, y: chestY + chestH * 0.75, z: 0 }
    }, { parent: node });

    //  
    [-1, 1].forEach(side => {
      sphereComponent(registry, item, definition, 'body', {
        diameter: size.width * 0.16
      }, {
        position: { x: side * size.width * 0.15, y: chestY + chestH * 0.68, z: size.depth * 0.22 }
      }, { parent: node });
    });
  } else if (gender === 'male') {
    //  
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.72,
      height: chestH * 0.5,
      depth: size.depth * 0.54
    }, {
      position: { x: 0, y: chestY + chestH * 0.25, z: 0 }
    }, { parent: node });

    //  
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.82,
      height: chestH * 0.5,
      depth: size.depth * 0.58
    }, {
      position: { x: 0, y: chestY + chestH * 0.75, z: 0 }
    }, { parent: node });
  } else {
    //  
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.68,
      height: chestH,
      depth: size.depth * 0.52
    }, {
      position: { x: 0, y: chestY + chestH / 2, z: 0 }
    }, { parent: node });
  }

  // 5.  
  cylinderComponent(registry, item, definition, 'body', {
    height: neckH,
    diameterTop: size.width * 0.2,
    diameterBottom: size.width * 0.2,
    tessellation: 12
  }, {
    position: { x: 0, y: neckY + neckH / 2, z: 0 }
  }, { parent: node });

  // 6.  
  sphereComponent(registry, item, definition, 'body', {
    diameter: headD
  }, {
    position: { x: 0, y: headY + headD / 2, z: 0 }
  }, { parent: node });
}

// ==================== 1.   (10 ) ====================

export const clothing_t_shirt = {
  type: 'clothing_t_shirt',
  name: 'T',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.2, height: 0.6 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#4fc3f7' },
    { id: 'collar', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_t_shirt, node, size, { sleeveType: 'short', hasCollar: true });
  }
};

export const clothing_shirt = {
  type: 'clothing_shirt',
  name: 'Clothing Shirt',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.2, height: 0.6 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#e0f7fa' },
    { id: 'collar', label: 'Component', defaultColor: '#b2ebf2' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_shirt, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_sweater = {
  type: 'clothing_sweater',
  name: 'Clothing Sweater',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.2, height: 0.6 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffe082' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_sweater, node, size, { sleeveType: 'long', hasCollar: false });
  }
};

export const clothing_coat = {
  type: 'clothing_coat',
  name: 'Clothing Coat',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.23, height: 0.95 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#8d6e63' },
    { id: 'collar', label: 'Component', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_coat, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_jacket = {
  type: 'clothing_jacket',
  name: 'Clothing Jacket',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.23, height: 0.65 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#37474f' },
    { id: 'collar', label: 'Component', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_jacket, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_hoodie = {
  type: 'clothing_hoodie',
  name: 'Clothing Hoodie',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.23, height: 0.65 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#a1887f' },
    { id: 'collar', label: 'Component', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_hoodie, node, size, { sleeveType: 'long', hasHood: true, hasCollar: false });
  }
};

export const clothing_vest = {
  type: 'clothing_vest',
  name: 'Clothing Vest',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.18, height: 0.55 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_vest, node, size, { sleeveType: 'none', hasCollar: false });
  }
};

export const clothing_polo_shirt = {
  type: 'clothing_polo_shirt',
  name: 'Polo',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.2, height: 0.6 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#1a237e' },
    { id: 'collar', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_polo_shirt, node, size, { sleeveType: 'short', hasCollar: true });
  }
};

export const clothing_cardigan = {
  type: 'clothing_cardigan',
  name: 'Clothing Cardigan',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.2, height: 0.65 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#d1c4e9' },
    { id: 'collar', label: 'Component', defaultColor: '#b39ddb' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_cardigan, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_tank_top = {
  type: 'clothing_tank_top',
  name: 'Clothing Tank Top',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.18, height: 0.5 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ff8a80' },
    { id: 'collar', label: 'Component', defaultColor: '#ff5252' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_tank_top, node, size, { sleeveType: 'strap', hasCollar: false });
  }
};

// ==================== 2.   (5 ) ====================

export const clothing_jeans = {
  type: 'clothing_jeans',
  name: 'Clothing Jeans',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.15, height: 0.8 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#1565c0' },
    { id: 'detail', label: 'Component', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_jeans, node, size, { isSkirt: false, pantsLength: 'long' });
  }
};

export const clothing_trousers = {
  type: 'clothing_trousers',
  name: 'Clothing Trousers',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.15, height: 0.8 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#212121' },
    { id: 'detail', label: 'Component', defaultColor: '#424242' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_trousers, node, size, { isSkirt: false, pantsLength: 'long' });
  }
};

export const clothing_sweatpants = {
  type: 'clothing_sweatpants',
  name: 'Clothing Sweatpants',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.18, height: 0.8 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#757575' },
    { id: 'detail', label: 'Component', defaultColor: '#eeeeee' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_sweatpants, node, size, { isSkirt: false, pantsLength: 'long' });
  }
};

export const clothing_shorts = {
  type: 'clothing_shorts',
  name: 'Clothing Shorts',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.15, height: 0.45 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#81c784' },
    { id: 'detail', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_shorts, node, size, { isSkirt: false, pantsLength: 'short' });
  }
};

export const clothing_cargo_pants = {
  type: 'clothing_cargo_pants',
  name: 'Clothing Cargo Pants',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.18, height: 0.8 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#5d4037' },
    { id: 'detail', label: 'Component', defaultColor: '#4e342e' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_cargo_pants, node, size, { isSkirt: false, pantsLength: 'long', hasCargoPockets: true });
  }
};

// ==================== 3.   (5 ) ====================

export const clothing_pleated_skirt = {
  type: 'clothing_pleated_skirt',
  name: 'Clothing Pleated Skirt',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.3, height: 0.4 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#e91e63' },
    { id: 'detail', label: 'Component', defaultColor: '#c2185b' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_pleated_skirt, node, size, { isSkirt: true, skirtType: 'pleated' });
  }
};

export const clothing_denim_skirt = {
  type: 'clothing_denim_skirt',
  name: 'Clothing Denim Skirt',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.25, height: 0.4 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#1e88e5' },
    { id: 'detail', label: 'Component', defaultColor: '#ffb300' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_denim_skirt, node, size, { isSkirt: true, skirtType: 'straight' });
  }
};

export const clothing_leather_skirt = {
  type: 'clothing_leather_skirt',
  name: 'Clothing Leather Skirt',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.25, height: 0.4 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#111111' },
    { id: 'detail', label: 'Metal Item', defaultColor: '#eeeeee' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_leather_skirt, node, size, { isSkirt: true, skirtType: 'straight' });
  }
};

export const clothing_a_line_skirt = {
  type: 'clothing_a_line_skirt',
  name: 'A',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.3, height: 0.45 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#795548' },
    { id: 'detail', label: 'Component', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_a_line_skirt, node, size, { isSkirt: true, skirtType: 'a_line' });
  }
};

export const clothing_pencil_skirt = {
  type: 'clothing_pencil_skirt',
  name: 'Clothing Pencil Skirt',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.23, height: 0.45 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#37474f' },
    { id: 'detail', label: 'Decor Item', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_pencil_skirt, node, size, { isSkirt: true, skirtType: 'straight' });
  }
};

// ==================== 4.  /  (10 ) ====================

export const clothing_dress = {
  type: 'clothing_dress',
  name: 'Clothing Dress',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.25, height: 1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#f48fb1' },
    { id: 'collar', label: 'Component', defaultColor: '#f50057' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_dress, node, size, { sleeveType: 'short', skirtType: 'flare' });
  }
};

export const clothing_evening_gown = {
  type: 'clothing_evening_gown',
  name: 'Clothing Evening Gown',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.3, height: 1.15 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#311b92' },
    { id: 'collar', label: 'Component', defaultColor: '#ea80fc' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_evening_gown, node, size, { sleeveType: 'none', skirtType: 'flare' });
  }
};

export const clothing_summer_dress = {
  type: 'clothing_summer_dress',
  name: 'Clothing Summer Dress',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.23, height: 0.9 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#fff59d' },
    { id: 'collar', label: 'Component', defaultColor: '#ff8f00' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_summer_dress, node, size, { sleeveType: 'strap', skirtType: 'flare' });
  }
};

export const clothing_slip_dress = {
  type: 'clothing_slip_dress',
  name: 'Clothing Slip Dress',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.2, height: 0.95 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#b2dfdb' },
    { id: 'collar', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_slip_dress, node, size, { sleeveType: 'strap', skirtType: 'straight' });
  }
};

export const clothing_cheongsam = {
  type: 'clothing_cheongsam',
  name: 'Clothing Cheongsam',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.18, height: 1.05 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#b71c1c' },
    { id: 'collar', label: 'Component', defaultColor: '#ffd700' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_cheongsam, node, size, { sleeveType: 'short', skirtType: 'straight', hasCollar: true });
  }
};

export const clothing_lolita_dress = {
  type: 'clothing_lolita_dress',
  name: 'Clothing Lolita Dress',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.35, height: 0.95 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#f8bbd0' },
    { id: 'collar', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_lolita_dress, node, size, { sleeveType: 'short', skirtType: 'flare', isLolita: true });
  }
};

export const clothing_lace_dress = {
  type: 'clothing_lace_dress',
  name: 'Clothing Lace Dress',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.25, height: 1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffffff' },
    { id: 'collar', label: 'Component', defaultColor: '#fce4ec' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_lace_dress, node, size, { sleeveType: 'short', skirtType: 'flare' });
  }
};

export const clothing_floral_dress = {
  type: 'clothing_floral_dress',
  name: 'Clothing Floral Dress',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.25, height: 1.05 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#c5e1a5' },
    { id: 'collar', label: 'Component', defaultColor: '#7cb342' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_floral_dress, node, size, { sleeveType: 'long', skirtType: 'flare' });
  }
};

export const clothing_maxi_dress = {
  type: 'clothing_maxi_dress',
  name: 'Clothing Maxi Dress',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.3, height: 1.1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffb74d' },
    { id: 'collar', label: 'Component', defaultColor: '#f57c00' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_maxi_dress, node, size, { sleeveType: 'none', skirtType: 'flare' });
  }
};

export const clothing_knit_dress = {
  type: 'clothing_knit_dress',
  name: 'Clothing Knit Dress',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.2, height: 0.95 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#4e342e' },
    { id: 'collar', label: 'Component', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_knit_dress, node, size, { sleeveType: 'long', skirtType: 'straight', hasCollar: true });
  }
};

// ==================== 5.   (10 ) ====================

export const clothing_baseball_cap = {
  type: 'clothing_baseball_cap',
  name: 'Clothing Baseball Cap',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.15 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#e53935' },
    { id: 'brim', label: 'Component', defaultColor: '#1e88e5' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_baseball_cap, node, size, { brimType: 'front', crownType: 'sphere' });
  }
};

export const clothing_beanie = {
  type: 'clothing_beanie',
  name: 'Clothing Beanie',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.18 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#00bcd4' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_beanie, node, size, { brimType: 'none', crownType: 'sphere' });
  }
};

export const clothing_fedora = {
  type: 'clothing_fedora',
  name: 'Clothing Fedora',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.35, height: 0.15 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#3e2723' },
    { id: 'brim', label: 'Component', defaultColor: '#3e2723' },
    { id: 'detail', label: 'Component', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_fedora, node, size, { brimType: 'round', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_straw_hat = {
  type: 'clothing_straw_hat',
  name: 'Clothing Straw Hat',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.13 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffe0b2' },
    { id: 'brim', label: 'Component', defaultColor: '#ffe0b2' },
    { id: 'detail', label: 'Component', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_straw_hat, node, size, { brimType: 'round', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_bucket_hat = {
  type: 'clothing_bucket_hat',
  name: 'Clothing Bucket Hat',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.15 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#9e9d24' },
    { id: 'brim', label: 'Component', defaultColor: '#9e9d24' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_bucket_hat, node, size, { brimType: 'downward', crownType: 'flat' });
  }
};

export const clothing_beret = {
  type: 'clothing_beret',
  name: 'Clothing Beret',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#880e4f' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_beret, node, size, { brimType: 'none', crownType: 'flat' });
  }
};

export const clothing_sun_hat = {
  type: 'clothing_sun_hat',
  name: 'Clothing Sun Hat',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 0.13 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#fff8e1' },
    { id: 'brim', label: 'Component', defaultColor: '#fff8e1' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_sun_hat, node, size, { brimType: 'round', crownType: 'flat' });
  }
};

export const clothing_cowboy_hat = {
  type: 'clothing_cowboy_hat',
  name: 'Clothing Cowboy Hat',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.18 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#a1887f' },
    { id: 'brim', label: 'Component', defaultColor: '#a1887f' },
    { id: 'detail', label: 'Component', defaultColor: '#4e342e' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_cowboy_hat, node, size, { brimType: 'cowboy', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_top_hat = {
  type: 'clothing_top_hat',
  name: 'Clothing Top Hat',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.23 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#212121' },
    { id: 'brim', label: 'Component', defaultColor: '#212121' },
    { id: 'detail', label: 'Component', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_top_hat, node, size, { brimType: 'round', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_flat_cap = {
  type: 'clothing_flat_cap',
  name: 'Clothing Flat Cap',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.13 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#455a64' },
    { id: 'brim', label: 'Component', defaultColor: '#37474f' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_flat_cap, node, size, { brimType: 'front', crownType: 'flat' });
  }
};

// ==================== 6.   (10 ) ====================

export const clothing_sneakers = {
  type: 'clothing_sneakers',
  name: 'Clothing Sneakers',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffffff' },
    { id: 'sole', label: 'Component', defaultColor: '#f5f5f5' },
    { id: 'detail', label: 'Component', defaultColor: '#2196f3' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_sneakers, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_leather_shoes = {
  type: 'clothing_leather_shoes',
  name: 'Clothing Leather Shoes',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#4e342e' },
    { id: 'sole', label: 'Component', defaultColor: '#2b1b17' },
    { id: 'detail', label: 'Component', defaultColor: '#1a100c' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_leather_shoes, node, size, { heelType: 'mid', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_boots = {
  type: 'clothing_boots',
  name: 'Clothing Boots',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.35, height: 0.2 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#212121' },
    { id: 'sole', label: 'Component', defaultColor: '#3e2723' },
    { id: 'detail', label: ' ItemMetal Item', defaultColor: '#eeeeee' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_boots, node, size, { heelType: 'mid', shaftType: 'mid', hasLaces: true });
  }
};

export const clothing_high_heels = {
  type: 'clothing_high_heels',
  name: 'Clothing High Heels',
  unit: 'm',
  defaultSize: { width: 0.23, depth: 0.3, height: 0.15 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#d81b60' },
    { id: 'sole', label: 'Component', defaultColor: '#111111' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_high_heels, node, size, { heelType: 'heel', shaftType: 'low', isOpen: true });
  }
};

export const clothing_sandals = {
  type: 'clothing_sandals',
  name: 'Clothing Sandals',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.08 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffb300' },
    { id: 'sole', label: 'Component', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_sandals, node, size, { heelType: 'flat', shaftType: 'low', isOpen: true });
  }
};

export const clothing_slippers = {
  type: 'clothing_slippers',
  name: 'Clothing Slippers',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.08 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#e8f5e9' },
    { id: 'sole', label: 'EVA Item', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_slippers, node, size, { heelType: 'flat', shaftType: 'low', isOpen: true });
  }
};

export const clothing_running_shoes = {
  type: 'clothing_running_shoes',
  name: 'Clothing Running Shoes',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.1 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#00e676' },
    { id: 'sole', label: 'Component', defaultColor: '#ffffff' },
    { id: 'detail', label: 'Component', defaultColor: '#ffeb3b' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_running_shoes, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_loafers = {
  type: 'clothing_loafers',
  name: 'Clothing Loafers',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.09 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#37474f' },
    { id: 'sole', label: 'Component', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_loafers, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: false });
  }
};

export const clothing_canvas_shoes = {
  type: 'clothing_canvas_shoes',
  name: 'Clothing Canvas Shoes',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.3, height: 0.11 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#e53935' },
    { id: 'sole', label: 'Component', defaultColor: '#ffffff' },
    { id: 'detail', label: 'Component', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_canvas_shoes, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_rain_boots = {
  type: 'clothing_rain_boots',
  name: 'Clothing Rain Boots',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.25 },
  components: [
    { id: 'fabric', label: 'Component', defaultColor: '#ffeb3b' },
    { id: 'sole', label: 'Component', defaultColor: '#f57f17' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_rain_boots, node, size, { heelType: 'flat', shaftType: 'high', hasLaces: false });
  }
};

