# Next engineering development pass

Starting checkpoint: `efe6aad77301463115b407146e6e8af47a764fdc`, with exact-head [CI success](https://github.com/jacktheclown91/GenVo/actions/runs/40365902457). The existing release ZIP remains SHA256 `37832ff5b16b668c7cc8bb9a439b94555c458859c4b5d085baf8d70c068a310d`; the published itch submission is preserved.

This is the current pass record, not a claim that the full Living Planet is complete. Follow the creator's stage order and retain separate implementation, automated, browser and creator evidence.

## A. Spatial index

Implemented: `src/sim/spatial-index.js` borrows the actual Simulation's existing bucket arrays and geometry. Public `rebuildSpatial` and `forEachNearby` remain wrappers. No global index, new saved state, tree, radius filter or biological owner is introduced. All other Simulation bytes, including bucket construction, remain unchanged from the starting checkpoint.

The frozen two-method oracle in `tests/fixtures/spatial-index-original.mjs` comes from that original Git blob. Focused comparison covers ordinary and empty searches; boundaries and negative/outside coordinates; dead and stale entries; exact ordered object references; strict-false early exit; callback exceptions and mutation; repeated array reuse; and independent real Simulation instances. Both Node 22 and 24 pass. Existing complete snapshot/restore goldens pass unchanged on both engines. Perception, architecture, canonical source audit and public export pass.

The full gate now contains 117 checks: all 116 original checks plus the spatial contract. The partition contract is updated consistently. The complete local 117-check gate passed. Exact-head remote acceptance is pending; no frozen expectations were regenerated.

## Remaining stages

- **B — Nursing:** repair the explicitly funded positive fixture; retain milk anatomy and resource authorities, add distinct physiological/eligibility refusal cases, and prove actual transfer/costs. No implementation change yet.
- **C — Configuration:** test independent, alternating, saved/restored and background execution for modern and historical clocks. An initial actual-simulation probe demonstrates a resume defect: a modern tick paused before a legacy-world update advances day at tick 48 instead of tick 240. Isolated modern execution correctly remains on day 1. The RNG state is equal in this minimal case. This is a diagnosis, not yet a corrected or broadly isolated configuration architecture.
- **D — Performance:** profile genuine day-30/day-100 checkpoints and multi-region work, including biology, transfers, saves, browser frame/long-task behavior, retained memory and backlog. Measure and implement at least one proven redundant-work bottleneck; preserve equations, ordering, RNG and exact continuation. Not yet performed in this pass.
- **E — Natural evolution:** run multigenerational natural experiments and observe actual mating, conceptions, births, juvenile survival, genetic/anatomical variation, geography, branching/gene flow, specialization, extinction and recognized species. No spawned special animals, edited reserves, teleportation, forced mutations or species quota. Prior controlled courtship and short field trials do not satisfy this stage.

After each completed stage, commit coherent work, update the handoff/backlog and verify exact-commit CI. After coherent gameplay changes, create a separately named release candidate and verify its extracted game; preserve the existing ZIP and do not upload to itch automatically. Final completion additionally requires current save compatibility, an actionable GitHub handoff and identified next safe extraction boundaries.
