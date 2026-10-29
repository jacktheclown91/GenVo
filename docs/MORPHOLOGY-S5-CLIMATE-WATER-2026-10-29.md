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

## Not yet

- **Deserts and the climate pass:** hot, dry subtropics, coupled rain and temperature, and continental interiors. This needs the start-valley decision.
- **A day–night temperature cycle**, for night activity in deserts (S4).
- **Rain intensity** (storm days). Daily rain never falls below about 0.4× its mean. Runoff now comes from saturation in wet seasons. A storm model would add intense-rain runoff in drier regions.
- **Rare oases:** springs already fire where groundwater supports them; oases in true deserts need the deserts first.
- **Groundwater start:** worlds still start at their generated moisture. Under the new balance, the start valley's groundwater *rises* toward its seasonal equilibrium instead of draining from 3×.
- **Presentation (Codex):** new seasonal pools and channels use the existing water art; seasonal recession is visible as the water mask changes.
