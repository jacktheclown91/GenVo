# Phase 3D — triage of the 27 drifted suites (October 15, 2026)

**Status: code complete; verification run below. Not creator accepted. Uncommitted.**

All 27 suites failed identically on `HEAD` d2f676c. The repo's git history starts at that first published commit, so I classified each from the published design docs, the README changelog and the code itself.

| Outcome | Suites |
| --- | --- |
| Stale test expectation or fixture, test fixed | 19 |
| Genuine source defect, source fixed (and its tests then pass) | 3 defects, unblocking 5 suites |
| Rule disagreement or outcome-dependent test, **left unchanged** for you | 3 |

Every fix keeps the suite's intent, and no assertion was simply deleted. Four welcome-screen checks were removed because the screen they tested no longer exists by design; the reasons are below. Ledger: `tests/known-failures.json` drops from 40 to 16 entries.

## Genuine source defects fixed

| Defect | Fix | Proof |
| --- | --- | --- |
| **Wild animals recorded the player's forage-patch memory.** The autonomous freshwater-meal branch of `Simulation.resolveInteraction` called `foraging.rememberPatch` for every animal. The plant and carrion branches don't. Wild rillsifters accumulated patch memory and cognition records, plus a competition scan of all animals per meal. The memory is only ever read for the player and lineage. | `src/sim/simulation.js`: the call is now guarded with `a.player\|\|a.lineage`. | Against an untouched copy, 160 world-days (2 headless, 2 live-player worlds) gave **0 divergences** in RNG, animals or stats. Fixes `forage-patches` and `forage-season-competition`. |
| **Stealth feeding could target food the animal can't eat.** `specialization.foodCandidateAt` valued plants by raw stock × diet preference, while the canonical `Simulation.bestFood` uses actual edible yield (`cropYield`: tissue, handling cost, affordability). A hungry camouflaged descendant could commit to a plant that yields nothing, beside a Stalker. | `src/lineage/specialization.js`: a tissue-bearing plant with zero canonical edible yield is not a candidate. | Behaviour changes only where the old target could never feed the animal. Fixes `lineage-strategy` (with its contextual-E fixture fix). |
| **Same-taxon-before-gene-flow mate policy was lost.** `docs/HERITABLE_MATE_CHOICE.md` says this policy "still appl[ies]" under heritable mate choice, and the README documents it. The ranking (`compareMateOptions`) had no taxon term, so a closer cross-taxon mate won. | `src/sim/simulation.js` (`autonomousMateTarget`) and `src/reproduction/reproduction.js` (`eligibleMates`): same-taxon candidates first, then the existing inherited-preference ranking within each group. Gene flow is still possible when no same-taxon partner is available. | Identical in single-taxon worlds (the tier is always equal). `heritable-mate-choice`, `multi-partner-sexual-selection` and `reproduction` still pass. Fixes `species-coexistence` and `species-leadership`. |

## Stale tests fixed

| Suite | Cause (evidence) | Fix |
| --- | --- | --- |
| `core` | Pinned `CFG.version` 1.63.0; the current version is 1.65.0. The rest passed. | Expect 1.65.0 |
| `community-ui-feedback`, `context-guidance` | Banned `border-radius` and `linear-gradient` in the whole of `styles.css`. Every occurrence sits after the `/* GenVo v1.65` title-menu marker, which `ui-art-direction.mjs` already exempts on purpose. | Apply the same split |
| `lineage-purpose` | Four checks looked for welcome text that the v1.65 redesign removed on purpose (`docs/GenVo-Menu-Redesign-v1.65.0.md`). The other 15 checks pass; Help still covers control scope and post-G8 continuation. | Removed the 4 welcome checks, with a note |
| `handoff-transition`, `water-teaching`, `immunity-awareness`, `stalker-den-reading`, `strategy-encounters`, `special-creatures` (also `lineage-strategy`) | Untargeted E now offers a choice when several actions apply (the published contextual-interaction design). | `tests/helpers/interaction.js`: assert the intended action (`drink`, `illness-care`, `den-inspect`, `collect-relic`, `eat:<kind>:<cell>`) is offered, then choose it |
| `handoff-transition` | Also wrote raw bramble stock with no seed or tissue reserves, so its edible yield was 0. | Picks a cell with naturally grown food the heir can eat (no invented food) |
| `special-creatures` | Also expected "Ghost GenVo8"; renamed "Ghost GenVo" with the Oct 12 title rename. | Expect the new label |
| `player-presence` | Expected the old ground ellipse; the published anchor is a dark-backed segmented gold ring. Its other checks pass. | Check the current ring |
| `observer-readability` | The tutorial now sets an accessibility `role`; the hand-made mock had no `setAttribute`. | Mock gains `setAttribute` |
| `food-web-feedback` | Expected a "Hunter" lifestyle label alone to make a predator. Since v1.63 the mounted mouth decides (creator-directed correction). | The hunter lineage evolves a tearing jaw through `applyLineageTarget`, as in `gameplay-pressure` |
| `food-commitment` | Set `bodyPlan:null` (pre-modular, refused on load), so the rootling had no mouth. | Keeps its own body |
| `strategy-arcs` | Placed the Stalker 4 tiles east; in the current world that is water, so it was unreachable. | Same distance, first bearing on the same land |
| `engineer-breeding-habitat`, `engineer-family-settlement` | Chose conception sites by `habitatQuality` food, not the real breeding gate (`tests/helpers/breeding-pair.js` rule: real supported habitat). | Site search also requires `breedingState(...).allowed` |
| `flank-placement` | Mirrored flank organs carry their pivot in the canvas transform (`args.x/y` become 0). The mock ignored `translate`. | The mock tracks translation; the organs do get distinct pivots |
| `creature-assembly` | The "detached" check was a 12-unit radius. The flagged pixel is the attached tip of a limb chain at full stride (12.5 units). | Real connectivity check (every pixel joins the body) within the 32×32 sprite cell. An injected floating pixel inside the old radius is caught. |

## Left for you (unchanged; still in the ledger)

1. **`wildlife-rhythm`: ambient vocabulary by anatomy.** v1.63 routes ambient behaviour by anatomy:
   - every hunting mouth gets the shoreline `bank-*` routine, so needlejaw behaves like bankjaw;
   - GenVo gets mosskip's `herd-*`;
   - `stalker()` and `genvo()` in `src/ecology/wildlife-rhythm.js`, and the renderer's `prowl` pose, are unreachable.

   *Proposal:* keep anatomy routing but split hunters by body. Swimming or amphibious hunters → `bank-*`; land hunters → the Stalker routine. Not implemented.
2. **`evolution-baseline`: recorded natural outcomes have drifted.**
   - The effects matrix matches exactly.
   - The fixed-seed natural AUTO outcomes differ: for example, EVO-A land speed was 2.17–2.29 and is now 1.97–2.00.
   - The test says to regenerate only deliberately (`node tools/evolution-baseline.mjs --write`) with a reason.

   Options: regenerate once you accept current ecology, or treat the natural runs as observation.
3. **`lineage-dispersal-resume`: asserts an outcome.**
   - It expects a dispersing creature to arrive.
   - Its mature relatives disperse to the same best destination, and the per-tick gate correctly cancels the crowded route.
   - Making the crowd juvenile didn't settle it either.

   It needs a redesigned scenario that tests the rule (no teleport, real movement, save/resume equivalence) without depending on arrival.

## Verification

`node tools/run-tests.mjs --all --jobs 4` gives **357 pass, 16 known-fail, 0 new failures, 0 timeouts, 0 stale ledger entries** of 373, in 900 s. Results: `docs/test-runs/all-phase3d-2026-10-15.json`. Before this triage it was 333 pass and 40 known-fail.

- `natural-world-soak` still passes with the three source fixes in place.
- The 16 remaining known failures:
  - aquatic breeding decision: 5;
  - release bookkeeping: 5;
  - `observer-play` performance budget;
  - `wild-evolution` finding;
  - `engineer-loss-return` test budget;
  - the 3 above.

### Files

| Group | Files |
| --- | --- |
| Source fixes | `src/sim/simulation.js` (patch-memory guard; same-taxon mate tier), `src/reproduction/reproduction.js` (same-taxon mate tier), `src/lineage/specialization.js` (edible-yield stealth candidates) |
| Tests | community-ui-feedback, context-guidance, core, creature-assembly, engineer-breeding-habitat, engineer-family-settlement, flank-placement, food-commitment, food-web-feedback, handoff-transition, immunity-awareness, lineage-purpose, lineage-strategy, observer-readability, player-presence, special-creatures, stalker-den-reading, strategy-arcs, strategy-encounters, water-teaching (`.mjs`) |
| Ledger | `tests/known-failures.json` |
