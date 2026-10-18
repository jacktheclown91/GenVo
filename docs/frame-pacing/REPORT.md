# Ordered frame pacing and visible processing lag

October 17, 2026. Completes the runtime pacing portion of the creator's computational-capacity requirement on the current map; it does not establish continental or mature-world scalability.

## Implementation

FrameStepper admits the existing bounded frame interval at observer speed and processes the same 64 Hz control steps and 8 Hz ecology cadence. After at least one atomic control step it yields when 12 ms of processing work is used. Remaining admitted simulation seconds stay queued for later frames; no pending biological tick is discarded or replaced by a larger time step. A single ecology tick is atomic and can exceed the budget. Rendering, UI and input get another opportunity between processing batches.

Pause admits no new time and preserves existing queued work and substep phase. World replacement resets runtime scheduling state. Save files continue to own completed biological history, not unprocessed wall time or observer speed. The existing 0.1-second wall-interval bound remains; queued time means admitted simulation time, not a promise to simulate hours spent in an inactive tab. Current input is sampled each frame, as before. Fixed inputs and the same number of processed steps remain deterministic; wall-clock scheduling is not a biological random source.

Player presentation extrapolation is capped at one control step so overload cannot visually project an organism far ahead of its actual position. Runtime processing load is stored in a WeakMap outside persistence and biology. When the queue exceeds 0.25 simulation seconds, a visible HUD message reports lag independently of actor warning thresholds. This does not change birth, inheritance, metabolism or ecological phase authorities.

## Verification

frame-stepper: a mock slow clock forces yields while three seconds of actual Simulation control/ecology work are drained. Full snapshots match direct execution exactly, including movement, resources, RNG, actors and history. The test checks retained step counts, pause, reset, accelerated time and bounded presentation. processing-capacity also passes after the integration.

Existing focused checks passed: world-swap-render, movement-parity, observer-play, world-pages, ecological-observation, player-motion-presentation, handoff-transition, playtest-clarity and validation-kinds. The observer fixture measured 369 ms of simulation work per real second for its 560-actor 4x scenario, within its unchanged check; this is a short fixture, not a mature ecosystem benchmark.

Headed Chromium, fresh 128 x 128 world, 181 actors, isolated empty context: baseline 2.506 seconds, 183 frames, p50 13.3 ms, p95 13.5 ms, maximum 80 ms; tick29 to49. This is a bounded initial runtime sample only. A first capture exposed a startup animation timestamp slightly preceding initialization; the interval now clamps to zero before the existing upper bound. An initial stress setting did not create overload and was not accepted as proof.

The final disclosed stress fixture forces 4x time, disables observer automatic danger slowdown only in the fixture, and uses a zero-ms budget (one atomic step per frame). It builds a 7.253-second queue while continuing tick50 to73. The visible message reports queued simulation time. Restoring the real 12-ms budget and normal observer behavior drains the queue during the two-second recovery sample; ticks advance through151 and the warning clears. Browser errors are empty. Both queued and recovered screenshots were inspected; the notice sits above the survival controls. Detailed traces and scope: runtime/evidence.json. The fixture is not an ecological outcome or a claim of natural population overload.

## Limits and next gates

An atomic expensive tick can still stall a frame. Memory is not unlimited. Work scheduling within a tick, mature ecosystem throughput, sparse persistent regions and measured distant ecology remain open. No world-size increase is authorized by these samples. The previous full fast gate predates the capacity/pacing changes; only the named focused checks certify these edits. No major 100-day run, commit, push or release was performed.
