---
name: furniture-capture
description: Automated 3D furniture rendering thumbnail capture and image disk saving workflow.
---

# Automated 3D Furniture Thumbnail Capture Workflow

This skill provides a standard workflow and technical guide for generating and saving high-resolution preview thumbnails for all 3D furniture models in `blueprint3d-babylon`.

## Core Design Principles & Guidelines

1. **Non-Destructive Backup & Restoration**:
   Call `testMap.exportJSON()` to back up current scene data before capture, and call `testMap.loadJSON(backupJSON)` to restore original data upon completion.
2. **Individual Item Mounting**:
   Mount each furniture item individually via `entityManager.addItem` or `testMap.addItem`, selecting the item without gizmos.
3. **Camera Frustum & Clipping**:
   Adjust camera near clip plane (`camera.minZ = 0.005`) to prevent near plane clipping on miniature items.
4. **Rendering Delay**:
   Allow a `150ms` delay before taking screenshots to allow textures and shaders to warm up.
5. **Camera Perspective**:
   Default to isometric 3D view angles (`alpha: -1.047`, `beta: 1.1`, etc.).

---

## Execution Steps

### Step 1: Start Image Saver Server
Run the local image saver receiver script on port 3001:
```bash
node skills/furniture-capture/scripts/image_saver.js
```

### Step 2: Start Vite Dev Server
Run Vite dev server on port 3002:
```bash
npx vite --port 3002 --strictPort
```

### Step 3: Run Capture Script in Browser
1. Open DevTools (F12) Console at `http://localhost:3002/blueprint3d-babylon/example/`.
2. Copy and execute [browser_capture.js](scripts/browser_capture.js) in the Console.
3. Screenshots will be sent automatically to the `image_saver.js` server and saved to `src/furniture/image/`.
