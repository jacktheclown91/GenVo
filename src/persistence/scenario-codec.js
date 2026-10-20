// Cross-platform, lossless snapshot transport for real saved worlds.
// IndexedDB uses structured clone; JSON alone destroys typed arrays, Sets,
// Maps and shared identity. This graph codec preserves all of those without
// generating new creatures, water, geography or RNG history.
export const SCENARIO_CODEC='genvo.snapshot-graph/1';
const TYPED=Object.freeze({
 Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,
 Int32Array,Uint32Array,Float32Array,Float64Array,
 ...(typeof BigInt64Array==='function'?{BigInt64Array}:{}),
 ...(typeof BigUint64Array==='function'?{BigUint64Array}:{})
});
// A modern planetary region can contain more than half a million distinct
// owned resource/organism records. A strict object-count cap remains, but
// must not reject a real mature-world save before assessing encoded bytes.
const MAX_NODES=3000000,MAX_BINARY=160*1024*1024;
function encodeBytes(bytes){
 if(typeof Buffer!=='undefined')return Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength).toString('base64');
 let data='';for(let i=0;i<bytes.length;i+=8192)data+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(data);
}
function decodeBytes(value){
 if(typeof value!=='string'||value.length>MAX_BINARY*2)throw Error('Invalid scenario binary.');
 if(typeof Buffer!=='undefined')return Uint8Array.from(Buffer.from(value,'base64'));
 const raw=atob(value),out=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
 return out;
}
export function encodeSnapshotGraph(input){
 const nodes=[],seen=new Map();
 function visit(v){
  if(v===undefined)return{$value:'undefined'};
  if(typeof v==='number'&&!Number.isFinite(v))return{$value:String(v)};
  if(typeof v==='bigint')return{$bigint:String(v)};
  if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number')return v;
  if(typeof v!=='object')throw Error('Unsupported scenario value.');
  if(seen.has(v))return{$ref:seen.get(v)};
  if(nodes.length>=MAX_NODES)throw Error('Scenario graph exceeds '+MAX_NODES+' owned nodes.');
  const id=nodes.length;seen.set(v,id);nodes.push(null);
  let node;
  if(ArrayBuffer.isView(v)){
   const kind=v.constructor.name;
   if(kind==='DataView')node={type:'data-view',bytes:encodeBytes(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))};
   else if(TYPED[kind])node={type:'typed',kind,bytes:encodeBytes(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))};
   else throw Error('Unsupported scenario typed array.');
  }else if(v instanceof ArrayBuffer)node={type:'buffer',bytes:encodeBytes(new Uint8Array(v))};
  else if(v instanceof Date)node={type:'date',value:v.toISOString()};
  else if(v instanceof Set)node={type:'set',items:[...v].map(visit)};
  else if(v instanceof Map)node={type:'map',items:[...v].map(([k,x])=>[visit(k),visit(x)])};
  else if(Array.isArray(v))node={type:'array',items:v.map(visit)};
  else{
   if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)
    throw Error('Unsupported scenario object prototype.');
   node={type:'object',items:Object.entries(v).map(([key,x])=>[key,visit(x)])};
  }
  nodes[id]=node;return{$ref:id};
 }
 return{format:SCENARIO_CODEC,root:visit(input),nodes};
}
export function decodeSnapshotGraph(data){
 if(data?.format!==SCENARIO_CODEC||!Array.isArray(data.nodes)||data.nodes.length>MAX_NODES)
  throw Error('Unsupported scenario graph.');
 const refs=data.nodes.map(node=>{
  if(!node||typeof node!=='object')throw Error('Invalid scenario graph node.');
  switch(node.type){
   case'object':return{};
   case'array':return[];
   case'map':return new Map();
   case'set':return new Set();
   case'date':{const d=new Date(node.value);if(!Number.isFinite(+d))throw Error('Invalid scenario date.');return d;}
   case'buffer':return decodeBytes(node.bytes).buffer;
   case'data-view':return new DataView(decodeBytes(node.bytes).buffer);
   case'typed':{
    const C=TYPED[node.kind];if(!C)throw Error('Unsupported scenario array type.');
    const b=decodeBytes(node.bytes);
    if(b.length>MAX_BINARY||b.byteLength%C.BYTES_PER_ELEMENT!==0)throw Error('Invalid scenario array data.');
    return new C(b.buffer);
   }
   default:throw Error('Unknown scenario graph node.');
  }
 });
 function revive(v){
  if(v===null||typeof v!=='object')return v;
  if(Object.keys(v).length===1&&Object.hasOwn(v,'$ref')){
   if(!Number.isSafeInteger(v.$ref)||v.$ref<0||v.$ref>=refs.length)throw Error('Invalid scenario graph reference.');
   return refs[v.$ref];
  }
  if(Object.keys(v).length===1&&Object.hasOwn(v,'$value')){
   if(v.$value==='undefined')return undefined;
   if(v.$value==='NaN')return NaN;
   if(v.$value==='Infinity')return Infinity;
   if(v.$value==='-Infinity')return -Infinity;
  }
  if(Object.keys(v).length===1&&Object.hasOwn(v,'$bigint'))return BigInt(v.$bigint);
  throw Error('Invalid scenario graph value.');
 }
 data.nodes.forEach((node,i)=>{
  const dest=refs[i];
  if(node.type==='object'){
   if(!Array.isArray(node.items))throw Error('Invalid scenario object fields.');
   for(const [k,v] of node.items){
    if(typeof k!=='string'||k==='__proto__'||k==='constructor'||k==='prototype')
     throw Error('Invalid scenario object field.');
    dest[k]=revive(v);
   }
  }else if(node.type==='array'){
   if(!Array.isArray(node.items))throw Error('Invalid scenario array elements.');
   // Large historic arrays can exceed the JS argument-list limit.
   for(const item of node.items)dest.push(revive(item));
  }else if(node.type==='set'){
   if(!Array.isArray(node.items))throw Error('Invalid scenario set.');
   for(const item of node.items)dest.add(revive(item));
  }else if(node.type==='map'){
   if(!Array.isArray(node.items))throw Error('Invalid scenario map.');
   for(const item of node.items){if(!Array.isArray(item)||item.length!==2)throw Error('Invalid scenario map entry.');dest.set(revive(item[0]),revive(item[1]));}
  }
 });
 return revive(data.root);
}
