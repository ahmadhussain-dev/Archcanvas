import { AbstractMesh, ArcRotateCamera, Color3, Color4, CubeTexture, DirectionalLight, Engine, HemisphericLight, Matrix, MeshBuilder, Node, Plane, PhotoDome, Scene, ShadowGenerator, Vector3, StandardMaterial, Texture, SKY_TEXTURE_URL, GRASS_TEXTURE_URL, MaterialResolver, createBlueprintMaterial, resolveMaterialAssetDescriptor, shouldIncludeShadowCaster } from '../../src/index.js';
const BABYLON = { AbstractMesh, ArcRotateCamera, Color3, Color4, CubeTexture, DirectionalLight, Engine, HemisphericLight, Matrix, MeshBuilder, Node, Plane, PhotoDome, Scene, ShadowGenerator, Vector3, StandardMaterial, Texture };

const SKYBOX_SIZE = 1000.0;
/** Steepest the orbit camera may tilt: just above the horizon. */
export const ORBIT_MAX_BETA = Math.PI / 2 - 0.05;
/** How far (metres) the orbit target may wander from the plan's origin; the lawn is 120 m wide. */
const MAX_TARGET_DISTANCE = 60;

function keepTargetNearHouse(target) {
  if (target.y < 0) target.y = 0;
  const d = Math.hypot(target.x, target.z);
  if (d > MAX_TARGET_DISTANCE) {
    target.x *= MAX_TARGET_DISTANCE / d;
    target.z *= MAX_TARGET_DISTANCE / d;
  }
}
const SKYBOX_HORIZON_OFFSET = SKYBOX_SIZE * 0.1;
const MOBILE_RENDER_FPS = 30;
const DESKTOP_RENDER_FPS = 60;
const MAX_RENDER_PIXEL_RATIO = 2;

export function intersectWallPlanes(ray, walls, { floorY = 0, wallHeight = 2.8 } = {}) {
  if (!ray?.origin || !ray?.direction) return null;
  let nearest = null;

  for (const wall of walls || []) {
    const [x1, z1] = wall.from || [];
    const [x2, z2] = wall.to || [];
    const dx = Number(x2) - Number(x1);
    const dz = Number(z2) - Number(z1);
    const length = Math.hypot(dx, dz);
    if (!Number.isFinite(length) || length < 1e-6) continue;

    const normalX = -dz / length;
    const normalZ = dx / length;
    const denominator = ray.direction.x * normalX + ray.direction.z * normalZ;
    if (Math.abs(denominator) < 1e-7) continue;

    const distance = ((x1 - ray.origin.x) * normalX + (z1 - ray.origin.z) * normalZ) / denominator;
    if (!Number.isFinite(distance) || distance < 0) continue;

    const x = ray.origin.x + ray.direction.x * distance;
    const y = ray.origin.y + ray.direction.y * distance;
    const z = ray.origin.z + ray.direction.z * distance;
    const segmentT = ((x - x1) * dx + (z - z1) * dz) / (length * length);
    const baseY = Number(wall.elevation ?? floorY);
    const height = Number(wall.height ?? wallHeight);
    if (segmentT < -1e-5 || segmentT > 1 + 1e-5) continue;
    if (y < baseY - 1e-5 || y > baseY + height + 1e-5) continue;
    if (nearest && distance >= nearest.distance) continue;

    const cameraSide = ((ray.origin.x - x) * normalX + (ray.origin.z - z) * normalZ) >= 0 ? 1 : -1;
    nearest = { x, y, z, wallId: wall.id, wall, distance, t: segmentT, side: cameraSide };
  }

  return nearest;
}

export function getRenderPerformanceProfile(environment = {}) {
  const navigatorLike = environment.navigator || (typeof navigator !== 'undefined' ? navigator : {});
  const matchMediaLike = environment.matchMedia || (typeof matchMedia === 'function' ? matchMedia : null);
  const devicePixelRatio = Number(environment.devicePixelRatio
    ?? (typeof globalThis !== 'undefined' ? globalThis.devicePixelRatio : 1));
  const userAgent = String(navigatorLike.userAgent || '');
  const coarsePointer = !!matchMediaLike?.('(pointer: coarse)')?.matches;
  const mobile = coarsePointer || /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  const constrainedMemory = Number(navigatorLike.deviceMemory) > 0 && Number(navigatorLike.deviceMemory) <= 4;
  const renderPixelRatio = Math.min(
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1,
    MAX_RENDER_PIXEL_RATIO
  );

  return {
    targetFps: mobile || constrainedMemory ? MOBILE_RENDER_FPS : DESKTOP_RENDER_FPS,
    // Babylon divides the canvas size by this value. Using the inverse DPR keeps
    // the WebGL canvas sharp on high-density screens while the cap limits GPU load.
    hardwareScalingLevel: 1 / renderPixelRatio,
    shadowMapSize: mobile || constrainedMemory ? 512 : 1024,
    shadowBlurKernel: mobile || constrainedMemory ? 12 : 24
  };
}

function descriptorKey(descriptor) {
  if (!descriptor) return 'default';
  try {
    return JSON.stringify(descriptor);
  } catch {
    return String(descriptor);
  }
}

function createSolidColorDataUrl(colorHex) {
  if (typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  }
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colorHex || '#d9ecff';
  ctx.fillRect(0, 0, 2, 2);
  return canvas.toDataURL('image/png');
}

/**
 * Viewer3D — 3D  
 *
 *  ：  BabylonJS  、 、 、 、 、3D  。
 *   app.js   3D  ， 。
 */
export class Viewer3D {
  /**
   *   3D  
   * @param {HTMLCanvasElement} canvas -  
   * @param {Object} [options] -  
   * @param {string} [options.clearColor='#eef4fbff'] -  
   */
  constructor(canvas, options = {}) {
    const clearColor = options.clearColor || '#eef4fbff';
    const performanceProfile = {
      ...getRenderPerformanceProfile(),
      ...(options.performanceProfile || {})
    };

    // ==========   ==========
    /** @type {BABYLON.Engine} BabylonJS   */
    this.engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true });
    this.engine.setHardwareScalingLevel(performanceProfile.hardwareScalingLevel);
    /** @type {BABYLON.Scene} BabylonJS   */
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = BABYLON.Color4.FromHexString(clearColor);

    // ==========   ==========
    /** @type {BABYLON.ArcRotateCamera}  Rotate  */
    this.camera = new BABYLON.ArcRotateCamera(
      'camera', -Math.PI / 3, Math.PI / 3, 15,
      new BABYLON.Vector3(0, 0, -2.2), this.scene
    );
    this.camera.attachControl(canvas, true, false, 1);
    //  ， （ Rotate ） Custom 
    this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    //  Rotate （  1000   2500）
    this.camera.angularSensibilityX = 2500;
    this.camera.angularSensibilityY = 2500;
    this.camera.lowerRadiusLimit = 0.5;
    this.camera.upperRadiusLimit = 100;
    // Keep the orbit camera above the ground and near the house. Below the ground
    // you only see sky through the one-sided floors, and a far-off target loses
    // the house altogether (walk mode lifts the angle limit while walking).
    this.camera.upperBetaLimit = ORBIT_MAX_BETA;
    this.scene.onBeforeRenderObservable.add(() => keepTargetNearHouse(this.camera.target));
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.panningSensibility = 1200;
    this.camera.panningMouseButton = 1; //  
    if (this.camera.inputs.attached.pointers) {
      //  (0) (1) ， (2) Duplicate 
      this.camera.inputs.attached.pointers.buttons = [0, 1];
    }

    // ==========   ==========
    /** @type {BABYLON.HemisphericLight}   */
    this.hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
    this.hemi.intensity = 0.65;
    this.hemi.groundColor = new BABYLON.Color3(0.55, 0.55, 0.55); //  ， 
    /** @type {BABYLON.DirectionalLight}  （ ） */
    this.sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.5), this.scene);
    this.sun.position.set(8, 12, 8);
    this.sun.intensity = 0.60;

    // ==========   ==========
    /** @type {BABYLON.ShadowGenerator}   */
    this.shadowGenerator = new BABYLON.ShadowGenerator(performanceProfile.shadowMapSize, this.sun);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = performanceProfile.shadowBlurKernel;
    this.shadowGenerator.darkness = 0.25; //  (#000000)，  25%  
    // ==========  （ Mirror ） ==========
    //  ，  kind:'mirror'  
    this._environmentInitialized = false;
    this._renderLoopStarted = false;
    this._engineLoopRunning = false;
    // A manual 45 FPS cap on a 60 Hz display creates alternating 16/33 ms
    // frame gaps. At 60 FPS, let requestAnimationFrame follow display VSync.
    this._targetFrameInterval = performanceProfile.targetFps >= 60
      ? 0
      : 1000 / performanceProfile.targetFps;
    this._lastRenderTime = 0;
    this._renderFrame = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = now - this._lastRenderTime;
      if (this._targetFrameInterval > 0) {
        if (elapsed + 0.5 < this._targetFrameInterval) return;
        this._lastRenderTime = now - (elapsed % this._targetFrameInterval);
      } else {
        this._lastRenderTime = now;
      }
      this.scene.render();
    };
    this._visibilityHandler = () => {
      if (document.hidden) {
        this._stopEngineLoop();
      } else if (this._renderLoopStarted) {
        this._startEngineLoop();
      }
    };

    // ==========  （ ） ==========
    /** @type {BABYLON.Plane}   */
    this.groundPlane = new BABYLON.Plane(0, 1, 0, 0);

    // ========== 3D   ==========
    /** @type {boolean}   3D   */
    this.show3DGrid = true;
    /** @type {BABYLON.Node[]} 3D   */
    this.grid3DHelpers = [];

    // Save canvas   resize  
    this._canvas = canvas;
    this._resizeHandler = () => this.engine.resize();

    // ========== Sky Grass ==========
    /** @type {BABYLON.AbstractMesh} Sky  */
    this.skybox = null;
    /** @type {BABYLON.AbstractMesh} 1 Grass  */
    this.grassLawn = null;
  }

  /**
   *   resize
   */
  startRenderLoop() {
    if (this._renderLoopStarted) return;
    this._renderLoopStarted = true;
    this._lastRenderTime = 0;
    this._startEngineLoop();
    window.addEventListener('resize', this._resizeHandler);
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  stopRenderLoop() {
    if (!this._renderLoopStarted) return;
    this._renderLoopStarted = false;
    this._stopEngineLoop();
    window.removeEventListener('resize', this._resizeHandler);
    document.removeEventListener('visibilitychange', this._visibilityHandler);
  }

  _startEngineLoop() {
    if (this._engineLoopRunning || document.hidden) return;
    this._engineLoopRunning = true;
    this.engine.runRenderLoop(this._renderFrame);
  }

  _stopEngineLoop() {
    if (!this._engineLoopRunning) return;
    this.engine.stopRenderLoop(this._renderFrame);
    this._engineLoopRunning = false;
  }

  prepareFor3D() {
    if (!this._environmentInitialized) {
      this._environmentInitialized = true;
      this._initEnvironmentTexture();
    }
    this.startRenderLoop();
  }

  /**
   *  （ Mirror  reflectionTexture   clone  ）
   *  ：  createDefaultEnvironment，  environmentIntensity  ，
   *   MirrorTexture Bathroom 。
   * @private
   */
  _initEnvironmentTexture() {
    try {
      this.scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        'https://assets.babylonjs.com/environments/environmentSpecular.env',
        this.scene
      );
      //   environmentIntensity   0， Mirror 
      // Mirror  clone +   level  
      this.scene.environmentIntensity = 0;
    } catch (_ignored) {
      //  ，Mirror 
    }
  }

  /**
   *   resize
   */
  resize() {
    this.engine.resize();
  }

  /**
   *  
   */
  resetCamera() {
    this.camera.setTarget(new BABYLON.Vector3(0, 0, -2.2));
    this.camera.alpha = -Math.PI / 3;
    this.camera.beta = Math.PI / 3;
    this.camera.radius = 15;
  }

  /**
   *   mesh   floorId  
   * @param {BABYLON.AbstractMesh} mesh -  
   * @returns {string|null}   ID   null
   */
  getMeshFloorId(mesh) {
    let current = mesh;
    while (current) {
      if (current.metadata && current.metadata.floorId) {
        return current.metadata.floorId;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   *  （ ）
   * @param {Function} getShadowCasters -   mesh  
   * @param {string} currentFloorId -   ID
   */
  refreshShadowCasters(getShadowCasters, currentFloorId) {
    this.shadowGenerator.getShadowMap().renderList = [];
    getShadowCasters().forEach((mesh) => {
      if (shouldIncludeShadowCaster(mesh, currentFloorId)) {
        this.shadowGenerator.addShadowCaster(mesh);
      }
    });
  }

  /**
   *  / 
   * @param {number} [floorY=0] -  
   * @returns {BABYLON.Vector3|null}   null
   */
  groundPointFromPointer(floorY = 0) {
    const ray = this.scene.createPickingRay(
      this.scene.pointerX, this.scene.pointerY,
      BABYLON.Matrix.Identity(), this.camera
    );
    const distance = ray.intersectsPlane(new BABYLON.Plane(0, 1, 0, -floorY));
    if (distance === null || distance === undefined || distance < 0) return null;
    return ray.origin.add(ray.direction.scale(distance));
  }

  wallPointFromPointer(walls, options = {}) {
    const ray = this.scene.createPickingRay(
      this.scene.pointerX, this.scene.pointerY,
      BABYLON.Matrix.Identity(), this.camera
    );
    return intersectWallPlanes(ray, walls, options);
  }

  // ==========================================
  // 3D  
  // ==========================================

  /**
   *   3D  
   */
  clear3DGrid() {
    this.grid3DHelpers.splice(0).forEach((node) => node.dispose(false, true));
  }

  /**
   *   3D  
   * @param {Object} data -  
   * @param {Array} data.walls -  
   * @param {Array} data.rooms - Room 
   * @param {Array} data.roofs -  
   * @param {Array} data.stairs -  
   * @param {Array} data.items - Furniture 
   * @param {boolean} data.snapEnabled -  
   * @param {number} data.snapSize -  
   * @param {Function} data.inchesToWorld -  
   * @returns {{minX: number, maxX: number, minZ: number, maxZ: number}}  
   */
  _get3DGridBounds(data) {
    const { walls, rooms, roofs, stairs, items, snapEnabled, snapSize, inchesToWorld } = data;
    const points = [];

    walls.forEach((wall) => {
      points.push({ x: wall.from[0], z: wall.from[1] }, { x: wall.to[0], z: wall.to[1] });
    });
    rooms.forEach((room) => {
      points.push(
        { x: room.x - room.width / 2, z: room.z - room.depth / 2 },
        { x: room.x + room.width / 2, z: room.z + room.depth / 2 }
      );
    });
    roofs.forEach((roof) => {
      points.push(
        { x: (roof.x || 0) - (roof.width || 6) / 2, z: (roof.z || 0) - (roof.depth || 6) / 2 },
        { x: (roof.x || 0) + (roof.width || 6) / 2, z: (roof.z || 0) + (roof.depth || 6) / 2 }
      );
    });
    stairs.forEach((s) => {
      const subtype = s.subtype || 'straight';
      let wVal = s.width || 1.2;
      let dVal = s.depth || 3.2;
      if (subtype === 'spiral') {
        const size = Math.max(wVal, dVal);
        wVal = size;
        dVal = size;
      }
      points.push(
        { x: (s.x || 0) - wVal / 2, z: (s.z || 0) - dVal / 2 },
        { x: (s.x || 0) + wVal / 2, z: (s.z || 0) + dVal / 2 }
      );
    });
    items.forEach((item) => {
      const scale = Number(item.scale || 1);
      const width = inchesToWorld(item.width || 24) * scale;
      const depth = inchesToWorld(item.depth || 24) * scale;
      points.push(
        { x: item.x - width / 2, z: item.z - depth / 2 },
        { x: item.x + width / 2, z: item.z + depth / 2 }
      );
    });

    if (!points.length) return { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    const xs = points.map((point) => point.x);
    const zs = points.map((point) => point.z);
    const step = Math.max(0.25, snapEnabled && snapSize ? snapSize : 1);
    const pad = Math.max(4, step * 3);
    return {
      minX: Math.floor((Math.min(...xs) - pad) / step) * step,
      maxX: Math.ceil((Math.max(...xs) + pad) / step) * step,
      minZ: Math.floor((Math.min(...zs) - pad) / step) * step,
      maxZ: Math.ceil((Math.max(...zs) + pad) / step) * step
    };
  }

  /**
   *  
   * @param {BABYLON.Vector3} p1 -  
   * @param {BABYLON.Vector3} p2 -  
   * @param {number} [dashSize=0.08] -  
   * @param {number} [gapSize=0.08] -  
   * @returns {Array<[BABYLON.Vector3, BABYLON.Vector3]>}  
   */
  _createDashedLineSegments(p1, p2, dashSize = 0.08, gapSize = 0.08) {
    const segments = [];
    const dir = p2.subtract(p1);
    const totalLength = dir.length();
    if (totalLength <= 0.001) return segments;

    const stepVec = dir.normalize();
    let currentLength = 0;

    while (currentLength < totalLength) {
      const start = p1.add(stepVec.scale(currentLength));
      currentLength = Math.min(totalLength, currentLength + dashSize);
      const end = p1.add(stepVec.scale(currentLength));
      segments.push([start, end]);
      currentLength += gapSize;
    }
    return segments;
  }

  /**
   *   3D  
   * @param {Object} options -  
   * @param {string} options.currentView -   ('2d'|'3d')
   * @param {boolean} options.snapEnabled -  
   * @param {number} options.snapSize -  
   * @param {Array} options.walls -  
   * @param {Array} options.rooms -  Room
   * @param {Array} options.roofs -  
   * @param {Array} options.stairs -  
   * @param {Array} options.items -  Furniture
   * @param {string} options.currentFloorId -   ID
   * @param {number} options.floorElevation -  
   * @param {Function} options.inchesToWorld -  
   * @param {boolean} [options.hasTestMap=true] -   testMap
   */
  refresh3DGrid(options) {
    this.clear3DGrid();
    const {
      currentView, snapEnabled, snapSize, walls, rooms, roofs, stairs, items,
      currentFloorId, floorElevation, inchesToWorld, hasTestMap = true,
      isDeleteWallMode = false
    } = options;

    if (!this.show3DGrid || currentView !== '3d' || !this.scene || !hasTestMap) return;

    const step = Math.max(0.25, snapEnabled && snapSize ? snapSize : 1);
    const bounds = this._get3DGridBounds({ walls, rooms, roofs, stairs, items, snapEnabled, snapSize, inchesToWorld });
    const y = floorElevation + 0.012;
    const lines = [];
    const axisLines = [];

    for (let x = bounds.minX; x <= bounds.maxX + 0.001; x += step) {
      if (Math.abs(x) < 0.001) {
        axisLines.push([new BABYLON.Vector3(x, y, bounds.minZ), new BABYLON.Vector3(x, y, bounds.maxZ)]);
      } else {
        const p1 = new BABYLON.Vector3(x, y, bounds.minZ);
        const p2 = new BABYLON.Vector3(x, y, bounds.maxZ);
        lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
      }
    }
    for (let z = bounds.minZ; z <= bounds.maxZ + 0.001; z += step) {
      if (Math.abs(z) < 0.001) {
        axisLines.push([new BABYLON.Vector3(bounds.minX, y, z), new BABYLON.Vector3(bounds.maxX, y, z)]);
      } else {
        const p1 = new BABYLON.Vector3(bounds.minX, y, z);
        const p2 = new BABYLON.Vector3(bounds.maxX, y, z);
        lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
      }
    }

    //  Room  3D  
    rooms.forEach((room) => {
      if (room.floorId !== currentFloorId) return;
      const elev = room.elevation || 0;
      if (elev <= 0.001) return;

      const yRoom = floorElevation + elev + 0.012;
      const rLeft = room.x - room.width / 2;
      const rRight = room.x + room.width / 2;
      const rTop = room.z - room.depth / 2;
      const rBottom = room.z + room.depth / 2;

      const startX = Math.ceil(rLeft / step) * step;
      const endX = Math.floor(rRight / step) * step;
      const startZ = Math.ceil(rTop / step) * step;
      const endZ = Math.floor(rBottom / step) * step;

      for (let x = startX; x <= endX + 0.001; x += step) {
        if (Math.abs(x) < 0.001) {
          axisLines.push([new BABYLON.Vector3(x, yRoom, rTop), new BABYLON.Vector3(x, yRoom, rBottom)]);
        } else {
          const p1 = new BABYLON.Vector3(x, yRoom, rTop);
          const p2 = new BABYLON.Vector3(x, yRoom, rBottom);
          lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
        }
      }
      for (let z = startZ; z <= endZ + 0.001; z += step) {
        if (Math.abs(z) < 0.001) {
          axisLines.push([new BABYLON.Vector3(rLeft, yRoom, z), new BABYLON.Vector3(rRight, yRoom, z)]);
        } else {
          const p1 = new BABYLON.Vector3(rLeft, yRoom, z);
          const p2 = new BABYLON.Vector3(rRight, yRoom, z);
          lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
        }
      }
    });

    const isDeleteWall = !!isDeleteWallMode;
    if (lines.length) {
      const grid = BABYLON.MeshBuilder.CreateLineSystem('floor_grid_3d', { lines }, this.scene);
      grid.color = isDeleteWall ? BABYLON.Color3.FromHexString('#ff9999') : BABYLON.Color3.FromHexString('#c2cbd6');
      grid.alpha = isDeleteWall ? 0.12 : 0.08;
      grid.isPickable = false;
      grid.renderingGroupId = 0;
      this.grid3DHelpers.push(grid);
    }
    if (axisLines.length) {
      const axes = BABYLON.MeshBuilder.CreateLineSystem('floor_grid_3d_axes', { lines: axisLines }, this.scene);
      axes.color = isDeleteWall ? BABYLON.Color3.FromHexString('#ff4d4f') : BABYLON.Color3.FromHexString('#8fb8e8');
      axes.alpha = isDeleteWall ? 0.38 : 0.28;
      axes.isPickable = false;
      axes.renderingGroupId = 0;
      this.grid3DHelpers.push(axes);
    }
  }

  /**
   *  Sky / 
   * @param {string} colorHex -  
   */
  updateSkyboxColor(colorHex) {
    this._skyboxColor = colorHex;
    if (this.skybox) {
      const mat = this.skybox.mesh?.material || this.skybox.material;
      if (mat) {
        mat.emissiveColor = BABYLON.Color3.FromHexString(colorHex);
      }
    }
  }

  setEnvironmentMaterials(skyDescriptor = null, groundDescriptor = null) {
    this._environmentSkyMaterial = skyDescriptor;
    this._environmentGroundMaterial = groundDescriptor;
    const skyMaterialKey = descriptorKey(skyDescriptor);
    const groundMaterialKey = descriptorKey(groundDescriptor);

    if (this.skybox && this._appliedSkyMaterialKey !== skyMaterialKey) {
      let finalSrc = SKY_TEXTURE_URL;
      let tintColor = null;
      let skyLightColor = '#d9ecff';

      if (skyDescriptor) {
        const normalized = MaterialResolver.normalizeMaterialDescriptor(skyDescriptor, '#d9ecff');
        const resolved = resolveMaterialAssetDescriptor(normalized);
        const isSkyTexture = resolved.src && resolved.src.split('/').pop().split('?')[0].includes('sky.png');
        
        if (resolved.kind === 'color' || (!resolved.src && resolved.color)) {
          const colorHex = resolved.color || '#d9ecff';
          finalSrc = createSolidColorDataUrl(colorHex);
          tintColor = colorHex;
          skyLightColor = colorHex;
        } else if ((resolved.kind === 'texture' || resolved.kind === 'emissive') && resolved.src && !isSkyTexture) {
          finalSrc = resolved.src;
        }

        if (resolved.kind !== 'color' && resolved.color && resolved.color.toLowerCase() !== '#ffffff') {
          tintColor = resolved.color;
        }
        if (resolved.skyLightColor) {
          skyLightColor = resolved.skyLightColor;
        }
      }

      const skyLight = BABYLON.Color3.FromHexString(skyLightColor);
      this.hemi.diffuse = skyLight;
      this.hemi.groundColor = skyLight.scale(0.45);

      if (this.skybox instanceof BABYLON.PhotoDome || this.skybox.photoTexture !== undefined) {
        const oldTexture = this.skybox.photoTexture;
        const nextTexture = new BABYLON.Texture(finalSrc, this.scene);
        nextTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        nextTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.skybox.photoTexture = nextTexture;
        if (oldTexture && oldTexture !== nextTexture && !oldTexture.isDisposed) {
          oldTexture.dispose();
        }
        const domeMat = this.skybox.mesh?.material;
        if (domeMat) {
          domeMat.emissiveColor = tintColor ? BABYLON.Color3.FromHexString(tintColor) : skyLight;
        }
      } else if (this.skybox.material) {
        const material = this.skybox.material;
        material.disableLighting = true;
        material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.emissiveColor = tintColor ? BABYLON.Color3.FromHexString(tintColor) : skyLight;

        material.reflectionTexture?.dispose();
        const reflection = new BABYLON.Texture(finalSrc, this.scene);
        reflection.coordinatesMode = BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE;
        material.reflectionTexture = reflection;
      }
      this._appliedSkyMaterialKey = skyMaterialKey;
    }

    if (this.grassLawn && this._appliedGroundMaterialKey !== groundMaterialKey) {
      if (this.grassLawn.material) {
        this.grassLawn.material.dispose();
      }
      const desc = groundDescriptor || { kind: 'texture', src: GRASS_TEXTURE_URL, scale: 1.0, color: '#ffffff' };
      this.grassLawn.material = createBlueprintMaterial(
        this.scene,
        'grassLawnMat',
        desc,
        { isFloor: true, isEnvironmentGround: true, surfaceWidth: 120, surfaceHeight: 120 }
      );
      this._appliedGroundMaterialKey = groundMaterialKey;
    }
  }

  /**
   *  Sky Grass 
   * @param {boolean} enabled -  
   */
  setSkyboxEnabled(enabled) {
    if (enabled) {
      if (!this.skybox) {
        //   PhotoDome 360  Sky 
        this.skybox = new BABYLON.PhotoDome('skyBox', SKY_TEXTURE_URL, { resolution: 32, size: SKYBOX_SIZE }, this.scene);
        if (this.skybox.mesh) {
          this.skybox.mesh.rotation.x = Math.PI; //   X  Rotate 180  ， Flip， 
          this.skybox.mesh.position.y = SKYBOX_HORIZON_OFFSET; //  ， Sky Grass 
          this.skybox.mesh.isPickable = false;
        }
        if (this.skybox.photoTexture) {
          this.skybox.photoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
          this.skybox.photoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        }
      }
      if (this.skybox.mesh) {
        this.skybox.mesh.setEnabled(true);
      } else if (typeof this.skybox.setEnabled === 'function') {
        this.skybox.setEnabled(true);
      }

      if (!this.grassLawn) {
        //   1   grassLawn  ，  1000   120
        this.grassLawn = BABYLON.MeshBuilder.CreateGround('grassLawn', { width: 120, height: 120 }, this.scene);
        this.grassLawn.receiveShadows = true; //  Grass 
        this.grassLawn.position.y = -0.01; //   0  ，  1   Z-fighting  
        this.grassLawn.isPickable = false; //  
      }
      this.setEnvironmentMaterials(this._environmentSkyMaterial, this._environmentGroundMaterial);
      this.grassLawn.setEnabled(true);
    } else {
      if (this.skybox) {
        if (this.skybox.mesh) {
          this.skybox.mesh.setEnabled(false);
        } else if (typeof this.skybox.setEnabled === 'function') {
          this.skybox.setEnabled(false);
        }
      }
      if (this.grassLawn) {
        this.grassLawn.setEnabled(false);
      }
    }
  }

  /**
   *   3D  
   * @param {number} scale -   (  0.5 ~ 2.0)
   */
  set3DPanSpeed(scale) {
    const s = Math.max(0.1, Number(scale) || 1.0);
    this.camera.panningSensibility = 1200 / s;
  }

  /**
   *   3D  Rotate 
   * @param {number} scale -   (  0.5 ~ 2.0)
   */
  set3DRotateSpeed(scale) {
    const s = Math.max(0.1, Number(scale) || 1.0);
    this.camera.angularSensibilityX = 2500 / s;
    this.camera.angularSensibilityY = 2500 / s;
  }

  /**
   *   3D   (FOV)
   * @param {number} fovDeg -   (30° ~ 150°，  75°)
   */
  setCameraFOV(fovDeg) {
    const deg = Math.max(30, Math.min(150, Number(fovDeg) || 75));
    this.camera.fov = (deg * Math.PI) / 180;
  }

  /**
   *   ('ultra' | 'high' | 'medium' | 'low')
   * ultra:  
   * high:   ( High Quality)
   * medium:   ( ， High Quality )
   * low:  
   * @param {string} level
   */
  setReflectionQuality(level) {
    const validLevels = ['ultra', 'high', 'medium', 'low'];
    const quality = validLevels.includes(level) ? level : 'medium';
    this.reflectionQuality = quality;

    const testMap = typeof window !== 'undefined' ? window.testMap : null;
    if (testMap) {
      if (typeof testMap.setReflectionQuality === 'function') {
        testMap.setReflectionQuality(quality);
      } else if (quality === 'ultra' || quality === 'high') {
        if (typeof testMap.setAdvancedRendering === 'function') testMap.setAdvancedRendering(true);
      } else {
        if (typeof testMap.setAdvancedRendering === 'function') testMap.setAdvancedRendering(false);
      }
      if (typeof testMap.requestReflectionUpdate === 'function') {
        testMap.requestReflectionUpdate();
      }
    }
  }

  /**
   *   ('ultra' | 'high' | 'medium' | 'off')
   * @param {string} level
   */
  setShadowQuality(level) {
    const validLevels = ['ultra', 'high', 'medium', 'off'];
    const quality = validLevels.includes(level) ? level : 'high';
    this.shadowQuality = quality;

    if (!this.shadowGenerator || !this.sun) return;

    if (quality === 'off') {
      this.shadowGenerator.getShadowMap()?.renderList?.splice(0);
      return;
    }

    const mapSizes = { ultra: 2048, high: 1024, medium: 512 };
    const blurKernels = { ultra: 48, high: 24, medium: 12 };
    const size = mapSizes[quality] || 1024;
    const kernel = blurKernels[quality] || 24;

    const currentSize = this.shadowGenerator.getShadowMap()?.getSize()?.width;
    if (currentSize !== size) {
      this.shadowGenerator.dispose();
      this.shadowGenerator = new BABYLON.ShadowGenerator(size, this.sun);
      this.shadowGenerator.useBlurExponentialShadowMap = true;
      this.shadowGenerator.darkness = 0.25;
    }
    this.shadowGenerator.blurKernel = kernel;

    const testMap = typeof window !== 'undefined' ? window.testMap : null;
    if (testMap && typeof testMap.populateShadowGenerator === 'function') {
      testMap.populateShadowGenerator(this.shadowGenerator, testMap.getCurrentFloorId());
    }
  }

  /**
   *   ('ultra' | 'high' | 'medium' | 'low')
   * @param {string} level
   */
  setGraphicsPreset(level) {
    const validLevels = ['ultra', 'high', 'medium', 'low'];
    const preset = validLevels.includes(level) ? level : 'high';
    this.graphicsPreset = preset;

    if (!this.engine) return;

    let targetDpr = 1.5;
    if (preset === 'ultra') targetDpr = 2.0;       //   2.0x   ( )
    else if (preset === 'high') targetDpr = 1.5;   // 1.5x  
    else if (preset === 'medium') targetDpr = 1.0; // 1.0x  
    else if (preset === 'low') targetDpr = 0.75;  // 0.75x  

    // Babylon.js   setHardwareScalingLevel   WebGL  
    this.engine.setHardwareScalingLevel(1 / Math.max(0.5, targetDpr));
  }

  /**
   *  ， 
   */
  dispose() {
    this.clear3DGrid();
    if (this.skybox) this.skybox.dispose();
    if (this.grassLawn) this.grassLawn.dispose();
    this.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
