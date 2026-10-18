# Soil water and persistent weather (roadmap stage W)

October 17, 2026. Two separate switches, both on by default:

- `?soilWater=0` restores the old soil-moisture rule.
- `?weatherPatterns=0` restores the old per-step rain.

Nothing is committed.

## Summary

- **The old soil rule was a broken water budget, not a dry climate.** Evaporation ignored how much water the soil held. In every season the expected daily change was negative, so land moisture could only fall. It hit the 0.05 floor within about two months and stayed there.
- **Soil water (new).** Each land cell is a soil bucket over shallow groundwater. Rain infiltrates or runs off; evaporation depends on available water; excess drains to groundwater; groundwater moves sideways and rises back into dry soil; plants draw their growth water from the soil. Open water is the only fixed source. The budget closes every day, to float rounding.
- **Weather (new).** Rain is a seeded, persistent process with its own random stream: spells of a few days, wet and dry years, storms, and droughts lasting several seasons. Long-run seasonal rain is unchanged: no water is added.
- **Plants.** Without animals, marshroot and rotcap no longer decline: marshroot ends at 3,700–5,800 instead of about 300.
- **Animals.** With animals, the year-2 collapse is gone: about 880 animals and 0–1 extinctions at day 720, against 14–21 animals and 4–5 extinctions under the old rule.
- **Grazing now limits the herbivores, not water** (creator decision: an intended ecological consequence, not a defect). By day 1,440, herbivores (mainly genvo) overshoot and graze sunmoss down from about 13,000 to 2,000–3,500. Both seeds decline, to 163 and 287 animals. Under the old rules both worlds are fully extinct by day 1,200.

## 1. Diagnosis: intended climate or broken budget?

Climate (`Simulation.phaseClimate`): season base rain is 0.58, 0.35, 0.46 and 0.26 (spring, summer, autumn, winter). The old rule multiplied it by `0.75 + 0.5 × rng` afresh on every ecology step, 48 times a game day. Temperature is 0.54, 0.78, 0.58 and 0.30, plus a small sine. A year is 32 days.

Old soil rule (`phaseSoil`), once a day: `moisture += rain × 0.06 − (0.025 + 0.035 × temp)`. The floor is 0.05. Seepage cells are held at `seepage × 0.72` or higher.

| Season | Daily change at the season's mean rain | Best possible day (rain × 1.25) |
| --- | --- | --- |
| Spring | −0.009 | +0.001, only when rain > 0.708 (about the top 2% of draws) |
| Summer | −0.031 | −0.025 |
| Autumn | −0.018 | −0.010 |
| Winter | −0.020 | −0.015 |

The loss term does not depend on how much water is in the soil, so the soil never reaches a balance. Every land cell without seepage falls to the floor; there is no wet season and nothing can refill the soil. Water never spreads sideways either.

The plant water store (`plantResources.water`, src/ecology/plant-resources.js) had a separate copy of the same rule:
- Rain was counted twice, once into soil moisture and once into this store.
- The store drained to 0 on all land without seepage.

Generated wetness (mean 0.50, wetland plants where wetness > 0.52) and plant water needs (sunmoss 0.32, bramble 0.42, rotcap 0.48, marshroot 0.64) are tuned for a world near 0.3–0.6.

**Verdict:** a broken budget. A climate rule that can only remove water is not a dry climate.

## 2. The soil-water model (`src/ecology/soil-water.js`, `SOIL_WATER`)

Once a day per land cell, in moisture units (0–1):

| Process | Rule |
| --- | --- |
| Precipitation | `rain × 0.06`, the same input as before |
| Infiltration and runoff | All rain infiltrates up to field capacity. Above it, infiltration shrinks towards saturation and the rest runs off the map |
| Evaporation | `(0.025 + 0.035 × temp) × min(1, moisture / fieldCapacity)`. The old loss becomes a potential, and actual loss depends on available water |
| Percolation | `0.15 × (moisture − fieldCapacity)` above field capacity, into groundwater |
| Capillary rise | `0.08 × (groundwater − moisture)` where the water table is higher than the soil |
| Groundwater lateral flow | Equal and opposite exchange between land neighbours (rate 0.5 × ¼ per neighbour). Open water is a fixed level of 1; map edges are closed |
| Deep drainage | `0.004 × groundwater` |
| Plant uptake | Producers fund growth from `(moisture − 0.03) × 2` plant-water units (wilting point 0.03). What they use is removed from the soil the next day |
| Retention | Field capacity `0.3 + 0.4 × generated wetness`: low, wet ground holds more water. Wetness is used as a soil property, not as water |

Groundwater starts at the generated wetness and is free to drain. Under the switch, the plant water store is a view of soil water, so rain is counted once.

**Budget.** Every day, `world.soilWater.lastDay` and a 64-day history record:
- inputs: rain plus inflow from open water;
- outputs: runoff, evaporation, deep drainage, plant uptake, and overflow (recharge refused by a full water table);
- storage before and after, and `closure = inputs − outputs − storage change`.

Soil state and history are saved with the world and restored exactly.

Cost: 0.41–0.44 ms per game day against 0.06 ms for the old rule. On an idle machine, the observer-play 4× measurement is 362 ms on against 355 ms off (medians of 7, alternated, run-to-run spread about ±25 ms). The data is in `runs/cost.json`.

## 3. Persistent weather (`src/ecology/weather.js`, `WEATHER_PATTERNS`)

Each day's rain is the season's base rain times a weather factor:

`factor = exp(0.25 × fast + 0.30 × slow − 0.0763)`

- `fast` and `slow` are unit-variance autoregressive anomalies with day-to-day persistence 0.70 (spells of days) and 0.97 (wet and dry years).
- The `−0.0763` term makes the long-run mean factor exactly 1. Expected seasonal rain is unchanged, and nothing is added to rescue plants.
- Rain is constant within a day. Temperature keeps the old formula.

Determinism:
- Weather has its own random stream, seeded from the world seed and stored as `sim.weatherPattern`. It is saved with the simulation core.
- Weather for any day is a pure function of seed and day, so a resumed world continues the same weather.
- `phaseClimate` still takes one `sim.rng` draw per step and discards it with the switch on. As a result the creatures' random sequence is identical with weather on or off, and weather never changes genetics or reproduction draws.
- Existing code still reads `sim.climate.rain` and `sim.climate.temp`. `sim.climate.weatherFactor` is added.

Statistics over 500 years on each of 4 seeds (`tools/weather-stats.mjs`, `runs/weather-stats-*.json`):

| | Old | New |
| --- | --- | --- |
| Mean rain relative to season normal | 1.000 | 0.992–0.997 (sampling; expected value 1) |
| Daily variation (CV) | 0.02 | 0.41 |
| Lag-1 day autocorrelation | 0.00 | 0.81 |
| Ecology steps with heavy rain (≥ 0.72) | 0.4% (single-step flickers in spring) | 8.5% |
| Storm runs (days with rain ≥ 0.72) | none | 1.07 per year, mean 2.5 days, longest 14 |
| Share of days that are storm days | 0 | spring 22.8%, summer 1.9%, autumn 8.9%, winter 0.2% |
| Wet spells (≥ 1.25 × normal) | none | 2.0 per year, mean 3.5 days, longest 81 |
| Dry spells (≤ 0.6 × normal) | none | 1.5 per year, mean 3.1 days, longest 66 |
| Droughts (16-day mean ≤ 0.7 × normal) | none | 0.30 per year (one every ~3 years), mean 18 days, longest 133 (4 years) |

Under the old weather, rain-driven storms essentially never happened: family-weather "active" needs rain ≥ about 0.735, above the old spring maximum of 0.725.

The spread was swept (`FAST`, `SLOW`, `PF`, `PS` env on the stats tool):
- The first trial (0.45 and 0.35) gave storms on 24% of spring days and 11% of all steps.
- Spring storm share stays around 23% at any spread that still produces droughts, because spring base rain (0.58) sits close to the 0.72 storm threshold.
- That threshold is in the gameplay code, so I left it alone; see open decision 3.

Seed-to-seed variety, first 120 days:
- SELECT-A drew a wet year: a 46-day wet run, storms on 33 of 120 days, factor up to 3.6.
- SELECT-C drew a dry one: storms on 4 days.

## 4. Validation

All files are in `docs/soil-water/runs/`. "sw" is the soil-water switch and "wp" is the weather switch (1 = on).

### 120 ordinary days with animals (`p120-*`)

- **Budget closure.** Largest daily |closure| is 6e-6 to 4e-5, on a land store of 8,000–16,000 units (float32 rounding), on every day of all four soil-water runs.
- **Moisture range.** 0.19–0.62.
- **Weather persistence.** Lag-1 autocorrelation of the daily factor is 0.92 (SELECT-A) and 0.77 (SELECT-C).
- **Save continuity.** `tests/weather-soil-resume.mjs` compares an uninterrupted 14-day natural world with one saved at day 6, restored from a structured clone, and run 8 more days. Weather state, climate, moisture, groundwater, the daily budget, `sim.rng`, and the whole saved simulation state are identical. A deliberate 1e-3 groundwater or 1e-9 weather perturbation is detected.

The 120-day budget totals (sum of daily world flows, in moisture units over all land cells):

| Run | Rain in | Runoff | Evaporation | Plant uptake | Deep drainage | Storage change |
| --- | --- | --- | --- | --- | --- | --- |
| SELECT-A sw1 wp0 | 49,298 | 143 | 52,251 | 3,424 | 2,271 | −8,791 |
| SELECT-A sw1 wp1 | 68,010 | 1,954 | 62,802 | 3,258 | 2,360 | −2,363 |
| SELECT-C sw1 wp0 | 49,842 | 164 | 53,149 | 3,421 | 2,354 | −9,246 |
| SELECT-C sw1 wp1 | 41,549 | 95 | 45,831 | 3,391 | 2,086 | −9,854 |

The storage loss in the first 120 days is the generated wet start (mean 0.50) settling to the climate's equilibrium; it is not a one-way drain. Inflow from open water makes up the difference (for example, 20 units per day on SELECT-A).

### No animals, 720 days (`probe-*`), land plant biomass

| Run | Mean moisture after day 60 | Sunmoss | Bramble | Marshroot | Rotcap | Thistlepod |
| --- | --- | --- | --- | --- | --- | --- |
| Start, SELECT-A | 0.507 | 11,592 | 1,769 | 850 | 860 | 1,229 |
| SELECT-A old | 0.073 (floor) | 12,113 | 2,319 | **343** | **283** | 1,634 |
| SELECT-A soil water | 0.21–0.31 by season | 13,836 | 7,186 | 5,075 | 4,514 | 6,597 |
| SELECT-A both | 0.10–0.62 (yearly 0.13–0.50) | 13,430 | 6,076 | 3,713 | 4,681 | 6,334 |
| Start, SELECT-C | 0.538 | 11,804 | 1,826 | 1,033 | 855 | 1,152 |
| SELECT-C old | 0.072 (floor) | 12,226 | 2,406 | **302** | **316** | 1,557 |
| SELECT-C soil water | 0.23–0.32 | 13,919 | 7,413 | 5,751 | 4,498 | 6,315 |
| SELECT-C both | 0.12–0.49 | 13,913 | 7,563 | 5,781 | 4,474 | 6,282 |

- With soil water on, mean moisture settles in about 60 days and then follows the seasons and the weather.
- Moisture is 0.42–0.45 on banks and 0.21 far from water (soil water only), with no downward drift.
- Groundwater drains from its 0.5 start towards 0.08 over the two years. It barely affects moisture away from water.
- Maps: `moisture-old-SELECT-A.png` (days 1, 9, 17, 25, 33, 65; the map browns to the floor), `moisture-new-SELECT-A.png` (days 1, 65–97; seasonal, with wet banks).

### Droughts

**Natural droughts (both switches on, no animals).** SELECT-A has a dry run from year 12 to year 22 (yearly rain factor 0.44–0.94, moisture 0.13–0.19), after wet years 3–6 (factor up to 2.14, moisture up to 0.50). SELECT-C dips to factor 0.54 in years 9–10. Plants come through both.

**Forced drought** (`DROUGHT=193:96`: three years with no rain, soil water on, `probe-drought-A`, `moisture-drought-SELECT-A.png`):
- Far-from-water moisture falls from 0.21 to 0.004. Banks hold at 0.29 on river-fed groundwater.
- Marshroot falls 33% (2,993 to 2,014) and sunmoss 7%.
- When rain returns, moisture is back to 0.20 within 32 days and plants regrow.

There is no direct drought penalty anywhere. Organisms feel drought only through moisture, plant water, plant growth and food.

### Ecology with animals, 720 days (`cmp-*`, `lr-*`)

| Seed and switches | Animals at day 720 | Extinct by day 720 | Births | Births in last 120 days |
| --- | --- | --- | --- | --- |
| SELECT-A, both off (old) | 21 | rootling, genvo, rillsifter, mirelick, bankjaw | 451 | 2 |
| SELECT-A, weather only | 210 | rootling, bankjaw | 801 | 28 |
| SELECT-A, soil only | 879 | bankjaw | 1,724 | 291 |
| SELECT-A, both on | 877 | none | 1,683 | 303 |
| SELECT-C, both off (old) | 17 | rootling, needlejaw, mirelick, podshell | 258 | 3 |
| SELECT-C, weather only | 14 | rootling, podshell | 241 | 11 |
| SELECT-C, soil only | 881 | rootling | 1,485 | 320 |
| SELECT-C, both on | 896 | none | 1,526 | 279 |

Day-720 populations with both on:
- SELECT-A: mosskip 346, genvo 300, rillsifter 126, podshell 76, mirelick 17, rootling 9, needlejaw 2, bankjaw 1.
- SELECT-C: genvo 550, mosskip 162, rillsifter 100, mirelick 60, rootling 16, needlejaw 6, podshell 2.

Mean adult energy stays 0.68–0.77 in every run. Starvation deaths rise from 8–12 to 21–43, because there are many more animals.

On SELECT-A, weather alone partly helps. Under the old soil rule, a very wet spell can briefly add water: SELECT-A moisture jumped back to 0.47 around day 120. The collapse is caused by the soil budget, not the weather.

For most species, a smaller share of drink trips is completed. Genvo, for example, falls from 0.63 to 0.46 (SELECT-A) and from 0.84 to 0.57 (SELECT-C). This is probably crowding at drinking spots with about 4× the animals. Not investigated further.

### 1,440 days with both on (`lr1440-*`)

| Day | SELECT-A animals (sunmoss) | SELECT-C animals (sunmoss) | Old rule, A / C |
| --- | --- | --- | --- |
| 241 | 572 (13,121) | 552 (12,999) | 486 / 385 |
| 481 | 890 (10,917) | 691 (11,060) | 264 / 138 |
| 721 | 877 (7,323) | 896 (8,201) | 21 / 17 |
| 961 | 695 (4,863) | 874 (4,934) | 0 / 1 |
| 1,201 | 402 (3,794) | 611 (2,350) | 0 / 0 |
| 1,441 | 287 (3,502) | 163 (1,974) | 0 / 0 |

- At day 1,440, SELECT-A keeps 6 species (genvo, rillsifter, rootling, mosskip, mirelick, podshell).
- SELECT-C keeps 3 (genvo, rillsifter, mirelick). Needlejaw dies out after day 1,081; mosskip, rootling and podshell decline out.
- Moisture over this period stays 0.12–0.44.
- Sunmoss falls steadily from day 300, under grazing.

This is a consumer–resource overshoot: herbivores, genvo above all, grow to 300–600 and eat sunmoss faster than it regrows. Water is not limiting. In the no-animal probes, sunmoss holds at about 13,900 with the same water.

## 5. Tests

- **New: `tests/soil-water.mjs`.** Covers:
  - budget closure over 90 days of varied weather;
  - dry soil regaining water from ordinary rain;
  - wet and dry starts converging to the same moderate equilibrium (not the floor);
  - banks wetter than far ground;
  - a 40-day drought drying soil below half, with banks resisting and full recovery after;
  - uptake leaving the soil once and never below the wilting point;
  - simulation determinism;
  - with the switch off, the old rule reproduced on every cell for 3 days.
- **New: `tests/weather-patterns.mjs`.** Covers:
  - long-run mean factor of 1;
  - persistence;
  - multi-season droughts, wet spells and dry spells;
  - reproducible per seed and different between seeds;
  - constant within a day, with storms occurring;
  - with the switch off, the old rain value for value.
- **New: `tests/weather-soil-resume.mjs`.** Save/resume determinism, daily budget closure on a natural world with animals, path-independent weather, and an unchanged `sim.rng` sequence with weather on or off.
- **Changed:**
  - `tests/consolidation-demand-parity.mjs` switches both new rules off, like every other newer rule in that frozen-copy parity test.
  - `tests/plant-resource-contract.mjs`: its water-reconciliation identity gains the new `soilExchange` flow, which is 0 with the switch off. The identity is still exact. No assertion was loosened.
- **Fast tier** (idle machine): 377 pass, the 5 known failures, 0 new.
  - Earlier runs under heavy background load also failed `observer-play` (a timing budget) and `performance-hotfix` (renderer work in progress elsewhere; it failed with both switches off too). Both pass now.
- **Long tier:** see section 7.
- Weather and storm tests: `weather-exposure`, `storm-aftermath`, `family-weather-refuge` and `shelter-weatherproofing` pass with both switches on.

## 6. Decisions for you

1. **Defaults.** Both switches are on.
   - In favour: the water rule is now physically sound, closes its budget, keeps droughts possible, and turns certain extinction into worlds that still hold 160–290 animals at four years.
   - Against: on is not a stable ecosystem either (section 4).
   - If you want the submitted build to change less, `soilWater` can ship on with `weatherPatterns` off: weather adds variety and storms but is not needed for the fix.
2. **Herbivore overshoot.** *Creator decision (October 17, 2026): not a problem to fix. Overgrazing and the decline that follows are ecological and evolutionary consequences, as they should be, and no rescue or population target is added.* Original note: With water fixed, nothing holds genvo and mosskip below what sunmoss can sustain. This is consumer density regulation or regrowth, not water, so I did not touch it. It is the next thing to study before the freeze.
3. **Storm frequency.** Persistent weather gives about 1 storm run a year (mean 2.5 days, mostly in spring). Storms land on 23% of spring days because spring rain (0.58) sits near the gameplay's heavy-rain threshold (0.72). Before, rain storms effectively never happened. If that is too stormy for play, the options are:
   - lower the spread, which also makes droughts rarer;
   - review the thresholds in weather-exposure.js and family-weather.js.
4. **Plant tolerance.** With moisture no longer at the floor, marshroot (reeds, water need 0.64) grows almost as densely on dry upland (0.30–0.38 per cell, moisture about 0.21) as on banks (0.40–0.49). The plant growth curve `1 − |moisture − need| × 1.7` is very permissive. That is a plant rule, so I did not change it.
5. **Plant water use.** Plants are charged 0.5 water per unit of new biomass, only for net growth. Plant uptake is therefore about 6% of all water lost, and water limits growth only near the wilting point (droughts). A transpiration term proportional to standing biomass would make vegetation a real water sink; it needs plant calibration first.
6. **Performance.** The soil step is cheap. Larger populations (about 900 by day 500) and more plant cover cost more:
   - `pruneUnusedFloraGenomes` (flora-genome-lifetime.js) dominated a no-animal 160-day run: 21.6 s of 68 s, against a 27 s total with the old rule.
   - A world at about 900 animals exceeds the observer-play reference population of 560.
7. **Regional moving fronts** are not started. v1 weather is verified, so this can follow if you want it.

## 7. Long tier

Recovered during the Codex takeover on October 17, 2026 from the original structured runner output, now preserved as `docs/test-runs/long-soil-water-claude-2026-10-17.json`. The original run completed; no GenVo test process was still running at takeover.

- 7 pass: autonomous-soil-engineering, ecology-resume, engineer-colony-natural, engineer-loss-return, engineer-natural-regional-observation, family-observer-resume, family-recruitment-observer.
- 1 known failure: evolution-baseline (the intentionally preserved historical baseline).
- 1 new failure: hydrology, which still requires the old fixed `seepage * 0.72` moisture floor. The new model replaces that floor with physical groundwater exchange. This needs a justified contract review, rather than adding unbudgeted water to satisfy the assertion.
- 2 timeouts: natural-world-soak at 1,500 s and wild-evolution at 900.2 s. These remain unresolved. The wild-evolution timeout is not its known needlejaw-evolution assertion and must not be classified as a known failure.
- Total: 1,719 s; 382 fast suites deferred in this long-only run. Test limits and the known-failure ledger are unchanged.

This result does not establish comprehensive validation or visual gameplay acceptance. The earlier Phase 3L full-tier run predates the soil-water work and cannot substitute for this result.

## Files

| File | Change |
| --- | --- |
| `src/ecology/soil-water.js` (new) | Soil-water model, budget records, save validation |
| `src/ecology/weather.js` (new) | Persistent weather process with its own seeded stream |
| `src/sim/simulation.js` | Two imports; `phaseSoil` calls `advanceSoilDay` when `SOIL_WATER.enabled`, otherwise the old rule; `phaseClimate` uses the weather factor when `WEATHER_PATTERNS.enabled` (the `sim.rng` draw is kept) |
| `src/ecology/plant-resources.js` | Import; `advancePlantInputs` reads plant water from soil under the switch (`soilExchange` total), otherwise the old store; sets `soilWaterLinked` |
| `src/persistence/save-manager.js` | Import; `soilWater` saved (without its scratch buffer) and validated on restore. Weather state is in the saved core automatically |
| `src/main.js` | Two imports; `?soilWater=0` and `?weatherPatterns=0` |
| `tools/soil-water-probe.mjs`, `tools/soil-water-maps.mjs`, `tools/weather-stats.mjs`, `tools/soil-water-cost.mjs` (new) | Probes, maps, weather statistics, cost |
| `tools/long-run-resources.mjs`, `tools/compare-movement-parity.mjs` | `SOILWATER=0`, `WEATHERPATTERNS=0` env; moisture column in long-run rows |
| `tests/soil-water.mjs`, `tests/weather-patterns.mjs`, `tests/weather-soil-resume.mjs` (new) | Rule and determinism tests |
| `tests/consolidation-demand-parity.mjs`, `tests/plant-resource-contract.mjs` | See section 5 |
| `docs/soil-water/` | This report, maps, run data |

## Codex continuation checks (October 17, 2026)

- `weather-codex-takeover-2026-10-17.json`: 5/5 pass (persistent weather, exposure, family refuge, shelter weatherproofing, and weather/soil save-resume).
- `soil-water-codex-takeover-2026-10-17.json`: 1/1 pass (water-model rule suite, including legacy parity).
- `storm-codex-takeover-2026-10-17.json`: storm-aftermath passes.
- `renderer-recorder-codex-takeover-2026-10-17.json`: canvas-recorder passes; this does not establish visual renderer acceptance.

All continuation runner JSON files are in `docs/test-runs/`. Hydrology contract review retains the original 96-day natural-world run, verifies daily water closure and wetter banks with physical water enabled, and checks the original fixed floor under the legacy switch. The two long-tier timeouts remain unresolved. No model coefficients, biological outcomes, test ceilings, or known-failure entries were changed.

Hydrology continuation result: PASS in 88.5 s, under the existing 300 s limit (docs/test-runs/hydrology-codex-takeover-2026-10-17.json). All 9 suites run during this continuation passed. The recovered natural-world-soak and wild-evolution timeouts have not been resolved or rerun. Comprehensive and visual acceptance remain outstanding.

## Pre-split comprehensive run completed

`docs/test-runs/all-codex-continuation-2026-10-17.json` completed with **385 pass, 6 known failures, 0 new assertion failures, 2 timeouts**, no stale ledger entries, and no deferred suites (393 total; 3,203 s). Wild evolution timed out at 900.1 s and natural-world-soak at 1,500 s. The observer budget suite passed. No orphan simulation workers remained after completion.

This run used the pre-split loaded tests. It is preserved as historical performance/integration evidence and is **not post-split certification**. The subsequent controlled/observation separation does not claim to solve either timeout. Revised fast-suite and ecological-observation results are recorded in separate artifacts.