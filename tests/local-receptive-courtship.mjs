import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {localReceptivePartner,partnerAvailability} from '../src/reproduction/partner-encounters.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('EQ-REAL-LOCAL-COURTSHIP',{player:false});
const roots=sim.animals.filter(a=>a.species==='rootling');assert.ok(roots.length>=3);
const [seeker,tired,healthy]=roots;sim.animals=[seeker,tired,healthy];
const s=SPECIES.rootling;
let home;
for(let y=12;y<110&&!home;y+=4)for(let x=12;x<110&&!home;x+=4){
 if([0,1,2.8,6].every(d=>sim.canOccupy(seeker,x+d,y)&&sim.canReach(seeker,x+d,y))){for(const [a,d] of [[seeker,0],[tired,1],[healthy,2.8]]){a.x=x+d;a.y=y}sim.rebuildSpatial();if([seeker,tired,healthy].every(a=>sim.carrying.breedingState(a).allowed))home={x,y};}
}
assert.ok(home);
for(const a of sim.animals)Object.assign(a,{age:s.maturity+15,reproCooldown:0,health:100,infected:false,pregnant:null,parentIds:[],energy:s.maxEnergy*.94,hydration:s.maxHydration*.94});
seeker.sex='M';tired.sex=healthy.sex='F';
// This legacy physiology test isolates local availability from sexual selection.
// Neutral inherited tastes deliberately retain its prior nearest-partner setup;
// multi-candidate preference rankings have a separate focused contract.
for(const a of [seeker,tired,healthy])a.matePreferences={weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5};
seeker.x=home.x;seeker.y=home.y;
tired.x=home.x+1;tired.y=home.y;
healthy.x=home.x+2.8;healthy.y=home.y;
sim.rebuildSpatial();
const rng=sim.rng.state,beforeStats=structuredClone(sim.stats),beforeSeeds=structuredClone(sim.world.seedBank);
assert.equal(sim.autonomousMateTarget(seeker,{far:true}),tired,'baseline selects nearest candidate');
// A current non-receptive neighbor should not prevent another nearby adult
// from being chosen. Neither is forced to accept or reproduce.
tired.health=50;
assert.equal(partnerAvailability(sim,seeker,tired).reason,'unwell');
assert.equal(sim.autonomousMateTarget(seeker,{far:true}),healthy);
assert.equal(localReceptivePartner(sim,seeker,tired),healthy);
healthy.hydration=s.maxHydration*.40;
assert.equal(sim.autonomousMateTarget(seeker,{far:true}),null,'do not chase physically unreceptive neighbors');
assert.equal(sim.stats.births,0);assert.deepEqual(sim.stats,beforeStats);assert.deepEqual(sim.world.seedBank,beforeSeeds);assert.equal(sim.rng.state,rng);
healthy.hydration=s.maxHydration*.94;
tired.health=100;
assert.equal(sim.autonomousMateTarget(seeker,{far:true}),tired,'recovery restores mating opportunity without an arbitrary timer');
seeker.health=50;
assert.equal(sim.autonomousMateTarget(seeker,{far:true}),null,'own health must meet the same gate');
seeker.health=100;
tired.x=home.x+6;healthy.x=home.x+6;sim.rebuildSpatial();
assert.equal(localReceptivePartner(sim,seeker,tired),tired,'original distant search behavior is preserved');
assert.equal(sim.rng.state,rng);
const copy=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.equal(copy.animals.length,sim.animals.length);
assert.equal(copy.autonomousMateTarget(copy.animals.find(a=>a.id===seeker.id),{far:true})?.id,tired.id);
console.log('EQ non-forced local courtship, physiological refusal and recovery, long-range search, RNG/resources, save/load: PASS');
