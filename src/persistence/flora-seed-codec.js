// Lossless persistence representation only. Live ecological Maps remain authoritative.
// Float64 quantities retain every positive rare cohort; dictionaries encode repetition.
function fingerprint(v){if(v===undefined)return'u';if(v===null)return'n';if(typeof v==='string')return's'+JSON.stringify(v);if(typeof v==='boolean')return'b'+Number(v);if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Invalid seed metadata number.');return'd'+(Object.is(v,-0)?'-0':v)}if(Array.isArray(v))return'a'+JSON.stringify(v.map(fingerprint));if(v&&Object.getPrototypeOf(v)===Object.prototype)return'o'+JSON.stringify(Object.entries(v).map(([k,x])=>[k,fingerprint(x)]));throw Error('Unsupported seed metadata.');}
// Primitive metadata is immutable. Arrays/objects remain independently cloned.
function copyMetadata(value){
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
const dictionary=()=>({values:[],index:new Map(),strings:new Map()});
function intern(d,v,ownedMetadata=false){const strings=typeof v==='string',index=strings?d.strings:d.index,k=strings?v:fingerprint(v),old=index.get(k);if(old!==undefined)return old;const i=d.values.length;index.set(k,i);
 // An offscreen replay can TRANSFER ownership of its detached, soon-discarded
 // runtime metadata into the unique new snapshot. Ordinary callers always
 // receive independent copies, as before.
 d.values.push(ownedMetadata?v:copyMetadata(v));return i;}
// Object.keys supplies a dense string array: native JSON is an unambiguous
// order key without recursively re-tagging every field name for every cohort.
function internOrder(d,keys){const k=JSON.stringify(keys),old=d.index.get(k);if(old!==undefined)return old;const i=d.values.length;d.index.set(k,i);d.values.push([...keys]);return i;}
export function packFloraSeedBanks(seeds,{ownedMetadata=false}={}){const kinds={};for(const [kind,cells] of Object.entries(seeds)){if(!(cells instanceof Map))throw Error('Invalid live seed bank.');const cellIds=[],offsets=[0],ids=dictionary(),orders=dictionary(),rowIds=[],amounts=[],rowOrders=[],columns=new Map();let n=0;
 for(const [cell,rows] of cells){if(!Number.isSafeInteger(cell)||cell<0||cell>2147483647)throw Error('Invalid seed cell.');cellIds.push(cell);if(!(rows instanceof Map))throw Error('Invalid live seed cohorts.');for(const [id,r] of rows){if(typeof id!=='string'||!Number.isFinite(r.amount)||r.amount<0)throw Error('Invalid seed quantity.');const keys=Object.keys(r);rowIds.push(intern(ids,id));amounts.push(r.amount);rowOrders.push(internOrder(orders,keys));for(const field of keys){if(field==='amount')continue;let col=columns.get(field);if(!col){col={...dictionary(),indices:[]};columns.set(field,col)}col.indices[n]=intern(col,r[field],ownedMetadata)+1;}n++;}offsets.push(n);}
 kinds[kind]={cells:Int32Array.from(cellIds),offsets:Uint32Array.from(offsets),genomes:ids.values,genomeIndices:Uint32Array.from(rowIds),amounts:Float64Array.from(amounts),orders:orders.values,orderIndices:Uint32Array.from(rowOrders),columns:[...columns].map(([field,col])=>({field,values:col.values,indices:Uint32Array.from({length:n},(_,i)=>col.indices[i]||0)}))};}
 return{codec:'genvo.flora-seed-columns/1',kinds};}
function invalid(){throw Error('Invalid packed seed cohort table.');}
export function unpackFloraSeedBanks(packed){if(packed?.codec!=='genvo.flora-seed-columns/1'||!packed.kinds||typeof packed.kinds!=='object')invalid();const out={};for(const [kind,t] of Object.entries(packed.kinds)){if(!t||!(t.cells instanceof Int32Array)||!(t.offsets instanceof Uint32Array)||!(t.amounts instanceof Float64Array)||!(t.genomeIndices instanceof Uint32Array)||!(t.orderIndices instanceof Uint32Array)||!Array.isArray(t.genomes)||!Array.isArray(t.orders)||!Array.isArray(t.columns))invalid();const n=t.amounts.length;if(t.offsets.length!==t.cells.length+1||t.offsets[0]!==0||t.offsets.at(-1)!==n||t.genomeIndices.length!==n||t.orderIndices.length!==n||new Set(t.genomes).size!==t.genomes.length||t.genomes.some(id=>typeof id!=='string'))invalid();const columns=new Map();for(const c of t.columns){if(!c||typeof c.field!=='string'||c.field==='amount'||columns.has(c.field)||!Array.isArray(c.values)||!(c.indices instanceof Uint32Array)||c.indices.length!==n)invalid();for(const v of c.values)fingerprint(v);for(const j of c.indices)if(j>c.values.length)invalid();columns.set(c.field,c);}
 // Field layouts repeat across many seed cohorts. Validate each used order
 // once, while retaining the original per-row column-presence checks.
 // The decoder owns this cache only for this unpack call, never the live bank.
 const orders=new Map();
 const orderFor=index=>{
  let info=orders.get(index);
  if(info)return info;
  const keys=t.orders[index];
  if(!Array.isArray(keys)||!keys.includes('amount')||new Set(keys).size!==keys.length||keys.some(k=>typeof k!=='string'))invalid();
  info={keys,keySet:new Set(keys),fields:keys.map(k=>k==='amount'?null:columns.get(k))};
  orders.set(index,info);
  return info;
 };
 const cells=new Map();
 for(let c=0;c<t.cells.length;c++){
  const cell=t.cells[c],start=t.offsets[c],end=t.offsets[c+1];
  if(cell<0||cells.has(cell)||start>end||end>n)invalid();
  const rows=new Map();
  for(let i=start;i<end;i++){
   const id=t.genomes[t.genomeIndices[i]];
   if(typeof id!=='string'||rows.has(id)||!Number.isFinite(t.amounts[i])||t.amounts[i]<0)invalid();
   const order=orderFor(t.orderIndices[i]),record={};
   for(let k=0;k<order.keys.length;k++){
    const field=order.keys[k];
    if(field==='amount'){record.amount=t.amounts[i];continue;}
    const column=order.fields[k],j=column?.indices[i];
    if(!j)invalid();
    const value=copyMetadata(column.values[j-1]);
    // Object.fromEntries historically produces an OWN __proto__ property;
    // ordinary assignment changes the prototype instead.
    if(field==='__proto__')Object.defineProperty(record,field,{value,enumerable:true,writable:true,configurable:true});
    else record[field]=value;
   }
   for(const [key,column] of columns)if(column.indices[i]&&!order.keySet.has(key))invalid();
   rows.set(id,record);
  }
  cells.set(cell,rows);
 }
 out[kind]=cells;}
 return out;}
