/**
 * editorPreviewStore.js —   Class
 */

export class EditorPreviewStore {
  constructor() {
    this.drawStart = null; //   [x, z]
    this.drag3DState = null; // 3D  
    this.drawWallPreviewCylinder = null; //  
    this.drawWallPreviewStartCylinder = null; //  
    this.drawWallPreviewWall = null; //   Box  
    this.roofResizeState = null; //  
    this.stairsRailingPreview2DGroup = null; // 2D   SVG  
    this.stairsRailingPreview3DGroup = null; // 3D  
    this.currentPreviewStairsId = null; //   ID
    this.floorEdgeRailingPreview2DGroup = null; // 2D   SVG  
    this.floorEdgeRailingPreview3DGroup = null; // 3D  
    this.currentPreviewFloorEdgeIndex = null; //  
    this.longPressState = null; //  
    this.snapEnabled = true; //  
    this.active3DEditTarget = null; //   3D  
    this.snapSize = 10; //  
    this.activeMaterialDescriptor = null; //  
    this.activeMaterialArray = null; //  Pick Material 
    this.materialLibrary = []; //  
  }
}
