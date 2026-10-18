import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {ENGINEER_FAMILY_SETTLEMENT} from '../src/ecology/engineer-family-settlement.js';

const sim=new Simulation('EV-BOUNDARY-PAIR',{player:false});
const duo=sim.animals.filter(a=>a.species==='rootling'&&hasPart(a,'digging-forelimb')).slice(0,2);
assert.equal(duo.length,2);const [mother,father]=duo,s=SPECIES.rootling;
sim.animals=duo;sim.rebuildSpatial();
for(const a of duo)Object.assign(a,{age:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,health:100,reproCooldown:0,pregnant:null,parentIds:[],infected:false});
mother.sex='F';father.sex='M';
let place;
for(let boundary=16;boundary<sim.world.n-8&&!place;boundary+=16)for(let y=6;y<sim.world.n-6&&!place;y++){
  const site={x:boundary-.45,y:y+.4},birth={x:boundary+.8,y:y+.4};
  if(sim.canOccupy(mother,site.x,site.y)&&sim.canOccupy(mother,birth.x,birth.y)&&
  sim.world.landRegion[sim.world.idx(site.x,site.y)]===sim.world.landRegion[sim.world.idx(birth.x,birth.y)]&&
  sim.carrying.breedingState(mother,{at:site}).allowed)place={site,birth};// a real supported habitat (tests/helpers/breeding-pair.js)
}
assert.ok(place,'find genuine reachable land on opposite sides of a regional border');
for(const a of duo)Object.assign(a,place.site);sim.rebuildSpatial();
const beforePlants=structuredClone(sim.world.plants),beforeWater=sim.world.drinkable.slice();
assert.equal(sim.tryMate(mother,father),true);
const conceptionRng=sim.rng.state;
assert.equal(sim.regionalEcology.engineerFamilySettlementEvidence().total.offspring,0);
Object.assign(mother,place.birth);sim.rebuildSpatial();sim.day+=s.gestation;
const children=sim.giveBirth(mother);assert.ok(children.length>0);
let result=sim.regionalEcology.engineerFamilySettlementEvidence();
assert.equal(result.total.offspring,children.length);
assert.equal(result.total.bornOutsideRegion,children.length);
assert.equal(result.total.nearbyBorderCrossings,children.length,'crossed 16x16 boundary while remaining near actual mating site');
assert.equal(result.total.farOutsideRegion,0);
assert.equal(result.total.bornNearSite,children.length);
assert.equal(result.total.pairedSiteRetention,0,'birth alone does not establish residence');
assert.equal(result.offspring[0].conceptionSite.x,place.site.x);
assert.ok(result.offspring.every(c=>c.birthDistance<ENGINEER_FAMILY_SETTLEMENT.siteRadius));
const afterBirthRng=sim.rng.state;
for(let i=1;i<=7;i++){
  sim.day++;
  sim.regionalEcology.lastDay=-1;sim.regionalEcology.observe();
  // Observer's own idempotence even when the parent controller is re-invoked.
  sim.regionalEcology.lastDay=-1;sim.regionalEcology.observe();
}
result=sim.regionalEcology.engineerFamilySettlementEvidence();
assert.equal(result.total.survivedSevenDays,children.length);
assert.equal(result.total.pairedSiteRetention,children.length);
assert.ok(result.offspring.every(c=>c.sampledDays===7&&c.pairedSiteDays===7));
assert.equal(sim.rng.state,afterBirthRng,'daily observational records consume no random numbers');
assert.deepEqual(sim.world.plants,beforePlants,'no food created');
assert.deepEqual(sim.world.drinkable,beforeWater,'no water created');
const saved=structuredClone(createSimulationSnapshot(sim));
const restored=restoreSimulationSnapshot(saved);
assert.deepEqual(restored.regionalEcology.engineerFamilySettlementEvidence(),result);
result.offspring[0].birth.x=-99;result.offspring[0].conceptionSite.y=-99;
assert.notEqual(sim.regionalEcology.engineerFamilySettlementEvidence().offspring[0].birth.x,-99);
assert.notEqual(sim.regionalEcology.engineerFamilySettlementEvidence().offspring[0].conceptionSite.y,-99);
const child=children[0];sim.kill(child,'test-mortality');
assert.ok(sim.regionalEcology.engineerFamilySettlementEvidence().offspring.find(c=>c.id===child.id).deathDay!==null);
assert.equal(conceptionRng!==afterBirthRng,true,'real birth path still stochastic');

// Negative boundary test: an offspring can travel far inside its mother's
// original region. Region equality must not hide physical separation.
const next=new Simulation('EV-WITHIN-REGION',{player:false});
const pair=next.animals.filter(a=>a.species==='rootling'&&hasPart(a,'digging-forelimb')).slice(0,2);
next.animals=pair;next.rebuildSpatial();const [m,f]=pair;
for(const a of pair)Object.assign(a,{age:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,health:100,reproCooldown:0,pregnant:null,parentIds:[],infected:false});
m.sex='F';f.sex='M';
let same;
for(let regionX=0;regionX<next.world.n/16&&!same;regionX++)for(let y=6;y<next.world.n-6&&!same;y++){
  const left={x:regionX*16+2.5,y:y+.4},right={x:regionX*16+12.5,y:y+.4};
  if(left.x>=next.world.n-1||right.x>=next.world.n-1)continue;
  if(next.canOccupy(m,left.x,left.y)&&next.canOccupy(m,right.x,right.y)&&
    next.regionalEcology.keyAt(left.x,left.y)===next.regionalEcology.keyAt(right.x,right.y)&&next.carrying.breedingState(m,{at:left}).allowed)same={left,right};
}
assert.ok(same,'find two positions ten tiles apart inside one region');
for(const a of pair)Object.assign(a,same.left);next.rebuildSpatial();assert.equal(next.tryMate(m,f),true);
Object.assign(m,same.right);next.day+=s.gestation;
const farChildren=next.giveBirth(m);assert.ok(farChildren.length);
const far=next.regionalEcology.engineerFamilySettlementEvidence().total;
assert.equal(far.bornOutsideRegion,0);
assert.equal(far.farWithinRegion,farChildren.length,'same-region birth can still mean genuine long-distance departure');
console.log('EV actual near-border birth, seven-day mother-child retention, far same-region birth, death, RNG, resources, save/load: PASS');
