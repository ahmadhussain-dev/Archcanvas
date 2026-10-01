/**
 *  CustomFurniture  ( )。
 *
 *  。
 *   type、name、 、  build  。
 */
export default function createFurniture({ boxComponent }) {
  const definition = {
    type: 'custom_sofa',
    name: '\u4e91\u6735\u6c99\u53d1', //  
    thumbnail: '', // Custom  (  Base64 Data URL   URL， )
    defaultSize: { width: 84, depth: 36, height: 32 }, // Inches ( )
    components: [
      { id: 'seat', label: '\u5750\u57ab', defaultColor: '#ff9dbb' }, //  
      { id: 'back', label: '\u9760\u80cc', defaultColor: '#f56f9f' }, //  
      { id: 'arms', label: '\u6276\u624b', defaultColor: '#f56f9f' }, //  
      { id: 'legs', label: '\u811a\u67b6', defaultColor: '#b07a50' }  //  
    ],
    interaction: {
      type: 'sit',
      getInteractionPoints(size) {
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

