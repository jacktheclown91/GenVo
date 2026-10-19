import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {advanceRemoteBiology,advanceOffscreenBiology,remoteBiologicalDebt} from '../src/world/planetary-offscreen-biology.js';
import {advanceRemoteEnvironment} from '../src/world/planetary-offscreen-environment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const snap=s=>structuredClone(createSimulationSnapshot(s,{reason:'e18',savedAt:'fixed'}));
const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
assert.equal(sim.offscreenBiologyEnabled,true);
const player=sim.player();
let feasible=null;
for(let y=8.5;y<118.5;y++){player.x=125.2;player.y=y;const z=planetaryTravelAvailability(sim);if(z.enabled){feasible=z;break}}
assert.ok(feasible,'real planetary geography has an animal-traversable eastward land corridor');
const crossing=crossPlanetaryBorder(sim);
assert.equal(crossing.ok,true,crossing.message);
const active=crossing.simulation,region=active.planetaryTravel.sessions[0];
assert.equal(region.biologicalMode,'canonical-ticks/1');
assert.equal(region.snapshot.core.day,1);
assert.equal(region.snapshot.core.tickCount,0);
assert.throws(()=>advanceRemoteEnvironment(active,region,{maxDays:1}),/duplicate environmental days/);
// Fund one pending, canonically gestated live birth using two actual
// reproductively complete wild parents, not a synthetic "population gain".
const moss=region.snapshot.animals.filter(a=>a.alive&&a.species==='mosskip');
const mother=moss.find(a=>a.sex==='F'),father=moss.find(a=>a.sex==='M'&&a.id!==mother?.id);
assert.ok(mother&&father,'a real wild mating pair must exist in the founded biota');
mother.age=40;mother.energy=87;mother.hydration=90;mother.health=100;
mother.pregnant={fatherId:father.id,days:1,totalDays:1,mode:'live',plannedLitterSize:1,
 birthCost:12,reserveInvestment:2};
const originalMotherGenes=structuredClone(mother.genes);
const doomed=region.snapshot.animals.find(a=>a.alive&&a.id!==mother.id&&a.id!==father.id&&a.health>0);
assert.ok(doomed);
doomed.health=-.05;doomed.energy=0;
const deadId=doomed.id,initialPopulation=region.snapshot.animals.length;
const beforeWorld=structuredClone(region.snapshot.world);
const reference=restoreSimulationSnapshot(structuredClone(region.snapshot));
assert.equal(reference.player(),null,'archived region contains no duplicated active traveler');

// Both simulations run the exact canonical tick loop. A *real* animal with
// depleted health should die, its corpse enter the finite resource stock,
// and vegetation/soil should change only through existing ecology phases.
active.tickCount=CFG.dayTicks;active.day=2;
reference.nextId=Math.max(reference.nextId,active.nextId,active.planetaryTravel.nextId);
for(let i=0;i<CFG.dayTicks;i++)reference.update(null,{externalPlayerControl:true});
assert.equal(reference.day,2);
assert.equal(reference.tickCount,CFG.dayTicks);
const physical=snap(reference);
const work=advanceRemoteBiology(active,region,{maxTicks:CFG.dayTicks});
assert.equal(work.ticks,CFG.dayTicks);
assert.equal(work.fullDays,1);
assert.ok(work.deaths>=1,'existing health and lifecycle authorities caused an actual death');
assert.equal(work.remaining,0);
assert.equal(region.snapshot.core.tickCount,CFG.dayTicks);
assert.equal(region.snapshot.core.day,2);
assert.equal(region.biologicalLedger.fullDays,1);
assert.equal(region.biologicalLedger.deaths,work.deaths);
assert.equal(region.environmentalLedger.days,1,'canonical biology day and weather advance together');
assert.ok(region.environmentalLedger.soilMaxAbsClosure<=1);
assert.ok(region.environmentalLedger.saltMaxAbsClosure<=1e-5);
assert.deepEqual(region.snapshot.animals,physical.animals,
 'offscreen fauna births/deaths/behavior/age/genetics match real foreground simulation exactly');
assert.deepEqual(region.snapshot.world.plants,physical.world.plants,
 'offscreen producer growth and seed consumption match canonical active daily flora');
assert.deepEqual(region.snapshot.world.seedBank,physical.world.seedBank);
assert.deepEqual(region.snapshot.world.carrion,physical.world.carrion,
 'dead animal biomass is stored exactly as in foreground mortality');
assert.deepEqual(region.snapshot.world.plantResources,physical.world.plantResources);
assert.deepEqual(region.snapshot.world.organicResources,physical.world.organicResources);
assert.deepEqual(region.snapshot.controllers.dispersal,physical.controllers.dispersal);
assert.equal(region.snapshot.core.stats.deaths,reference.stats.deaths);
assert.equal(region.snapshot.core.stats.births,reference.stats.births);
assert.ok(region.snapshot.core.stats.births>=1,'canonically funded mother produced a real child');
const offspring=region.snapshot.animals.find(a=>a.alive&&a.parentIds?.includes(mother.id)&&a.parentIds.includes(father.id));
assert.ok(offspring,'the newborn must have actual living maternal/paternal creature IDs');
assert.ok(offspring.genes&&offspring.bodyPlan,'real heredity allocated genes and physical body');
assert.equal(offspring.generation,Math.max(mother.generation,father.generation)+1);
assert.ok(offspring.energy>=0,'birth must not create negative offspring reserves');
assert.equal(region.biologicalLedger.births,region.snapshot.core.stats.births);
assert.ok(region.snapshot.animals.some(a=>a.id===mother.id&&a.genes.motion===originalMotherGenes.motion));
assert.ok(!region.snapshot.animals.some(a=>a.id===deadId&&a.alive),'canonical death removes or marks organism nonliving');
assert.notDeepEqual(region.snapshot.world.plants,beforeWorld.plants,'canonical production must actually alter finite flora stocks');
const checkpoint=snap(active);
assert.deepEqual(snap(restoreSimulationSnapshot(structuredClone(checkpoint))),checkpoint,
 'save/reload retains actual autonomous births, fauna remains, resources, weather and both ledgers');
assert.equal(advanceOffscreenBiology(active).length,0,'same ticks are not replayed twice');
assert.throws(()=>advanceRemoteBiology(active,region,{maxTicks:CFG.dayTicks+1}),/Unbounded/);
assert.throws(()=>advanceOffscreenBiology(active,{regionsPerPass:20}),/bounded/);

const reloaded=restoreSimulationSnapshot(structuredClone(checkpoint));
reloaded.player().x=2.5;reloaded.player().y=feasible.point.y;
const possible=planetaryTravelAvailability(reloaded);
assert.equal(possible.enabled,true,possible.reason);
const returned=crossPlanetaryBorder(reloaded);
assert.equal(returned.ok,true,returned.message);
const home=returned.simulation;
assert.equal(home.world.regionOrigin.x,0);
assert.ok(!home.animals.some(a=>a.id===deadId&&a.alive),'return must not resurrect dead archived animals');
assert.deepEqual(home.world.plants,reference.world.plants);
assert.deepEqual(home.world.carrion,reference.world.carrion);
assert.equal(home.world.environment.day,1);
assert.equal(home.world.soilWater.day,1);
assert.deepEqual(snap(restoreSimulationSnapshot(snap(home))),snap(home));

// The scheduler is called through actual active simulation life strides,
// never by input/rendering or arbitrary wall-clock passage.
const inland=home.planetaryTravel.sessions[0];
const originalTick=inland.snapshot.core.tickCount;
const activeTick=home.tickCount;
for(let i=0;i<CFG.lifeStride;i++)home.update(null,{externalPlayerControl:true});
assert.equal(home.tickCount,activeTick+CFG.lifeStride);
assert.equal(inland.snapshot.core.tickCount,originalTick+CFG.lifeStride);
assert.equal(inland.biologicalLedger.ticks,CFG.lifeStride);
assert.equal(inland.snapshot.core.day,2);
assert.equal(inland.biologicalLedger.lastPopulation,inland.snapshot.animals.length);

// Every active or archived birth uses global monotonic IDs. Never silently
// clone an animal when offspring arise outside the current viewport.
const tampered=snap(home);
tampered.core.planetaryTravel.sessions[0].biologicalLedger.lastTick++;
assert.throws(()=>restoreSimulationSnapshot(tampered),/Invalid archived biological replay ledger/);
const noBiology=structuredClone(snap(home));
noBiology.core.planetaryTravel.sessions[0].biologicalMode='fake-clock';
assert.throws(()=>advanceRemoteBiology(home,noBiology.core.planetaryTravel.sessions[0]),/no biological replay authority/);
console.log('E18 authentic inactive ecology PASS: canonical multi-stride population/plant/resource replay parity, true death and carrion, stored life events, weather conservation, precise save/return, global ID guards, bounded scheduling');
