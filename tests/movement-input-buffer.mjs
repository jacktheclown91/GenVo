import assert from 'node:assert/strict';
import {MovementInputBuffer} from '../src/ui/movement-input-buffer.js';

let now = 1000;
const clock = () => now;
const buffer = new MovementInputBuffer({ controlHz: 64, clock });

// Test 1: 100ms tap with delayed consumption (e.g. during a heavy sliced tick)
now = 1000;
buffer.onKeyDown('KeyD', now);
now = 1100; // 100ms later
buffer.onKeyUp('KeyD', now);

// At 64 Hz, 100ms is round(100 * 64 / 1000) = 6 steps
// Peek should show right is active without consuming
assert.equal(buffer.peek('right'), true);
assert.equal(buffer.read({}, false).right, true);

// Consume steps
let consumed = 0;
while (buffer.consume('right')) {
  consumed++;
}
assert.equal(consumed, 6, '100ms tap produces exactly 6 control steps');
assert.equal(buffer.consume('right'), false);
assert.equal(buffer.peek('right'), false);

// Test 2: Ultra-short tap (20ms) guarantees at least 1 step
now = 2000;
buffer.onKeyDown('KeyW', now);
now = 2020;
buffer.onKeyUp('KeyW', now);
assert.equal(buffer.consume('up'), true);
assert.equal(buffer.consume('up'), false, '20ms tap produces at least 1 step');

// Test 3: Normal gameplay continuous hold
now = 3000;
buffer.onKeyDown('KeyA', now);
for (let i = 0; i < 20; i++) {
  assert.equal(buffer.consume('left'), true);
}
now = 3312.5; // 20 steps * 15.625ms
buffer.onKeyUp('KeyA', now);
assert.equal(buffer.consume('left'), false, 'No overrun after consumed continuous hold');

// Test 4: Opposite direction reversal cancels prior buffer
now = 4000;
buffer.onKeyDown('KeyA', now);
now = 4100;
buffer.onKeyUp('KeyA', now);
assert.equal(buffer.peek('left'), true);

now = 4110;
buffer.onKeyDown('KeyD', now);
assert.equal(buffer.peek('left'), false, 'Opposite keydown immediately clears opposite buffer');
assert.equal(buffer.peek('right'), true);
now = 4210;
buffer.onKeyUp('KeyD', now);

consumed = 0;
while (buffer.consume('right')) consumed++;
assert.equal(consumed, 6);

// Test 5: Clear on modal/pause
now = 5000;
buffer.onKeyDown('KeyS', now);
buffer.clear();
assert.equal(buffer.peek('down'), false);
assert.equal(buffer.consume('down'), false);

console.log('MovementInputBuffer unit tests: PASS');
