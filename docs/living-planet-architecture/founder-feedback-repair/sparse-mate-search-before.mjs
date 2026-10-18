import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-SPARSE-MATE-SEARCH',{player:false});
const [female,male]=sim.animals.filter(a=>a.species==='needlejaw');
sim.animals=[female,male];
const s=SPECIES.needlejaw;
for(const a of sim.animals){
  a.x=40;a.y=40;a.age=s.maturity+10;a.energy=s.maxEnergy*.75;
  a.hydration=s.maxHydration;a.reproCooldown=0;a.reproDrive=1;
  a.genes.senses=1;a.parentIds=[];a.infected=false;
}
female.sex='F';male.sex='M';male.x=80;
// Isolate the energy/range decision from habitat and food capacity. Search,
// eligibility, spatial indexing and phase priority still run through production.
sim.canReach=()=>true;
sim.carrying.breedingState=()=>({allowed:true,driveRate:.1});
sim.rebuildSpatial();
assert.equal(sim.autonomousMateTarget(female),null,'mate lies outside the near range');
assert.equal(sim.autonomousMateTarget(female,{far:true}),male);
sim.phaseDecision(null);
assert.equal(female.intent,'mate','breeding-ready sparse animals use the recovery range below 82% energy');
assert.equal(female.target,male);
female.energy=s.maxEnergy*.6;
sim.bestPrey=()=>male; // A sentinel verifies feeding wins before mate search.
sim.phaseDecision(null);
assert.equal(female.intent,'hunt','survival needs retain priority over recovery mating');
console.log('sparse mate search decision: PASS');
