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
assert.equal(sim.autonomousMateTarget(female,{far:true}),null,'global rarity cannot reveal a mate40 tiles away');
sim.phaseDecision(null);assert.notEqual(female.intent,'mate','low counts do not force exceptional searches');
male.x=56;sim.rebuildSpatial();
assert.equal(sim.autonomousMateTarget(female),null,'16-tile mate is beyond ordinary near sensing');
assert.equal(sim.autonomousMateTarget(female,{far:true}),male,'ordinary far search can find the actual nearby mate');
female.energy=s.maxEnergy*.9;sim.phaseDecision(null);
assert.equal(female.intent,'mate','adequate reserves permit ordinary far searching');assert.equal(female.target,male);
male.x=48;female.energy=s.maxEnergy*.75;sim.rebuildSpatial();sim.phaseDecision(null);
assert.equal(female.intent,'mate','ordinary near courtship still works below the far-search reserve');assert.equal(female.target,male);
female.energy=s.maxEnergy*.6;
sim.bestPrey=()=>male; // A sentinel verifies feeding wins before mate search.
sim.phaseDecision(null);
assert.equal(female.intent,'hunt','survival needs retain priority over mating');
console.log('sparse mate search decision: PASS');
