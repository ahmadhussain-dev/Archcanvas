/**
 *  ：
 * 
 * 1.   blueprint3d-babylon   API  （Facade）。
 * 2.  、 （  example/app.js）  import
 *    'src/core/*', 'src/presets/*', 'src/rooms/*', 'src/furniture/*'  。
 * 3.   API  。
 * 4.  （domain   -> runtime   -> editor   -> api  ），
 *      API  。
 */

// ==========================================
// 1. Babylon.js  Export
// ==========================================
export {
  AbstractMesh,
  ArcRotateCamera,
  CSG,
  Color3,
  Color4,
  CubeTexture,
  DirectionalLight,
  DynamicTexture,
  Engine,
  HemisphericLight,
  Material,
  MaterialPluginBase,
  Matrix,
  Mesh,
  MeshBuilder,
  MirrorTexture,
  Node,
  Plane,
  PhotoDome,
  PointerEventTypes,
  PointLight,
  RenderTargetTexture,
  Ray,
  ReflectionProbe,
  Scene,
  ShaderLanguage,
  ShadowGenerator,
  ShadowGeneratorSceneComponent,
  SpotLight,
  StandardMaterial,
  Texture,
  Tools,
  TransformNode,
  Vector3,
  VertexBuffer,
  VertexData
} from '../core/babylon.js';

// ==========================================
// 2. Domain / Core  
// ==========================================
export {
  BlueprintRegistry,
  normalizeVector3,
  setTransform
} from '../core/BlueprintRegistry.js';

export {
  getShadowCasterContext,
  shouldIncludeShadowCaster
} from '../runtime/shadowCasterFilter.js';

export {
  FloorplanDocument
} from '../domain/FloorplanDocument.js';

export {
  MaterialResolver
} from '../domain/MaterialResolver.js';

export {
  applyAiOperations
} from '../ai/applyAiPlan.js';

export {
  createFlatMaterial,
  createBlueprintMaterial,
  createMaterialPalette
} from '../core/materials.js';

export {
  stringifyDXF,
  create3MFPackage,
  create3MFModelXml,
  createDXFFileName,
  create3MFFileName
} from '../core/exporters.js';

export {
  BUILDING_FILE_FORMAT,
  BUILDING_FILE_EXTENSION,
  createBuildingFile,
  parseBuildingFile,
  stringifyBuildingFile,
  createBuildingFileName
} from '../core/buildingFile.js';

export {
  createBox,
  createCylinder,
  createSphere,
  createDisc,
  createFenceLine
} from '../core/primitives.js';

export {
  MATERIAL_CATEGORIES,
  DEFAULT_MATERIAL_PACKS,
  createColorMaterialDescriptor,
  createTextureMaterialDescriptor
} from '../core/materialCatalog.js';

export {
  resolveMaterialAssetDescriptor,
  toSameOriginUrl
} from '../core/materialAssets.js';

export {
  isItemSnappedToBookshelfOrMannequin
} from '../core/exporterUtils.js';

// ==========================================
// 3. Geometry  
// ==========================================
export {
  buildFenceGeometry
} from '../geometry/fenceGeometry.js';

export {
  buildFenceGateGeometry
} from '../geometry/fenceGateGeometry.js';

export {
  getRoofGeometryData,
  getRoofFramePaths
} from '../geometry/roofGeometry.js';
export {
  clipRoofFramePaths,
  createRoofCutContext,
  getCutRoofGeometry,
  getRoofCutNeighborIds
} from '../geometry/roofCutGeometry.js';

// ==========================================
// 4. Audio  
// ==========================================
export {
  playWindChimeSound
} from '../audio/windChimeSound.js';

// ==========================================
// 5. Furniture  
// ==========================================
export {
  boxComponent,
  cylinderComponent,
  sphereComponent,
  rightTriangleComponent,
  halfCylinderComponent,
  coneComponent
} from '../furniture/_helpers.js';

export {
  FURNITURE_CATEGORIES,
  FURNITURE_DEFINITIONS,
  FURNITURE_LIST,
  getFurnitureDefinition,
  isPowerControllable,
  isAppliancePowerOn
} from '../furniture/index.js';

// ==========================================
// 6. Openings & Rooms  
// ==========================================
export {
  buildOpeningGeometry,
  createOpeningCutterMesh,
  normalizeOpeningShape,
  isSymmetricShape,
  OPENING_SHAPES,
  getOpeningUnitVertices,
  getOpeningVertices,
  triangulateOpening
} from '../openings/index.js';

export {
  ROOM_SHAPES,
  normalizeRoomShape,
  getRoomShapeDefinition,
  getRoomLocalVertices,
  getRoomVertices,
  getRoomBounds,
  getRoomWallKeys,
  pointInRoom,
  triangulateRoom
} from '../rooms/index.js';

// ==========================================
// 7. Runtime  
// ==========================================
export {
  PinkCastleGenerator
} from '../runtime/PinkCastleGenerator.js';

export {
  BabylonSceneRenderer,
  isNoCeilingRoom,
  isParapetWall,
  overlappedWallIds,
  PARAPET_HEIGHT
} from '../runtime/BabylonSceneRenderer.js';

export {
  SelectionController
} from '../editor/SelectionController.js';

export {
  ExportService
} from '../services/ExportService.js';

export {
  EditorFacade,
  createDocument,
  createBabylonRenderer,
  createEditor
} from '../editor/EditorFacade.js';

// ==========================================
// 8. Sample Data (  Presets  )
// ==========================================
import {
  PINK_CASTLE_BLUEPRINT,
  PINK_CASTLE_PALETTE,
  PinkCastleBlueprint,
  buildPinkCastle
} from '../presets/pinkCastle.js';

import {
  BLUEPRINT3D_TEST_FLOORPLAN,
  Blueprint3DTestMap,
  buildBlueprint3DTestMap,
  FENCE_SUBTYPE_DEFAULTS,
  STAIR_SUBTYPE_DEFAULTS,
  FURNITURE_DEFINITIONS as PRESET_FURNITURE_DEFINITIONS,
  FURNITURE_LIST as PRESET_FURNITURE_LIST
} from '../presets/blueprintTestMap.js';

//   sampleData  Export 
export const sampleData = {
  pinkCastle: {
    blueprint: PINK_CASTLE_BLUEPRINT,
    palette: PINK_CASTLE_PALETTE,
    class: PinkCastleBlueprint,
    build: buildPinkCastle
  },
  blueprintTestMap: {
    blueprint: BLUEPRINT3D_TEST_FLOORPLAN,
    class: Blueprint3DTestMap,
    build: buildBlueprint3DTestMap,
    fenceSubtypeDefaults: FENCE_SUBTYPE_DEFAULTS,
    stairSubtypeDefaults: STAIR_SUBTYPE_DEFAULTS,
    furnitureDefinitions: PRESET_FURNITURE_DEFINITIONS,
    furnitureList: PRESET_FURNITURE_LIST
  }
};

//  ： Export ， 
export {
  PINK_CASTLE_BLUEPRINT,
  PINK_CASTLE_PALETTE,
  PinkCastleBlueprint,
  buildPinkCastle
} from '../presets/pinkCastle.js';

export {
  BLUEPRINT3D_TEST_FLOORPLAN,
  Blueprint3DTestMap,
  buildBlueprint3DTestMap,
  FENCE_SUBTYPE_DEFAULTS,
  STAIR_SUBTYPE_DEFAULTS
} from '../presets/blueprintTestMap.js';

// ==========================================
// 9.  Export
// ==========================================
export * as Topology from '../editor/Topology.js';
export { DragHandler } from '../editor/DragHandler.js';
export { Viewer3DHandles } from '../editor/Viewer3DHandles.js';

/** Build the public URL used by the example's copied furniture image directory. */
export function getFurnitureThumbnailUrl(type, basePath = './src/furniture/image') {
  const safeType = String(type || 'custom_cube').replace(/[^a-zA-Z0-9_-]/g, '') || 'custom_cube';
  return `${String(basePath).replace(/\/$/, '')}/${safeType}.png`;
}

/** Bundler-safe URL for the default sky texture. */
export const SKY_TEXTURE_URL = new URL('../textures/sky.png', import.meta.url).href;

/** Bundler-safe URL for the default grass texture. */
export const GRASS_TEXTURE_URL = new URL('../textures/stone_grass.jpg', import.meta.url).href;
