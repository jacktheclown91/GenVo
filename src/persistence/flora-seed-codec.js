// Lossless persistence representation only. Live ecological Maps remain authoritative.
// Float64 quantities retain every positive rare cohort; dictionaries encode repetition.
import {drain} from '../sim/resumable.js';
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
export function unpackFloraSeedBanks(packed){if(packed?.codec===SEED_COLUMNS_2)return unpackSeedColumns2(packed);if(packed?.codec!=='genvo.flora-seed-columns/1'||!packed.kinds||typeof packed.kinds!=='object')invalid();const out={};for(const [kind,t] of Object.entries(packed.kinds)){if(!t||!(t.cells instanceof Int32Array)||!(t.offsets instanceof Uint32Array)||!(t.amounts instanceof Float64Array)||!(t.genomeIndices instanceof Uint32Array)||!(t.orderIndices instanceof Uint32Array)||!Array.isArray(t.genomes)||!Array.isArray(t.orders)||!Array.isArray(t.columns))invalid();const n=t.amounts.length;if(t.offsets.length!==t.cells.length+1||t.offsets[0]!==0||t.offsets.at(-1)!==n||t.genomeIndices.length!==n||t.orderIndices.length!==n||new Set(t.genomes).size!==t.genomes.length||t.genomes.some(id=>typeof id!=='string'))invalid();const columns=new Map();for(const c of t.columns){if(!c||typeof c.field!=='string'||c.field==='amount'||columns.has(c.field)||!Array.isArray(c.values)||!(c.indices instanceof Uint32Array)||c.indices.length!==n)invalid();const sliceable=new Uint8Array(c.values.length);for(let m=0;m<c.values.length;m++){const v=c.values[m];if(v===undefined||v===null||typeof v==='string'||typeof v==='boolean')continue;if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Invalid seed metadata number.');continue;}if(Array.isArray(v)){let prim=true;for(let k=0;k<v.length;k++){if(!(k in v)){prim=false;break;}const x=v[k];if(!(x===undefined||x===null||typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isFinite(x)))){prim=false;break;}}if(prim&&Object.keys(v).length===v.length){sliceable[m]=1;continue;}}fingerprint(v);}for(const j of c.indices)if(j>c.values.length)invalid();columns.set(c.field,{field:c.field,values:c.values,indices:c.indices,sliceable});}
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
// Seed columns /2: the same rows, field orders and decoded records as /1, with
// typed per-field columns. Finite numbers, strings, null/undefined/booleans and
// plain arrays of finite numbers or of strings need no per-value object or
// dictionary lookup; every other value keeps the /1 dictionary and validation.
// Saves and regional checkpoints write /2; /1 tables remain readable.
export const SEED_COLUMNS_2='genvo.flora-seed-columns/2';
const TAG={absent:0,number:1,string:2,nil:3,undef:4,t:5,f:6,numbers:7,strings:8,other:9};
// 'number' or 'string' for a dense plain array whose elements are all finite
// numbers or all strings (an empty array is 'number'); otherwise null.
function plainArrayType(v){
 if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype)return null;
 const n=v.length,type=n&&typeof v[0]==='string'?'string':'number';
 for(let i=0;i<n;i++){if(!(i in v))return null;const x=v[i];if(type==='number'?typeof x!=='number'||!Number.isFinite(x):typeof x!=='string')return null}
 return Object.keys(v).length===n?type:null;
}
function typedColumn(field,n){return{field,n,tags:new Uint8Array(n),numbers:null,refs:null,lengths:null,flatNumbers:[],flatRefs:[],strings:[],stringIndex:new Map(),lastString:undefined,lastRef:0,dictionary:dictionary()}}
function stringRef(col,v){if(v===col.lastString)return col.lastRef;let i=col.stringIndex.get(v);col.lastString=v;if(i===undefined){i=col.strings.length;col.stringIndex.set(v,i);col.strings.push(v)}col.lastRef=i;return i}
function encodeTyped(col,i,v,ownedMetadata){
 if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Invalid seed metadata number.');(col.numbers||=new Float64Array(col.n))[i]=v;col.tags[i]=TAG.number;return}
 if(typeof v==='string'){(col.refs||=new Uint32Array(col.n))[i]=stringRef(col,v);col.tags[i]=TAG.string;return}
 if(v===null){col.tags[i]=TAG.nil;return}
 if(v===undefined){col.tags[i]=TAG.undef;return}
 if(v===true||v===false){col.tags[i]=v?TAG.t:TAG.f;return}
 const array=plainArrayType(v);
 if(array==='number'){(col.refs||=new Uint32Array(col.n))[i]=col.flatNumbers.length;(col.lengths||=new Uint32Array(col.n))[i]=v.length;for(const x of v)col.flatNumbers.push(x);col.tags[i]=TAG.numbers;return}
 if(array==='string'){(col.refs||=new Uint32Array(col.n))[i]=col.flatRefs.length;(col.lengths||=new Uint32Array(col.n))[i]=v.length;for(const x of v)col.flatRefs.push(stringRef(col,x));col.tags[i]=TAG.strings;return}
 (col.refs||=new Uint32Array(col.n))[i]=intern(col.dictionary,v,ownedMetadata);col.tags[i]=TAG.other;
}
export function packFloraSeedColumns(seeds,options){return drain(packFloraSeedColumnsSteps(seeds,options))}
// Resumable for a caller that exclusively owns the bank until packing ends.
export function* packFloraSeedColumnsSteps(seeds,{ownedMetadata=false}={}){const kinds={};let sinceYield=0;for(const [kind,cells] of Object.entries(seeds)){if(!(cells instanceof Map))throw Error('Invalid live seed bank.');let totalRows=0;for(const rows of cells.values())if(rows instanceof Map)totalRows+=rows.size;
 const cellIds=[],offsets=[0],ids=dictionary(),orders=dictionary(),rowIds=new Uint32Array(totalRows),amounts=new Float64Array(totalRows),rowOrders=new Uint32Array(totalRows),columns=new Map();let n=0,lastKeys=null,lastOrder=-1,lastCols=null;const orderColumns=new Map();
 // Columns in each field order's key order (null for amount), resolved once per order.
 const columnsFor=(orderIdx,keys)=>{let cols=orderColumns.get(orderIdx);if(!cols){cols=keys.map(field=>{if(field==='amount')return null;let col=columns.get(field);if(!col){col=typedColumn(field,totalRows);columns.set(field,col)}return col});orderColumns.set(orderIdx,cols)}return cols};
 for(const [cell,rows] of cells){if(!Number.isSafeInteger(cell)||cell<0||cell>2147483647)throw Error('Invalid seed cell.');cellIds.push(cell);if(!(rows instanceof Map))throw Error('Invalid live seed cohorts.');
  for(const [id,r] of rows){if(typeof id!=='string'||!Number.isFinite(r.amount)||r.amount<0)throw Error('Invalid seed quantity.');const keys=Object.keys(r);rowIds[n]=intern(ids,id);amounts[n]=r.amount;
   let orderIdx=lastOrder;if(!lastKeys||lastKeys.length!==keys.length){orderIdx=internOrder(orders,keys);lastKeys=keys;lastOrder=orderIdx;lastCols=columnsFor(orderIdx,keys)}else{for(let k=0;k<keys.length;k++)if(keys[k]!==lastKeys[k]){orderIdx=internOrder(orders,keys);lastKeys=keys;lastOrder=orderIdx;lastCols=columnsFor(orderIdx,keys);break}}rowOrders[n]=orderIdx;
   for(let k=0;k<keys.length;k++){const col=lastCols[k];if(col)encodeTyped(col,n,r[keys[k]],ownedMetadata)}n++}
  offsets.push(n);if((sinceYield+=rows.size)>=4096){sinceYield=0;yield}}
 const fit=a=>!a||a.length===n?a:a.slice(0,n);
 kinds[kind]={cells:Int32Array.from(cellIds),offsets:Uint32Array.from(offsets),genomes:ids.values,genomeIndices:fit(rowIds),amounts:fit(amounts),orders:orders.values,orderIndices:fit(rowOrders),
  columns:[...columns.values()].map(c=>({field:c.field,tags:fit(c.tags),numbers:fit(c.numbers),refs:fit(c.refs),lengths:fit(c.lengths),flatNumbers:Float64Array.from(c.flatNumbers),flatRefs:Uint32Array.from(c.flatRefs),strings:c.strings,values:c.dictionary.values}))};}
 return{codec:SEED_COLUMNS_2,kinds};}
function unpackSeedColumns2(packed){if(!packed.kinds||typeof packed.kinds!=='object')invalid();const out={};
 for(const [kind,t] of Object.entries(packed.kinds)){
  if(!t||!(t.cells instanceof Int32Array)||!(t.offsets instanceof Uint32Array)||!(t.amounts instanceof Float64Array)||!(t.genomeIndices instanceof Uint32Array)||!(t.orderIndices instanceof Uint32Array)||!Array.isArray(t.genomes)||!Array.isArray(t.orders)||!Array.isArray(t.columns))invalid();
  const n=t.amounts.length;if(t.offsets.length!==t.cells.length+1||t.offsets[0]!==0||t.offsets.at(-1)!==n||t.genomeIndices.length!==n||t.orderIndices.length!==n||new Set(t.genomes).size!==t.genomes.length||t.genomes.some(id=>typeof id!=='string'))invalid();
  const columns=new Map();
  for(const c of t.columns){
   if(!c||typeof c.field!=='string'||c.field==='amount'||columns.has(c.field)||!(c.tags instanceof Uint8Array)||c.tags.length!==n||!(c.flatNumbers instanceof Float64Array)||!(c.flatRefs instanceof Uint32Array)||!Array.isArray(c.strings)||!Array.isArray(c.values))invalid();
   for(const [key,type] of [['numbers',Float64Array],['refs',Uint32Array],['lengths',Uint32Array]])if(c[key]!==null&&!(c[key] instanceof type&&c[key].length===n))invalid();
   if(c.strings.some(v=>typeof v!=='string')||c.flatNumbers.some(v=>!Number.isFinite(v)))invalid();
   for(const r of c.flatRefs)if(r>=c.strings.length)invalid();
   for(const v of c.values)if(typeof v==='number'&&!Number.isFinite(v))invalid();
   columns.set(c.field,c);
  }
  const value=(c,i)=>{const tag=c.tags[i];switch(tag){
   case TAG.number:{if(!c.numbers)invalid();const v=c.numbers[i];if(!Number.isFinite(v))invalid();return v}
   case TAG.string:{if(!c.refs||c.refs[i]>=c.strings.length)invalid();return c.strings[c.refs[i]]}
   case TAG.nil:return null;case TAG.undef:return undefined;case TAG.t:return true;case TAG.f:return false;
   case TAG.numbers:case TAG.strings:{if(!c.refs||!c.lengths)invalid();const start=c.refs[i],len=c.lengths[i],flat=tag===TAG.numbers?c.flatNumbers:c.flatRefs;if(start+len>flat.length)invalid();
    const out=new Array(len);for(let k=0;k<len;k++)out[k]=tag===TAG.numbers?flat[start+k]:c.strings[flat[start+k]];return out}
   case TAG.other:{if(!c.refs||c.refs[i]>=c.values.length)invalid();const raw=c.values[c.refs[i]];return raw===null||typeof raw!=='object'?raw:copyMetadata(raw)}
   default:return invalid()}};
  const orders=new Map(),allColumns=[...columns.values()];
  const orderFor=index=>{let info=orders.get(index);if(info)return info;const keys=t.orders[index];
   if(!Array.isArray(keys)||!keys.includes('amount')||new Set(keys).size!==keys.length||keys.some(k=>typeof k!=='string'))invalid();
   const keySet=new Set(keys);info={keys,fields:keys.map(k=>k==='amount'?null:columns.get(k)),extraColumns:allColumns.filter(col=>!keySet.has(col.field))};
   if(info.fields.some((c,k)=>keys[k]!=='amount'&&!c))invalid();orders.set(index,info);return info};
  const cells=new Map();
  for(let ci=0;ci<t.cells.length;ci++){const cell=t.cells[ci],start=t.offsets[ci],end=t.offsets[ci+1];if(cell<0||cells.has(cell)||start>end||end>n)invalid();const rows=new Map();
   for(let i=start;i<end;i++){const id=t.genomes[t.genomeIndices[i]];if(typeof id!=='string'||rows.has(id)||!Number.isFinite(t.amounts[i])||t.amounts[i]<0)invalid();
    const order=orderFor(t.orderIndices[i]),record={};
    for(let k=0;k<order.keys.length;k++){const field=order.keys[k];if(field==='amount'){record.amount=t.amounts[i];continue}const column=order.fields[k];if(column.tags[i]===TAG.absent)invalid();const v=value(column,i);
     if(field==='__proto__')Object.defineProperty(record,field,{value:v,enumerable:true,writable:true,configurable:true});else record[field]=v}
    for(let e=0;e<order.extraColumns.length;e++)if(order.extraColumns[e].tags[i]!==TAG.absent)invalid();
    rows.set(id,record)}
   cells.set(cell,rows)}
  out[kind]=cells}
 return out;}
