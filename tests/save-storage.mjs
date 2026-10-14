import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SaveManager} from '../src/persistence/save-manager.js';

function fakeIndexedDB(){
  const dbs=new Map();
  return{
    open(name){
      const request={result:null,error:null,onsuccess:null,onerror:null,onupgradeneeded:null};
      queueMicrotask(()=>{
        try{
          let db=dbs.get(name),created=false;
          if(!db){
            created=true;const stores=new Map();
            db={
              objectStoreNames:{contains:key=>stores.has(key)},
              createObjectStore:key=>{if(!stores.has(key))stores.set(key,new Map());return{}},
              transaction(names){
                const tx={oncomplete:null,onabort:null,onerror:null,error:null,objectStore:key=>({
                  get(id){const req={result:undefined,error:null,onsuccess:null,onerror:null};queueMicrotask(()=>{req.result=stores.get(key)?.has(id)?structuredClone(stores.get(key).get(id)):undefined;req.onsuccess?.()});return req},
                  put(value,id){stores.get(key).set(id,structuredClone(value));return{}},
                  delete(id){stores.get(key).delete(id);return{}}
                })};
                setTimeout(()=>tx.oncomplete?.(),0);return tx;
              }
            };
            dbs.set(name,db);
          }
          request.result=db;if(created)request.onupgradeneeded?.();request.onsuccess?.();
        }catch(error){request.error=error;request.onerror?.()}
      });
      return request;
    }
  };
}

globalThis.indexedDB=fakeIndexedDB();
const sim=new Simulation('GENVO8-IDB-CONTRACT',{player:true}),p=sim.player();
p.x=31.25;p.y=47.5;p.generation=4;sim.day=7;sim.year=2;sim.uiTutorialStage='done';
const statuses=[];const manager=new SaveManager({getSim:()=>sim,onStatus:s=>statuses.push(s),autosaveMs:999999});
const meta=await manager.saveNow('manual-test');
assert.equal(meta.generation,4);assert.equal(meta.day,7);assert.equal(meta.year,2);
const storedMeta=await manager.metadata();assert.equal(storedMeta.reason,'manual-test');
const loaded=await manager.load();assert.ok(loaded);assert.equal(loaded.player().x,31.25);assert.equal(loaded.player().y,47.5);assert.equal(loaded.player().generation,4);assert.equal(loaded.day,7);assert.equal(loaded.year,2);
assert.ok(statuses.some(s=>s.kind==='saving'));assert.ok(statuses.some(s=>s.kind==='saved'));
await manager.clear();assert.equal(await manager.metadata(),null);
console.log('IndexedDB save manager contract: PASS');
