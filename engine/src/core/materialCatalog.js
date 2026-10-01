// =============================================================================
// 1. Texture Resource Imports
// =============================================================================

// Wood Textures
const woodPanelMouldingLightUrl = new URL('../textures/wood_panel_moulding_light.jpg', import.meta.url).href;
const woodFlutedOakLightUrl = new URL('../textures/wood_fluted_oak_light.jpg', import.meta.url).href;
const woodHerringboneOakLightUrl = new URL('../textures/wood_herringbone_oak_light.jpg', import.meta.url).href;
const woodPlankOakLightUrl = new URL('../textures/wood_plank_oak_light.jpg', import.meta.url).href;
const woodOakNaturalLightUrl = new URL('../textures/wood_oak_natural_light.jpg', import.meta.url).href;
const woodButcherBlockLightUrl = new URL('../textures/wood_butcher_block_light.jpg', import.meta.url).href;
const woodBasketParquetLightUrl = new URL('../textures/wood_basket_parquet_light.jpg', import.meta.url).href;
const woodChevronOakLightUrl = new URL('../textures/wood_chevron_oak_light.jpg', import.meta.url).href;
const woodDiagonalPlankLightUrl = new URL('../textures/wood_diagonal_plank_light.jpg', import.meta.url).href;

// Brick & Tile Textures
const brickMarbleWarmUrl = new URL('../textures/brick_marble_warm.jpg', import.meta.url).href;
const brickMarbleGreyGlossUrl = new URL('../textures/brick_marble_grey_gloss.jpg', import.meta.url).href;
const brickMarbleTilesUrl = new URL('../textures/brick_marble_tiles.jpg', import.meta.url).href;
const brickLightUrl = new URL('../textures/brick_light.jpg', import.meta.url).href;
const brickRedUrl = new URL('../textures/brick_red.jpg', import.meta.url).href;
const brickCubeUrl = new URL('../textures/brick_cube.jpg', import.meta.url).href;
const brickDiamondUrl = new URL('../textures/brick_diamond.jpg', import.meta.url).href;
const brickSquareUrl = new URL('../textures/brick_square.jpg', import.meta.url).href;
const brickStoneUrl = new URL('../textures/brick_stone.jpg', import.meta.url).href;
const brickMosaicUrl = new URL('../textures/brick_mosaic.jpg', import.meta.url).href;
const brickBlackWhiteUrl = new URL('../textures/brick_black_white.jpg', import.meta.url).href;
const brickSmallBlackUrl = new URL('../textures/brick_small_black.png', import.meta.url).href;

// Stone & Ground Textures
const stoneGrassUrl = new URL('../textures/stone_grass.jpg', import.meta.url).href;
const stoneEarthUrl = new URL('../textures/stone_earth.jpg', import.meta.url).href;
const stoneSandUrl = new URL('../textures/stone_sand.jpg', import.meta.url).href;
const stoneSandStoneUrl = new URL('../textures/stone_sand_stone.jpg', import.meta.url).href;
const stoneFineSandUrl = new URL('../textures/stone_fine_sand.jpg', import.meta.url).href;
const stoneNaturalUrl = new URL('../textures/stone.jpg', import.meta.url).href;
const stoneJointUrl = new URL('../textures/stone_joint.jpg', import.meta.url).href;
const stoneRoadUrl = new URL('../textures/stone_road.jpg', import.meta.url).href;
const stoneRockUrl = new URL('../textures/stone_rock.jpg', import.meta.url).href;
const stoneTerrazzoUrl = new URL('../textures/stone_terrazzo.jpg', import.meta.url).href;
const stoneWhiteSandUrl = new URL('../textures/stone_white_sand.jpg', import.meta.url).href;

// Fabric & Rug Textures
const fabricRopeCableBeigeUrl = new URL('../textures/fabric_rope_cable_beige.jpg', import.meta.url).href;
const fabricKnitCableGreyUrl = new URL('../textures/fabric_knit_cable_grey.jpg', import.meta.url).href;
const fabricKnitCableWhiteUrl = new URL('../textures/fabric_knit_cable_white.jpg', import.meta.url).href;
const fabricKnitChevronCreamUrl = new URL('../textures/fabric_knit_chevron_cream.jpg', import.meta.url).href;
const fabricWeaveDarkUrl = new URL('../textures/fabric_weave_dark.jpg', import.meta.url).href;
const fabricOrganzaWhiteUrl = new URL('../textures/fabric_organza_white.jpg', import.meta.url).href;
const fabricRugGeometricUrl = new URL('../textures/fabric_rug_geometric.jpg', import.meta.url).href;
const fabricFoamPanelUrl = new URL('../textures/fabric_foam_panel.jpg', import.meta.url).href;
const fabricLongPileUrl = new URL('../textures/fabric_long_pile.jpg', import.meta.url).href;
const fabricFlowerUrl = new URL('../textures/fabric_flower.jpg', import.meta.url).href;
const fabricSquareUrl = new URL('../textures/fabric_square.jpg', import.meta.url).href;
const fabricCircleUrl = new URL('../textures/fabric_circle.jpg', import.meta.url).href;
const fabricTriangleUrl = new URL('../textures/fabric_triangle.jpg', import.meta.url).href;

// Wallpaper & Poster Textures
const wallpaperRoseUrl = new URL('../textures/wallpaper_rose.jpg', import.meta.url).href;
const wallmapYellowUrl = new URL('../textures/wallmap_yellow.jpg', import.meta.url).href;
const wallpaperLeafBluegreyUrl = new URL('../textures/wallpaper_leaf_bluegrey.jpg', import.meta.url).href;
const wallpaperPaisleyOrangeUrl = new URL('../textures/wallpaper_paisley_orange.jpg', import.meta.url).href;
const wallpaperFanGoldUrl = new URL('../textures/wallpaper_fan_gold.jpg', import.meta.url).href;
const wallpaperStripeTealPinkUrl = new URL('../textures/wallpaper_stripe_teal_pink.jpg', import.meta.url).href;
const wallpaperDamaskOliveUrl = new URL('../textures/wallpaper_damask_olive.jpg', import.meta.url).href;
const wallpaperInkBambooMistUrl = new URL('../textures/wallpaper_ink_bamboo_mist.jpg', import.meta.url).href;
const wallpaperCloudNavyGoldUrl = new URL('../textures/wallpaper_cloud_navy_gold.jpg', import.meta.url).href;
const wallpaperRuyiSwirlYellowUrl = new URL('../textures/wallpaper_ruyi_swirl_yellow.jpg', import.meta.url).href;
const wallpaperFloralBlueWhiteUrl = new URL('../textures/wallpaper_floral_blue_white.jpg', import.meta.url).href;
const wallpaperSeigaihaBlushUrl = new URL('../textures/wallpaper_seigaiha_blush.jpg', import.meta.url).href;
const posterAbstractArchesUrl = new URL('../textures/poster_abstract_arches.jpg', import.meta.url).href;
const posterBotanicalSageUrl = new URL('../textures/poster_botanical_sage.jpg', import.meta.url).href;
const posterBauhausPrimaryUrl = new URL('../textures/poster_bauhaus_primary.jpg', import.meta.url).href;
const posterMountainSunriseUrl = new URL('../textures/poster_mountain_sunrise.jpg', import.meta.url).href;
const posterCelestialMoonsUrl = new URL('../textures/poster_celestial_moons.jpg', import.meta.url).href;

// Sky Textures
const skyUrl = new URL('../textures/sky.png', import.meta.url).href;
const skyStarryUrl = new URL('../textures/sky_starry.png', import.meta.url).href;
const skySunsetUrl = new URL('../textures/sky_sunset.png', import.meta.url).href;
const skyAuroraUrl = new URL('../textures/sky_aurora.png', import.meta.url).href;
const skyUnderwaterUrl = new URL('../textures/sky_underwater.jpg', import.meta.url).href;
const skyDesertUrl = new URL('../textures/sky_desert.jpg', import.meta.url).href;
const skyKarstUrl = new URL('../textures/sky_karst.jpg', import.meta.url).href;
const skyForestUrl = new URL('../textures/sky_forest.jpg', import.meta.url).href;
const skyCandyUrl = new URL('../textures/sky_candy.jpg', import.meta.url).href;
const skyFantasyUrl = new URL('../textures/sky_fantasy.jpg', import.meta.url).href;
const skyIceUrl = new URL('../textures/sky_ice.jpg', import.meta.url).href;
const skyBlossomUrl = new URL('../textures/sky_blossom.jpg', import.meta.url).href;
const skyVolcanoUrl = new URL('../textures/sky_volcano.jpg', import.meta.url).href;
const skyInkMountainsUrl = new URL('../textures/sky_ink-mountains.jpg', import.meta.url).href;

// Emissive Textures
const hackerStreamUrl = new URL('../textures/emissive_hacker_stream.jpg', import.meta.url).href;
const danceFloorUrl = new URL('../textures/emissive_dance_floor.jpg', import.meta.url).href;
const fireplaceFlameUrl = new URL('../textures/emissive_fire.jpg', import.meta.url).href;
const neonSignUrl = new URL('../textures/emissive_neon_sign.jpg', import.meta.url).href;
const cyberNoEntryUrl = new URL('../textures/emissive_cyber_no_entry.png', import.meta.url).href;
const robotSmileUrl = new URL('../textures/emissive_robot.jpg', import.meta.url).href;

// =============================================================================
// 2. Material Categories
// =============================================================================

export const MATERIAL_CATEGORIES = [
  { id: 'custom', label: 'Custom', icon: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' },
  { id: 'wood', label: 'Wood', icon: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18"/><path d="M14 3v9"/><path d="M8 12v9"/>' },
  { id: 'stone', label: 'Stone', icon: '<path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/><path d="M11.99 22 14 12l7.822 3.184"/><path d="M14 12 8.47 2.302"/>' },
  { id: 'brick', label: 'Brick', icon: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v6"/><path d="M15 3v6"/><path d="M6 9v6"/><path d="M12 9v6"/><path d="M18 9v6"/><path d="M9 15v6"/><path d="M15 15v6"/>' },
  { id: 'metal', label: 'Metal', icon: '<path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z"/>' },
  { id: 'mirror', label: 'Mirror', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 7 10 10"/><path d="M7 12h4"/><path d="M12 7v4"/>' },
  { id: 'glass', label: 'Glass', icon: '<path d="M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22Z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/>' },
  { id: 'wallpaper', label: 'Wallpaper', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 3v5h5"/>' },
  { id: 'fabric', label: 'Fabric', icon: '<path d="M20.38 3.46 16 7.5V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3.5L3.62 3.46c-.9-.85-2.38-.22-2.38 1v14c0 1.1.9 2 2 2h17.5c1.1 0 2-.9 2-2v-14c0-1.22-1.48-1.85-2.38-1Z"/>' },
  { id: 'paint', label: 'Paint', icon: '<path d="M12 22c5.523 0 10-2.239 10-5 0-2.761-4.477-5-10-5S2 14.239 2 17c0 2.761 4.477 5 10 5Z"/><path d="M12 12V2"/><path d="M8 2h8"/>' },
  { id: 'sky', label: 'Sky', icon: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4a12 12 0 0 1 0 16"/><path d="M12 4a12 12 0 0 0 0 16"/>' },
  { id: 'emissive', label: 'Emissive', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' }
];

// =============================================================================
// 3. Category Presets
// =============================================================================

// Paint
const COMMON_PAINT_MATERIALS = [
  { id: 'paint-soft-white', name: 'Soft White', category: 'paint', color: '#f9fbff' },
  { id: 'paint-pink', name: 'Castle Pink', category: 'paint', color: '#ffd1e3' },
  { id: 'paint-minimalist-black', name: 'Minimalist Black', category: 'paint', color: '#2c2c2c' },
  { id: 'paint-pure-white', name: 'Pure White', category: 'paint', color: '#ffffff' },
  { id: 'paint-dusty-pink', name: 'Dusty Pink', category: 'paint', color: '#d5b2b2' },
  { id: 'paint-haze-blue', name: 'Haze Blue', category: 'paint', color: '#8ba3b5' },
  { id: 'paint-sage-green', name: 'Sage Green', category: 'paint', color: '#a1a89c' },
  { id: 'paint-oatmeal-yellow', name: 'Oatmeal Yellow', category: 'paint', color: '#dfd2bc' },
  { id: 'paint-clay-purple', name: 'Clay Purple', category: 'paint', color: '#b1a6b0' },
  { id: 'paint-camel', name: 'Camel', category: 'paint', color: '#bfa38a' },
  { id: 'paint-warm-sand', name: 'Warm Sand Grey', category: 'paint', color: '#cbd0cc' },
  { id: 'paint-terracotta', name: 'Terracotta', category: 'paint', color: '#b56b61' },
  { id: 'paint-classic-grey', name: 'Classic Grey', category: 'paint', color: '#9aa3a6' },
  { id: 'paint-morandi-green', name: 'Morandi Green', category: 'paint', color: '#b5c4b1' },
  { id: 'paint-morandi-blue', name: 'Morandi Blue', category: 'paint', color: '#8e9fa9' },
  { id: 'paint-morandi-orange', name: 'Morandi Orange', category: 'paint', color: '#cda393' },
  { id: 'paint-morandi-purple', name: 'Morandi Purple', category: 'paint', color: '#ac9da6' }
];

// Sky
const COMMON_SKY_MATERIALS = [
  { id: 'sky_texture', name: 'Sunny', category: 'sky', kind: 'texture', src: skyUrl, scale: 1, color: '#ffffff', skyLightColor: '#d9ecff' },
  { id: 'sky-starry', name: 'Starry Sky', category: 'sky', kind: 'texture', src: skyStarryUrl, scale: 1, color: '#ffffff', skyLightColor: '#7088c4' },
  { id: 'sky-sunset', name: 'Sunset', category: 'sky', kind: 'texture', src: skySunsetUrl, scale: 1, color: '#ffffff', skyLightColor: '#ffb090' },
  { id: 'sky-aurora', name: 'Aurora', category: 'sky', kind: 'texture', src: skyAuroraUrl, scale: 1, color: '#ffffff', skyLightColor: '#79d8d0' },
  { id: 'sky-underwater', name: 'Underwater', category: 'sky', kind: 'texture', src: skyUnderwaterUrl, scale: 1, color: '#ffffff', skyLightColor: '#5fb6d6' },
  { id: 'sky-desert', name: 'Desert Sunset', category: 'sky', kind: 'texture', src: skyDesertUrl, scale: 1, color: '#ffffff', skyLightColor: '#f0a05e' },
  { id: 'sky-karst', name: 'Karst Landscape', category: 'sky', kind: 'texture', src: skyKarstUrl, scale: 1, color: '#ffffff', skyLightColor: '#a8c9b5' },
  { id: 'sky-forest', name: 'Magic Forest', category: 'sky', kind: 'texture', src: skyForestUrl, scale: 1, color: '#ffffff', skyLightColor: '#8fca9b' },
  { id: 'sky-candy', name: 'Candy World', category: 'sky', kind: 'texture', src: skyCandyUrl, scale: 1, color: '#ffffff', skyLightColor: '#f2b8d8' },
  { id: 'sky-fantasy', name: 'Purple Fantasy', category: 'sky', kind: 'texture', src: skyFantasyUrl, scale: 1, color: '#ffffff', skyLightColor: '#9b70d0' },
  { id: 'sky-ice', name: 'Polar Ice', category: 'sky', kind: 'texture', src: skyIceUrl, scale: 1, color: '#ffffff', skyLightColor: '#b9d8f0' },
  { id: 'sky-blossom', name: 'Blossom Valley', category: 'sky', kind: 'texture', src: skyBlossomUrl, scale: 1, color: '#ffffff', skyLightColor: '#efb8c8' },
  { id: 'sky-volcano', name: 'Lava Volcano', category: 'sky', kind: 'texture', src: skyVolcanoUrl, scale: 1, color: '#ffffff', skyLightColor: '#d4774c' },
  { id: 'sky-ink-mountains', name: 'Ink Mountains', category: 'sky', kind: 'texture', src: skyInkMountainsUrl, scale: 1, color: '#ffffff', skyLightColor: '#b6b27f' }
];

// Wood
const COMMON_WOOD_MATERIALS = [
  { id: 'wood-panel-moulding-light', name: 'Wall Panel Moulding', src: woodPanelMouldingLightUrl, scale: 1, color: '#ffffff' },
  { id: 'wood-fluted-oak-light', name: 'Fluted Oak', src: woodFlutedOakLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-herringbone-oak-light', name: 'Herringbone Parquet', src: woodHerringboneOakLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-plank-oak-light', name: 'Oak Plank', src: woodPlankOakLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-oak-natural-light', name: 'Natural Oak', src: woodOakNaturalLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-butcher-block-light', name: 'Butcher Block', src: woodButcherBlockLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-basket-parquet-light', name: 'Basket Parquet', src: woodBasketParquetLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-chevron-oak-light', name: 'Chevron Oak', src: woodChevronOakLightUrl, scale: 2, color: '#ffffff' },
  { id: 'wood-diagonal-plank-light', name: 'Diagonal Plank', src: woodDiagonalPlankLightUrl, scale: 2, color: '#ffffff' }
].map((material) => ({
  ...material,
  category: 'wood',
  kind: 'texture'
}));

// Stone
const COMMON_STONE_MATERIALS = [
  { id: 'stone-grass', name: 'Grass', src: stoneGrassUrl, scale: 2.0, color: '#ffffff' },
  { id: 'stone-earth', name: 'Earth', src: stoneEarthUrl, scale: 1.5, color: '#ffffff' },
  { id: 'stone-sand', name: 'Sand', src: stoneSandUrl, scale: 2.0, color: '#ffffff' },
  { id: 'stone-sand-stone', name: 'Stone', src: stoneSandStoneUrl, scale: 1.8, color: '#ffffff' },
  { id: 'stone-fine-sand', name: 'Fine Sand', src: stoneFineSandUrl, scale: 2.8, color: '#ffffff' },
  { id: 'stone-natural', name: 'Natural Stone', src: stoneNaturalUrl, scale: 2.0, color: '#ffffff' },
  { id: 'stone-joint', name: 'Joint Stone', src: stoneJointUrl, scale: 2.0, color: '#ffffff' },
  { id: 'stone-road', name: 'Gravel Road', src: stoneRoadUrl, scale: 2.2, color: '#ffffff' },
  { id: 'stone-rock', name: 'Rock', src: stoneRockUrl, scale: 2.0, color: '#ffffff' },
  { id: 'stone-terrazzo', name: 'Terrazzo', src: stoneTerrazzoUrl, scale: 1.5, color: '#ffffff' },
  { id: 'stone-white-sand', name: 'White Sand', src: stoneWhiteSandUrl, scale: 1.2, color: '#ffffff' }
].map((material) => ({
  ...material,
  category: 'stone',
  kind: 'texture'
}));

// Brick
const COMMON_BRICK_MATERIALS = [
  { id: 'brick-marble-warm', name: 'Warm Marble Tile', src: brickMarbleWarmUrl, scale: 2.2, color: '#ffffff' },
  { id: 'brick-grey-gloss-marble', name: 'Grey Gloss Marble Tile', src: brickMarbleGreyGlossUrl, scale: 2.4, color: '#ffffff', reflective: true, reflectionLevel: 0.6, specularStrength: 0.8, specularPower: 120 },
  { id: 'brick-marble-tiles', name: 'Marble Tiles', src: brickMarbleTilesUrl, scale: 3.0, color: '#ffffff' },
  { id: 'brick-light', name: 'Light Brick', src: brickLightUrl, scale: 1.5, color: '#ffffff' },
  { id: 'brick-red', name: 'Red Brick', src: brickRedUrl, scale: 1.5, color: '#ffffff' },
  { id: 'brick-cube', name: 'Cube Tile', src: brickCubeUrl, scale: 1.5, color: '#ffffff' },
  { id: 'brick-diamond', name: 'Diamond Tile', src: brickDiamondUrl, scale: 1.5, color: '#ffffff', physicalTileSize: 0.25 },
  { id: 'brick-square', name: 'Square Tile', src: brickSquareUrl, scale: 1.8, color: '#ffffff' },
  { id: 'brick-stone', name: 'Stone Tile', src: brickStoneUrl, scale: 2.0, color: '#ffffff' },
  { id: 'brick-mosaic', name: 'Mosaic Tile', src: brickMosaicUrl, scale: 1.5, color: '#ffffff', physicalTileSize: 0.25 },
  { id: 'brick-black-white', name: 'Black & White Tile', src: brickBlackWhiteUrl, scale: 2.0, color: '#ffffff' },
  { id: 'brick-small-black', name: 'Small Black Tile', src: brickSmallBlackUrl, scale: 1.5, color: '#ffffff', physicalTileSize: 0.25 }
].map((material) => ({
  ...material,
  category: 'brick',
  kind: 'texture'
}));

// Fabric
const COMMON_FABRIC_MATERIALS = [
  { id: 'fabric-rope-cable-beige', name: 'Beige Cable Rope', src: fabricRopeCableBeigeUrl, scale: 2.2, color: '#ffffff' },
  { id: 'fabric-knit-cable-grey', name: 'Grey Cable Knit', src: fabricKnitCableGreyUrl, scale: 2.2, color: '#ffffff' },
  { id: 'fabric-knit-cable-white', name: 'White Cable Knit', src: fabricKnitCableWhiteUrl, scale: 2.2, color: '#ffffff' },
  { id: 'fabric-knit-chevron-cream', name: 'Cream Chevron Knit', src: fabricKnitChevronCreamUrl, scale: 2.2, color: '#ffffff' },
  { id: 'fabric-weave-dark', name: 'Dark Weave', src: fabricWeaveDarkUrl, scale: 2.4, color: '#ffffff' },
  { id: 'fabric-organza-white', name: 'Organza', src: fabricOrganzaWhiteUrl, scale: 2.2, color: '#fffdf8', alpha: 0.48 },
  { id: 'fabric-rug-geometric', name: 'Geometric Rug', src: fabricRugGeometricUrl, scale: 2, color: '#ffffff' },
  { id: 'fabric-foam-panel', name: 'Foam Panel', src: fabricFoamPanelUrl, scale: 2, color: '#ffffff' },
  { id: 'fabric-long-pile', name: 'Long Pile Rug', src: fabricLongPileUrl, scale: 2, color: '#ffffff' },
  { id: 'fabric-flower', name: 'Floral Rug', src: fabricFlowerUrl, scale: 2, stretch: true, color: '#ffffff' },
  { id: 'fabric-square', name: 'Bordered Rug', src: fabricSquareUrl, scale: 2, stretch: true, color: '#ffffff' },
  { id: 'fabric-circle', name: 'Round Rug', src: fabricCircleUrl, scale: 2, stretch: true, color: '#ffffff' },
  { id: 'fabric-triangle', name: 'Triangle Rug', src: fabricTriangleUrl, scale: 2, stretch: true, color: '#ffffff' }
].map((material) => ({
  ...material,
  category: 'fabric',
  kind: 'texture'
}));

// Metal
const COMMON_METAL_MATERIALS = [
  { id: 'metal-gold', name: 'Gold', category: 'metal', kind: 'metal', color: '#d4af37' },
  { id: 'metal-silver', name: 'Silver', category: 'metal', kind: 'metal', color: '#e6e6e6' },
  { id: 'metal-copper', name: 'Copper', category: 'metal', kind: 'metal', color: '#b87333' },
  { id: 'metal-iron', name: 'Iron', category: 'metal', kind: 'metal', color: '#43464b' },
  { id: 'metal-aluminum', name: 'Aluminum', category: 'metal', kind: 'metal', color: '#d9d9d9' },
  { id: 'metal-gold-matte', name: 'Matte Gold', category: 'metal', kind: 'metal', color: '#d4af37', roughness: 0.6 },
  { id: 'metal-silver-matte', name: 'Matte Silver', category: 'metal', kind: 'metal', color: '#e6e6e6', roughness: 0.6 },
  { id: 'metal-copper-matte', name: 'Matte Copper', category: 'metal', kind: 'metal', color: '#b87333', roughness: 0.6 },
  { id: 'metal-iron-matte', name: 'Matte Iron', category: 'metal', kind: 'metal', color: '#43464b', roughness: 0.6 },
  { id: 'metal-aluminum-matte', name: 'Matte Aluminum', category: 'metal', kind: 'metal', color: '#d9d9d9', roughness: 0.6 }
];

// Wallpaper & Poster
const COMMON_WALLPAPER_MATERIALS = [
  { id: 'wallpaper-rose', name: 'Rose Wallpaper', src: wallpaperRoseUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-yellow-flower', name: 'Yellow Floral Wallpaper', src: wallmapYellowUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-leaf-bluegrey', name: 'Blue-Grey Leaf Wallpaper', src: wallpaperLeafBluegreyUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-paisley-orange', name: 'Orange Paisley Wallpaper', src: wallpaperPaisleyOrangeUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-fan-gold', name: 'Gold Fan Wallpaper', src: wallpaperFanGoldUrl, scale: 1, color: '#c6a47d' },
  { id: 'wallpaper-stripe-teal-pink', name: 'Teal Pink Stripe Wallpaper', src: wallpaperStripeTealPinkUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-damask-olive', name: 'Olive Damask Wallpaper', src: wallpaperDamaskOliveUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-ink-bamboo-mist', name: 'Ink Bamboo Mist Wallpaper', src: wallpaperInkBambooMistUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-cloud-navy-gold', name: 'Navy Gold Cloud Wallpaper', src: wallpaperCloudNavyGoldUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-ruyi-swirl-yellow', name: 'Yellow Swirl Wallpaper', src: wallpaperRuyiSwirlYellowUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-floral-blue-white', name: 'Blue White Floral Wallpaper', src: wallpaperFloralBlueWhiteUrl, scale: 1, color: '#ffffff' },
  { id: 'wallpaper-seigaiha-blush', name: 'Blush Seigaiha Wallpaper', src: wallpaperSeigaihaBlushUrl, scale: 1, color: '#ffffff' },
  { id: 'poster-abstract-arches', name: 'Abstract Arches Poster', src: posterAbstractArchesUrl, scale: 1, color: '#ffffff' },
  { id: 'poster-botanical-sage', name: 'Botanical Sage Poster', src: posterBotanicalSageUrl, scale: 1, color: '#ffffff' },
  { id: 'poster-bauhaus-primary', name: 'Bauhaus Primary Poster', src: posterBauhausPrimaryUrl, scale: 1, color: '#ffffff' },
  { id: 'poster-mountain-sunrise', name: 'Mountain Sunrise Poster', src: posterMountainSunriseUrl, scale: 1, color: '#ffffff' },
  { id: 'poster-celestial-moons', name: 'Celestial Moons Poster', src: posterCelestialMoonsUrl, scale: 1, color: '#ffffff' }
].map((material) => ({
  ...material,
  category: 'wallpaper',
  kind: 'texture'
}));

// Mirror
const COMMON_MIRROR_MATERIALS = [
  { id: 'mirror-silver', name: 'Silver Mirror', category: 'mirror', kind: 'mirror', color: '#e8eef4' },
  { id: 'mirror-gold', name: 'Gold Mirror', category: 'mirror', kind: 'mirror', color: '#f0e6c8' },
  { id: 'mirror-bronze', name: 'Bronze Mirror', category: 'mirror', kind: 'mirror', color: '#c5b8a0' },
  { id: 'mirror-dark', name: 'Dark Mirror', category: 'mirror', kind: 'mirror', color: '#3a3d42' }
];

// Glass
const COMMON_GLASS_MATERIALS = [
  { id: 'glass-clear', name: 'Clear Glass', category: 'glass', kind: 'glass', color: '#e8f4ff' },
  { id: 'glass-frosted', name: 'Frosted Glass', category: 'glass', kind: 'glass', color: '#f0f0f0', alpha: 0.55 },
  { id: 'glass-tea', name: 'Tea Glass', category: 'glass', kind: 'glass', color: '#c4a97d' },
  { id: 'glass-blue', name: 'Blue Glass', category: 'glass', kind: 'glass', color: '#7fb8e0' },
  {
    id: 'glass-stained-cathedral',
    name: 'Stained Cathedral Glass',
    category: 'glass',
    kind: 'stained-glass',
    color: '#8e4cc9',
    alpha: 0.72,
    patternScale: 1.1,
    emissiveStrength: 0.18
  }
];

// Emissive
const COMMON_EMISSIVE_MATERIALS = [
  { id: 'emissive-white', name: 'White Light', category: 'emissive', kind: 'emissive', color: '#ffffff' },
  { id: 'emissive-warm-white', name: 'Warm White Light', category: 'emissive', kind: 'emissive', color: '#ffebd2' },
  { id: 'emissive-yellow', name: 'Yellow Light', category: 'emissive', kind: 'emissive', color: '#ffeb3b' },
  { id: 'emissive-red', name: 'Red Light', category: 'emissive', kind: 'emissive', color: '#f44336' },
  { id: 'emissive-green', name: 'Green Light', category: 'emissive', kind: 'emissive', color: '#4caf50' },
  { id: 'emissive-blue', name: 'Blue Light', category: 'emissive', kind: 'emissive', color: '#2196f3' },
  { id: 'emissive-hacker-stream', name: 'Hacker Stream', category: 'emissive', kind: 'emissive', src: hackerStreamUrl, scale: 1.1, color: '#ffffff' },
  { id: 'emissive-dance-floor', name: 'Dance Floor', category: 'emissive', kind: 'emissive', src: danceFloorUrl, scale: 1.2, color: '#ffffff' },
  { id: 'emissive-fireplace-flame', name: 'Fireplace Flame', category: 'emissive', kind: 'emissive', src: fireplaceFlameUrl, scale: 1.5, repeatX: true, stretchY: true, invertY: true, uvMode: 'box-world', color: '#ffffff' },
  { id: 'emissive-neon-sign', name: 'Neon Sign', category: 'emissive', kind: 'emissive', src: neonSignUrl, scale: 1.1, color: '#ffffff' },
  { id: 'emissive-cyber-no-entry', name: 'Cyber No Entry', category: 'emissive', kind: 'emissive', src: cyberNoEntryUrl, scale: 1, color: '#ffffff', invertY: true, uvMode: 'box-world' },
  { id: 'emissive-robot-smile', name: 'Robot Smile', category: 'emissive', kind: 'emissive', src: robotSmileUrl, scale: 1, color: '#ffffff', invertY: true, uvMode: 'box-world', spriteColumns: 3, spriteRows: 3, frameDuration: 320 }
];

// =============================================================================
// 4. Export Default Material Packs
// =============================================================================

export const DEFAULT_MATERIAL_PACKS = [
  ...COMMON_PAINT_MATERIALS,
  ...COMMON_SKY_MATERIALS,
  ...COMMON_WOOD_MATERIALS,
  ...COMMON_STONE_MATERIALS,
  ...COMMON_BRICK_MATERIALS,
  ...COMMON_FABRIC_MATERIALS,
  ...COMMON_METAL_MATERIALS,
  ...COMMON_WALLPAPER_MATERIALS,
  ...COMMON_MIRROR_MATERIALS,
  ...COMMON_GLASS_MATERIALS,
  ...COMMON_EMISSIVE_MATERIALS
];

// =============================================================================
// 5. Descriptor Helpers
// =============================================================================

export function createColorMaterialDescriptor(color, category = 'paint', name = 'Custom Color') {
  return {
    kind: 'color',
    category,
    name,
    color
  };
}

export function createTextureMaterialDescriptor({
  id,
  name,
  category = 'custom',
  src,
  fileName,
  scale = 1,
  color = '#ffffff',
  stretch = false,
  reflective = false,
  reflectionLevel,
  specularStrength,
  specularPower
}) {
  return {
    id,
    kind: 'texture',
    category,
    name,
    fileName,
    src,
    scale,
    color,
    stretch,
    reflective,
    reflectionLevel,
    specularStrength,
    specularPower
  };
}
