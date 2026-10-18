# Phase 3 — reliability triage and runtime performance (October 15, 2026)

**Status: code complete; build verified in source and in the packaged web export. Not creator accepted. Uncommitted.**

## Approved decisions applied

| Decision | Implementation |
| --- | --- |
| 1.5× stride as the review candidate, 1× kept | Open the game with `?strideReview=1.5` (`src/main.js`; allowed values 1 / 1.5 / 2). Without the parameter the shipped 1× applies. Not finalized. |
| Causal soil test, natural outcomes separate | New `tests/soil-disturbance-establishment.mjs` (0.4 s), described below. `autonomous-soil-engineering.mjs` now **reports** natural biomass as an OBSERVATION (both seeds: difference 0.0000) and its worker budget is 240 s. The full run takes about 8 min, so it belongs in a long-observation tier. |
| No artificial seed supply | Asserted: disturbed soil without seed establishes nothing; seed-limited establishment never exceeds the seed present; seed taken = established + litter (Float32 precision). |
| Recordings outside Git | `tools/archive-review-artifacts.mjs` moved 36 recordings (61 MB) to `../genvo-review-artifacts/2026-10-15/` with SHA-256 verification. The manifest is `docs/review-artifacts-2026-10-15.json`. `.gitignore` excludes future capture videos in those folders. |

The new soil test uses two identical worlds that differ only in a canonical dig record at one cell, and real seeds deposited through `dispersal.deposit`. With ample seed, disturbed soil establishes 18% more (0.0645 vs 0.0546).

## Phase 3A — test triage

### Fixed (19 suites now pass; final sweep confirms)

| Suites | Cause | Correction |
| --- | --- | --- |
| `anatomy-readings`, `anatomy-thresholds`, `founder-body`, `habits`, `pressure-vocabulary`, `succession-selection` | Expected refusal text `/earlier GenVo8/`. Since the first published commit the refusal says "predates GenVo's modular creature bodies". | Expected text updated; the refusal behaviour is still asserted |
| `evolution-editor` | Fixture deleted body plans, a state that can no longer exist (pre-modular saves are refused). Body-less creatures find no breeding resource. | Canonical `bodyPlanFromLegacy` conversion, rebuilt where the block changes adaptations |
| `drink-goal`, `freshwater-access`, `discovery`, `onboarding`, `knowledge` | Assumed untargeted E performs one action. Contextual interaction returns `interaction-choice` when several are available (published design). | `tests/helpers/interaction.js`: assert the action is offered, then choose it through the same `executeInteraction` path |
| `gameplay-pressure` | Founder grazing mouth has prey preference 0 (diet follows anatomy), and the pursuit system chases a Stalker seen beyond trigger range | The hunter evolves a tearing jaw through `applyLineageTarget` for the hunt block only. The Stalker check accepts the pursuit system's stalk/chase intents with a stalk-phase hunt on the player. |
| `decisions-under-pressure` | Asserted the player dies; pursuit stamina now makes the Stalker give up ("outrun") | Asserts the rule instead: E never wounds the Stalker, the player takes real hits, the Stalker is not driven off |
| `family-recruitment-observer`, `family-observer-resume` | Seed `GENVO8-TEST-A` now has 0 lineage births (reciprocal mate choice declined all 6 attempts); hardcoded `lineageBirths===4` and a stale 132 starting population | Default seed `GENVO8-8FOLD`; real starting population; a births>0 coverage guard. Snapshot equality remains the determinism check. |
| `multi-partner-sexual-selection` | The "small" candidate stood on a cell with no breeding resource, so one assertion passed for the wrong reason | Fixture requires both candidates to be breeding-eligible |
| `public-export` | Expected the draft compiler to be absent from the export, but the exporter deliberately ships the Creature Lab with its dependencies | Asserts it is never reachable from the game entry and ships only as a Lab dependency |
| `animation` | Stale source pattern (`nearLegs.push`); a renderer mock lacked `sim` | Current layer pattern and a minimal mock. Its creator-reviewed stride-order contract now holds. |

### Genuine source defects fixed

1. **Duplicate interaction choices** (`src/gameplay/interaction-command.js`). A meal reachable both as a forage target and through its water cell was listed twice, so the player saw duplicate buttons. Choices are now de-duplicated by action id. (In the drink-goal world: 7 → 6 choices.)
2. ~~Mate targeting could pick a mate the chooser itself declines~~ — **retracted and reverted.** I changed `autonomousMateTarget` to skip self-declined mates. The final sweep showed `heritable-mate-choice` asserting the opposite on purpose: "a disliked partner remains explorable instead of being permanently excluded". The original behaviour is the established design, so the change is fully reverted and `simulation.js` matches HEAD there. Both suites pass with the fixture correction alone.

### Genuine defect found — needs creator decision (not changed)

**Rillsifter, mirelick and podshell can never reproduce.** Their accessible forage never reaches their breeding minimum anywhere in the world:

| Species | Needed (`minForage`) | Best cell | Median cell |
| --- | --- | --- | --- |
| Rillsifter | 4 | 2.93 | 1.39 |
| Mirelick | 5 | 3.06 | 2.17 |
| Podshell | 5 | 4.10 | 3.47 |
| Mosskip (comparison) | 5.4 | 8.29 | — |

Over 3 natural years they had 0 births, and bankjaw had 0 births too. The design doc says these species use the mating and lifecycle systems. This blocks `birth-hydration`, `birth-reserves`, `conception-parental-inheritance` and `gestation-inheritance`, which loop over every species. Recalibrating breeding thresholds is a biological rule change, so **creator decision needed**.

### Rule disagreement — needs creator decision

`developmental-hunt`: a newborn Stalker (mass 0.349) against an adult rootling (0.737) has a ratio of 2.11. That exceeds the canonical 2.1 prey-size cap, so the young hunter may not attempt the bite, while the test expects a weak attempt. Which rule wins is a design choice.

### Remaining baseline failures (not yet investigated in depth)

`context-guidance`, `creature-assembly` (detached part pixel), `flank-placement`, `player-presence`, `special-creatures`, `species-leadership`, `strategy-encounters`, `wildlife-rhythm`, `engineer-breeding-habitat`, `engineer-family-settlement`, `engineer-loss-return`, `food-commitment`, `lineage-dispersal-resume`. Plus the timeouts `probe-kills` and `wild-evolution`, and `autonomous-soil-engineering` as a long observation (about 8 min).

## Phase 3B — fullscreen stalls

**Root cause was not terrain.** Profiled in real Chromium at 1440×900 (rAF frame log, wrapped renderer and simulation methods, a Chrome trace, a CPU profile and per-call-site canvas counts) during a 20–40 s walking loop on seed `STALL-PROFILE`:

- The worst stalls were **major GC: 160–260 ms in `GC_HEAP_EMBEDDER_TRACING_EPILOGUE`**, Blink finalizing discarded canvases.
- The game created **2,857 canvases per second**:
  - `indexed-part-renderer.js` `tinted()`: 41k in 20 s. A 64-frame LRU per part, keyed by each creature's own pigment, thrashed and allocated a fresh canvas per miss.
  - `genvo-draw.js` `keepSprite()`: 12.9k in 20 s. It made a per-entry canvas, converted it to an ImageBitmap, then discarded the canvas.
- A JavaScript hotspot: `family/sustainability.js` `competitorsIn` re-scanned all animals for relatives inside a loop over all animals (N × N × plants per cell).

Fixes, all output-identical:

| Fix | Proof |
| --- | --- |
| Tint cache recycles the evicted entry's canvas and context | `tools/check-tint-recycling.cjs`: 3,840 pigmented draws (160 palettes) created only 196 canvases; redraws through recycled canvases had **0 differing bytes** of 884,736 |
| Sprite cache snapshots the scratch canvas straight to an ImageBitmap, with no intermediate canvas | Same pixels (the bitmap of the same canvas). An entry becomes drawable once the bitmap resolves; until then the sprite renders normally. |
| `competitorsIn` computes the family diet profile once and checks bounds first | Against the untouched HEAD controller: 1,024 cells across 4 world states, **0 mismatches**, 68× faster (754 → 11 ms) |

Same scenario before and after (`docs/frame-stalls/`):

| Metric (1440×900, 40 s walk) | Before | After |
| --- | --- | --- |
| Canvases created per second | 2,857 | 176 |
| Worst major GC | 260 ms | 10–73 ms |
| Long main-thread tasks over 50 ms (20 s trace) | 101 | 18 |
| Frames rendered | 943 | 1,784 |
| Median / p95 / p99 frame | 33 / 67 / 233 ms | **17 / 33 / 50 ms** |
| Worst frame | 650 ms | 267 ms |
| Frames over 100 ms | 21 | 9 |

Terrain identity, world generation and simulation are untouched.

**Remaining:** about 9 frames over 100 ms per 40 s, made of JavaScript outside the renderer (likely HUD/DOM rebuilds; `livingCounts` is about 15 ms/s); terrain tile caches (about 150 canvases/s); and headless Chromium software rasterization, which may differ on a real GPU.

## Build verification

- `node tools/export-public.mjs <outside dir>` gives 545 files, 210 source modules, 17 MB. `tests/public-export.mjs` confirms every reachable module matches the source byte for byte.
- The packaged build runs in Chromium at 800×600: 0 errors; every reaction kind fires; 47–60 fps with p95 frame 16.7 ms (`GENVO_ROOT=<export> node tools/capture-integrated-gameplay.cjs 800x600 20 norecord`).

## Final sweep

202 suites: **18 assertion failures plus 1 long observation** (`autonomous-soil-engineering`, which passes but needs about 8 min against the sweep's 240 s cap). The documented baseline before Phase 2 was 40 failures, and before this phase 38. Every remaining failure is on the baseline list. `probe-kills` and `wild-evolution` remain known timeouts.

One regression appeared mid-phase (`heritable-mate-choice`, from my mate-targeting change). It was caught by the sweep and fixed by reverting that change.

## Creator decisions needed

1. Aquatic and marsh breeding calibration (rillsifter, mirelick, podshell; and bankjaw's zero births).
2. Newborn prey-size cap vs the developmental-hunt contract.
3. Gait stride: view with `?strideReview=1.5`.
4. A long-observation tier for suites over 240 s (`autonomous-soil-engineering`, `probe-kills`, `wild-evolution`).
