import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {mateOptionAssessment,compareMateOptions,reciprocalMateChoice} from '../src/reproduction/mate-preferences.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const neutral={weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5,similarity:0};
const desiresSize=x=>({weights:{...neutral.weights,size:x},selectivity:.5});
const sim=new Simulation('MULTIPLE-PARTNERS-REAL',{player:false});
const [seeker,small,large]=sim.animals.filter(a=>a.species==='rootling');
assert.ok(seeker&&small&&large);
sim.animals=[seeker,small,large];
const spec=SPECIES.rootling;
let home=null;
for(let y=14;y<100&&!home;y+=3)for(let x=14;x<100&&!home;x+=3){
  // Both candidates must be breeding-eligible where they stand, so the choice tests preference, not eligibility.
  if([0,1,3].every(dx=>sim.canOccupy(seeker,x+dx,y)&&sim.canReach(seeker,x+dx,y))&&sim.carrying.breedingState(small,{at:{x:x+1,y}}).allowed&&sim.carrying.breedingState(large,{at:{x:x+3,y}}).allowed)home={x,y};
}
assert.ok(home);
for(const a of sim.animals){
  Object.assign(a,{age:spec.maturity+15,reproCooldown:0,health:100,infected:false,pregnant:null,
    parentIds:[],energy:spec.maxEnergy*.95,hydration:spec.maxHydration*.95,sex:'F',matePreferences:structuredClone(neutral)});
  a.y=home.y;
}
seeker.sex='M';seeker.x=home.x;small.x=home.x+1;large.x=home.x+3;
small.genes.body=.92;large.genes.body=1.16;
sim.rebuildSpatial();
const before={rng:sim.rng.state,plants:structuredClone(sim.world.plants),seeds:structuredClone(sim.world.seedBank),births:sim.stats.births};
seeker.matePreferences=desiresSize(1);
assert.equal(reciprocalMateChoice(seeker,small,sim.seed).accepted,true);
assert.equal(reciprocalMateChoice(seeker,large,sim.seed).accepted,true);
assert.equal(sim.autonomousMateTarget(seeker),large,'a choosy animal can travel farther for a preferred mate');
assert.equal(compareMateOptions(seeker,large,small,sim.seed,9)<0,true,'canonical comparator favors the preferred phenotype');
assert.equal(mateOptionAssessment(seeker,large,sim.seed,3,9).choice.accepted,true);
seeker.matePreferences=desiresSize(-1);
assert.equal(sim.autonomousMateTarget(seeker),small,'opposite inherited taste yields a different choice in the same world');
seeker.matePreferences=structuredClone(neutral);
assert.equal(sim.autonomousMateTarget(seeker),small,'distance becomes decisive when preferences are neutral');
seeker.matePreferences=desiresSize(1);
assert.equal(sim.rng.state,before.rng,'ranking consumes no random numbers');
assert.deepEqual(sim.world.plants,before.plants);
assert.deepEqual(sim.world.seedBank,before.seeds);
assert.equal(sim.stats.births,before.births,'comparisons cannot cause pregnancies or births');
const snapshot=structuredClone(createSimulationSnapshot(sim));
const restored=restoreSimulationSnapshot(snapshot);
assert.equal(restored.autonomousMateTarget(restored.animals.find(a=>a.id===seeker.id))?.id,large.id,'ranking preserved across save/restore');
// Consent still gates the actual approach, even when one party prefers it.
large.matePreferences=desiresSize(1);
seeker.genes.body=.72;
assert.equal(reciprocalMateChoice(seeker,large,sim.seed).accepted,false);
assert.notEqual(sim.autonomousMateTarget(seeker)?.id,large.id,'mutual rejection is respected');
// Player can inspect and manually select alternatives, regardless of the default.
const playerSim=new Simulation('PLAYER-PARTNER-OPTIONS',{player:true});
const p=playerSim.player();
assert.ok(p);
const a=playerSim.spawnAnimal('genvo',p.x+1,p.y);
const b=playerSim.spawnAnimal('genvo',p.x+3,p.y);
for(const animal of [p,a,b]){
  animal.age=SPECIES.genvo.maturity+12;
  animal.energy=SPECIES.genvo.maxEnergy*.96;
  animal.hydration=SPECIES.genvo.maxHydration*.96;
  animal.reproCooldown=0;animal.health=100;animal.infected=false;
  animal.pregnant=null;animal.parentIds=[];animal.matePreferences=structuredClone(neutral);
}
p.sex='M';a.sex=b.sex='F';a.genes.body=.92;b.genes.body=1.16;p.matePreferences=desiresSize(1);
playerSim.animals=[p,a,b];playerSim.rebuildSpatial();
playerSim.canReach=()=>true; // Only isolate mate comparison from map shoreline placement.
const options=playerSim.reproduction.eligibleMates({radius:10});
assert.equal(options[0],b,'player option order highlights a biologically preferred partner');
assert.ok(options.includes(a),'less-preferred alternatives remain selectable');
assert.equal(playerSim.reproduction.selectMate(a.id),a,'player retains actual choice');
assert.equal(playerSim.reproduction.selectedMate().id,a.id);
console.log('Multi-partner sexual selection: opposing tastes, proximity costs, consent, world persistence, player alternatives, ecological neutrality PASS');
