// Manual saves must not be silently rejected during an in-flight autosave.
// Controlled IndexedDB transport clones at put and waits for explicit commits.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SaveManager} from '../src/persistence/save-manager.js';

const sim=new Simulation('GENVO-SAVE-CONCURRENT-REQUESTS',{player:true});
const manager=new SaveManager({getSim:()=>sim});
manager.available=true;
const writes=[],transactions=[];
const db={transaction(){
  const tx={
    oncomplete:null,onabort:null,onerror:null,error:null,
    objectStore(name){return{put(value,key){
      if(name==='saves')writes.push({key,snapshot:structuredClone(value)});
    }}}
  };
  transactions.push(tx);
  return tx;
}};
manager.metadata=async()=>({worldName:'Concurrency fixture'});
manager.db=async()=>db;

const first=manager.saveNow('autosave');
await new Promise(resolve=>setImmediate(resolve));
assert.equal(transactions.length,1,'first autosave is waiting on its storage transaction');
assert.equal(writes.length,1);
const firstTick=writes[0].snapshot.core.tickCount;

const manual=manager.saveNow('manual');
let manualFinished=false;
manual.then(()=>{manualFinished=true});
for(let i=0;i<6;i++)sim.update(null);
const laterTick=sim.tickCount;
assert.ok(laterTick>firstTick,'the world advances while autosave is in flight');
await Promise.resolve();
assert.equal(manualFinished,false,'manual save must wait for transport, not claim success');

transactions[0].oncomplete();
await first;
await new Promise(resolve=>setImmediate(resolve));
assert.equal(transactions.length,2,'manual request opens a fresh second transaction');
assert.equal(writes.length,2);
assert.equal(writes[0].snapshot.meta.reason,'autosave');
assert.equal(writes[1].snapshot.meta.reason,'manual');
assert.equal(writes[1].snapshot.core.tickCount,laterTick,'manual save captures intervening simulation progress');
transactions[1].oncomplete();
const result=await manual;
assert.equal(result.reason,'manual');
assert.equal(manager.lastSavedTick,laterTick);
assert.equal(manager.busy,false);
assert.equal(manager.activeSave,null);
console.log('concurrent save requests: delayed autosave, retained manual intent and current-state capture PASS');
