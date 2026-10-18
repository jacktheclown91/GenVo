# Phase 3F and Phase 4 — ecological viability and the first ordinary ten minutes (October 15, 2026)

**Status: code complete; build verified in source tests and real Chromium play. Not creator accepted. Uncommitted.**

Unless marked adopted, the biology values below sit behind off-by-default review switches, and every number is a proposal. Controlled fixtures and natural observations are kept separate and labelled.

## 3F-1. Aquatic food web: why fry collapse

New diagnostic: `tools/aquatic-food-web.mjs`. Results are in `docs/aquatic-food-web/`, including a 640-day trace and a controlled no-grazer run.

From `advanceFreshwater`'s own update rule, a consumer tier grows in a cell only when its encounter rate `S/(S+K)` exceeds `upkeep/(growth·light+upkeep)`. For fry, that means larvae must exceed about **0.081 per cell**.

- **Grazing is not the cause.** Removing every rillsifter changes larvae by about 4%; rillsifters eat almost only algae.
- **The cause is founding stock and growth rate.**
  - Consumer tiers grow only in proportion to their own biomass.
  - World generation founds larvae at 2% of algae and fry at 2% of larvae (about 0.0002 fry per cell).
  - Larvae grow about 1.1%/day net, so they don't cross the fry threshold until day 160–240.
  - Fry's best net rate is then only about 0.5%/day, so in 640 days fry rise from 0.10 to just 0.36 across the whole world.
- **A spin-up is not a principled fix.** Without animals the web cycles between boom and bust; fry peak around 0.024 per cell, then crash. Any spin-up length just picks an arbitrary phase.

### Candidates (`?aquaticReview=1`, `src/ecology/freshwater-food.js` `AQUATIC_REVIEW`)

- **fryGrowth:** fry growth 0.012 → 0.025, matching larvae. Food still comes only from larvae at the same 20% efficiency, with unchanged upkeep.
- **founding:** founding consumer stocks are 10% of their source instead of 2%, paid for from producer biomass at world generation. Nothing is added after the world begins.

Comparison (`tools/compare-aquatic-review.mjs`, 3 seeds × 540 days, `docs/aquatic-review/`; all 67 integrity checks pass in every variant):

| Variant | Fry at day 540 | Bankjaw fry meals | Bankjaws alive at day 540 |
| --- | --- | --- | --- |
| Base | 0.25–0.29 | 0 | **0** (all starved; none ever bred) |
| fryGrowth | 2.1–2.7 | 0 | 0–1 |
| founding | 6.2–7.7 | 0.1–0.7 | 0 |
| Both + amphibious foraging | 3.9–27 | 4.2–8.9 | **1–2**, at energy 0.60–0.73 |

The food web becomes real, but **it can't feed eight bankjaws in year one**. They need about 17 units of fry over 180 days, and the whole world starts with 3–7. Their energy falls from about 0.86 to about 0.2 by day 180 in every variant. With the candidates, a small population persists at what the water food supports. Births: 0 in every variant.

### Bankjaw habitat (`?ecologyReview=1`, `src/ecology/ecology-review.js` `shoreHabitat`)

Bankjaw's founding sites came from `spawnNear: ['mirelick']`, inland marsh 8–26 tiles from water. With the candidate, a species whose **founding body swims** keeps the association but each founding site moves to the nearest shoreline. Founders then start 1–6 tiles from water on most seeds. That's world generation only: nothing is moved or created later.

**Result: no measurable benefit yet on 3 seeds.** Starting at the shore can't help while there's no fry to eat. It's kept off by default as the anatomically appropriate rule, to re-evaluate once the food web is approved.

## 3F-2. Reproduction

### Aquatic breeding values, provisionally adopted

Rillsifter 2.9/3.7, mirelick 2.8/3.8, podshell 4.2/5.0 are now the default (`src/ecology/breeding-calibration.js`; `?breedingReview=0` restores the old values).

Whole-life validation (`tools/whole-life-validation.mjs`, 4 seeds × 720 days, `docs/whole-life/`; all 90 integrity checks pass):

| | Rillsifter | Mirelick | Podshell |
| --- | --- | --- | --- |
| Births | 245 | 31 | 45 |
| Reached maturity | 236 (9 still juvenile) | 31 | 45 |
| Juvenile deaths | **0** | **0** | **0** |
| Mothers dying within 60 days of birth | 17 (nearly all old age) | 1 | 1 |
| Mother energy after birth (median) | 0.75 | about 0.72 | about 0.74 |
| Day-720 population | Persists in 3 of 4 seeds | **0 in 3 of 4** | **0 in 3 of 4** |

Starvation stays low (0–6 per species per seed).

**Concerns before locking:**

- **No juvenile ever died** in 321 births, which is implausibly safe for young animals.
- Mirelick and podshell reproduce but **don't replace** their aging founders.

Four of the five aquatic test suites stopped at day 0, where rillsifter forage can't meet its new minimum before algae grows. The shared conception fixture now holds the staged pair out of the world while habitat develops by ordinary updates (`tests/helpers/breeding-pair.js`). `gestation-inheritance` also now stages a well-fed pair. All five pass.

### Needlejaw: the cause is not courtship energy (not changed)

Courtship display costs under 1 energy unit.

| Measure | Value |
| --- | --- |
| Time above the 0.72 gate | 42–44%, in long runs (median 570 ticks) |
| Drive reaches 1 | Often |
| Time in "mate" intent | Over 100,000 ticks (3 seeds × 365 days) |
| Mating attempts | 194 |
| Pregnancies → births | 6 → 5 (litters of 1) |
| Mating attempts with its own species (2 seeds × 240 days) | **0 of 93** |
| Attempts blocked by "survival-priority" (3 seeds × 365 days) | 95 of 194, all from hungry **rootling** partners under the engineering-species rule |

**Root cause: every species can conceive with every other at 100%.** All founders share one ancestral reproductive genome (`reproductive-compatibility.js`, labelled a "development model, NOT settled balance"). Across species in 240 days, about a third of mating attempts cross species, and hybrids are common:

- GenVo: 28 births fathered by mosskip and 7 by needlejaw;
- needlejaw: fathered young among mosskip, rootling and podshell.

**Decision needed.** The biologically grounded fix is **divergent founding reproductive genomes per founding lineage**: inherited loci, not a name-based gate, so hybrids stay possible but less fertile and isolation can still evolve. Recalibrating courtship energy would treat a symptom, so I left it unchanged.

## 3F-3. Same-taxon mate affinity: candidate 0.01

`tools/mate-affinity-sweep.mjs`, `docs/mate-affinity/sweep-2026-10-15.json`. Real genotypes; one hybrid per candidate set.

| Inherited preferences | Candidates | Neutral share | Affinity 0 | **Affinity 0.01** | Affinity 0.04 |
| --- | --- | --- | --- | --- | --- |
| Natural | 2 | 50% | 50.1% | **42.6%** | 23.1% |
| Natural | 4 | 25% | 24.8% | **18.6%** | 5.7% |
| Natural | 8 | 13% | 12.9% | **8.3%** | 1.1% |
| Strong | 4 | 25% | 25.5% | **20.0%** | 8.4% |
| Weak | 4 | 25% | 24.8% | **17.5%** | 4.0% |

At 0.01 it's a modest tendency, and stronger inherited preferences keep hybrids more competitive. `SAME_TAXON_AFFINITY` is now **0.01 (candidate, not final)**. Tests check the rule:

- a same-taxon partner wins a clean tie;
- a strongly preferred hybrid can still win;
- gene flow is the fallback.

## 3F-4. Hunter behaviour in natural play

`tools/hunter-behaviour-observation.mjs`, 2 live seeds × 120 days, `docs/hunter-behaviour/`.

| Group | Time hunting | Attempts | Bites | Kills | Meal energy | Median energy |
| --- | --- | --- | --- | --- | --- | --- |
| Needlejaw, rusher | 38% | 274 | 50 (18%) | 2 | 1,737 | 0.71 |
| Needlejaw, flanker | 34% | 170 | 60 (35%) | 7 | 1,949 | 0.70 |
| Needlejaw, wary | 38% | 36 | 19 (53%) | 2 | 523 | 0.68 |
| Bankjaw, all profiles | 52–59% | 4–102 | 1–8 | 0 | 26–210 | 0.48–0.58 |

- Temperament produces genuine differences: rushers try most and land least, wary hunters the reverse.
- Ambient routines are only 2–4% of a hunter's time, because hungry hunting takes priority. So the provisional watch/patrol/rest shares rarely matter.
- Bankjaw's shoreline routine is under 1%, consistent with its missing food web.

## Phase 4 — ordinary play in real Chromium

**Setup.** `tools/playtest-ten-minutes.cjs` drives the real keyboard with an "ordinary player" policy:

- flee visible predators;
- drink when thirsty, eat when hungry;
- otherwise explore, sometimes pressing E out of curiosity;
- follow the goal pill ("Find a mate": approach and press C).

Nothing is placed, spawned or edited. Recordings and logs are outside Git in `../genvo-review-artifacts/2026-10-15/phase4-playtest/`. Fresh world, seed `PHASE4-ORDINARY`.

### What happened

| Session | Outcome |
| --- | --- |
| 1440×900, run 1 | Died at 7.4 min (about day 70): a bankjaw bit it to 40 health, then needlejaws pressed it. 0 errors. |
| 800×600 | Survived 10 min (about day 95). Never paired. 0 errors. |
| 1440×900, run 2 (mate-seeking) | Survived 10 min. Pill showed "Find a mate"; pressed C 836 times, no courtship (see defect 2). 0 errors. |

Roughly 10 game days pass per real minute.

**Moments of discovery** (first 5 minutes, all natural):

- places: root mound, pod grove, thorn brake ("Stalkers will not follow you"), hollow log den (V), lookout rock, nest ruin, carcass;
- field-guide sightings that make parts cheaper to evolve;
- trials completed ("Eat four kinds of food", "Spot five wild body parts", "Discover three places");
- special-creature rumours (Elder Stalker, Golden Hopper, Crystal Digger, Ghost GenVo);
- live evolution news ("a Spined Podshell · its body has evolved");
- Stalker warnings with direction ("STALKER NORTHEAST · RUN · SHIFT").

**Frustration, confusion and inactivity:**

1. **Defect 1, fixed: E did something other than its prompt.** After one plain E meal, every later E stayed pinned to that first, now depleted, patch while the prompt showed the food underfoot. The player starved trusting the prompt.
   - Fix (`src/ui/creature-context-tray.js`): only an explicit Q or radial choice is remembered; plain E acts on the shown default.
   - The E prompt now names exactly the action E will run (`src/ui/inspector.js` `setInteractPromptSource`, `src/main.js`).
   - New `tests/quick-interaction-default.mjs`.
2. **Defect 2, fixed: C (court) failed silently** with only a "deny" sound. Without the mate panel open, nothing was selected.
   - Now C courts the best nearby ready partner and, if it can't, says why on screen (`src/main.js`).
   - Verified in Chromium: C selects the nearest ready partner (15 tiles) and the GenVo walks to it.
3. **Improvement: the goal pill showed only "0/3 Your first goals"**, with the steps hidden behind a click. It now names the next goal: "· Eat and drink", "· Find a mate", "· Make a home" (`src/ui/tutorial.js`, `styles.css`).
4. **Danger concentration.** Bankjaws and needlejaws repeatedly reach the player (flee actions: 126 and 65 in run 1). With the bankjaw biology unresolved, inland bankjaws act as land ambushers.
5. **Readability.** At normal zoom, mosskip, GenVo and Stalkers are all small teal-green spiky shapes. The species aren't easy to tell apart at a glance.
6. **Quiet stretches.** Minutes 5–9 of the 800×600 run were mostly walking with no new event.

### Test 2: evolutionary gameplay (`tools/lineage-observation.mjs`, 3 seeds × 240 days, AUTO, nothing forced)

| Seed | Lineage |
| --- | --- |
| A | Founder never bred; starved about day 100 |
| B | Founder had 3 children (generation 2); founder killed by a predator; all children starved by day 222 |
| C | Founder never bred; starved about day 220 |

**No meaningful generational progression yet.** The cause is ecological:

- wild GenVo grow from 23 to 52–64 in 80 days, then their median energy crashes to 0.30–0.33;
- the founder gets the same meals as wild GenVo (about 4.1 energy each) but competes with a booming wild band.

That's a natural shortage response, not a bug, but it's the single biggest obstacle to the lineage game. **Decision needed:** how wild GenVo population growth and food regrowth should relate, and whether the player lineage should face the full wild GenVo boom.

### Frame times (headless Chromium, 5 s windows)

| | Median | Median p95 | Windows with p95 above 34 ms | Worst frame |
| --- | --- | --- | --- | --- |
| 800×600 | 16.7 ms | 16.8 ms | 0 of 108 | 333 ms |
| 1440×900 | 16.7 ms | 33 ms (50 ms late in the session) | 28 of 81 | 300 ms |

Input stays responsive. The fullscreen p95 rises as animal numbers grow.

## Verification

| Tier | Pass | Known failures | New failures / timeouts |
| --- | --- | --- | --- |
| Fast (`docs/test-runs/fast-phase3f-2026-10-15.json`) | 358 | 5 (release-only) | 0 / 0 |
| Long (from the `--all` run) | 8 | 3 | 0 / 0 |
| **Total (374 suites)** | **366** | **8** | **0 / 0** |

Phase 3E was 361 pass and 12 known.

- **Ledger.** The 5 aquatic suites now pass and were removed. One new known entry: `autonomous-soil-engineering`. Its natural-outcome assertion (at least one natural seedling in disturbed soil) fails only under the adopted breeding values; it passes with the previous values (verified). Decision needed.
- **Three failures caught by the full run and fixed:**
  - my new `quick-interaction-default` test (checked for `null` where the value is `undefined`);
  - `consolidation-demand-parity`: an optimisation-parity test against a frozen copy, now run under the same biology;
  - the soil assertion above, recorded rather than weakened.
- **Chromium.** Every play session showed 0 page errors at 800×600 and 1440×900.

## Decisions for you

1. **Founding reproductive genomes.** Every species can currently conceive with every other at 100%. This is the main cause of needlejaw's low reproduction and of widespread hybrids.
2. **Aquatic food web:** adopt `fryGrowth` and `founding` (`?aquaticReview=1`)? And bankjaw founding at the shoreline (`?ecologyReview=1`)?
3. **Aquatic breeding** (adopted provisionally): juvenile mortality is zero, and mirelick and podshell don't replace themselves. Lock, revise or extend?
4. **Wild GenVo boom-and-bust and the player lineage.** The main obstacle to generational play found in Phase 4.
5. **`autonomous-soil-engineering`:** keep it as a natural-outcome assertion, or report it as an observation?
6. **Same-taxon affinity 0.01:** accept the candidate?
