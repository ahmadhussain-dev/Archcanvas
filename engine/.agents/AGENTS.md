# Project Architecture Rules

This workspace (blueprint3d-babylon) has completed the Phase 1 modular refactoring (consolidating the public API facade), establishing the following architecture and dependency isolation rules:

## 1. Dependency Isolation Rules
* **Public Facade Export**: `src/index.js` (re-exported from `src/api/index.js`) is the single stable API facade for the entire library.
* **Unauthorized Access Restriction**: `example/app.js` or any external integration component is strictly prohibited from directly using `import` to reference files under internal private directories such as `src/core/*`, `src/presets/*`, `src/rooms/*`, `src/furniture/*`, `src/geometry/*`.
* **All external dependency imports must be destructured and imported from `src/index.js`.**

## 2. API Layering & Refactoring Direction
* **api layer (Facade)**: Manages public exported API stability, serving as a unified facade for external integration systems.
* **domain layer (Data) / runtime layer (Rendering) / editor layer (Interaction)**: Belong to private implementation details of the library. Their files are physically isolated in internal private directories and must not be exposed for direct external import.
