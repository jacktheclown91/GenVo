// Independent copy of a captured snapshot whose Simulation keeps running (a warm
// regional replay). It has structuredClone's result for snapshot data, except
// that deeply frozen objects, such as flora genomes and gametes, are immutable and
// shared rather than copied. Shared objects keep every alias the original graph
// had. Anything outside plain objects, arrays, Maps, Sets and unshared typed
// arrays falls back to structuredClone of the whole snapshot. `owned` lists
// subtrees the capture itself just built and nothing else holds; they pass through.
import {drain} from '../sim/resumable.js';
const deepFrozen=new WeakSet();
// A frozen cycle is never shared, so no object is cached on an unproven assumption.
function isDeepFrozen(v,visiting=new Set()){
 if(deepFrozen.has(v))return true;
 if(!Object.isFrozen(v)||ArrayBuffer.isView(v)||v instanceof Map||v instanceof Set||visiting.has(v))return false;
 const proto=Object.getPrototypeOf(v);if(proto!==Object.prototype&&proto!==Array.prototype)return false;
 visiting.add(v);
 for(const key of Reflect.ownKeys(v)){
  const d=Object.getOwnPropertyDescriptor(v,key);if(!('value' in d)||typeof key==='symbol'||!d.enumerable&&!(Array.isArray(v)&&key==='length'))return false;
  const x=d.value;if(x!==null&&typeof x==='object'&&!isDeepFrozen(x,visiting))return false;
  if(typeof x==='function'||typeof x==='symbol')return false;
 }
 visiting.delete(v);deepFrozen.add(v);return true;
}
const UNSUPPORTED=Symbol('unsupported');
export function independentSnapshotCopy(snapshot,options){return drain(independentSnapshotCopySteps(snapshot,options))}
// Resumable form: pauses between the snapshot's top-level parts, its controllers
// and their fields, sharing one alias memo, for a caller whose source stays unchanged.
export function* independentSnapshotCopySteps(snapshot,{owned=[]}={}){
 const memo=new Map(),buffers=new Set();
 for(const o of owned)if(o&&typeof o==='object')memo.set(o,o);
 function copy(v){
  if(v===null||typeof v!=='object'){if(typeof v==='function'||typeof v==='symbol')throw UNSUPPORTED;return v}
  const known=memo.get(v);if(known!==undefined)return known;
  if(Object.isFrozen(v)&&isDeepFrozen(v)){memo.set(v,v);return v}
  if(ArrayBuffer.isView(v)){if(v instanceof DataView||buffers.has(v.buffer))throw UNSUPPORTED;buffers.add(v.buffer);const out=structuredClone(v);memo.set(v,out);return out}
  const proto=Object.getPrototypeOf(v);
  if(Array.isArray(v)){
   if(proto!==Array.prototype||Object.keys(v).length!==v.length)throw UNSUPPORTED;
   const out=new Array(v.length);memo.set(v,out);for(let i=0;i<v.length;i++)out[i]=copy(v[i]);return out;
  }
  if(proto===Map.prototype){const out=new Map();memo.set(v,out);for(const [k,x] of v)out.set(copy(k),copy(x));return out}
  if(proto===Set.prototype){const out=new Set();memo.set(v,out);for(const x of v)out.add(copy(x));return out}
  if(proto!==Object.prototype)throw UNSUPPORTED;
  return drain(copyObject(v,0));
 }
 // A plain object's own enumerable data properties, in order; `pauses` levels
 // below this one yield after each property.
 function* copyObject(v,pauses){
  const out={};memo.set(v,out);
  for(const key of Object.keys(v)){
   const d=Object.getOwnPropertyDescriptor(v,key);if(!('value' in d))throw UNSUPPORTED;
   const item=d.value,x=pauses>0&&isPlainCopyable(item)?yield* copyObject(item,pauses-1):copy(item);
   if(key==='__proto__')Object.defineProperty(out,key,{value:x,enumerable:true,writable:true,configurable:true});else out[key]=x;
   if(pauses>0)yield;
  }
  return out;
 }
 const isPlainCopyable=v=>v!==null&&typeof v==='object'&&!memo.has(v)&&Object.getPrototypeOf(v)===Object.prototype&&!(Object.isFrozen(v)&&isDeepFrozen(v));
 try{return isPlainCopyable(snapshot)?yield* copyObject(snapshot,3):copy(snapshot)}catch(error){if(error===UNSUPPORTED)return structuredClone(snapshot);throw error}
}
