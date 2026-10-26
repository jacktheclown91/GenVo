# Next engineering development pass

Starting checkpoint: `efe6aad77301463115b407146e6e8af47a764fdc`, with exact-head [CI success](https://github.com/jacktheclown91/GenVo/actions/runs/40365902457). The existing release ZIP remains SHA256 `37832ff5b16b668c7cc8bb9a439b94555c458859c4b5d085baf8d70c068a310d`; the published itch submission is preserved.

This is the current pass record, not a claim that the full Living Planet is complete. Follow the creator's stage order and retain separate implementation, automated, browser and creator evidence.

## A. Spatial index

Implemented: `src/sim/spatial-index.js` borrows the actual Simulation's existing bucket arrays and geometry. Public `rebuildSpatial` and `forEachNearby` remain wrappers. No global index, new saved state, tree, radius filter or biological owner is introduced. All other Simulation bytes, including bucket construction, remain unchanged from the starting checkpoint.

The frozen two-method oracle in `tests/fixtures/spatial-index-original.mjs` comes from that original Git blob. Focused comparison covers ordinary and empty searches; boundaries and negative/outside coordinates; dead and stale entries; exact ordered object references; strict-false early exit; callback exceptions and mutation; repeated array reuse; and independent real Simulation instances. Both Node 22 and 24 pass. Existing complete snapshot/restore goldens pass unchanged on both engines. Perception, architecture, canonical source audit and public export pass.

The full gate now contains 117 checks: all 116 original checks plus the spatial contract. The partition contract is updated consistently. The complete local 117-check gate passed. Exact-head [CI passed](https://github.com/jacktheclown91/GenVo/actions/runs/40378519553) for source checkpoint `f12b8cc111ae126655294954862696f5b2ecd48d`; no frozen expectations were regenerated.

## B. Funded nursing coverage

The original positive `care-expression` fixture now obtains maternal water through ordinary `playerDrink()` actions at the existing accessible water. It never assigns new maternal reserves or changes milk biology. Its controlled presentation clock then expires the drinking pose, following the existing unit-fixture expiry convention; this is explicitly not natural elapsed-world observation. The legitimate family `tend` operation transfers 2 milk-energy units, pays 2.92 maternal food energy and 0.74 maternal water, and transfers the corresponding child reserves. Assertions verify actual field changes, conversion loss and the recorded amount.

The original post-birth zero-water state still refuses milk. Eight separate controlled variants cover zero water, protected water/energy reserve floors, the wrong lactation bond, weaning, egg offspring, absent mammary anatomy and a dead caregiver. Refusal preserves both parties' reserves and feeding records. Existing snapshot/paint parity, expiry, separation, ownership, combat precedence, real egg/hatching and 256 native care-pose checks remain. Node 22/24 care contracts and the existing mammalian-care contract pass; no `src/` bytes changed from Stage A.

The repaired care contract is now included in the full gate, bringing it to 118 checks with matching partition coverage. Exact-head complete [118-check CI passed](https://github.com/jacktheclown91/GenVo/actions/runs/40380946318) for nursing checkpoint `01458fe9ddb82e27dd91615b56cd7e5c0b11eb9b`.

## C. Interleaved simulation clock protection

Tests preceded source changes. Original controls were captured from untouched `01458fe9` on Node 22 and 24, with the complete runtime fingerprint locked in the capture command. Corrected source is refused as a recording input; the original fixture remains unchanged. Exact independent snapshots cover empty worlds through ticks 0/6/48/120/240 and populated AUTO worlds through 0/6/48.

Two defects were demonstrated and corrected inside the existing authorities:

| Controlled case | Original isolated behavior | Broken interleaving | Corrected behavior |
| --- | --- | --- | --- |
| Legacy tick 48, resume or save flush | Day 2 | Day 1 | Day 2 |
| Modern tick 48, resume or save flush | Day 1 | Day 2 | Day 1 |
| Legacy archive, 49-tick budget while modern policy is current | Reject beyond 48 | Accepted | Rejected |
| Modern archive, 240-tick budget while legacy policy is current | Permit its recorded day | Rejected | Permitted |

`clockScopedSteps` activates the actual Simulation's recorded policy before each iterator next/return/throw. Public `updateSteps` remains a generator and delegates the byte-identical ordered tick body. No phase, yield, equation, RNG operation, policy version or saved field is added to that body. Background budget validation now uses `dayTicksFor` on the archived core, rather than an unrelated world's global view. Actual background replay still uses the existing canonical kernel and publication/identity/conservation checks.

Node 22/24 regressions pass: independent/alternating updates, save and restore under the other clock, resumed continuation, every-yield slicing, direct iterators, pending-save flushing, real archived-region budgets and complete foreground/background state parity. Real FrameStepper admission exercises 384 paid-movement control steps and 48 ecology ticks per policy, matching isolated complete state. Iterator input/error/cancellation cleanup is covered. Existing original modernization goldens, day-clock daily physiology, sliced ticks, E18 conserved biology, architecture, source audit and public export pass. The full gate now has 119 checks; new exact-head CI acceptance remains pending.

**Ownership limits:** CFG remains a shared compatibility view of the last activated world. Static sim/control rates and life stride remain intentionally shared. The old `OFFSCREEN_BIOLOGY.maxEntryTicks` inspection getter remains compatible, but runtime validation no longer treats it as the archive's authority. Ad hoc subsystem calls outside guarded execution may still depend on the active context; complete per-world ownership of every mutable configuration/registry is future work. This is the demonstrated-defect correction and tested execution interface, not a sweeping configuration conversion.

## Stage D measured implementation checkpoint

Clock stage C passed exact-head 119-check CI 40385691926 at 8723b98535c5e554235cb798a2788836f6780f5b. The mature-world redundant-hash candidate, original-oracle tests, native browser and regional diagnostics are detailed in [the measured report](MATURE-PERFORMANCE-2026-10-26.md) and its curated JSON. Repeated fixed-tick totals improve about 4-5% with exact complete state and RNG; browser responsiveness and regional costs do not consistently improve. Original/candidate active browser runs include actual births, native tutorial continuation and real IndexedDB saves. Both mature regional cases preserve complete state after two transfers and bounded replay. Node 22/24 botanical, identity, original-modernization, interleaved-clock and 121-check partition contracts pass; architecture, source audit, syntax and public export pass. Performance checkpoint 3503dd628c6e074344883fda0fa29b382a0bc68d passed all 121 checks in exact-head CI 40400067101. The first 320-day field subsequently found a stale selected-mate save mismatch after lineage extinction; see [the natural investigation](NATURAL-EVOLUTION-2026-10-26.md) for the targeted cleanup, new 122nd check and ongoing paired reruns. No budget, equation, saved policy, population rule or resource limit changed.

## Remaining stages

- **D — Performance:** profile genuine day-30/day-100 checkpoints and multi-region work, including biology, transfers, saves, browser frame/long-task behavior, retained memory and backlog. Measure and implement at least one proven redundant-work bottleneck; preserve equations, ordering, RNG and exact continuation. Complete at 3503dd62 with exact-head 121-check CI 40400067101 success.
- **E — Natural evolution:** run multigenerational natural experiments and observe actual mating, conceptions, births, juvenile survival, genetic/anatomical variation, geography, branching/gene flow, specialization, extinction and recognized species. No spawned special animals, edited reserves, teleportation, forced mutations or species quota. Prior controlled courtship and short field trials do not satisfy this stage.

After each completed stage, commit coherent work, update the handoff/backlog and verify exact-commit CI. After coherent gameplay changes, create a separately named release candidate and verify its extracted game; preserve the existing ZIP and do not upload to itch automatically. Final completion additionally requires current save compatibility, an actionable GitHub handoff and identified next safe extraction boundaries.
