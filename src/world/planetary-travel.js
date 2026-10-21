import {SURFACE_ICE,initializeSurfaceIce} from './surface-ice.js';
import {POPULATION_MODE} from './regional-replay-order.js';
import {PLANET_PROJECTIONS} from './planet-geography.js';
import {REGIONAL_FOUNDING,foundRegionalPopulations} from '../ecology/regional-founding.js';
import {assignRegionalBiologyModes} from './planetary-demography.js';
import {REGIONAL_RESIDENCY,residencyEnabled,crossingResidency} from './regional-residency.js';
// E15: explicit, gated, on-foot planetary frontier traversal.
// Departing populations and their controller states are checkpointed as a
// non-active region. The SAME traveling animal ID/body/genotype moves into
// the receiving simulation, which is installed atomically by the game UI.
// E18 advances inactive populations through bounded canonical biological ticks.
import {Simulation} from '../sim/simulation.js';
import {PlanetRegionAtlas,neighboringRegion,regionKey} from './planet-regions.js';
import {World} from './world.js';
import {RNG} from '../core/rng.js';
import {SPECIES} from '../organisms/species.js';
import {canSwim} from '../lineage/lifestyle.js';
import {createSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../persistence/save-manager.js';
import {bodyMass} from '../organisms/body-mass.js';
import {familyTravelCohort,familyArrivalPoint,FAMILY_PASSAGE} from './family-passage.js';
import {advanceRemoteEnvironment,remoteEnvironmentDue,OFFSCREEN_ENVIRONMENT} from './planetary-offscreen-environment.js';
import {advanceRemoteBiology,remoteBiologicalDebt,OFFSCREEN_BIOLOGY} from './planetary-offscreen-biology.js';
import {syncPlanetaryBoundaryOwnership} from './planetary-seam-salt.js';

const LIMIT=16,BOUNDARY=3.75,SIZE=128;
// Worlds recording regional-residency/1 bound resident archives by the loaded
// neighbourhood instead; farther regions are unloaded to storage, so the
// number of explored regions is not limited here.
const residentLimit=sim=>residencyEnabled(sim)?REGIONAL_RESIDENCY.maxResident:LIMIT;
const GLOBAL_AUTHORITIES=['lineage','evolution','evolutionTree','evolutionBudget','evolutionEditor','generationProgress'];
export function planetaryPreparationKey(sim,origin){return JSON.stringify([sim.seed,sim.world.planet?.descriptor?.projection??null,regionKey(origin),sim.massRules,sim.caveRules??null,sim.surfaceIceRules??null,sim.mateAssortmentRules??null]);}
export function preparePlanetaryDestination(sim,origin){
 const planet=sim.world.planet;if(!planet)throw Error('Planetary preparation requires a planetary source.');
 for(const x of [origin.x-1,origin.x+SIZE+1])for(const y of [origin.y-1,origin.y+SIZE+1])planet.localToGeo(x,y);
 const destination=new Simulation(sim.seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin,planetDescriptor:planet.descriptor,massRules:sim.massRules,localAssortment:sim.mateAssortmentRules!==undefined,naturalCaves:!!sim.caveRules,surfaceIce:sim.surfaceIceRules===SURFACE_ICE.policy});
 Object.defineProperty(destination,'preparedPlanetaryKey',{value:planetaryPreparationKey(sim,origin)});return destination;
}
const dirs=[
 {name:'west',distance:a=>a.x-1.5,coordinate:a=>a.y},
 {name:'east',distance:a=>SIZE-1.5-a.x,coordinate:a=>a.y},
 {name:'north',distance:a=>a.y-1.5,coordinate:a=>a.x},
 {name:'south',distance:a=>SIZE-1.5-a.y,coordinate:a=>a.x}
];
const limit=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const validSession=store=>store?.schema===1&&Number.isSafeInteger(store.nextId)&&store.nextId>=1&&
 Array.isArray(store.sessions)&&store.sessions.length<=REGIONAL_RESIDENCY.maxResident&&store.sessions.every(s=>typeof s.key==='string'&&s.snapshot?.world?.generator==='planetary/1');
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
export function planetaryTravelAvailability(sim){
 let proximity=null;
 const unavailable=reason=>({enabled:false,reason,...(proximity||{})});
 if(!sim?.planetaryRegions||sim.world.generator!=='planetary/1')return unavailable('Regional travel requires a planetary world.');
 const animal=sim.player();
 if(!animal?.alive)return unavailable('No living traveler.');
 const closest=[...dirs].sort((a,b)=>a.distance(animal)-b.distance(animal))[0];
 proximity={distance:closest.distance(animal),direction:closest.name};
 if(sim.paused)return unavailable('Resume the world first.');
 if(sim.playerAutonomy)return unavailable('Take manual control to cross a planetary frontier.');
 if((animal.diveDepth||0)>.03)return unavailable('Surface before regional travel.');
 if(animal.aerialMode==='jump')return unavailable('Finish the jump before regional travel.');
 if(animal.underground||animal.burrowWork||animal.caveTransit||animal.perched||animal.torpor)return unavailable('Descend or wake before traveling.');
 if(animal.pregnant)return unavailable('Complete the pregnancy before regional travel.');
 const cohort=familyTravelCohort(sim);
 if(!cohort.ok)return unavailable(cohort.reason);
 if(animal.courtshipPerformance||animal.courtshipSession)return unavailable('Finish courtship before leaving the region.');
 if(sim.playerCombat?.attackActive?.(animal)||animal.pursuitEngaged)return unavailable('Leave combat before crossing.');
 if(animal.energy<1||animal.hydration<1)return unavailable('Too exhausted or dehydrated for a regional journey.');
 if(closest.distance(animal)>BOUNDARY)return unavailable('Approach the edge of the planetary map to continue walking.');
 let nextOrigin;
 try{
  nextOrigin=neighboringRegion(sim.world.regionOrigin,closest.name);
  // The current globe projection is finite. Reject an impossible far frontier
  // *before* its lazy World constructor or 128-cell seam sampler can throw.
  const planet=sim.world.planet;
  for(const x of [nextOrigin.x-1,nextOrigin.x+SIZE+1])
   for(const y of [nextOrigin.y-1,nextOrigin.y+SIZE+1])planet.localToGeo(x,y);
 }catch{return unavailable(sim.world.planet.descriptor.projection===PLANET_PROJECTIONS.continental?'The polar ice limit or the far side of the world map is ahead; the planet continues no further in this direction.':'This historical world was created with the original regional map, which ends here.');}
 const point=approach(sim,closest,animal);
 const sessions=stored(sim),found=sessions.sessions.find(s=>s.key===regionKey(nextOrigin));
 const biological=found&&(found.biologicalMode==='canonical-ticks/1'||found.biologicalMode===POPULATION_MODE);
 if(biological&&remoteBiologicalDebt(sim,found)>OFFSCREEN_BIOLOGY.maxEntryTicks)
  return unavailable('Remote biology has more than '+OFFSCREEN_BIOLOGY.maxEntryTicks+' ticks to reconcile. Continue the current world for living ecology catchup.');
 if(found&&!biological&&remoteEnvironmentDue(sim,found)>OFFSCREEN_ENVIRONMENT.maxEntryBacklogDays)
  return unavailable('This region has more than '+OFFSCREEN_ENVIRONMENT.maxEntryBacklogDays+' days of physical weather to reconcile. Continue the current world to advance its environmental archive.');
 if(!found&&sessions.sessions.length>=residentLimit(sim))return unavailable(residencyEnabled(sim)?'Distant regions are still being stored. Wait a moment before exploring further.':'Regional archive full. Return to an explored region.');
 const residency=crossingResidency(sim,nextOrigin);if(!residency.ready)return unavailable(residency.reason);
 const archivedWorld=found?.snapshot?.world;
 const surveyed=archivedWorld?{regionOrigin:nextOrigin,n:SIZE,idx:(x,y)=>sim.world.idx(x,y),isPlayable:(x,y)=>sim.world.isPlayable(x,y),water:archivedWorld.surfaceWater.mask}:sim.planetaryRegions.get(nextOrigin,{create:false});
 const dest=surveyed||{
  regionOrigin:nextOrigin,
  n:SIZE,
  idx(x,y){return limit(Math.floor(y),0,SIZE-1)*SIZE+limit(Math.floor(x),0,SIZE-1)},
  isPlayable(x,y){return x>1&&y>1&&x<SIZE-2&&y<SIZE-2},
  water:new Proxy({}, {get(_,key){const i=Number(key);if(!Number.isSafeInteger(i))return undefined;return sim.world.planet.sample(nextOrigin.x+(i%SIZE)+.5,nextOrigin.y+Math.floor(i/SIZE)+.5).water}})
 };
 const placements=cohort.members.map((member,index)=>({member,point:familyArrivalPoint(animal,point,member,closest.name,index)}));
 for(const item of placements)if(!continuousBorder(sim,closest,item.member,dest,item.point))
  return unavailable('A family member cannot physically cross this border. Reposition the group or evolve suitable movement anatomy.');
 return{enabled:true,reason:cohort.members.length>1?'Cross '+closest.name+' together with '+(cohort.members.length-1)+' nearby family members.':'Cross the '+closest.name+' planetary region while preserving your creature and local ecology.',
  direction:closest.name,to:nextOrigin,point,distance:closest.distance(animal),members:cohort.members.map(m=>m.id),
  dependentCount:cohort.dependentCount,adultCount:cohort.adultCount,placements:placements.map(({member,point})=>({id:member.id,point}))};
}
function strippedRegionSnapshot(sim,ids){
 // The checkpoint is a newly built descriptor. Remove other regional
 // authorities BEFORE deep cloning: each belongs to the destination's
 // separate session ledger, never inside the region being archived.
 // Cloning first multiplied every archived seed bank and fauna store during
 // each border crossing, only to discard those copies immediately.
 const checkpoint=createSimulationSnapshot(sim,{reason:'regional-departure',savedAt:'regional-checkpoint',regionalDeparture:true});
 // Defense in depth: no other regional owner may be embedded in this archive.
 if(checkpoint.core.planetaryTravel||checkpoint.regionalWorlds)
  throw Error('Recursive regional departure authority.');
 const source=structuredClone(checkpoint);
 const departure=new Set(ids);
 const slots=source.animals.flatMap((a,index)=>departure.has(a.id)?[{id:a.id,index}]:[]);
 if(slots.length!==departure.size)throw Error('Regional family cohort is not fully owned by departing territory.');
 if(slots.length===1)source.core.regionalTravelerSlot=slots[0].index;
 else source.core.regionalTravelerSlots=slots;
 source.animals=source.animals.filter(a=>!departure.has(a.id));
 source.core.playerId=null;source.core.playerEnabled=false;
 return source;
}
function transferGlobals(from,to){
 // Lineage progression/evolution budgets apply to a traveler globally, while
 // feeding, territory, nest, soil and all local fauna controllers remain local.
 // These six traveler-global controllers do not require a full World or
 // packed seed-bank snapshot. Copy their own enumerable saved fields with
 // exactly the same omit-functions/omit-sim semantics as snapshotControllers.
 for(const name of GLOBAL_AUTHORITIES){
  const controller=to[name];
  if(!controller)continue;
  const owned={};
  for(const [key,value] of Object.entries(from[name]||{})){
   if(key==='sim'||typeof value==='function')continue;
   owned[key]=value;
  }
  for(const key of Object.keys(controller))if(key!=='sim'&&!(key in owned))delete controller[key];
  Object.assign(controller,structuredClone(owned));
  controller.sim=to;
 }
}
export function crossPlanetaryBorder(sim,{preparedDestination=null}={}){
 const status=planetaryTravelAvailability(sim);
 if(!status.enabled)return{ok:false,type:'planet-travel',message:status.reason};
 const traveler=sim.player(),memberIds=status.members,cohort=memberIds.map(id=>sim.animals.find(a=>a.id===id)),sourceKey=regionKey(sim.world.regionOrigin),destinationKey=regionKey(status.to),prior=stored(sim);
 const sessions=prior.sessions.filter(s=>s.key!==destinationKey&&s.key!==sourceKey).map(s=>({...s}));
 const oldDestination=prior.sessions.find(s=>s.key===destinationKey);
 if(preparedDestination&&(oldDestination||preparedDestination.preparedPlanetaryKey!==planetaryPreparationKey(sim,status.to)||preparedDestination.tickCount!==0||preparedDestination.animals.length||preparedDestination.playerEnabled||preparedDestination.nextId!==1||regionKey(preparedDestination.world.regionOrigin)!==destinationKey))throw Error('Invalid or already owned prepared destination.');
 // Archived snapshots are immutable input until their replacement is
 // atomically published. A shallow session shell is enough for catchup:
 // replay assigns a NEW snapshot and ledger only after successful validation.
 const archivedDestination=oldDestination?{...oldDestination}:null;
 if(archivedDestination){
  if(archivedDestination.biologicalMode==='canonical-ticks/1'||archivedDestination.biologicalMode===POPULATION_MODE)advanceRemoteBiology(sim,archivedDestination,{maxTicks:OFFSCREEN_BIOLOGY.maxEntryTicks});
  else advanceRemoteEnvironment(sim,archivedDestination,{maxDays:OFFSCREEN_ENVIRONMENT.maxEntryBacklogDays});
 }
 const nextId=Math.max(prior.nextId,sim.nextId);
 // Construct destination and all receipts before modifying the active sim.
 const dest=archivedDestination?restoreDetachedSimulationSnapshot(archivedDestination.snapshot):preparedDestination||preparePlanetaryDestination(sim,status.to);
 // Local seed-wind rules are a planetary-world policy. A newly entered
 // region follows the originating world's version; an old missing-policy
 // save must not silently adopt wind merely because its destination is new.
 if(Object.hasOwn(sim.dispersal,'windSeedPolicy'))
  dest.dispersal.windSeedPolicy=sim.dispersal.windSeedPolicy;
 else delete dest.dispersal.windSeedPolicy;
 if(!archivedDestination){
  const surveyed=sim.planetaryRegions.get(status.to,{create:false});
  if(surveyed)dest.world=surveyed;
  if(sim.surfaceIceRules===SURFACE_ICE.policy)initializeSurfaceIce(dest.world);
  dest.rng=new RNG(sim.seed+'|regional-fauna|'+destinationKey);
  dest.nextId=nextId+1;
  // Only ONCE for a newly entered region; archived regions never re-found.
  if(sim.regionalFoundingRules===REGIONAL_FOUNDING.policy)foundRegionalPopulations(dest,{region:destinationKey});
  else dest.spawnInitial();
  dest.regionalEcology.resetPageResidency();
 }
 const placements=new Map(status.placements.map(p=>[p.id,p.point]));
 const arrivals=cohort.map(member=>{
  const copy=structuredClone(member),point=placements.get(member.id);
  if(!point)throw Error('Cohort arrival missing physically validated crossing.');
  Object.assign(copy,{x:point.x,y:point.y,player:member.id===traveler.id,
   target:null,navigationRoute:null,pursuitEngaged:false,hidden:false,movedTick:sim.tickCount});
  copy.energy=Math.max(0,copy.energy-FAMILY_PASSAGE.energyCost*bodyMass(copy));
  return copy;
 });
 const arrivalsById=new Map(arrivals.map(a=>[a.id,a]));
 if(dest.animals.some(a=>arrivalsById.has(a.id)))throw Error('Cannot transfer duplicate creature identity into a region.');
 const oldSlots=dest.regionalTravelerSlots||(
  Number.isSafeInteger(dest.regionalTravelerSlot)?[{id:traveler.id,index:dest.regionalTravelerSlot}]:[]);
 const used=new Set();
 // Insert travelers at their historical position in their old region if
 // remembered. This preserves exact pre-departure family and wildlife order.
 for(const {id,index} of [...oldSlots].sort((a,b)=>a.index-b.index)){
  const arrival=arrivalsById.get(id);
  if(!arrival)continue;
  if(!Number.isSafeInteger(index)||index<0||index>dest.animals.length)throw Error('Corrupt regional traveler position.');
  dest.animals.splice(index,0,arrival);used.add(id);
 }
 for(const arrival of arrivals)if(!used.has(arrival.id))dest.animals.push(arrival);
 delete dest.regionalTravelerSlot;delete dest.regionalTravelerSlots;
 dest.playerId=traveler.id;dest.playerEnabled=true;
 dest.nextId=Math.max(dest.nextId,nextId+1,...arrivals.map(a=>a.id+1));
 transferGlobals(sim,dest);
 dest.tickCount=sim.tickCount;dest.day=sim.day;dest.year=sim.year;dest.seasonIndex=sim.seasonIndex;
 dest.phase=sim.phase;dest.climate=sim.climate?{...sim.climate}:undefined;
 dest.paused=sim.paused;dest.playerAutonomy=false;
 dest.regionalEcology.resetPageResidency();dest.rebuildSpatial();
 // Keep all pre-surveyed Worlds in the same atlas and replace the activated
 // region with its exact saved World rather than a re-generated approximation.
 const atlas=new PlanetRegionAtlas(dest.world,origin=>new World(sim.seed,{generator:'planetary/1',planetOrigin:origin,planetDescriptor:sim.world.planet.descriptor}));
 const archivedKeys=new Set([...sessions.map(s=>s.key),sourceKey]);
 for(const {world} of sim.planetaryRegions.entries()){
  if(regionKey(world.regionOrigin)===destinationKey||archivedKeys.has(regionKey(world.regionOrigin)))continue;
  atlas.install(world);
 }
 dest.planetaryRegions=atlas;
 sessions.push({key:sourceKey,snapshot:strippedRegionSnapshot(sim,memberIds),...(sim.offscreenBiologyEnabled?{biologicalMode:'canonical-ticks/1'}:{})});
 dest.planetaryTravel={schema:1,nextId:dest.nextId,sessions,...(prior.unloaded?.length?{unloaded:prior.unloaded.map(e=>structuredClone(e))}:{}),
  ...(prior.seamLedger?{seamLedger:structuredClone(prior.seamLedger)}:{})};
 for(const key of ['habitatHazardRules','fireRules','thunderRules','stratumSenseRules','stratumSenseRuleMigrations','vibrationRules','mateAssortmentRules','sensoryFogEnabled','surfaceIceRules','surfaceIceRuleMigrations','thermalRefugeRules','thermalRefugeRuleMigrations','thermalRules','thermalPattern','thermalRuleMigrations','visibilityRules','visibilityRuleMigrations','caveRules','caveRuleMigrations','burrowingRules','burrowingRuleMigrations','climbingRules','climbingRuleMigrations','divingRules','divingRuleMigrations','movementRuleMigrations','jumpingRules','glidingRules','diggingRules','diggingRuleMigrations','carcassRules','carcassRuleMigrations','creatureStart','authoredIntroductions','regionalFoundingRules','regionalDemographyRules','regionalResidencyRules']){if(Object.hasOwn(sim,key))dest[key]=structuredClone(sim[key]);else delete dest[key];}
 if(!dest.habitatHazardRules)delete dest.habitatHazards;
 if(!dest.fireRules)delete dest.wildfire;
 if(!dest.thunderRules)delete dest.thunderstorms;
 dest.travelFamilyGroup=!!sim.travelFamilyGroup;
 if(sim.burrowingRules===undefined)delete dest.world.subsurface;
 dest.offscreenBiologyEnabled=!!sim.offscreenBiologyEnabled;
 if(Object.hasOwn(sim,'regionalReplayPolicy'))dest.regionalReplayPolicy=sim.regionalReplayPolicy;else delete dest.regionalReplayPolicy;
 // Keep the archived source and newly active destination from each importing
 // the other's known water as a second external geographic reservoir.
 // Full individual simulation near the new position; population model beyond.
 assignRegionalBiologyModes(dest);
 syncPlanetaryBoundaryOwnership(dest);
 dest.lastPlayerAction={type:'planet-travel',actorId:traveler.id,members:memberIds,from:sourceKey,to:destinationKey,tick:dest.tickCount};
 return{ok:true,type:'planet-travel',message:'Crossed '+status.direction+' into planetary region '+destinationKey+(memberIds.length>1?' with '+(memberIds.length-1)+' family members.':'.')+' Regional wildlife and resources are retained.',simulation:dest,from:sourceKey,to:destinationKey,id:traveler.id,members:memberIds};
}
