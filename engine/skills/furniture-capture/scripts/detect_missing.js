import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Furniture 
const furnitureDir = path.resolve(__dirname, '../../../src/furniture');
const imageDir = path.resolve(__dirname, '../../../src/furniture/image');

// 1.   (  .png  )
const existingImages = new Set();
if (fs.existsSync(imageDir)) {
  fs.readdirSync(imageDir).forEach(file => {
    if (file.endsWith('.png')) {
      const type = path.basename(file, '.png');
      existingImages.add(type);
    }
  });
}

// 2.   JS  Furniture 
const allFurniture = [];

const files = fs.readdirSync(furnitureDir);
files.forEach(file => {
  if (!file.endsWith('.js') || file === 'index.js' || file === '_helpers.js') {
    return;
  }

  const filePath = path.join(furnitureDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let currentFurniture = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    //  ，  export const xxx = {
    if (line.trim().startsWith('export const ') && (line.includes('{') || (i + 1 < lines.length && lines[i + 1].includes('{')))) {
      if (currentFurniture && currentFurniture.type) {
        allFurniture.push(currentFurniture);
      }
      currentFurniture = { file };
      continue;
    }

    //   2   type  
    const typeMatch = line.match(/^  type:\s*['"]([^'"]+)['"]/);
    if (typeMatch && currentFurniture) {
      currentFurniture.type = typeMatch[1];
      continue;
    }

    //   2   name  
    const nameMatch = line.match(/^  name:\s*['"]([^'"]+)['"]/);
    if (nameMatch && currentFurniture) {
      currentFurniture.name = nameMatch[1];
      continue;
    }
  }

  //  Furniture 
  if (currentFurniture && currentFurniture.type) {
    allFurniture.push(currentFurniture);
  }
});

// 3.  
const missingThumbnails = [];
allFurniture.forEach(item => {
  if (!existingImages.has(item.type)) {
    missingThumbnails.push(item);
  }
});

console.log('==================================================');
console.log(` ItemFurniture Item: ${allFurniture.length}  Item`);
console.log(` Item: ${existingImages.size}  Item`);
console.log(` Item: ${missingThumbnails.length}  Item`);
console.log('==================================================');

if (missingThumbnails.length > 0) {
  console.log('\n ItemFurniture Item:\n');
  missingThumbnails.forEach((item, index) => {
    console.log(`${index + 1}. [${item.name || ' Item'}] ( Item: ${item.type}) -  Item: ${item.file}`);
  });
} else {
  console.log('\n Item！ ItemFurniture Item。');
}
console.log('==================================================');
