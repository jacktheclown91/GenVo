# Winter water (October 23, 2026)

**Creator direction:** "if water is frozen, life needs to migrate/hybernate/ or otherwise break ice or other believable action to aquire water".

**Problem being solved:** on GENVO8-TEST-A every water cell freezes over from about day 29 to day 41 (see [tissue water](TISSUE-WATER-2026-10-23.md)). With a 3.5-day water reserve, that was a 12-day stretch with no drinkable water anywhere.

## What was built

`src/ecology/winter-water.js`, policy `winter-water/1`, saved with each world and copied on planetary crossings. It is opt-in like the other v1 rules, through the `winterWater` constructor option. The game menu does not pass it yet.

A thirsty animal goes through the normal water route (`sim.waterRoute`). With no open water, no juicy food and no known drinking place, it now has two more options before searching blindly:

- **Break thin ice.** The animal stands on land next to the nearest frozen water within 8 tiles and strikes the sheet.
  - The load is body mass × 2, or × 4 with striking, digging, crushing or tearing anatomy.
  - The existing ice model (`fractureSurfaceIce`) decides whether the sheet breaks. Its capacity grows with the square of thickness, so thin ice breaks early and late in the freeze while thick midwinter ice holds.
  - Every attempt costs 0.6 energy.
  - A sheet that holds tells the animal that ice at least about that thick is too strong until the next day, so it does not keep hammering it.
  - Broken ice opens drinkable water through the existing hydrology, and the hole refreezes under the existing rules.
- **Eat snow.** The animal takes water out of the snowpack on a nearby tile.
  - One unit of snow water equals 500 hydration.
  - Melting costs 0.03 energy per unit of hydration. A day's water then costs about 15% of a day's food, in line with the latent heat of melting plus warming relative to a small animal's resting energy.
  - The snow it takes leaves the world's finite snowpack. It is booked as a `snowEaten` output in the daily soil-water ledger (the same pattern as cave drinking), so the soil-water closure still balances.
- **Prefer the nearer source.** At the thaw only a few distant holes open while snow and thin ice are still underfoot. A winter source nearer than open water is taken first; open water within 4 extra tiles is still preferred.
- **Dormancy and migration are unchanged.** Torpor already exists for bodies with fat stores (fat tail or fat pad): it cuts water use to 68% and wakes the animal at 30% water, and the animal then has snow to turn to. Cold migration and the thirsty search heading still move animals toward open water.
- **Same rules for every organism**, the player's creature included on AUTO. Worlds without this policy are unchanged.

**Ledger:** `sim.stats.winterWater` records snow water eaten, energy spent melting, ice attempts and ice breaks.

**Known limits:**
- A refrozen hole returns to the sheet's full thickness, because the surface-ice model, a separate policy, does not track thin regrowth.
- Snow-to-hydration scale (500) is an assumed conversion, because the soil-water model's units are abstract.

## Evidence

**Gate:** see the commit; `tests/winter-water.mjs` is part of it.

**`tests/winter-water.mjs`** checks that:
- thin ice gives way under a body's load, costs effort and opens drinkable water;
- thick ice holds, the attempt still costs, and the animal turns to snow;
- every unit of hydration from snow leaves the snowpack, melting costs energy in proportion, and snow never goes below zero;
- the soil-water ledger records eaten snow and its daily closure still balances;
- in a fully frozen world, animals find snow and ice through the ordinary water route without hammering thick ice all day (1 frozen day: 1,240 water from snow, 17 ice attempts, no thirst deaths);
- saves keep the policy, and worlds without it never break ice or eat snow.

**Thaw diagnostic** (`tools/probe-winter-water.mjs`, [output](winter-water-2026-10-23/thaw-days-30-42.txt); the day-30 line counts thirst deaths from day 1):

| Version | Thirst deaths on days 31–41 | Snow eaten |
|---|---|---|
| First version | 32 | stopped at day 37, with 450 units of snow left |
| Prefer-the-nearer-source version | 0 | continued until open water returned on day 41 |

The first version failed because, when the first 2 of 512 cells opened, every thirsty animal walked toward those far-off holes past the snow at its feet.

**360-day arms**, same seed (GENVO8-TEST-A), all with 30-second days, real needs and food properties. The first two rows are from the [tissue-water stage](TISSUE-WATER-2026-10-23.md); the new arms are [winter water](winter-water-2026-10-23/arm-v1fw-360d.json) and [winter plus meat water](winter-water-2026-10-23/arm-v1fmw-360d.json):

| Arm | Alive day 31 | Alive day 61 | Alive day 361 | Births | Thirst | Starvation | Predation | Drowning |
|---|---|---|---|---|---|---|---|---|
| Baseline | 15 | 3 | 0 | 3 | 75 | 38 | 53 | 30 |
| Meat water | 15 | 0 | 0 | 12 | 84 | 38 | 57 | 29 |
| **Winter water** | 50 | 31 | 79 (all GenVo) | 167 | 45 | 101 | 102 | 28 |
| **Winter + meat water** | 51 | 27 | 55 (all GenVo) | 108 | 84 | 63 | 70 | 22 |

Ledger over 360 days, winter-water arm: 171,871 hydration from snow and 273 ice breaks in 704 attempts.

## What it shows

- **The freeze is no longer a wall.** Thirst deaths fall by 40% (75 to 45), the thaw die-off is gone, and births rise from 3 to 167. The player's lineage (GenVo on AUTO) now outlives winter and grows to 79 to 90.
- **The ecosystem still does not hold.** Every wild species except GenVo is gone by about day 211, and most of the loss happens in the first 60 days. Among wildlife, thirst is no longer the main cause of death. Predation (102), starvation, drowning and pre-winter thirst are.
  - `tools/probe-thirst-deaths.mjs winter` shows the remaining thirst deaths come before winter (days 6–25).
  - Podshells keep choosing to feed 20 to 56 tiles from water and never switch to drinking.
  - Some mosskips die on moist ground counted as drinkable, in a land region with no route to open water.
  - Real needs raised first-month predation (16 to 53–70) and starvation (1 to 27–39) against the 30-second rest-when-sated baseline. That points to weakened animals and food access in late autumn, not to water.
  - In the winter + meat arm, thirst rises again in the second winter (60 to 84 between days 331 and 361), which is unexplained so far.

## Decision

Under the creator's rule (adopt as default only if it resolves the access problem, without forcing stability), **winter water is not yet adopted as the default for new worlds**. It solves the frozen-water access it was built for, but the ecosystem still collapses for other reasons. It stays opt-in alongside the other v1 rules, and meat water stays opt-in too.

**Next measured step, proposed:** the first-month wildlife collapse under real needs.
- Find why thirsty grazers keep feeding far from water: podshell priorities, and moist-ground drinkability with no route to water.
- Find why first-month predation and starvation triple against the 30-second baseline.
- Explain the second-winter thirst rise in the winter + meat arm.

Each step needs its own matched-seed arm, with no population tuning.
