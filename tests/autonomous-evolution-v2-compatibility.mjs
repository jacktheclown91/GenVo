import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {regionalIdentity} from '../src/world/regional-identities.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';
import {recordControlledBranch} from './helpers/regional-evolution-world.mjs';

const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/autonomous-evolution-v2-baselines.json',import.meta.url)));
const baseline=fixtures.profiles.find(row=>row.nodeMajor===Number(process.versions.node.split('.')[0]));
assert.ok(baseline,'An untouched published /2 reference is required for this engine');
assert.equal(baseline.sourceCommit,'04c9a41524667481b0ae625d892abc5abcf29770');
assert.equal(baseline.options.autonomousEvolution,'autonomous-evolution/2');
const sim=new Simulation(baseline.seed,baseline.options);sim.setPlayerAutonomy(true);
const snapshot=s=>structuredClone(createSimulationSnapshot(s,
  {savedAt:'fixed',reason:'autonomous-evolution-v2-compatibility'}));
while(sim.tickCount<baseline.ticks)sim.update(null);
const saved=snapshot(sim);
assert.equal(sim.stats.births,baseline.births);assert.ok(sim.stats.births>0);
assert.equal(snapshotSignature(saved),baseline.signature,
  'Published /2 complete biology, RNG, resources and history remain exact');
const restored=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(snapshot(restored),saved);
for(let n=0;n<6;n++){sim.update(null);restored.update(null)}
assert.deepEqual(snapshot(restored),snapshot(sim));
assert.equal(snapshotSignature(snapshot(sim)),baseline.continuedSignature);

// Controlled historical classification checks complement the genuine-birth
// full-state reference. A local ended boundary cannot erase its /2 carrier.
const historical=new Simulation('HISTORICAL-EVOLUTION-2',{player:false,bootstrap:false,
  worldGenerator:'planetary/1',autonomousPopulations:true,autonomousEvolution:'autonomous-evolution/2'});
const point=historical.safeSpawn('mosskip'),animal=historical.spawnAnimal('mosskip',point.x,point.y);
const branch=recordControlledBranch(historical,animal,'historical-v2');
historical.evolutionTree.onBoundaryEnded(branch,'Controlled historical local boundary end',{extinct:true});
assert.equal(historical.evolutionTree.currentBranchFor(animal).id,branch.id);
assert.equal(historical.speciation.identityFor(animal).id,branch.id);
assert.equal(regionalIdentity(snapshot(historical)).evolution.rules,'autonomous-evolution/2');
const old=snapshot(historical);
assert.deepEqual(snapshot(restoreSimulationSnapshot(structuredClone(old))),old,
  'Historical /2 loads without a silent biological policy adoption');
console.log(`Autonomous evolution /2 compatibility PASS: untouched Node ${baseline.nodeMajor} complete ${baseline.ticks}-tick birth-containing world, six ticks, recorded carrier and exact historical headers.`);
