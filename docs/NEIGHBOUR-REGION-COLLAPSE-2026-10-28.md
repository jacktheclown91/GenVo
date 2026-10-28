# Neighbour-region collapse — diagnosis

The [natural two-region fields](REGIONAL-EVOLUTION-FIELDS-2026-10-28.md) showed founded neighbour regions losing almost all their animals. This document records the diagnosis. No source behaviour is changed here.

## Cause of death

The archived terminal worlds record deaths by cause per region (`stats.byCause`). In the neighbour region `128,0`, dehydration caused 128 of 143 deaths in seed 1 and 117 of 121 in seed 0. The home valley lost 6 and 32 animals to dehydration in the same runs. The deaths are sudden rather than gradual. In seed 1 the neighbour held about 60 animals until day 36, fell to 4 by day 60, recovered to 45, and fell again to 1 between days 250 and 300.

## Not offscreen simulation

Four 120-day counterfactuals (`collapse/`) used the same seeds and the same out-and-back itinerary, plus `--itinerary=stay-east`. With `stay-east` the player stays in the neighbour, making it the active region and leaving the home valley archived. Every run's restore and continuation are exact.

| Seed | Neighbour archived | Neighbour active |
|---|---|---|
| 0 | 64 → 7 by day 60; 74 dehydration deaths | 71 → 6 by day 60; 80 dehydration deaths |
| 1 | 67 → 4 by day 60; 72 dehydration deaths | 73 → 2 by day 60; 78 dehydration deaths |

The timing and cause are the same whichever region is active. The home valley stays at 103–131 animals with at most 11 dehydration deaths, even while archived.

## The neighbour has no water

On entry, while active, region `128,0` has 0 open-water cells and 0 seepage cells in both seeds. The home valleys have 562–728 water cells and 1,492–1,654 seepage cells. Average soil moisture is similar: 0.39–0.49 against 0.45–0.55. In the day-150 world every animal in the neighbour is beyond any water.

`region-water-survey.json` counts open water across a 5×3 grid of regions for four seeds. Most regions have none. The few that do sit on one long straight river through the origin, so mirrored regions have identical counts (647 and 81 cells for `POPULATION-FOUNDING-PROBE-0`). `PLANET-B0-A` has a single 4-tile river along the whole `y=0` row, 512 cells in every region on it.

## Root causes

1. **Geography** (`planet-geography.js`). Surface water comes only from three sources:
   - ocean below sea level;
   - rivers drawn as straight segments between centres of the global macro grid, where accumulated macro flow is at least 8;
   - lakes at closed macro basins.

   There are no regional streams, ponds or springs, so most 128-tile regions are waterless whatever their rainfall and soil moisture.
2. **Founding** (`regional-founding.js`, `regional-founding-templates/1`). A newly entered region is stocked only where renewable food covers each template's daily need and its thermal load is tolerable. Drinking water is not part of that habitat measure. Obligate drinkers are founded into regions with nothing to drink, live about 35–45 days on food water and snow, then die of thirst together. Immigrants that disperse there later meet the same fate.

The player's own creature faces the same waterless regions when exploring.

## Options

- **Founding water support** (bounded, new worlds only). A versioned founding policy would keep a template only where drinkable water its body can reach covers its daily water need, as the existing food and thermal measures do. Waterless regions would then be founded sparsely or not at all, and natural dispersal would test them. Recorded worlds keep `/1`.
- **Regional hydrology** (geography change, new worlds only). A versioned planetary policy would derive small streams, ponds and springs from macro rainfall and local terrain, so a moist region has water. This is the substantive Living Planet correction. It changes generated terrain, art and everything downstream, so it needs creator direction and coordination with Codex.

Neither has been implemented. No threshold, population or resource was changed by this investigation.
