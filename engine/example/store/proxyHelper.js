/**
 * proxyHelper.js —   Store   Handler  
 * 
 *  ：
 *   1.  ，  Handler   Store  。
 *   2.  、  ctx。
 *   3. O(1)  ， 。
 */

import { ui, selection, editor } from './index.js';

//   Store  
const stores = [ui, selection, editor];
//   Store  
const storePropCache = new Map();

/**
 *   Store， 
 * @param {string} prop -  
 * @returns {Object|null}   Store   null
 */
function findStoreForProp(prop) {
  if (storePropCache.has(prop)) {
    return storePropCache.get(prop);
  }

  for (const store of stores) {
    //   store  
    if (Object.prototype.hasOwnProperty.call(store, prop)) {
      storePropCache.set(prop, store);
      return store;
    }
  }

  //  
  storePropCache.set(prop, null);
  return null;
}

/**
 *   Handler   Store  
 * @param {() => Object} getRawCtx -  ，  Handler   ctx  
 * @returns {Proxy}  
 */
export function createStoreProxy(getRawCtx) {
  return new Proxy({}, {
    get(target, prop) {
      //   symbol，  target   hasOwnProperty.call  
      if (typeof prop === 'symbol') {
        return target[prop];
      }

      const store = findStoreForProp(prop);
      if (store) {
        return store[prop];
      }

      //  
      const raw = getRawCtx();
      return raw ? raw[prop] : undefined;
    },

    set(target, prop, value) {
      if (typeof prop === 'symbol') {
        target[prop] = value;
        return true;
      }

      const store = findStoreForProp(prop);
      if (store) {
        store[prop] = value;
        return true;
      }

      //  
      const raw = getRawCtx();
      if (raw) {
        raw[prop] = value;
      }
      return true;
    }
  });
}
