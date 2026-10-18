// D5: Portable, page-addressed checkpoints of ACTUAL canonical organism state.
// A checkpoint has one detached actor record per canonical array slot. Its page
// buckets are storage addresses, not a second living population or a new physics
// authority. The full World and all controllers still restore atomically together.
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from './save-manager.js';
import {WORLD_PAGE_SIZE} from '../world/pages.js';

export const FAUNA_PAGE_CHECKPOINT_SCHEMA=1;
export const OUTSIDE_FAUNA_PAGE='outside';
export const RETIRED_FAUNA_PAGE='retired';
const validId=id=>Number.isSafeInteger(id)&&id>0;
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function pageFor(n,actor){
 if(!Number.isFinite(actor?.x)||!Number.isFinite(actor?.y))throw Error('Invalid checkpoint organism position.');
 if(!actor.alive)return RETIRED_FAUNA_PAGE;
 if(actor.x<0||actor.y<0||actor.x>=n||actor.y>=n)return OUTSIDE_FAUNA_PAGE;
 return Math.floor(actor.x/WORLD_PAGE_SIZE)+','+Math.floor(actor.y/WORLD_PAGE_SIZE);
}
function geometry(snapshot){
 const layout=snapshot?.world?.pageLayout;
 if(snapshot?.schema!==SAVE_SCHEMA||layout?.schema!==1||layout.pageSize!==WORLD_PAGE_SIZE||
  !natural(layout.width)||layout.width===0||layout.width!==layout.height||
  layout.originX!==0||layout.originY!==0)throw Error('Invalid fauna page checkpoint geometry.');
 return layout.width;
}
function validOwner(owner,n){
 if(owner===OUTSIDE_FAUNA_PAGE||owner===RETIRED_FAUNA_PAGE)return true;
 if(typeof owner!=='string'||!/^\d+,\d+$/.test(owner))return false;
 const [x,y]=owner.split(',').map(Number),grid=Math.ceil(n/WORLD_PAGE_SIZE);
 return natural(x)&&natural(y)&&x<grid&&y<grid&&owner===x+','+y;
}
// Splitting is performed on a coherent single structured clone of the usual
// save graph: shared source objects retain their original graph relationships.
export function createFaunaPageCheckpoint(sim,options={}){
 const base=structuredClone(createSimulationSnapshot(sim,options));
 const n=geometry(base),actors=base.animals,slots=[],pages=new Map();
 if(!Array.isArray(actors))throw Error('Missing canonical checkpoint actors.');
 const seen=new Set();
 for(const actor of actors){
  if(!validId(actor?.id)||seen.has(actor.id))throw Error('Duplicate or invalid checkpoint organism identity.');
  seen.add(actor.id);
  const owner=pageFor(n,actor);
  slots.push({id:actor.id,owner});
  if(!pages.has(owner))pages.set(owner,[]);
  pages.get(owner).push(actor);
 }
 delete base.animals;
 const checkpoint={schema:FAUNA_PAGE_CHECKPOINT_SCHEMA,worldSize:n,pageSize:WORLD_PAGE_SIZE,
  header:base,slots,pages};
 validateFaunaPageCheckpoint(checkpoint);
 return checkpoint;
}
// Pure validation: never load a partial page as though it were a complete world.
export function validateFaunaPageCheckpoint(checkpoint){
 const c=checkpoint;
 if(c?.schema!==FAUNA_PAGE_CHECKPOINT_SCHEMA||c.pageSize!==WORLD_PAGE_SIZE||
  !Array.isArray(c.slots)||!(c.pages instanceof Map)||!c.header||
  Object.hasOwn(c.header,'animals'))throw Error('Invalid fauna page checkpoint.');
 const n=geometry(c.header),expected=new Map(),ids=new Set();
 if(c.worldSize!==n)throw Error('Fauna checkpoint world dimensions do not match.');
 for(const slot of c.slots){
  if(!validId(slot?.id)||ids.has(slot.id)||!validOwner(slot.owner,n))throw Error('Duplicate or invalid fauna checkpoint slot.');
  ids.add(slot.id);expected.set(slot.id,slot.owner);
 }
 const accounted=new Set(),instances=new Set();
 for(const [key,actors] of c.pages){
  if(!validOwner(key,n)||!Array.isArray(actors)||!actors.length)throw Error('Invalid fauna checkpoint page.');
  for(const actor of actors){
   if(!validId(actor?.id)||instances.has(actor)||accounted.has(actor.id)||
      !expected.has(actor.id)||expected.get(actor.id)!==key||
      pageFor(n,actor)!==key)throw Error('Fauna checkpoint actor has missing, duplicated, or incorrect page ownership.');
   instances.add(actor);accounted.add(actor.id);
  }
 }
 if(accounted.size!==c.slots.length)throw Error('Incomplete fauna checkpoint: organism page missing.');
 // Ensure no silent missing or duplicated live actor records: the manifest is the
 // canonical original iteration order for biology and deterministic RNG replay.
 return{actors:accounted.size,pages:c.pages.size,worldSize:n};
}
export function pageCheckpointActors(checkpoint,key){
 validateFaunaPageCheckpoint(checkpoint);
 if(!validOwner(key,checkpoint.worldSize))throw Error('Invalid fauna checkpoint page key.');
 return structuredClone(checkpoint.pages.get(key)||[]);
}
export function restoreFaunaPageCheckpoint(checkpoint){
 // Validate first. Do not mutate the supplied source even when the underlying
 // restorer performs legitimate schema upgrades and cache reconstruction.
 validateFaunaPageCheckpoint(checkpoint);
 const c=structuredClone(checkpoint),byId=new Map();
 for(const actors of c.pages.values())for(const a of actors)byId.set(a.id,a);
 const animals=c.slots.map(slot=>byId.get(slot.id));
 const full={...c.header,animals};
 const sim=restoreSimulationSnapshot(full);
 // This index is derived from the canonical restored actors on first lookup.
 // The serialized archive does not contain any second live organism registry.
 return sim;
}
