// The frozen source is the exact live decoder before row-allocation refactor.
// Check packed format, bytewise Float64 amounts, field order, unusual keys,
// mutable isolation, historical array extensions and malformed tables.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {packFloraSeedBanks,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
const oldSource=fs.readFileSync(new URL('../docs/performance/flora-seed-codec-before-row-decoder-2026-10-19.txt',import.meta.url),'utf8');
const old=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
const unusual=[1,2];unusual.date=new Date(123);unusual.mapping=new Map([['entry',{x:2}]]);
const proto={sub:{flag:true}};const rare={amount:Number.MIN_VALUE,originCell:9,nested:{alias:proto,other:proto},
  metadata:unusual,parentGenomeIds:['mother','father'],depositIds:[1,9],undefinedField:undefined};
Object.defineProperty(rare,'__proto__',{value:{safe:true},enumerable:true,writable:true,configurable:true});
const seeds={bramble:new Map(),woodspire:new Map([[17,new Map()]])};
for(let cell=0;cell<90;cell++){
 const rows=new Map();
 for(let i=0;i<28;i++){
  const id='g'+i,record=i===0?structuredClone(rare):{};
  if(i!==0){
   const fields=[['amount',i===1?-0:2**-100*(i+1)],['originCell',cell],['producerId',i%2?'shared':null],
     ['parentGenomeIds',['x','y']],['mode',i%3?'clonal':'sexual'],['route','animal'],['selfing',i%2===0],
     ['undefinedField',undefined],['depositIds',i%2?[5]:[1,3]],['nested',{arr:[i,i+1],own:undefined}]];
   if(i%2)fields.reverse();
   if(i%5===0)fields.splice(fields.findIndex(([k])=>k==='nested'),1);
   Object.assign(record,Object.fromEntries(fields));
  }
  rows.set(id,record);
 }
 seeds.bramble.set(cell,rows);
}
const packed=packFloraSeedBanks(seeds),referencePacked=old.packFloraSeedBanks(seeds);
assert.ok(isDeepStrictEqual(packed,referencePacked),'on-disk column dictionaries and ordering unchanged');
const result=unpackFloraSeedBanks(structuredClone(packed));
assert.ok(isDeepStrictEqual(result,old.unpackFloraSeedBanks(structuredClone(packed))),'decoded content matches frozen decoder');
assert.deepEqual(result,seeds,'all living cohort metadata restored');
const decodedRare=result.bramble.get(0).get('g0');
assert.ok(Object.hasOwn(decodedRare,'__proto__'),'metadata property is not prototype mutation');
assert.equal(Object.getPrototypeOf(decodedRare),Object.prototype);
assert.equal(decodedRare.nested.alias,decodedRare.nested.other,'nested aliases preserved within one record');
assert.deepEqual(decodedRare.metadata.mapping,unusual.mapping);
const shared=result.bramble.get(0).get('g1');
const other=result.bramble.get(1).get('g1');
shared.parentGenomeIds.push('edited');
assert.deepEqual(other.parentGenomeIds,['x','y'],'records do not share mutable arrays');
assert.deepEqual(unpackFloraSeedBanks(packed),seeds,'decoding cannot mutate packed source or future reads');
const changed=[
 p=>p.kinds.bramble.orders[0]=['amount','amount'],
 p=>p.kinds.bramble.orders[0]=null,
 p=>p.kinds.bramble.orderIndices[0]=999,
 p=>p.kinds.bramble.columns[0].indices[0]=999,
 p=>p.kinds.bramble.amounts[0]=NaN,
 p=>p.kinds.bramble.genomeIndices[0]=999,
 p=>p.kinds.bramble.offsets[1]=999999,
 p=>p.kinds.bramble.cells[1]=0,
 p=>p.kinds.bramble.columns[0].indices[1]=0,
 p=>p.kinds.bramble.columns[0].indices[1]=1
];
for(const mutate of changed){
 const corrupted=structuredClone(packed);mutate(corrupted);
 const oldFailure=(()=>{try{old.unpackFloraSeedBanks(structuredClone(corrupted));return false}catch{return true}})();
 const newFailure=(()=>{try{unpackFloraSeedBanks(structuredClone(corrupted));return false}catch{return true}})();
 assert.equal(newFailure,oldFailure,'corruption reject/accept behavior matches old decoder');
}
console.log('Frozen flora decoder parity: 2,520 cohorts, rare Float64, aliases, own __proto__, array extensions, independent metadata and malformed tables PASS');
