import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {constructNest} from '../src/reproduction/egg-ecology.js';
import {advanceHabitatHazards,habitatHazardAt,HABITAT_HAZARDS} from '../src/ecology/habitat-hazards.js';
import {igniteWildfire,fireFuel} from '../src/ecology/wildfire.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const s=new Simulation('HABITAT-HAZARDS'),w=s.world,p=s.player();
// Explicit controlled mature parent/territory fixture. Construction and cache
// funding use actual finite vegetation, not injected material or food stores.
const i=Array.from({length:w.len},(_,i)=>i).find(i=>w.isPlayable(i%w.n+.5,(i/w.n|0)+.5)&&!w.water[i]&&w.moisture[i]<.6&&w.plants.sunmoss[i]>.18&&fireFuel(s,i)>1.2);assert.ok(Number.isInteger(i));p.x=i%w.n+.5;p.y=(i/w.n|0)+.5;p.age=SPECIES.genvo.maturity+5;p.energy=SPECIES.genvo.maxEnergy;p.hydration=SPECIES.genvo.maxHydration;
const territory=s.territory.ensure(p);territory.established=true;territory.home={x:p.x,y:p.y};territory.radius=7;territory.totalFamiliarity=8;territory.cells.set('fixture',{x:p.x,y:p.y,cx:Math.floor(p.x/8),cy:Math.floor(p.y/8),visits:8,lastTick:0});
const nest=constructNest(s,p);assert.ok(nest);const built=s.shelter.constructOrRepair(p);assert.equal(built.ok,true,built.reason);const shelter=built.shelter;assert.equal(s.shelter.cacheNearbyFood(p).ok,true);assert.ok(shelter.foodStore>0);
p.energy=SPECIES.genvo.maxEnergy;
// A funded reserve fixture isolates irreversible egg loss without waiting a
// gestation. Existing parent energy/hydration fund the complete test reserve.
const energy=2,hydration=1;p.energy-=energy;p.hydration-=hydration;s.eggs.push({id:s.nextEggId++,nestId:nest.id,motherId:p.id,x:p.x,y:p.y,condition:.001,energy,hydration,incubationDays:3});
s.climate={temp:1,rain:0};assert.ok(igniteWildfire(s,i));const stock=shelter.foodStore,integrity=shelter.integrity,biomass=fireFuel(s,i),rng=s.rng.state;s.tickCount=1;advanceHabitatHazards(s);
assert.ok(shelter.integrity<integrity);assert.ok(shelter.foodStore<stock);assert.equal(s.habitatHazards.cacheEnergyLost,stock-shelter.foodStore);assert.equal(s.eggs.length,0);assert.equal(s.habitatHazards.eggsLost,1);assert.equal(s.habitatHazards.eggEnergyLost,energy);assert.equal(s.habitatHazards.eggWaterLost,hydration);assert.equal(fireFuel(s,i),biomass,'heat damage never fabricates a plant debit');assert.equal(s.rng.state,rng);const ledger=structuredClone(s.habitatHazards);advanceHabitatHazards(s);assert.deepEqual(s.habitatHazards,ledger,'same tick cannot consume the cache or clutch again');
assert.ok(s.family.events.some(e=>e.type==='egg-loss'&&e.cause==='wildfire'));
const snapshot=createSimulationSnapshot(s,{savedAt:'hazard'}),saved=structuredClone(snapshot.core.habitatHazards);s.tickCount++;advanceHabitatHazards(s);assert.deepEqual(snapshot.core.habitatHazards,saved);const restored=restoreSimulationSnapshot(structuredClone(snapshot));assert.deepEqual(restored.habitatHazards,saved);assert.equal(restored.habitatHazardRules,HABITAT_HAZARDS.policy);
const old=structuredClone(snapshot);delete old.core.habitatHazardRules;delete old.core.habitatHazards;const historical=restoreSimulationSnapshot(old);assert.equal(Object.hasOwn(historical,'habitatHazardRules'),false);const prior=historical.shelter.shelters[0].integrity;historical.tickCount++;advanceHabitatHazards(historical);assert.equal(historical.shelter.shelters[0].integrity,prior);
const malformed=structuredClone(snapshot);malformed.core.habitatHazards.cacheEnergyLost=-1;assert.throws(()=>restoreSimulationSnapshot(malformed),/habitat hazard/);
const water=Array.from({length:w.len},(_,i)=>i).find(i=>w.water[i]);assert.ok(Number.isInteger(water));const flooded={x:water%w.n+.5,y:(water/w.n|0)+.5};assert.ok(habitatHazardAt(s,flooded).flood>0,'actual owned liquid floods ground structures');assert.equal(habitatHazardAt(s,{x:p.x,y:p.y}).flood,0);
// Controlled placement of an already paid structure into existing water;
// no flood water or stored food is fabricated to trigger the mechanism.
const floodShelter=restored.shelter.shelters[0],dryIntegrity=floodShelter.integrity,dryFood=floodShelter.foodStore;Object.assign(floodShelter,flooded);restored.tickCount++;advanceHabitatHazards(restored);assert.ok(floodShelter.integrity<dryIntegrity);assert.ok(floodShelter.foodStore<dryFood);assert.equal(floodShelter.lastHazard.cause,'flooding');
const ordinary=new Simulation('HABITAT-CONTINUATION');for(let k=0;k<16;k++)ordinary.update(null);const copy=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(ordinary)));for(let k=0;k<16;k++){ordinary.update(null);copy.update(null)}assert.deepEqual(createSimulationSnapshot(ordinary,{savedAt:'same'}),createSimulationSnapshot(copy,{savedAt:'same'}));
console.log('Habitat hazards PASS: paid shelter/nest/cache, finite distinct reserve losses, physical flooding, irreversible attributed clutch loss, duplicate guards and exact policy/save continuation.');
