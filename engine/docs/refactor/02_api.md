# Technical Architecture & API Refactoring Documentation (02_api.md)

The original architecture was not friendly towards "exporting as an API library". The issue was not "too many files", but rather "unclear boundaries + mixed responsibilities".

## Architectural Assessment

1. **God Object**: `src/presets/blueprintTestMap.js` became a classic God Object. It performed data normalization, floor management, wall/room/opening/stairs/railing CRUD, material processing, Babylon scene construction, selection state, and JSON/DXF/3MF exports. This naturally coupled the "library API" to a concrete implementation class.
2. **Implementation Leakage**: `example/app.js` directly imported internal `src` private modules and preset implementations instead of consuming public exports. The example was relying on internal library details, meaning any internal refactoring would break the demo.
3. **Mixed Export Bucket**: `src/index.js` was a mixed export bucket where core features, exporters, presets, runtime, and geometry tools were dumped together without a clear top-level abstraction.
4. **Editor Code vs. Library Boundaries**: `example/app.js` was being refactored, but focus was originally on splitting "editor UI code" rather than defining clean "library boundaries".

---

## Refactoring Direction

The goal was to straighten dependency directions into 4 distinct layers:

1. **domain**: Holds floorplan data models and pure business rules, with zero dependencies on Babylon.js (e.g., `FloorplanDocument`, wall/room/opening commands, validation, serialization).
2. **runtime**: Handles Babylon.js rendering exclusively. Input is a document; output is a scene node/tree. Does not manage editor state directly.
3. **editor**: Handles interactions, selections, dragging, side panels, and 2D/3D handles. Optional layer.
4. **api**: Exposes a stable facade to the outside world. External consumers receive APIs like `createDocument`, `createRenderer`, `exportBuildingFile`, rather than instantiating `Blueprint3DTestMap` directly.

---

## Recommended Migration Plan

### Phase 1: Consolidate Public API
* Created `src/api/index.js`.
* Enforced that `example` imports strictly from `src/index.js` (re-exporting from `src/api/index.js`) and `src/editor`, prohibiting direct imports of internal files (`src/core/*`, `src/presets/*`, `src/rooms/*`).
* `src/index.js` re-exports stable APIs only; presets become sample data.

### Phase 2: Decouple `Blueprint3DTestMap`
* **FloorplanDocument**: Manages floorplan state, normalization, CRUD, and floor switching.
* **BabylonSceneRenderer**: Manages build/rebuild, mesh lifecycles, and material applications.
* **SelectionController**: Manages selections, highlighting, and gizmo handles.
* **ExportService**: Manages building files / DXF / 3MF.
* **MaterialResolver**: Manages descriptor normalization and preview colors.

### Phase 3: Transform `example` into a True Consumer
* `example/app.js` orchestrates UI only, without directly manipulating low-level geometry/material/room shapes.
* `example/js/*` calls the library purely through the facade.
* This validates whether the library API is complete and developer-friendly.

### Phase 4: Package Splitting (Future Option)
* Split into `@blueprint3d/core`, `@blueprint3d/babylon-runtime`, `@blueprint3d/editor`.

API consumption pattern:
```javascript
const doc = createDocument(initialData);
doc.updateWall(id, patch);
doc.addOpening(...);

const renderer = createBabylonRenderer(scene);
renderer.mount(doc);
renderer.setCurrentFloor('floor_2');

const file = exportBuildingFile(doc);
```

---

## System Technical Architecture & Layered Design

After completing Phase 3, the system clearly separated data, rendering, interaction, and API responsibilities:

### 1. Core Library Layering (`src`)

*   **API Facade Layer (`src/api`, `src/index.js`)**:
    *   Single stable API facade for the entire library.
    *   Intercepts and exposes public APIs, hiding internal classes.
*   **Interaction Layer (`src/editor`)**:
    *   Provides `EditorFacade` controller for editor operations, encapsulating selection and highlight services (`SelectionController`).
*   **Read-Only Data Domain Model (`src/domain`)**:
    *   Pure floorplan data rules and model processing core (`FloorplanDocument`), managing floors/walls/rooms/items topology without relying on Babylon.js APIs.
*   **Runtime Rendering Layer (`src/runtime`)**:
    *   Focuses on Babylon.js 3D rendering (`BabylonSceneRenderer`), converting `FloorplanDocument` into 3D meshes, handling CSG cuts and dynamic reflections.
*   **File & Conversion Service Layer (`src/services`)**:
    *   Pure data conversion and byte stream processing service (`ExportService`), managing `b3dbuilding` format serialization/deserialization, CAD (DXF) generation, and 3MF binary blobs.

```
src/
├── api/                   # Public API facade export, managing stable public APIs
│   └── index.js           # Core aggregated export
├── domain/                # Floorplan data domain model (business rules, independent of Babylon)
│   ├── FloorplanDocument.js  # Core data model (Floorplan state, hierarchy, CRUD, floors)
│   └── MaterialResolver.js   # Material normalization and resolution service
├── runtime/               # Rendering logic layer (focused on Babylon.js rendering)
│   ├── BabylonSceneRenderer.js # 3D renderer generator (mesh lifecycle, CSG cuts, dynamic reflections)
│   └── PinkCastleGenerator.js  # Pink castle sample scene generator
├── editor/                # Editor interaction & controller layer
│   ├── EditorFacade.js    # Unified Consumer Facade (Core controller)
│   ├── SelectionController.js # Selection state and highlight controller
│   ├── DragHandler.js     # Drag interaction controller
│   └── Topology.js        # Topology geometry utilities
├── services/              # Data loading & exporter service
│   └── ExportService.js   # Engineering data serialization, deserialization, 3MF & DXF export
└── core/                  # Infrastructure & low-level converters (internal private directory)
```

> **🔒 Dependency Isolation Rules**:
> External integration components (`example/app.js` or third-party packages) are **strictly prohibited** from directly importing files under internal private directories `src/core/*`, `src/presets/*`, `src/rooms/*`, `src/furniture/*`, `src/geometry/*`.
> **All external dependencies MUST be destructured and imported from `src/index.js`.**

### 2. Demo Example Architecture (`example`)

The example project has been converted into a **true API consumer**:

```
example/
├── type/                  # JSDoc static type declaration layer (AppState JSDoc Type)
├── store/                 # Runtime state management layer (ui, selection, editor singleton Stores)
│   ├── index.js           
│   └── proxyHelper.js     # Runtime dynamic reflection state redirection helper
├── js/                    # Business logic handler layer (DragHandler, MaterialManager, TargetHandler, etc.)
└── app.js                 # Engine initialization, 3D main loop & orchestrator (Pure API Facade consumer)
```

*   **State & Logic Decoupling**: All UI states and selection states are stored in independent Stores. Handlers use `proxyHelper.js` for decoupled state reads and writes.
*   **Facade Consumption**: `app.js` no longer directly manipulates low-level geometry, orchestrating business logic entirely via the facade returned by `createEditor`.
