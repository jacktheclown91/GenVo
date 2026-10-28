import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {withCanonicalSeedTables} from '../tools/canonical-seed-tables.mjs';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';
for(const version of [1,2]){
 const baselines=JSON.parse(fs.readFileSync(new URL(`./fixtures/autonomous-v${version}-baselines.json`,import.meta.url)));
 const baseline=baselines.find(row=>row.nodeMajor===Number(process.versions.node.split('.')[0]));
 assert.ok(baseline,'A frozen original-policy baseline is required for this Node engine');
 const sim=new Simulation(baseline.seed,{...baseline.options,autonomousPopulations:`autonomous-populations/${version}`});
 sim.setPlayerAutonomy(true);
 while(sim.tickCount<baseline.ticks)sim.update(null);
 const snapshot=withCanonicalSeedTables(structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'natural-evolution'})));
 assert.equal(snapshotSignature(snapshot),baseline.signature,
  `Complete original-v${version} world, including actual conception, birth, RNG and demographic records, stays unchanged`);
 console.log(`Autonomous v${version} compatibility PASS: original Node ${baseline.nodeMajor} complete ${baseline.ticks}-tick world including actual paid birth`);
}
