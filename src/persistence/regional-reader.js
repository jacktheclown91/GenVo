// Bounded decoded-page ownership over one committed checkpoint. No simulation,
// clock advancement or regeneration lives here; persisted records remain owned
// by the checkpoint even after a decoded lease is released.
import {readRegionalCheckpoint,validateRegionalIndex} from './regional-records.js';
export class RegionalCheckpointReader{
 #db;#slot;#root;#entries;#leases=new Set();#closed=false;#capacity;
 constructor(db,slot,root,{capacity=2}={}){
  if(!Number.isSafeInteger(capacity)||capacity<1||capacity>4)throw Error('Invalid regional reader capacity.');
  const index=validateRegionalIndex(root,slot);if(!index)throw Error('Regional leases require an indexed checkpoint.');
  this.#db=db;this.#slot=slot;this.#root=structuredClone(root);this.#entries=[...index.entries,index.active].map(e=>({...e}));this.#capacity=capacity;
 }
 get manifest(){return structuredClone(this.#root)}
 get resident(){return this.#leases.size}
 get closed(){return this.#closed}
 get capacity(){return this.#capacity}
 async acquire(kind,key){
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
 close(){this.#closed=true;for(const lease of this.#leases)lease.payload=null;this.#leases.clear();this.#db=null}
}
export async function openRegionalCheckpointReader(db,slot,options){
 const root=await readRegionalCheckpoint(db,slot,{manifestOnly:true});
 if(!root)return null;return new RegionalCheckpointReader(db,slot,root,options);
}
