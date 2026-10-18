# Phase 3K — Wildlife movement parity and behavioural ecology (October 16, 2026)

Nothing is committed or pushed. Nothing here is creator acceptance: the play evidence below comes from automated Chromium sessions, not human play. All new numbers are proposals for your review. Each change has its own switch, and each is a separate manifest entry (group S in `docs/CHANGE-MANIFEST-2026-10-15.md`).

## Summary

1. **Wildlife moved at a sixth of its speed because of scheduling, not biology.** The player gets a movement update every tick; autonomous animals got one per 6-tick ecology step. Autonomous animals now get a locomotion-only update every tick (`?movementParity=0` restores the old behaviour). Decisions, meals, drinking, courtship and metabolism stay on the ecology step. Ambient pauses, rest and caution are unchanged. Wildlife now covers about 4× more ground per day.
2. **Threat perception now has stages** (`?threatStages=0`):
   - detection by field of view and hearing;
   - a threat level from posture and distance;
   - vigilance, alarm and flight thresholds, scaled by inherited boldness and current need.

   A fleeing predator is less threatening, but never harmless at contact range.
3. **Cannibalism is kept but is now risky** (`?preyRisk=0`). Any prey with real jaws can bite back. Hunters weigh that risk against hunger, boldness, their own health and relationship. No species gets unconditional protection.
4. **A multigenerational selection tool** separates selection from drift and founder effects (`tools/selection-observation.mjs`).
5. **Most important finding: the world collapses in its second year with or without any Phase 3K change.** The cause is abiotic. Soil moisture has a structurally negative daily budget, so all land without seepage dries to the 0.05 floor within about a month. Wetland plants then decline for the rest of the run, even in a world with no animals. Herbivore recruitment fails, and 4–5 species die out by day 720. This needs your decision; it is not tuned here.
6. **Performance:**
   - Simulation cost rose about 28–60% in mature worlds, mostly through larger, denser populations.
   - A behaviour-neutral cache fix to the hottest function, `cropYield` (−41%), brings the 4× observer budget test back under its limit.
   - **Rendering is the open problem:** frame median 66.6 ms with parity, against 33.4 ms without, at day 120. The likely cause is many more moving creatures drawn with 32-pose walk cycles. This is proposed as a follow-up.

## 1. Movement parity (`src/ecology/movement-parity.js`, `src/sim/simulation.js`)

**Diagnosis.** Measured with `tools/movement-parity-audit.mjs`; files in `docs/movement-parity/before.json` and `after.json`. Identical GenVo bodies walked a straight 50-tile lane for one game day:

| | Before | After |
| --- | --- | --- |
| Manual player | 13.99 tiles a day (48 updates) | 13.99 |
| AUTO player | 2.33 (8 updates) | 13.99 (48 updates) |
| Wild GenVo | 1.75 (6 moving, 2 paused) | 10.49 (36 moving, 12 paused) |

Distance per update was identical (0.291 tiles), so the 1/9 gap was:
- **6× from scheduling:** wildlife only moved on ecology steps.
- **About 1.33× from behaviour:** ambient pauses.

The scheduling part is corrected. The behavioural part is kept as you asked: wild animals still pause, rest and hold back.

**Implementation.** Between ecology steps, `Simulation.update` runs `phaseMovement({locomotionOnly:true})`:
- Animals keep walking toward the target their last decision chose, at the same distance and energy per tick as the player.
- Interactions are a no-op in the substep, so meals, drinks and courtship stay at their old frequency. `tests/movement-parity.mjs` checks interaction calls per day are identical with the switch on and off.
- Background level-of-detail strides still apply. An animal advancing one window in `stride` moves `stride`× per tick within that window, so mean distance per tick is unchanged.

**Bug found and fixed during regression.** When a key was released, a hand-steered player kept its last steering vector until the next decision cleared it. The substep slid it onward at sprint speed for up to 5 ticks (0.8 tiles of overshoot, found by `decisions-under-pressure`). The substep now never moves a hand-steered player. Before the fix, the new check in `tests/movement-parity.mjs` failed with the player sliding 1.64 tiles.

**Tests changed, each commented in place:**

| Test | Change |
| --- | --- |
| `discovery` | Calls `sim.update({})`, as `main.js` does. Without a controls object the AI now walks the player off the site. The thorn-brake scratch is read as the lowest health over two seconds, because a still, fed body heals the scratch back on the same tick. |
| `lineage-dispersal-resume` | Under parity the disperser arrives on day 2, before its 23 relatives spread there. To keep the reconsideration branch covered, the relatives are placed at the destination once the route begins (staged fixture, same rule). |
| `autonomous-soil-engineering` | One dig recovers in 12 days. Better-fed rootlings dug 61 times (against 38) but last on day 78, so none was left on day 90. The test now asserts that disturbance persists across days (present on 75 and 57 of 90 days); the day-90 count is observed. |
| `consolidation-demand-parity` | Runs with parity off for its old-rule copy. |

### Ecology with movement parity on and off

Same three seeds, 360 days, no player (`tools/compare-movement-parity.mjs`; `docs/movement-parity/ecology/`). These runs used the yes/no threat appraisal, before staged perception.

| | THREAT-A off → on | THREAT-B off → on | THREAT-C off → on |
| --- | --- | --- | --- |
| Mosskip path per adult-day | 2.17 → 9.43 | 2.17 → 9.35 | 2.14 → 9.06 |
| 10-day displacement (mosskip) | 7.9 → 15.3 | 7.8 → 15.7 | 7.5 → 14.5 |
| Mosskip at day 360 | 66 → 94 | 28 → 87 | 51 → 121 |
| GenVo at day 360 | 143 → 244 | 84 → 203 | 42 → 111 |
| Stalkers at day 360 | 1 → 4 | 9 → 2 | 12 → 6 |
| Stalker hunting energy per adult-day (upkeep 0.76) | 0.98 → 2.58 | 1.72 → 2.16 | 1.41 → 2.76 |
| Stalker kills per adult-day | 0.006 → 0.026 | 0.028 → 0.010 | 0.018 → 0.020 |
| Mosskip water trips ending in a drink | 0.73 → 0.67 | 0.47 → 0.58 | 0.67 → 0.70 |
| Mosskip births / matured | 83/81 → 151/138 | 57/50 → 136/129 | 89/80 → 174/162 |
| Mosskip killed by predators | 1 → 23 | 30 → 11 | 32 → 21 |
| Extinctions | none | none | none |

What this shows:
- Prey find mates and food faster and breed more.
- Stalkers earn 2–3.6× their upkeep from hunting, so energy does not limit them.
- Stalker numbers remain the weak point; see section 2.

## 2. Staged threat perception (`src/ecology/threat-perception.js`)

The yes/no appraisal treated detecting a predator as deciding to flee. Now each would-be predator in the flight radius goes through four stages, using the one neighbourhood query the decision step already makes:

1. **Detection.**
   - Inside the viewer's field of view (about 100° either side of facing), the whole flight radius.
   - Behind it, hearing only: 55% of the radius for a moving predator, 25% for a still one.
   - A predator the animal is watching (vigilance) is tracked across the radius.
   - Stealth and mounted sensory parts apply as before.
2. **Threat level**, from posture and distance:

   | Posture | Level |
   | --- | --- |
   | Hunting this animal, or facing it | 1 |
   | Hunting something else | 0.4 |
   | Merely present | 0.25 |
   | Visibly fleeing | 0.2 |

   - Each level is scaled from half at the edge of the radius to full at contact.
   - Within contact range (1.6 tiles) there is a floor: 0.7 for a predator that is not fleeing.
   - A fleeing predator's floor is 0.65 when it is heading at this animal and 0.4 otherwise, so it is less threatening but never harmless.
   - A conspecific courting anyone has no contact floor.
3. **Response.** Thresholds are 0.15 vigilance, 0.35 alarm and 0.6 flight. They are multiplied by inherited boldness (`genes.temperament`) and by up to +40% for current thirst or hunger. A hunting predator at contact range is always fled from.
   - **Vigilance:** the animal keeps its activity and watches that predator.
   - **Alarm:** the animal keeps its activity but won't move toward the predator. A target that leads toward it becomes a 3-tile walking retreat (`wary`).
   - **Flight:** the existing escape, refuge, shelter and defence branches, unchanged.

**Rival suitors.** The first version fled rival suitors. Two Stalkers courting one female each saw the other at contact range and hit the 0.7 floor: that was 24 of 25 Stalker mate-search escapes. A conspecific in courtship posture now gets no contact floor. Results for Stalkers on seed THREAT-C (`docs/threat-stages/`):
- Mate attempts in 240 days: 36 → 82.
- Over 360 days: births 5 → 11, and living Stalkers 8 → 16.
- Mate-choice refusals are now the main loss (69 of 88 attempts).

**Mosskip water trips.** On seed DRINK-A over 120 days (`docs/threat-stages/drink-*.json`):

| Rules | Trips ending in a drink | Escapes |
| --- | --- | --- |
| Yes/no appraisal | 53% | 549 |
| Staged perception | 84% | 91 |

Under the old rule, 469 of those escapes were from a Stalker that was merely exploring within 1.6 tiles; Stalkers loiter at water. Across the three 360-day ecology seeds the effect is mixed (0.58–0.86) and within seed-to-seed spread, so I don't claim it as a population-level result.

**Ecology, 360 days.** Defaults with the rival fix, against parity with the yes/no appraisal:

| | Mosskip | Stalkers | Stalker kills per adult-day |
| --- | --- | --- | --- |
| THREAT-A | 94 → 112 | 4 → 3 | 0.026 → 0.012 |
| THREAT-B | 87 → 107 | 2 → 5 | 0.010 → 0.021 |
| THREAT-C | 121 → 89 | 6 → 16 | 0.020 → 0.024 |

No extinctions. Ablation runs (staged perception only, bite-back only) are in `docs/threat-stages/ecology/`.

**Cost.** About +4–11% of simulation time (same-state benchmark).

**Tests changed.** `escape-path` and `perceived-threat-escape` now mark their staged hunters as moving (`movedTick`), because a hunting Stalker moves. `threat-appraisal` turns its mosskip to face the Stalker. New test: `tests/threat-perception.mjs`.

## 3. Prey risk and bite-back (`src/ecology/prey-risk.js`)

One rule covers every species: prey with attack anatomy that survives a contact (hit or miss) may bite back.
- **Chance:** 0.45 × its attack ability × relative size (capped at 1.5) × its remaining health.
- **Damage:** 40% of the bite it would deal as a hunter.

The wound heals, infects and kills like any other. A hand-steered player as prey is defended by the player, never automatically.

In prey choice, the expected bite-back injury relative to the hunter's own health discounts a candidate:
- less when the hunter is starving, more when it is well fed;
- less for bolder hunters, more for timid ones;
- a recent mate keeps 35% of its value (restraint, not protection);
- immediate kin remain excluded, as before.

**Effects:**
- Stalker-on-Stalker contacts draw a bite-back about 34% of the time (137 of 400 in `tests/prey-risk.mjs`); mosskip never bite back.
- In 360-day worlds there are 2–15 bite-backs a year, with 1–3 cannibal deaths per run. It is real but rare, so it is not a population-scale effect at current Stalker numbers.

## 4. Mosskip and Stalker observation

**The mosskip decline is not caused by predators.** In the 720-day runs the decline happens on seed SELECT-A, where Stalkers fall from 2 to 0 and kill 7 mosskip in total. It has the same shape as every other herbivore's decline (section 6).

**Stalkers are not energy-limited.** Funnel, seed THREAT-C, current defaults:
- intake 3.12 against upkeep 0.36;
- 86% of adult-days above the breeding gate.

Losses come at partner encounters (291 of 1,236 ready adult-days with a ready partner in range) and at mate choice.

## 5. Selection, drift and founder effects (`tools/selection-observation.mjs`, `docs/selection/`)

For every species and gene, the tool reports z-scores for three channels:
- **Fecundity selection:** parents against the adults alive at each birth.
- **Viability selection:** offspring that matured against those that did not.
- **Predation selection:** adults killed against the adults alive.

For drift it reports surviving founder matrilines, their effective number and the largest share, plus gene-mean trajectories.

Seeds SELECT-A, B and C ran 720 days on the defaults, before the rival-suitor fix:
- With 8 genes, 3 channels and 7 species, |z| > 2 appears by chance about 5% of the time. A signal needs the same sign on more than one seed.
- **Candidate for fecundity selection:** GenVo metabolism has a positive fecundity z on all three seeds (1.44, 3.0, 1.58), plus viability z 4.21 on seed B.
- **No other gene/channel pair is consistent across seeds.**
- **Founder effects dominate:**
  - GenVo keeps 3–7 of 24 matrilines (effective number 2.2–3.3).
  - Mosskip keeps 0–8 of 64.
  - Rillsifter, mirelick and podshell reduce to a single matriline on most seeds.

  Gene-mean changes of ±0.03–0.08 in those species are better explained by drift and founders than by selection.
- **Nothing can be inferred for Stalkers:** 0–7 births per seed.

## 6. The second-year collapse (needs your decision)

Measured with `tools/long-run-resources.mjs` and `tools/compare-movement-parity.mjs`; files in `docs/long-run/`. Seed SELECT-A, 720 days:

| Run | Mosskip at day 720 | Extinct by day 720 | Marshroot | Rotcap |
| --- | --- | --- | --- | --- |
| Phase 3J rules (all of 3K and the threat appraisal off) | 32 | rootling, Stalker, podshell, rillsifter, bankjaw | 850 → 271 | 860 → 260 |
| Movement parity off | 39 | mirelick, bankjaw | 850 → 247 | 860 → 249 |
| Defaults | 21 | rootling, rillsifter, mirelick, bankjaw | 850 → 173 | 860 → 247 |
| No animals at all | — | — | 1210 → 343 | 1008 → 283 |

With defaults, sunmoss also halves (11,592 → 5,360, against about 9,800 in the other runs), so the larger parity populations add grazing on top of the drying, and there are no births at all in the last 60 days. Seed SELECT-C loses 4–5 species by day 720 in every configuration.

**What happens:**
- Populations boom until day 240–300.
- Births per 60 days then fall from about 76 to about 9.
- Deaths are mostly old age; adult energy stays around 0.7.

**The cause is the soil water budget in `Simulation.phaseSoil`.** Each day, moisture changes by `rain×0.06 − (0.025 + 0.035×temp)`:
- At this world's typical rain (about 0.38) and temperature (about 0.55) that is about −0.021 a day.
- Breaking even needs rain ≥ 0.42 + 0.58×temp (about 0.71 at mid temperature), which almost never happens.
- So every land cell without seepage reaches the 0.05 floor within about a month. Mean moisture falls from 0.531 to 0.120 by day 60 and never recovers.
- Water does not spread sideways, so shorelines dry too.
- Marshroot needs moisture 0.64 and rotcap 0.48, so both shrink for the rest of the run.

This predates Phase 3K. Movement parity makes the boom larger and the crash steeper on some species, but does not cause it.

Options, none implemented:
1. Evaporation proportional to the soil's current moisture, so soil settles at an equilibrium set by climate (about 0.26–0.37 here).
2. Moisture wicking from adjacent water and from the generated wetness, so shorelines and marshes persist.
3. Keeping the generated moisture as groundwater.

## 7. Performance

**Simulation, mature world.** Same restored day-200 snapshot, 10 days timed:

| Parity | Staged perception | ms per game day |
| --- | --- | --- |
| On | On | 1,516 |
| Off | On | 978 |
| On | Off | 1,454 |
| Off | Off | 880 |

A CPU profile from the same state shows:
- The substep's own work (movement loop, urgency and ambient checks) is about 5%.
- Most of the rest is denser populations doing more habitat-food surveys, led by `cropYield`.
- `cropYield` now uses a numeric per-kind cache (results identical): 174 → 102 ms per game day in the 560-animal observer test, which is back under its budget at 465 ms (limit 500).

**Test runtimes.** Long tests are slower: `wild-evolution` takes 703 s alone (330 s before), close to its 900 s limit. It is still the same known failure (no Stalker body change, because Stalkers barely breed).

**Rendering, Chromium 1600×900, day 120** (`../genvo-review-artifacts/2026-10-16/phase3k-play/`):

| Setting | Frame p50 / p95 | Render p50 | Animals |
| --- | --- | --- | --- |
| Defaults (two runs) | 66.6 / 116.6 ms | 43.0 ms | 321 |
| `?movementParity=0` | 33.4 / 66.7 ms | 23.8 ms | 277 |

Rendering nearly doubles for 16% more animals. **Follow-up done** (`docs/render-parity/REPORT.md`):
- These headless numbers used SwiftShader software rendering. Headed Chromium on the real GPU was about 4× slower.
- The cost was copying each freshly drawn creature onto the page from one shared canvas.
- A pool of finished-sprite canvases, plus drawing walking poses directly instead of caching them, takes headed-GPU render p50 at day 120 from 231 to 75.7 ms (frame p50 from 240 to 93 ms), with pixels unchanged.
- With the fix, parity no longer adds render time.

## 8. Play

A 4-minute automated Chromium session at 1600×900 (`phase3k-play/defaults/`) recorded no page errors. The ordinary-player bot explored, fed and fled Stalkers 5 times. Frames had a 16.7–33 ms median, with hitches of 250–417 ms. As before, this shows the game runs; it is not human gameplay acceptance.

## Verification

- **Fast tier:** 372 pass, 5 known failures, 0 new (`docs/test-runs/fast-phase3k-2026-10-16.json`).
- **Full tier:** 381 pass, 7 known failures (the same 7 as Phase 3J), 0 new, 0 timeouts, in 1,228 s (`docs/test-runs/all-phase3k-2026-10-16.json`). `wild-evolution` took 777 s against its 900 s limit.
- **New tests:** `movement-parity`, `threat-perception`, `prey-risk`.
- **New tools:**
  - `compare-movement-parity` (env `STAGES`, `PREYRISK`)
  - `selection-observation`
  - `long-run-resources` (env `MOVEMENT`, `STAGES`, `PREYRISK`, `APPRAISAL`, `NOANIMALS`)
  - `drink-trip-audit` (env `STAGES`, `MOVEMENT`)

## Decisions for you

1. Keep movement parity on by default? With the render follow-up it no longer costs render time, but the GPU path is still about 11 fps at day 120 (`docs/render-parity/REPORT.md` lists two further options).
2. Staged-perception numbers: field of view, hearing 0.55/0.25, levels, thresholds, need tolerance +40%.
3. Bite-back numbers: 0.45 chance, 40% damage, mate restraint 0.35.
4. The soil water budget (section 6): which option, if any.
5. Stalker mate choice is now their main reproductive loss: is the refusal rate intended?
