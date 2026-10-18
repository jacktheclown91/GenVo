import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {matePreferencesFor} from '../src/reproduction/mate-preferences.js';
import {ENGINEER_LIFE_HISTORY} from '../src/ecology/engineer-life-history.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('ES-REAL-LIFE-HISTORY',{player:false});
let [mother,father]=sim.animals.filter(a=>a.species==='rootling'&&hasPart(a,'digging-forelimb')).slice(0,2);
assert.ok(mother&&father);sim.animals=[mother,father];sim.rebuildSpatial();
let tile=null,away=null;
for(let y=10;y<108&&!tile;y+=3)for(let x=10;x<108&&!tile;x+=3){
  if(!sim.canOccupy(mother,x+.5,y+.5))continue;
  const destination={x:x+.5,y:y+.5};
  if(!sim.canReach(mother,destination.x,destination.y))continue;
  const q=sim.migration.habitatQuality(mother,destination.x,destination.y);
  if(q.food>.15&&q.water>.20&&q.danger<.45)tile=destination;
}
assert.ok(tile);
for(let y=10;y<108&&!away;y+=3)for(let x=10;x<108&&!away;x+=3){
  const dest={x:x+.5,y:y+.5};
  if(sim.regionalEcology.keyAt(dest.x,dest.y)!==sim.regionalEcology.keyAt(tile.x,tile.y)&&sim.canOccupy(mother,dest.x,dest.y)&&sim.canReach(mother,dest.x,dest.y))away=dest;
}
assert.ok(away);
const s=SPECIES.rootling;
for(const a of [mother,father])Object.assign(a,{age:100,energy:s.maxEnergy*.94,hydration:s.maxHydration*.94,health:100,reproCooldown:0,pregnant:null,parentIds:[],infected:false,x:tile.x,y:tile.y});
mother.sex='F';father.sex='M';sim.rebuildSpatial();
// Staged pair: keep each founder's inherited tastes, but neutralise the similarity/contrast allele
// (Phase 3H), which can legitimately make a contrast-seeking founder decline a look-alike partner.
for(const a of [mother,father])a.matePreferences={...matePreferencesFor(sim.seed,a),similarity:0};
const oldRng=sim.rng.state,oldPlant=structuredClone(sim.world.plants),oldBank=structuredClone(sim.world.seedBank);
assert.equal(sim.tryMate(mother,father),true,'real reproduction path accepts genuine eligible pair');
let evidence=sim.regionalEcology.engineerLifeHistoryEvidence();
assert.equal(evidence.conceptions,1);assert.equal(evidence.gestating,1);assert.equal(evidence.births,0);
assert.equal(evidence.byRegion[0].conceptionRegion,sim.regionalEcology.keyAt(tile.x,tile.y));
mother.x=away.x;mother.y=away.y;sim.day+=s.gestation;
const children=sim.giveBirth(mother);assert.ok(children.length>=1);
evidence=sim.regionalEcology.engineerLifeHistoryEvidence();
assert.equal(evidence.conceptions,1);assert.equal(evidence.delivered,1);assert.equal(evidence.births,children.length);
assert.equal(evidence.birthsOutsideConceptionRegion,children.length,'movement during gestation is reported rather than rejected');
sim.day+=ENGINEER_LIFE_HISTORY.juvenileDays;
for(const child of children)child.age=ENGINEER_LIFE_HISTORY.juvenileDays+1;
sim.regionalEcology.lastDay=-1;sim.regionalEcology.observe();
evidence=sim.regionalEcology.engineerLifeHistoryEvidence();
assert.equal(evidence.survivedSevenDays,children.length);
const first=children[0];first.age=s.maturity+1;sim.day++;sim.regionalEcology.observe();
assert.equal(sim.regionalEcology.engineerLifeHistoryEvidence().reachedMaturity,1);
sim.kill(first,'predation');
assert.equal(sim.regionalEcology.engineerLifeHistoryEvidence().offspringDeaths,1);
const copy=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.deepEqual(copy.regionalEcology.engineerLifeHistoryEvidence(),sim.regionalEcology.engineerLifeHistoryEvidence());
assert.deepEqual(sim.world.plants,oldPlant,'observer cannot grow plants');
assert.deepEqual(sim.world.seedBank,oldBank,'observer cannot create seeds');
assert.notEqual(sim.rng.state,oldRng,'real reproduction remains stochastic');
const newborn=sim.spawnAnimal('mosskip',tile.x,tile.y);
assert.equal(sim.regionalEcology.engineerLifeHistoryEvidence().births,children.length,'unrelated child is not counted');

// A second genuine conception ending in maternal death creates no fictional litter.
const other=new Simulation('ES-MATERNAL-LOSS',{player:false});
const duo=other.animals.filter(a=>a.species==='rootling'&&hasPart(a,'digging-forelimb')).slice(0,2);
assert.equal(duo.length,2);other.animals=duo;other.rebuildSpatial();
const [m,f]=duo;for(const a of duo)Object.assign(a,{age:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,health:100,reproCooldown:0,pregnant:null,parentIds:[],infected:false});
m.sex='F';f.sex='M';m.x=f.x;m.y=f.y;
// This real mating may be gated by local carrying capacity; choose a viable
// existing habitat rather than overriding the reproduction authority.
let found=false;
for(let y=12;y<110&&!found;y+=4)for(let x=12;x<110&&!found;x+=4){
  if(!other.canOccupy(m,x+.5,y+.5)||!other.canReach(m,x+.5,y+.5))continue;
  m.x=f.x=x+.5;m.y=f.y=y+.5;other.rebuildSpatial();
  if(other.tryMate(m,f))found=true;
}
assert.ok(found);other.kill(m,'predation');
assert.equal(other.regionalEcology.engineerLifeHistoryEvidence().maternalDeaths,1);
assert.equal(other.regionalEcology.engineerLifeHistoryEvidence().births,0);
assert.equal(other.regionalEcology.engineerLifeHistoryEvidence().byRegion[0].maternalDeathCause,'predation');
console.log('ES real conception, cross-region litter, juvenile survival, maternal death, no fabricated births, save/load: PASS');
