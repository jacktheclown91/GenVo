// Repeatable isolated packed-seed decoding timing against the frozen original.
// Decode to independent Maps with unchanged orders and identities. Young synthetic
// cohorts are NOT a mature 100-day world or an in-browser frame timing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {isDeepStrictEqual} from 'node:util';
import {packFloraSeedBanks,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
const frozen=fs.readFileSync(new URL('../docs/performance/flora-seed-codec-before-row-decoder-2026-10-19.txt',import.meta.url),'utf8');
const reference=await import('data:text/javascript;base64,'+Buffer.from(frozen).toString('base64'));
const cells=new Map(),CELL_COUNT=1000,GENOMES_PER_CELL=25;
for(let cell=0;cell<CELL_COUNT;cell++){
 const cohorts=new Map();
 for(let i=0;i<GENOMES_PER_CELL;i++)cohorts.set('genome-'+i,{
  amount:(i+1)*1e-24,
  producerId:i%3?'shared producer':null,originCell:cell,
  route:i%2?'sexual-release':'animal-contact',
  parentGenomeIds:['dam-'+i,'sire-'+i],parentProducerIds:['a','b'],
  depositIds:[1,2],selfing:i%2===0,mutation:i*.002,coatMutation:0,
  extra:{mode:i%2?'clonal':'sexual',notes:[null,cell]}
 });
 cells.set(cell,cohorts);
}
const packed=packFloraSeedBanks({bramble:cells}),samples={before:[],after:[]};
const timed=(label,fn)=>{const start=performance.now(),output=fn(packed);samples[label].push(performance.now()-start);return output;};
const baseline=reference.unpackFloraSeedBanks(packed),current=unpackFloraSeedBanks(packed);
assert.ok(isDeepStrictEqual(baseline,current));
for(const label of ['before','after','after','before']){
 const output=timed(label,label==='before'?reference.unpackFloraSeedBanks:unpackFloraSeedBanks);
 assert.ok(isDeepStrictEqual(output,baseline),'no loss of rare cohorts or metadata during timed decoding');
}
const mean=values=>Math.round(values.reduce((a,b)=>a+b,0)/values.length*100)/100;
const round=a=>a.map(x=>Math.round(x*100)/100);
console.log(JSON.stringify({
 scope:'25,000 synthetic seed cohorts; one warmed decode per arm per pair; measured Node, not mature-world frames',
 cells:CELL_COUNT,cohorts:CELL_COUNT*GENOMES_PER_CELL,
 meanMs:{original:mean(samples.before),optimized:mean(samples.after)},
 samplesMs:{original:round(samples.before),optimized:round(samples.after)},
 fullDecodedMetadataParity:true
},null,2));
