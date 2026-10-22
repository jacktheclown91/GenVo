import {regionalOwnerRevision} from './regional-revision.js';

// Read-side acceleration for regional replay. Restoring a detached regional
// Simulation from its snapshot costs more than the ticks it then runs, so the
// live Simulation a stride produced is kept and reused for the session's next
// stride, but only while the session still holds exactly the snapshot that was
// published from it (same object, owner revision and shallow field identity of
// snapshot, core and world). Any replacement, in-place publication or policy
// adoption invalidates the entry and the ordinary restore path is used.
// A warm entry's published snapshot is a deep copy, so later ticks on the warm
// Simulation can never alter an archived checkpoint, and a failed stride
// discards the entry while the published state stays intact.
// Capacity is bounded; canonical neighbours (stepped inside player frames)
// take precedence over far population-model regions.
export const REGIONAL_WARM=Object.freeze({capacity:8});
export const regionalWarmSwitch={enabled:true};
const cache=new Map();
const rows=o=>o?Object.keys(o).map(k=>[k,o[k]]):[];
const same=(saved,o)=>!!o&&Object.keys(o).length===saved.length&&saved.every(([k,v])=>Object.is(o[k],v));
function fingerprint(session){const s=session.snapshot;return{snapshot:s,revision:regionalOwnerRevision(session),fields:rows(s),core:rows(s?.core),world:rows(s?.world)}}
function valid(entry,session){const s=session.snapshot;return entry.print.snapshot===s&&entry.print.revision===regionalOwnerRevision(session)&&same(entry.print.fields,s)&&same(entry.print.core,s?.core)&&same(entry.print.world,s?.world)}
// Take (and remove) a reusable Simulation for this session, or null.
export function takeWarmRegion(session){
 const entry=cache.get(session);if(!entry)return null;cache.delete(session);
 return regionalWarmSwitch.enabled&&valid(entry,session)?entry.sim:null;
}
// Whether a stride of this session should publish a deep copy and keep its
// Simulation warm afterwards.
export function warmCandidate(session){
 if(!regionalWarmSwitch.enabled)return false;if(cache.has(session))return true;
 if(cache.size<REGIONAL_WARM.capacity)return true;
 if(session.biologicalMode!=='canonical-ticks/1')return false;
 for(const key of cache.keys())if(key.biologicalMode!=='canonical-ticks/1')return true;
 return false;
}
export function keepWarmRegion(session,sim){
 if(!regionalWarmSwitch.enabled)return;
 if(!cache.has(session)&&cache.size>=REGIONAL_WARM.capacity){
  const victim=[...cache.keys()].find(k=>k.biologicalMode!=='canonical-ticks/1');if(!victim)return;cache.delete(victim);
 }
 cache.set(session,{sim,print:fingerprint(session)});
}
export function forgetWarmRegion(session){cache.delete(session)}
export function clearWarmRegions(){cache.clear()}
export const warmRegionCount=()=>cache.size;
