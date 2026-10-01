import { Color3 } from '../core/babylon.js';
const BABYLON = { Color3 };
import { BlueprintRegistry } from '../core/BlueprintRegistry.js';
import { getFurnitureDefinition, FURNITURE_DEFINITIONS, FURNITURE_LIST } from '../furniture/index.js';
import { FloorplanDocument, FENCE_SUBTYPE_DEFAULTS, STAIR_SUBTYPE_DEFAULTS } from '../domain/FloorplanDocument.js';
import { ExportService } from '../services/ExportService.js';
import { BabylonSceneRenderer } from '../runtime/BabylonSceneRenderer.js';
import { SelectionController } from '../editor/SelectionController.js';
import { EditorFacade } from '../editor/EditorFacade.js';


export const BLUEPRINT3D_TEST_FLOORPLAN = {
  name: 'blueprint3dTestMap',
  unit: 'in',
  wallHeight: 2.8,
  wallThickness: 0.18,
  floorHeight: 0.2,
  floor: {
    color: '#f4efe6',
    rooms: [
      {
        id: 'living',
        name: '\u5ba2\u5385',
        x: 0,
        z: 0,
        width: 10,
        depth: 8,
        wallIds: {
          north: 'w_north_living',
          east: 'w_east_living',
          south: 'w_south_living',
          west: 'w_west_living'
        }
      },
      {
        id: 'bedroom',
        name: '\u5367\u5ba4',
        x: -2.5,
        z: -6.5,
        width: 5,
        depth: 5,
        wallIds: {
          east: 'w_mid',
          south: 'w_bed_south',
          west: 'w_bed_west'
        }
      },
      {
        id: 'studio',
        name: '\u5de5\u4f5c\u95f4',
        x: 3,
        z: -6.5,
        width: 6,
        depth: 5,
        wallIds: {
          north: 'w_studio_north',
          east: 'w_studio_east',
          south: 'w_studio_south',
          west: 'w_mid'
        }
      }
    ]
  },
  walls: [
    { id: 'w_north_living', from: [-5, -4], to: [0, -4], color: '#f9fbff' },
    { id: 'w_east_living', from: [5, -4], to: [5, 4], color: '#f9fbff' },
    { id: 'w_south_living', from: [5, 4], to: [-5, 4], color: '#f9fbff' },
    { id: 'w_west_living', from: [-5, 4], to: [-5, -4], color: '#f9fbff' },
    { id: 'w_bed_west', from: [-5, -9], to: [-5, -4], color: '#f9fbff' },
    { id: 'w_bed_south', from: [-5, -9], to: [0, -9], color: '#f9fbff' },
    { id: 'w_mid', from: [0, -9], to: [0, -4], color: '#f9fbff' },
    { id: 'w_studio_south', from: [0, -9], to: [6, -9], color: '#f9fbff' },
    { id: 'w_studio_east', from: [6, -9], to: [6, -4], color: '#f9fbff' },
    { id: 'w_studio_north', from: [0, -4], to: [6, -4], color: '#f9fbff' }
  ],
  openings: [
    { id: 'door_living_bedroom', type: 'door', wallId: 'w_north_living', t: 0.28, width: 0.9 },
    { id: 'window_living_south', type: 'window', wallId: 'w_south_living', t: 0.5, width: 1.25, height: 0.85 }
  ],
  items: [
    { id: 'sofa_1', type: 'sofa', name: '\u4e91\u6735\u6c99\u53d1', x: 2.1, z: -1.7, width: 84, depth: 36, height: 32, rotation: 0 },
    { id: 'table_1', type: 'table', name: '\u5706\u8336\u51e0', x: 0.7, z: 1.1, width: 42, depth: 42, height: 20, rotation: 0 },
    { id: 'bed_1', type: 'bed', name: '\u7c89\u8272\u516c\u4e3b\u5e8a', x: -2.4, z: -6.3, width: 76, depth: 88, height: 42, rotation: 0 },
    { id: 'desk_1', type: 'desk', name: '\u84dd\u56fe\u5de5\u4f5c\u684c', x: 3.2, z: -6.2, width: 64, depth: 30, height: 34, rotation: 0 }
  ]
};

export class Blueprint3DTestMap extends BlueprintRegistry {
  /**
   *  Floorplan 
   * @param {BABYLON.Scene} scene - Babylon.js  
   * @param {Object} [options={}] -  
   * @param {string} [options.name] -  ，  'blueprint3dTestMap'
   * @param {Object} [options.floorplan] -  Floorplan 
   * @param {boolean} [options.renderingEnabled=true] -   3D  
   * @param {Object} [options.palette] - Custom 
   */
  constructor(scene, options = {}) {
    super(scene, { name: options.name || 'blueprint3dTestMap' });
    this.editorFacade = new EditorFacade({
      scene,
      floorplan: options.floorplan || BLUEPRINT3D_TEST_FLOORPLAN,
      options: {
        palette: options.palette || {},
        renderingEnabled: options.renderingEnabled !== false
      }
    });

    this.document = this.editorFacade._document;
    this.exportService = this.editorFacade._exportService;
    this.renderer = this.editorFacade._renderer;
    this.selectionController = this.editorFacade._selectionController;
    
    //   map   map， 
    this.itemNodes = this.renderer.itemNodes;
    this.wallNodes = this.renderer.wallNodes;
    this.floorNodes = this.renderer.floorNodes;
    this.openingNodes = this.renderer.openingNodes;
    this.openingDragPreviews = this.renderer.openingDragPreviews;
    this.roofNodes = this.renderer.roofNodes;
    this.stairNodes = this.renderer.stairNodes;
    this.fenceNodes = this.renderer.fenceNodes;
    this.fenceGateNodes = this.renderer.fenceGateNodes;
    this.fenceGateDragPreviews = this.renderer.fenceGateDragPreviews;

    this.renderingDirty = true;
    if (this.renderingEnabled) this.build();
  }

  /**
   *  Floorplan （  editorFacade）
   * @param {string} name -  
   * @param {Object} [args={}] -  
   * @returns {Object|boolean|void}  
   */
  executeCommand(name, args = {}) {
    return this.editorFacade.executeCommand(name, args);
  }

  /** @returns {boolean}   3D   */
  get renderingEnabled() { return this.editorFacade.renderingEnabled; }
  /** @param {boolean} val -   3D   */
  set renderingEnabled(val) { this.editorFacade.renderingEnabled = val; }

  /** @returns {string|null}  Furniture ID */
  get selectedItemId() { return this.selectionController.selectedItemId; }
  /** @param {string|null} val -  Furniture ID */
  set selectedItemId(val) { this.selectionController.selectedItemId = val; }

  /** @returns {string|null}   ID */
  get selectedWallId() { return this.selectionController.selectedWallId; }
  /** @param {string|null} val -   ID */
  set selectedWallId(val) { this.selectionController.selectedWallId = val; }

  /** @returns {string|null}   ID */
  get selectedFenceId() { return this.selectionController.selectedFenceId; }
  /** @param {string|null} val -   ID */
  set selectedFenceId(val) { this.selectionController.selectedFenceId = val; }

  /** @returns {string|null}   ID */
  get selectedFenceGateId() { return this.selectionController.selectedFenceGateId; }
  /** @param {string|null} val -   ID */
  set selectedFenceGateId(val) { this.selectionController.selectedFenceGateId = val; }

  /** @returns {string|null}  Room ID */
  get selectedRoomId() { return this.selectionController.selectedRoomId; }
  /** @param {string|null} val -  Room ID */
  set selectedRoomId(val) { this.selectionController.selectedRoomId = val; }

  /** @returns {BABYLON.Mesh|null} Room  */
  get roomSelectionOutlineMesh() { return this.selectionController.roomSelectionOutlineMesh; }
  /** @param {BABYLON.Mesh|null} val - Room  */
  set roomSelectionOutlineMesh(val) { this.selectionController.roomSelectionOutlineMesh = val; }

  /** @returns {string|null}   ID */
  get selectedRoofId() { return this.selectionController.selectedRoofId; }
  /** @param {string|null} val -   ID */
  set selectedRoofId(val) { this.selectionController.selectedRoofId = val; }

  /** @returns {string|null}   ID */
  get selectedStairsId() { return this.selectionController.selectedStairsId; }
  /** @param {string|null} val -   ID */
  set selectedStairsId(val) { this.selectionController.selectedStairsId = val; }

  /**
   *   shadowCasters  ，  primitives  
   * @returns {BABYLON.IShadowLight[]}  
   */
  get shadowCasters() {
    return this.renderer ? this.renderer.shadowCasters : [];
  }
  /** @param {BABYLON.IShadowLight[]} val -   */
  set shadowCasters(val) {
    if (this.renderer) this.renderer.shadowCasters = val;
  }

  /**
   *   colliders  ，  primitives  
   * @returns {BABYLON.AbstractMesh[]}  
   */
  get colliders() {
    return this.renderer ? this.renderer.colliders : [];
  }
  /** @param {BABYLON.AbstractMesh[]} val -   */
  set colliders(val) {
    if (this.renderer) this.renderer.colliders = val;
  }

  /** @returns {Object} Floorplan  */
  get floorplan() {
    return this.document.floorplan;
  }

  /** @param {Object} val - Floorplan  */
  set floorplan(val) {
    this.document.floorplan = val;
  }

  /** @returns {boolean}  High Quality （ Mirror 、 ） */
  get enableAdvancedRendering() {
    return this.renderer.enableAdvancedRendering;
  }

  /** @param {boolean} val -  High Quality  */
  set enableAdvancedRendering(val) {
    this.setAdvancedRendering(val);
  }

  /**
   *  High Quality 
   * @param {boolean} enabled -  High Quality
   */
  setAdvancedRendering(enabled) {
    if (this.renderer) {
      this.renderer.setAdvancedRendering(enabled);
    }
  }

  setReflectionQuality(level) {
    if (this.renderer) {
      this.renderer.setReflectionQuality(level);
    }
  }

  /** @returns {Object}   */
  get materials() {
    return this.renderer.materials;
  }

  /** @param {Object} val -   */
  set materials(val) {
    this.renderer.materials = val;
  }

  // ----------------------------------------------------
  // 1.   BabylonSceneRenderer  
  // ----------------------------------------------------
  /**   3D   */
  enableRendering() {
    this.renderingEnabled = true;
    if (this.renderer) {
      this.renderer.renderingEnabled = true;
    }
    if (this.renderingDirty) {
      this.build();
    }
  }

  /**   3D   */
  disableRendering() {
    this.renderingEnabled = false;
    if (this.renderer) {
      this.renderer.renderingEnabled = false;
    }
  }

  /**   3D   */
  clearBuiltMeshes() {
    this.renderer.clearBuiltMeshes();
    this.roomSelectionOutlineMesh = null;
  }

  /**   */
  buildFloors() {
    this.renderer.buildFloors();
  }

  /**
   *  
   * @param {string[]} [wallIds=null] -   ID  ，  null  All 
   */
  buildWalls(wallIds = null) {
    this.renderer.buildWalls(wallIds);
  }

  /**
   *  （ ） 
   * @param {string[]} [openingIds=null] -   ID  ，  null  All 
   */
  buildOpenings(openingIds = null) {
    this.renderer.buildOpenings(openingIds);
  }

  /**   */
  buildRoofs() {
    this.renderer.buildRoofs();
  }

  /**   */
  buildStairs() {
    this.renderer.buildStairs();
  }

  /**
   *  
   * @param {string[]} [fenceIds=null] -   ID  ，  null  All 
   */
  buildFences(fenceIds = null) {
    this.renderer.buildFences(fenceIds);
  }

  /**
   *  
   * @param {string[]} [gateIds=null] -   ID  ，  null  All 
   */
  buildFenceGates(gateIds = null) {
    this.renderer.buildFenceGates(gateIds);
  }

  /**
   *  Furniture 
   * @param {Object} item - Furniture 
   * @returns {BABYLON.TransformNode}   3D  
   */
  buildItem(item) {
    return this.renderer.buildItem(item);
  }

  /**
   *  Mirror 
   * @param {BABYLON.AbstractMesh} mesh -  
   * @param {string} itemId - Furniture  ID
   * @param {BABYLON.TransformNode} node - Furniture 
   */
  applyReflectionToMesh(mesh, itemId, node) {
    this.renderer.applyReflectionToMesh(mesh, itemId, node);
  }

  /**
   *  
   * @param {BABYLON.AbstractMesh} mirrorMesh -  
   * @param {string} itemId - Furniture  ID
   * @param {BABYLON.TransformNode} node - Furniture 
   */
  createMirrorTextureForMesh(mirrorMesh, itemId, node) {
    this.renderer.createMirrorTextureForMesh(mirrorMesh, itemId, node);
  }

  /**
   *  
   * @param {BABYLON.AbstractMesh} mirrorMesh -  
   * @param {string} itemId - Furniture  ID
   * @param {BABYLON.TransformNode} node - Furniture 
   */
  createReflectionProbeForMesh(mirrorMesh, itemId, node) {
    this.renderer.createReflectionProbeForMesh(mirrorMesh, itemId, node);
  }

  /**
   *  （ ）
   * @param {BABYLON.AbstractMesh} mirrorMesh -  
   * @param {BABYLON.TransformNode} node - Furniture 
   */
  restoreStaticReflectionTextureForMesh(mirrorMesh, node) {
    this.renderer.restoreStaticReflectionTextureForMesh(mirrorMesh, node);
  }

  /**
   *  Room ID
   * @param {BABYLON.AbstractMesh} mesh -  
   * @returns {string|null} Room ID， Room  null
   */
  getMeshRoomId(mesh) {
    return this.renderer.getMeshRoomId(mesh);
  }

  /**   3D   */
  build() {
    if (!this.renderingEnabled) {
      this.renderingDirty = true;
      return;
    }
    this.renderingDirty = false;
    this.renderer.build();
    this.setSelectedItem(this.selectedItemId);
    this.setSelectedWall(this.selectedWallId);
    this.setSelectedFence(this.selectedFenceId);
    this.setSelectedFenceGate(this.selectedFenceGateId);
    this.setSelectedRoom(this.selectedRoomId);
    this.setSelectedRoof(this.selectedRoofId);
    this.setSelectedStairs(this.selectedStairsId);
  }

  // ----------------------------------------------------
  // 2.   FloorplanDocument  
  // ----------------------------------------------------
  /**
   *  （ ）
   * @param {string} floorId -   ID
   * @returns {number}  
   */
  getFloorElevation(floorId) {
    return this.document.getFloorElevation(floorId);
  }

  /**
   *  （ ）
   * @param {string} wallId -   ID
   * @returns {number}  
   */
  getWallElevationOffset(wallId) {
    return this.document.getWallElevationOffset(wallId);
  }

  /**
   *  （ ） （ ）
   * @param {Object} opening -  
   * @returns {number}  
   */
  getOpeningElevationOffset(opening) {
    return this.document.getOpeningElevationOffset(opening);
  }

  /**
   *  （ ）
   * @param {Object} fence -  
   * @returns {number}  
   */
  getFenceElevationOffset(fence) {
    return this.document.getFenceElevationOffset(fence);
  }

  /**
   *  （ ）
   * @param {Object} stairs -  
   * @returns {number}  
   */
  getStairsElevationOffset(stairs) {
    return this.document.getStairsElevationOffset(stairs);
  }

  /**
   *  
   * @param {Object} stairs -  
   * @returns {number}  
   */
  getStairsAutoHeight(stairs) {
    return this.document.getStairsAutoHeight(stairs);
  }

  /**
   *  Furniture Room 
   * @param {Object} item - Furniture 
   * @returns {number}  
   */
  getItemRoomElevationOffset(item) {
    return this.document.getItemRoomElevationOffset(item);
  }

  /**
   *  
   * @param {string} floorId -   ID
   * @returns {Object|null}  ，  null
   */
  getFloor(floorId) {
    return this.document.getFloor(floorId);
  }

  /**
   *  （ ， ）
   * @param {string} floorId -   ID
   * @returns {number}  
   */
  getFloorLevel(floorId) {
    return this.document.getFloorLevel(floorId);
  }

  /**
   *   3D  
   * @param {string} floorId -   ID
   * @returns {boolean}  
   */
  isFloorVisible(floorId) {
    return this.document.isFloorVisible(floorId);
  }

  /**
   *  Room 
   * @returns {Object[]} Room 
   */
  getCurrentFloorRooms() {
    return this.document.getCurrentFloorRooms();
  }

  /**
   *  
   * @returns {Object[]}  
   */
  getCurrentFloorWalls() {
    return this.document.getCurrentFloorWalls();
  }

  /**
   *  
   * @returns {Object[]}  
   */
  getCurrentFloorOpenings() {
    return this.document.getCurrentFloorOpenings();
  }

  /**
   *  Furniture 
   * @returns {Object[]} Furniture 
   */
  getCurrentFloorItems() {
    return this.document.getCurrentFloorItems();
  }

  /**
   *  
   * @returns {Object[]}  
   */
  getCurrentFloorRoofs() {
    return this.document.getCurrentFloorRoofs();
  }

  /**
   *  
   * @returns {Object[]}  
   */
  getCurrentFloorStairs() {
    return this.document.getCurrentFloorStairs();
  }

  // ----------------------------------------------------
  // 3.  、  Drag Previews   (  SelectionController)
  // ----------------------------------------------------
  /**
   *  Furniture ， Furniture 
   * @param {string|null} itemId -  Furniture ID，  null  Furniture 
   */
  setSelectedItem(itemId) {
    this.selectionController.setSelectedItem(itemId);
  }

  /**
   *  
   * @param {string|null} wallId -   ID，  null  
   */
  setSelectedWall(wallId) {
    this.selectionController.setSelectedWall(wallId);
  }

  /**
   *  Room Select 
   * @param {string|null} roomId -  Room ID，  null  Room 
   */
  setSelectedRoom(roomId) {
    this.selectionController.setSelectedRoom(roomId);
  }

  /**
   *  
   * @param {string|null} fenceId -   ID，  null  
   */
  setSelectedFence(fenceId) {
    this.selectionController.setSelectedFence(fenceId);
  }

  /**
   *  
   * @param {string|null} gateId -   ID，  null  
   */
  setSelectedFenceGate(gateId) {
    this.selectionController.setSelectedFenceGate(gateId);
  }

  /**
   *  
   * @param {string|null} roofId -   ID，  null  
   */
  setSelectedRoof(roofId) {
    this.selectionController.setSelectedRoof(roofId);
  }

  /**
   *  
   * @param {string|null} stairsId -   ID，  null  
   */
  setSelectedStairs(stairsId) {
    this.selectionController.setSelectedStairs(stairsId);
  }

  /**
   *  
   * @param {string} openingId -   ID
   * @returns {BABYLON.Mesh|null}  
   */
  beginOpeningDragPreview(openingId) {
    return this.editorFacade.beginEntityPreview('opening', openingId);
  }

  /**
   *  ， 
   * @param {string} openingId -   ID
   * @returns {boolean}  
   */
  finishOpeningDragPreview(openingId) {
    return this.editorFacade.commitEntityPreview('opening', openingId);
  }

  /**
   *  ， Rotate
   * @param {string} openingId -   ID
   */
  updateOpeningNodePose(openingId) {
    this.selectionController.updateOpeningNodePose(openingId);
  }

  /**
   *  
   * @param {string} gateId -   ID
   * @returns {BABYLON.Mesh|null}  
   */
  beginFenceGateDragPreview(gateId) {
    return this.editorFacade.beginEntityPreview('fenceGate', gateId);
  }

  /**
   *  
   * @param {string} gateId -   ID
   */
  syncFenceGateDragPreview(gateId) {
    this.selectionController.syncFenceGateDragPreview(gateId);
  }

  /**
   *  ， 
   * @param {string} gateId -   ID
   * @returns {boolean}  
   */
  finishFenceGateDragPreview(gateId) {
    return this.editorFacade.commitEntityPreview('fenceGate', gateId);
  }

  /**
   *  （Rotate、 ）
   * @param {string} gateId -   ID
   */
  updateFenceGateNodeTransform(gateId) {
    this.selectionController.updateFenceGateNodeTransform(gateId);
  }

  /**   */
  requestReflectionProbesUpdate() {
    this.renderer.requestReflectionTexturesUpdate();
  }

  // ----------------------------------------------------
  // 4.  
  // ----------------------------------------------------
  /**
   *  Room ID  Room 
   * @param {string} roomId - Room ID
   * @returns {Object|null} Room 
   */
  getRoom(roomId) {
    return this.document.getRoom(roomId);
  }

  /**
   *   (x, z)  Room
   * @param {number} x - 2D   X  
   * @param {number} z - 2D   Z  
   * @returns {Object|null}  Room ，  null
   */
  getRoomAt(x, z) {
    return this.document.getRoomAt(x, z);
  }

  /**
   *  Furniture Room （ Furniture ）
   * @param {string} itemId - Furniture ID
   * @param {string|null} roomId - Room ID
   * @returns {boolean}  
   */
  assignItemToRoom(itemId, roomId) {
    return this.document.assignItemToRoom(itemId, roomId);
  }

  /**  Furniture Room ， FloorplanFurniture Room  */
  refreshItemRoomLinks() {
    this.document.refreshItemRoomLinks();
  }

  /**
   *  
   * @param {string} wallId -   ID
   * @returns {Object|null}  
   */
  getWall(wallId) {
    return this.document.getWall(wallId);
  }

  /**
   *  
   * @param {string} openingId -   ID
   * @returns {Object|null}  
   */
  getOpening(openingId) {
    return this.document.getOpening(openingId);
  }

  /**
   *  Furniture 
   * @param {string} itemId - Furniture ID
   * @returns {Object|null} Furniture 
   */
  getItem(itemId) {
    return this.document.getItem(itemId);
  }

  /**
   *  Furniture 3D  
   * @param {string} type - Furniture / 
   * @returns {Object|null} Furniture 
   */
  getFurnitureDefinition(type) {
    return getFurnitureDefinition(type);
  }

  /**
   *  Furniture 
   * @returns {Object[]} Furniture 
   */
  getFurnitureList() {
    return FURNITURE_LIST;
  }

  // ----------------------------------------------------
  // 5. CRUD  
  // ----------------------------------------------------
  /**
   *  
   * @param {string} floorId -   ID
   * @returns {Object}  
   */
  setCurrentFloor(floorId) {
    const floor = this.document.setCurrentFloor(floorId);
    this.build();
    return floor;
  }

  /**
   *  
   * @param {Object} [partialFloor={}] -   patch
   * @returns {Object}  
   */
  addFloor(partialFloor = {}) {
    const floor = this.document.addFloor(partialFloor);
    this.build();
    return floor;
  }

  /**
   * Delete 
   * @param {string} floorId -   ID
   * @returns {boolean}  Delete
   */
  deleteFloor(floorId) {
    const success = this.document.deleteFloor(floorId);
    if (success) this.build();
    return success;
  }

  /**
   *  （ ）
   * @param {string} floorId -   ID
   * @param {'up'|'down'} direction -  
   * @returns {boolean}  
   */
  moveFloor(floorId, direction) {
    const success = this.document.moveFloor(floorId, direction);
    if (success) this.build();
    return success;
  }

  /**
   *  
   * @param {string} floorId -   ID
   * @param {string} name -  
   * @returns {Object|null}  
   */
  renameFloor(floorId, name) {
    const floor = this.document.renameFloor(floorId, name);
    if (floor) this.build();
    return floor;
  }

  /**
   *  Floorplan 
   * @param {string} sourceFloorId -   ID
   * @param {string} targetFloorId -   ID
   */
  copyFloorPlanToFloor(sourceFloorId, targetFloorId) {
    this.document.copyFloorPlanToFloor(sourceFloorId, targetFloorId);
    this.build();
  }

  /**
   *  
   * @param {string} floorId -   ID
   * @param {boolean} hideRoof -  
   * @param {boolean} hideWall -  
   * @param {boolean} skyboxEnabled -  Sky 
   * @returns {boolean}  
   */
  changeFloorHideSettings(floorId, hideRoof, hideWall, skyboxEnabled) {
    const success = this.document.changeFloorHideSettings(floorId, hideRoof, hideWall, skyboxEnabled);
    if (success) this.build();
    return success;
  }

  /**
   *  （ ）
   * @param {string} floorId -   ID
   * @param {number} height -  （ ）
   * @returns {boolean}  
   */
  changeFloorHeight(floorId, height) {
    const success = this.document.changeFloorHeight(floorId, height);
    if (success) this.build();
    return success;
  }

  /**
   *  
   * @param {string} floorId -   ID
   * @param {number} floorHeight -  （ ）
   * @returns {boolean}  
   */
  changeFloorDefaultFloorHeight(floorId, floorHeight) {
    const success = this.document.changeFloorDefaultFloorHeight(floorId, floorHeight);
    if (success) this.build();
    return success;
  }

  /**
   *  Furniture 
   * @param {Object} partialItem - Furniture 
   * @returns {Object}  Furniture 
   */
  addItem(partialItem) {
    const item = this.document.addItem(partialItem);
    this.buildItem(item);
    return item;
  }

  /**
   *  Furniture ， 
   * @param {string} itemId - Furniture ID
   * @param {Object} patch -  
   * @returns {Object|null}  Furniture 
   */
  updateItem(itemId, patch) {
    const item = this.document.updateItem(itemId, patch);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    if (item._spawnedFood) {
      const spawnedFood = item._spawnedFood;
      delete item._spawnedFood;
      this.buildItem(spawnedFood);
    }
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   *  Furniture ， 
   * @param {string} itemId - Furniture ID
   * @param {string} componentId -  
   * @param {string} color -   Hex  
   * @returns {Object|null}  Furniture 
   */
  updateItemComponentColor(itemId, componentId, color) {
    const item = this.document.updateItemComponentColor(itemId, componentId, color);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   *  Furniture ， 
   * @param {string} itemId - Furniture ID
   * @param {string} componentId -  
   * @param {Object} materialDescriptor -  
   * @returns {Object|null}  Furniture 
   */
  updateItemComponentMaterial(itemId, componentId, materialDescriptor) {
    const item = this.document.updateItemComponentMaterial(itemId, componentId, materialDescriptor);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   * Rotate Furniture 
   * @param {string} itemId - Furniture ID
   * @param {number} rotationRadians - Rotate （ ）
   * @returns {Object|null} Furniture 
   */
  rotateItem(itemId, rotationRadians) {
    const item = this.document.rotateItem(itemId, rotationRadians);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   *   3D  Delete Furniture 
   * @param {string} itemId - Furniture ID
   * @returns {boolean}  Delete
   */
  deleteItem(itemId) {
    const oldNode = this.itemNodes.get(itemId);
    const success = this.document.deleteItem(itemId);
    if (success) {
      if (oldNode) oldNode.dispose(false, false);
      this.itemNodes.delete(itemId);
    }
    return success;
  }

  /**
   *  ， 
   * @param {number[]} from -   2D   `[x, z]`
   * @param {number[]} to -   2D   `[x, z]`
   * @returns {Object}  
   */
  addWall(from, to) {
    const wall = this.document.addWall(from, to);
    this.build();
    return wall;
  }

  /**
   *  （ / ， Floorplan ）
   * @param {string} wallId -   ID
   * @returns {number}  
   */
  getWallLength(wallId) {
    return this.document.getWallLength(wallId);
  }

  /**
   *  （ ）
   * @param {string} wallId -   ID
   * @param {number} length -  
   * @returns {Object|null}  
   */
  updateWallLength(wallId, length) {
    const wall = this.document.updateWallLength(wallId, length);
    if (wall) this.build();
    return wall;
  }

  /**
   *  
   * @param {string} wallId -   ID
   * @param {number} length -  
   * @returns {Object|null}  
   */
  setWallLength(wallId, length) {
    return this.updateWallLength(wallId, length);
  }

  /**
   *  （ 、 、 ）
   * @param {string} wallId -   ID
   * @param {Object} patch -  
   * @param {Object} [options={}] -  
   * @param {boolean} [options.rebuild=true] -   3D  
   * @returns {Object|null}  
   */
  updateWall(wallId, patch, options = {}) {
    const wall = this.document.updateWall(wallId, patch);
    if (wall && options.rebuild !== false) {
      this.build();
    }
    return wall;
  }

  /**
   *  
   * @param {string} wallId -   ID
   * @param {string} color -   Hex  
   * @returns {Object|null}  
   */
  setWallColor(wallId, color) {
    return this.updateWall(wallId, { color, material: color });
  }

  /**
   *  （ Room ）
   * @param {string} wallId -   ID
   */
  deleteWall(wallId) {
    this.document.deleteWall(wallId);
    this.build();
  }

  /**
   *  Room 
   * @param {Object} room - Room 
   * @param {boolean} [createMissing=false] -  
   * @returns {Object}  
   */
  syncRoomWalls(room, createMissing = false) {
    const result = this.document.syncRoomWalls(room, createMissing);
    this.build();
    return result;
  }

  /**
   *  Room，  3D  
   * @param {Object} [partialRoom={}] - Room 
   * @returns {Object}  Room 
   */
  addRoom(partialRoom = {}) {
    const room = this.document.addRoom(partialRoom);
    this.build();
    return room;
  }

  /**
   *   2D  Room Furniture 
   * @param {string} roomId - Room ID
   * @param {number} dx -   X  
   * @param {number} dz -   Z  
   * @returns {Object|null}  Room 
   */
  moveRoom(roomId, dx, dz) {
    const room = this.document.moveRoom(roomId, dx, dz);
    if (room) this.build();
    return room;
  }

  /**
   *  Room 
   * @param {string} roomId - Room ID
   * @param {Object} patch -  
   * @param {Object} [options={}] -  
   * @param {boolean} [options.rebuild=true] -   3D  
   * @returns {Object|null}  Room 
   */
  updateRoom(roomId, patch, options = {}) {
    const room = this.document.updateRoom(roomId, patch, options);
    if (room && options.rebuild !== false) {
      this.build();
    }
    return room;
  }

  /**
   *   3D  Delete Room（ ）
   * @param {string} roomId - Room ID
   * @returns {boolean}  Delete
   */
  deleteRoom(roomId) {
    const success = this.document.deleteRoom(roomId);
    if (success) this.build();
    return success;
  }

  /**
   *  ， 
   * @param {Object} [partialRoof={}] -  
   * @returns {Object}  
   */
  addRoof(partialRoof = {}) {
    const roof = this.document.addRoof(partialRoof);
    this.build();
    return roof;
  }

  /**
   *  ， 
   * @param {Object} [partialStairs={}] -  
   * @returns {Object}  
   */
  addStairs(partialStairs = {}) {
    const stairs = this.document.addStairs(partialStairs);
    this.build();
    return stairs;
  }

  /**
   *  
   * @param {string} roofId -   ID
   * @returns {Object|null}  
   */
  getRoof(roofId) {
    return this.document.getRoof(roofId);
  }

  /**
   *  
   * @param {string} roofId -   ID
   * @param {Object} patch -  
   * @param {boolean} [rebuild=true] -   3D  
   * @returns {Object|null}  
   */
  updateRoof(roofId, patch, rebuild = true) {
    const roof = this.document.updateRoof(roofId, patch);
    if (roof && rebuild) this.build();
    return roof;
  }

  /**
   *  Floorplan  3D  
   * @param {string} roofId -   ID
   * @returns {boolean}  Delete
   */
  deleteRoof(roofId) {
    const success = this.document.deleteRoof(roofId);
    if (success) this.build();
    return success;
  }

  /**
   *  
   * @param {string} stairsId -   ID
   * @returns {Object|null}  
   */
  getStairs(stairsId) {
    return this.document.getStairs(stairsId);
  }

  /**
   *  、 、 
   * @param {string} stairsId -   ID
   * @param {Object} patch -  
   * @param {boolean} [rebuild=true] -   3D  
   * @returns {Object|null}  
   */
  updateStairs(stairsId, patch, rebuild = true) {
    const stairs = this.document.updateStairs(stairsId, patch);
    if (stairs && rebuild) this.build();
    return stairs;
  }

  /**
   *  Floorplan  3D  
   * @param {string} stairsId -   ID
   * @returns {boolean}  Delete
   */
  deleteStairs(stairsId) {
    const success = this.document.deleteStairs(stairsId);
    if (success) this.build();
    return success;
  }

  /**
   *  ，  3D  
   * @param {Object} [partialFence={}] -  
   * @returns {Object}  
   */
  addFence(partialFence = {}) {
    const fence = this.document.addFence(partialFence);
    this.build();
    return fence;
  }

  /**
   *  
   * @param {string} fenceId -   ID
   * @returns {Object|null}  
   */
  getFence(fenceId) {
    return this.document.getFence(fenceId);
  }

  /**
   *  
   * @param {string} fenceId -   ID
   * @param {Object} patch -  
   * @param {boolean} [rebuild=true] -   3D  
   * @returns {Object|null}  
   */
  updateFence(fenceId, patch, rebuild = true) {
    const fence = this.document.updateFence(fenceId, patch);
    if (fence && rebuild) this.build();
    return fence;
  }

  /**
   *  
   * @param {string} fenceId -   ID
   * @returns {boolean}  Delete
   */
  deleteFence(fenceId) {
    const success = this.document.deleteFence(fenceId);
    if (success) this.build();
    return success;
  }

  /**
   *  ， 
   * @param {Object} [partialFenceGate={}] -  
   * @returns {Object}  
   */
  addFenceGate(partialFenceGate = {}) {
    const gate = this.document.addFenceGate(partialFenceGate);
    this.build();
    return gate;
  }

  /**
   *  
   * @param {string} gateId -   ID
   * @returns {Object|null}  
   */
  getFenceGate(gateId) {
    return this.document.getFenceGate(gateId);
  }

  /**
   *  （ ）
   * @param {string} gateId -   ID
   * @param {Object} patch -  
   * @param {boolean} [rebuild=true] -  ，  false  
   * @returns {Object|null}  
   */
  updateFenceGate(gateId, patch, rebuild = true) {
    const gate = this.document.updateFenceGate(gateId, patch);
    if (!gate) return null;
    const hasMorphChange = Object.keys(patch || {}).some(k =>
      ['isOpen', 'doubleDoor', 'isFlippedLR', 'isFlippedIO', 'width', 'height', 'thickness', 'subtype', 'from', 'to', 'fenceId', 't'].includes(k)
    );
    if (rebuild || hasMorphChange) {
      if (typeof this.editorFacade?._renderer?.buildFenceGates === 'function') {
        this.editorFacade._renderer.buildFenceGates();
        this.editorFacade._renderer.buildFences();
      } else {
        this.build();
      }
    } else {
      this.updateFenceGateNodeTransform(gateId);
    }
    return gate;
  }

  /**
   *  
   * @param {string} gateId -   ID
   * @returns {boolean}  Delete
   */
  deleteFenceGate(gateId) {
    const success = this.document.deleteFenceGate(gateId);
    if (success) this.build();
    return success;
  }

  /**
   *  （ 、 ） 
   * @param {string} wallId -   ID
   * @param {'door'|'window'|string} [type='door'] -  
   * @param {number} [t=0.5] -   (0 ~ 1)
   * @param {string} [shape='square'] -  
   * @returns {Object|null}  
   */
  addOpening(wallId, type = 'door', t = 0.5, shape = 'square') {
    const opening = this.document.addOpening(wallId, type, t, shape);
    if (opening) this.build();
    return opening;
  }

  /**
   *  
   * @param {string} openingId -   ID
   * @param {Object} patch -  
   * @param {boolean} [rebuild=true] -   3D  。  false  
   * @returns {Object|null}  
   */
  updateOpening(openingId, patch, rebuild = true) {
    const opening = this.document.updateOpening(openingId, patch);
    if (opening) {
      if (rebuild) {
        this.build();
      } else {
        this.updateOpeningNodePose(openingId);
      }
    }
    return opening;
  }

  /**
   *  ， 
   * @param {string} openingId -   ID
   */
  resetOpeningMaterial(openingId) {
    this.document.resetOpeningMaterial(openingId);
    this.build();
  }

  /**
   *  
   * @param {string} openingId -   ID
   * @returns {boolean}  Delete 
   */
  deleteOpening(openingId) {
    const success = this.document.deleteOpening(openingId);
    if (success) this.build();
    return success;
  }

  /**
   *  ，  Babylon  
   * @param {string} color - Hex  （  '#f4efe6'）
   */
  setFloorColor(color) {
    this.document.setFloorColor(color);
    this.materials.floor.diffuseColor = BABYLON.Color3.FromHexString(color);
    this.build();
  }

  /**
   *  Room 
   * @param {string} roomId -  Room ID
   * @param {Object} materialDescriptor -  
   * @returns {Object|null} Room 
   */
  setRoomFloorMaterial(roomId, materialDescriptor) {
    const room = this.document.setRoomFloorMaterial(roomId, materialDescriptor);
    if (room) this.build();
    return room;
  }

  setEnvironmentMaterial(component, materialDescriptor) {
    return this.editorFacade.setEnvironmentMaterial(component, materialDescriptor, false);
  }

  /**
   *  
   * @param {Object} materialDescriptor -  
   */
  setFloorMaterial(materialDescriptor) {
    this.document.setFloorMaterial(materialDescriptor);
    this.build();
  }

  // ----------------------------------------------------
  // 6.  Export 
  // ----------------------------------------------------
  /**
   *  Floorplan  JSON  
   * @returns {Object} Floorplan JSON  
   */
  exportJSON() {
    return this.exportService.exportJSON();
  }

  /**
   *  Floorplan Export 
   * @param {Object} [options={}] -  
   * @returns {ArrayBuffer} Export 
   */
  exportBuildingFile(options = {}) {
    return this.exportService.exportBuildingFile(options);
  }

  /**
   *  
   * @param {Object} [options={}] -  
   * @returns {string}  
   */
  stringifyBuildingFile(options = {}) {
    return this.exportService.stringifyBuildingFile(options);
  }

  /**
   *   2D   AutoCAD   DXF  
   * @returns {string}   DXF  
   */
  stringifyDXF() {
    return this.exportService.stringifyDXF();
  }

  /**
   *   3D  ，  ZIP   3MF  
   * @param {Object} [options={}] - 3MF  （ 、 ）
   * @returns {Promise<Blob>}   3MF   Blob  
   */
  create3MFPackage(options = {}) {
    return this.exportService.create3MFPackage(options);
  }

  /**
   *   3D  ， Select  3D  
   * @param {ArrayBuffer} fileData -  
   */
  loadBuildingFile(fileData) {
    return this.editorFacade.loadBuildingFile(fileData);
  }

  /**
   *   JSON  Floorplan ， Select  3D  
   * @param {Object} floorplan -   JSON  
   */
  loadJSON(floorplan) {
    return this.editorFacade.loadJSON(floorplan);
  }

  // ----------------------------------------------------
  // 7.   API  （  editorFacade， ）
  // ----------------------------------------------------
  getSnapshot() { return this.editorFacade.getSnapshot(); }
  getProjectMetadata() { return this.editorFacade.getProjectMetadata(); }
  getCurrentFloorId() { return this.editorFacade.getCurrentFloorId(); }
  getFloors() { return this.editorFacade.getFloors(); }
  getFloor(id) { return this.editorFacade.getFloor(id); }
  getEntities(type, options) { return this.editorFacade.getEntities(type, options); }
  getEntity(type, id) { return this.editorFacade.getEntity(type, id); }
  getEntityElevationOffset(type, entityOrId) { return this.editorFacade.getEntityElevationOffset(type, entityOrId); }
  getCurrentFloorEntities(type) { return this.editorFacade.getCurrentFloorEntities(type); }
  getFurnitureDefinition(type) { return this.editorFacade.getFurnitureDefinition(type); }
  getFloorElevation(id) { return this.editorFacade.getFloorElevation(id); }
  getFloorLevel(floorId) { return this.editorFacade.getFloorLevel(floorId); }
  getStairsAutoHeight(stairs) { return this.editorFacade.getStairsAutoHeight(stairs); }

  // ----------------------------------------------------
  // 8.   API  （  editorFacade）
  // ----------------------------------------------------
  getEntityRenderNode(type, id) { return this.editorFacade.getEntityRenderNode(type, id); }
  syncEntityPreview(type, id) { return this.editorFacade.syncEntityPreview(type, id); }
  getEntityWorldTransform(type, id) { return this.editorFacade.getEntityWorldTransform(type, id); }
  getEntityPreviewStatus() { return this.editorFacade.getEntityPreviewStatus(); }
  getRuntimePreviewResourceCount() { return this.editorFacade.getRuntimePreviewResourceCount(); }
  beginEntityPreview(type, id) { return this.editorFacade.beginEntityPreview(type, id); }
  updateEntityPreview(type, id, transform) { return this.editorFacade.updateEntityPreview(type, id, transform); }
  commitEntityPreview(type, id) { return this.editorFacade.commitEntityPreview(type, id); }
  cancelEntityPreview(type, id) { return this.editorFacade.cancelEntityPreview(type, id); }
  get advancedRenderingEnabled() { return this.editorFacade.advancedRenderingEnabled; }
  refreshRendering() { return this.editorFacade.refreshRendering(); }
  requestReflectionUpdate() { return this.editorFacade.requestReflectionUpdate(); }
  attachRuntimeOverlay(node) { return this.editorFacade.attachRuntimeOverlay(node); }
  populateShadowGenerator(shadowGenerator, floorId) { return this.editorFacade.populateShadowGenerator(shadowGenerator, floorId); }
  dispose() { return this.editorFacade.dispose(); }
}

export { FURNITURE_DEFINITIONS, FURNITURE_LIST, FENCE_SUBTYPE_DEFAULTS, STAIR_SUBTYPE_DEFAULTS };

export function buildBlueprint3DTestMap(scene, options = {}) {
  return new Blueprint3DTestMap(scene, options);
}
