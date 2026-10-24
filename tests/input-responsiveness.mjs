import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {FrameStepper} from '../src/sim/frame-stepper.js';
import {MovementInputBuffer} from '../src/ui/movement-input-buffer.js';
import {createSimulationSnapshot, restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {CFG} from '../src/sim/config.js';

function findClearLand(sim) {
  for (let y = 10; y < CFG.worldSize - 10; y++) {
    for (let x = 10; x < CFG.worldSize - 10; x++) {
      let clear = true;
      for (let ox = -2; ox <= 5; ox++) {
        for (let oy = -2; oy <= 2; oy++) {
          const idx = sim.world.idx(x + ox, y + oy);
          if (sim.world.water[idx] || (sim.world.ice && sim.world.ice[idx])) {
            clear = false;
            break;
          }
        }
        if (!clear) break;
      }
      if (clear) return {x: x + 0.5, y: y + 0.5};
    }
  }
  throw new Error('No clear land found');
}

console.log('Testing Input Responsiveness & Movement Buffer Pipeline...');

// 1. Normal 100ms Key Tap produces displacement (0 misses)
{
  const sim = new Simulation('INPUT-TEST-1', {player: true});
  const spot = findClearLand(sim);
  const p = sim.player();
  p.x = spot.x;
  p.y = spot.y;
  p.energy = 100;
  p.hydration = 100;
  p.health = 100;

  const buffer = new MovementInputBuffer({controlHz: 64});
  let virtualNow = 1000;
  const stepper = new FrameStepper({
    controlHz: 64,
    simHz: 8,
    clock: () => virtualNow
  });

  const startX = p.x;

  // Press KeyD at 1000ms
  buffer.onKeyDown('KeyD', virtualNow);

  // Advance 3 frames (~50ms)
  for (let f = 0; f < 3; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  // Release KeyD at 1100ms (100ms total press duration)
  virtualNow = 1100;
  buffer.onKeyUp('KeyD', virtualNow);

  // Advance remaining frames to let buffered steps finish (~150ms more)
  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  const displacement = p.x - startX;
  assert.ok(
    displacement > 0.05,
    `100ms tap must produce significant displacement, got ${displacement}`
  );

  // Advance another 10 frames without any keys: displacement should stop growing
  const settledX = p.x;
  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }
  assert.equal(p.x, settledX, 'Player stops cleanly after buffered steps are consumed; no overrun');
  console.log(`  100ms tap: displacement = ${displacement.toFixed(4)} (PASS)`);
}

// 2. Normal 350ms Key Tap produces proportionally larger displacement
{
  const sim = new Simulation('INPUT-TEST-2', {player: true});
  const spot = findClearLand(sim);
  const p = sim.player();
  p.x = spot.x;
  p.y = spot.y;
  p.energy = 100;
  p.hydration = 100;
  p.health = 100;

  const buffer = new MovementInputBuffer({controlHz: 64});
  let virtualNow = 2000;
  const stepper = new FrameStepper({
    controlHz: 64,
    simHz: 8,
    clock: () => virtualNow
  });

  const startX = p.x;

  // Press KeyD at 2000ms
  buffer.onKeyDown('KeyD', virtualNow);

  // Advance 21 frames (~350ms)
  for (let f = 0; f < 21; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  // Release KeyD at 2350ms
  virtualNow = 2350;
  buffer.onKeyUp('KeyD', virtualNow);

  // Advance remaining frames
  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  const displacement = p.x - startX;
  assert.ok(
    displacement > 0.20,
    `350ms tap must produce proportional displacement, got ${displacement}`
  );
  console.log(`  350ms tap: displacement = ${displacement.toFixed(4)} (PASS)`);
}

// 3. 100ms tap during heavy / sliced tick processing is preserved
{
  const sim = new Simulation('INPUT-TEST-3', {player: true});
  const spot = findClearLand(sim);
  const p = sim.player();
  p.x = spot.x;
  p.y = spot.y;
  p.energy = 100;
  p.hydration = 100;
  p.health = 100;

  const buffer = new MovementInputBuffer({controlHz: 64});
  let virtualNow = 3000;
  const stepper = new FrameStepper({
    controlHz: 64,
    simHz: 8,
    sliceMs: 1, // tight slice
    clock: () => virtualNow
  });

  const startX = p.x;

  // Key down and key up happen during a heavy frame where a tick was initiated
  buffer.onKeyDown('KeyD', virtualNow);
  virtualNow += 100;
  buffer.onKeyUp('KeyD', virtualNow);

  // Now frame stepper runs several frames to catch up
  for (let f = 0; f < 15; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)},
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  const displacement = p.x - startX;
  assert.ok(
    displacement > 0.05,
    `100ms tap during sliced tick must not be lost, got ${displacement}`
  );
  console.log(`  100ms tap during sliced tick: displacement = ${displacement.toFixed(4)} (PASS)`);
}

// 4. Direction Reversal: Left tap followed immediately by Right tap
{
  const sim = new Simulation('INPUT-TEST-4', {player: true});
  const spot = findClearLand(sim);
  const p = sim.player();
  p.x = spot.x;
  p.y = spot.y;
  p.energy = 100;
  p.hydration = 100;
  p.health = 100;

  const buffer = new MovementInputBuffer({controlHz: 64});
  let virtualNow = 4000;
  const stepper = new FrameStepper({
    controlHz: 64,
    simHz: 8,
    clock: () => virtualNow
  });

  const startX = p.x;

  // Move left 100ms
  buffer.onKeyDown('KeyA', virtualNow);
  virtualNow += 100;
  buffer.onKeyUp('KeyA', virtualNow);

  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  const leftX = p.x;
  assert.ok(leftX < startX, `Left tap must decrease x: ${leftX} < ${startX}`);

  // Now move right 100ms
  buffer.onKeyDown('KeyD', virtualNow);
  virtualNow += 100;
  buffer.onKeyUp('KeyD', virtualNow);

  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  const rightX = p.x;
  assert.ok(rightX > leftX, `Right tap after left tap must increase x: ${rightX} > ${leftX}`);
  console.log(`  Direction reversal: left=${(leftX - startX).toFixed(4)}, right=${(rightX - leftX).toFixed(4)} (PASS)`);
}

// 5. Modal / Pause Clear: Held keys do not leak across modal boundaries
{
  const sim = new Simulation('INPUT-TEST-5', {player: true});
  const spot = findClearLand(sim);
  const p = sim.player();
  p.x = spot.x;
  p.y = spot.y;
  p.energy = 100;
  p.hydration = 100;
  p.health = 100;

  const buffer = new MovementInputBuffer({controlHz: 64});
  let virtualNow = 5000;
  const stepper = new FrameStepper({
    controlHz: 64,
    simHz: 8,
    clock: () => virtualNow
  });

  // Key pressed down
  buffer.onKeyDown('KeyD', virtualNow);

  // Modal opens -> clear called
  buffer.clear();

  const startX = p.x;
  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => sim.playerControlStep(buffer.read(p, sim, true), hz),
      deadline => sim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => sim.continueTick(deadline)}
    );
  }

  assert.equal(p.x, startX, 'Player does not move when buffer is cleared on modal open');
  console.log('  Modal / pause clear safety: (PASS)');
}

// 6. Save / Continue Transition preserves responsiveness
{
  const sim = new Simulation('INPUT-TEST-6', {player: true});
  const spot = findClearLand(sim);
  const p = sim.player();
  p.x = spot.x;
  p.y = spot.y;
  p.energy = 100;
  p.hydration = 100;
  p.health = 100;

  // Save the simulation
  const snapshot = createSimulationSnapshot(sim, {reason: 'input-test'});
  const restoredSim = restoreSimulationSnapshot(snapshot);
  const restoredP = restoredSim.player();

  const buffer = new MovementInputBuffer({controlHz: 64});
  let virtualNow = 6000;
  const stepper = new FrameStepper({
    controlHz: 64,
    simHz: 8,
    clock: () => virtualNow
  });

  const startX = restoredP.x;

  buffer.onKeyDown('KeyD', virtualNow);
  virtualNow += 100;
  buffer.onKeyUp('KeyD', virtualNow);

  for (let f = 0; f < 10; f++) {
    virtualNow += 16.666;
    stepper.advance(
      0.016666,
      1,
      hz => restoredSim.playerControlStep(buffer.read(restoredP, restoredSim, true), hz),
      deadline => restoredSim.beginTick(null, {externalPlayerControl: true}, deadline),
      {resume: deadline => restoredSim.continueTick(deadline)}
    );
  }

  const displacement = restoredP.x - startX;
  assert.ok(
    displacement > 0.05,
    `Post-restore 100ms tap must produce displacement, got ${displacement}`
  );
  console.log(`  Save / Continue transition tap: displacement = ${displacement.toFixed(4)} (PASS)`);
}

console.log('Input Responsiveness integration suite: ALL TESTS PASSED (0 misses)');
