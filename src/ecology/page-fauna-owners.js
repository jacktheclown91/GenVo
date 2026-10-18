// D4: Each physical live organism belongs to exactly one page scheduling bucket.
// Buckets hold direct references to the SAME Simulation.animals objects, never
// cloned bodies or independent simulated populations. Ownership is reconstructed
// from canonical saved actors, and does not create another persistent authority.
import {residencyPage} from './page-residency.js';

const registries=new WeakMap();
const validId=id=>Number.isSafeInteger(id)&&id>0;
function ensure(sim){
 if(!sim?.world||!Array.isArray(sim.animals))throw Error('Fauna owner requires a canonical Simulation.');
 let r=registries.get(sim);
 if(!r){r={byId:new Map(),pageOf:new Map(),pages:new Map(),outside:new Set()};registries.set(sim,r);
  for(const actor of sim.animals)placeActor(r,sim.world,actor);}
 return r;
}
function detach(r,id,old){
 if(old===null){r.outside.delete(id);return;}
 const bucket=r.pages.get(old);
 if(bucket){bucket.delete(id);if(!bucket.size)r.pages.delete(old);}
}
function placeActor(r,world,a){
 if(!validId(a?.id))throw Error('Invalid canonical fauna identity.');
 const id=a.id,prior=r.byId.get(id),had=r.byId.has(id),old=r.pageOf.get(id);
 if(had&&prior!==a)throw Error('Duplicate or invalid living fauna identity.');
 if(!a.alive){if(had){detach(r,id,old);r.byId.delete(id);r.pageOf.delete(id);}return null;}
 const page=residencyPage(world,a.x,a.y);
 if(had&&old===page)return page;
 if(had)detach(r,id,old);
 r.byId.set(id,a);r.pageOf.set(id,page);
 if(page===null)r.outside.add(id);
 else{let bucket=r.pages.get(page);if(!bucket){bucket=new Map();r.pages.set(page,bucket);}bucket.set(id,a);}
 return page;
}
// Constant-time birth/move/death hook. A transfer moves the SAME object reference
// between page buckets. It cannot create a second actor or modify reserves.
export function noteFaunaPageOwner(sim,actor){return placeActor(ensure(sim),sim.world,actor);}
export function forgetFaunaPageOwner(sim,actor){
 const r=ensure(sim),id=actor?.id;
 if(!validId(id))throw Error('Invalid canonical fauna identity.');
 const known=r.byId.get(id);
 if(known&&known!==actor)throw Error('Conflicting canonical organism removal.');
 if(!known)return false;
 detach(r,id,r.pageOf.get(id));r.pageOf.delete(id);r.byId.delete(id);
 return true;
}
// Repair out-of-band / test-script movement while checking the one-live-object
// contract. This is run with the existing daily regional census, not every frame.
export function reconcileFaunaPageOwners(sim){
 const r=ensure(sim),live=new Set();
 for(const a of sim.animals){
  if(!a.alive)continue;
  if(live.has(a.id))throw Error('Duplicate canonical organism identity.');
  live.add(a.id);placeActor(r,sim.world,a);
 }
 for(const [id,a] of r.byId)if(!live.has(id))forgetFaunaPageOwner(sim,a);
 return r;
}
// Per-page identity-addressable lookup. Use this to schedule a specific page
// without iterating EVERY organism on each page query. Call reconcile=true only
// when out-of-band coordinate assignments are known.
export function faunaPageActors(sim,key,{reconcile=false}={}){
 const r=reconcile?reconcileFaunaPageOwners(sim):ensure(sim);
 if(key!==null&&(typeof key!=='string'||!/^\d+,\d+$/.test(key)))throw Error('Invalid fauna owner page.');
 const bucket=key===null?r.outside:r.pages.get(key);
 if(!bucket)return [];
 return [...bucket].map(x=>key===null?r.byId.get(x):x[1]);
}
export function faunaPageOf(sim,animal){const r=ensure(sim);return r.byId.get(animal?.id)===animal?r.pageOf.get(animal.id):undefined;}
export function validateFaunaPageOwners(sim,{reconcile=false}={}){
 const r=reconcile?reconcileFaunaPageOwners(sim):ensure(sim),seen=new Set();
 for(const [id,a] of r.byId){
  if(!a.alive||a.id!==id||seen.has(id))throw Error('Invalid canonical fauna owner.');
  const page=residencyPage(sim.world,a.x,a.y);
  if(page!==r.pageOf.get(id))throw Error('Stale canonical fauna page.');
  if(page===null?!r.outside.has(id):r.pages.get(page)?.get(id)!==a)throw Error('Invalid fauna bucket identity.');
  seen.add(id);
 }
 for(const [key,bucket] of r.pages){
  if(!bucket.size)throw Error('Empty fauna owner bucket.');
  for(const [id,a] of bucket)if(!seen.has(id)||r.byId.get(id)!==a||r.pageOf.get(id)!==key)throw Error('Duplicated fauna page ownership.');
 }
 for(const id of r.outside)if(!seen.has(id)||r.pageOf.get(id)!==null)throw Error('Invalid outside fauna owner.');
 return{living:seen.size,pages:r.pages.size,outside:r.outside.size};
}
