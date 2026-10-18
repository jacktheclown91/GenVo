import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {WORLD_PAGE_SIZE} from '../src/world/pages.js';
import {visitLandByWorldPage,validatePageDayWork,beginPageVegetationDay} from '../src/world/page-vegetation-work.js';

assert.equal(WORLD_PAGE_SIZE,64,'D1 retains the canonical 64-tile view page size');
// Actual visitation is the original row-major i order, even on partial pages
// and across page seams. No cell is visited twice, and open water is omitted.
const n=70,len=n*n,water=new Uint8Array(len),seen=[];
for(const i of [0,63,64,70,69*70+69])water[i]=1;
const grid=2,counts=visitLandByWorldPage({n,len,water},i=>seen.push(i));
assert.ok(counts instanceof Uint32Array);
assert.equal(counts.length,grid*grid);
assert.deepEqual(seen,Array.from({length:len},(_,i)=>i).filter(i=>!water[i]),'exact original index order, with no gaps or duplicates');
assert.equal(counts.reduce((sum,x)=>sum+x,0),len-5);
assert.equal(counts[3],36-1,'partial southeast page is accurately counted');
const snap=s=>structuredClone(createSimulationSnapshot(s,{reason:'d1-vegetation',savedAt:'fixed'}));
const a=new Simulation('D1-PAGE-VEGETATION',{player:false}),b=new Simulation('D1-PAGE-VEGETATION',{player:false});
const before=snap(a);
b.world.pages.window(4,4,8,8);b.world.pages.unload(1,1);b.world.pages.unload(1,0);
assert.deepEqual(snap(a),before);assert.deepEqual(snap(b),before,'view lifecycle does not own producers');
for(let k=0;k<48;k++){a.update(null);b.update(null)}
assert.deepEqual(snap(b),snap(a),'normal real daily producer/fungal work independent of loaded pages');
const receipt=a.pageDayWork;
assert.ok(receipt&&receipt.schema===1&&receipt.lastDay===1&&receipt.pendingDay===null,'physical phase has a completed receipt');
validatePageDayWork(receipt,a.world);
const expectedLand=a.world.water.reduce((sum,w)=>sum+(w?0:1),0);
assert.equal(receipt.processed,expectedLand,'every land cell is processed exactly once');
assert.equal(receipt.counts.reduce((sum,v)=>sum+v,0),expectedLand,'page receipts reconcile with canonical world');
const day=a.day;assert.ok(day>receipt.lastDay);
a.phaseVegetation({once:true});b.phaseVegetation({once:true});
const after=snap(a);
assert.deepEqual(snap(b),after,'manual next-day page work preserves page-cache neutrality');
const stateBefore=structuredClone(a.rng.state);
a.phaseVegetation({once:true});
assert.deepEqual(snap(a),after,'same-day repeat cannot mint another plant, fungus, seed or mineral');
assert.equal(a.rng.state,stateBefore,'same-day repeat consumes no RNG');
assert.equal(a.pageDayWork.lastDay,day);
assert.deepEqual(snap(restoreSimulationSnapshot(structuredClone(after))),after,'saved receipts roundtrip exactly');
const broken=structuredClone(after);broken.core.pageDayWork.counts[0]=999999;
assert.throws(()=>restoreSimulationSnapshot(broken),/vegetation page work counts/i,'oversubscribed page receipts are rejected');
const partial=structuredClone(after);partial.core.pageDayWork.pendingDay=partial.core.pageDayWork.lastDay+1;
assert.throws(()=>restoreSimulationSnapshot(partial),/Invalid saved vegetation page work receipt/,'partial phase is rejected rather than replaying a half-day');
const future=structuredClone(after);future.core.pageDayWork.lastDay+=20;
assert.throws(()=>restoreSimulationSnapshot(future),/vegetation.*future/i,'future page day is not a valid checkpoint');
const legacy=structuredClone(after);delete legacy.core.pageDayWork;
assert.deepEqual(snap(restoreSimulationSnapshot(legacy)),legacy,'old schema-10 saves without a receipt remain unchanged');
// Across another complete day of normal updates, page eviction must not alter
// the actual producer, fungi, fauna, resource receipts or saved identities.
for(let k=0;k<48;k++){
 if(k%8===0){b.world.pages.window(k,10,12,12);b.world.pages.unload(0,0);b.world.pages.unload(1,1)}
 a.update(null);b.update(null)
}
assert.deepEqual(snap(a),snap(b),'continued real ecology remains bit-identical after view eviction');
const restored=restoreSimulationSnapshot(structuredClone(snap(a)));
for(let k=0;k<60;k++){a.update(null);restored.update(null)}
assert.deepEqual(snap(a),snap(restored),'save-resumed page-scheduled ecology is bit-identical');
console.log('D1 vegetation: real exact-once land work, row order, page accounting, legacy/corrupt saves and resume PASS');
