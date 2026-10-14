import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {explorationDestination} from '../src/world/exploration-destination.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('EXPLORATION-CANDIDATE',{player:false}),w=sim.world,a=sim.animals.find(a=>a.species==='needlejaw');
w.water.fill(0);w.buildLandRegions();w.buildHydrology();a.x=6.3;a.y=125.98;
const state=()=>{const s=createSimulationSnapshot(sim);delete s.savedAt;delete s.meta.savedAt;return JSON.stringify(s)};
const before=state(),bad={x:6.6,y:133.48},p=explorationDestination(sim,a,bad);
assert.ok(sim.canOccupy(a,p.x,p.y)&&sim.canReach(a,p.x,p.y));
assert.ok(p.y<a.y-1,'off-map excursion turns inward instead of pinning the animal on the boundary');
assert.deepEqual(explorationDestination(sim,a,bad),p);
const good={x:9,y:120};assert.equal(explorationDestination(sim,a,good),good,'valid routes retain identity and metadata');
assert.equal(state()===before,true,'query changes no simulation state or RNG (wall-clock save metadata excluded)');
w.water[w.idx(p.x,p.y)]=1;w.buildLandRegions();
const alternative=explorationDestination(sim,a,bad);
assert.ok(!w.water[w.idx(alternative.x,alternative.y)]&&sim.canReach(a,alternative.x,alternative.y),'land body cannot be directed into reflected water');
console.log('candidate exploration reflection, access, determinism and query purity: PASS');

// A disconnected island is not a valid destination for a land body.
w.water.fill(1);w.water[w.idx(a.x,a.y)]=0;w.water[w.idx(40,40)]=0;w.buildLandRegions();
assert.deepEqual(explorationDestination(sim,a,{x:40.5,y:40.5}),{x:a.x,y:a.y});
// Malformed stale coordinates also cannot send movement toward NaN.
assert.deepEqual(explorationDestination(sim,a,{x:NaN,y:Infinity}),{x:a.x,y:a.y});
// Controlled assembled swimming body can choose real water destinations.
a.bodyPlan=structuredClone(a.bodyPlan);
for(const n of a.bodyPlan.nodes)if(n.partId==='runner-leg')n.partId='webbed-leg';
const aquaticGoal={x:30.5,y:30.5};
assert.ok(sim.canSwim(a));
assert.equal(explorationDestination(sim,a,aquaticGoal),aquaticGoal);

