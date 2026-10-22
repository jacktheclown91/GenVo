# Natural observatory: evolution, ecology and vision — October 22, 2026

This report covers twelve natural planetary runs, observed read-only:

- **Replicates:** three seed pairs (`PLANET-OBS-1/2/3`) for 400 days each, with the new observatory.
- **Long runs:** three earlier pairs (`PLANET-B0-A`, `PLANET-VISION-B`, `PLANET-VISION-C`) for up to 1,000 days, with the narrower vision observer.

Each pair compares `anatomical-vision/1` (the vision arm) with the same seed and region with the policy absent (the control arm). No biology, population, mutation rate or test was changed to obtain any result. Raw datasets and analyses are in [test-runs/observatory-2026-10-22](test-runs/observatory-2026-10-22/).

## The instrument

- **`tools/observatory.mjs`** is a reusable, read-only observer.
  - It extends the existing `ecologicalObservation` and `timeSimulationPhases` tools.
  - It wraps the instance's `kill` to attribute deaths by species and cause, and restores everything on `finish()`.
  - **Daily rows:** population by species, births and varied births, deaths by species and cause, gene means, eye capability, diversity (species, wild branches, body plans, parts, living lineages), threat events, climate, and time and memory per day.
  - **Every 10 days:** resources, producer flows and limits, migration, taxa, structure sizes and part carriers.
  - **Every 100 days:** snapshot cost and size. Serialisation is skipped above a heap ceiling, and failures are recorded as data.
  - **Events (capped):** first birth and loss of each part, lineage, species and total extinctions, and population crashes.
  - **Lineage histories:** one root per founding lineage.
- **`tools/run-observatory.mjs`** runs one arm. **`tools/analyze-observatory.mjs`** answers the seven questions per run and compares arms only within a seed at matched days. **`tools/measure-eye-step-odds.mjs`** measures per-birth step odds through the real inheritance path.
- **`tests/observatory-neutrality.mjs`** proves the observatory changes nothing: an observed run, including ecology rows and a checkpoint, ends in an identical complete saved state.
- **Instrument failure, retained as evidence:** the first `PLANET-OBS-1` vision run died at day 200. The old checkpoint code serialised a ~2 GB snapshot and ran out of memory ([log](test-runs/observatory-2026-10-22/observatory/crashed-PLANET-OBS-1-vision.log)). The fixed instrument reran that arm, and it reproduced the crashed run's day-200 state exactly (248 animals).

## 1. What evolved, and how often

- **Variation:** 24–29% of births carried an accepted body variation in every run.
- **New parts:** each 400-day run produced 11–22 parts new to the population, and kept losing others.
- **Diversity:** distinct body plans rose from 8 to 90–131, and wild branches from 2 to 9–17. Body plans fell back to 10–20 in the collapsing `OBS-1` runs.
- **Advanced eyes (telescopic, raptor, panoramic, sentinel, second pair):** none were born in any run. All of them are reachable through the real inheritance path. Each step occurs in about 1 of 250–330 births of a lineage that already carries the precursor ([odds](test-runs/observatory-2026-10-22/eye-step-odds.json)). They didn't appear because their precursor lineages are rare:
  - **Hunter eyes:** 1–7 hunter-eye births per 1,000 days. Predators barely reproduce (section 3).
  - **Compound eyes:** 1–5 born per run. They persisted at 1–2 carriers in three runs but did not spread, so panoramic eyes had almost no chances.

## 2. What persisted, spread or disappeared

- **Spread:** claw, grasper, barb, armor plate, scent gland, grip pad, live womb and flag tail.
  - In `OBS-3` vision, stalk eyes went from 0 to 9 carriers, and barbs reached 16 carriers.
  - This is directional retention, consistent with selection on defence and handling. It is not proof of selection.
- **Persisted at low frequency:** compound eye, display eye, storage sac and filter mouth.
- **Disappeared:** many single-carrier novelties (dew claw, filament tuft, soft torso, barrel torso and others) were lost within one or two generations. 9–24 parts were lost per run, which is expected drift for rare variants.

## 3. Lineages: success and extinction

- **Founding lineages:** of about 190, 53–59 reproduced within 400 days. Between 12 (collapsing `OBS-1`) and 68 had living descendants at day 400.
- **Most successful:** genvo lineages (up to 52 births and 49 living descendants from one founder).
- **Predators fail everywhere:**
  - **Bankjaw went extinct in all six replicate runs**, by starvation, between day 134 and day 384.
  - **Rillsifter went extinct in all six**, by starvation or old age.
  - Hunters are only about 3% of animals.
  - In the 1,000-day `B0-A` runs, needlejaw survives as at most one animal.
  - **This is the main ecological failure:** predator populations are not self-sustaining in either arm.

## 4. Did populations and food remain sustainable?

| Run | Outcome |
|---|---|
| OBS-3 | Stable or growing to day 400 (295 control, 344 vision) |
| OBS-2 | Peaked at 368–389, then declined about 1.3–1.9 animals a day |
| OBS-1 | Crashed: 249–293 → 16–27, with 39–72 crash events |
| B0-A (1,000 days) | Peaked at 568–633 around day 400; down to 91–110 by day 1,000. Births no longer replaced deaths, most of them old age: 1,114 births against 1,219 deaths in control |
| VISION-B, VISION-C | Total extinction by day 661–911 in **both** arms |

- **Food in OBS-1:** sunmoss fell to 6% and woodspire to 9% of their day-10 stock in both arms, alongside the population crash. Other runs kept most plants at 50–270%.

Two of five long-horizon seeds went extinct and a third is declining. The planetary start region is not yet a sustainable ecosystem.

## 5. Ecological pressures

- **Wildfire is the dominant killer:**
  - 197–308 deaths in the two runs that went extinct (VISION-B and VISION-C).
  - 0.6–3.7 deaths per 1,000 animal-days in the replicates, the largest single cause in OBS-1 and OBS-2.
- **Other causes:** starvation is next, especially for predators, then old age (in the long runs), drowning and predation.
- **Predation pressure is weak:** 0.3–1.4 kills per 1,000 animal-days, consistent with failing predators.
- **Gene means barely moved** (body, motion, metabolism, senses and climate all within ±2%).

## 6. Biodiversity

- **Species:** fell everywhere, from 8 to 5–6 at day 400 and 4–5 by day 1,000. No run gained a species.
- **Within-species diversity:** rose strongly (body plans and wild branches).

So biodiversity stabilised or collapsed at the species level while variation grew within the surviving herbivore lineages.

## 7. Simulation and persistence bottlenecks

- **Unbounded flora state:**
  - Plant genomes grew from ~400–800 to 180,000–340,000 by day 400, and seed cohorts from ~500–1,300 to 1.8–3.9 million.
  - This happened even while animals collapsed: OBS-1 control had 16 animals left.
- **Consequences:**
  - The heap grew from 35–50 MB to 1.5–3.3 GB by day 400.
  - Vegetation is 52–64% of all simulation time.
  - Cost per animal-day rose from about 11–17 ms early to 26–103 ms late.
  - Median day time is 3.2–8.0 s, excluding the observer's own sampling days.
- **Saves:**
  - Snapshots grew from 130–160 MB at day 100 to 290–350 MB by day 300–400.
  - `createSimulationSnapshot` took 7–24 s, plus 1.4–5 s to serialise.
  - At about 2 GB of state, V8 serialisation fails outright; that is what crashed the instrument.
  - **This is a genuine failure for long play:** saves of mature worlds will be very slow or impossible in a browser.

## Vision versus control

The arms share seed, region and days. They diverge chaotically from the first differing random draw, so each pair is one sample, not a controlled measurement of the policy alone. Matched to the first 400 days:

| Seed | Mean population (V / C) | Predation /1000 animal-days | Alarm and flight /1000 | Births /1000 |
|---|---|---|---|---|
| OBS-1 | 190 / 178 | 0.55 / 1.01 | 96 / 191 | 3.85 / 3.96 |
| OBS-2 | 304 / 288 | 0.27 / 0.46 | 117 / 178 | 3.71 / 3.84 |
| OBS-3 | 269 / 205 | 0.35 / 0.40 | 61 / 100 | 3.85 / 4.70 |
| B0-A | 376 / 416 | 0.61 / 0.47 | 86 / 68 | 4.62 / 4.61 |
| VISION-B | 96 / 92 | 1.31 / 1.41 | 126 / 178 | 4.29 / 4.87 |
| VISION-C | 166 / 162 | 0.68 / 0.53 | 74 / 67 | 4.03 / 4.01 |

- **Inconsistent signs:** lower predation and fewer alarms with vision in 4 of 6 seeds, the opposite in 2. Population was higher in 5 of 6.
- **First three replicates misleading:** the 3-of-3 agreement among the new replicates disappears once the earlier seeds are included.
- **Starting eyes already similar:** under the policy, starting eyes see about 8 tiles across 221–300°, against 7–8 tiles across 256–338° historically.

**Conclusion:** no established ecological effect of anatomical vision at these horizons; any effect is smaller than seed-to-seed variation. Sustainability, predator failure and the bottlenecks above are the same in both arms, so they are not caused by vision.

## Actionable findings

1. **Unbounded flora genome and seed-cohort retention:** most urgent for long play. It drives memory, vegetation time and 300 MB+ saves. It needs a design decision on bounded botanical bookkeeping, such as merging or expiring negligible cohorts. Changing it alters biology, so it is a creator decision.
2. **Predators are not self-sustaining:** bankjaw and rillsifter went extinct in every run, and hunters make up only about 3% of animals. Investigate hunter energetics, prey access and reproduction thresholds before tuning anything. This also keeps the long-range eye line practically unreachable.
3. **Region-wide wildfire:** it caused both total extinctions and is the largest killer elsewhere. Review fire spread, refuge and escape under real fauna.
4. **Mature populations senesce:** births stop replacing old-age deaths after about day 400 (B0-A). Examine breeding readiness and carrying limits in mature, crowded worlds.
5. **Advanced eyes are possible but rare:** about 1 in 250–330 births per step from a precursor carrier, which is acceptable per the creator's direction. Their realised frequency depends on fixing items 2 and 4.
6. **Observatory:** use it for future long runs. Run it with `--max-old-space-size` raised, and expect day time to grow until item 1 is addressed.

## Limits

- **Few replicates:** three 400-day replicate pairs plus three longer pairs. The six seeds are not enough to detect small vision effects.
- **Weaker instrumentation on long runs:** the earlier long runs used the narrower vision observer, so their analysis covers populations, causes, threats and eye births only.
- **One region:** all runs are a single planetary start region without travel or neighbouring regions.
- **Selection not measured directly:** statements about it are correlational.

## Seed viability re-measurement

After [`seed-viability/1`](SEED-VIABILITY-2026-10-22.md), the same three seeds were run for 400 days with discrete seeds (`seeds`) against the continuous bank (`unbounded`). Every other default was identical, including `aquatic-foraging/1` ([datasets and analysis](test-runs/observatory-2026-10-22/seed-viability/)).

| Day 400 | seeds (OBS-1 / 2 / 3) | unbounded (OBS-1 / 2 / 3) |
|---|---|---|
| Plant genomes | 5,984 / 11,588 / 11,593 | 201,769 / 326,166 / 313,296 |
| Seed cohorts | 3,901 / 17,079 / 17,646 | 1.84 M / 3.86 M / 2.79 M |
| Heap | 223 / 300 / 335 MB | 2,270 / 3,563 / 2,797 MB |
| Snapshot | 27–56 MB, under 1 s | 6–56 s; size could not be measured past day 100 (heap above the safe serialisation ceiling) |
| Median day time, days 300+ | 0.6 / 2.7 / 2.2 s | 3.0 / 9.3 / 5.9 s |
| Mean animal population | 209 / 267 / 260 | 175 / 247 / 211 |
| New parts / spread | 18/0, 18/2, 19/5 | 16/0, 17/2, 18/4 |
| Plant biomass, day 400 | 3,747 / 18,086 / 16,214 | 7,451 / 19,453 / 23,186 |

**Sustainable:** memory, save size and day time now level off instead of growing with world age. For example, OBS-3's median day time was 2.18 s before day 100 and 2.16 s after day 300. Evolution and species counts are comparable.

**Ecological effect:** by day 400, plant biomass was lower in all three seeds (−50%, −7% and −30%), mostly in the seed-spreading bramble, thistlepod, dustsage and marshroot. Starvation deaths were also higher (99/47/45 against 40/33/31), although mean animal population was higher.

**Likely mechanism:** under the continuous bank, a cell holding less than one seed could still reach the 0.012 establishment threshold for plants whose seed unit is above it, so fractional seed mass recolonised ground. Discrete seeds remove that, so seed-driven recovery after disturbance is slower. The plant release, germination and bank-decay parameters were calibrated against the continuous bank, so their recalibration, or seed dormancy and age, belongs to the creator-directed plant-lifecycle pass. They were not tuned here.
