import {regionKey} from '../world/planet-regions.js';
import {regionalOwnerRevision} from '../world/regional-revision.js';
const weak=value=>value&&(typeof value==='object'||typeof value==='function')?new WeakRef(value):value;
const same=(saved,value)=>saved instanceof WeakRef?saved.deref()===value:Object.is(saved,value);
const rows=object=>Object.entries(object||{}).map(([key,value])=>[key,weak(value)]);
const unchanged=(saved,object)=>Object.keys(object||{}).length===saved.length&&saved.every(([key,value])=>same(value,object?.[key]));
function token({kind,owner}){
 const snapshot=kind==='session'?owner.snapshot:null;
 return{revision:regionalOwnerRevision(owner),owner:new WeakRef(owner),fields:rows(owner),snapshot:rows(snapshot),core:rows(snapshot?.core),world:rows(snapshot?.world)};
}
function matches(saved,entry){
 const snapshot=entry.kind==='session'?entry.owner.snapshot:null;
 return saved.owner.deref()===entry.owner&&saved.revision===regionalOwnerRevision(entry.owner)&&unchanged(saved.fields,entry.owner)&&unchanged(saved.snapshot,snapshot)&&unchanged(saved.core,snapshot?.core)&&unchanged(saved.world,snapshot?.world);
}
function owners(sim){
 const sessions=sim.planetaryTravel?.sessions||[],keys=new Set(sessions.map(s=>s.key));
 return[...sessions.map(owner=>({kind:'session',key:owner.key,owner})),...(sim.planetaryRegions?.entries()||[]).filter(e=>e.world!==sim.world&&!keys.has(e.key)).map(e=>({kind:'survey',key:e.key,owner:e.world,origin:e.origin}))];
}
// Acknowledgements keep the generations captured BEFORE IDB cloning, never
// the newer live state at completion. Weak guards do not retain old payloads.
export class RegionalDirtyJournal{
 #baseline=null;#epoch=0;
 clear(){this.#baseline=null;this.#epoch++}
 capture(sim,slot,previous){
  const entries=owners(sim),supported=typeof WeakRef==='function',captured=entries.map(entry=>({...entry,token:supported?token(entry):null})),index=previous?.regionalPersistence,base=this.#baseline;
  const incremental=!!(supported&&index?.identityPolicy&&base&&base.sim.deref()===sim&&base.slot===slot&&base.capture===index.capture&&base.active===regionKey(sim.world.regionOrigin)&&base.entries.length===entries.length&&index.entries.length===entries.length&&entries.every((entry,i)=>entry.kind===base.entries[i].kind&&entry.key===base.entries[i].key&&entry.kind===index.entries[i].kind&&entry.key===index.entries[i].key));
  const changed=incremental?captured.filter((entry,i)=>!matches(base.entries[i].token,entry)):captured;
  return{sim,slot,epoch:this.#epoch,active:regionKey(sim.world.regionOrigin),entries:captured,incremental,changed};
 }
 acknowledge(ticket,capture){
  if(ticket.epoch!==this.#epoch||typeof WeakRef!=='function')return;
  this.#baseline={sim:new WeakRef(ticket.sim),slot:ticket.slot,capture,active:ticket.active,entries:ticket.entries.map(({kind,key,token})=>({kind,key,token}))};
 }
}
