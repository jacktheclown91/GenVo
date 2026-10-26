import assert from 'node:assert/strict';
import {snapshotSignature as signature} from '../tools/snapshot-signature.mjs';

const integer = {value: 1}, doubleStorage = {value: 1.5}; doubleStorage.value = 1;
assert.deepEqual(integer, doubleStorage);
assert.equal(signature(integer), signature(doubleStorage), 'Internal numeric storage is not snapshot data');
assert.equal(signature({text: 'x'.repeat(65536) + '\u{1f331}', values: [-0, undefined, NaN, Infinity]}), 'cc06cc84b4ef020ce3ff839214731c4380ed546f7cd51626186bb2976313c560', 'Chunk batching preserves the original token stream and multibyte text');
const a = {value: 1}; a.self = a;
const b = {value: 1}; b.self = b;
assert.equal(signature(a), signature(b), 'Cycles are deterministic');
const shared = {};
for (const [left, right] of [
  [0, -0], [NaN, null], [Infinity, -Infinity], [{}, {missing: undefined}],
  [{a: shared, b: shared}, {a: {}, b: {}}], [[,], [undefined]],
  [new Map([['a', 1], ['b', 2]]), new Map([['b', 2], ['a', 1]])],
  [new Set([1, 2]), new Set([2, 1])], [new Uint8Array([1]), new Float32Array([1])],
  [{a: 1, b: 2}, {b: 2, a: 1}], [Object.create(null), {}], ['\ud800', '\ud801']
]) assert.notEqual(signature(left), signature(right), 'Different persistent data/order/aliases must remain distinguishable');
const backing = new Uint8Array([9, 1, 2, 9]);
assert.equal(signature(backing.subarray(1, 3)), signature(new Uint8Array([1, 2])), 'Typed view contract covers visible data, not unrelated padding');
assert.throws(() => signature({fn() {}}), /Unsupported/);
assert.throws(() => signature(new WeakMap()), /Unsupported/);
console.log('Snapshot signature PASS: exact values/order/references, cycles, typed data, undefined, signed zero and storage-independent scalar encoding.');
