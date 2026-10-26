// Frozen complete snapshot signatures captured before simulation modernization.
// Golden variants come from the untouched reference commit, never the refactor.
// Different V8 majors have existing last-bit arithmetic differences; compare exactly within each supported engine.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot, restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const fixture = new URL('./fixtures/modernization-baseline.json', import.meta.url);
const snapshot = sim => structuredClone(createSimulationSnapshot(sim, {savedAt: 'fixed', reason: 'modernization-baseline'}));
function digest(value) {
  const seen = new Map();
  function encode(item) {
    if (!item || typeof item !== 'object') return item;
    if (seen.has(item)) return {$ref: seen.get(item)};
    seen.set(item, seen.size);
    if (ArrayBuffer.isView(item)) return {$type: item.constructor.name, data: Array.from(item)};
    if (item instanceof Map) return {$map: [...item].map(([key, val]) => [encode(key), encode(val)])};
    if (item instanceof Set) return {$set: [...item].map(encode)};
    if (Array.isArray(item)) return item.map(encode);
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, encode(item[key])]));
  }
  return createHash('sha256').update(JSON.stringify(encode(value))).digest('hex');
}
const observed = [];
for (const generator of ['freshwater/1', 'planetary/1']) {
  const sim = new Simulation('MODERNIZATION-20261026', {worldGenerator: generator});
  sim.setPlayerAutonomy(true);
  const checkpoints = [];
  for (let tick = 0; tick <= 96; tick++) {
    if ([0, 6, 48, 96].includes(tick)) {
      assert.equal(sim.tickCount, tick, 'checkpoint uses the actual expected tick');
      const state = snapshot(sim);
      checkpoints.push({tick, sha256: digest(state), rng: sim.rng.state});
      if (tick === 48) {
        const restored = restoreSimulationSnapshot(structuredClone(state));
        assert.deepEqual(snapshot(restored), state, 'restoring preserves the complete checkpoint');
        for (let step = 0; step < 6; step++) { sim.update(null); restored.update(null); }
        assert.deepEqual(snapshot(restored), snapshot(sim), 'restored wildlife and resources continue exactly');
        tick += 6;
      }
    }
    if (tick < 96) sim.update(null);
  }
  observed.push({generator, checkpoints});
}
const baseline = JSON.parse(fs.readFileSync(fixture, 'utf8'));
const engine = process.versions.node.split('.')[0];
assert.ok(baseline.engines[engine], 'Use supported Node 22 or 24; establish any new engine baseline from the untouched reference source');
assert.ok(!process.argv.includes('--record'), 'Frozen reference expectations cannot be regenerated from the current implementation');
try {
  assert.deepEqual(observed, baseline.engines[engine], 'full snapshots preserve pre-refactor world, organisms, resources, policies and RNG exactly within this engine');
} catch (error) {
  // Public check annotations retain a concise diagnostic even when job logs need auth.
  if (process.env.GITHUB_ACTIONS) console.error('::error::Modernization Node ' + engine + ' snapshot mismatch: ' + JSON.stringify(observed));
  throw error;
}
console.log('Modernization baseline: complete snapshots and restored continuation PASS');
