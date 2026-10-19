import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {advanceOffscreenEnvironments,advanceRemoteEnvironment,remoteEnvironmentDue,
 planetaryWeatherForDay,offscreenCalendar,validateRemoteEnvironmentalLedger,
 OFFSCREEN_ENVIRONMENT} from '../src/world/planetary-offscreen-environment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {soilWaterStorage} from '../src/ecology/soil-water.js';
const seed='PLANET-B0-A',sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1'});
const save=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e17'})),actor=sim.player();
let allowed=null;
for(let y=8.5;y<118.5;y++){actor.x=125.2;actor.y=y;const st=planetaryTravelAvailability(sim);if(st.enabled){allowed=st;break}}
assert.ok(allowed,'natural physical border should support travel in test planet');
const outgoing=crossPlanetaryBorder(sim);assert.equal(outgoing.ok,true,outgoing.message);
const active=outgoing.simulation,remote=active.planetaryTravel.sessions[0],oldArchive=structuredClone(remote.snapshot);
const ids=remote.snapshot.animals.map(a=>a.id);
const oldAnimals=structuredClone(remote.snapshot.animals);
const oldPlants=structuredClone(remote.snapshot.world.plants);
const oldCarrion=structuredClone(remote.snapshot.world.carrion);
const oldSeedBank=structuredClone(remote.snapshot.world.seedBank);
const oldBirths=remote.snapshot.core.stats.births,oldDeaths=remote.snapshot.core.stats.deaths;
const activeBefore=save(active);
assert.equal(remoteEnvironmentDue(active,remote),0);
assert.deepEqual(advanceOffscreenEnvironments(active),[],'no remote simulation time is invented without elapsed active days');
assert.equal(offscreenCalendar(1).seasonIndex,0);
assert.equal(offscreenCalendar(8).seasonIndex,0);
assert.equal(offscreenCalendar(9).seasonIndex,1);
assert.equal(offscreenCalendar(25).seasonIndex,3);
assert.equal(offscreenCalendar(33).year,2);
const weatherA=planetaryWeatherForDay(seed,3),weatherB=planetaryWeatherForDay(seed,3);
assert.deepEqual(weatherA.climate,weatherB.climate,'offscreen weather is deterministic and not tied to currently selected fauna');
assert.ok(weatherA.climate.rain>0);
active.day=3;active.seasonIndex=0;
const scheduled=advanceOffscreenEnvironments(active);
assert.equal(scheduled.length,1);
assert.equal(scheduled[0].days,2);
assert.equal(scheduled[0].remaining,0);
assert.equal(remote.snapshot.core.day,3);
assert.deepEqual(remote.snapshot.animals,oldAnimals,'offscreen weather cannot age, starve, mutate or reproduce wildlife');
assert.deepEqual(remote.snapshot.world.plants,oldPlants,'offscreen seasons never conjure plant growth without funded producer ecology');
assert.deepEqual(remote.snapshot.world.carrion,oldCarrion);
assert.deepEqual(remote.snapshot.world.seedBank,oldSeedBank,'seedbanks require real botanical ecology, not synthetic seasons');
assert.equal(remote.snapshot.core.stats.births,oldBirths);
assert.equal(remote.snapshot.core.stats.deaths,oldDeaths);
assert.ok(remote.snapshot.world.soilWater,'physically real groundwater/soil/snow store exists after first remote day');
assert.ok(remote.snapshot.world.soilWater.lastDay);
assert.equal(remote.snapshot.world.soilWater.day,2);
assert.equal(remote.snapshot.world.environment.day,2);
assert.ok(Math.abs(remote.snapshot.world.soilWater.lastDay.closure)<=1);
assert.ok(Math.abs(remote.snapshot.world.environment.lastDay.closure)<=1e-5);
assert.notDeepEqual(remote.snapshot.world.moisture,oldArchive.world.moisture,
 'soil moisture must actually respond to precipitation/evaporation during absence');
assert.deepEqual(remote.snapshot.animals.map(a=>a.id),ids,'fauna identity and order invariant');
assert.equal(remote.environmentalLedger.days,2);
assert.equal(remote.environmentalLedger.firstDay,1);
assert.equal(remote.environmentalLedger.lastDay,2);
assert.equal(remote.environmentalLedger.schema,1);
validateRemoteEnvironmentalLedger(remote);
assert.ok(remote.environmentalLedger.rain>=0);
assert.ok(remote.environmentalLedger.soilMaxAbsClosure<=1);
assert.ok(remote.environmentalLedger.saltMaxAbsClosure<=1e-5);
assert.deepEqual(active.animals,activeBefore.animals,'background ecology never replaces or moves active creatures');
assert.deepEqual(active.world.plants,activeBefore.world.plants,'remote replay cannot change active local food stocks');

// Real save/load after remote physical replay preserves byte-identical canonical
// stores and actual ledger: it does not repeat or skip any processed day.
const checkpoint=save(active),restored=restoreSimulationSnapshot(structuredClone(checkpoint));
assert.deepEqual(save(restored),checkpoint);
assert.equal(advanceOffscreenEnvironments(restored).length,0,'resume does not replay the same rainfall a second time');
const returnY=allowed.point.y;
restored.player().x=2.5;restored.player().y=returnY;
assert.equal(planetaryTravelAvailability(restored).enabled,true);
const westward=crossPlanetaryBorder(restored);assert.equal(westward.ok,true,westward.message);
const home=westward.simulation;
assert.equal(home.world.regionOrigin.x,0);
assert.deepEqual(home.animals.map(a=>a.id).filter(x=>ids.includes(x)),ids,'physical seasons do not create/destroy archived wildlife');
assert.deepEqual(home.world.plants,oldPlants,'unattended producer cohorts remain unchanged, not auto-regrown');
assert.deepEqual(home.world.moisture,remote.snapshot.world.moisture,'return sees updated real groundwater climate');
assert.equal(home.world.environment.day,2);
assert.equal(home.world.soilWater.day,2);
assert.equal(home.player().id,actor.id);
assert.deepEqual(save(restoreSimulationSnapshot(save(home))),save(home),'return save is consistent with physical ledger');

// Automatic scheduler is called by the actual simulation's life stride and
// keeps the max work per call small even for large remote weather deficits.
home.day=5;home.seasonIndex=0;
assert.equal(remoteEnvironmentDue(home,home.planetaryTravel.sessions[0]),2);
for(let i=0;i<CFG.lifeStride;i++)home.update(null);
assert.equal(home.planetaryTravel.sessions[0].snapshot.core.day,5,'normal game update schedules remote physical days');
assert.equal(home.planetaryTravel.sessions[0].environmentalLedger.days,2);

// This is a bounded atmospheric processor, NOT a 20-year background fauna sim.
const forged=save(home);const previous=home.planetaryTravel.sessions[0];
const bogus=structuredClone(forged);bogus.core.planetaryTravel.sessions[0].environmentalLedger.lastDay+=1;
assert.throws(()=>restoreSimulationSnapshot(bogus),/environmental conservation ledger/);
const badWeather=structuredClone(forged);badWeather.core.planetaryTravel.sessions[0].environmentalLedger.rain=-1;
assert.throws(()=>restoreSimulationSnapshot(badWeather),/environmental conservation ledger/);
assert.throws(()=>advanceRemoteEnvironment(home,previous,{maxDays:999}),/Unbounded remote/);
assert.throws(()=>advanceOffscreenEnvironments(home,{maxRegions:17}),/bounded offscreen/);
const stale=structuredClone(save(home));stale.core.day=stale.core.planetaryTravel.sessions[0].snapshot.core.day+25;
const staleSim=restoreSimulationSnapshot(stale);
staleSim.player().x=125.2;staleSim.player().y=returnY;
assert.equal(planetaryTravelAvailability(staleSim).enabled,false,'unbounded historical replay must not block game with giant synchronous loop');
assert.match(planetaryTravelAvailability(staleSim).reason,/environmental|weather|reconcile/i);
console.log('E17 offscreen physics: deterministic seasons, actual soil/snow/salt flows, bounded remote work, conservation audits, frozen fauna/flora, resumed ledgers, physical return, replay validation PASS');
