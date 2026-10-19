import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {FrameStepper} from '../src/sim/frame-stepper.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {REGIONAL_REPLAY,pendingRegionalBiology,prepareRegionalBiology,remoteBiologicalDebt} from '../src/world/planetary-offscreen-biology.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'sync-replay'}));
const same=(a,b,msg)=>assert.ok(isDeepStrictEqual(a,b),msg);
let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
const visited=new Set(['0,0']);
for(let hop=0;hop<2;hop++){
 let crossed=false;
 for(const dir of ['east','south','north','west']){
  for(let c=8.5;c<118.5;c++){
   const a=sim.player();a.x=dir==='east'?125.2:dir==='west'?2.5:c;a.y=dir==='south'?125.2:dir==='north'?2.5:c;
   const z=planetaryTravelAvailability(sim);if(!z.enabled||visited.has(z.to.x+','+z.to.y))continue;
   const trip=crossPlanetaryBorder(sim);assert.equal(trip.ok,true,trip.message);sim=trip.simulation;
   visited.add(z.to.x+','+z.to.y);crossed=true;break;
  }
  if(crossed)break;
 }
 assert.ok(crossed,'real traversable frontier');assert.equal(sim.regionalReplayPolicy,REGIONAL_REPLAY.synchronized);
}
const start=snapshot(sim),paced=restoreSimulationSnapshot(structuredClone(start)),controls={};
const seconds=CFG.dayTicks*2/CFG.simHz;
let count=0;for(let i=0;i<seconds*CFG.controlHz;i++){
 sim.playerControlStep(controls,CFG.controlHz);
 if((i+1)%(CFG.controlHz/CFG.simHz)===0)sim.update(controls,{externalPlayerControl:true});
 for(const s of sim.planetaryTravel.sessions)assert.ok(remoteBiologicalDebt(sim,s)<=CFG.lifeStride,'no growing multi-region debt');
}
let clock=0,jobs=0,frames=0;
const stepper=new FrameStepper({controlHz:CFG.controlHz,simHz:CFG.simHz,budgetMs:3,clock:()=>clock});
const beforeStep=()=>{if(!pendingRegionalBiology(paced).length)return true;const t=paced.tickCount,old={animals:structuredClone(paced.animals)};const result=prepareRegionalBiology(paced);assert.ok(result);
 jobs++;clock+=5;assert.equal(paced.tickCount,t,'regional work holds active clock');
 same(paced.animals,old.animals,'regional work cannot move or charge local player');
 if(jobs<=2){const mid=snapshot(paced);same(snapshot(restoreSimulationSnapshot(structuredClone(mid))),mid,'a partially completed barrier is an exact resumable checkpoint')}return false};
const advance=dt=>stepper.advance(dt,1,()=>{count++;clock+=.01;paced.playerControlStep(controls,CFG.controlHz)},()=>paced.update(controls,{externalPlayerControl:true}),{beforeStep});
advance(seconds);while(stepper.pendingSeconds>=stepper.stepSeconds){advance(0);assert.ok(++frames<1000)}
assert.equal(count,seconds*CFG.controlHz);assert.ok(jobs>2);same(snapshot(paced),snapshot(sim),'frame-yielded and synchronous ordering match whole saved state exactly');
assert.equal(pendingRegionalBiology(sim).length,2);
const first=prepareRegionalBiology(sim);assert.equal(first.remaining,0);const halfway=snapshot(sim),resumed=restoreSimulationSnapshot(structuredClone(halfway));
while(prepareRegionalBiology(sim)){}while(prepareRegionalBiology(resumed)){}
same(snapshot(sim),snapshot(resumed),'resumption between regional jobs preserves deterministic remainder');
for(const s of sim.planetaryTravel.sessions)assert.equal(remoteBiologicalDebt(sim,s),0);
const old=structuredClone(start);delete old.core.regionalReplayPolicy;
const historic=restoreSimulationSnapshot(old);assert.equal(Object.hasOwn(historic,'regionalReplayPolicy'),false,'missing policy remains historical without an invented migration');same(snapshot(historic),old,'legacy saved bytes retain missing policy');
const invalid=structuredClone(start);invalid.core.regionalReplayPolicy='unknown';assert.throws(()=>restoreSimulationSnapshot(invalid),/Unknown regional replay/);invalid.core.regionalReplayPolicy=null;assert.throws(()=>restoreSimulationSnapshot(invalid),/Unknown regional replay/);
console.log('Synchronized regions PASS: three visited worlds, bounded debt, frame-held local time, exact synchronous/yielded control and biology parity, mid-barrier saves, historical fallback and unknown policy rejection');
