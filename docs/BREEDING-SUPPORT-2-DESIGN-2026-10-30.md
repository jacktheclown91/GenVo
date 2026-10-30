# Breeding support /2 and the grazing mineral leak — design (October 30)

Status: **implemented and on for new games** (creator decision October 30: "Both together"). See *Implemented* at the end. Evidence: [population demography](POPULATION-DEMOGRAPHY-2026-10-30.md) and the probes below (seed S9-YEAR-2, the full new-game rule stack).

## What the evidence says

1. **Every population collapses within two years** (three seeds: 0, 3 and 5 alive at day 731).
2. **The root cause is upstream of breeding: grazing destroys soil minerals.**
   - Soil minerals return only through litter and carrion decay and fire. The minerals in plant tissue that animals eat are never returned (no dung or urine path back to `plantResources.minerals`).
   - Measured over the start region, the ecosystem's minerals (soil, plants, litter and carrion together) fall from 4,892 at day 1 to 4,548 at day 31, 4,037 at day 91 and 3,434 at day 181: **30% lost in half a year**.
   - Plant growth turns mineral-limited: 0 of 15,800 sunmoss cells at day 32, 7,089 at day 242, and likewise for bramble, thistlepod, dustsage and marshroot.
   - Standing plant energy runs down (sunmoss 75,800 → 45,000 → 32,000 at days 32, 152 and 242) and regrowth stays at 400–550 energy units a day for the whole region, against roughly 1,350 a day eaten by the founders.
   - The capacity the land can support therefore keeps shrinking, and the population follows it to extinction.
3. **The breeding gate measures the wrong quantities.**
   - *Production:* it estimates regrowth as growth × stock × (1 − stock / carry). The real growth step uses moisture, temperature, fertility, season, snow and the water, mineral and stored-energy budgets, and grows far less (sunmoss 100 a day against an estimate of 1,690).
   - *Need:* basal × 2 (founding activity allowance) × 1.5. Females actually spend 0.64–0.85 of basal × 2, so the gate overstates their need by about a third.
4. **Hunters' refusal is ecological, not a defect.** Re-assessed against prey dynamics: realised prey turnover (about 90 births a year from about 190 animals, roughly 1 in 775 per day) is lower than the 1-in-lifespan turnover the gate assumes. The prey base genuinely cannot support breeding predators at these numbers. No change proposed.
5. **At low density mates are missing** (an Allee effect): with gate approval, most allowed females still have no reachable compatible mate.

## Proposal

### A. `grazing-nutrients/1` — eaten minerals return to the soil (primary fix)

When an animal eats plant tissue, the minerals in the tissue it digests (`removed − discarded`, × `mineralPerBiomass`, 0.1) return to `plantResources.minerals` at the cell where it fed, recorded as `excretedMinerals`. Discarded tissue already goes to litter and mineralizes later, so nothing is counted twice.
- *Physics:* grazers return most ingested nutrients within days as dung and urine; nutrient retention in growing bodies is small and comes back at death through carrion.
- *Spatial choice:* returned where eaten. Delayed deposition along the animal's path (as seed cargo already does) is more faithful but moves minerals between cells for no measurable ecological gain at this resolution. Recommended: immediate.
- *Ledger:* a mineral ledger check over a year: soil + plant + litter + carrion minerals should no longer fall except through recorded outputs (runoff mineral export, fire to the air).
- *Recorded worlds:* unchanged without the rule.

### B. `breeding-support/2` — the gate measures what bodies and plants actually do

- **Production from measured regrowth.** The vegetation step already computes each producer's realised growth (`next − current`). Keep a 15-day running average of realised regrowth energy per 4 × 4-cell block and per producer kind (32 × 32 blocks; about 10,000 numbers per region, saved with plant resources so save/restore stays exact). The gate's production for a surveyed sample is its block's average regrowth per cell × the sample area × the body's preference. Freshwater, carrion and prey terms are unchanged.
- **Need from measured spending.** Each body keeps a running daily average of the energy it actually spends (its own metabolic and activity costs, recorded where they are charged), saved with the animal. Need = that spending × the reproductive margin 1.5. Until a body has a day of measurement, the current need formula applies.
- Everything else (consumer-equivalent competition, the 1.04 threshold, no species-named numbers) stays as in `/1`.

### C. Mate search at low density — measure after A and B

If populations still fail at low density once A and B are in, measure mate-search radius and movement against real densities before proposing anything. No change now.

## Order and acceptance

1. Build A alone and run three 730-day demography fields. A may be enough on its own: if minerals hold, regrowth and carrying capacity hold.
2. Build B and run the same fields.
3. Acceptance (the creator's brief): ordinary conditions sustain reproducing populations over several generations, while selection and extinction stay possible. Evidence is recorded, not tuned: no minimum populations, guaranteed births or extinction immunity.

Both rules record themselves in new games only; saved worlds keep their recorded rules.

## Implemented (October 30)

Both rules are recorded in new games (`src/main.js` opt-in) and carried between regions; saved worlds keep their recorded rules.

- **`grazing-nutrients/1`** (`ecology/grazing-nutrients.js`). Every plant meal reports its digested tissue to `history.notePlantConsumption`; crop meals report `edible` (coat goes to litter, viable seeds are carried away). Its minerals (0.1 per biomass) return to the soil at the feeding cell, recorded as `excretedMinerals`. In a 20-day field the ecosystem loses 25 mineral units with the rule against 165 without. The rest leaves through runoff mineral export, fire and carried seeds.
- **`breeding-support/2`.**
  - `ecology/plant-regrowth.js` records each producer's realised growth per 4 × 4 block; each vegetation day rolls the day into a 15-day running mean, saved with plant resources.
  - The gate's plant production is that measured regrowth, converted to the energy this body gains from it by the same factors as a wildlife plant meal (`sim.plantEnergyPerBiomass`: nutrition × efficiency × digestion × 3.6 × food gain × lifestyle × food-profile energy and diet breadth).
  - Need is the body's measured daily spending (a 10-day running mean of every fall in its energy reserve) × 1.5.
- **Unit defect found while building.** The first `/2` build compared measured regrowth in plant nutrition units with need in animal energy units. Animals gain 3.6× nutrition (and more) per unit eaten, so every female was refused and all three seeds died out with no births. `/1` carried the same units mismatch, hidden by its overestimated logistic production. Converting with the meal-energy factors fixed it.

**Two-year fields, all new-game rules** (receipts `population-demography-2026-10-30/*-breeding-support-2.json`):

| Seed | Births, days 1–361 | Births, days 362–731 | Alive day 731 | Species left | Under `/1`, alive day 731 |
| --- | --- | --- | --- | --- | --- |
| S9-YEAR-2 | 118 | 59 | 37 | 2 | 0 |
| DEMO-A | 185 | 110 | 92 | 4 | 3 |
| DEMO-B | 150 | 86 | 87 | 4 | 5 |

Reproducing populations now persist through two years in every seed, with several generations (most young reach maturity). Selection and extinction remain: needlejaw, rillsifter and some herbivores die out, and S9-YEAR-2 is still declining at day 731 (151 starvation deaths over the two years). Nothing was tuned toward a population count.

**Still open.**
- Regional founding sizes populations with the logistic regrowth estimate (`water-founding.js`), so new regions start above what plants renew and overshoot before settling.
- Freshwater and prey production still use their `/1` units; predators cannot breed at these prey numbers.
- Mate search at low density was not changed.
