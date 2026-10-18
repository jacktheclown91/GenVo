// Page residency is an identity ledger, NOT another copy of the organisms.
// Simulation.animals remains the only live creature owner. Page views may be
// unloaded without removing actors, their ancestry, or their material reserves.
import {WORLD_PAGE_SIZE} from '../world/pages.js';
export const PAGE_RESIDENCY_SCHEMA=1;
export const PAGE_RESIDENCY_HISTORY=64;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function pageGrid(w){if(!integer(w?.n)||w.n===0)return null;return Math.ceil(w.n/WORLD_PAGE_SIZE);}
export function residencyPage(w,x,y){
 const grid=pageGrid(w);
 if(!grid||!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid resident coordinates.');
 // The existing simulation can temporarily position test/scripted creatures outside
 // the playable map. Those have no page owner; observation must not change biology.
 if(x<0||y<0||x>=w.n||y>=w.n)return null;
 return Math.floor(x/WORLD_PAGE_SIZE)+','+Math.floor(y/WORLD_PAGE_SIZE);
}
function validKey(key,grid){
 if(typeof key!=='string'||!/^\d+,\d+$/.test(key))return false;
 const parts=key.split(',').map(Number);
 return parts.every(Number.isSafeInteger)&&parts.every(v=>v>=0&&v<grid)&&parts.join(',')===key;
}
export function createPageResidency(){return{schema:PAGE_RESIDENCY_SCHEMA,membership:new Map(),transferred:0,byEdge:new Map(),recent:[]};}
export function recordPageResident(ledger,w,animal,{from=null,day=0,tick=0}={}){
 if(!ledger||ledger.schema!==PAGE_RESIDENCY_SCHEMA||!(ledger.membership instanceof Map)||!(ledger.byEdge instanceof Map)||!Array.isArray(ledger.recent))throw Error('Invalid page residency ledger.');
 if(!integer(animal?.id)||animal.id===0||!integer(day)||!integer(tick))throw Error('Invalid page resident identity/time.');
 if(!animal.alive){ledger.membership.delete(animal.id);return false;}
 const page=residencyPage(w,animal.x,animal.y);
 if(page===null){ledger.membership.delete(animal.id);return false;}
 const previous=ledger.membership.get(animal.id)??(from?residencyPage(w,from.x,from.y):null);
 if(previous===page){ledger.membership.set(animal.id,page);return false;}
 if(previous!==null){
  if(!integer(ledger.transferred)||ledger.transferred>=Number.MAX_SAFE_INTEGER)throw Error('Page residency sequence exhausted.');
  const edge=previous+'>'+page,count=ledger.byEdge.get(edge)||0;
  if(!integer(count)||count>=Number.MAX_SAFE_INTEGER)throw Error('Page residency edge count exhausted.');
  const event={sequence:++ledger.transferred,day,tick,id:animal.id,species:animal.species,from:previous,to:page};
  ledger.byEdge.set(edge,count+1);ledger.recent.push(event);
  if(ledger.recent.length>PAGE_RESIDENCY_HISTORY)ledger.recent.shift();
 }
 ledger.membership.set(animal.id,page);
 return previous!==null;
}
export function removePageResident(ledger,id){
 if(ledger===undefined)return false;
 if(!integer(id)||id===0||!(ledger.membership instanceof Map))throw Error('Invalid page resident removal.');
 return ledger.membership.delete(id);
}
export function reconcilePageResidency(ledger,sim){
 if(!ledger)return;
 const living=new Set();
 for(const animal of sim.animals){if(!animal.alive)continue;if(living.has(animal.id))throw Error('Duplicate living organism identity.');living.add(animal.id);recordPageResident(ledger,sim.world,animal,{day:sim.day,tick:sim.tickCount});}
 for(const id of ledger.membership.keys())if(!living.has(id))ledger.membership.delete(id);
}
export function validatePageResidency(ledger,w){
 if(ledger===undefined)return;
 const grid=pageGrid(w);
 if(!grid||ledger?.schema!==PAGE_RESIDENCY_SCHEMA||!(ledger.membership instanceof Map)||!(ledger.byEdge instanceof Map)||!integer(ledger.transferred)||
  !Array.isArray(ledger.recent)||ledger.recent.length>PAGE_RESIDENCY_HISTORY)throw Error('Invalid saved page residency.');
 for(const [id,key] of ledger.membership)if(!integer(id)||id===0||!validKey(key,grid))throw Error('Invalid saved page resident.');
 let total=0;
 for(const [edge,count] of ledger.byEdge){
  if(typeof edge!=='string'||edge.split('>').length!==2||!edge.split('>').every(k=>validKey(k,grid))||edge.split('>')[0]===edge.split('>')[1]||!integer(count)||count===0)throw Error('Invalid saved page transfer edge.');
  total+=count;if(!Number.isSafeInteger(total))throw Error('Invalid saved page transfer total.');
 }
 if(total!==ledger.transferred)throw Error('Page transfers do not reconcile.');
 let sequence=0;
 for(const event of ledger.recent){
  if(!event||!integer(event.sequence)||event.sequence<=sequence||event.sequence>ledger.transferred||!integer(event.day)||!integer(event.tick)||
    !integer(event.id)||event.id===0||typeof event.species!=='string'||!event.species||
    !validKey(event.from,grid)||!validKey(event.to,grid)||event.from===event.to||!ledger.byEdge.has(event.from+'>'+event.to))throw Error('Invalid saved page transfer receipt.');
  sequence=event.sequence;
 }
 if(ledger.recent.length&&ledger.recent.at(-1).sequence!==ledger.transferred)throw Error('Missing latest page transfer receipt.');
}
