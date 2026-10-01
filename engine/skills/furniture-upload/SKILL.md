---
name: furniture-upload-builder
description:  Item blueprint3d-babylon  Item "Custom >  ItemFurniture"  Item JavaScript Furniture Item。 ItemFurniture Item。
---

# Blueprint3D CustomFurniture Item

 Item `.js`  Item `.mjs`  Item。 ItemExport（default export） Item：

```js
export default function createFurniture({ boxComponent, cylinderComponent, sphereComponent, BABYLON }) {
  //  Furniture 。
}
```

##  Item

-  Item `type`、 Item `name`、 Item `defaultSize`、 Item `components`、`build`  Item， Item `thumbnail`  Item `unit`。
- `type`:  Item， Item、 Item。 Item `custom_`  Item（ Item：`custom_sofa`）。
- `thumbnail` ( Item):  Item。 Item URL， Item Base64 Data URL（ Item `data:image/png;base64,...`）， ItemFurniture Item。
- `unit` ( ):  。  `'m'`。  `'m'`， Furniture  `defaultSize`   `lightSource`  **  (meters)** 。 ， （ ） 。
- `defaultSize`:   `width` ( )、`depth` ( )、`height` ( )， **  (inches)**（  `unit: 'm'`  **  (meters)**）。
- `components`:  Item。 Item `id` ( Item)、 Item `label`  Item `defaultColor`。
  > [!IMPORTANT]
  > **2D   (`components[0]`)**:
  >   2D  ，  `components`  **  (`components[0]`)**  Furniture/  2D  。
  >  ，  `components: [...]`  ，** **（ / / 、 、 ）**  `components`   (`components[0]`)**， 、Earth、 、  `components[0]`。
- `build(registry, item, node, size)`:  Item Mesh  Item `parent`  Item `node`  Item。
-  Item `boxComponent`、`cylinderComponent`  Item `sphereComponent`； ItemFurniture Item、 Item。
-  Item `import`、 Item、 Item。 Item。
-  Item DOM、localStorage、cookies  Item。

##  Item

> [!IMPORTANT]
> **  ( )**: 
>  ，  `defaultSize`   **  (inches)**，  `build(registry, item, node, size)`   `size`   **  (meters)**。
> **【 】**:  Furniture ， Furniture  **`unit: 'm'`**。 ，  `defaultSize`   `lightSource`   `offset`   `range`   **  (meters)**， 。
>  ，  `build`   `size`   Babylon   **  (meters)**。

- **Babylon  **:   Y-up（Y  ） 。 Furniture  `y = 0`  。 ：  `H`  ，  Y   `H / 2`。
- ** **:   `size` ( )  ， Furniture ， 。

##  Item

### 1. `boxComponent(registry, item, definition, componentId, dimensions, transform, options)`
- `dimensions`: `{ width, height, depth }` ( Item： Item)
- `transform`: `{ position: { x, y, z }, rotation: { x, y, z } }` (Rotate `rotation`  Item)
- `options`: `{ parent: node }` ( Item， Item)

### 2. `cylinderComponent(registry, item, definition, componentId, dimensions, transform, options)`
- `dimensions`: `{ height, diameterTop, diameterBottom, tessellation }` ( Item： Item； Item， Item `diameter`  Item)
- `transform`: `{ position: { x, y, z }, rotation: { x, y, z } }`
- `options`: `{ parent: node }`

### 3. `sphereComponent(registry, item, definition, componentId, dimensions, transform, options)`
- `dimensions`: `{ diameter }`  Item `{ diameterX, diameterY, diameterZ }` ( Item： Item)
- `transform`: `{ position: { x, y, z }, rotation: { x, y, z } }`
- `options`: `{ parent: node }`
---

##  ItemFurniture Item

 Item、 ItemFurniture（ ItemLighting、 Item、Glass、 Item）， Item：

### 1.  Item/ Item (`placeType`)
- **`placeType: 'wall'`**:  Furniture（ 、 、 ） Room** ** 。
- **`placeType: 'ceiling'`**:  Furniture（ 、 、 ） Room** ** 。
- *(  `'floor'`)*

### 2. Lighting ItemEmissive Item (Lighting)
- **`lightSource`**:  。 Furniture Emissive， （  3D  ）：
  - `type`: `'point'` ( Item， Item)  Item `'spot'` ( Item)
  - `offset`: `{ x, y, z }` ( Furniture ，  `unit: 'm'`  ** **， ** **)
  - `color`:  Item HEX  Item（ Item `"#fffbe6"`）
  - `intensity`:  Item（ Item 0.8）
  - `range`:  （  `unit: 'm'`  ** **  3.8， ** **  150）
  - *(  spot  )*:   `direction` ( ，  `{ x: 0, y: -1, z: 0 }`  )、`angle` ( ，  `Math.PI / 3`)、`exponent` ( ，  2)。
- **`emissiveComponents`**: Emissive  ID  （  `['bulb', 'glow']`），  3D  Emissive （ ）。
- **`lightColorComponent`**:  Emissive  ID（  `'glow'`）， ，  `color`  。

### 3. Mirror Item (Mirror)
-  Furniture  **`isMirror: true`**。
-   `components`   `id`   `'mirror'`  ， Mirror 。 ** **， 。

### 4. Glass Item (Glass)
-   ID   `'glass'`（  `'cabinet_glass'`, `'wineglass'`  ）， ， ** Glass **。

### 5.  Item（ Item、 Item）
-   `build(registry, item, node, size)`   **`item.waterEnabled !== false`**  ， / 。

### 6.  ItemFurniture（ Item）
-   `build(registry, item, node, size)`   **`item.lidOpen === true`**  （Lid Mesh） Rotate (`rotation.x`)  ，  3D  。

---

##  Item ( Item)

 Item `interaction`  ItemFurniture Item：
- `type`:  Item `'sit'`
- `getInteractionPoints(size)`:  Item `size`  Item ( Item： Item)， Item `{ x, y, z, rot }`：

```js
interaction: {
  type: 'sit',
  getInteractionPoints(size) {
    const seatH = Math.max(0.12, size.height * 0.36);
    return [
      { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
      { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
    ];
  }
}
```

##  Item

1.  Item `definition`  Item， Item `build`  Item。
2.  Item， Item `definition`  Item。
3.  Item `componentId`  Item。 Item `componentId`； Item/ Item， Item ID。
4.  Item， Item `BABYLON`  Item， Item：

```js
mesh.parent = node;
mesh.metadata = {
  ...(mesh.metadata || {}),
  blueprintItemId: item.id,
  blueprintFurnitureComponentId: ' ItemID'
};
```

##  Item

-  Item ES module  Item， ItemExport Item。
- Export ItemFurniture `type`  ItemCustom Item。
- `components`  Item `id`， Item `build`  Item Mesh  Item。
-  Item（ Item Y=0  Item）， Item X  Item Z  Item（X=0, Z=0）。
-  Item `.js`  Item `.mjs`  Item。

 Item `custom-furniture-example.js`  Item， Item。

##  Item ( Item)

 Item、 Item JavaScript  Item。 Item、 Item：

```js
export default function createFurniture({ boxComponent }) {
  const definition = {
    type: 'custom_sofa',
    name: ' Item',
    thumbnail: '', // Custom  (  Base64 Data URL   URL， )
    defaultSize: { width: 84, depth: 36, height: 32 }, //  ， ： 
    components: [
      { id: 'seat', label: ' Item', defaultColor: '#ff9dbb' },
      { id: 'back', label: ' Item', defaultColor: '#f56f9f' },
      { id: 'arms', label: ' Item', defaultColor: '#f56f9f' },
      { id: 'legs', label: ' Item', defaultColor: '#b07a50' }
    ],
    interaction: {
      type: 'sit',
      getInteractionPoints(size) {
        //   size   (Meters)
        const seatH = Math.max(0.12, size.height * 0.36);
        return [
          { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
          { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
        ];
      }
    },
    build(registry, item, node, size) {
      //   size   (Meters)
      const seatH = Math.max(0.12, size.height * 0.36);
      
      // 1.  
      boxComponent(registry, item, definition, 'seat', {
        width: size.width, height: seatH, depth: size.depth
      }, { position: { x: 0, y: seatH / 2, z: 0 } }, { parent: node });

      // 2.  
      boxComponent(registry, item, definition, 'back', {
        width: size.width, height: size.height * 0.58, depth: Math.max(0.12, size.depth * 0.18)
      }, { position: { x: 0, y: size.height * 0.58, z: -size.depth * 0.41 } }, { parent: node });

      // 3.  
      [-1, 1].forEach((side) => {
        boxComponent(registry, item, definition, 'arms', {
          width: Math.max(0.12, size.width * 0.09), height: size.height * 0.52, depth: size.depth
        }, { position: { x: side * size.width * 0.455, y: size.height * 0.38, z: 0 } }, { parent: node });
      });

      // 4.   ( )
      [-1, 1].forEach((xSide) => {
        [-1, 1].forEach((zSide) => {
          boxComponent(registry, item, definition, 'legs', {
            width: 0.08, height: 0.16, depth: 0.08
          }, { position: { x: xSide * size.width * 0.36, y: 0.08, z: zSide * size.depth * 0.32 } }, { parent: node });
        });
      });
    }
  };

  return definition;
}
```
