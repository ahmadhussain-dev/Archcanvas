# Floorplan Editor Handler Modules (example/js)

This directory houses the UI event handlers, controllers, and rendering helper modules for the demo application.

---

## 📂 Module Descriptions

### 1. [AppEventBindings.js](AppEventBindings.js)
- **Role**: Global event bindings and UI button listener orchestrator.
- **Interfaces**:
  - `initAppEventBindings(context)`: Binds click, input, and mode change listeners for all top bar buttons, dropdown menus, view switchers, and side panel controls.

### 2. [BuildingPlacementController.js](BuildingPlacementController.js)
- **Role**: Structural building components (stairs, roofs, railings) placement and preview controller.
- **Interfaces**:
  - `initBuildingPlacementController(context)`: Manages placement state and dynamic 2D/3D previews for adding new stairs, roofs, and railings.

### 3. [Canvas3DController.js](Canvas3DController.js)
- **Role**: 3D viewport canvas event listener and view control bridge.
- **Interfaces**:
  - `initCanvas3DController(context)`: Registers mouse wheel, pointer click/drag, and touch gesture events for 3D camera controls and object picking.

### 4. [DesignController.js](DesignController.js)
- **Role**: Design mode and tool state controller.
- **Interfaces**:
  - `initDesignController(context)`: Coordinates switching between select mode, draw wall mode, erase mode, pan mode, paint mode, and eyedropper mode.

### 5. [DragHandler.js](DragHandler.js)
- **Role**: 2D floorplan drag-and-drop interaction processor.
- **Interfaces**:
  - Handles dragging room nodes, wall vertices, door/window openings, and furniture items in 2D view with real-time topology recalculation and grid snapping.

### 6. [FileManager.js](FileManager.js)
- **Role**: Project archiving, file imports/exports, and local storage manager.
- **Interfaces**:
  - `initFileManager(context)`: Binds open/save/export menu buttons (`btn-save`, `btn-open-local`, etc.).
  - `downloadBuildingFile()`: Exports and downloads building `.json` project archive.
  - `downloadDXFFile()`: Exports and downloads CAD DXF 2D floorplan drawing.
  - `download3MFFile()`: Exports and downloads 3D printing 3MF model package.
  - `loadBuildingFile(file)`: Asynchronously loads user-selected local project file.
  - `saveToLocalStorage()`: Saves current design to browser LocalStorage database.
  - `openLocalStorageList()`: Displays local saved projects modal list.

### 7. [FirstPersonController.js](FirstPersonController.js)
- **Role**: First-person WASD walk-through navigation controller.

### 8. [FloorManager.js](FloorManager.js)
- **Role**: Multi-floor management controller (add floor, delete floor, switch active floor).

### 9. [FurniturePlacementController.js](FurniturePlacementController.js)
- **Role**: Furniture library item dragging and placement controller.

### 10. [Hotkeys.js](Hotkeys.js)
- **Role**: Keyboard shortcuts processor.
- **Interfaces**:
  - `handleHotkeys(event, ctx)`: Handles keyboard events (WASD movement, arrow fine-tuning, PageUp/PageDown elevation, Delete key, Ctrl+Z/Y undo/redo).

### 11. [Icons.js](Icons.js)
- **Role**: Menu and button micro-SVG icon generator.
- **Interfaces**:
  - `iconSvg(name)`: Returns SVG markup string for specified icon name.

### 12. [MaterialManager.js](MaterialManager.js)
- **Role**: Material library UI renderer and painting tool handler.

### 13. [RailingPreview.js](RailingPreview.js)
- **Role**: Railing drawing preview helper.

### 14. [Render2D.js](Render2D.js)
- **Role**: 2D SVG floorplan rendering and coordinate conversion engine.

### 15. [SelectionManager.js](SelectionManager.js)
- **Role**: Entity selection and highlight manager.

### 16. [Store.js](Store.js)
- **Role**: Local persistence utilities and toast notifications.

### 17. [SvgEvents.js](SvgEvents.js)
- **Role**: 2D SVG viewport pointer and wheel event manager.

### 18. [TargetHandler.js](TargetHandler.js)
- **Role**: 2D/3D interaction target and context menu manager.

### 19. [UiControls.js](UiControls.js)
- **Role**: UI inspector panel control input synchronizer.

### 20. [ViewController.js](ViewController.js)
- **Role**: 2D/3D view mode and camera projection toggler.

### 21. [Viewer3D.js](Viewer3D.js)
- **Role**: Babylon.js 3D scene engine wrapper.

### 22. [Viewer3DHandles.js](Viewer3DHandles.js)
- **Role**: 3D edit gizmo handles manager.
