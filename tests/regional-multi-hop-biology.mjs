import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {validateRemoteBiologyLedger,remoteBiologicalDebt} from '../src/world/planetary-offscreen-biology.js';
import {validateRemoteEnvironmentalLedger} from '../src/world/planetary-offscreen-environment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'multi-hop'}));
const same=(a,b,label)=>assert.ok(isDeepStrictEqual(a,b),label);
// Historical canonical replay: every visited region stays individually
// simulated. Under regional-demography/1 a crossing deliberately reassigns far
// regions to the population model (tests/regional-demography.mjs).
let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1',regionalReplayPolicy:'bounded-strides/1',regionalDemography:false});
function frontier(s,excluded){
 const a=s.player();
 for(const direction of ['east','south','north','west'])for(let c=8.5;c<118.5;c++){
  a.x=direction==='east'?125.2:direction==='west'?2.5:c;
  a.y=direction==='south'?125.2:direction==='north'?2.5:c;
  const z=planetaryTravelAvailability(s);
  if(z.enabled&&!excluded.has(z.to.x+','+z.to.y))return z;
 }
 throw Error('No real traversable frontier to a new region');
}
const visited=new Set(['0,0']);
for(let hop=0;hop<2;hop++){
 const previous=sim.planetaryTravel?.sessions.map(s=>structuredClone(s))||[];
 const z=frontier(sim,visited);visited.add(z.to.x+','+z.to.y);
 const trip=crossPlanetaryBorder(sim);assert.equal(trip.ok,true,trip.message);sim=trip.simulation;
 for(const old of previous){
  const retained=sim.planetaryTravel.sessions.find(s=>s.key===old.key);
  same(retained,old,'another frontier crossing must preserve every archived biological authority and receipt');
 }
 for(let i=0;i<CFG.dayTicks;i++)sim.update(null,{externalPlayerControl:true});
}
assert.equal(sim.planetaryTravel.sessions.length,2);
for(const s of sim.planetaryTravel.sessions){
 assert.equal(s.biologicalMode,'canonical-ticks/1');validateRemoteBiologyLedger(s);validateRemoteEnvironmentalLedger(s);
 assert.ok(s.biologicalLedger.ticks>0,'every earlier visited region must continue real life');
 assert.ok(s.snapshot.core.tickCount>0);assert.ok(remoteBiologicalDebt(sim,s)>0,'bounded scheduler reports multi-region time debt honestly');
}
const saved=snap(sim),resumed=restoreSimulationSnapshot(structuredClone(saved));same(snap(resumed),saved,'multi-hop save preserves exact clocks, receipts, biology and resources');
for(let i=0;i<CFG.lifeStride*2;i++){sim.update(null,{externalPlayerControl:true});resumed.update(null,{externalPlayerControl:true})}
same(snap(sim),snap(resumed),'multi-region replay continues identically after saving');
console.log('Multi-hop biology PASS: three real regions, preserved archive authorities/ledgers, real continued ticks, honest debt and exact save/continuation');
