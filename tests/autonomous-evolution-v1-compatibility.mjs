import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {regionalIdentity} from '../src/world/regional-identities.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';
import {recordControlledBranch} from './helpers/regional-evolution-world.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/autonomous-evolution-v1-baselines.json',import.meta.url)));
const baseline=fixtures.profiles.find(row=>row.nodeMajor===Number(process.versions.node.split('.')[0]));
assert.ok(baseline,'A frozen untouched /1 baseline is required for this engine');
assert.equal(baseline.sourceCommit,'aea8ba3dbc70f5cbf1ad956bfc6dae39cde3153f');
assert.equal(baseline.options.autonomousEvolution,'autonomous-evolution/1');
const sim=new Simulation(baseline.seed,baseline.options);sim.setPlayerAutonomy(true);
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'autonomous-evolution-v1-compatibility'}));
while(sim.tickCount<baseline.ticks)sim.update(null);
const saved=snapshot(sim);
assert.equal(sim.stats.births,baseline.births);
assert.ok(sim.stats.births>0);
assert.equal(snapshotSignature(saved),baseline.signature,'Complete historical /1 biology, RNG, resources and history remain exact');
const restored=restoreSimulationSnapshot(structuredClone(saved));assert.deepEqual(snapshot(restored),saved);
for(let n=0;n<6;n++){sim.update(null);restored.update(null)}
assert.deepEqual(snapshot(restored),snapshot(sim));
assert.equal(snapshotSignature(snapshot(sim)),baseline.continuedSignature,'Original /1 continuation remains exact');

// A controlled historical ended-boundary case retains its prior interpretation.
// New regional semantics belong to /2; loading /1 is not an implicit migration.
const old=new Simulation('HISTORICAL-EVOLUTION-1',{player:false,bootstrap:false,
  worldGenerator:'planetary/1',autonomousPopulations:true,autonomousEvolution:'autonomous-evolution/1'});
const point=old.safeSpawn('mosskip'),animal=old.spawnAnimal('mosskip',point.x,point.y);
const branch=recordControlledBranch(old,animal,'legacy');
old.evolutionTree.onBoundaryEnded(branch,'Historical boundary end',{extinct:true});
assert.equal(old.evolutionTree.currentBranchFor(animal),null);
assert.equal(old.speciation.identityFor(animal),null);
assert.equal(old.evolutionTree.recordedHistory(),null);
assert.ok(old.evolutionTree.snapshot().every(node=>node.censusComplete===undefined));
assert.equal(regionalIdentity(snapshot(old)).evolution,undefined);
const legacySaved=snapshot(old);assert.deepEqual(snapshot(restoreSimulationSnapshot(legacySaved)),legacySaved);
console.log(`Autonomous evolution /1 compatibility PASS: untouched Node ${baseline.nodeMajor} complete ${baseline.ticks}-tick birth-containing world, six ticks, old ended-boundary semantics and unchanged indexed header; no implicit /2 adoption.`);
