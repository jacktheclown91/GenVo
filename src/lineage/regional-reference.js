import {regionalPressureObservation} from '../ecology/population-profile.js';

// autonomous-evolution/4: a population's recorded related population may live in
// another region. This module only reads evidence. The active world reads its
// resident regions' published snapshots; an archived region being replayed reads
// the context its stride was given. A region that is unloaded, or a population
// that is unestablished or absent there, is unknown: it is never replaced by a
// local stand-in. No population, pressure or recognition rule lives here.
const SIGNED=/^natural:(-?\d+),(-?\d+):\d+$/;
export function populationRegion(key){
  const match=typeof key==='string'?SIGNED.exec(key):null;
  return match?{x:Number(match[1]),y:Number(match[2])}:null;
}
// A natural population key signed for a different region than this world's.
export function foreignPopulationKey(sim,key){
  const region=populationRegion(key),origin=sim.world?.regionOrigin||{x:0,y:0};
  return !!region&&(region.x!==origin.x||region.y!==origin.y);
}
const evidenceFrom=memory=>({records:memory?.natural?.records||null,histories:memory?.histories||null});
// The evidence an archived region's stride may read: the active world's live
// population memory and every other resident region's published snapshot.
export function regionalReferenceContextFor(active,replayingKey){
  const owners=[evidenceFrom(active.populationMemory)];
  for(const session of active.planetaryTravel?.sessions||[])
    if(session.key!==replayingKey)owners.push(evidenceFrom(session.snapshot?.controllers?.populationMemory));
  return Object.freeze({owners:Object.freeze(owners)});
}
export function setRegionalReferenceContext(sim,context){
  Object.defineProperty(sim,'regionalReferenceContext',{value:context||null,writable:true,configurable:true,enumerable:false});
}
function evidenceOwners(sim){
  if(sim.regionalReferenceContext)return sim.regionalReferenceContext.owners;
  return(sim.planetaryTravel?.sessions||[]).map(session=>evidenceFrom(session.snapshot?.controllers?.populationMemory));
}
// The established population a foreign key names, placed in this world's local
// frame through both region origins, with its own pressure history. Null when
// no available owner has it established.
export function foreignReference(sim,key){
  const region=populationRegion(key);if(!region)return null;
  for(const owner of evidenceOwners(sim)){
    const record=owner.records?.get?.(key);if(!record)continue;
    if(record.establishedDay===null||record.establishedDay===undefined)return null;
    const origin=sim.world?.regionOrigin||{x:0,y:0},home=record.regionOrigin||region;
    return{key,id:key,kind:record.kind,label:record.label,species:record.species,primary:false,remote:true,
      x:home.x+record.x-origin.x,y:home.y+record.y-origin.y,history:owner.histories?.get?.(key)||null};
  }
  return null;
}
// Two regions may lag each other by a stride. Compare only the latest biological
// day both histories actually observed; with no common day the comparison is unknown.
const observedDays=history=>!history?[]:[...new Set([...(history.regionalObservations||[]).map(row=>row.day),history.lastDay])]
  .filter(day=>Number.isSafeInteger(day)&&day>=1);
export function alignedPressureProfiles(localHistory,foreignHistory){
  const theirs=new Set(observedDays(foreignHistory));
  const day=observedDays(localHistory).filter(value=>theirs.has(value)).sort((a,b)=>b-a)[0];
  if(day===undefined)return null;
  const mine=regionalPressureObservation(localHistory,day),other=regionalPressureObservation(foreignHistory,day);
  return mine&&other?{day,mine,theirs:other}:null;
}
