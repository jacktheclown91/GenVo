# Planetary background work admission

Scope: first responsiveness pass under the creator's remaining full-game direction. This is runtime scheduling, not a new saved biological policy.

## Problem and implementation

The browser previously independently requested idle work for destination generation, border terrain, storage residency and far-region biology. These operations could accumulate between the same two animation frames. A callback also retained the Simulation observed when scheduled, even if a menu, pause or world replacement intervened.

`src/sim/planetary-work-queue.js` is now the single browser admission authority for those four jobs. Repeated observations update a named waiting slot without moving it behind newer work. Each rendered-frame iteration admits at most one job. The next job waits for a later frame; asynchronous storage retains admission until its promise settles. Ready checks run when the callback executes. Paused/game-menu work waits, world replacement discards queued owners, and old callbacks cannot unlock a newer admission.

Destination preparation uses the same queue and has a cancellation epoch, so clearing it immediately admits requests from a new owner even when its old callback was already scheduled. SaveManager rechecks both active Simulation and slot after awaited saves and database opens, and before installing a loaded regional payload.

The queue does not modify RNG, stocks, organisms, population limits, region clocks or replay amounts. Existing biological staging, canonical near-region barriers, publication and storage transactions remain authoritative. Headless simulation retains its existing driver.

## Verification

- `tests/planetary-work-queue.mjs`: per-frame admission, fairness, pause recheck, asynchronous exclusion, stale-owner rejection, callback generation isolation, error recovery and actual SaveManager lifecycle guards at both asynchronous boundaries.
- `tests/planetary-preparation.mjs`: complete prepared/direct crossing parity and source-state/RNG neutrality, plus cancelled-callback/new-request isolation.
- The new queue suite is part of `tools/check-playable.mjs`.
- `tools/verify-regional-residency-browser.mjs` samples actual browser animation frames across held-key travel, indexed unload/reload and native Save/Continue. The harness now waits for destination scene readiness before each crossing returns, so evidence frames cannot knowingly capture the blank preparation scene.

The [complete playable gate](test-runs/planetary-work-playable-2026-10-21.log) passes all 74 checks; canonical audit and public-export parity pass. The [corrected exported-browser receipt](test-runs/planetary-work-browser-ready-2026-10-21.json) records at most one job between animation frames: 64 admissions across 309 outward frames and 7 across 130 return frames, with zero page errors. Actual post-readiness return and outward screenshots were inspected; earlier blank transition captures do not count as visual evidence. Earlier capture attempts remain independent receipts, not overwritten evidence.

## Limits and next work

One atomic ecology stride, terrain build or snapshot can still exceed the frame budget. This pass prevents independent job bunching; it does not establish lower worst-case frame time or sustainable distant throughput. Canonical near-region work and renderer scene preparation retain their existing pathways and costs. Long-distance backlog remains real and is neither dropped nor hidden.

The next capability dependencies remain measured subdivision of expensive canonical work, sustainable storage rotation/backlog service, continuous crossing and real neighbouring wildlife interaction. The active Simulation changes on crossing; the later regional-scene handoff retains the renderer and canvas (see REGIONAL-SCENE-2026-10-21.md). Wrapping, polar travel and unexplored-region wildlife colonization remain incomplete. Controlled browser proof does not establish an unassisted continental journey, long-run ecology or creator acceptance.

## Prepared destination rule isolation

Destination identity includes the recorded marine-food policy alongside seed, projection, origin, mass, cave, ice, mate and physical-frontier rules. Historical and modern worlds cannot consume the same scaffold: assigning rules after generation would not repair stocks generated under another policy. Queued preparation rechecks its captured identity before generation; a changed source is discarded and its promise resolves false, allowing a current request.

The preparation regression first reproduced the incompatible-policy cache collision. It now checks distinct cache requests, mismatch rejection without source mutation, complete prepared/direct historical-policy crossing parity, and stale-policy cancellation followed by successful current-policy preparation. This is automated evidence only; the physical collision-margin gap and neighbouring wildlife interactions remain open.
