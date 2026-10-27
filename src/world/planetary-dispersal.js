import {mergeEvolutionaryTreeHistory,evolutionaryHistoryForBodies} from '../lineage/evolution-tree-history.js';
import {regionalEvolutionEnabled} from '../lineage/autonomous-evolution.js';
import {CFG} from '../sim/config.js';
import {planetRegionOrigin,regionKey,neighboringRegion,compactRegionalTravelerPositions} from './planet-regions.js';
import {canSwim} from '../lineage/lifestyle.js';
import {isWaterDweller} from '../lineage/aquatic.js';
import {markRegionalOwnerDirty} from './regional-revision.js';

// Cross-region wildlife dispersal (regional-dispersal/1, creator direction
// 2026-10-21). Movement only: the decision to leave is the existing migration
// authority (a mature, independent animal whose breeding the shared carrying
// authority refuses, with no better reachable site inside its region); this
// module only opens a border and moves the SAME organism, with its identity,
// body, genome and history, into the physically adjacent region.
// A direction is open only when the neighbour is the active region or a
// resident regional record whose clock is within one life stride, and when a
// real arrival position exists on the other side. Unvisited regions are never
// materialized by wildlife and unloaded regions stay closed, so no animal is
// held in an unsimulated limbo and no region is invented.
export const REGIONAL_DISPERSAL=Object.freeze({policy:'regional-dispersal/1',inset:2.5,arrivalSearch:8,historyLength:8,logLength:64});
export const dispersalEnabled=sim=>sim?.regionalDispersalRules===REGIONAL_DISPERSAL.policy;
export const DIRECTIONS=Object.freeze(['north','south','east','west']);
const N=128;
// The border point an emigrant walks to, and where it arrives next door.
export function exitPoint(direction,x,y){const i=REGIONAL_DISPERSAL.inset;return direction==='east'?{x:N-i,y}:direction==='west'?{x:i,y}:direction==='north'?{x,y:i}:{x,y:N-i}}
function arrivalLine(direction,x,y){const i=REGIONAL_DISPERSAL.inset;return direction==='east'?{x:i,y}:direction==='west'?{x:N-i,y}:direction==='north'?{x,y:N-i}:{x,y:i}}
const playable=(x,y)=>x>1&&y>1&&x<N-2&&y<N-2;
// Nearest cell on the far side, along the seam, that this body can occupy.
function placeArrival(water,direction,x,y,animal){
 const base=arrivalLine(direction,x,y),along=direction==='east'||direction==='west'?'y':'x',aquatic=isWaterDweller(animal),swims=canSwim(animal);
 for(let k=0;k<=REGIONAL_DISPERSAL.arrivalSearch;k++)for(const sign of k?[1,-1]:[1]){
  const p={...base,[along]:base[along]+sign*k};if(!playable(p.x,p.y))continue;
  const wet=!!water[Math.floor(p.y)*N+Math.floor(p.x)];if(aquatic?wet:(!wet||swims))return p;
 }
 return null;
}
// Region owners that can receive an animal right now, by direction.
function receivers(active,sourceKey,sourceTick){
 const travel=active.planetaryTravel,source=sourceKey===regionKey(active.world.regionOrigin)?active.world.regionOrigin:travel?.sessions?.find(s=>s.key===sourceKey)?.snapshot?.world?.regionOrigin;
 if(!source)return{};const out={};
 for(const direction of DIRECTIONS){
  let origin;try{origin=neighboringRegion(planetRegionOrigin(source),direction)}catch{continue}
  const key=regionKey(origin);
  if(key===regionKey(active.world.regionOrigin)){if(Math.abs(active.tickCount-sourceTick)<=CFG.lifeStride)out[direction]={kind:'active',key,water:active.world.water};continue}
  const session=travel?.sessions?.find(s=>s.key===key);
  if(session&&!session.parked&&(session.biologicalMode==='canonical-ticks/1'||session.biologicalMode==='regional-demography/1')&&Math.abs(session.snapshot.core.tickCount-sourceTick)<=CFG.lifeStride)
   out[direction]={kind:'session',key,session,water:session.snapshot.world.surfaceWater.mask};
 }
 return out;
}
// The context a regional Simulation consults while it steps: which borders are
// open and where an animal would arrive. Read-only.
export function dispersalContextFor(active,sourceKey,sourceTick){
 if(!dispersalEnabled(active))return null;
 const open=receivers(active,sourceKey,sourceTick);if(!Object.keys(open).length)return null;
 return{sourceKey,open:direction=>!!open[direction],arrival:(direction,x,y,animal)=>open[direction]?placeArrival(open[direction].water,direction,x,y,animal):null,receivers:open};
}
// Moves recorded emigrants into their destinations. Each was removed from its
// source by that source's own step; every one is delivered or the step throws
// before anything is published.
export function deliverEmigrants(active,context,emigrants){
  if(!emigrants?.length)return[];
  if(!context)throw Error('Emigrants left a region without an open border.');
  const plans=emigrants.map(e=>{
    const r=context.receivers[e.direction];
    const p=r&&placeArrival(r.water,e.direction,e.from.x,e.from.y,e.animal);
    if(!p)throw Error('Emigrant has no arrival position in '+(r?.key||e.direction)+'.');
    const animal=structuredClone(e.animal);
    Object.assign(animal,{x:p.x,y:p.y,target:null,intent:'explore',navigationRoute:null,
      pursuitEngaged:false,hidden:false});delete animal.movedTick;
    animal.dispersalHistory=[...(animal.dispersalHistory||[]),
      {from:context.sourceKey,to:r.key,day:e.day,tick:e.tick}].slice(-REGIONAL_DISPERSAL.historyLength);
    return {e,r,animal};
  });
  const receivers=new Map();
  for(const plan of plans){
    const {r,e,animal}=plan,owner=r.kind==='active'?active:r.session;
    let staged=receivers.get(owner);
    if(!staged){
      const animals=r.kind==='active'?active.animals:r.session.snapshot.animals;
      staged={ids:new Set(animals.map(a=>a.id)),bodies:[],histories:new Set(),tree:null,
        target:regionalEvolutionEnabled(active)?(r.kind==='active'?active.evolutionTree:r.session.snapshot.controllers?.evolutionTree):null};
      receivers.set(owner,staged);
    }
    if(e.evolutionaryHistory&&!regionalEvolutionEnabled(active))
      throw Error('Inconsistent regional autonomous evolution policy.');
    if(regionalEvolutionEnabled(active)&&r.kind!=='active'&&!regionalEvolutionEnabled(r.session.snapshot.core))
      throw Error('Inconsistent regional autonomous evolution policy.');
    if(staged.ids.has(animal.id))throw Error('Immigrant identity already present.');
    staged.ids.add(animal.id);staged.bodies.push(animal);
    if(regionalEvolutionEnabled(active)&&e.evolutionaryHistory&&!staged.histories.has(e.evolutionaryHistory)){
      staged.tree=mergeEvolutionaryTreeHistory(staged.tree||staged.target,e.evolutionaryHistory);
      staged.histories.add(e.evolutionaryHistory);
    }
  }
  if(regionalEvolutionEnabled(active))for(const staged of receivers.values())
    evolutionaryHistoryForBodies(staged.tree||staged.target,staged.bodies);
  // All positions, clones, identities and recorded ancestry are checked before
  // publishing any receiver. No ancestor is inferred from a species label.
  for(const staged of receivers.values())if(staged.tree)Object.assign(staged.target,staged.tree);
  const delivered=[];
  for(const {e,r,animal:a} of plans){
    if(r.kind==='active'){
      active.animals.push(a);active.stats.immigrants=(active.stats.immigrants||0)+1;
    }else{
      const snap=r.session.snapshot;
      markRegionalOwnerDirty(r.session);snap.animals.push(a);
      snap.core.stats={...snap.core.stats,immigrants:(snap.core.stats?.immigrants||0)+1};
      if(r.session.biologicalLedger)r.session.biologicalLedger={...r.session.biologicalLedger,
        lastPopulation:snap.animals.length,immigrants:(r.session.biologicalLedger.immigrants||0)+1};
    }
    delivered.push({id:a.id,from:context.sourceKey,to:r.key,day:e.day,tick:e.tick});
  }
  if(delivered.some(d=>d.to===regionKey(active.world.regionOrigin))){
    active.rebuildSpatial();active.regionalEcology?.resetPageResidency?.();
  }
  const log=active.planetaryTravel;
  if(log)log.dispersalLog=[...(log.dispersalLog||[]),...delivered].slice(-REGIONAL_DISPERSAL.logLength);
  return delivered;
}
// Transient, never saved: the context holds functions over live regions.
export function setDispersalContext(sim,context){Object.defineProperty(sim,'regionalDispersalContext',{value:context||null,writable:true,configurable:true,enumerable:false})}
// Simulation side: remove an animal that reached an open border, recording it
// for delivery. Called by migration (canonical) and the population model.
export function emigrate(sim,animal,direction){
 const context=sim.regionalDispersalContext;
 if(!context?.open(direction)||!animal?.alive||animal.player||animal.lineage)return false;
 const arrival=context.arrival(direction,animal.x,animal.y,animal);if(!arrival)return false;
 if(!sim.pendingEmigrants)Object.defineProperty(sim,'pendingEmigrants',{value:[],writable:true,configurable:true,enumerable:false});
 if(sim.pendingEmigrants.some(e=>e.animal===animal))return true;
 sim.pendingEmigrants.push({animal,direction,from:{x:animal.x,y:animal.y},day:sim.day,tick:sim.tickCount});
 return true;
}
// Nearest open border within reach of an animal's senses, as an exit target.
export function nearestOpenExit(sim,animal,radius){
 const context=sim.regionalDispersalContext;if(!context)return null;let best=null;
 // A disperser keeps moving away: the border back to the region it last came
 // from stays closed to it for one season after arrival.
 const last=animal.dispersalHistory?.at(-1),recent=last&&sim.day-last.day<CFG.seasonDays?last.from:null;
 for(const direction of DIRECTIONS){if(!context.open(direction)||recent&&context.receivers[direction]?.key===recent)continue;const p=exitPoint(direction,animal.x,animal.y),d=Math.hypot(p.x-animal.x,p.y-animal.y);
  if(d<=radius&&(!best||d<best.distance)&&context.arrival(direction,p.x,p.y,animal))best={...p,direction,distance:d}}
 return best;
}
// End of a step: detach the queued emigrants from the population.
export function takeEmigrants(sim){
 const pending=sim.pendingEmigrants;if(!pending?.length)return[];
 const history=sim.evolutionTree?.recordedHistoryFor?.(pending.map(event=>event.animal));
 if(history)for(const event of pending)event.evolutionaryHistory=history;
 const leaving=new Set(pending.map(e=>e.animal));compactRegionalTravelerPositions(sim,a=>leaving.has(a));sim.animals=sim.animals.filter(a=>!leaving.has(a));delete sim.pendingEmigrants;
 sim.stats.emigrants=(sim.stats.emigrants||0)+pending.length;sim.migration?.states?.forEach?.((_,id)=>{if([...leaving].some(a=>a.id===id))sim.migration.states.delete(id)});
 sim.rebuildSpatial();sim.regionalEcology?.resetPageResidency?.();
 return pending;
}
