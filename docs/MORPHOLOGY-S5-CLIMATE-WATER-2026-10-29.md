# Morphological evolution S5 — climate water balance (`climate-water/1`)

S5 of the creator's brief asks for physically derived regional hydrology: rainfall-supported streams and ponds, temporary water and rare oases, without eliminating deserts. Before any new surface water could be credible, the soil water balance itself needed a measured review ([hydrology plan](REGIONAL-HYDROLOGY-PLAN-2026-10-28.md), revised direction).

**Status.** The evaporation fix is implemented and **on for new games** (creator decision October 29: "Evaporation fix first"). Saved worlds without `climateWaterRules` keep the original formula and an unchanged daily climate. Deserts are left for a later climate pass (below).

## What the review found

1. **Water balance.** In the start valley (SOAK-SIZE-1, 120 days, all morphology rules):
   - evaporation was 110% of rain;
   - runoff was 0.3% of rain, where temperate catchments shed 10–50%;
   - groundwater fell from 0.38 to 0.20;
   - plants fell from 13,956 to 8,363 and animals from 154 to 70.

   The world was drying its own start valley.
2. **Cause.** Evaporation potential was 0.025 + 0.035 × temperature: a fixed floor that never fell even at freezing. Real potential evaporation is near zero below freezing, so cold, wet places came out dry.
3. **Planet-wide aridity index** (rain ÷ potential evaporation, UNEP classes), from planet samples on three seeds:

   | Formula | Hyper-arid | Arid | Semi-arid | Dry sub-humid | Humid |
   | --- | --- | --- | --- | --- | --- |
   | Original | 0% | 0–11% | 71–76% | 17–21% | 0–1% |
   | `climate-water/1` | 0% | 0% | 4–11% | 11–15% | 74–85% |

   Earth's land is roughly half humid, with about 20% arid or hyper-arid.
4. **No deserts under any evaporation law.** The planet's subtropics (about 25°) average 0.60, cooler than the equator, and rainfall is mostly noise. Earth-like rain bands and continental interiors were tried (three strengths). They gave at most 6–8% arid land and still no hyper-arid land. They also cut the start valley's rain by 40–65%, because the valley sits near 35°, at the edge of the dry belt. Real deserts need hot, dry subtropics with coupled rain and temperature. That is a separate climate-model pass, with its own decision about the start valley, and it was not committed.

## Implemented

`ecology/soil-water.js`: `evaporationPotential(climate, T)`.
- **Under the rule:** 0.085 × max(0, T − 0.30) per day, a Thornthwaite-type law.
- **Anchors:**
  - freezing is 0.30, the snow and ice rules' threshold;
  - 1 temperature unit is about 50 °C, so the home summer is about 22 °C and an equatorial summer about 35 °C;
  - 1 moisture unit is about 100 mm, since home rain matches about 800 mm a year;
  - potential evaporation rises about 0.17 mm per day per °C above freezing.
- **Without the rule:** the original formula, exactly.

The rule is a simulation rule. `phaseClimate` stamps `evaporation: 'climate-water/1'` on the daily climate only in worlds that record it, and the off-screen region step stamps the same field. Every soil day, resident or archived, therefore uses its own world's rule. Old saves that later generate new regions are unaffected. The rule is saved and validated (a climate that disagrees with its rule is refused) and copied in planetary travel.

Nothing else changes: rain, weather, temperature, rivers and lakes are untouched. New surface water appears only through the existing conserved flows:
- runoff, overland routing and inundation;
- percolation, groundwater and springs;
- funded temporary channels, which recede as they dry.

## Evidence

`tests/climate-water.mjs` (new, gated) checks:
- the law: zero at freezing, 0.085 per unit above it, the original formula without the rule;
- the rule appearing only in recording worlds' climate, with the weather otherwise identical;
- the real `phaseSoil` over 20 cool, wet days on identical worlds: less than 60% of the original evaporation, more percolation and more runoff, and every day closing within the existing soil-ledger tolerance (10⁻⁵);
- nothing evaporating below freezing;
- saves, with refusal of a mismatched climate or an unknown rule.

**Start valley, 120 days** (SOAK-SIZE-1, all rules):

| | Original | `climate-water/1` |
| --- | --- | --- |
| Evaporation / rain | 110% | 62% |
| Runoff ratio | 0.3% | 18% |
| Groundwater recharge | 277 | 23,334 |
| Groundwater, start to day 121 | 0.38 → 0.20 | 0.53 → 0.78 (day 61) → 0.63 |
| Spring discharge | 135 | 235 |
| Open-water cells | 656 → 804 | 704 → 1,176 |
| Plants | 13,956 → 8,363 | 13,332 → 11,334 |
| Animals alive at day 121 | 70 | 146 |
| Births | 25 | 48 |
| Wildfire / drowning deaths | 36 / 4 | 0 / 11 |

**60-day soaks** (all rules), alive and births at day 61:

| Seed | Before (S4) | With climate water |
| --- | --- | --- |
| 1 | 130 / 13 | 136 / 20 |
| 2 | 136 / 6 | 134 / 8 |
| 3 | 162 / 9 | 164 / 2 |

These are observations; nothing was tuned. Drowning rose with the new open water (10, 7 and 1 in the three seeds).

## `climate-water/2` — evaporating runoff pools (S9 finding, October 29)

The S9 year-long validation found that **open water never evaporated**. Rain added volume to every wet cell, and nothing removed standing water to the air. Rainfall-runoff pools therefore only grew (1,449 flooded cells and none receded in a 365-day run), the funded-channel recession condition (a dried pocket) was never met, and valleys slowly flooded. The same happened under the pre-morphology rules (180 flooded cells and none receded by day 61), so it predates this work. It contradicts Scenario D, where a temporary water source must disappear through physical processes.

`climate-water/2` (`world/climate-water.js`), now the new-game rule:
- **Who evaporates.** Cells flooded by rainfall-runoff inundation (`floodOrigin` 1) evaporate their liquid water at the same temperature-driven potential as soil, 0.085 × max(0, T − 0.30) per day.
- **Ledger.** The water leaves as `surfaceEvaporation` in the open-water ledger (daily input, output and closure).
- **Ice and salt.** Ice is excluded, and salt stays, concentrating as the pool shrinks.
- **Recession.** A dried pool then recedes through the existing funded-channel recession.
- **What doesn't evaporate.** Generated rivers and lakes stand for catchment-scale supply that the regional model does not simulate (their border exchange is volume-neutral), so they keep their recorded balance instead of drying within weeks.
- **Versions.** `climate-water/1` (soil only) stays valid for worlds saved with it. The law lives in a leaf module shared by the soil and open-water models.

`tests/climate-water.mjs` adds Scenario D. A pool created through the real funded-inundation path evaporates on warm, dry days, closes its ledger every day (under 10⁻⁶), and recedes to land through recession. A `/1` pool does not evaporate.

## `climate-water/3` — river discharge (S9 finding 2, October 29)

Under `/2` runoff pools evaporate, but in the humid start valley none receded in a year: no water ever left a region. Border exchange swaps equal volumes, and generated rivers had no downstream outflow. A first try drained only border cells and left the inner floodplain at the volume cap: internal flow could not carry floodwater to the edge fast enough. Diagnosis then found a second cause: ground elevation is the same under generated water and its banks, so a bankfull river stood its full depth (0.2) above the land beside it, and internal flow held every runoff-flooded neighbour at that level. No pool beside a river could ever empty.

`climate-water/3` (kept for worlds saved with it; `/4` below is the new-game rule):
- **Incised channels.** Generated water fills a channel cut its own generated depth into the ground. Internal flow takes the bed as elevation less that depth, so bankfull water stands level with its banks. Runoff-made cells lie on the ground. Old worlds keep the ground-level bed.
- **Discharge.** Each connected body of open water (orthogonal neighbours, as in the internal flow) that reaches a border side open to external water drains a quarter of its *net* liquid water above its generated levels per day (a flood-wave residence of about four days), scaled by its most open outlet. The outflow comes from the cells holding surplus, in proportion, with their dissolved salt, so discharge never draws a river below its generated water. Runoff-made cells have no generated level; they drain to the internal flow's minimum wet film (0.01) and then recede through the existing funded-channel recession.
- **What doesn't drain.** Bodies with no open outlet: closed basins, and sides owned by a paired neighbouring region, whose seams already move water between regions.
- **Ledger.** The outflow is `riverDischarge` (water) and `dischargeSalt` in the open-water ledger; both ledgers still close every day.
- **Seams.** Transfer across a paired seam still compares ground-level heads. Both sides carry generated water of similar depth, so the difference is small, but the seam is not yet incised.
- **Evaporation film.** Pool evaporation (`/2` and `/3`) now stops at the same minimum wet film. Evaporating a pool to exactly zero made the internal flow refuse the world, which `/2` only escaped because rivers kept refilling its pools.

`tests/climate-water.mjs` adds a controlled case: a runoff pool beside a river with an open outlet, in a dry catchment on cool days. It drains downstream and recedes in 8 days (under `/2` it had not receded after 120). The water and salt ledgers close every day (under 10⁻⁶), and the river keeps its generated water.

## `climate-water/4` — ponded water soaks in (S9 finding 2, October 29)

A year-long classification of the `/3` field (seed S9-YEAR-2, every 15 days) found the cause of the growing open water:
- **Ponded water never left the land.** Runoff waiting on dry land (`overland`) could only move downhill (65% a day) or stay. It never soaked into the soil or evaporated, although the soil under it was never saturated (room for about 1,900 units at day 101). The land store grew from 1,567 to 6,646 units in 125 days, more than ten times all open water. About 1,470 units sat in about 12 terrain sinks, where the inundation rule skips cells holding more than 2.
- **Pools grew outward.** A pool at the 2.0 cap refuses runoff, so ponded water piled up beside it, crossed the inundation threshold and flooded the next cell. By day 361, 530 of 1,016 pools sat in 28 closed lakes, the largest 373 cells, and every shore pool stood above its lowest bank.

`climate-water/4` (kept for worlds saved with it; `/5` below is the new-game rule):
- **Run-on infiltration.** Each soil day a land cell's ponded water joins its rain under the same infiltration law; what the soil cannot take runs on downhill as before.
- **Ponded evaporation.** The ponded water evaporates first at the open-water potential; the soil beneath gets what potential is left.
- **Ledgers.** The water leaves the open-water ledger as `pondedRunOn` and enters the soil ledger as `runOn` on the same day. Both close: the soil ledger under 10⁻⁵, the combined rain and runoff ledger under 10⁻⁶.
- **Versions.** Worlds saved under `/1`–`/3` are unchanged; the new terms are exactly zero there.

`tests/climate-water.mjs` adds a controlled case. Ponded water on dry soil raises its moisture by 0.30 in one day and leaves 0.15 ponded, against 0.26 under `/3`. On saturated soil it passes on as runoff, and both ledgers close.

**Year field, S9-YEAR-2, 365 days:**

| | `/3` | `/4` |
| --- | --- | --- |
| Open-water cells, day 361 | 1,554 | 674 |
| Ponded water on land, day 121 | about 6,600 and rising | 783, then steady at 600–1,200 |
| Runoff pools flooded; receded; open at day 366 | 1,550; 520; 1,030 | 446; 310; 136 |
| Pool life, p10 / p50 / p90 (days) | — / 66 / — | 9 / 36 / 68 |
| River discharge (moisture units) | 10,100 | 4,822 |
| Alive at day 366 (from 188); births | 63; 104 | 62; 74 |
| Deaths: dehydration, drowning, wildfire | 26, 15, 31 | 55, 9, 0 |

Open water no longer grows; seasonal pools come and go (11 at day 91, 172 at day 151, 136 at day 361). Two things remain:
- **Midsummer heat kills animals far from water.** 39 animals died of thirst on days 167–169, during a heat spike (0.65 to 0.85), near the valley's northern edge. They were 10–55 tiles from water and none was beside a recently dried pool. Under `/3` the north still held runoff pools that should not have lasted. This is an observation; nothing was tuned.
- **Lakes in closed sinks stand above their banks.** About 135 deep pools (median 1.5) in closed sinks persist. On flat ground their surface stands above the dry land beside them, because water does not yet spill onto lower land. That is the next open-water question.

## `climate-water/5` — pools spill over their banks (S9 finding 2, October 30)

Under `/4` about 135 deep runoff pools (median 1.5) persisted in closed sinks all year. On flat ground their surface stood up to 2 units above the dry land beside them, because standing water never moved onto lower land.

`climate-water/5`, now the new-game rule:
- **Bank spill.** A fresh runoff pool whose surface (ground plus liquid water) stands above a dry neighbour's ground pours half of its largest overtopping per day onto those lower banks, shared by how far each is overtopped. The water lands as ponded water, which then soaks in, evaporates or runs downhill under `/4`.
- **Order-independent.** Every pool spills from the same day-start surface.
- **What doesn't spill.** Generated water, which stands level with its banks in incised channels, and salty water, whose salt has no land store.
- **Ledger.** Spilled water stays surface water (pools to ponded land water), so the open-water ledger needs no new input or output. It is recorded as `bankSpill`.

`tests/climate-water.mjs` adds a controlled case. A runoff pool 1.50 above its banks on flat ground spills 1.47 and stands 0.07 above them after 10 days; under `/4` it stays 1.50 above. The ledger closes every day.

**Year field, S9-YEAR-2, 365 days:**

| | `/4` | `/5` |
| --- | --- | --- |
| Open-water cells, day 361 (538 generated) | 674 | 542 |
| Runoff pools flooded; receded; open at day 366 | 446; 310; 136 | 614; 612; 2 |
| Pool life, p10 / p50 / p90 (days) | 9 / 36 / 68 | 5 / 16 / 56 |
| Largest overtopping, day 361 | 2.0 | 0.09 |
| Drinks on runoff water | about 14,000 | about 8,000 |
| Alive at day 366 (from 188); births | 62; 74 | 50; 92 |
| Deaths: dehydration, predation, starvation | 55, 40, 42 | 63, 66, 49 |

Seasonal pools now form in wet spells and dry within weeks; the region's open water returns to its generated network each dry season. Nothing was tuned. Still open:
- **Water hidden in land sinks.** About 660 units of ponded water sit in about a dozen terrain sinks on saturated land. Inundation skips a cell holding more than 2, and ponded water only runs downhill, so it neither becomes a visible pond nor spreads.
- **Midsummer thirst** far from the valley's permanent water, as under `/4`.

## Not yet

- **Deserts and the climate pass:** hot, dry subtropics, coupled rain and temperature, and continental interiors. This needs the start-valley decision.
- **A day–night temperature cycle**, for night activity in deserts (S4).
- **Rain intensity** (storm days). Daily rain never falls below about 0.4× its mean. Runoff now comes from saturation in wet seasons. A storm model would add intense-rain runoff in drier regions.
- **Rare oases:** springs already fire where groundwater supports them; oases in true deserts need the deserts first.
- **Groundwater start:** worlds still start at their generated moisture. Under the new balance, the start valley's groundwater *rises* toward its seasonal equilibrium instead of draining from 3×.
- **Presentation (Codex):** new seasonal pools and channels use the existing water art; seasonal recession is visible as the water mask changes.
