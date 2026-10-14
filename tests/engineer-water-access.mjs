import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('ET-WATER-RECEIPTS',{player:false});
const a=sim.animals.find(an=>an.species==='rootling'&&hasPart(an,'digging-forelimb'));
assert.ok(a);sim.animals=[a];sim.rebuildSpatial();const s=SPECIES[a.species];
const bank=sim.world.drinkSpots.find(p=>sim.canOccupy(a,p.x,p.y));assert.ok(bank);
const protectedPlant=sim.world.plants.thistlepod.slice();const savedRng=sim.rng.state;
// Observe an adult, dehydrated founder standing on genuinely drinkable ground.
Object.assign(a,{x:bank.x,y:bank.y,age:s.maturity+15,hydration:s.maxHydration*.19,
  energy:s.maxEnergy*.9,health:100,reproCooldown:0,infected:false,intent:'drink'});
const home={x:bank.x+17,y:bank.y};
a.breedingSite={...home,untilDay:sim.day+30};
sim.regionalEcology.observe();
const here=sim.regionalEcology.keyAt(a.x,a.y);let record=sim.regionalEcology.records.get(here).engineerWaterAccess;
assert.ok(record.total.samples>=1);assert.ok(record.total.belowCourtshipWater>=1);
assert.ok(record.total.onDrinkableTile>=1);assert.ok(record.total.outsideSiteRegion>=1);
const prev=a.hydration;sim.resolveInteraction(a);
record=sim.regionalEcology.records.get(here).engineerWaterAccess;
assert.ok(a.hydration>prev);assert.equal(record.total.drinkActions,1);
assert.ok(Math.abs(record.total.waterGained-(a.hydration-prev))<1e-6);
assert.equal(record.total.drinkActionsAwayFromSite,1);
assert.deepEqual(sim.world.plants.thistlepod,protectedPlant);
assert.equal(sim.rng.state,savedRng,'passive sampling and actual drinking add no RNG');
const raw=sim.regionalEcology.engineerWaterAccessEvidence();
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.deepEqual(restored.regionalEcology.engineerWaterAccessEvidence(),raw);
raw.total.samples=999;raw.regions[0].daily.length=0;
assert.notEqual(sim.regionalEcology.engineerWaterAccessEvidence().total.samples,999,'defensive copy');
assert.notEqual(sim.regionalEcology.engineerWaterAccessEvidence().regions[0].daily.length,0,'independent history');
const unrelated={...a,species:'mosskip'};
assert.equal(sim.regionalEcology.noteEngineerDrink(unrelated,20),false,'no credit for nonengineers');
assert.equal(sim.regionalEcology.noteEngineerDrink(a,0),false,'no credit for nonexistent drinking');
const until=sim.day+50;for(let day=sim.day+1;day<=until;day++){
  sim.day=day;sim.regionalEcology.observe();
}
assert.ok(sim.regionalEcology.records.get(here).engineerWaterAccess.daily.length<=24);

// An artificially isolated, non-drinkable cell is reported as no-route, not
// misclassified as a successful water trip. This is a test-only dry world.
const dry=new Simulation('ET-UNREACHABLE',{player:false});
const d=dry.animals.find(v=>v.species==='rootling'&&hasPart(v,'digging-forelimb'));
assert.ok(d);dry.animals=[d];dry.world.drinkable.fill(0);dry.world.water.fill(0);
dry.world.moisture.fill(.1);dry.world.waterDistance.fill(65535);
d.age=SPECIES.rootling.maturity+3;dry.regionalEcology.observe();
assert.equal(dry.regionalEcology.engineerWaterAccessEvidence().total.noBankRoute,1);
assert.equal(dry.regionalEcology.engineerWaterAccessEvidence().total.nearBank,0);
console.log('ET real drinking, bank access, family site, bounded history, save/load: PASS');
