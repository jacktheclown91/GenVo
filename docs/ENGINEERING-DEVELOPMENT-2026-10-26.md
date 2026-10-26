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

The repaired care contract is now included in the full gate, bringing it to 118 checks with matching partition coverage. Exact-head complete CI acceptance is pending for this new test/tooling checkpoint.

## Remaining stages

- **C — Configuration:** test independent, alternating, saved/restored and background execution for modern and historical clocks. An initial actual-simulation probe demonstrates a resume defect: a modern tick paused before a legacy-world update advances day at tick 48 instead of tick 240. Isolated modern execution correctly remains on day 1. The RNG state is equal in this minimal case. This is a diagnosis, not yet a corrected or broadly isolated configuration architecture.
- **D — Performance:** profile genuine day-30/day-100 checkpoints and multi-region work, including biology, transfers, saves, browser frame/long-task behavior, retained memory and backlog. Measure and implement at least one proven redundant-work bottleneck; preserve equations, ordering, RNG and exact continuation. Not yet performed in this pass.
- **E — Natural evolution:** run multigenerational natural experiments and observe actual mating, conceptions, births, juvenile survival, genetic/anatomical variation, geography, branching/gene flow, specialization, extinction and recognized species. No spawned special animals, edited reserves, teleportation, forced mutations or species quota. Prior controlled courtship and short field trials do not satisfy this stage.

After each completed stage, commit coherent work, update the handoff/backlog and verify exact-commit CI. After coherent gameplay changes, create a separately named release candidate and verify its extracted game; preserve the existing ZIP and do not upload to itch automatically. Final completion additionally requires current save compatibility, an actionable GitHub handoff and identified next safe extraction boundaries.
