import {mergeEvolutionaryTreeHistory} from '../lineage/evolution-tree-history.js';
import {regionalEvolutionEnabled} from '../lineage/autonomous-evolution.js';
// Bounded decoded-page ownership over one committed checkpoint. No simulation,
// clock advancement or regeneration lives here; persisted records remain owned
// by the checkpoint even after a decoded lease is released.
import {readRegionalCheckpoint,validateRegionalIndex,RegionalCheckpointStage} from './regional-records.js';
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
 beginStage(){this.#directory();if(this.#replaying)throw Error('Regional reader is publishing replay.');return new RegionalCheckpointStage(this.#db,this.#slot,this.manifest)}
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
  const due=this.pendingBiology()[0];if(!due)return null;
  this.#replaying=true;const db=this.#db,previous=this.manifest,index=previous.regionalPersistence;
  const writer=new RegionalCheckpointStage(db,this.#slot,previous);
  try{
   let remote=await this.#acquire('session',due.key),staged=stageRemoteBiology(remote.payload,{tickCount:previous.core.tickCount,reservedNextId:index.nextId});
   if(!staged.candidate||!staged.result.ticks)throw Error('Due persisted replay made no progress.');
   const result=staged.result,nextId=staged.nextId;
   // The directory intentionally carries no biological policy. Read the
   // policy from its actual remote owner, then compare the actual active page
   // before publishing either. A manifest lookup silently skipped /2 history.
   const evolutionRules=staged.candidate.snapshot.core.autonomousEvolutionRules;
   const recordedEvolution=regionalEvolutionEnabled(staged.candidate.snapshot.core)?staged.candidate.snapshot.controllers.evolutionTree:null;
   await writer.stage('session',staged.candidate);staged=null;remote.release();remote=null;
   let active=await this.#acquire('active',index.active.key),payload=active.payload;
   if(payload.core.autonomousEvolutionRules!==evolutionRules)throw Error('Inconsistent regional autonomous evolution policy.');
   payload.core.nextId=Math.max(payload.core.nextId,nextId);
   payload.core.planetaryTravel.nextId=Math.max(payload.core.planetaryTravel.nextId,payload.core.nextId);
   if(recordedEvolution)Object.assign(payload.controllers.evolutionTree,
    mergeEvolutionaryTreeHistory(payload.controllers.evolutionTree,recordedEvolution));
   await writer.stage('active',payload);payload=null;active.release();active=null;
   if(this.#closed)throw Error('Regional reader closed before replay publication.');
   const committed=await writer.publish();
   return{...result,written:committed.written,retained:committed.retained,capture:committed.root.regionalPersistence.capture,decodedRegions:1};
  }finally{this.close();if(writer.state==='open')await writer.abort()}
 }
 close(){this.#closed=true;this.#replaying=false;for(const lease of this.#leases)lease.payload=null;this.#leases.clear();this.#db=null}
}
export async function openRegionalCheckpointReader(db,slot,options){
 const root=await readRegionalCheckpoint(db,slot,{manifestOnly:true});
 if(!root)return null;return new RegionalCheckpointReader(db,slot,root,options);
}
