# Blueprint3D  Item (Building Architectural Catalog)

  `node skills/create-buildings/scripts/update-catalogs.mjs`  。  `blueprint3d-babylon`  ** **（ Room Shape  、 / / 、  Shape、  Subtype  、 / 、 、 / 、 Sky ） 。

---

## 1. Room Item (`rooms`)

### 1.1  Item Schema  Item
```json
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
```

### 1.2  Item 8  ItemRoom Shape  Item
 Item 8  ItemRoom Item：

| `shape`  Item |  Item |  Item ($W \times D$) |  Item |
| :--- | :--- | :--- | :--- |
| `square` | Square | $4\text{m} \times 4\text{m}$ |  Item Square Room。 |
| `l-shape` | L-Shape | $5\text{m} \times 5\text{m}$ | ** **：`edgeWidth` ( ), `edgeDepth` ( ) |
| `circle` | Circle | $4\text{m} \times 4\text{m}$ |  Item Circle Room。 |
| `octagon` | Octagon | $4\text{m} \times 4\text{m}$ |  Item Octagon Room。 |
| `diamond` | Diamond | $4\text{m} \times 4\text{m}$ |  Item Diamond Room。 |
| `sector` | Sector | $5\text{m} \times 5\text{m}$ | Loft  Item、 ItemBalcony Item |
| `semicircle` | Semicircle | $5\text{m} \times 3\text{m}$ |  Item、 ItemBalcony |
| `right-triangle` | Triangle | $5\text{m} \times 4\text{m}$ |  Item Triangle Room。 |

---

## 2.  Item/ Item/ Item (`walls`)

### 2.1  Item Schema  Item
```json
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
```

---

## 3.  Item (`openings`)

### 3.1  Item Schema  Item
```json
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
```

### 3.2  Item 8  Item Shape  Item

| `shape`  Item |  Item |  Item |
| :--- | :--- | :--- |
| `square` | Square |  Item、 Item、 Item、 Item。 |
| `diamond` | Diamond |  ItemDiamond Item。 |
| `circle` | Circle |  Item、 Item、 Item。 |
| `semicircle` |  ItemCircle |  Item ItemCircle Item。 |
| `round-arch` |  ItemSquare |  Item、 Item。 |
| `pointed-arch` |  ItemSquare |  Item、Landscape Item。 |
| `quarter-sector` | Sector |  ItemSector Item。 |
| `right-triangle` | Triangle |  ItemTriangle Item。 |

---

## 4.  Item (`stairs`)

### 4.1  Item Schema  Item
```json
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
```

### 4.2  Item 6  Item Subtype  Item

| `subtype`  Item |  Item |  Item |
| :--- | :--- | :--- |
| `straight` |  Item |  Item。 Item。 |
| `lshape` | L   | **Loft  **。<br>• `"cornerStep"`:  <br>• `"runBeforeCorner"`:  <br>• `"runAfterCorner"`:  <br>• `"mirrored"`: `true`/`false`  /  |
| `ushape` | U  Item |  Item。<br>• `"uSlotWidth"`:  Item<br>• `"uVoidLength"`:  Item |
| `spiral` |  ItemRotate Item |  Item。<br>• `"spiralDegrees"`: Rotate Item ( Item 360) |
| `curved` |  Item |  Item。<br>• `"spiralDegrees"`:  Item |
| `floating` |  Item |  Item/ Item。 |

---

## 5.  Item (`fences` & `fenceGates`)

### 5.1  Item (`fences`) Schema
```json
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
```

####  Item 7  Item Subtype  Item
- `"iron_ornamental"`:  Item（ Item/ Item）
- `"glass_rail"`:  / Glass （**  `_rail`  **，Loft 2F  Terrace ）
- `"picket_wood"`:  Item
- `"stone_masonry"`:  Item
- `"concrete"`:  Item
- `"wire_mesh"`:  Item/ Item
- `"bamboo"`:  Item

### 5.2  Item (`fenceGates`)  Item
`fenceGates` ** **  `fenceId`   `t` (0~1  )，  `from: [x1, z1]`   `to: [x2, z2]`。  `x, z`  。

---

## 6.  Item (`roofs`)

### 6.1  Item 7  Item Subtype  Item ( Item roofGeometry 1:1  Item)
- `"hip"`: Diamond （** ，  `hip`，  `hipped`**）
- `"dome"`:  Item /  Item /  Item
- `"gable"`:  （**  `gable`，  `gabled`**）
- `"shed"`:  （**  `shed`，  `monosloped`**）
- `"arch"`:  Item
- `"trapezoid"`:  Item
- `"flat"`:  Item /  Item

> ** **:   `"elevation"` (  `4.5`  )， ， 。

---

## 7.  ItemSky Item (`environment` & `skyboxEnabled`)

 Item：
```json
{
  "floors": [{ "id": "floor_1", "skyboxEnabled": true }],
  "environment": {
    "skyMaterial": { "id": "paint-oatmeal-yellow", "kind": "color", "category": "paint", "name": "Oatmeal Yellow", "color": "#dfd2bc" },
    "groundMaterial": { "id": "paint-oatmeal-yellow", "kind": "color", "category": "paint", "name": "Oatmeal Yellow", "color": "#dfd2bc" }
  }
}
```
