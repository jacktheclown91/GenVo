import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {packFloraSeedBanks,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
const frozen=fs.readFileSync(new URL('../docs/performance/flora-seed-codec-before-metadata-fastpath.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(frozen).digest('hex'),'888a8fc4b97c4418021d01159e47e2cafc14af09300815d4aab37afc89713419');
const before=await import('data:text/javascript;base64,'+Buffer.from(frozen).toString('base64'));
const seeds={bramble:new Map()},shared=[1,2];
for(let cell=0;cell<200;cell++){
 const rows=new Map();seeds.bramble.set(cell,rows);
 for(let n=0;n<40;n++){
  const fields=[['amount',n===0?Number.MIN_VALUE:n===1?-0:1e-20*(n+1)],['originCell',cell],['producerId',n%3?'same-producer':null],['depositIds',shared],['parentGenomeIds',['mother','father']],['selfing',n%2===0],['optional',undefined],['signed',-0],['nested',{ordered:['x',null,undefined],value:n%3}],['route','s"\u0000quoted']];
  if(n%2)fields.reverse();if(n%3===0)fields.splice(fields.findIndex(([k])=>k==='optional'),1);
  rows.set('g'+n,Object.fromEntries(fields));
 }
}
const unchanged=structuredClone(seeds),packed=packFloraSeedBanks(seeds),reference=before.packFloraSeedBanks(seeds);
assert.deepEqual(packed,reference,'entire old-format table, including order/dictionaries/Float64 values, unchanged');
assert.deepEqual(unpackFloraSeedBanks(packed),before.unpackFloraSeedBanks(reference));
assert.deepEqual(unpackFloraSeedBanks(reference),seeds,'older codec output remains readable');
assert.deepEqual(before.unpackFloraSeedBanks(packed),seeds,'new codec output remains readable by old decoder');
assert.deepEqual(seeds,unchanged,'encoding does not mutate any live cohort');
const decoded=unpackFloraSeedBanks(packed);decoded.bramble.get(0).get('g0').depositIds.push(99);
assert.deepEqual(decoded.bramble.get(0).get('g1').depositIds,[1,2],'mutable metadata must remain isolated between cohorts');
assert.deepEqual(unpackFloraSeedBanks(packed),seeds,'decoded edits cannot mutate packed metadata');
for(const value of [NaN,Infinity,new Date(0),new Map()]){
 const bad={bramble:new Map([[1,new Map([['g',{amount:1,metadata:value}]])]])};
 assert.throws(()=>packFloraSeedBanks(bad));assert.throws(()=>before.packFloraSeedBanks(bad));
}
console.log('8,000 seed cohorts: exact frozen-codec table/ordering/rare-value parity, bidirectional compatibility and mutable metadata isolation PASS');
