import {regionKey} from '../world/planet-regions.js';
import {regionalOwnerRevision} from '../world/regional-revision.js';
const weak=value=>value&&(typeof value==='object'||typeof value==='function')?new WeakRef(value):value;
const same=(saved,value)=>saved instanceof WeakRef?saved.deref()===value:Object.is(saved,value);
const rows=object=>Object.entries(object||{}).map(([key,value])=>[key,weak(value)]);
const unchanged=(saved,object)=>Object.keys(object||{}).length===saved.length&&saved.every(([key,value])=>same(value,object?.[key]));
const committedRef=(index,entry)=>{const e=index?.entries.find(x=>x.kind==='session'&&x.key===entry.key);return!!e&&e.id===entry.owner.id&&(index.schema==='indexed-regions/1'?index.capture:e.capture)===entry.owner.capture};
function token({kind,owner}){
 const snapshot=kind==='session'?owner.snapshot:null;
 return{revision:regionalOwnerRevision(owner),owner:new WeakRef(owner),fields:rows(owner),snapshot:rows(snapshot),core:rows(snapshot?.core),world:rows(snapshot?.world)};
}
function matches(saved,entry){
 const snapshot=entry.kind==='session'?entry.owner.snapshot:null;
 return saved.owner.deref()===entry.owner&&saved.revision===regionalOwnerRevision(entry.owner)&&unchanged(saved.fields,entry.owner)&&unchanged(saved.snapshot,snapshot)&&unchanged(saved.core,snapshot?.core)&&unchanged(saved.world,snapshot?.world);
}
function owners(sim){
 const sessions=sim.planetaryTravel?.sessions||[],unloaded=sim.planetaryTravel?.unloaded||[],keys=new Set([...sessions,...unloaded].map(s=>s.key));
 return[...sessions.map(owner=>({kind:'session',key:owner.key,owner})),...unloaded.map(stub=>({kind:'session',key:stub.key,owner:stub,unloaded:true})),...(sim.planetaryRegions?.entries()||[]).filter(e=>e.world!==sim.world&&!keys.has(e.key)).map(e=>({kind:'survey',key:e.key,owner:e.world,origin:e.origin}))];
}
// Acknowledgements keep the generations captured BEFORE IDB cloning, never
// the newer live state at completion. Weak guards do not retain old payloads.
export class RegionalDirtyJournal{
 #baseline=null;#epoch=0;
 clear(){this.#baseline=null;this.#epoch++}
 capture(sim,slot,previous){
  const entries=owners(sim),supported=typeof WeakRef==='function',captured=entries.map(entry=>({...entry,token:supported&&!entry.unloaded?token(entry):null})),index=previous?.regionalPersistence,base=this.#baseline;
  const baseline=!!(supported&&index?.identityPolicy&&base&&base.sim.deref()===sim&&base.slot===slot&&base.capture===index.capture);
  if(entries.some(e=>e.unloaded&&!committedRef(index,e)))throw Error('An unloaded region no longer matches the committed checkpoint; reload the world.');
  const incremental=!!(baseline&&base.active===regionKey(sim.world.regionOrigin)&&base.entries.length===entries.length&&index.entries.length===entries.length&&entries.every((entry,i)=>entry.kind===base.entries[i].kind&&entry.key===base.entries[i].key&&!!entry.unloaded===!!base.entries[i].unloaded&&entry.kind===index.entries[i].kind&&entry.key===index.entries[i].key));
  const changed=incremental?captured.filter((entry,i)=>!entry.unloaded&&!matches(base.entries[i].token,entry)):captured.filter(entry=>!entry.unloaded);
  // General plan for any indexed checkpoint: unloaded owners and owners clean
  // since the acknowledged baseline are retained by reference; others written.
  const prior=baseline?new Map(base.entries.map(e=>[e.kind+'|'+e.key,e])):new Map();
  const plan=index?.identityPolicy?captured.map(entry=>{
   if(entry.unloaded)return{kind:'session',key:entry.key,unloaded:true,retain:entry.owner};
   const was=prior.get(entry.kind+'|'+entry.key),listed=index.entries.find(e=>e.kind===entry.kind&&e.key===entry.key&&!e.unloaded);
   return was&&!was.unloaded&&listed&&matches(was.token,entry)?{kind:entry.kind,key:entry.key,retain:true}:{kind:entry.kind,key:entry.key,payload:entry.kind==='session'?entry.owner:{origin:entry.origin,world:entry.owner}};
  }):null;
  return{sim,slot,epoch:this.#epoch,active:regionKey(sim.world.regionOrigin),entries:captured,incremental,changed,plan};
 }
 // True when `owner` is unchanged since an acknowledged save of this exact
 // committed root, i.e. its stored record is the live state.
 clean(sim,slot,root,owner){
  const base=this.#baseline,index=root?.regionalPersistence;
  if(typeof WeakRef!=='function'||!base||base.sim.deref()!==sim||base.slot!==slot||base.capture!==index?.capture)return false;
  const saved=base.entries.find(e=>e.kind==='session'&&e.key===owner.key&&!e.unloaded);
  return!!saved?.token&&matches(saved.token,{kind:'session',owner});
 }
 acknowledge(ticket,capture){
  if(ticket.epoch!==this.#epoch||typeof WeakRef!=='function')return;
  this.#baseline={sim:new WeakRef(ticket.sim),slot:ticket.slot,capture,active:ticket.active,entries:ticket.entries.map(({kind,key,token,unloaded})=>({kind,key,token,unloaded:!!unloaded}))};
 }
}
