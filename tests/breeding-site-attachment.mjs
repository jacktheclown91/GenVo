import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {BREEDING_SITE,breedingSiteDecision,rememberBreedingSite} from '../src/ecology/breeding-sites.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('EO-BREEDING-SITE-CONTRACT',{player:false});
const pair=sim.animals.filter(a=>a.species==='rootling'&&hasPart(a,'digging-forelimb')).slice(0,2);
assert.equal(pair.length,2);
const [a,b]=pair;sim.animals=pair;sim.rebuildSpatial();a.sex='F';b.sex='M';
for(const animal of pair){animal.age=110;animal.energy=SPECIES.rootling.maxEnergy*.95;animal.hydration=SPECIES.rootling.maxHydration*.95;animal.health=100;animal.parentIds=[];animal.reproCooldown=0;animal.infected=false;animal.pregnant=null;animal.reproDrive=1;}
// Pick a genuine safe and productive tile rather than granting a fictional site.
let tile=null;
for(let y=12;y<110&&!tile;y+=4)for(let x=12;x<110&&!tile;x+=4){
  const candidate={x:x+.5,y:y+.5};
  if(!sim.canOccupy(a,candidate.x,candidate.y)||!sim.canReach(a,candidate.x,candidate.y))continue;
  const q=sim.migration.habitatQuality(a,candidate.x,candidate.y);
  if(q.food>=.15&&q.water>=.20&&q.danger<.45)tile=candidate;
}
assert.ok(tile,'test requires real safe food-water habitat');
for(const animal of pair){animal.x=tile.x;animal.y=tile.y;}
sim.rebuildSpatial();
const before={rng:sim.rng.state,seed:structuredClone(sim.world.seedBank),plant:structuredClone(sim.world.plants)};
assert.equal(sim.tryMate(a,b),true,'production mating, not a fictional conception');
assert.ok(a.pregnant&&a.breedingSite&&b.breedingSite);
assert.deepEqual([a.breedingSite.x,a.breedingSite.y],[tile.x,tile.y]);
assert.equal(a.breedingSite.partnerId,b.id);
assert.equal(b.breedingSite.partnerId,a.id);
assert.equal(a.breedingSite.untilDay,sim.day+SPECIES.rootling.gestation+BREEDING_SITE.postGestationDays);
assert.equal(b.breedingSite.untilDay,a.breedingSite.untilDay,'both mates share attachment without sex role');
assert.deepEqual(sim.world.seedBank,before.seed);assert.deepEqual(sim.world.plants,before.plant);
// The controller itself never draws randomness or modifies ecological stocks.
for(const animal of pair)animal.x=tile.x+6;
const probeRng=sim.rng.state;
for(const animal of pair){
  const d=breedingSiteDecision(sim,animal,{energy:.96,hydration:.95});
  assert.equal(d?.intent,'breeding-site-return');
  assert.equal(d.target.x,tile.x);
}
assert.equal(sim.rng.state,probeRng);
// Existing decisions use this return only after urgent physiological priorities.
sim.phaseDecision(null);
assert.equal(a.intent,'breeding-site-return');
a.hydration=SPECIES.rootling.maxHydration*.18;
sim.phaseDecision(null);
assert.notEqual(a.intent,'breeding-site-return','thirst must preempt site loyalty');
a.hydration=SPECIES.rootling.maxHydration*.95;
a.energy=SPECIES.rootling.maxEnergy*.4;
sim.phaseDecision(null);
assert.notEqual(a.intent,'breeding-site-return','feeding need must preempt site loyalty');
a.energy=SPECIES.rootling.maxEnergy*.95;
// A save and restore must carry the two *individual* remembered places.
const snap=createSimulationSnapshot(sim),restored=restoreSimulationSnapshot(structuredClone(snap));
for(const animal of pair)assert.deepEqual(restored.animals.find(x=>x.id===animal.id).breedingSite,animal.breedingSite);
// Parent disappears, location remains a memory (no partner resurrection).
b.alive=false;const solo=breedingSiteDecision(sim,a,{energy:.95,hydration:.95});
assert.equal(solo?.intent,'breeding-site-return');
// Scarcity and danger cause abandonment; no hidden subsidy or locked return.
sim.migration.habitatQuality=()=>({food:0,water:0,danger:1});
a.breedingSite.lastQualityDay=null;
assert.equal(breedingSiteDecision(sim,a,{energy:.95,hydration:.95}),null);
assert.equal(a.breedingSite,undefined);
// Date bounds prevent permanent attachment; no partner or mating bonus.
b.alive=true;b.breedingSite=undefined;
assert.equal(rememberBreedingSite(sim,a,b),true);
sim.day=a.breedingSite.untilDay+1;
assert.equal(breedingSiteDecision(sim,a,{energy:.95,hydration:.95}),null);
assert.equal(a.breedingSite,undefined);
// Non-mated and non-burrower animals receive no site memory at all.
const hopper=sim.spawnAnimal('mosskip',tile.x,tile.y);
assert.equal(rememberBreedingSite(sim,a,hopper),false);
assert.equal(hopper.breedingSite,undefined);
assert.equal(sim.rng.state!==before.rng,true,'the original real mating may draw randomness');
console.log('EO real pair site, reciprocal behavior, priority, unsuitable habitat, expiry, stock/RNG, save/restore: PASS');
