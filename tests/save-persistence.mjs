import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SAVE_SCHEMA,createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('GENVO8-SAVE-ROUNDTRIP',{player:true});
const p=sim.player(),other=sim.animals.find(a=>a.alive&&a.id!==p.id);
assert.ok(p&&other,'fixture has player and another animal');

// Stage state across several authorities so the persistence contract is broader than player position.
for(let i=0;i<180;i++)sim.update(null);
p.x=42.25;p.y=57.75;p.energy=73.5;p.hydration=61.25;p.intent='mate';p.target=other;
p.carryingFood={kind:'bramble',label:'Berries',biomass:.12,stored:2.4,origin:{x:41,y:57}};
sim.world.plants.bramble[sim.world.idx(42,57)]=.314;
sim.world.moisture[sim.world.idx(42,57)]=.777;
sim.shelter.shelters.push({id:91,ownerId:p.id,x:41.5,y:57.5,integrity:84,weatherSeal:.81,foodStore:6.25,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
sim.shelter.nextId=92;
sim.familyDirectives.mode='follow';
sim.familyDirectives.avoidZones.push({id:7,x:48,y:56,radius:4,createdTick:sim.tickCount});
sim.cognition.states.set(p.id,{history:[{type:'save-test',day:sim.day}],seen:new Set([other.id])});
sim.generationProgress.unlocks.add('save-test-unlock');
sim.evolutionTree.events.push({type:'save-test',day:sim.day,branchId:'root'});
sim.uiTutorialStage='done';
sim.paused=false;
const rngState=sim.rng.state>>>0;

// IndexedDB uses structured clone. Reproduce that exact clone boundary in Node.
const snapshot=structuredClone(createSimulationSnapshot(sim,{reason:'test',savedAt:'2026-10-07T18:00:00.000Z'}));
assert.equal(snapshot.schema,SAVE_SCHEMA);
assert.equal(snapshot.meta.generation,p.generation);
assert.equal(snapshot.meta.reason,'test');

const restored=restoreSimulationSnapshot(snapshot),rp=restored.player();
for(const [kind,field] of Object.entries(sim.world.freshwaterFood))assert.deepEqual(restored.world.freshwaterFood[kind],field,'freshwater depletion survives restore');
const legacy=structuredClone(snapshot);legacy.schema=9;delete legacy.world.freshwaterFood;
const migrated=restoreSimulationSnapshot(legacy);
assert.equal(migrated.rng.state,sim.rng.state,'schema 9 initialization does not draw simulation RNG');
assert.equal(migrated.animals.length,sim.animals.length,'migration adds no animals');
assert.deepEqual(migrated.player().bodyPlan,p.bodyPlan,'migration preserves inherited anatomy');
const missing=structuredClone(snapshot);delete missing.world.freshwaterFood;
assert.throws(()=>restoreSimulationSnapshot(missing),'current saves cannot silently refill missing stocks');
assert.equal(restored.seed,sim.seed);
assert.equal(restored.rng.state>>>0,rngState,'RNG state survives exactly');
assert.equal(restored.tickCount,sim.tickCount);
assert.equal(restored.day,sim.day);
assert.equal(restored.year,sim.year);
assert.equal(restored.animals.length,sim.animals.length,'restore does not bootstrap duplicate fauna');
assert.equal(rp.id,p.id);
assert.equal(rp.x,42.25);
assert.equal(rp.y,57.75);
assert.equal(rp.energy,73.5);
assert.equal(rp.carryingFood.kind,'bramble');
assert.equal(rp.target.id,other.id,'direct animal references survive the structured-clone graph');
assert.strictEqual(rp.target,restored.animals.find(a=>a.id===other.id),'animal references reconnect to restored animal objects');
assert.ok(Math.abs(restored.world.plants.bramble[restored.world.idx(42,57)]-.314)<1e-5);
assert.ok(Math.abs(restored.world.moisture[restored.world.idx(42,57)]-.777)<1e-5);
assert.equal(restored.shelter.shelters.at(-1).id,91);
assert.equal(restored.familyDirectives.mode,'follow');
assert.equal(restored.familyDirectives.avoidZones.at(-1).id,7);
assert.ok(restored.cognition.states instanceof Map);
assert.ok(restored.cognition.states.get(p.id).seen instanceof Set);
assert.ok(restored.generationProgress.unlocks instanceof Set);
assert.equal(restored.evolutionTree.events.at(-1).type,'save-test');
assert.equal(restored.uiTutorialStage,'done');

// The restored runtime remains live and authoritative after rehydration.
const before=restored.tickCount;
restored.update(null);
assert.equal(restored.tickCount,before+1);
restored.rebuildSpatial();
assert.ok(restored.spatial.some(bucket=>bucket.includes(rp)),'restored animals re-enter derived spatial buckets');

assert.throws(()=>restoreSimulationSnapshot({...snapshot,schema:999}),/Unsupported save schema/,'future/unknown saves fail safely instead of corrupting state');
console.log('save persistence roundtrip: PASS');
