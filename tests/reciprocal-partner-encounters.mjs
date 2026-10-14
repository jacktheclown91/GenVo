import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {partnerAvailability,respondingPartner,PARTNER_ENCOUNTER} from '../src/reproduction/partner-encounters.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('EP-RECIPROCAL-REAL-WORLD',{player:false});
const [a,b]=sim.animals.filter(a=>a.species==='rootling');
assert.ok(a&&b);sim.animals=[a,b];
const s=SPECIES.rootling;
// Find real habitable neighboring tiles; do not replace occupancy or create food.
let home=null;
for(let y=16;y<100&&!home;y+=3)for(let x=16;x<100&&!home;x+=3){
  if(sim.canOccupy(a,x,y)&&sim.canOccupy(b,x+3,y)&&sim.canReach(a,x,y)&&sim.canReach(b,x+3,y)){
    const q=sim.migration.habitatQuality(a,x,y);
    if(q.food>.17&&q.water>.2&&q.danger<.40)home={x,y};
  }
}
assert.ok(home,'needs a physically usable habitat');
for(const animal of [a,b])Object.assign(animal,{age:s.maturity+30,reproCooldown:0,energy:s.maxEnergy*.96,hydration:s.maxHydration*.95,health:100,pregnant:null,infected:false,parentIds:[],reproDrive:.65});
a.sex='F';b.sex='M';a.x=home.x;a.y=home.y;b.x=home.x+3;b.y=home.y;
sim.rebuildSpatial();
const ecologicalBefore={plants:structuredClone(sim.world.plants),seedBank:structuredClone(sim.world.seedBank)};
const rngBefore=sim.rng.state;
assert.deepEqual(partnerAvailability(sim,a,b),{available:true,reason:'available'});
assert.deepEqual(partnerAvailability(sim,b,a),{available:true,reason:'available'},'both individuals have the same decision rights');
assert.equal(respondingPartner(sim,b),null,'there must be a real approaching suitor');
a.reproDrive=1;a.intent='mate';a.target=b;
assert.equal(respondingPartner(sim,b),a,'receptive target independently meets the approaching suitor');
assert.equal(sim.rng.state,rngBefore,'an encounter check must not consume RNG');
assert.deepEqual(sim.world.plants,ecologicalBefore.plants);
assert.deepEqual(sim.world.seedBank,ecologicalBefore.seedBank);
// The actual phase must preserve the same response, and not create a pregnancy.
sim.carrying.breedingState=()=>({allowed:true,driveRate:.1});
sim.phaseDecision(null);
assert.equal(a.intent,'mate');assert.equal(a.target,b);
assert.equal(b.intent,'mate');assert.equal(b.target,a);
assert.equal(a.pregnant,null,'a courtship encounter is not a mating');
assert.equal(sim.stats.births,0);
// Every unready state explains the refusal, including changed availability.
for(const [change,reason] of [
  [{pregnant:{days:10}},'occupied'],[{reproCooldown:3},'occupied'],
  [{health:45},'unwell'],[{infected:true},'unwell'],
  [{energy:s.maxEnergy*.3},'survival-priority'],[{hydration:s.maxHydration*.35},'survival-priority']]){
  const saved={...b};Object.assign(b,change);
  assert.equal(partnerAvailability(sim,a,b).reason,reason);
  assert.equal(respondingPartner(sim,b),null);
  Object.assign(b,saved);
}
b.reproDrive=PARTNER_ENCOUNTER.minResponseDrive-.01;
assert.equal(respondingPartner(sim,b),null,'an unreceptive individual does not follow a suitor');
b.reproDrive=.70;
b.x=a.x+PARTNER_ENCOUNTER.responseRadius+3;sim.rebuildSpatial();
assert.equal(respondingPartner(sim,b),null,'no long-range compelled response');
b.x=a.x+3;sim.rebuildSpatial();
// This mechanism adds no mate/offspring and survives a real snapshot as state.
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.equal(restored.animals.find(x=>x.id===b.id).reproDrive,b.reproDrive);
assert.equal(sim.stats.births,0);assert.equal(sim.rng.state,rngBefore);
// A change in the candidate's condition between approach and arrival must
// prevent conception, even if the suitor still has a stale pursuit target.
const pending=sim.rng.state;
b.health=45;a.intent='mate';a.target=b;
assert.equal(sim.tryMate(a,b),false,'an unwell recipient does not become pregnant on arrival');
assert.equal(a.pregnant,null);assert.equal(sim.rng.state,pending);
b.health=100;

console.log('EP real partner encounter, reciprocal response, refusal reasons, safety, no forced birth or resources, persistence: PASS');
