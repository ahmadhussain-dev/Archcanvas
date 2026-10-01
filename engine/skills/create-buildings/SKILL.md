---
name: create-buildings
description: Generate, validate, and explain Blueprint3D Babylon building JSON (`.b3dbuilding.json`), covering floor elevations, room/wall/opening/furniture references, Loft double-height spaces, stair landings, material catalogs, and furniture orientations. Use when an external model must directly generate a compatible building file, or when converting a floorplan image/design, repairing a building file, or validating its structure and geometry.
---

# Blueprint3D 3D Building JSON Generation & Validation Guide

This skill guides agents in converting single-floor, Loft, or multi-story floorplans into valid `.b3dbuilding.json` files conforming to format `blueprint3d-babylon.building.v1`.

## Scope & Execution Sequence

1. Read the core rules in this document first, then refer to reference files under `references/` for building, furniture, or material catalogs.
2. Use `createBuildingFile` / `stringifyBuildingFile` format definitions.
3. Validate floor ID, wall ID, room ID, opening references, and furniture bounds.
4. Run validation via script: `node skills/create-buildings/scripts/validate-building.mjs <file> --strict`.

---

## 1. External Catalog References

- 🏠 **Loft Example**: Refer to [loft-building-example.b3dbuilding.json](../../example/downloads/loft-building-example.b3dbuilding.json).
- 🌐 **Repository Entrypoint**: [GitHub Repository](https://github.com/Sunflower613/blueprint3d-babylon), `src/core/buildingFile.js`, and reference [minimal-building.b3dbuilding.json](references/minimal-building.b3dbuilding.json).
- 🏛️ **Architectural Catalog**: [building-catalog.md](references/building-catalog.md) contains room shapes, wall materials, door/window shapes, stair types, railings, and skyboxes.
- 🪑 **Furniture Catalog**: [furniture-catalog.md](references/furniture-catalog.md) contains 100% of registered furniture `type` keys across categories (seating, tables, storage, bedroom, kitchen, outdoor, etc.).
- 🎨 **Material Catalog**: [material-catalog.md](references/material-catalog.md) contains 100% of material IDs (paint, wood, stone, wallpaper, fabric, glass, mirror, emissive).
- 💻 **Updating Catalogs**: Run `npm run update-catalogs` to regenerate reference documentation.

---

## 2. Core JSON Schema Specification

```json
{
  "format": "blueprint3d-babylon.building.v1",
  "version": 1,
  "name": "Sample Building",
  "unit": "m",
  "currentFloorId": "floor_1",
  "floors": [
    {
      "id": "floor_1",
      "name": "1F",
      "level": 0,
      "elevation": 0.0,
      "wallHeight": 2.8,
      "floorHeight": 0.18
    }
  ]
}
```
