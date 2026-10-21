// Bounded decoded-page ownership over one committed checkpoint. No simulation,
// clock advancement or regeneration lives here; persisted records remain owned
// by the checkpoint even after a decoded lease is released.
import {readRegionalCheckpoint,validateRegionalIndex,commitRegionalUpdate} from './regional-records.js';
import {stageRemoteBiology} from '../world/planetary-offscreen-biology.js';
import {REGIONAL_IDENTITIES} from '../world/regional-identities.js';
import {regionalBiologyOrder} from '../world/regional-replay-order.js';
export class RegionalCheckpointReader{
 #db;#slot;#root;#entries;#leases=new Set();#closed=false;#capacity;#replaying=false;
 constructor(db,slot,root,{capacity=2}={}){
  if(!Number.isSafeInteger(capacity)||capacity<1||capacity>4)throw Error('Invalid regional reader capacity.');
  const index=validateRegionalIndex(root,slot);if(!index)throw Error('Regional leases require an indexed checkpoint.');
  this.#db=db;this.#slot=slot;this.#root=structuredClone(root);this.#entries=[...index.entries,index.active].map(e=>({...e}));this.#capacity=capacity;
 }
 get manifest(){return structuredClone(this.#root)}
 get resident(){return this.#leases.size}
 get closed(){return this.#closed}
 get capacity(){return this.#capacity}
 get identityWatermark(){this.#directory();return this.#root.regionalPersistence.nextId}
 #directory(){
  if(this.#closed)throw Error('Regional reader is closed.');
  if(this.#root.regionalPersistence.identityPolicy!==REGIONAL_IDENTITIES)throw Error('Checkpoint lacks regional identity metadata; save it through the canonical codec first.');
 }
 pendingBiology(){
  this.#directory();const index=this.#root.regionalPersistence,tick=this.#root.core.tickCount;
  return regionalBiologyOrder(tick,index.entries.filter(e=>e.kind==='session').map(e=>({key:e.key,tick:e.life.tick,mode:e.life.mode})),index.replayPolicy).map(row=>({key:row.key,tick:row.tick,debt:tick-row.tick}));
 }
 acquire(kind,key){
  if(this.#replaying)return Promise.reject(Error('Regional reader is publishing replay.'));
  return this.#acquire(kind,key);
 }
 async #acquire(kind,key){
  if(this.#closed)throw Error('Regional reader is closed.');
  if(!this.#entries.some(e=>e.kind===kind&&e.key===key))throw Error('Region does not belong to this checkpoint.');
  if(this.#leases.size>=this.capacity)throw Error('Regional reader capacity exhausted; release a page before acquiring another.');
  // Reserve before awaiting I/O, so simultaneous requests share the same bound.
  const lease={kind,key,payload:null,release:()=>{lease.payload=null;this.#leases.delete(lease)}};this.#leases.add(lease);
  try{
   const payload=await readRegionalCheckpoint(this.#db,this.#slot,{region:key,kind,expectedCapture:this.#root.regionalPersistence.capture});
   if(this.#closed)throw Error('Regional reader closed during page load.');
   if(!payload)throw Error('Regional checkpoint page disappeared.');
   lease.payload=payload;return lease;
  }catch(error){lease.release();throw error}
 }
 async replayNext(){
  this.#directory();if(this.#replaying||this.resident)throw Error('Replay requires an exclusive regional reader.');
  if(this.capacity<2)throw Error('Replay requires two regional lease slots.');
  const due=this.pendingBiology()[0];if(!due)return null;
  this.#replaying=true;const db=this.#db,previous=this.manifest,index=previous.regionalPersistence;
  try{
   const active=await this.#acquire('active',index.active.key),remote=await this.#acquire('session',due.key);
   const staged=stageRemoteBiology(remote.payload,{tickCount:previous.core.tickCount,reservedNextId:index.nextId});
   if(!staged.candidate||!staged.result.ticks)throw Error('Due persisted replay made no progress.');
   if(this.#closed)throw Error('Regional reader closed before replay publication.');
   const payload=active.payload;
   payload.core.nextId=Math.max(payload.core.nextId,staged.nextId);
   payload.core.planetaryTravel.nextId=Math.max(payload.core.planetaryTravel.nextId,payload.core.nextId);
   const committed=await commitRegionalUpdate(db,payload,this.#slot,previous,[{kind:'session',payload:staged.candidate}]);
   return{...staged.result,written:committed.written,retained:committed.retained,capture:committed.root.regionalPersistence.capture,decodedRegions:2};
  }finally{this.close()}
 }
 close(){this.#closed=true;this.#replaying=false;for(const lease of this.#leases)lease.payload=null;this.#leases.clear();this.#db=null}
}
export async function openRegionalCheckpointReader(db,slot,options){
 const root=await readRegionalCheckpoint(db,slot,{manifestOnly:true});
 if(!root)return null;return new RegionalCheckpointReader(db,slot,root,options);
}
