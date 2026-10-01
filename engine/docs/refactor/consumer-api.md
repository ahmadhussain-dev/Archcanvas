# Consumer API & Compatibility Interfaces

External editors should import strictly from `src/index.js` and instantiate via `createEditor({ scene, floorplan, options })`.

Stable Phase 3 interfaces are grouped into:

- **Query**: `getProjectMetadata`, `getSnapshot`, `getCurrentFloorId`, `getFloors`, `getFloor`, `getEntities`, `getEntity`, `getRoomAt`, `getFloorElevation`, `getEntityElevationOffset`.
- **Command**: `executeCommand` and entity CRUD convenience methods powered by it.
- **Preview Transactions**: `beginEntityPreview`, `updateEntityPreview`, `commitEntityPreview`, `cancelEntityPreview`.
- **File & IO**: `exportJSON`, `loadJSON`, Building File, DXF, and 3MF interfaces.
- **Runtime Orchestration**: `enableRendering`, `disableRendering`, `refreshRendering`, `populateShadowGenerator`, `attachRuntimeOverlay`.

---

## Retained Compatibility Interfaces

The following interfaces are retained solely for legacy consumers (the `example` app no longer uses them):

- `Blueprint3DTestMap`, `buildBlueprint3DTestMap`.
- `Blueprint3DTestMap.document`, `renderer`, `selectionController`, `exportService`.
- `itemNodes`, `wallNodes`, `floorNodes`, `openingNodes`, `roofNodes`, `stairNodes`, `fenceNodes`, `fenceGateNodes`, and drag preview Maps.
- `EditorFacade.floorplan` mutable getter/setter.
- `EditorFacade.getEntityRenderNode` and `roomSelectionOutlineMesh`.
- `createDocument`, `createBabylonRenderer`, and re-exported `FloorplanDocument`, `BabylonSceneRenderer`, `SelectionController`.
- Legacy step-by-step `buildFloors/buildWalls/buildOpenings/...` and low-level reflection texture methods.

---

## Deprecation Roadmap for Next Phase

1. Remove node Maps, internal controller fields, `getEntityRenderNode`, and `roomSelectionOutlineMesh`.
2. Remove mutable `floorplan`, enforcing query snapshots and command writes.
3. Mark `Blueprint3DTestMap` and `buildBlueprint3DTestMap` as officially deprecated and move them out of the default entry point.
4. Shrink Domain/Runtime implementation classes in default exports; consumers needing low-level assembly should use explicit subpaths.

---

## Core API Usage Example

The refactored core library uses the unified `EditorFacade` and provides a factory function `createEditor` to quickly build applications.

```javascript
import {
  createEditor,
  sampleData,
  createTextureMaterialDescriptor
} from './blueprint3d-babylon/src/index.js';

// 1. Initialize 3D map editor unified Facade instance
const testMap = createEditor({
  scene: babylonScene,
  floorplan: sampleData.blueprintTestMap.blueprint, // Pass initial floorplan data
  options: { renderingEnabled: true }
});

// 2. Execute edit commands (Data-driven command updates)
testMap.executeCommand('updateRoom', {
  roomId: 'living_room_1',
  patch: { x: 2.0, z: -1.5, width: 8.5, depth: 6.0 }
});

// 3. Dynamically control door/window dimensions and hidden attributes
testMap.executeCommand('updateOpening', {
  openingId: 'door_main',
  patch: { width: 1.2, height: 2.2, panelHidden: true }
});

// 4. Convenience methods for specific entities (delegated to command mechanism under the hood)
testMap.updateWall('wall_east', { locked: false });
testMap.setWallLength('wall_east', 6.2);

// 5. Read-only snapshots for state & attributes (protects internal data from external mutation)
const snapshot = testMap.getSnapshot(); 
const metadata = testMap.getProjectMetadata();

// 6. Decoupled loading & export features
const buildingJsonString = testMap.stringifyBuildingFile({ name: 'Castle-Pink' });
testMap.loadBuildingFile(buildingJsonString); // Re-build scene from file
```

> **💡 Backward Compatibility Note**: 
> The project maintains legacy exports for God Object `Blueprint3DTestMap`, internally delegating to `FloorplanDocument` and `ExportService` to ensure smooth migration of legacy code.
