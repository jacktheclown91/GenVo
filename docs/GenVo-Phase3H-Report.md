# Phase 3H — juvenile biology, mate similarity, founding, life history, player viability, rendering (October 15, 2026)

**Status: code complete for the authorised milestones. Verified by source tests and headless Chromium. Not creator accepted. Uncommitted.**

Every new number below is a proposal. Each change can be switched off or on for comparison.

| Switch | Default | Turns off / on |
| --- | --- | --- |
| `?juvenileBiology=0` | on | Funded growth and prey appraisal (A) |
| `?foundingGenetics=0` | on | Founding genotypes (Phase 3G) |
| `?resourceFounding=0` | on | Resource-informed founding (C) |
| `?aquaticReview=0` | on | Fry growth, founding share and fry crowding (C) |
| `?lodInteraction=0` | on | Interactions between movement beats (E, consistency fix) |
| `?lifeHistory=1` | **off** | Life-history candidates (D) |
| `?healingReview=1` | **off** | Healing candidate (E) |
| `?predationParity=1` | **off** | Predation parity candidate (E) |

The similarity mate preference (B) has a code switch, `SIMILARITY_PREFERENCE.enabled`.

## A. Juvenile biology (first target; controlled before/after)

**What changed** (`src/ecology/juvenile-biology.js`):

- **Funded growth.** Each day a juvenile pays for the body mass it adds on the shared growth curve.
  - Cost = added mass × tissue energy ÷ growth efficiency (0.75) ÷ inherited metabolism.
  - Tissue energy is the same energy per unit mass that predators get from prey, so nothing is invented or lost between growth and predation.
  - Birth reserves aren't charged again; only growth after birth is paid.
  - If paying would take reserves below 25% of maximum, the juvenile doesn't grow that day: its developmental clock waits.
- **Prey appraisal.** A hunter weighs a candidate's food value by two things, and bite resolution itself is unchanged:
  - its capture likelihood, using the same speed, leg, body-ratio and vulnerability terms the real bite uses;
  - its defensive danger: repel, armour, relative size.

**Controlled comparison** (4 seeds × 540 days, nothing else changed; `docs/juvenile-biology/JUV-*.json`):

| Per seed | Before | After |
| --- | --- | --- |
| Juvenile deaths | 0–2 | 3–13 (predation and starvation) |
| Hunter kills | 19–36 | 71–87, including 3–11 juveniles |
| Growth energy paid | — | 8.4k–12.1k |
| Days of delayed growth | — | 2.7k–6.3k |
| Rillsifter births | 35–46 | 16–30 |

All integrity checks pass. Juveniles are now real prey and real consumers; extinction remains possible.

## B. Similarity mate preference (inherited, evolvable)

**What changed** (`src/reproduction/mate-preferences.js`):

- Every animal carries a heritable `similarity` allele.
  - Founders draw it in ±0.55; it's drawn last so other founder tastes are unchanged.
  - Offspring inherit the parental mean ±0.10.
- **Positive alleles prefer partners that look alike; negative alleles prefer contrast.**
- It acts only on perceptible anatomy: log body mass, webbed-limb share, ornament count, and hue (species colour plus a gene shift).
- It's scaled by the chooser's own perception (eyes and senses).
- It adds `allele × (1 − 2 × distance) × perception` to the choice score. It isn't a gate, and it's added alongside the existing same-taxon +0.01, not stacked on it.

**Natural observation** (3 seeds × 360 days, `docs/hybrid-observation/SIM-*.json`):

- Cross-lineage attempts change in mixed directions.
- The newborn mean allele drifts slightly positive (+0.002 to +0.065): mild selection for assortative choice, not imposed.
- Needlejaw still makes no same-species attempts. That's encounter density, not preference.

**Consequence found during regression (for review).** A strongly contrast-seeking, selective founder can decline a look-alike partner of its own species. Two fixtures met exactly this case. They now neutralise the allele for their staged pair; the rule itself is unchanged.

## C. Resource-informed founding and fry density

**Founding** (`src/ecology/resource-founding.js`):

- After the ordinary spawn (RNG sequence and positions unchanged), each species keeps only as many founders as the food reachable by its own anatomy can sustain for 30 days. Reachable food is:
  - standing plants it can eat;
  - freshwater food its mouth can use;
  - prey biomass × capture likelihood.
- The food around shared founding sites is counted once.
- **Bounds:** never more than configured, never fewer than a pair.
- **Result:** bankjaw 8 → 2–3; needlejaw 12 → 8–12; other species unchanged.
- The founding report travels with saves.

**Fry density** (`src/ecology/freshwater-food.js`, `AQUATIC_REVIEW.crowding`): consumer upkeep grows with density, `upkeep × (1 + before/carry)`. That's ordinary competition, not a cap.

- **Fry peaks halve** (24 → 12; `docs/aquatic-review/AQ-CROWD-*.json`).
- **But the aquatic web is still not stable.** Rillsifters decline to 1–5 by day 720, and even 2 bankjaws die out by day 240–480.
- **Why:** at about 0.015 fry per cell, meals are about 0.5 energy, too thin to sustain a predator. **Decision needed:** whether bankjaw should be viable in this world at all, or how its prey base should be built.

## D. Mirelick and podshell life history (candidates OFF)

**Diagnosis:** for most of these species, the recovery period after a birth (postpartum) is long compared with lifespan:

| Species | Postpartum (days) | Lifespan (days) |
| --- | --- | --- |
| Mosskip | 120 | 170 (about 1.1 births per female) |
| Mirelick | 94 | 210 |
| Podshell | 95 | 258 |
| GenVo | 80 | 290 |

Natural median energy (about 0.71–0.79) sits at or just above the breeding gates (0.70–0.75).

**Candidates** (`src/ecology/breeding-calibration.js` `LIFE_HISTORY`, `?lifeHistory=1`):

- **Funded gate:** reproduction cost ÷ max energy + 0.35, clamped to 0.5–0.8.
- **Condition recovery:** recovery ends once gestation has passed and condition is back at the gate.

Results over 3 seeds × 540 days (`docs/life-history/LH-*.json`):

| Mirelick, per seed | Off | Recovery | Gate | Both |
| --- | --- | --- | --- | --- |
| Births | 0 / 3 / 0 | 2 / 3 / 1 | 1 / 8 / 8 | 2 / 9 / 4 |
| Alive at day 540 | 0 / 0 / 0 | 3 / 0 / 1 | 0 / 1 / 1 | 1 / 1 / 1 |

- **Mirelick goes extinct with both off on all three seeds.** Neither candidate restores it; both leave a few individuals alive.
- **Podshell births rise with the gate** (9/3/14 → 17/9/11).
- **The gate also affects other species:** GenVo births rise to as many as 151 (57 off), and rillsifters fall on some seeds.

So these values aren't enough to make mirelick self-sustaining, and they shift other species. **Decision needed** on the life-history numbers themselves: maturity, postpartum against lifespan, litter size and feeding. Raising one value in isolation isn't advised.

## E. Player-lineage viability and the energy budget

### E1. Simulation-consistency defect found and fixed (default on, `?lodInteraction=0` reverts)

Distant wildlife moves on coarse beats, with distance compensated. But an animal already at its food or water interacted only on beats where its movement advanced, so far-from-player animals ate and drank less often than identical animals near the player.

- **Measured** (whole-world energy intake against level of detail fully off, 4 seeds × 90 days; `docs/lod-interaction/`):

  | Seed | Old | Fixed |
  | --- | --- | --- |
  | C | −8.5% | −2.9% |
  | D | −6.0% | −1.8% |
  | E | −10.8% | 0.0% |
  | F | −7.2% | −9.6%* |

  \*The player died in the comparison run, which removes the level-of-detail difference for the rest of that run.
- **Fix:** interactions at the target now resolve on every beat (`src/ecology/activity.js` `atInteractionTarget`).
- **Test:** `tests/lod-interaction-consistency.mjs`. A far animal at food eats 16 of 16 beats; the old rule ate 8 of 16.

### E2. GenVo's energy budget under realistic activity

- **Wild GenVo time shares:** feed 24.8%, band-wander 17.7%, drink 16.5%, mate 15.9%, migrate 8.3%.
- **Meals:** every at-food meal succeeds (about 4.0 energy each), but there are only about 0.19–0.22 meals per animal per day.
- **Intake:** world intake is about 0.7–0.9 energy per animal-day.
- **Margin:** so the margin above upkeep is thin under realistic activity, not under continuous feeding.

### E3. Why the player lineage fails (measured with the same rules)

**Predation pressure is player-specific.**

- Any hunter below **90%** energy (98% inside its den core) within about 9 tiles enters the dedicated Stalker encounter against the player, ahead of all other prey.
- Wild prey are hunted only below **72%**, and then by best prey value.
- Under AUTO (wildlife decision rules), the player suffered 0–1 attacks in 60 days, close to wild GenVo adults (0.003–0.006 per animal-day; `tools/predation-pressure-compare.mjs`).
- A manually steered player is under far more pressure: a hunter was within 9 tiles 13–72% of the time across the 16 current-rule runs. One bot run took four attacks in three days, even while bracing.

**Healing is far slower than the injury model says.**

- A fed animal regains 0.08 health per metabolism step (8 a day), about 0.64 a day.
- So a 46-health Stalker wound takes about 70 days to heal. The player-facing injury model describes recovery in 1.6–5.5 days.
- One wound therefore makes the next attack lethal.

**Refuges exist but are player-only and far.**

- Hollow logs and thorn brakes are 8–30 tiles from the start (8 seeds).
- Only player-targeted hunts give up at a thorn brake; wildlife never uses refuges.

**My earlier bot was wrong, and the Phase 3G conclusion "running doesn't escape" was partly a bot artefact.** I corrected four defects in `tools/player-strategy-experiment.mjs`:

1. It sent input only every 8th control step.
2. It passed no controls to `update`, so the simulation's own rules steered the player.
3. It restarted courtship every decision.
4. It stopped beside, not on, drinkable cells.

### E4. Candidates for your decision (both OFF by default)

- **Predation parity** (`src/gameplay/predation-parity.js`, `?predationParity=1`).
  - A hunter starts the encounter only when it's hungry by the wildlife threshold *and* the player is its best-ranked prey.
  - The encounter itself (tells, wind-up, charge, brace, refuge) is unchanged.
  - Nothing protects the player: hungry hunters still choose it.
- **Healing matched to the injury model** (`src/ecology/healing-review.js`, `?healingReview=1`). 1.25 health per step for every animal, still only above 65% energy, still drawing on body tissue.

**Strategy comparison, current rule against parity** (corrected bot, 4 seeds × 4 strategies × 160 days; `docs/player-viability/phase3h/`):

| | Current rule | Parity |
| --- | --- | --- |
| Lineage alive at day 160 | 3 / 16 | 6 / 16 |
| Generation 3 reached | 2 / 16 | 3 / 16 |
| Founder killed by a predator | 7 / 16 | 8 / 16 |

- Predation remains the main early death in both, because hungry hunters still pick the player through the ordinary rules.
- The refuge and defend bots camp in refuges and dehydrate. That's a limitation of the bot policy, not of the game.
- **Generation 3 was reached through ordinary survival on STRAT-D under both rules**, and on STRAT-D with parity under AUTO, forager and refuge.

## F. Rendering performance (pixel-identical)

**Method.**

- `tools/profile-cpu-functions.cjs`: Chrome CPU profile of real play, by function and file.
- `tools/profile-render-sections.cjs`: renderer methods by exclusive time, plus canvas operations per frame.
- `tools/profile-population-frames.cjs`: frame, render and other time percentiles, now with JS heap.
- `tools/render-parity.cjs`: two client copies, same seed and day, deterministic in-page world, frozen clock, camera panned across the population, every canvas pixel compared.

The "before" client is a frozen copy taken just before the optimisation.

**Measured bottlenecks and fixes (no visual change):**

1. **Environmental history:** `drawEnvironmentalHistory` ran on every visible tile (about 1,200 a frame). Each call built a history object (including unused biomass and scar values) and a `save`/`restore` pair even where nothing was drawn (63% of tiles). It now reads the four values it draws and returns early below their visible thresholds.
2. **Family guidance:** `drawFamilyGuidance` called `areaStatus()` every frame: an expansion snapshot, a commandable scan and evolution-tree living counts. It now uses `guidanceMarks()`, the same pruning, returning only the order and avoid zones. `livingCounts` fell from 27 to 3 ms per second.
3. **Player lookup:** `Simulation.player()` rescanned all animals on every call while no player was alive (3.1% of CPU). The miss is now remembered until the id, the actor list or its length changes. It's kept outside the save (test: `tests/player-lookup-cache.mjs`).
4. **FPS meter:** the hidden FPS meter still timed about 1,400 tile draws a frame (about 3.5% of CPU). It now times only while visible.

**Results** (day 200, 247 animals, 25 s of walking; `docs/render-profile/frames-*-day200-*.json`; headless Chromium, software rasteriser):

| Viewport | Frame p95 | Frame p99 | Render p50 / p95 | Native and other p95 | Slow frames |
| --- | --- | --- | --- | --- | --- |
| 800×600 | 16.7 → 16.7 ms | 16.8 → 16.8 ms | 4.7 / 10.3 → 2.3 / 6.3 ms | 12.4 → 14.7 ms | 1 → 2 |
| **1440×900** | **33.3 → 16.8 ms** | 33.4 → 16.8 ms | 10.0 / 19.6 → 5.5 / 13.6 ms | 22.0 → 13.4 ms | 4 → 2 |
| 1440×900 repeat | 33.3 → 16.8 ms | 33.4 → 16.8 ms | 9.9 / 20.2 → 5.6 / 14.3 ms | 22.1 → 13.3 ms | 3 → 2 |
| 1920×1080 | 33.4 → 33.3 ms | 49.9 → 33.4 ms | 11.8 / 21.6 → 7.0 / 15.9 ms | 23.6 → 24.3 ms | 13 → 3 |

- **Frame rate:** 1440×900 went from 1,362–1,393 to 1,486 frames in 25 s, a steady 60 fps. 1920×1080 went from 46 to 56 fps.
- **Memory:** JS heap in use at 1440×900 is 159 MB before against 141 MB after.
- **Pixel parity:** 30 of 30 frames identical at 1440×900, day 200, 29–95 creatures visible. 24 of 24 at 1920×1080, day 120, 12–122 visible. Earlier also 24 of 24 at 1440×900, day 80, and 18 of 18 at 800×600, day 140 (`docs/render-profile/parity-*.json`).
- **Not hidden:** no creatures are hidden or skipped.

**What remains:** at 1920×1080 most frame time is native rasterising and compositing (`(program)` and `drawImage`, about 24 ms p95 in headless software mode). Cutting that further would need fewer or smaller full-screen layers, which changes how frames are composed. I left that for a separate decision. A GPU-backed desktop browser will differ, and these are headless numbers, not a human-perceived acceptance.

## Phase 4. Ordinary play in Chromium

Two 10-minute sessions with every integrated change, no staging. The ordinary-player bot uses only what's on screen and the real keys (`tools/playtest-ten-minutes.cjs`). Logs and screenshots: `../genvo-review-artifacts/2026-10-15/phase4-playtest/run6-1440`, `run6-800`.

| Session | Outcome | Frames |
| --- | --- | --- |
| 1440×900, seed PHASE4-ORDINARY | Survived to about day 98 at full health; hunters nearby in 30 of 109 five-second windows; reached "Find a mate" at about minute 8.5 (day 84), courted once, no family | Median 16.7 ms throughout. Window p95 was 16.8 ms in 4 minutes and 33.3 ms in 5; last minute 50 ms (Phase 3G: 117–167 ms in its last two minutes) |
| 800×600, seed PHASE4-ORDINARY-B | Survived to about day 98 at full health; reached "Find a mate" at about minute 8 (day 80), courted twice, no family | Steady 60 fps for all 10 minutes (p95 16.8 ms) |

- **0 page errors in both sessions.**
- **The late pairing is largely my bot.** It drinks only when thirsty, so the first goals come late.
- **Playtest build:** `../genvo-review-artifacts/2026-10-15/playtest-build-phase3h` (same layout as Phase 3G; `src` identical to the working tree). It starts with no page errors and no missing files.
- **Restoration backup:** `../genvo-review-artifacts/2026-10-15/restoration-backup-phase3h`.
  - Verified on a clean HEAD export: 3,343 files, 0 mismatches. `SHA256SUMS` passes.
  - The Phase 3C backup is unchanged, and its checksums still pass.

**Success standard (three generations of genuinely different organisms through ordinary survival play): not demonstrated by a human.**

- In automated play, generation 3 was reached on STRAT-D under both predation rules (section E4).
- The 10-minute sessions didn't form a family.
- Whether the lineage is "genuinely different" across those generations wasn't evaluated here.
- None of this is human gameplay acceptance.

## Verification

**Full suite.** `node tools/run-tests.mjs --all --jobs 4` gave **370 pass, 7 known, 1 new failure, 0 timeouts** of 378 (`docs/test-runs/all-phase3h-2026-10-15.json`).

- The new failure was `engineer-loss-return`: an outcome assertion on one seed. Wildlife resumed only 4 digs after the 68-day pause, against the required 10.
  - Switching off any single Phase 3H change makes it pass (20–23 digs).
  - Three further seeds with every change on pass (17–22 digs).
- I didn't weaken the assertion. It's in `tests/known-failures.json` (8 entries) pending your decision, and the runner now reports it as known.

**Fixed during regression**, every one a fixture that assumed an old certainty:

- `consolidation-demand-parity`: now runs under the same biology as its frozen copy.
- `seed-shore-niches`, `ecology-progress`: founded counts now come from the founding report.
- `engineer-life-history`, `conception-parental-inheritance`: the staged pair's similarity allele is neutralised.

**New tests:**

- `lod-interaction-consistency`
- `player-lookup-cache`
- `healing-review`
- `predation-parity`

**Saves:**

- `save-persistence`, `save-storage` and the resume suites pass.
- **Older saves:** a world saved by the committed tree (HEAD `d2f676c`, schema 10) loads in the working tree and runs 60 more days (`tools/older-save-compat.mjs`, `docs/test-runs/older-save-compat-phase3h.txt`).
  - No non-finite values; the population reconciles with births and deaths; it re-saves.
  - Juveniles pay for growth after loading.
  - Older worlds keep their founders (no founding report).

**Rendering:** pixel parity holds on every compared frame (section F).

**Historical baselines preserved:** `docs/evolution-baseline.json` and earlier evidence folders are unchanged.

## Decisions for you

1. **Predation parity** (E4): should the Stalker encounter start under the wildlife hunger rule (below 72%, player is the best prey) instead of below 90%? Measured: player-lineage survival to day 160 rose from 3 to 6 of 16 runs.
2. **Healing rate** (E3): 0.64 health a day now, against an injury model that says 1.6–5.5 days. Adopt the candidate (about 10 a day when well fed, all animals), another value, or keep it?
3. **Refuges:** hollow logs and thorn brakes stop only player-targeted hunts, and wildlife never uses them. Should refuges become shared ecological features?
4. **Mirelick and podshell** (D): the candidates don't restore mirelick. Which life-history numbers should change: maturity, postpartum, litter, feeding?
5. **Bankjaw and the aquatic web** (C): even 2 founders can't live on the fry the world produces. Should bankjaw exist here, or should its prey base be built differently?
6. **Similarity preference** (B): strong contrast-seekers can decline look-alike mates of their own species. Keep the ±0.55 founder range, or narrow it?
7. **`engineer-loss-return`:** make it observational (like `autonomous-soil-engineering`), or keep the outcome assertion on one seed?
8. **Fullscreen render cost:** at 1920×1080, native rasterising dominates. Is a layer-composition change in scope? It would need visual review.
