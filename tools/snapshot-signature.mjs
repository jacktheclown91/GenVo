// Canonical persistent snapshot data, not V8's internal integer/string storage
// encoding. Preserve property/collection order, aliases, cycles and exact scalar
// values. Typed views follow the save contract: type and visible data, not hidden
// backing-buffer offsets/padding. This helper never changes the input graph.
import {createHash} from 'node:crypto';

export function snapshotSignature(value) {
  const hash = createHash('sha256'), seen = new Map();
  let pending = '';
  const write = (tag, text = '') => {
    pending += JSON.stringify([tag, text]) + '\n';
    if (pending.length >= 65536) { hash.update(pending); pending = ''; }
  };
  function properties(item) {
    const keys = Object.keys(item);
    write('properties', keys.length);
    for (const key of keys) { write('key', key); visit(item[key]); }
    if (Object.getOwnPropertySymbols(item).some(symbol => Object.prototype.propertyIsEnumerable.call(item, symbol))) throw Error('Symbol-keyed snapshot data is unsupported.');
  }
  function visit(item) {
    if (item === null) { write('null'); return; }
    const type = typeof item;
    if (type === 'number') { write('number', Object.is(item, -0) ? '-0' : Number.isNaN(item) ? 'NaN' : String(item)); return; }
    if (type === 'string' || type === 'boolean' || type === 'bigint') { write(type, String(item)); return; }
    if (type === 'undefined') { write('undefined'); return; }
    if (type !== 'object') throw Error('Unsupported snapshot value: ' + type);
    if (seen.has(item)) { write('reference', seen.get(item)); return; }
    const id = seen.size; seen.set(item, id); write('object', id);
    if (ArrayBuffer.isView(item)) {
      write('view', item.constructor.name);
      if (item instanceof DataView) for (const byte of new Uint8Array(item.buffer, item.byteOffset, item.byteLength)) visit(byte);
      else for (const element of item) visit(element);
      write('end-view'); return;
    }
    if (item instanceof ArrayBuffer) { write('buffer', Buffer.from(item).toString('hex')); return; }
    if (Array.isArray(item)) { write('array', item.length); properties(item); return; }
    if (item instanceof Map) {
      write('map', item.size);
      for (const [key, entry] of item) { visit(key); visit(entry); }
      properties(item); return;
    }
    if (item instanceof Set) { write('set', item.size); for (const entry of item) visit(entry); properties(item); return; }
    if (item instanceof Date) { write('date', String(item.getTime())); properties(item); return; }
    const prototype = Object.getPrototypeOf(item);
    if (prototype !== null && prototype !== Object.prototype) throw Error('Unsupported snapshot object prototype: ' + item.constructor?.name);
    write('record', prototype === null ? 'null-prototype' : 'Object');
    properties(item);
  }
  visit(value);
  return hash.update(pending).digest('hex');
}
