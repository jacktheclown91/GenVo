// Planetary handoff ownership regression: source region and traveler-global
// authorities must be byte-identical to the original full-clone semantics.
// Verify no archived-world recursion, no aliasing, and actual two-way travel.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {regionKey} from '../src/world/planet-regions.js';

const same=(a,b,msg)=>assert.ok(isDeepStrictEqual(a,b),msg);
const globals=['lineage','evolution','evolutionTree','evolutionBudget','evolutionEditor','generationProgress'];
function referenceArchive(sim,ids){
 // Intentionally preserve the ORIGINAL deep-copy-then-discard algorithm for
 // the test oracle; production must never use it for repeated crossings.
 const source=structuredClone(createSimulationSnapshot(sim,{reason:'regional-departure',savedAt:'regional-checkpoint'}));
 const departures=new Set(ids);
 const slots=source.animals.flatMap((a,index)=>departures.has(a.id)?[{id:a.id,index}]:[]);
 assert.equal(slots.length,departures.size);
 if(slots.length===1)source.core.regionalTravelerSlot=slots[0].index;
 else source.core.regionalTravelerSlots=slots;
 source.animals=source.animals.filter(a=>!departures.has(a.id));
 source.core.playerId=null;source.core.playerEnabled=false;
 delete source.core.planetaryTravel;delete source.regionalWorlds;
 return source;
}
function locate(sim,direction,y=null){
 const a=sim.player();
 for(let v=8.5;v<118.5;v+=1){
  a.x=direction==='east'?125.2:2.5;
  a.y=y??v;
  sim.rebuildSpatial();
  const status=planetaryTravelAvailability(sim);
  if(status.enabled&&status.direction===direction)return status;
  if(y!==null)break;
 }
 throw Error('No real traversable '+direction+' frontier for seed');
}
let home=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
const eastStatus=locate(home,'east');
const exitY=home.player().y;
const startGlobals=createSimulationSnapshot(home,{savedAt:'fixed',reason:'global-copy'}).controllers;
const expectedHome=referenceArchive(home,eastStatus.members);
const beforeHome=structuredClone(createSimulationSnapshot(home,{savedAt:'fixed',reason:'origin-immutable'}));
const depart=crossPlanetaryBorder(home);
assert.equal(depart.ok,true,depart.message);
const east=depart.simulation;
same(createSimulationSnapshot(home,{savedAt:'fixed',reason:'origin-immutable'}),beforeHome,
 'departing must leave the original runtime unchanged');
const homeStored=east.planetaryTravel.sessions.find(s=>s.key==='0,0');
same(homeStored?.snapshot,expectedHome,'new archive is identical to full-clone reference');
assert.equal(Object.hasOwn(homeStored.snapshot.core,'planetaryTravel'),false,'archives never nest');
for(const name of globals){
 const actual=Object.fromEntries(Object.entries(east[name]).filter(([key,value])=>key!=='sim'&&typeof value!=='function'));
 same(actual,startGlobals[name],name+' global authority is unchanged by direct extraction');
}
const originalArchive=structuredClone(homeStored.snapshot);
const current=locate(east,'west',exitY);
const expectedEast=referenceArchive(east,current.members);
const fullEast=createSimulationSnapshot(east,{reason:'regional-departure',savedAt:'regional-checkpoint'});
const departureOnly=createSimulationSnapshot(east,{reason:'regional-departure',savedAt:'regional-checkpoint',regionalDeparture:true});
delete fullEast.core.planetaryTravel;
delete fullEast.regionalWorlds;
same(structuredClone(departureOnly),structuredClone(fullEast),
 'departure-only snapshot mode matches the entire historical snapshot after discarded archives are removed');
assert.equal(Object.hasOwn(departureOnly.core,'planetaryTravel'),false,'departure mode never creates a recursive travel payload');
assert.equal(Object.hasOwn(departureOnly,'regionalWorlds'),false,'departure mode never creates surveyed neighboring world payloads');
const returned=crossPlanetaryBorder(east);
assert.equal(returned.ok,true,returned.message);
const homeAgain=returned.simulation;
same(homeStored.snapshot,originalArchive,'return must not edit archived source bytes');
const eastStored=homeAgain.planetaryTravel.sessions.find(s=>s.key==='128,0');
same(eastStored?.snapshot,expectedEast,'second departure with existing archive preserves exact source region');
assert.equal(regionKey(homeAgain.world.regionOrigin),'0,0');
assert.equal(homeAgain.player().id,home.player().id,'return uses the original creature identity');
same(homeAgain.world.plants,home.world.plants,'return retains the original physical plant resources');
assert.equal(homeAgain.planetaryTravel.sessions.length,1,'one canonical region per archived territory');
console.log('Planetary handoff copies PASS: identical archive/global state, no recursive snapshot clones, read-only source and real border return');
