import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const INCHES_PER_UNIT = 39.37;

//  Furniture 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const furnitureDir = path.resolve(__dirname, '../../src/furniture');

/**
 *  （ ）
 * @param {number|string} val 
 * @returns {number}
 */
function inchesToMeters(val) {
  const num = Number(val);
  //   0.1  （  depth: 0.08）， 
  if (num > 0 && num <= 0.1) {
    return num;
  }

  const raw = num / INCHES_PER_UNIT;
  if (raw === 0) return 0;
  
  //  ：  25   1  (0.01 ) ； Furniture  5  (0.05 ) 
  const step = raw < 0.25 ? 0.01 : 0.05;
  
  const rounded = Math.round(raw / step) * step;
  if (rounded === 0) {
    return Number(raw.toFixed(2));
  }
  return Number(rounded.toFixed(2));
}

/**
 *   defaultSize  ，  unit: 'm'
 * @param {string} content 
 * @returns {string}
 */
function convertDefaultSize(content) {
  //   defaultSize: { width: X, depth: Y, height: Z } ( )
  const regex = /defaultSize:\s*\{\s*width:\s*([\d.-]+)\s*,\s*depth:\s*([\d.-]+)\s*,\s*height:\s*([\d.-]+)\s*\}/g;
  return content.replace(regex, (match, w, d, h, offsetInString) => {
    //  /  250   unit: 'm'
    const offset = typeof offsetInString === 'number' ? offsetInString : 0;
    const contextSnippet = content.substring(Math.max(0, offset - 250), Math.min(content.length, offset + 250));
    if (/unit:\s*['"]m['"]/.test(contextSnippet)) {
      //  ， 
      return match;
    }

    const wm = inchesToMeters(w);
    const dm = inchesToMeters(d);
    const hm = inchesToMeters(h);
    //  ，  unit: 'm'
    return `unit: 'm',\n  defaultSize: { width: ${wm}, depth: ${dm}, height: ${hm} }`;
  });
}

/**
 *   lightSource   offset   range  ， 
 * @param {string} content 
 * @returns {string}
 */
function convertLightSources(content) {
  let idx = 0;
  while (true) {
    idx = content.indexOf('lightSource:', idx);
    if (idx === -1) break;
    
    //   unit: 'm'
    const contextSnippet = content.substring(Math.max(0, idx - 250), Math.min(content.length, idx + 250));
    if (/unit:\s*['"]m['"]/.test(contextSnippet)) {
      idx += 12;
      continue;
    }
    
    //   lightSource   "{"
    const startBrace = content.indexOf('{', idx);
    if (startBrace === -1) {
      idx += 12;
      continue;
    }
    
    //   "}"
    let braceCount = 1;
    let endBrace = startBrace + 1;
    while (braceCount > 0 && endBrace < content.length) {
      const char = content[endBrace];
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      endBrace++;
    }
    
    if (braceCount > 0) {
      //  ， 
      idx += 12;
      continue;
    }
    
    //   lightSource  
    const blockContent = content.substring(startBrace, endBrace);
    
    // 1.   offset: { x: X, y: Y, z: Z }  
    let updatedBlock = blockContent.replace(/offset:\s*\{\s*x:\s*([\d.-]+)\s*,\s*y:\s*([\d.-]+)\s*,\s*z:\s*([\d.-]+)\s*\}/g, (match, x, y, z) => {
      const xm = inchesToMeters(x);
      const ym = inchesToMeters(y);
      const zm = inchesToMeters(z);
      return `offset: { x: ${xm}, y: ${ym}, z: ${zm} }`;
    });
    
    // 2.   range: R  
    updatedBlock = updatedBlock.replace(/range:\s*([\d.]+)/g, (match, r) => {
      const rm = inchesToMeters(r);
      return `range: ${rm}`;
    });
    
    //   lightSource  
    content = content.substring(0, startBrace) + updatedBlock + content.substring(endBrace);
    
    //  ， 
    idx += updatedBlock.length + (startBrace - idx);
  }
  return content;
}

/**
 *  
 * @param {string} filePath 
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // 1.   unit: 'm'
  content = convertDefaultSize(content);
  
  // 2.  
  content = convertLightSources(content);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[ Item]  Item: ${path.basename(filePath)}`);
  } else {
    console.log(`[ Item]  Item: ${path.basename(filePath)}`);
  }
}

function main() {
  console.log('===  ItemFurniture Item ===');
  
  if (!fs.existsSync(furnitureDir)) {
    console.error(`[ Item]  ItemFurniture Item: ${furnitureDir}`);
    return;
  }
  
  const files = fs.readdirSync(furnitureDir);
  let count = 0;
  for (const file of files) {
    //  ，  index.js   helper  
    if (!file.endsWith('.js') || file === 'index.js' || file === '_helpers.js') {
      continue;
    }
    const fullPath = path.join(furnitureDir, file);
    try {
      processFile(fullPath);
      count++;
    } catch (err) {
      console.error(`[ Item]  Item ${file}  Item:`, err);
    }
  }
  
  console.log(`\n===  Item！ Item ${count}  ItemFurniture Item。===`);
}

main();
