// Lossless persistence representation only. Live ecological Maps remain authoritative.
// Float64 quantities retain every positive rare cohort; dictionaries encode repetition.
function fingerprint(v){if(v===undefined)return'u';if(v===null)return'n';if(typeof v==='string')return's'+JSON.stringify(v);if(typeof v==='boolean')return'b'+Number(v);if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Invalid seed metadata number.');return'd'+(Object.is(v,-0)?'-0':v)}if(Array.isArray(v))return'a'+JSON.stringify(v.map(fingerprint));if(v&&Object.getPrototypeOf(v)===Object.prototype)return'o'+JSON.stringify(Object.entries(v).map(([k,x])=>[k,fingerprint(x)]));throw Error('Unsupported seed metadata.');}
// Primitive metadata is immutable. Arrays/objects remain independently cloned.
function copyMetadata(value){
 if(value===null||typeof value!=='object')return value;
 if(Array.isArray(value)){
  const len=value.length;let plain=true;
  for(let i=0;i<len;i++){
   if(!(i in value)){plain=false;break;}
   const el=value[i];
   if((el!==null&&typeof el==='object')||typeof el==='function'||typeof el==='symbol'){plain=false;break;}
  }
  if(plain&&Object.keys(value).length===len)return value.slice();
 }
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
const dictionary=()=>({values:[],index:new Map(),strings:new Map(),numbers:new Map(),arr1Num:new Map(),arr2Num:new Map(),arr2Str:new Map(),undef:-1,nil:-1,t:-1,f:-1,negZero:-1,emptyArr:-1});
function intern(d,v,ownedMetadata=false){
 if(typeof v==='string'){let i=d.strings.get(v);if(i===undefined){i=d.values.length;d.strings.set(v,i);d.values.push(v)}return i}
 if(typeof v==='number'){
  if(!Number.isFinite(v))throw Error('Invalid seed metadata number.');
  if(Object.is(v,-0)){if(d.negZero<0){d.negZero=d.values.length;d.values.push(-0)}return d.negZero}
  let i=d.numbers.get(v);if(i===undefined){i=d.values.length;d.numbers.set(v,i);d.values.push(v)}return i;
 }
 if(v===undefined){if(d.undef<0){d.undef=d.values.length;d.values.push(undefined)}return d.undef}
 if(v===null){if(d.nil<0){d.nil=d.values.length;d.values.push(null)}return d.nil}
 if(typeof v==='boolean'){if(v){if(d.t<0){d.t=d.values.length;d.values.push(true)}return d.t}if(d.f<0){d.f=d.values.length;d.values.push(false)}return d.f}
 if(Array.isArray(v)){
  const len=v.length;
  if(len===0&&d.emptyArr>=0)return d.emptyArr;
  if(len===1){
   const x=v[0];
   if(typeof x==='number'&&Number.isFinite(x)&&!Object.is(x,-0)){
    let i=d.arr1Num.get(x);
    if(i!==undefined)return i;
    const cloned=ownedMetadata?v:copyMetadata(v);
    i=d.values.length;d.arr1Num.set(x,i);d.values.push(cloned);return i;
   }
  }else if(len===2){
   const a=v[0],b=v[1];
   if(typeof a==='string'&&typeof b==='string'){
    let sub=d.arr2Str.get(a);
    if(sub){const i=sub.get(b);if(i!==undefined)return i;}
    else{sub=new Map();d.arr2Str.set(a,sub);}
    const cloned=ownedMetadata?v:copyMetadata(v);
    const i=d.values.length;sub.set(b,i);d.values.push(cloned);return i;
   }
   if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&!Object.is(a,-0)&&!Object.is(b,-0)){
    let sub=d.arr2Num.get(a);
    if(sub){const i=sub.get(b);if(i!==undefined)return i;}
    else{sub=new Map();d.arr2Num.set(a,sub);}
    const cloned=ownedMetadata?v:copyMetadata(v);
    const i=d.values.length;sub.set(b,i);d.values.push(cloned);return i;
   }
  }
 }
 const k=fingerprint(v),old=d.index.get(k);if(old!==undefined)return old;const i=d.values.length;d.index.set(k,i);if(k==='a[]')d.emptyArr=i;
 // An offscreen replay can TRANSFER ownership of its detached, soon-discarded
 // runtime metadata into the unique new snapshot. Ordinary callers always
 // receive independent copies, as before.
 d.values.push(ownedMetadata?v:copyMetadata(v));return i;}
// Object.keys supplies a dense string array: native JSON is an unambiguous
// order key without recursively re-tagging every field name for every cohort.
function internOrder(d,keys){const k=JSON.stringify(keys),old=d.index.get(k);if(old!==undefined)return old;const i=d.values.length;d.index.set(k,i);d.values.push([...keys]);return i;}
export function packFloraSeedBanks(seeds,{ownedMetadata=false}={}){const kinds={};for(const [kind,cells] of Object.entries(seeds)){if(!(cells instanceof Map))throw Error('Invalid live seed bank.');let totalRows=0;for(const rows of cells.values())if(rows instanceof Map)totalRows+=rows.size;const cellIds=[],offsets=[0],ids=dictionary(),orders=dictionary(),rowIds=new Uint32Array(totalRows),amounts=new Float64Array(totalRows),rowOrders=new Uint32Array(totalRows),columns=new Map();let n=0,lastKeys=null,lastOrder=-1;
 for(const [cell,rows] of cells){if(!Number.isSafeInteger(cell)||cell<0||cell>2147483647)throw Error('Invalid seed cell.');cellIds.push(cell);if(!(rows instanceof Map))throw Error('Invalid live seed cohorts.');for(const [id,r] of rows){if(typeof id!=='string'||!Number.isFinite(r.amount)||r.amount<0)throw Error('Invalid seed quantity.');const keys=Object.keys(r);rowIds[n]=intern(ids,id);amounts[n]=r.amount;let orderIdx=lastOrder;if(!lastKeys||lastKeys.length!==keys.length){orderIdx=internOrder(orders,keys);lastKeys=keys;lastOrder=orderIdx;}else{for(let k=0;k<keys.length;k++)if(keys[k]!==lastKeys[k]){orderIdx=internOrder(orders,keys);lastKeys=keys;lastOrder=orderIdx;break;}}rowOrders[n]=orderIdx;for(let k=0;k<keys.length;k++){const field=keys[k];if(field==='amount')continue;let col=columns.get(field);if(!col){col={...dictionary(),indices:new Uint32Array(totalRows)};columns.set(field,col)}col.indices[n]=intern(col,r[field],ownedMetadata)+1;}n++;}offsets.push(n);}
 kinds[kind]={cells:Int32Array.from(cellIds),offsets:Uint32Array.from(offsets),genomes:ids.values,genomeIndices:n===totalRows?rowIds:rowIds.slice(0,n),amounts:n===totalRows?amounts:amounts.slice(0,n),orders:orders.values,orderIndices:n===totalRows?rowOrders:rowOrders.slice(0,n),columns:[...columns].map(([field,col])=>({field,values:col.values,indices:col.indices.length===n?col.indices:Uint32Array.from({length:n},(_,i)=>col.indices[i]||0)}))};}
 return{codec:'genvo.flora-seed-columns/1',kinds};}
function invalid(){throw Error('Invalid packed seed cohort table.');}
export function unpackFloraSeedBanks(packed){if(packed?.codec!=='genvo.flora-seed-columns/1'||!packed.kinds||typeof packed.kinds!=='object')invalid();const out={};for(const [kind,t] of Object.entries(packed.kinds)){if(!t||!(t.cells instanceof Int32Array)||!(t.offsets instanceof Uint32Array)||!(t.amounts instanceof Float64Array)||!(t.genomeIndices instanceof Uint32Array)||!(t.orderIndices instanceof Uint32Array)||!Array.isArray(t.genomes)||!Array.isArray(t.orders)||!Array.isArray(t.columns))invalid();const n=t.amounts.length;if(t.offsets.length!==t.cells.length+1||t.offsets[0]!==0||t.offsets.at(-1)!==n||t.genomeIndices.length!==n||t.orderIndices.length!==n||new Set(t.genomes).size!==t.genomes.length||t.genomes.some(id=>typeof id!=='string'))invalid();const columns=new Map();for(const c of t.columns){if(!c||typeof c.field!=='string'||c.field==='amount'||columns.has(c.field)||!Array.isArray(c.values)||!(c.indices instanceof Uint32Array)||c.indices.length!==n)invalid();const sliceable=new Uint8Array(c.values.length);for(let m=0;m<c.values.length;m++){const v=c.values[m];if(v===undefined||v===null||typeof v==='string'||typeof v==='boolean')continue;if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Invalid seed metadata number.');continue;}if(Array.isArray(v)){let prim=true;for(let k=0;k<v.length;k++){if(!(k in v)){prim=false;break;}const x=v[k];if(!(x===undefined||x===null||typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isFinite(x)))){prim=false;break;}}if(prim&&Object.keys(v).length===v.length){sliceable[m]=1;continue;}}fingerprint(v);}for(const j of c.indices)if(j>c.values.length)invalid();columns.set(c.field,{field:c.field,values:c.values,indices:c.indices,sliceable});}
 // Field layouts repeat across many seed cohorts. Validate each used order
 // once, while retaining the original per-row column-presence checks.
 // The decoder owns this cache only for this unpack call, never the live bank.
 const orders=new Map(),allColumns=[...columns.values()];
 const orderFor=index=>{
  let info=orders.get(index);
  if(info)return info;
  const keys=t.orders[index];
  if(!Array.isArray(keys)||!keys.includes('amount')||new Set(keys).size!==keys.length||keys.some(k=>typeof k!=='string'))invalid();
  const keySet=new Set(keys);
  info={keys,keySet,fields:keys.map(k=>k==='amount'?null:columns.get(k)),extraColumns:allColumns.filter(col=>!keySet.has(col.field))};
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
    const raw=column.values[j-1],value=raw===null||typeof raw!=='object'?raw:column.sliceable[j-1]?raw.slice():copyMetadata(raw);
    // Object.fromEntries historically produces an OWN __proto__ property;
    // ordinary assignment changes the prototype instead.
    if(field==='__proto__')Object.defineProperty(record,field,{value,enumerable:true,writable:true,configurable:true});
    else record[field]=value;
   }
   for(let e=0;e<order.extraColumns.length;e++)if(order.extraColumns[e].indices[i])invalid();
   rows.set(id,record);
  }
  cells.set(cell,rows);
 }
 out[kind]=cells;}
 return out;}
