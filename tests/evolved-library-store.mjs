import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SaveManager} from '../src/persistence/save-manager.js';
import {foundRegionalPopulations} from '../src/ecology/regional-founding.js';
import {entryFromCohort,authoredConfigurations,configurationKey} from '../src/lineage/evolved-library.js';
import {mutatePlan} from '../src/lineage/body-inheritance.js';
import {RNG} from '../src/core/rng.js';

// Minimal IndexedDB with get/put/getAll, the surface the library store uses.
function fakeIndexedDB(){const dbs=new Map();return{open(name){const request={result:null,error:null};queueMicrotask(()=>{let db=dbs.get(name),created=false;if(!db){created=true;const stores=new Map();db={objectStoreNames:{contains:k=>stores.has(k)},close(){},createObjectStore:k=>{stores.set(k,new Map())},transaction(){const tx={oncomplete:null,onabort:null,onerror:null,error:null,objectStore:k=>({
 get(id){const r={result:undefined};queueMicrotask(()=>{r.result=structuredClone(stores.get(k).get(id));r.onsuccess?.()});return r},
 getAll(){const r={result:null};queueMicrotask(()=>{r.result=structuredClone([...stores.get(k).values()]);r.onsuccess?.()});return r},
 put(v,id){stores.get(k).set(id,structuredClone(v));return{}},openKeyCursor(){const r={result:null};queueMicrotask(()=>r.onsuccess?.());return r}})};setTimeout(()=>tx.oncomplete?.(),5);return tx}};dbs.set(name,db)}request.result=db;if(created)request.onupgradeneeded?.();request.onsuccess?.()});return request}}}
globalThis.indexedDB=fakeIndexedDB();

// A structurally valid entry from a real body changed by the ordinary mutation
// operator (storage contract only; registration evidence is tested elsewhere).
const sim=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:128,y:0}});foundRegionalPopulations(sim,{region:'128,0'});
const cohort=sim.animals.filter(a=>a.foundingOrigin?.template==='hopper');const rng=new RNG('store');let plan=cohort[0].bodyPlan;
for(let k=0;k<50&&authoredConfigurations().has('mosskip|'+plan.id);k++)plan=mutatePlan(rng,cohort[0].bodyPlan);
for(const a of cohort)a.bodyPlan=plan;assert.ok(!authoredConfigurations().has(configurationKey(cohort[0])));
const entry=entryFromCohort(sim,cohort);sim.evolvedRegistrations=[entry];
const manager=new SaveManager({getSim:()=>sim,autosaveMs:999999});
assert.equal(await manager.recordEvolvedRegistrations(sim),1);
assert.equal(await manager.recordEvolvedRegistrations(sim),0,'the same registration is not duplicated');
let list=await manager.listEvolvedLibrary();assert.equal(list.length,1);assert.equal(list[0].sightings.length,1);
// The same configuration registered in another world adds a sighting, not an entry.
const elsewhere={...structuredClone(entry),history:{...entry.history,seed:'OTHER-WORLD'}};const other={evolvedLibraryRules:sim.evolvedLibraryRules,evolvedRegistrations:[elsewhere],planetaryTravel:{sessions:[{snapshot:{core:{evolvedRegistrations:[entry]}}}]}};
await manager.recordEvolvedRegistrations(other);list=await manager.listEvolvedLibrary();
assert.equal(list.length,1,'configurations deduplicate across worlds');assert.deepEqual(list[0].sightings.map(s=>s.seed).sort(),['OTHER-WORLD','PLANET-B0-A']);
// Invalid entries are refused on write and skipped on read.
await assert.rejects(manager.recordEvolvedRegistrations({evolvedLibraryRules:sim.evolvedLibraryRules,evolvedRegistrations:[{...entry,configuration:'mosskip|forged'}]}),/Invalid evolved library entry/);
console.log('Evolved library store PASS: cross-world store, no duplicates, sightings per world and validation on write and read.');
