// Staged plain-data clone. The codec validates supported values before this boundary.
// Memoization preserves aliases within one value; each invocation is independent.
export function copyPlainMetadata(value){
 if(value===null||typeof value!=='object')return value;
 const memo=new Map(),nativeFallback=Symbol();
 function copy(v){
  if(typeof v==='function'||typeof v==='symbol')throw nativeFallback;
  if(v===null||typeof v!=='object')return v;
  if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype)throw nativeFallback;
  if(memo.has(v))return memo.get(v);
  const out=Array.isArray(v)?new Array(v.length):{};memo.set(v,out);
  for(const key of Object.keys(v)){
   const item=copy(v[key]);
   if(key==='__proto__')Object.defineProperty(out,key,{value:item,enumerable:true,writable:true,configurable:true});else out[key]=item;
  }
  return out;
 }
 // Array extension properties were accepted by the old codec: retain native handling for non-plain values.
 try{return copy(value)}catch(error){if(error===nativeFallback)return structuredClone(value);throw error;}
}
