// Frozen complete snapshot signatures captured before simulation modernization.
// Recording is an explicit developer operation; ordinary CI never updates expectations.
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
if (process.argv.includes('--record')) fs.writeFileSync(fixture, JSON.stringify(observed, null, 2) + '\n');
assert.deepEqual(observed, JSON.parse(fs.readFileSync(fixture, 'utf8')), 'full snapshots preserve pre-refactor world, organisms, resources, policies and RNG');
console.log('Modernization baseline: complete snapshots and restored continuation PASS');
