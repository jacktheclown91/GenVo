# Refactor backlog — executable GitHub tasks

All tasks start from live main, preserve unrelated work, and update the continuation handoff. Run the complete playable gate and canonical export/audit before integration. Do not regenerate deterministic expectations for a mechanical refactor.

## Active autonomous-evolution boundaries

The new demographic observation helper is borrowed by `PopulationPressureMemoryController`; it is not a replacement evolution controller or completion of the later cleanup stage. Keep establishment evidence separate from player G3 achievements and species recognition. Complete recognition integration and regional continuity through existing authorities, then profile the major stalls before choosing the single bounded cleanup. Current implementation/evidence: [autonomous evolution](AUTONOMOUS-EVOLUTION-2026-10-26.md).

Current founding work shares the original pure learned-range geometry with territorial memory and keeps residence, candidate contact and regional census as helpers borrowed by population memory. This is scoped mechanism support, not the optional Stage F extraction. Frozen policy-1/2 complete-state fixtures protect historical semantics; do not regenerate them to fit a new grouping rule.

## 1. Extract ordered controller composition (completed at 5bc4ea27; retain as acceptance record)

- Goal/files: move the contiguous `this.lineage = new LineageTracker(this)` through `this.wildlifeRhythm = new WildlifeRhythmController(this)` constructor segment from `src/sim/simulation.js` to `src/sim/controller-composition.js`.
- Reuse: existing controller classes; no replacement controllers, service locator, dynamic imports or new engine.
- Implementation: exported `initializeControllers(sim, {deferDispersalInitialization})`, explicit assignments in exactly original order. Keep world creation, clocks, bootstrap and policy fields in Simulation. Remove imports from Simulation only when no other methods use them. Preserve constructors that inspect earlier assigned controllers. Document borrowed Simulation ownership.
- Tests: focused composition test checks ordered keys and actual controller constructors, deferred dispersal, bootstrap false and normal bootstrap; frozen modernization baseline; sliced ticks; restore parity; save persistence; full playable, public-export, source audit and architecture check.
- Invariants: same instances/back-references, property insertion order, RNG, resources, save shape, deferred initialization, tick order. If SCC membership changes by inserting the composition module into the existing simulation SCC, review and record only that exact graph addition; no new cycle family.
- Acceptance: readable composition module, materially smaller constructor/import hub, identical pre-refactor signatures, all checks pass, main CI green. No browser visual acceptance claim needed for unchanged runtime behavior.

## 2. Isolate spatial bucket indexing (completed at f12b8cc1; local gate and exact-head CI 40378519553 passed)

- Goal/files: extract `rebuildSpatial` and `forEachNearby` mechanics from Simulation into `src/sim/spatial-index.js`, retaining public method wrappers.
- Reuse: current bucket arrays, world size, bucket size and existing nearby consumers.
- Implementation: pure helpers accepting Simulation or explicit bucket geometry; preserve iteration order and callback early false return. Do not change query radius or replace with a different spatial tree.
- Tests: edge/negative coordinates, dead animals, bucket reuse, early exit and exact ordered query results against original loops; baseline, perception and full integration gates.
- Invariants: bucket/property identities, RNG untouched, stable neighbor order and callback semantics.
- Acceptance: original deterministic signatures unchanged; no hidden duplicate index or changed save fields; CI green.

## 3. Repair funded nursing fixture (completed at 01458fe9; 118-check CI 40380946318 passed)

- Goal/files: `tests/care-expression.mjs`; consult `docs/art/final-visual-integration-handoff/NURSING-PRECONDITION-DIAGNOSIS.md` and existing care/mammalian modules.
- Reuse: legitimate paid birth and canonical `family.tend`; retain actual resource transfer assertions.
- Implementation: explicitly establish a funded positive-care test precondition after birth using documented unit-fixture setup; add separate zero-water denial case. Do not alter milk costs or reserve thresholds.
- Tests: care-expression, mammalian care and birth-investment contracts, baseline, full playable.
- Invariants: zero-water mothers cannot fund milk; nursing debits conserved reserves; no biology changes to satisfy fixture.
- Acceptance: previously failing positive fixture passes for a valid reason and zero-water regression passes; explain setup versus natural observation.

## 4. Protect interleaved day-clock execution (completed at 8723b985; 119-check CI 40385691926 passed)

- Goal/files: `src/sim/day-clock.js`, config and a dedicated regression test; initially change tests/documentation only.
- Reuse: `applyDayClock`, `dayTicksFor`, versioned save policies and existing clock tests.
- Implementation: original-source Node 22/24 controls and failing public resume/save/background probes preceded correction. clockScopedSteps now guards each iterator operation, while regional budget validation reads the archived core policy. The original ordered biological body is unchanged. Full CFG conversion remains separate work.
- Tests: day-clock, sliced ticks, baseline and restore parity.
- Invariants: no silent clock migration, new policy, changed global defaults or save format.
- Acceptance: exact original isolated outcomes, real alternating/sliced/saved/restored worlds, actual FrameStepper movement and foreground/background parity pass. Exact-head 119-check CI 40385691926 passed; do not claim universal per-instance settings isolation.

## Later: renderer and save subsystem boundaries (local browser needed)

Choose one coherent painter or snapshot subsystem only after inspecting actual callers. Preserve historical migration branches, native pixel output, cache invalidation, complete snapshot reference semantics and public export parity. Require same-state extracted browser proof for visual/input changes and mature-world profiling for performance claims. Existing slow work must not be hidden by larger budgets. Deferred ground-art candidate requires its own full validation before any integration.

Specific next candidates, after the current D/E pass and release verification:

- `simulation.js`: habitat-centre selection and initial placement helpers (`pickHabitatCenter`, `spawnInitial`). First freeze constructor/world/animal insertion order and all RNG draws against original snapshots. Keep bootstrap policy and founder preparation under Simulation; do not combine this extraction with demographic changes.
- `renderer.js`: the coherent world-cache reset boundary. Inventory every affected cache, preparation promise and regional promotion caller before extracting a helper; same-world terrain refresh and full-world replacement have different obligations. Require identical same-state native frames and cache lifecycle tests.
- `main.js`: speed-button display and native speed command binding (`syncSpeedButton`, `changeSpeed`). Borrow the existing ObserverController and HUD callbacks; do not create another pacing owner or move biological work into UI handlers.
- `save-manager.js`: typed world snapshot adapters (`snapshotWorld`, `restoreTyped`, `restoreOwnedTyped`). Preserve alias/owned-buffer semantics, historical migrations and complete restore/continuation results. Keep transaction capture/publication ordering in SaveManager; adapter extraction is not a format migration.
- `tutorial.js`: opening briefing content and card rendering (`OPENING_BRIEFINGS`, `showBriefing`). Retain stage transitions, pause/input ownership and persisted tutorial policy in the controller; test new-world versus restored-world entry and native keyboard/mouse behavior.

## Natural field save correction (completed at 1cbd46e8; 122-check CI 40405119717 passed)

The first 320-day original-policy field exposed a stale selected mate after total controlled-lineage extinction and later death of that mate. `LineageTracker.handleActiveDeath` now calls the existing reproduction cleanup when there is no heir. The focused test failed on the old code and passes Node 22/24 with no RNG changes, both clocks, exact restore/continuation and historical living-target compatibility. Original modernization and interleaved-clock controls remain unchanged. All four paired 320-day worlds now pass strict snapshot/restored continuation and the runtime passed exact-head CI 40405119717. See NATURAL-EVOLUTION-2026-10-26.md. The earlier source-3503dd62 RC remains preserved. The new separately named source-1cbd46e8 RC passes full extraction/export parity, controls and both advanced-start Save/Continue checks.

## Current development sequence

The October 26 next-pass directive requires spatial extraction, funded nursing coverage, interleaved clock protection, actual mature-world profiling with an equivalent-behavior optimization, and natural multigenerational investigation in that order. See docs/ENGINEERING-DEVELOPMENT-2026-10-26.md for current evidence and missing acceptance. Complete and verify a Git checkpoint between major stages; do not stop after only the easiest extraction.
