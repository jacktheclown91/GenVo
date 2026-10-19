// Isolated finite seed-cohort benchmark, NOT a substitute for mature-world
// conservation or browser FPS. Synthetic bank is deterministic and retains all
// positive rare cohorts. Compare the previous loops with current runtime code.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {scaleSeedCohorts} from '../src/ecology/flora-inheritance.js';

const CELLS=8192,COHORTS=20,KIND='bramble',DAYS=3,DECAY=.982;
const sum=rows=>{let n=0;for(const r of rows.values())n+=r.amount;return n;};
function fixture(){
 const bank=new Float32Array(CELLS),cells=new Map(),active=new Set(),litter=new Float64Array(CELLS);
 for(let i=0;i<CELLS;i++){
  const v=Math.fround(.13+(i%37)*.011);bank[i]=v;
  const rows=new Map();
  for(let j=0;j<COHORTS;j++)rows.set('variant:'+j,{amount:v/COHORTS,originCell:i,route:j%2?'gut':'local'});
  cells.set(i,rows);active.add(i);
 }
 const d={sim:{world:{len:CELLS}},floraState:{seeds:{[KIND]:cells}},bankGenomes:{[KIND]:new Map()},
   active:{[KIND]:active},seedBank:k=>k===KIND?bank:null};
 return{bank,cells,active,litter,d};
}
function oldScale(d,i,next){
 const rows=d.floraState.seeds[KIND].get(i),stock=d.seedBank(KIND)[i],total=sum(rows);
 if(Math.abs(stock-total)>1e-7){
  if(stock<=0)rows.clear();
  else if(total>0){const factor=stock/total;for(const row of rows.values())row.amount*=factor;}
 }
 const before=sum(rows),factor=before>0?next/before:0;
 for(const row of rows.values())row.amount*=factor;
}
function pass(f,mode){
 let t0=performance.now();
 for(let day=0;day<DAYS;day++){
  const iter=mode==='baseline'?[...f.active]:f.active;
  for(const i of iter){
   const before=f.bank[i],next=before*DECAY;
   if(mode==='baseline')oldScale(f.d,i,next);
   else scaleSeedCohorts(f.d,KIND,i,next);
   f.bank[i]=next;
   if(f.bank[i]<=0){f.active.delete(i);f.cells.delete(i);}
   f.litter[i]+=before-f.bank[i];
  }
 }
 return performance.now()-t0;
}
function parity(a,b){
 assert.deepEqual(a.bank,b.bank);
 assert.deepEqual(a.litter,b.litter);
 assert.deepEqual([...a.active],[...b.active]);
 for(const [i,rows] of a.cells){
  const match=b.cells.get(i);assert.ok(match&&match.size===rows.size);
  for(const [id,old] of rows){
   const now=match.get(id);
   assert.ok(now, 'missing positive cohort '+i+':'+id);
   assert.ok(Object.is(old.amount,now.amount),'lost or rounded cohort '+i+':'+id);
   assert.deepEqual(now,old);
  }
 }
}
const samples={baseline:[],current:[]};
for(const mode of ['baseline','current','current','baseline']){
 const f=fixture(),duration=pass(f,mode);samples[mode].push(Math.round(duration*100)/100);
 if(!globalThis.reference)globalThis.reference=f;
 else parity(globalThis.reference,f);
}
const avg=a=>Math.round(a.reduce((sum,v)=>sum+v,0)/a.length*100)/100;
console.log(JSON.stringify({kind:'synthetic seed bank, not mature world',cells:CELLS,cohorts:CELLS*COHORTS,days:DAYS,
  meanMs:{before:avg(samples.baseline),after:avg(samples.current)},samples,positiveAmountsPreserved:true},null,2));
