# Phase 3C — breeding, weak attempts, test tiers, stalls, playtest build (October 15, 2026)

**Status: code complete; build verified (source and packaged export). Not creator accepted. Uncommitted.**
The defaults are unchanged: 1× stride and current breeding thresholds. Every numerical biology change below is a **proposal** that sits behind an off-by-default review switch.

## 1. Aquatic breeding (rillsifter, mirelick, podshell)

### Diagnosis

Measured across 3 seeds × 6 times, using the real `carrying.breedingState` gate:

| Species | `minForage` needed | Best accessible forage observed | Forage gate pass | Crowding OK | Energy OK |
| --- | --- | --- | --- | --- | --- |
| Rillsifter | 4 | 3.67 | 0% | 96% | 100% |
| Mirelick | 5 | 3.83 | 0% | 62% | 44% |
| Podshell | 5 | 4.96 | 0% | 58% | 56% |
| Mosskip (reference) | 5.4 | 9.81 | 100% | 63% | — |

All three species are well fed (mean energy 0.76–0.82). Their narrow diets give a lower standing-food density on the absolute forage scale that the broad-diet grazers were calibrated on. The requirement is therefore unreachable everywhere, rather than selective. No food or carrion was missing.

### Proposal (review switch, off by default)

`src/ecology/breeding-calibration.js`, enabled with `?breedingReview=1`:

| Species | `minForage` current → proposed | `optimalForage` current → proposed | Basis |
| --- | --- | --- | --- |
| Rillsifter | 4 → **2.9** | → **3.7** | Minimum at the species' own 75th percentile; optimum at the best observed value |
| Mirelick | 5 → **2.8** | → **3.8** | Same |
| Podshell | 5 → **4.2** | → **5.0** | Same |

Only the top quarter of each species' own realistic habitat qualifies. That is stricter than mosskip, whose minimum sits below its 25th percentile.

Nothing else changes:

- no food, seeds or births are created;
- the crowding, energy, maturity, kinship, mate-choice and gestation gates are unchanged;
- the switch adds no universal bonus.

### Paired comparison

Four seeds × 3 years, identical worlds, with `checkEcologicalIntegrity` every 8 days. Data is in `docs/breeding-calibration/BREED-CMP-{A..D}.json`.

| Species | Births (current → candidate) | Deaths (current → candidate) | End population (current → candidate) |
| --- | --- | --- | --- |
| Rillsifter | 1 → 36 | 0 → 9 | 73 → 99 |
| Mirelick | 0 → 8 | 1 → 3 | 79 → 85 |
| Podshell | 0 → 22 | 0 → 0 | 72 → 94 |
| Bankjaw | 0 → 0 | 0 → 0 | 32 → 32 |
| Mosskip | 152 → 168 | **18 → 36** | 390 → 388 |
| Rootling | 23 → 27 | 5 → 6 | 146 → 149 |
| GenVo | 118 → 114 | 14 → 12 | 200 → 198 |
| Needlejaw | 7 → 8 | 0 → 0 | 55 → 56 |

- All 48 integrity checks passed.
- Births vary by species and seed, which is what you'd expect from natural outcomes rather than guaranteed ones.
- **Watch:** mosskip deaths doubled under the candidate. Its end population is flat because births rose too. The likely cause is real competition from the newly breeding grazers, but this has not been isolated.

Fixture consequence:

- `maternal-birth-authority` passes with the candidate on.
- `birth-hydration`, `birth-reserves` and `conception-parental-inheritance` still fail, now only on **rillsifter**. At day 0 in those fixture worlds, its best forage on any cell is 2.57, below the 2.9 proposal, because freshwater food is still sparse at world start. The rule is working as a habitat rule. I did not lower the value further.

### Bankjaw (investigated separately, unchanged)

Bankjaw's problem is hunting, not its breeding gate:

- The breeding gate passes 83% of the time, and it finds mate targets every time, but `tryMate` is never reached.
- The nearest partner is usually held at "survival-priority".
- In 60 days: 11,423 hunt ticks produced 13 bites and 1 kill.
- The lower-energy partner's median energy ratio is 0.69, below the 0.74 required.
- Its closest mate approach was 1.6 tiles, and it never started courtship.

The fix belongs in bankjaw's hunting effectiveness, which is a separate decision.

**Decision needed:** adopt the three forage values as defaults, keep them as a review switch, or revise them.

## 2. Newborn hunting: weak attempts (implemented, per the directive)

`src/ecology/functional-diet.js` and `Simulation.tryKill`:

- **Effective prey cap unchanged.** `preyPreference` is 0 above a 2.1× prey/predator mass ratio, so targeting, diet and real predation are unchanged.
- **New `weakBiteAttempt`.** A hunter with attack anatomy may bite prey between 2.1× and **4×** its mass. A weak bite does **0.35×** normal damage, can never take prey below 1 health, and never produces a meal. Kin are excluded.
- **Provisional numbers.** 4× and 0.35 are proposals. The developmental-hunt fixture (a newborn Stalker against an adult rootling) is **3.72×**. An earlier report said 2.11, which used a non-adult rootling; that was wrong.
- **Tests.** `tests/juvenile-weak-attempts.mjs` (new) runs through the real `tryKill`: the bite lands but doesn't subdue, there's no meal, kin and >4× prey are excluded, and effective predation can still kill. `tests/developmental-hunt.mjs` now passes, unchanged.
- **Natural consequence.** 0 weak attempts in 277 natural `tryKill` calls (2 seeds × 60 days). Wild targeting still uses `preyPreference`, so oversized prey is never chosen as a target. Natural juvenile attempts would need a targeting change. That is a proposal only and was not made.

**Decisions needed:** confirm 4× and 0.35, and decide whether juveniles should *target* oversized prey on their own.

## 3. Stride

1× stays the default. `?strideReview=1.5` still works and was confirmed in the packaged build (in-page `GAIT_REVIEW.strideScale === 1.5`).

## 4. Test tiers and the full baseline

`tools/run-tests.mjs` (new) and `tests/test-tiers.json` (new):

- **Fast tier** (default): every suite except the long tier, with a 240 s cap.
- **`--all`**: adds the long tier with its own caps. **`--long`**: the long tier only.
- **Long tier:** `autonomous-soil-engineering` (900 s), `probe-kills`, `wild-evolution` and `engineer-loss-return` (1200 s each).
- Every suite always appears in the report. Long suites show as `deferred (long tier)` in fast runs, never omitted.

### First full baseline: 377 suites, compared against a clean `HEAD` export run through the same runner

| | Pass | Fail | Timeout | Deferred (long) | Total |
| --- | --- | --- | --- | --- | --- |
| `HEAD` (d2f676c) | 303 | 60 | 5 | 4 | 372 |
| Current tree | **331** | **38** | **4** | 4 | 377 |

- **Regressions: 0.**
- **Fixed: 23:** anatomy-readings, anatomy-thresholds, animation, decisions-under-pressure, developmental-hunt, discovery, drink-goal, ecology-resume, engineer-colony-natural, engineer-natural-regional-observation, evolution-editor, family-observer-resume, family-recruitment-observer, founder-body, freshwater-access, gameplay-pressure, habits, knowledge, multi-partner-sexual-selection, onboarding, pressure-vocabulary, public-export, succession-selection.
- **New, passing: 5:** anatomy-locomotion, encounter-reactions, juvenile-weak-attempts, plate-protection-reading, soil-disturbance-establishment.
- **Failing identically before and after: 42.** The earlier 202-suite sweep missed many of these. Grouped:
  - **Aquatic breeding (decision 1):** birth-hydration, birth-reserves, conception-parental-inheritance, gestation-inheritance, maternal-birth-authority.
  - **Release and provenance bookkeeping** (correct to fail on an uncommitted tree or a missing local file):
    - `provenance` and `canonical-source`: the ledger fingerprint, an unclassified `swimming-review.js`, and a missing sprite reference manifest.
    - `ai-disclosure`: needs `submission/AI_DISCLOSURE.txt`.
    - `evolution-contract`: needs a missing baseline folder.
    - `player-copy-style`: two pre-existing em dashes in `main.js` save-status copy.
  - **Behaviour and contract drift** (not yet investigated in depth):
    - core, context-guidance, community-ui-feedback, creature-assembly, engineer-breeding-habitat, engineer-family-settlement, flank-placement, food-commitment, food-web-feedback, forage-patches, forage-season-competition;
    - handoff-transition, immunity-awareness, lineage-dispersal-resume, lineage-purpose, lineage-strategy, observer-readability, player-presence, special-creatures, species-coexistence, species-leadership;
    - stalker-den-reading, strategy-arcs, strategy-encounters, water-teaching, wildlife-rhythm, evolution-baseline.
  - **Performance budget:** `observer-play` (4× speed with 560+ animals costs 507 ms per real second).
  - **Timeouts over 240 s:** ecology-stability, headless, headless-short, probe-recovery. Candidates for the long tier; not moved without your say.

Results files: `docs/test-runs/fast-2026-10-15.json`, plus `head-d2f676c-fast-2026-10-15.json` for the `HEAD` baseline. The long-tier result is in section 7.

## 5. Residual fullscreen spikes

### Attribution

The interface work is small:

- `updateHUD` is about 1 ms.
- The largest UI items in long frames are `contextTray.update` and the HUD's `expansion.snapshot`, about 1–2 ms each.

The real spikes are once-per-sim-day simulation work, found with CPU-profile long busy runs:

1. **Migration day scan.** `migration.observe` → `recommendWild` → `breedingState` at about 100 candidate positions per animal.
2. **Plant reproduction.** `phaseVegetation` → `advanceBotanicalReproduction`.

### Fix (exact, outcome-identical)

- **`carrying.surveyFor` memo.** Within one animal's scan, the forage survey depends on the position only through its sampling bucket and, for non-swimmers, the connected land region. Every candidate already shares the animal's region. The memo lives only for one `recommendWild` call.
- **`breedingState(..., {onlyIfAllowed:true})`.** The scan discards refused candidates. So a forager whose surveyed forage already fails the resource gate, which no crowding value can rescue, skips the crowding survey. Hunters still get the full evaluation.

Proof, against an untouched copy of the source:

- 3,178 `recommendWild` results across 3 seeds were identical: **0 mismatches**.
- The full simulation stayed identical day by day for 3 × 45 days: **0 divergences**.

| Day-boundary migration tick (node, exact sim) | Before | After |
| --- | --- | --- |
| Seed STALL-PROFILE, days 21–23 | 378–411 ms | **73–99 ms** |
| Seed MEMO-B, days 21–23 | 258–332 ms | **43–115 ms** |
| Total `recommendWild` cost, 3,178 calls | 4,933 ms | **1,753 ms** (2.8× faster) |

In-browser CPU-profile long busy runs, 1440×900 headless: previously 193–332 ms, with migration 190–280 ms. Now 151–225 ms, with migration 84–155 ms.

### Not changed (finding)

- **Plant reproduction** is about 190 ms per day in node and about 50 ms in early-world browser runs. The cost is spread across a dozen genetics functions:
  - pollen delivery, 77 ms;
  - gamete production, 33 ms;
  - genome pruning, 25 ms;
  - validation, 14 ms.

  There's no single hotspot to fix exactly. Splitting it across ticks would change outcomes, so I left it alone.
- **First-time sprite drawing** produced one 277 ms busy run at 800×600 (`drawAnimal` → `drawGenvoSprite`).

### Frame summary

Headless Chromium, 40 s walking, 2 runs per size:

| Viewport | Median | p95 | p99 | Worst | Frames over 100 ms |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 33 ms | 67 ms | 150 ms | 200–217 ms | 13–15 |
| 800×600 | 16.7 ms | 33 ms | 50 ms | 200 ms | 12–13 |

Headless software rasterisation dominates 1440×900, where `render` takes most of the long-frame time. Headless timing also varies run to run: the median was 17 ms in Phase 3B on the same code. A real GPU check by you is still needed.

## 6. Playtest build

- **Location:** `../genvo-review-artifacts/2026-10-15/playtest-build-phase3c/`, outside the repo. 211 modules, 17 MB. Open `index.html` over a local web server.
  - Default: 1× stride, current breeding.
  - `index.html?strideReview=1.5` for the stride comparison.
  - Add `&breedingReview=1` to watch the aquatic breeding candidate.
- **Smoke-tested** in Chromium:
  - 800×600 at 1× and 1440×900 at 1.5×.
  - New world, ordinary walking and E interactions, about 3 sim days.
  - 0 page errors; the player alive and healthy.

  This only shows the build runs. Survival, encounters, reproduction and generations across longer play still need your own playtest.

### Gameplay notes (not technical regressions)

- With current defaults, three aquatic or marsh species never breed. Over a long session their populations will only age out.
- Bankjaw never breeds: it is hunting-limited.
- Young hunters never *choose* oversized prey, so weak attempts won't appear in normal play unless targeting changes.
- Mosskip mortality rises with the breeding candidate on.

## 7. Long tier

Run with `node tools/run-tests.mjs --long --jobs 4`. Results are in `docs/test-runs/long-2026-10-15.json`. Clean `HEAD` was run the same way.

| Suite | Current | `HEAD` | Notes |
| --- | --- | --- | --- |
| `probe-kills` | **pass**, 453 s | pass, 553 s | Never broken; it only needed more than the 240 s cap |
| `autonomous-soil-engineering` | **pass**, 345 s | fail (inner worker timeout) | Fixed by the Phase 3 worker budget |
| `wild-evolution` | fail, 378 s | fail, 476 s (same assertion) | Pre-existing. Runs to completion now, but "needlejaw bodies have evolved (0/9)": no needlejaw body-plan change in its natural run. Mosskip was not reached. An ecological finding, not investigated further in this phase. |
| `engineer-loss-return` | fail | fail (same) | Its own hardcoded 110 s child-process budget expires, even standalone. The scenario needs more than 110 s. Raising a test budget is your call, so it was left as is. |

**Comprehensive result** (fast + long, current tree): 333 pass, 40 fail, 4 timeout (over 240 s) of 377. Every failure also fails on `HEAD`, so there are 0 regressions.

## Source changes in this phase

| File | Change |
| --- | --- |
| `src/ecology/breeding-calibration.js` (new) | Review-only forage values, off by default |
| `src/ecology/carrying.js` | `reproductionFor`; `surveyFor` memo; `onlyIfAllowed` early refusal |
| `src/ecology/migration.js` | `recommendWild` passes a per-call `surveyMemo` and `onlyIfAllowed` |
| `src/ecology/functional-diet.js` | `EFFECTIVE_PREY_RATIO`, `WEAK_ATTEMPT_RATIO`, `WEAK_BITE_DAMAGE`, `weakBiteAttempt` |
| `src/sim/simulation.js` | `tryKill` weak-attempt path: reduced, non-lethal damage, no meal |
| `src/main.js` | `?breedingReview=1` switch (beside `?strideReview`) |
| `tests/juvenile-weak-attempts.mjs` (new) | Weak attempt vs effective predation, through real combat |
| `tools/run-tests.mjs`, `tests/test-tiers.json` (new) | Tiered runner |
| `tools/compare-breeding-calibration.mjs` (new) | Paired current vs candidate observation |
| `tools/profile-*.cjs`, `tools/trace-frame-stalls.cjs` | Profiling additions (measurement only) |
| `docs/breeding-calibration/`, `docs/test-runs/`, `docs/frame-stalls/*phase3c*` | Evidence |
