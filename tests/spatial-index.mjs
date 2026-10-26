import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {rebuildSpatialIndex, forEachSpatialNeighbor} from '../src/sim/spatial-index.js';
import {originalRebuildSpatial, originalForEachNearby, originalSimulationBlob} from './fixtures/spatial-index-original.mjs';

assert.match(originalSimulationBlob, /^[0-9a-f]{40}$/);
const animal = (id, x, y, alive = true) => ({id, x, y, alive});
function owner(animals, columns = 16, size = 8) {
  return {animals, spatialCols: columns, spatialBucketSize: size, spatial: Array.from({length: columns * columns}, () => []), rng: {state: 123456}};
}
function compare(animals, queries, columns = 16, size = 8) {
  const original = owner(animals, columns, size), current = owner(animals, columns, size);
  const arrays = current.spatial.slice(), outer = current.spatial;
  for (let rebuild = 0; rebuild < 3; rebuild++) {
    assert.equal(originalRebuildSpatial.call(original), rebuildSpatialIndex(current));
    assert.equal(current.spatial, outer);
    assert.deepEqual(current.spatial, original.spatial);
    current.spatial.forEach((bucket, index) => assert.equal(bucket, arrays[index], 'Reuse every original bucket array'));
    for (const [x, y, radius] of queries) {
      for (const stop of [null, 1, 2, 5]) {
        const left = [], right = [];
        const expected = originalForEachNearby.call(original, {x, y}, radius, b => { left.push(b); if (left.length === stop) return false; });
        const observed = forEachSpatialNeighbor(current, {x, y}, radius, b => { right.push(b); if (right.length === stop) return false; });
        assert.equal(observed, expected);
        assert.deepEqual(right, left, 'Exact ordered references and early exit against frozen original loops');
        right.forEach((b, index) => assert.equal(b, left[index]));
      }
    }
    assert.equal(current.rng.state, 123456);
  }
  return current;
}
const animals = [animal(1, 8.2, 8.2), animal(2, 1, 1), animal(3, 8.3, 8.3), animal(4, 127.9, 127.9), animal(5, -20, -1), animal(6, 300, 500), animal(7, 2, 2, false), animal(8, 9, 1)];
const queries = [[8, 8, 8], [2, 2, 0], [64, 64, 1], [0, 0, 0], [127.999, 127.999, 0], [128, 128, 0], [-40, -40, 1], [300, 500, 1], [-1, -1, 20], [128, 128, 20], [0, 0, Infinity], [0, 0, -1], [0, 0, NaN]];
const indexed = compare(animals, queries);
compare([], queries);
compare(animals, queries, 3, 4);
const order = [];
forEachSpatialNeighbor(indexed, {x: 8, y: 8}, 8, b => order.push(b.id));
assert.deepEqual(order, [2, 5, 8, 1, 3], 'Bucket row/column order precedes global animal order');
const broadPhase = [];
forEachSpatialNeighbor(indexed, {x: 8, y: 8}, 0, b => broadPhase.push(b.id));
assert.deepEqual(broadPhase, [1, 3], 'No new circular distance filter');
for (const value of [undefined, null, 0, '', true]) assert.equal(forEachSpatialNeighbor(indexed, {x: 0, y: 0}, 200, () => value), true, 'Only strict false stops the callback');
const failure = Error('callback failure');
assert.throws(() => forEachSpatialNeighbor(indexed, {x: 0, y: 0}, 200, () => { throw failure; }), error => error === failure);

// Queries intentionally keep stale entries until rebuilding, just as before.
animals[1].alive = false;
const stale = [];
forEachSpatialNeighbor(indexed, {x: 1, y: 1}, 0, b => stale.push(b.id));
assert.ok(stale.includes(2));
rebuildSpatialIndex(indexed);
assert.ok(!indexed.spatial.flat().includes(animals[1]));
animals[0].x = 100; animals.push(animal(9, 100, 100));
compare(animals, queries);

// Preserve for-of callback semantics when a caller appends within its bucket.
for (const implementation of [originalForEachNearby, function(a, r, fn) { return forEachSpatialNeighbor(this, a, r, fn); }]) {
  const state = owner([animal(1, 1, 1)]); rebuildSpatialIndex(state);
  const visited = [];
  implementation.call(state, {x: 1, y: 1}, 0, b => { visited.push(b.id); if (b.id === 1) state.spatial[0].push(animal(2, 1, 1)); });
  assert.deepEqual(visited, [1, 2]);
}

// Actual Simulation wrappers and independent ownership, not only synthetic owners.
const first = new Simulation('SPATIAL-FIRST', {bootstrap: false});
const second = new Simulation('SPATIAL-SECOND', {bootstrap: false});
const a = first.spawnAnimal('genvo', 10, 10), b = second.spawnAnimal('genvo', 10, 10);
const rng = [first.rng.state, second.rng.state];
assert.equal(first.rebuildSpatial(), undefined); second.rebuildSpatial();
const found = []; assert.equal(first.forEachNearby(a, 1, candidate => found.push(candidate)), true);
assert.deepEqual(found, [a]); assert.notEqual(first.spatial, second.spatial);
first.spatial.forEach((bucket, index) => assert.notEqual(bucket, second.spatial[index]));
assert.ok(!first.spatial.flat().includes(b));
assert.deepEqual([first.rng.state, second.rng.state], rng);
console.log('Spatial index PASS: frozen original parity, ordering, boundaries, stale/dead entries, reuse, early exit, callbacks and independent Simulation wrappers.');
