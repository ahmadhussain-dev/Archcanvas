/**
 * uiStore.js — UI   Class
 */

export class UIStore {
  constructor() {
    this.mode = 'select'; //   (  'select', 'draw-wall'  )
    this.currentView = '2d'; //   ('2d' | '3d')
    this.designMode = 'select'; //  
    this.floorPanelCollapsed = false; //  
    this.contextMenuElement = null; //  Open  DOM  
  }
}
