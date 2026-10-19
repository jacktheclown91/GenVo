// E15: explicit, gated, on-foot planetary frontier traversal.
// Departing populations and their controller states are checkpointed as a
// non-active region. The SAME traveling animal ID/body/genotype moves into
// the receiving simulation, which is installed atomically by the game UI.
// Remote populations do not tick while their region is inactive.
import {Simulation} from '../sim/simulation.js';
import {PlanetRegionAtlas,neighboringRegion,regionKey} from './planet-regions.js';
import {World} from './world.js';
import {RNG} from '../core/rng.js';
import {SPECIES} from '../organisms/species.js';
import {canSwim} from '../lineage/lifestyle.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../persistence/save-manager.js';
import {bodyMass} from '../organisms/body-mass.js';

const LIMIT=16,BOUNDARY=3.75,SIZE=128;
const GLOBAL_AUTHORITIES=['lineage','evolution','evolutionTree','evolutionBudget','evolutionEditor','generationProgress'];
const dirs=[
 {name:'west',distance:a=>a.x-1.5,coordinate:a=>a.y},
 {name:'east',distance:a=>SIZE-1.5-a.x,coordinate:a=>a.y},
 {name:'north',distance:a=>a.y-1.5,coordinate:a=>a.x},
 {name:'south',distance:a=>SIZE-1.5-a.y,coordinate:a=>a.x}
];
const limit=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const validSession=store=>store?.schema===1&&Number.isSafeInteger(store.nextId)&&store.nextId>=1&&
 Array.isArray(store.sessions)&&store.sessions.length<=LIMIT&&store.sessions.every(s=>typeof s.key==='string'&&s.snapshot?.world?.generator==='planetary/1');
function stored(sim){const st=sim.planetaryTravel||{schema:1,nextId:sim.nextId,sessions:[]};if(!validSession(st))throw Error('Invalid planetary travel state.');return st}
function approach(sim,dir,animal){
 const c=limit(dir.coordinate(animal),2.5,SIZE-2.5),far=SIZE-2.5,near=2.5;
 const dest=dir.name==='west'?{x:far,y:c}:dir.name==='east'?{x:near,y:c}:
  dir.name==='north'?{x:c,y:far}:{x:c,y:near};
 return dest;
}
function continuousBorder(sim,dir,animal,destination,point){
 const w=sim.world,p=w.planet,from=w.regionOrigin,to=destination.regionOrigin;
 if(!p||!to)return false;
 // Sample every intervening physical tile. These represent the currently
 // unplayable 2-tile collision margin, so a land creature cannot bypass water.
 const origin=dir.name==='east'?{x:from.x+animal.x,y:from.y+animal.y}:
  dir.name==='west'?{x:from.x+animal.x,y:from.y+animal.y}:
  {x:from.x+animal.x,y:from.y+animal.y};
 const end={x:to.x+point.x,y:to.y+point.y};
 const travel=Math.hypot(end.x-origin.x,end.y-origin.y),swimmer=canSwim(animal);
 const flying=!!animal.airborne;
 for(let step=0;step<=Math.ceil(travel*2);step++){
  const t=step/Math.max(1,Math.ceil(travel*2)),x=origin.x+(end.x-origin.x)*t,y=origin.y+(end.y-origin.y)*t;
  const s=p.sample(x,y);
  if(s.water&&!flying&&!swimmer)return false;
 }
 const idx=destination.idx(point.x,point.y);
 return destination.isPlayable(point.x,point.y)&&(!destination.water[idx]||flying||swimmer);
}
function hasDependentChildren(sim,a){
 return sim.animals.some(b=>b.alive&&b.id!==a.id&&
  (b.caregiverId===a.id||b.lactationParentId===a.id)&&
  b.age<(SPECIES[b.species]?.maturity||10)*.8);
}
export function planetaryTravelAvailability(sim){
 const unavailable=reason=>({enabled:false,reason});
 if(!sim?.planetaryRegions||sim.world.generator!=='planetary/1')return unavailable('Regional travel requires a planetary world.');
 const animal=sim.player();
 if(!animal?.alive)return unavailable('No living traveler.');
 if(sim.paused)return unavailable('Resume the world first.');
 if(sim.playerAutonomy)return unavailable('Take manual control to cross a planetary frontier.');
 if(animal.perched||animal.torpor)return unavailable('Descend or wake before traveling.');
 if(animal.pregnant||hasDependentChildren(sim,animal))return unavailable('Dependent young or pregnancy require remaining with the local family.');
 if(animal.courtshipPerformance||animal.courtshipSession)return unavailable('Finish courtship before leaving the region.');
 if(sim.playerCombat?.attackActive?.(animal)||animal.pursuitEngaged)return unavailable('Leave combat before crossing.');
 if(animal.energy<1||animal.hydration<1)return unavailable('Too exhausted or dehydrated for a regional journey.');
 const closest=[...dirs].sort((a,b)=>a.distance(animal)-b.distance(animal))[0];
 if(closest.distance(animal)>BOUNDARY)return unavailable('Approach the edge of the planetary map to continue walking.');
 const nextOrigin=neighboringRegion(sim.world.regionOrigin,closest.name),point=approach(sim,closest,animal);
 const sessions=stored(sim),found=sessions.sessions.find(s=>s.key===regionKey(nextOrigin));
 if(!found&&sessions.sessions.length>=LIMIT)return unavailable('Regional archive full. Return to an explored region.');
 const surveyed=sim.planetaryRegions.get(nextOrigin,{create:false});
 const dest=surveyed||{
  regionOrigin:nextOrigin,
  n:SIZE,
  idx(x,y){return limit(Math.floor(y),0,SIZE-1)*SIZE+limit(Math.floor(x),0,SIZE-1)},
  isPlayable(x,y){return x>1&&y>1&&x<SIZE-2&&y<SIZE-2},
  water:new Proxy({}, {get(_,key){const i=Number(key);if(!Number.isSafeInteger(i))return undefined;return sim.world.planet.sample(nextOrigin.x+(i%SIZE)+.5,nextOrigin.y+Math.floor(i/SIZE)+.5).water}})
 };
 if(!continuousBorder(sim,closest,animal,dest,point))return unavailable('The border contains water or unsuitable terrain. Find another crossing or evolve swimming/flight.');
 return{enabled:true,reason:'Walk into the '+closest.name+' planetary region; your creature and local ecosystems are preserved.',
  direction:closest.name,to:nextOrigin,point,distance:closest.distance(animal)};
}
function strippedRegionSnapshot(sim,animalId){
 const source=structuredClone(createSimulationSnapshot(sim,{reason:'regional-departure',savedAt:'regional-checkpoint'}));
 source.animals=source.animals.filter(a=>a.id!==animalId);
 source.core.playerId=null;source.core.playerEnabled=false;
 delete source.core.planetaryTravel;delete source.regionalWorlds;
 return source;
}
function transferGlobals(from,to){
 // Lineage progression/evolution budgets apply to a traveler globally, while
 // feeding, territory, nest, soil and all local fauna controllers remain local.
 const snapshot=createSimulationSnapshot(from,{reason:'regional-handoff',savedAt:'regional-handoff'});
 for(const name of GLOBAL_AUTHORITIES){
  const controller=to[name],owned=snapshot.controllers?.[name];
  if(!controller||!owned)continue;
  for(const key of Object.keys(controller))if(key!=='sim'&&!(key in owned))delete controller[key];
  Object.assign(controller,structuredClone(owned));
  controller.sim=to;
 }
}
export function crossPlanetaryBorder(sim){
 const status=planetaryTravelAvailability(sim);
 if(!status.enabled)return{ok:false,type:'planet-travel',message:status.reason};
 const traveler=sim.player(),sourceKey=regionKey(sim.world.regionOrigin),destinationKey=regionKey(status.to),prior=stored(sim);
 const sessions=prior.sessions.filter(s=>s.key!==destinationKey&&s.key!==sourceKey).map(s=>({key:s.key,snapshot:s.snapshot}));
 const archivedDestination=prior.sessions.find(s=>s.key===destinationKey);
 const nextId=Math.max(prior.nextId,sim.nextId);
 // Construct destination and all receipts before modifying the active sim.
 const dest=archivedDestination?restoreSimulationSnapshot(structuredClone(archivedDestination.snapshot)):
  new Simulation(sim.seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:status.to,massRules:sim.massRules});
 if(!archivedDestination){
  const surveyed=sim.planetaryRegions.get(status.to,{create:false});
  if(surveyed)dest.world=surveyed;
  dest.rng=new RNG(sim.seed+'|regional-fauna|'+destinationKey);
  dest.nextId=nextId+1;
  dest.spawnInitial(); // Only ONCE for a newly entered region.
  dest.regionalEcology.resetPageResidency();
 }
 const arrival=structuredClone(traveler);
 arrival.x=status.point.x;arrival.y=status.point.y;arrival.player=true;
 arrival.target=null;arrival.navigationRoute=null;arrival.pursuitEngaged=false;
 arrival.hidden=false;arrival.movedTick=sim.tickCount;
 // Crossing the 2-tile local collision margins costs actual energy.
 arrival.energy=Math.max(0,arrival.energy-.035*bodyMass(arrival));
 if(dest.animals.some(a=>a.id===arrival.id))throw Error('Cannot transfer duplicate creature identity into a region.');
 dest.animals.push(arrival);dest.playerId=arrival.id;dest.playerEnabled=true;
 dest.nextId=Math.max(dest.nextId,nextId+1,arrival.id+1);
 transferGlobals(sim,dest);
 dest.tickCount=sim.tickCount;dest.day=sim.day;dest.year=sim.year;dest.seasonIndex=sim.seasonIndex;
 dest.phase=sim.phase;dest.climate=sim.climate?{...sim.climate}:undefined;
 dest.paused=sim.paused;dest.playerAutonomy=false;
 dest.regionalEcology.resetPageResidency();dest.rebuildSpatial();
 // Keep all pre-surveyed Worlds in the same atlas and replace the activated
 // region with its exact saved World rather than a re-generated approximation.
 const atlas=new PlanetRegionAtlas(dest.world,origin=>new World(sim.seed,{generator:'planetary/1',planetOrigin:origin}));
 for(const {world} of sim.planetaryRegions.entries()){
  if(regionKey(world.regionOrigin)===destinationKey)continue;
  atlas.install(world);
 }
 dest.planetaryRegions=atlas;
 sessions.push({key:sourceKey,snapshot:strippedRegionSnapshot(sim,traveler.id)});
 dest.planetaryTravel={schema:1,nextId:dest.nextId,sessions};
 dest.lastPlayerAction={type:'planet-travel',actorId:arrival.id,from:sourceKey,to:destinationKey,tick:dest.tickCount};
 return{ok:true,type:'planet-travel',message:'Crossed '+status.direction+' into planetary region '+destinationKey+'. Regional wildlife and resources are retained.',simulation:dest,from:sourceKey,to:destinationKey,id:arrival.id};
}
