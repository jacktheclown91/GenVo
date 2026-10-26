# Refactor backlog — executable GitHub tasks

All tasks start from live main, preserve unrelated work, and update the continuation handoff. Run the complete playable gate and canonical export/audit before integration. Do not regenerate deterministic expectations for a mechanical refactor.

## 1. Extract ordered controller composition (completed at 5bc4ea27; retain as acceptance record)

- Goal/files: move the contiguous `this.lineage = new LineageTracker(this)` through `this.wildlifeRhythm = new WildlifeRhythmController(this)` constructor segment from `src/sim/simulation.js` to `src/sim/controller-composition.js`.
- Reuse: existing controller classes; no replacement controllers, service locator, dynamic imports or new engine.
- Implementation: exported `initializeControllers(sim, {deferDispersalInitialization})`, explicit assignments in exactly original order. Keep world creation, clocks, bootstrap and policy fields in Simulation. Remove imports from Simulation only when no other methods use them. Preserve constructors that inspect earlier assigned controllers. Document borrowed Simulation ownership.
- Tests: focused composition test checks ordered keys and actual controller constructors, deferred dispersal, bootstrap false and normal bootstrap; frozen modernization baseline; sliced ticks; restore parity; save persistence; full playable, public-export, source audit and architecture check.
- Invariants: same instances/back-references, property insertion order, RNG, resources, save shape, deferred initialization, tick order. If SCC membership changes by inserting the composition module into the existing simulation SCC, review and record only that exact graph addition; no new cycle family.
- Acceptance: readable composition module, materially smaller constructor/import hub, identical pre-refactor signatures, all checks pass, main CI green. No browser visual acceptance claim needed for unchanged runtime behavior.

## 2. Isolate spatial bucket indexing (next; GitHub + Actions)

- Goal/files: extract `rebuildSpatial` and `forEachNearby` mechanics from Simulation into `src/sim/spatial-index.js`, retaining public method wrappers.
- Reuse: current bucket arrays, world size, bucket size and existing nearby consumers.
- Implementation: pure helpers accepting Simulation or explicit bucket geometry; preserve iteration order and callback early false return. Do not change query radius or replace with a different spatial tree.
- Tests: edge/negative coordinates, dead animals, bucket reuse, early exit and exact ordered query results against original loops; baseline, perception and full integration gates.
- Invariants: bucket/property identities, RNG untouched, stable neighbor order and callback semantics.
- Acceptance: original deterministic signatures unchanged; no hidden duplicate index or changed save fields; CI green.

## 3. Repair funded nursing fixture (GitHub + Actions)

- Goal/files: `tests/care-expression.mjs`; consult `docs/art/final-visual-integration-handoff/NURSING-PRECONDITION-DIAGNOSIS.md` and existing care/mammalian modules.
- Reuse: legitimate paid birth and canonical `family.tend`; retain actual resource transfer assertions.
- Implementation: explicitly establish a funded positive-care test precondition after birth using documented unit-fixture setup; add separate zero-water denial case. Do not alter milk costs or reserve thresholds.
- Tests: care-expression, mammalian care and birth-investment contracts, baseline, full playable.
- Invariants: zero-water mothers cannot fund milk; nursing debits conserved reserves; no biology changes to satisfy fixture.
- Acceptance: previously failing positive fixture passes for a valid reason and zero-water regression passes; explain setup versus natural observation.

## 4. Document and test interleaved day-clock policy (GitHub + Actions)

- Goal/files: `src/sim/day-clock.js`, config and a dedicated regression test; initially change tests/documentation only.
- Reuse: `applyDayClock`, `dayTicksFor`, versioned save policies and existing clock tests.
- Implementation: observe legacy/new-policy worlds interleaved at constructor/update/restore boundaries; record current global mutation and exact resulting state. Propose per-simulation ownership separately after coverage.
- Tests: day-clock, sliced ticks, baseline and restore parity.
- Invariants: no silent clock migration, new policy, changed global defaults or save format.
- Acceptance: reproducible current behavior documented, not a sweeping config rewrite.

## Later: renderer and save subsystem boundaries (local browser needed)

Choose one coherent painter or snapshot subsystem only after inspecting actual callers. Preserve historical migration branches, native pixel output, cache invalidation, complete snapshot reference semantics and public export parity. Require same-state extracted browser proof for visual/input changes and mature-world profiling for performance claims. Existing slow work must not be hidden by larger budgets. Deferred ground-art candidate requires its own full validation before any integration.
