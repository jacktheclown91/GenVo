import {CFG} from '../sim/config.js';
import {POPULATION_MODE} from './regional-replay-order.js';
import {planetRegionOrigin,regionKey,PLANET_REGION_SIZE} from './planet-regions.js';
import {regionalIdentity,validateRegionalIdentity,sameRegionalIdentity} from './regional-identities.js';
import {markRegionalOwnerDirty} from './regional-revision.js';
import {forgetWarmRegion} from './regional-warm-cache.js';

// Bounded residency for visited planetary regions (regional-residency/1).
// Regions within `residentRadius` of the player stay in memory; farther
// population-model regions are UNLOADED: their complete session lives only in
// its committed indexed record, and the simulation keeps the record's
// directory entry (key, origin, record reference and identity header). Nothing
// about an unloaded region is summarized, regenerated or reset. Its clock
// stops while unloaded; the runtime later reloads it through a bounded reader
// and runs its genuine elapsed ticks before it is needed again.
// Exploration is therefore limited by storage, not by a session count.
export const REGIONAL_RESIDENCY=Object.freeze({policy:'regional-residency/1',residentRadius:2,
 // A 5x5 neighbourhood minus the active region, plus one rotating region.
 maxResident:25,
 // Crossing waits until every region it will need nearby is loaded and no
 // more than this far behind the player.
 get maxNearDebt(){return 2*CFG.dayTicks}});
const distance=(a,b)=>{const p=planetRegionOrigin(a),q=planetRegionOrigin(b);return Math.max(Math.abs(p.x-q.x),Math.abs(p.y-q.y))/PLANET_REGION_SIZE};
export const residencyEnabled=sim=>sim?.regionalResidencyRules===REGIONAL_RESIDENCY.policy;
export const unloadedRegions=sim=>sim?.planetaryTravel?.unloaded||[];

const ENTRY_KEYS=['kind','key','origin','id','capture','life','unloaded','storage'];
// An unloaded entry is exactly the committed directory entry for that session.
export function validateUnloadedEntry(entry){
 if(!entry||entry.kind!=='session'||entry.unloaded!==true||typeof entry.id!=='string'||typeof entry.capture!=='string'||!entry.capture||
  Object.keys(entry).some(k=>!ENTRY_KEYS.includes(k))||entry.storage!==undefined&&entry.storage!=='capture-key/1')throw Error('Invalid unloaded regional entry.');
 if(entry.key!==regionKey(planetRegionOrigin(entry.origin)))throw Error('Unloaded regional entry has conflicting coordinates.');
 validateRegionalIdentity(entry.life);
 if(entry.life.mode!==POPULATION_MODE)throw Error('Only population-model regions can be unloaded.');
 return entry;
}
export function validateRegionalResidency(sim){
 if(sim.regionalResidencyRules!==undefined&&!residencyEnabled(sim))throw Error('Unknown regional residency policy.');
 const travel=sim.planetaryTravel,list=travel?.unloaded;
 if(list===undefined)return;
 if(!residencyEnabled(sim)||!Array.isArray(list))throw Error('Unloaded regions without their recorded residency policy.');
 const active=regionKey(sim.world.regionOrigin),seen=new Set([active,...travel.sessions.map(s=>s.key)]);
 for(const entry of list){
  validateUnloadedEntry(entry);
  if(seen.has(entry.key))throw Error('Unloaded region duplicates a resident or active region.');seen.add(entry.key);
  if(entry.life.tick>sim.tickCount)throw Error('Unloaded regional clock is ahead of the player.');
  if(travel.nextId<entry.life.nextId)throw Error('Regional allocator does not cover an unloaded region.');
 }
}
// Identities owned by unloaded regions, from their committed headers.
export function unloadedIdentityIds(sim){const out=[];for(const e of unloadedRegions(sim))out.push(...e.life.ids);return out}
export function unloadedWatermark(sim){let n=1;for(const e of unloadedRegions(sim))n=Math.max(n,e.life.nextId);return n}

// Far population-model regions beyond the resident radius, nearest last.
export function unloadCandidates(sim){
 if(!residencyEnabled(sim))return[];
 const here=sim.world.regionOrigin;
 return(sim.planetaryTravel?.sessions||[]).filter(s=>s.biologicalMode===POPULATION_MODE&&distance(here,s.snapshot.world.regionOrigin)>REGIONAL_RESIDENCY.residentRadius)
  .sort((a,b)=>distance(here,b.snapshot.world.regionOrigin)-distance(here,a.snapshot.world.regionOrigin)||a.key.localeCompare(b.key));
}
export function reloadCandidates(sim){
 const here=sim.world.regionOrigin;
 return unloadedRegions(sim).filter(e=>distance(here,e.origin)<=REGIONAL_RESIDENCY.residentRadius)
  .sort((a,b)=>distance(here,a.origin)-distance(here,b.origin)||a.key.localeCompare(b.key));
}
// The unloaded region furthest behind the player, for bounded rotation.
export function rotationCandidate(sim,{minimumDebt=CFG.dayTicks}={}){
 return[...unloadedRegions(sim)].filter(e=>sim.tickCount-e.life.tick>=minimumDebt)
  .sort((a,b)=>a.life.tick-b.life.tick||a.key.localeCompare(b.key))[0]||null;
}
// A parked far region stops advancing so its committed record can match it.
export function parkRegion(sim,session){
 if(!sim.planetaryTravel.sessions.includes(session)||session.biologicalMode!==POPULATION_MODE)throw Error('Only resident population-model regions can be parked.');
 session.parked=true;
}
// Replace a resident session by its committed directory entry. The caller
// proves the entry was published from this exact state; the identity header
// is rechecked here against the live payload before memory is released.
export function unloadRegion(sim,session,entry){
 const travel=sim.planetaryTravel,i=travel.sessions.indexOf(session);
 if(!residencyEnabled(sim)||i<0||!session.parked)throw Error('Unload requires a parked resident region.');
 const life=regionalIdentity(session.snapshot,{mode:session.biologicalMode??null});
 if(entry?.key!==session.key||!sameRegionalIdentity(entry.life,life))throw Error('Committed regional record does not match the resident region.');
 const stub={kind:'session',key:entry.key,origin:{x:entry.origin.x,y:entry.origin.y},id:entry.id,capture:entry.capture,life:structuredClone(entry.life),unloaded:true,...(entry.storage?{storage:entry.storage}:{})};
 validateUnloadedEntry(stub);
 travel.sessions.splice(i,1);forgetWarmRegion(session);travel.unloaded=[...unloadedRegions(sim),stub];
 return stub;
}
// Reinstall a committed payload read for an unloaded entry. It resumes as a
// population-model region; mode assignment may promote it.
export function reloadRegion(sim,entry,payload){
 const travel=sim.planetaryTravel,list=unloadedRegions(sim),i=list.indexOf(entry);
 if(i<0)throw Error('Region is not unloaded in this simulation.');
 if(payload?.key!==entry.key||payload.biologicalMode!==POPULATION_MODE)throw Error('Loaded regional record does not belong to this entry.');
 const life=regionalIdentity(payload.snapshot,{mode:payload.biologicalMode});
 if(!sameRegionalIdentity(entry.life,life))throw Error('Loaded regional record does not match its directory entry.');
 if(sim.autonomousEvolutionRules!==payload.snapshot.core.autonomousEvolutionRules)
  throw Error('Inconsistent regional autonomous evolution policy.');
 sim.evolutionTree?.mergeRecordedHistory?.(payload.snapshot.controllers?.evolutionTree);
 const session={...payload};delete session.parked;
 travel.unloaded=list.filter(e=>e!==entry);if(!travel.unloaded.length)delete travel.unloaded;
 travel.sessions.push(session);markRegionalOwnerDirty(session);
 return session;
}
// Crossing gate: every region within the canonical radius of the destination
// must be resident and close enough to the player's clock.
export function crossingResidency(sim,destination,canonicalRadius=1){
 if(!residencyEnabled(sim))return{ready:true};
 for(const e of unloadedRegions(sim))if(distance(destination,e.origin)<=canonicalRadius)return{ready:false,reason:'Region '+e.key+' is still loading from storage. Wait a moment before crossing.'};
 for(const s of sim.planetaryTravel?.sessions||[])if(distance(destination,s.snapshot.world.regionOrigin)<=canonicalRadius&&sim.tickCount-s.snapshot.core.tickCount>REGIONAL_RESIDENCY.maxNearDebt)
  return{ready:false,reason:'Region '+s.key+' is catching up on its elapsed ecology. Wait a moment before crossing.'};
 return{ready:true};
}
