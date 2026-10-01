import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOM_SHAPES } from '../../../src/rooms/roomShapes.js';
import { OPENING_SHAPES } from '../../../src/openings/openingShapes.js';
import { FURNITURE_LIST } from '../../../src/furniture/index.js';
import { MATERIAL_CATEGORIES, DEFAULT_MATERIAL_PACKS } from '../../../src/core/materialCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const refDir = path.resolve(__dirname, '../references');

if (!fs.existsSync(refDir)) {
  fs.mkdirSync(refDir, { recursive: true });
}

// 1.   building-catalog.md
function generateBuildingCatalog() {
  const roomRows = ROOM_SHAPES.map((s) => {
    let note = ` Item ${s.label} Room。`;
    if (s.id === 'l-shape') note = '** **：`edgeWidth` ( ), `edgeDepth` ( )';
    else if (s.id === 'sector') note = 'Loft  Item、 ItemBalcony Item';
    else if (s.id === 'semicircle') note = ' Item、 ItemBalcony';
    return `| \`${s.id}\` | ${s.label} | $${s.defaultWidth}\\text{m} \\times ${s.defaultDepth}\\text{m}$ | ${note} |`;
  }).join('\n');

  const openingRows = OPENING_SHAPES.map((s) => {
    let note = ` Item${s.label} Item。`;
    if (s.id === 'square') note = ' Item、 Item、 Item、 Item。';
    else if (s.id === 'round-arch') note = ' Item、 Item。';
    else if (s.id === 'pointed-arch') note = ' Item、Landscape Item。';
    else if (s.id === 'circle') note = ' Item、 Item、 Item。';
    return `| \`${s.id}\` | ${s.label} | ${note} |`;
  }).join('\n');

  return `# Blueprint3D  Item (Building Architectural Catalog)

  \`node skills/create-buildings/scripts/update-catalogs.mjs\`  。  \`blueprint3d-babylon\`  ** **（ Room Shape  、 / / 、  Shape、  Subtype  、 / 、 、 / 、 Sky ） 。

---

## 1. Room Item (\`rooms\`)

### 1.1  Item Schema  Item
\`\`\`json
{
  "id": "room_living",
  "name": "Living Room",
  "floorId": "floor_1",
  "shape": "square",
  "x": 0,
  "z": 0,
  "width": 5.0,
  "depth": 4.0,
  "rotation": 0,
  "elevation": 0,
  "material": {
    "id": "derived_texture_wood-plank-oak-light",
    "kind": "texture",
    "category": "wood",
    "name": " Item",
    "color": "#f9e9d2"
  },
  "wallIds": {
    "north": "wall_1",
    "east": "wall_2",
    "south": "wall_3",
    "west": "wall_4"
  }
}
\`\`\`

### 1.2  Item ${ROOM_SHAPES.length}  ItemRoom Shape  Item
 Item ${ROOM_SHAPES.length}  ItemRoom Item：

| \`shape\`  Item |  Item |  Item ($W \\times D$) |  Item |
| :--- | :--- | :--- | :--- |
${roomRows}

---

## 2.  Item/ Item/ Item (\`walls\`)

### 2.1  Item Schema  Item
\`\`\`json
{
  "id": "wall_1f_bathroom_west",
  "floorId": "floor_1",
  "from": [-2.0, -3.0],
  "to": [-2.0, -1.0],
  "thickness": 0.18,
  "height": 4.5,
  "materialFront": "#ffffff",
  "materialBack": "#e8dfd1",
  "baseboardEnabled": true,
  "baseboardHeight": 0.1,
  "baseboardMaterial": "#8c6c50",
  "wainscotEnabled": true,
  "wainscotHeight": 2.0,
  "wainscotMaterialFront": {
    "id": "derived_texture_brick-mosaic",
    "kind": "texture",
    "category": "brick",
    "name": " Item",
    "color": "#ffffff"
  },
  "wainscotMaterialBack": "#e8dfd1"
}
\`\`\`

---

## 3.  Item (\`openings\`)

### 3.1  Item Schema  Item
\`\`\`json
{
  "id": "opening_window_living",
  "type": "window",
  "shape": "square",
  "floorId": "floor_1",
  "wallId": "wall_1f_east",
  "t": 0.5,
  "width": 1.8,
  "height": 1.5,
  "sillHeight": 0.9,
  "frameMaterial": "#333333",
  "glassMaterial": "#aaccff",
  "panelMaterial": "#ffffff",
  "isOpen": false,
  "panelHidden": false,
  "glassHidden": false
}
\`\`\`

### 3.2  Item ${OPENING_SHAPES.length}  Item Shape  Item

| \`shape\`  Item |  Item |  Item |
| :--- | :--- | :--- |
${openingRows}

---

## 4.  Item (\`stairs\`)

### 4.1  Item Schema  Item
\`\`\`json
{
  "id": "stair_1f_to_2f",
  "floorId": "floor_1",
  "subtype": "lshape",
  "x": -2.5,
  "z": 0.5,
  "width": 1.0,
  "depth": 3.0,
  "height": 2.2,
  "steps": 14,
  "rotation": 4.7124,
  "mirrored": true,
  "cornerStep": 8,
  "runBeforeCorner": 2,
  "runAfterCorner": 1,
  "treadMaterial": "#8c6c50",
  "riserMaterial": "#ffffff",
  "stringerMaterial": "#333333",
  "handrailMaterial": "#333333"
}
\`\`\`

### 4.2  Item 6  Item Subtype  Item

| \`subtype\`  Item |  Item |  Item |
| :--- | :--- | :--- |
| \`straight\` |  Item |  Item。 Item。 |
| \`lshape\` | L   | **Loft  **。<br>• \`"cornerStep"\`:  <br>• \`"runBeforeCorner"\`:  <br>• \`"runAfterCorner"\`:  <br>• \`"mirrored"\`: \`true\`/\`false\`  /  |
| \`ushape\` | U  Item |  Item。<br>• \`"uSlotWidth"\`:  Item<br>• \`"uVoidLength"\`:  Item |
| \`spiral\` |  ItemRotate Item |  Item。<br>• \`"spiralDegrees"\`: Rotate Item ( Item 360) |
| \`curved\` |  Item |  Item。<br>• \`"spiralDegrees"\`:  Item |
| \`floating\` |  Item |  Item/ Item。 |

---

## 5.  Item (\`fences\` & \`fenceGates\`)

### 5.1  Item (\`fences\`) Schema
\`\`\`json
{
  "id": "fence_2f_loft_guard",
  "floorId": "floor_2",
  "subtype": "glass",
  "from": [-2.0, 0.0],
  "to": [2.0, 0.0],
  "height": 0.9,
  "thickness": 0.05,
  "frameMaterial": "#333333",
  "panelMaterial": "#aaccff"
}
\`\`\`

####  Item 7  Item Subtype  Item
- \`"iron_ornamental"\`:  Item（ Item/ Item）
- \`"glass_rail"\`:  / Glass （**  \`_rail\`  **，Loft 2F  Terrace ）
- \`"picket_wood"\`:  Item
- \`"stone_masonry"\`:  Item
- \`"concrete"\`:  Item
- \`"wire_mesh"\`:  Item/ Item
- \`"bamboo"\`:  Item

### 5.2  Item (\`fenceGates\`)  Item
\`fenceGates\` ** **  \`fenceId\`   \`t\` (0~1  )，  \`from: [x1, z1]\`   \`to: [x2, z2]\`。  \`x, z\`  。

---

## 6.  Item (\`roofs\`)

### 6.1  Item 7  Item Subtype  Item ( Item roofGeometry 1:1  Item)
- \`"hip"\`: Diamond （** ，  \`hip\`，  \`hipped\`**）
- \`"dome"\`:  Item /  Item /  Item
- \`"gable"\`:  （**  \`gable\`，  \`gabled\`**）
- \`"shed"\`:  （**  \`shed\`，  \`monosloped\`**）
- \`"arch"\`:  Item
- \`"trapezoid"\`:  Item
- \`"flat"\`:  Item /  Item

> ** **:   \`"elevation"\` (  \`4.5\`  )， ， 。

---

## 7.  ItemSky Item (\`environment\` & \`skyboxEnabled\`)

 Item：
\`\`\`json
{
  "floors": [{ "id": "floor_1", "skyboxEnabled": true }],
  "environment": {
    "skyMaterial": { "id": "paint-oatmeal-yellow", "kind": "color", "category": "paint", "name": "Oatmeal Yellow", "color": "#dfd2bc" },
    "groundMaterial": { "id": "paint-oatmeal-yellow", "kind": "color", "category": "paint", "name": "Oatmeal Yellow", "color": "#dfd2bc" }
  }
}
\`\`\`
`;
}

// 2.   furniture-catalog.md
function generateFurnitureCatalog() {
  const categoryNames = {
    seating: ' Item',
    tables: ' Item',
    storage: ' Item',
    bedroom: ' Item',
    makeup: ' Item',
    kitchen: ' ItemKitchen',
    bathroom: ' Item',
    structures: ' Item',
    curtains: ' Item',
    rugs: ' Item',
    decor: ' Item、 Item',
    plants: ' Item',
    flora: ' Item',
    landscape: ' ItemLandscape Item',
    outdoor: 'Outdoor Item',
    lighting: 'Lighting Item',
    clothing: 'Clothing Item',
    custom: 'Custom Item'
  };

  const categorized = {};
  FURNITURE_LIST.forEach((item) => {
    const cat = item.category || 'other';
    categorized[cat] = categorized[cat] || [];
    categorized[cat].push(item);
  });

  let content = `# Blueprint3D  ItemFurniture Item (Full Furniture Catalog)

  \`node skills/create-buildings/scripts/update-catalogs.mjs\`  。  **100%   (${FURNITURE_LIST.length}  ) Furniture **。

---
`;

  let sectionIdx = 1;
  for (const [catId, list] of Object.entries(categorized)) {
    const title = categoryNames[catId] || catId;
    content += `\n## ${sectionIdx}. ${title} (\`${catId}\` -  Item ${list.length}  Item)\n\n`;
    content += `| \`type\`  Item |  Item |  Item ($W \\times D \\times H$,  Item:  Item) |\n`;
    content += `| :--- | :--- | :--- |\n`;

    list.forEach((item) => {
      const w = item.width ? Number(item.width).toFixed(2) : '-';
      const d = item.depth ? Number(item.depth).toFixed(2) : '-';
      const h = item.height ? Number(item.height).toFixed(2) : '-';
      const dimStr = (w !== '-' && d !== '-' && h !== '-') ? `$${w} \\times ${d} \\times ${h}$` : ' Item/ Item';
      content += `| \`${item.type}\` | ${item.name || item.type} | ${dimStr} |\n`;
    });

    sectionIdx += 1;
  }

  return content;
}

// 3.   material-catalog.md
function generateMaterialCatalog() {
  const catMap = {};
  MATERIAL_CATEGORIES.forEach((c) => {
    catMap[c.id] = c.label;
  });

  const categorized = {};
  DEFAULT_MATERIAL_PACKS.forEach((m) => {
    const cat = m.category || 'paint';
    categorized[cat] = categorized[cat] || [];
    categorized[cat].push(m);
  });

  let content = `# Blueprint3D  Item (Full Material Catalog)

  \`node skills/create-buildings/scripts/update-catalogs.mjs\`  。 Export  **100%   (${DEFAULT_MATERIAL_PACKS.length}  )  、 **。

---

## 1.  Item (\`categories\` -  Item ${MATERIAL_CATEGORIES.length}  Item)

|  Item ID (\`category\`) |  Item |
| :--- | :--- |
`;

  MATERIAL_CATEGORIES.forEach((c) => {
    content += `| \`${c.id}\` | ${c.label} |\n`;
  });

  content += `\n---\n\n## 2.  Item\n`;

  let sectionIdx = 1;
  for (const [catId, list] of Object.entries(categorized)) {
    const title = catMap[catId] || catId;
    content += `\n### 2.${sectionIdx} ${title} (\`${catId}\` -  Item ${list.length}  Item)\n\n`;
    content += `| \`id\`  Item |  Item |  Item (\`kind\`) |  Item /  Item |\n`;
    content += `| :--- | :--- | :--- | :--- |\n`;

    list.forEach((m) => {
      const kind = m.kind || 'color';
      const col = m.color || '-';
      content += `| \`${m.id}\` | ${m.name || m.id} | \`${kind}\` | \`${col}\` |\n`;
    });

    sectionIdx += 1;
  }

  return content;
}

const bPath = path.join(refDir, 'building-catalog.md');
const fPath = path.join(refDir, 'furniture-catalog.md');
const mPath = path.join(refDir, 'material-catalog.md');

fs.writeFileSync(bPath, generateBuildingCatalog(), 'utf8');
console.log(`✓ Updated ${bPath}`);

fs.writeFileSync(fPath, generateFurnitureCatalog(), 'utf8');
console.log(`✓ Updated ${fPath} (${FURNITURE_LIST.length} items)`);

fs.writeFileSync(mPath, generateMaterialCatalog(), 'utf8');
console.log(`✓ Updated ${mPath} (${DEFAULT_MATERIAL_PACKS.length} materials)`);
