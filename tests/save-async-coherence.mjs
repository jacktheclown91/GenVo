// Controlled asynchronous storage, with actual simulation ticks and mortality between barriers.
// The transport fake clones synchronously at put, as IndexedDB does; browser timing remains separate.
import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';import {SaveManager,createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
const metadata=deferred(),database=deferred(),written=deferred(),requestedDatabase=deferred();
const stored=new Map(),tx={oncomplete:null,onabort:null,onerror:null,error:null,objectStore:name=>({put(value,key){stored.set(name,structuredClone(value));if(name==='saves')written.resolve()}})};
const db={transaction(){return tx}};
const s=new Simulation('ASYNC-SAVE-COHERENCE',{player:true}),manager=new SaveManager({getSim:()=>s});manager.available=true;
manager.metadata=()=>metadata.promise;manager.db=()=>{requestedDatabase.resolve();return database.promise};
const saving=manager.saveNow('controlled-async-save');
for(let i=0;i<6;i++)s.update({});metadata.resolve({worldName:'Coherence fixture'});await requestedDatabase.promise;
for(let i=0;i<6;i++)s.update({});
const expected=structuredClone(createSimulationSnapshot(s,{reason:'controlled-async-save'})),signature=manager.signature(s);
database.resolve(db);await written.promise;await Promise.resolve();
const saved=stored.get('saves');assert.ok(saved);
assert.equal(saved.core.tickCount,expected.core.tickCount,'snapshot capture must follow all storage setup waits');
const normalize=v=>{const copy=structuredClone(v);delete copy.savedAt;delete copy.meta.savedAt;delete copy.meta.worldName;return copy};
assert.ok(isDeepStrictEqual(normalize(saved),normalize(expected)),'stored capture differs: '+Object.keys(saved).filter(k=>!isDeepStrictEqual(normalize(saved)[k],normalize(expected)[k])).join(',')+' metadata '+JSON.stringify({actual:saved.meta,expected:expected.meta}));
assert.ok(isDeepStrictEqual(normalize(createSimulationSnapshot(restoreSimulationSnapshot(structuredClone(saved)),{reason:'controlled-async-save'})),normalize(saved)),'stored state restores exactly');
// A genuine later lifecycle event must remain pending for a subsequent save.
for(let i=0;i<6;i++)s.update({});const victim=s.animals.find(a=>a.alive&&!a.player&&!a.lineage);assert.ok(victim);s.kill(victim,'controlled-concurrent-mortality');
assert.notEqual(manager.signature(s),signature);tx.oncomplete();await saving;
assert.equal(manager.lastSavedTick,saved.core.tickCount,'commit bookkeeping must refer to the captured tick');
assert.equal(manager.lastObservedSignature,signature,'events during commit are not falsely marked persisted');
const scheduled=[];manager.schedule=reason=>scheduled.push(reason);manager.observe();assert.ok(scheduled.includes('lineage-milestone'),'later real event remains eligible for autosave');
console.log('async save coherence: delayed setup, exact transported state/restore and post-capture biological events PASS');
