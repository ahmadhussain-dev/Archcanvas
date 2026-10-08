import { boxComponent, cylinderComponent, sphereComponent, rightTriangleComponent, halfCylinderComponent, coneComponent } from './_helpers.js';

// 1. Custom  (Custom Cube)
export const customCubeFurniture = {
  type: 'custom_cube',
  name: 'Custom Cube',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'cube', label: 'Component', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, customCubeFurniture, 'cube', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 2. Custom  (Custom Cylinder)
export const customCylinderFurniture = {
  type: 'custom_cylinder',
  name: 'Custom Cylinder',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'cylinder', label: 'Component', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, customCylinderFurniture, 'cylinder', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height, tessellation: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 3. Custom  (Custom Sphere)
export const customSphereFurniture = {
  type: 'custom_sphere',
  name: 'Custom Sphere',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'sphere', label: 'Component', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, customSphereFurniture, 'sphere', {
      diameterX: size.width, diameterY: size.height, diameterZ: size.depth, segments: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 4. Custom Triangle (Custom Right Triangle)
export const customRightTriangleFurniture = {
  type: 'custom_right_triangle',
  name: 'Custom Right Triangle',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'rightTriangle', label: 'Triangle', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    rightTriangleComponent(registry, item, customRightTriangleFurniture, 'rightTriangle', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 5. CustomSemicircle  (Custom Half Cylinder)
export const customHalfCylinderFurniture = {
  type: 'custom_half_cylinder',
  name: 'Custom Half Cylinder',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.5, height: 1 },
  components: [
    { id: 'halfCylinder', label: 'Half cylinder', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    halfCylinderComponent(registry, item, customHalfCylinderFurniture, 'halfCylinder', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 6. Custom  (Custom Cone)
export const customConeFurniture = {
  type: 'custom_cone',
  name: 'Custom Cone',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'cone', label: 'Component', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    coneComponent(registry, item, customConeFurniture, 'cone', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};
