import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SaveManager} from '../src/persistence/save-manager.js';

function fakeIndexedDB(){
 const dbs=new Map();return{open(name){const request={result:null,error:null};queueMicrotask(()=>{
  let db=dbs.get(name),created=false;
  if(!db){created=true;const stores=new Map();db={objectStoreNames:{contains:key=>stores.has(key)},close(){},
    createObjectStore:key=>{stores.set(key,new Map())},transaction(){
     const tx={error:null,oncomplete:null,onerror:null,onabort:null,objectStore:key=>({
      get(id){const r={result:null};queueMicrotask(()=>{r.result=structuredClone(stores.get(key).get(id));r.onsuccess?.()});return r},
      getAll(){const r={result:null};queueMicrotask(()=>{r.result=structuredClone([...stores.get(key).values()]);r.onsuccess?.()});return r},
      put(v,id){stores.get(key).set(id,structuredClone(v));return{}},delete(id){stores.get(key).delete(id);return{}},
      openKeyCursor(){const keys=[...(stores.get(key)?.keys()||[])],r={result:null};let i=0;const next=()=>queueMicrotask(()=>{r.result=i<keys.length?{key:keys[i++],continue:next}:null;r.onsuccess?.()});next();return r}
     })};setTimeout(()=>tx.oncomplete?.(),5);return tx;
    }};dbs.set(name,db)}request.result=db;if(created)request.onupgradeneeded?.();request.onsuccess?.();});return request}}
}
globalThis.indexedDB=fakeIndexedDB();
let sim=new Simulation('GENVO-MENU-A',{player:true});sim.player().x=15;
const manager=new SaveManager({getSim:()=>sim,autosaveMs:900000});
const legacy=await manager.saveNow('legacy');assert.equal(legacy.key,'autosave');
assert.equal((await manager.listWorlds()).length,1);
const a=await manager.allocateWorld('Wetland Roots');
sim=new Simulation('GENVO-MENU-B',{player:true});sim.player().x=39;
await manager.saveNow('world-start');
const b=await manager.allocateWorld('Highland Line');
sim=new Simulation('GENVO-MENU-C',{player:true});sim.player().x=93;
await manager.saveNow('world-start');
assert.equal((await manager.listWorlds()).length,3,'two new worlds do not replace the historical slot');
assert.equal((await manager.load(a)).seed,'GENVO-MENU-B');
assert.equal(manager.activeSlotId,a);
assert.equal((await manager.load(b)).player().x,93);
await manager.renameWorld(a,'Wetlands Forever');assert.equal((await manager.metadata(a)).worldName,'Wetlands Forever');
assert.equal((await manager.load('autosave')).player().x,15,'legacy save intact');
await manager.deleteWorld(b);
assert.equal((await manager.listWorlds()).length,2);
assert.equal((await manager.metadata(b)),null);
console.log('menu multi-world slots and legacy compatibility: PASS');
