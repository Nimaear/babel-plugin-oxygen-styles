
const cacheName = 'classnames';

function getCache(options) {
  if (options.cacheDir) {
    return new DiskCache(cacheName, options);
  }

  return new MemoryCache(cacheName);
}

export function clearCache(options) {
  getCache(options).clear();
}

export function createHash(str) {
  let i = str.length;
  if (i === 0) return 0;

  let hash = 5381;
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
}

export function stringifyObject(obj) {
  return JSON.stringify(obj);
}

const SYMBOL_SET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export function extendedToString(num, base) {
  let conversion = '';

  if (base > SYMBOL_SET.length || base <= 1 || !Number.isInteger(base)) {
    throw new Error(`${base} should be an integer between 1 and ${SYMBOL_SET.length}`);
  }

  while (num >= 1) {
    conversion = SYMBOL_SET[(num - (base * Math.floor(num / base)))] + conversion;
    num = Math.floor(num / base);
  }

  return (base < 11) ? parseInt(conversion, 10) : conversion;
}

export default function compressClassName(obj) {
  if (typeof obj === 'undefined') {
    return '';
  }
  return extendedToString(createHash(stringifyObject(obj)), 62);
}
