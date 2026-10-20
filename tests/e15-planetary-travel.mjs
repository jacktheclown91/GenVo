import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {regionKey,neighboringRegion,validatePlanetaryTravelState} from '../src/world/planet-regions.js';

const seed='PLANET-B0-A',sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1'}),a=sim.player();
const initialCount=sim.animals.length,initialId=a.id,genes=structuredClone(a.genes),body=structuredClone(a.bodyPlan),g=structuredClone(a.reproductiveGenome);
assert.ok(sim.planetaryRegions);
const checkpoint=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e15'}));
assert.equal(planetaryTravelAvailability(sim).enabled,false,'no free departure from arbitrary world center');
const fromIndex=sim.world.idx(21,41),previousStock=sim.world.plants.bramble[fromIndex];
sim.world.plants.bramble[fromIndex]=.234;
let approved=null;
a.energy=SPECIES[a.species].maxEnergy*.94;a.hydration=SPECIES[a.species].maxHydration*.95;
for(let y=8.5;y<118.5;y+=1){
 a.x=125.2;a.y=y;sim.rebuildSpatial();
 const status=planetaryTravelAvailability(sim);
 if(status.enabled){approved=status;break;}
}
assert.ok(approved,'a world with real upland must expose a traversable planetary land border');
assert.equal(approved.direction,'east');
const exitY=a.y,before=a.energy,worldSource=sim.world,sourceIds=sim.animals.map(t=>t.id),stateBefore=checkpoint(sim);
const crossed=crossPlanetaryBorder(sim);
assert.equal(crossed.ok,true,crossed.message);
const east=crossed.simulation,traveler=east.player();
assert.notStrictEqual(east,sim,'the destination is a real independent regional simulation');
assert.equal(east.dispersal.windSeedPolicy,sim.dispersal.windSeedPolicy,'planetary seed wind rules transfer to new regions');
assert.deepEqual(east.world.regionOrigin,{x:128,y:0});
assert.equal(traveler.id,initialId);
assert.deepEqual(traveler.genes,genes);
assert.deepEqual(traveler.bodyPlan,body);
assert.deepEqual(traveler.reproductiveGenome,g);
assert.ok(traveler.energy<before,'crossing pays food energy instead of being a free teleport');
assert.equal(east.animals.filter(t=>t.id===initialId).length,1);
assert.equal(new Set(east.animals.map(t=>t.id)).size,east.animals.length,'no duplicate fauna IDs in receiving world');
assert.ok(east.animals.length>1,'receiving region has independent founding wild fauna, not an empty backdrop');
assert.equal(sim.animals.length,initialCount,'the previous simulation is not secretly mutated by the regional departure transaction');
assert.strictEqual(sim.world,worldSource);
assert.equal(east.planetaryTravel.sessions.length,1);
const homeArchive=east.planetaryTravel.sessions[0];
assert.equal(homeArchive.key,'0,0');
assert.equal(homeArchive.snapshot.animals.length,initialCount-1,'only traveler leaves; all other source fauna persist');
assert.ok(!homeArchive.snapshot.animals.some(t=>t.id===initialId));
assert.equal(homeArchive.snapshot.world.plants.bramble[fromIndex],sim.world.plants.bramble[fromIndex]);

const eastIndex=east.world.idx(24,47),eastStock=east.world.plants.bramble[eastIndex];
east.world.plants.bramble[eastIndex]=.217;
// Keep seed-bank changes inside dispersal's canonical seed/genotype controller;
// this test changes standing crop tissue only, not an unsynchronized raw bank.
const liveSave=checkpoint(east);
assert.equal(liveSave.regionalWorlds?.length||0,0,'archived physical region must not be written twice into regionalWorlds');
const loaded=restoreSimulationSnapshot(structuredClone(liveSave));
assert.deepEqual(checkpoint(loaded),liveSave,'travel save fully round trips with regional fauna/controller archive');
assert.equal(loaded.player().id,initialId);
assert.equal(loaded.planetaryTravel.sessions[0].snapshot.animals.length,initialCount-1);
assert.ok(loaded.nextId>Math.max(...loaded.animals.map(t=>t.id)));

// Source has a physically traversable return, local world margin is not
// a second invented ocean or teleport-through-water authority.
loaded.player().x=2.5;loaded.player().y=exitY;
const returnStatus=planetaryTravelAvailability(loaded);
assert.equal(returnStatus.enabled,true,returnStatus.reason);
const returning=crossPlanetaryBorder(loaded);
assert.equal(returning.ok,true,returning.message);
const home=returning.simulation;
assert.deepEqual(home.world.regionOrigin,{x:0,y:0});
assert.equal(home.player().id,initialId,'same individual returns to original territory');
assert.equal(home.dispersal.windSeedPolicy,east.dispersal.windSeedPolicy,'return travel retains the same seed wind version');
assert.deepEqual(home.player().bodyPlan,body);
assert.deepEqual(home.player().genes,genes);
assert.equal(home.world.plants.bramble[fromIndex],sim.world.plants.bramble[fromIndex],'home food stock was never regenerated');
assert.equal(home.animals.length,initialCount,'return restores original residents plus the same traveler');
assert.deepEqual(home.animals.map(t=>t.id),sourceIds,'source animal IDs and ordering preserved through actual crossing');
assert.equal(home.planetaryTravel.sessions.length,1);
assert.equal(home.planetaryTravel.sessions[0].key,'128,0');
assert.ok(!home.planetaryTravel.sessions[0].snapshot.animals.some(t=>t.id===initialId),'active player never appears among remote wildlife');
const restoredSave=checkpoint(home),roundTrip=restoreSimulationSnapshot(structuredClone(restoredSave));
assert.deepEqual(checkpoint(roundTrip),restoredSave,'round-trip expedition remains resumable after landing');

// Second entry is the actual previously inhabited eastern ecosystem, NOT a
// fresh region with full food, reset wild animals, or changed ancestry.
roundTrip.player().x=125.2;roundTrip.player().y=exitY;
const backEast=crossPlanetaryBorder(roundTrip);
assert.equal(backEast.ok,true,backEast.message);
assert.equal(backEast.simulation.world.plants.bramble[eastIndex],east.world.plants.bramble[eastIndex]);
assert.equal(backEast.simulation.world.seedBank.bramble[eastIndex],east.world.seedBank.bramble[eastIndex]);
assert.equal(backEast.simulation.animals.length,east.animals.length,'eastern fauna are restored, not cloned');

// More constraints: no region crossing with a dependent newborn, no floating
// player duplicates in archived sessions, forged saves rejected.
const child={id:999999,alive:true,species:'genvo',age:0,caregiverId:backEast.simulation.playerId};
backEast.simulation.animals.push(child);
backEast.simulation.player().x=2.5;
assert.match(planetaryTravelAvailability(backEast.simulation).reason,/Dependent young/);
backEast.simulation.animals.pop();
// Region transfer must remain playable after crossing: actual ecology ticks,
// perception, independent fauna decisions and environment updates still run.
const live=backEast.simulation,actorId=live.playerId;
for(let tick=0;tick<12;tick++)live.update(null);
assert.equal(live.tickCount,home.tickCount+12);
assert.equal(live.playerId,actorId);
assert.equal(live.world.regionOrigin.x,128);
assert.ok(live.animals.some(t=>t.id===actorId&&t.alive),'transferred animal survives a normal regional ecology step');
const bad=checkpoint(home);
bad.core.planetaryTravel.sessions.push(structuredClone(bad.core.planetaryTravel.sessions[0]));
assert.throws(()=>restoreSimulationSnapshot(bad),/Duplicate or misplaced/);
assert.throws(()=>validatePlanetaryTravelState({schema:1,nextId:5,sessions:[{key:'0,0',snapshot:{world:{generator:'planetary/1',regionOrigin:{x:128,y:0}}}}]}),/Duplicate or misplaced/);

console.log('E15 real player frontier crossing, physiological cost, natural regional fauna, identity/genetics, archived population, live two-way return, same resource stores, save/load and duplicate-protection PASS');
