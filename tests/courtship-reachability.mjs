import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {planLandDetour} from '../src/world/land-route.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
// Controlled topology/body-capability regression, not natural anatomy development.
const s=new Simulation('COURTSHIP-REACHABILITY',{player:true}),p=s.player(),b=s.animals.find(a=>a.alive&&!a.player&&a.species===p.species);assert.ok(b);s.paused=false;
for(const a of [p,b])Object.assign(a,{age:SPECIES[a.species].maturity+10,health:100,energy:SPECIES[a.species].maxEnergy*.99,hydration:SPECIES[a.species].maxHydration*.99,reproCooldown:0,pregnant:null,parentIds:[],infected:false});p.sex='M';b.sex='F';applyLineageTarget(p,founderPlan());applyLineageTarget(b,founderPlan());p.x=20.5;p.y=25.5;b.x=30.5;b.y=25.5;s.rebuildSpatial();
const w=s.world;w.setSurfaceWater(Array.from({length:w.len},(_,i)=>i%w.n===25?{i,water:1,depth:.7,salinity:0}:{i,water:0}),{reason:'controlled full-height route barrier'});
assert.ok(s.matePairAvailability(p,b,{ready:true}).enabled);assert.equal(s.canSwim(p),false);assert.equal(s.canReach(p,b.x,b.y),false);
s.reproduction.selectedMateId=b.id;const snapshot=()=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'courtship-reachability'}),before=snapshot(),energy=p.energy,rng=s.rng.state;
const blocked=s.reproduction.courtshipAvailability();assert.equal(blocked.enabled,false,'An unreachable sensed partner must not enable a physical approach');assert.equal(blocked.reasonCode,'unreachable');assert.match(blocked.reason,/cannot reach/);assert.deepEqual(snapshot(),before,'Query changes no world/actor/RNG state');assert.equal(s.reproduction.courtSelected(),false);assert.equal(s.reproduction.courtTargetId,null);assert.equal(p.energy,energy);assert.equal(s.rng.state,rng);
// Historical pending selection is released with a saved explanation, not moved.
s.reproduction.courtTargetId=b.id;p.intent='mate';p.target=b;p.queuedCourtshipSequence=['dance'];assert.equal(s.reproduction.courtTarget(),null);assert.equal(p.lastCourtshipFailure.reasonCode,'unreachable');assert.equal(p.lastCourtshipFailure.stage,'approach');assert.equal(p.energy,energy);assert.equal(s.rng.state,rng);const restored=restoreSimulationSnapshot(structuredClone(snapshot()));assert.deepEqual(createSimulationSnapshot(restored,{savedAt:'fixed',reason:'courtship-reachability'}),snapshot());
// A long connected route is permitted even when a direct line crosses water.
w.setSurfaceWater([{i:w.idx(25,10),water:0}],{reason:'controlled route opening'});assert.ok(s.canReach(p,b.x,b.y));assert.ok(planLandDetour(s,structuredClone(p),b));assert.ok(s.reproduction.courtshipAvailability().enabled);assert.ok(s.reproduction.courtSelected());s.reproduction.cancelCourtship();
w.setSurfaceWater([{i:w.idx(25,10),water:1,depth:.7,salinity:0}],{reason:'controlled route closure'});
const body=count=>{let k=0;return makePlan(founderPlan().nodes.map(n=>({...n,partId:n.socket?.startsWith('limb.')&&k++<count?'webbed-leg':n.partId})))};
applyLineageTarget(p,body(1));assert.equal(s.canSwim(p),false);assert.equal(s.reproduction.courtshipAvailability().enabled,false);
applyLineageTarget(p,body(2));assert.ok(s.canSwim(p));assert.ok(s.canReach(p,b.x,b.y));assert.ok(s.reproduction.courtshipAvailability().enabled,'Existing supported swimming anatomy makes the same partner reachable');
console.log('Shared physical reachability, unchanged failed-query/funding/RNG, saved interruption, long detour and supported swimming: PASS');
