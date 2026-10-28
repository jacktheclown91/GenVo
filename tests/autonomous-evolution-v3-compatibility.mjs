// Published autonomous-evolution/3 keeps its recorded behavior exactly: a complete
// ordinary AUTO world with an actual birth, recorded from untouched 629ad29a.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';
import {withCanonicalSeedTables} from '../tools/canonical-seed-tables.mjs';

const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/autonomous-evolution-v3-baselines.json',import.meta.url)));
const baseline=fixtures.profiles.find(row=>row.nodeMajor===Number(process.versions.node.split('.')[0]));
assert.ok(baseline,'An untouched published /3 reference is required for this engine');
assert.equal(baseline.sourceCommit,'629ad29a91fdfceb1de7770596c27c5069ac4d49');
assert.equal(baseline.options.autonomousEvolution,'autonomous-evolution/3');
const sim=new Simulation(baseline.seed,baseline.options);sim.setPlayerAutonomy(true);
assert.equal(sim.autonomousEvolutionRules,'autonomous-evolution/3','an explicit /3 world keeps /3');
const snapshot=s=>withCanonicalSeedTables(structuredClone(createSimulationSnapshot(s,
  {savedAt:'fixed',reason:'autonomous-evolution-v3-compatibility'})));
while(sim.tickCount<baseline.ticks)sim.update(null);
const saved=snapshot(sim);
assert.equal(sim.stats.births,baseline.births);assert.ok(sim.stats.births>0);
assert.equal([...sim.populationMemory.histories.values()].filter(h=>h.regionalObservations?.length).length,baseline.observedHistories);
assert.equal(snapshotSignature(saved),baseline.signature,'Published /3 complete biology, RNG, resources, history and observations remain exact');
const restored=restoreSimulationSnapshot(structuredClone(saved));
assert.ok(isDeepStrictEqual(snapshot(restored),saved),'restored /3 world has the same values');
assert.equal(restored.autonomousEvolutionRules,'autonomous-evolution/3','loading never adopts a later policy');
for(let n=0;n<6;n++){sim.update(null);restored.update(null)}
assert.equal(snapshotSignature(snapshot(sim)),baseline.continuedSignature,'Original /3 continuation remains exact');
assert.ok(isDeepStrictEqual(snapshot(restored),snapshot(sim)),'restored continuation has the same values');
console.log(`Autonomous evolution /3 compatibility PASS: untouched Node ${baseline.nodeMajor} complete ${baseline.ticks}-tick birth-containing world, observations, exact restoration values and six ticks.`);
