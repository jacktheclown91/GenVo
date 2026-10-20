import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph,decodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
import {packageScenarioSnapshot,openScenarioSnapshot,validateScenarioCatalog} from '../src/persistence/scenario-library.js';

// Exact binary arrays, shared references, map keys, set members and cycles
// survive browser/Node JSON transport. Plain JSON of an IndexedDB state does not.
const common={k:'linked'},typed=new Float64Array([.25,1.75,Math.PI]),graph={
 numbers:typed,alias:typed,entry:common,reference:common,
 links:new Map([[common,typed]]),seen:new Set([common]),
 date:new Date('2026-10-20T12:00:00.000Z'),
 view:new DataView(Uint8Array.from([7,14]).buffer),missing:undefined,nan:NaN};
graph.self=graph;
const decoded=decodeSnapshotGraph(JSON.parse(JSON.stringify(encodeSnapshotGraph(graph))));
assert.equal(decoded.self,decoded);
assert.equal(decoded.numbers,decoded.alias);
assert.equal(decoded.entry,decoded.reference);
assert.deepEqual(decoded.numbers,typed);
assert.equal(decoded.links.get(decoded.entry),decoded.numbers);
assert.ok(decoded.seen.has(decoded.entry));
assert.equal(+decoded.date,+graph.date);
assert.equal(decoded.view.getUint8(1),14);
assert.equal(decoded.missing,undefined);
assert.ok(Number.isNaN(decoded.nan));
const badGraph=encodeSnapshotGraph({x:2});
badGraph.nodes[0].items[0][1]={$ref:9999};
assert.throws(()=>decodeSnapshotGraph(badGraph),/Invalid scenario graph reference/);
assert.throws(()=>validateScenarioCatalog({schema:1,scenarios:[
 {id:'fake',label:'Fake day',day:100,file:'https://bad.invalid/world.json',sha256:'0'.repeat(64)}
]}),/Invalid catalog scenario entry/);

// A real simulation checkpoint must restore the same world and lifecycle,
// not bootstrap replacements. Reopening always returns an INDEPENDENT copy.
const sim=new Simulation('SCENARIO-CHECKPOINT',{player:true,worldGenerator:'freshwater/1'});
for(let tick=0;tick<8;tick++)sim.update(null);
const snapshot=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'scenario-regression'}));
const scenario=packageScenarioSnapshot(snapshot,{
 id:'real-early-world',label:'Recorded First Ecology',
 description:'One real recorded world, used to verify scenario replay'});
assert.equal(scenario.metadata.day,sim.day);
assert.equal(scenario.metadata.tickCount,sim.tickCount);
assert.ok(scenario.metadata.liveAnimals>0);
const roundtrip=JSON.parse(JSON.stringify(scenario));
const first=restoreSimulationSnapshot(openScenarioSnapshot(roundtrip));
const second=restoreSimulationSnapshot(openScenarioSnapshot(roundtrip));
assert.equal(first.seed,sim.seed);
assert.equal(first.day,sim.day);
assert.equal(first.tickCount,sim.tickCount);
assert.equal(first.rng.state,sim.rng.state);
assert.equal(first.animals.length,sim.animals.length);
assert.deepEqual(first.world.moisture,sim.world.moisture);
assert.deepEqual(first.world.fertility,sim.world.fertility);
assert.deepEqual(first.world.plants.bramble,sim.world.plants.bramble);
assert.notEqual(first.world.moisture,second.world.moisture);
assert.notEqual(first.animals,second.animals);
const before=second.world.moisture[2];
first.world.moisture[2]=.123456;
first.animals[0].health=-40;
assert.equal(second.world.moisture[2],before);
assert.notEqual(second.animals[0].health,-40);
const third=restoreSimulationSnapshot(openScenarioSnapshot(roundtrip));
assert.equal(third.world.moisture[2],before,'scenario baseline was never altered');
assert.equal(third.rng.state,sim.rng.state,'RNG must not advance when a world is forked');
const forged=structuredClone(roundtrip);
forged.metadata.day+=1;
assert.throws(()=>openScenarioSnapshot(forged),/Scenario metadata disagrees/);
const empty=structuredClone(snapshot);
empty.animals.forEach(a=>a.alive=false);
assert.throws(()=>packageScenarioSnapshot(empty,{
 id:'unplayable-world',label:'No surviving creatures'}),/no surviving ecosystem animals/);
console.log('Scenario checkpoints: structured state, real save restore, independent forks, unchanged RNG and tamper refusal PASS');
