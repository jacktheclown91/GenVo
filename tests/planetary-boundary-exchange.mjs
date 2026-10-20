// Planetary/2 environment law: visible freshwater and marine border stocks
// exchange finite salt with the adjacent immutable geography reservoir.
// Regional salt is neither silently reset nor injected without receipts.
// Existing schema-1 worlds retain historical boundary behavior on restoration.
import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {advanceEnvironmentWater,saltStorage,validateEnvironment} from '../src/world/environment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const w=new World(seed,{generator:'planetary/1',planetOrigin:origin});
const e=w.environment;
assert.equal(e.boundaryWaterPolicy,'geography-reservoir-water/2');
assert.equal(e.schema,6,'new planetary regions support runoff-funded inundation and audited marine boundaries');
validateEnvironment(w,e);
const marine=[],fresh=[],mixed=[];
for(let i=0;i<w.len;i++){
 if(e.boundary[i]===2)marine.push(i);
 if(e.boundary[i]===1)fresh.push(i);
 if(e.boundary[i]===3)mixed.push(i);
 if(e.boundary[i])assert.ok(w.water[i]&&
  (i%w.n===0||i%w.n===w.n-1||i<w.n||i>=w.len-w.n),
  'every reservoir is a true exposed wet planetary edge');
}
assert.ok(marine.length>0,'previously documented mixed land/sea region touches the exterior ocean');
assert.ok(w.water.some(Boolean)&&w.water.some(v=>!v),'region contains naturally formed ocean and land');

const firstMarine=marine[0],start=e.salt[firstMarine],depth=e.depth[firstMarine];
const baseline=saltStorage(w);
const climate={temp:.6,rain:.48};
const receipts=[];
for(let day=1;day<=12;day++){
 const receipt=advanceEnvironmentWater(w,climate,day);
 receipts.push(receipt);
 assert.ok(Math.abs(receipt.closure)<1e-7,'all finite ocean/river inputs and exports close the salt budget');
 assert.ok(receipt.boundaryInput>=0&&receipt.boundaryOutput>=0);
 assert.ok(receipt.boundaryInput<=receipt.input+1e-8);
 assert.ok(receipt.boundaryOutput<=receipt.output+1e-8);
 validateEnvironment(w,e);
}
assert.ok(e.totals.boundaryInput>0,'actual coastal replenishment enters from geography-declared ocean');
assert.ok(e.totals.boundaryWaterInput>0&&e.totals.boundaryWaterOutput>0,'real equal water exchanges are recorded at marine edges');
assert.ok(Math.abs(e.totals.boundaryWaterInput-e.totals.boundaryWaterOutput)<1e-8,'external ocean water replacement is volume-neutral');
assert.ok(e.totals.boundarySaltInput>0&&e.totals.boundarySaltOutput>0,'real imported and exported dissolved salt are distinguished');
assert.ok(e.totals.saltOutput>=0,'retained freshwater need not expel dissolved salt');
assert.ok(e.totals.surfaceRainInput>0&&e.totals.surfaceRainOutput>=0,
 'newly retained precipitation and any full-capacity overflow are accounted separately');
assert.ok(Math.abs(saltStorage(w)-baseline-e.totals.saltInput+e.totals.saltOutput)<1e-7,
 'cumulative 12-day salt storage balances recorded external input and output');
assert.ok(e.salt[firstMarine]!==depth||start!==depth,'boundary state is not overwritten to a fixed salinity every day');
const testNeighbor=(dx,dy,dir)=>{
 const other=new World(seed,{generator:'planetary/1',planetOrigin:{x:origin.x+dx,y:origin.y+dy}});
 const n=w.n;
 let trueCrossings=0;
 for(let k=0;k<n;k++){
  const i=dir==='east'?k*n+n-1:dir==='west'?k*n:dir==='south'?(n-1)*n+k:k;
  const j=dir==='east'?k*n:dir==='west'?k*n+n-1:dir==='south'?k:(n-1)*n+k;
  if(w.water[i]&&other.water[j]){
   trueCrossings++;
   assert.ok(e.boundary[i]>0,'connected adjacent region has a declared border condition');
  }
 }
 return trueCrossings;
};
const east=testNeighbor(128,0,'east'),west=testNeighbor(-128,0,'west'),
 north=testNeighbor(0,-128,'north'),south=testNeighbor(0,128,'south');
assert.ok(east+west+north+south>0,'natural neighboring planetary waters cross at least one true world border');

const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'planetary-boundary-exchange'}));
const sim=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
for(let i=0;i<CFG.dayTicks+3;i++)sim.update(null);
const initial=snap(sim),restored=restoreSimulationSnapshot(structuredClone(initial));
assert.deepEqual(snap(restored),initial,'new boundary schema and daily receipts survive save/load intact');
for(let i=0;i<CFG.lifeStride+3;i++){sim.update(null);restored.update(null)}
assert.deepEqual(snap(restored),snap(sim),'natural physical and biological continuation after save remains exact');

// Legacy planetary/1 environment payloads are immutable historical owners.
// Their missing boundary stocks must not be invented or silently migrated.
const old=structuredClone(initial);
old.world.environment.schema=1;
old.world.environment.boundary.fill(0);
delete old.world.environment.totals.boundaryInput;
delete old.world.environment.totals.boundaryOutput;
for(const row of old.world.environment.daily){delete row.boundaryInput;delete row.boundaryOutput}
if(old.world.environment.lastDay){
 delete old.world.environment.lastDay.boundaryInput;
 delete old.world.environment.lastDay.boundaryOutput;
}
delete old.world.environment.boundaryWaterPolicy;
const legacy=restoreSimulationSnapshot(structuredClone(old));
assert.equal(legacy.world.environment.schema,1);
assert.ok(legacy.world.environment.boundary.every(v=>v===0));
const legacyInitial=snap(legacy);
assert.deepEqual(snap(restoreSimulationSnapshot(structuredClone(legacyInitial))),legacyInitial,
 'historic zero-flux planet stays byte-identical under restore');
const forged=structuredClone(initial);
forged.world.environment.boundary[w.n+1]=2;
assert.throws(()=>restoreSimulationSnapshot(forged),/Invalid environment reservoir boundary|Environment water topology mismatch/);
const badRow=structuredClone(initial);
badRow.world.environment.lastDay.boundaryInput=-1;
assert.throws(()=>restoreSimulationSnapshot(badRow),/Invalid planetary boundary flux receipt/);
const corruptClosure=structuredClone(initial);
corruptClosure.world.environment.lastDay.closure=1;
assert.throws(()=>restoreSimulationSnapshot(corruptClosure),/Invalid salt budget receipt/,
 'a saved day cannot conceal an unbalanced physical salt transfer');
const corruptArithmetic=structuredClone(initial);
corruptArithmetic.world.environment.lastDay.input+=1;
assert.throws(()=>restoreSimulationSnapshot(corruptArithmetic),/Invalid salt budget receipt/,
 'a forged salt input must disagree with the recorded conservation identity');
const forgedBoundaryWater=structuredClone(initial);
forgedBoundaryWater.world.environment.lastDay.boundaryWaterInput+=1;
assert.throws(()=>restoreSimulationSnapshot(forgedBoundaryWater),
 /Unbalanced planetary boundary-water receipt/,
 'an external water replacement cannot import more volume than it exports');
const forgedBoundarySalt=structuredClone(initial);
forgedBoundarySalt.world.environment.lastDay.boundarySaltOutput=
 forgedBoundarySalt.world.environment.lastDay.boundaryOutput+1;
assert.throws(()=>restoreSimulationSnapshot(forgedBoundarySalt),
 /Unbalanced planetary boundary-water receipt/,
 'an ocean-specific salt export cannot exceed all declared boundary exports');
const forgedPolicy=structuredClone(initial);
forgedPolicy.world.environment.boundaryWaterPolicy='unrecognized-ocean/2';
assert.throws(()=>restoreSimulationSnapshot(forgedPolicy),
 /Invalid planetary boundary-water policy/,
 'save restoration rejects unknown ocean exchange versions');
const corruptWaterClosure=structuredClone(initial);
corruptWaterClosure.world.environment.lastDay.waterClosure=1;
assert.throws(()=>restoreSimulationSnapshot(corruptWaterClosure),/Invalid planetary water-volume receipt/,
 'a saved day cannot hide an unbalanced water transfer');
const forgedWaterInput=structuredClone(initial);
forgedWaterInput.world.environment.lastDay.waterInput+=1;
assert.throws(()=>restoreSimulationSnapshot(forgedWaterInput),/Invalid planetary water-volume receipt/,
 'a forged water input must disagree with conservation arithmetic');
console.log('Planetary boundary flux PASS: geographic wet edges, finite ocean replenishment, 12-day conservation, exact save/replay, and historic no-flux fallback');
