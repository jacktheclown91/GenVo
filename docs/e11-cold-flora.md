# E11: real alpine and tundra plant food webs

This content slice adds two living botanical lineages to **existing** World arrays and globally shared plant-resource accounting. The biome label is observational, not a rule granting food.

| Lineage | What it exploits | Who can eat it | Ecology |
|---|---|---|---|
| **Frost Lichen** | Cold, exposed ground and alpine slopes, with cold-optimized growth temperature | Anatomically equipped grazers and small browsers | A shallow crust with finite biomass; local propagules, seed banks and ordinary soil/litter cycles |
| **Snowberries** | Cold fertile ground and higher mountains | Fruit browsers, seed-crackers | Scarce but nutritious fruit, inherited seeded plant genetics, viable cargo via animal feeding, winter harvest opportunity |

## Implementation
- New worlds place founders **after** terrain elevation, temperature and moisture are generated; coast, legacy and sampled planetary starting geography use the same real physical habitat tests. They cannot found on open water or in hot mountains merely because a region is high. Existing saves do not get phantom cold flora.
- Each plant grows with its own inherited founder temperature optimum, and seed establishment uses the same specialized temperature response. The established floral genome and shared finite producer energy, light, water and minerals continue to govern growth. No new fertilizer, free seed spawning, magic food or species registry cap.
- Strongly warmer weather withers actual standing cold-specialist tissue into the shared litter/decomposer resource. The same canonical `dispersal.noteGrowth` reduces attached seed and coat mass.
- Snowberry fruit and frost lichen spores are in `FLORA_TISSUES`; normal mouth guilds determine grazing and kernel-cracking. Consumption is a real `ForagingController`/Dispersal harvest, storing viable propagules in the animal when appropriate and paying the existing handling/processing costs.
- The new plant silhouettes and trace miniatures render entirely from the **top-down** perspective. These are provisional procedural art, not the user's final authored 32x32 art.
- Existing animal physiology and E10 lactation/endothermy are unchanged but now occur alongside a genuinely productive cold-habitat food niche. Survival and selection will still require broader alpine water, predators, thermoregulation balancing and complete food-web tests.

## Limitations and follow-up
The playable World is still **128×128**; the macro-continent preview has not yet been converted into cross-page planetary travel. Ocean trophic webs, glaciation, large mountains, ice and true cold biome migrations remain separate systems. No new named animal is hardcoded into the food web. No heavyweight performance testing or full suite is part of this feature pass.

Focused smoke test: `tests/e11-cold-flora.mjs`; workflow checks only touched modules, new cold plant registration, physical habitat founding, genuine eating/propagule collection, warm dieback to litter, save/load and top-down art paths.
