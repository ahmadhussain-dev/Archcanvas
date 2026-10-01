/**
 * selectionStore.js —   Class
 */

export class SelectionStore {
  constructor() {
    /** @type {import('../type/common.js').SelectedTarget} */
    this.selectedTarget = { type: null, id: null }; //  
    this.selectedRoomId = null; //  Room ID
    this.selectedWallId = null; //   ID
    this.selectedItemId = null; //  Furniture  ID
    this.selectedOpeningId = null; //   ID
    this.selectedRoofId = null; //   ID
    this.selectedStairsId = null; //   ID
    this.selectedFenceId = null; //   ID
    this.selectedFenceGateId = null; //   ID

    // Duplicate Furniture 
    this.pickerCopiedItemType = null;
    this.pickerCopiedItemMaterials = null;
    this.pickerCopiedItemColors = null;

    // Duplicate 
    this.pickerCopiedBuildingType = null;
    this.pickerCopiedBuildingMaterials = null;
    this.pickerCopiedBuildingColors = null;
  }
}
