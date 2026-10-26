import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {initializeControllers} from '../src/sim/controller-composition.js';
const {orderedControllers} = JSON.parse(fs.readFileSync(new URL('./fixtures/controller-composition.json', import.meta.url), 'utf8'));
const expectedKeys = orderedControllers.map(([key]) => key);
for (const deferDispersalInitialization of [false, true]) {
  const sim = new Simulation('CONTROLLER-COMPOSITION', {bootstrap: false, deferDispersalInitialization});
  assert.deepEqual(Object.keys(sim).filter(key => expectedKeys.includes(key)), expectedKeys, 'original constructor assignment order');
  for (const [key, type] of orderedControllers) {
    assert.equal(sim[key].constructor.name, type, `${key} retains the domain authority`);
    assert.equal(sim[key].sim, sim, `${key} retains the actual Simulation owner`);
  }
  assert.equal(sim.animals.length, 0, 'composition does not bootstrap organisms');
  assert.equal(sim.tickCount, 0, 'composition does not advance time');
  assert.equal(typeof sim.world.onCropConsumed, deferDispersalInitialization ? 'undefined' : 'function', 'restore deferral does not initialize generated flora');
  // Observe actual helper assignment order through a transparent owner proxy.
  const writes = [];
  const owner = new Proxy(sim, {set(target, key, value) { writes.push(key); return Reflect.set(target, key, value); }});
  initializeControllers(owner, {deferDispersalInitialization: true});
  assert.deepEqual(writes.filter(key => expectedKeys.includes(key)), expectedKeys);
  for (const key of expectedKeys) assert.equal(sim[key].sim, owner, 'helper borrows its caller, never captures another world');
}
const bootstrapped = new Simulation('CONTROLLER-COMPOSITION-BOOTSTRAP');
assert.ok(bootstrapped.player()?.alive, 'ordinary bootstrap still establishes a player');
assert.equal(bootstrapped.lineage.founderId, bootstrapped.playerId, 'ordinary bootstrap records the actual founder');
console.log('Controller composition: original 47 authorities, owner identity, assignment order, deferred flora and ordinary bootstrap PASS');
