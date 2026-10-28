// Archived-region jobs may run across frames before the tick that would run
// them: same jobs, order and outcome as whole jobs or the atomic tick. While one
// is pending the world is mid-tick, saves and update() complete it first, and the
// shared clock view is restored on every resume.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {DAY_CLOCK,applyDayClock} from '../src/sim/day-clock.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {REGIONAL_REPLAY,pendingRegionalBiology,prepareRegionalBiology} from '../src/world/planetary-offscreen-biology.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';

const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'regional-job-slicing'}));
let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
const visited=new Set(['0,0']);
for(let hop=0;hop<2;hop++){
 let crossed=false;
 for(const dir of ['east','south','north','west']){
  for(let c=8.5;c<118.5&&!crossed;c++){
   const a=sim.player();a.x=dir==='east'?125.2:dir==='west'?2.5:c;a.y=dir==='south'?125.2:dir==='north'?2.5:c;
   const z=planetaryTravelAvailability(sim);if(!z.enabled||visited.has(z.to.x+','+z.to.y))continue;
   const trip=crossPlanetaryBorder(sim);assert.equal(trip.ok,true,trip.message);sim=trip.simulation;visited.add(z.to.x+','+z.to.y);crossed=true;
  }
  if(crossed)break;
 }
 assert.ok(crossed);
}
assert.equal(sim.regionalReplayPolicy,REGIONAL_REPLAY.synchronized);assert.equal(sim.planetaryTravel.sessions.length,2);
const start=snapshot(sim),ticks=CFG.dayTicks+CFG.lifeStride*2;
const run=mode=>{const s=restoreSimulationSnapshot(structuredClone(start));let jobs=0,pauses=0;
 for(let i=0;i<ticks;i++){
  if(mode==='whole')while(prepareRegionalBiology(s))jobs++;
  if(mode==='sliced')while(s.stepRegionalBiology(-Infinity)){if(s.regionalJobPending){pauses++;assert.equal(s.tickInProgress,true,'a pending job is mid-tick')}else jobs++}
  if(mode==='interleaved')while(s.stepRegionalBiology(-Infinity)){if(s.regionalJobPending){pauses++;const view={dayTicks:CFG.dayTicks,bioStride:CFG.bioStride};applyDayClock({dayClockRules:CFG.dayTicks===48?DAY_CLOCK.policy:null});assert.notDeepEqual({dayTicks:CFG.dayTicks,bioStride:CFG.bioStride},view)}else jobs++}
  s.update(null);
 }
 return{s,jobs,pauses,signature:snapshotSignature(snapshot(s))};
};
const atomic=run('atomic'),whole=run('whole'),sliced=run('sliced'),interleaved=run('interleaved');
assert.ok(whole.jobs>0&&sliced.jobs===whole.jobs&&interleaved.jobs===whole.jobs,'the same jobs run');assert.ok(sliced.pauses>sliced.jobs,'jobs pause inside region ticks');
assert.equal(whole.signature,atomic.signature,'jobs between frames equal jobs inside the tick');
assert.equal(sliced.signature,whole.signature,'sliced jobs equal whole jobs');
assert.equal(interleaved.signature,whole.signature,'another clock between pauses changes nothing');

// Saves, update() and finishTick complete a pending job first; no job starts during a tick.
const probe=()=>{const s=restoreSimulationSnapshot(structuredClone(start));while(!pendingRegionalBiology(s).length)s.update(null);assert.equal(s.stepRegionalBiology(-Infinity),true);assert.equal(s.regionalJobPending,true);return s};
const reference=restoreSimulationSnapshot(structuredClone(start));while(!pendingRegionalBiology(reference).length)reference.update(null);prepareRegionalBiology(reference);
const saving=probe();const saved=snapshot(saving);assert.equal(saving.regionalJobPending,false,'capture completes the job');assert.ok(isDeepStrictEqual(saved,snapshot(reference)),'save sees the completed job');
const updating=probe();updating.update(null);reference.update(null);assert.equal(snapshotSignature(snapshot(updating)),snapshotSignature(snapshot(reference)),'update completes the pending job, then ticks');
const finishing=probe();finishing.finishTick();assert.equal(finishing.tickInProgress,false);
const ticking=restoreSimulationSnapshot(structuredClone(start));ticking.beginTick(null,{},-Infinity);if(ticking.tickInProgress)assert.equal(ticking.stepRegionalBiology(-Infinity),false,'no regional job starts during a pending tick');
// A failing job leaves nothing pending.
const failing=restoreSimulationSnapshot(structuredClone(start));while(!pendingRegionalBiology(failing).length)failing.update(null);for(const session of failing.planetaryTravel.sessions)session.biologicalLedger={schema:99};let failed=false;
try{failing.stepRegionalBiology(Infinity)}catch{failed=true}assert.equal(failed,true,'corrupt archived region fails its job');assert.equal(failing.regionalJobPending,false,'failed jobs never stay pending');
console.log('Regional job slicing PASS: sliced, whole and in-tick jobs give identical worlds; clock view restored across pauses; saves, update and finishTick complete pending jobs');
