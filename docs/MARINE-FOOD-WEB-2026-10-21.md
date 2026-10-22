# Marine food web and open-sea founders — October 21, 2026

New planetary worlds record `marine-food-web/1`. Ocean regions now hold a working food web and can be founded with sea creatures. Before this, seawater had no food: freshwater producers die back in salt, and gills could not refill hydration in it, so oceans were empty. Historical worlds keep their freshwater-only ecology.

## Biomass web (`src/ecology/marine-food.js`)

The marine kinds sit in the same aquatic registry (`FRESHWATER_FOOD`, flagged `marine`) and use the same biomass-field mechanics as fresh water. Their fields live in `world.marineFood` and exist only in worlds that record the policy.

| Kind | Tier | Fed by |
|---|---|---|
| phytoplankton | producer | shared aquatic energy and minerals |
| kelp and seagrass | producer (patchy beds) | shared aquatic energy and minerals |
| zooplankton | consumer | phytoplankton, detritus |
| shellfish beds | consumer | phytoplankton, detritus |
| small marine fish | consumer | zooplankton |

- **Producers** are funded by `fundAquaticGrowth`, the account that funds freshwater producers: photosynthetic energy reserves per producer kind and the cell's minerals. Growth scales with `marineFactor`, a ramp from salinity 0.1 to full at 0.5.
- **Consumers** grow only by transferring their sources' biomass at 20% efficiency. They pay upkeep and return losses as carrion and litter. The freshwater step already recycles carrion and litter into minerals in every water cell, including the ocean.
- **Salinity:** marine kinds die back in fresh water, just as freshwater kinds die back in salt.
- **No additions after creation:** a new world seeds producers and funds its consumer tiers out of producer biomass at the ordinary transfer efficiency.

Over 900 to 2,000 days, the coastal region below cycles as a real predator–prey system. Zooplankton overgraze phytoplankton, crash, and phytoplankton recovers. Shellfish and fish follow, and minerals recycle. Every tier persists. Kelp fills its beds and stays at capacity, as freshwater producers do.

## Feeding

Animals eat the marine fields through the shared aquatic feeding authority (`freshwaterPreference`, `harvestFreshwater`, `bestFreshwaterFood`), so the same mouth functions apply:

| Mouth | Takes |
|---|---|
| sieves and filter mouths | plankton |
| grazing mouths | kelp |
| sucker mouths | zooplankton |
| crushing jaws | shellfish (preference 1.2) |
| jaws | small fish |

Founding (`renewableFood`), carrying, migration and the regional census all read the marine fields through the same accessors.

## Salt gland

`salt-gland` is a new heritable flank organ with native art. It has these properties:

- requires `gill-slits` as a developmental prerequisite;
- mass 0.2, upkeep 0.06, water use ×1.02.

With a salt gland, gills refill hydration in seawater at the full aquatic rate. Without one, the existing rule still applies: gill refill is scaled by `max(0, 1 − 20 × salinity)`.

Mutation offers the salt gland only in worlds recording the policy. Historical lineages cannot gain it.

## Open-sea founding templates (`founding-templates/2`)

The catalog now carries six marine templates. Every one has gills, a salt gland, webbed limbs and a paddle tail.

| Template | Carrier | Mouth | Role |
|---|---|---|---|
| plankton sifter | rillsifter | filter | grazer |
| krill sieve | rillsifter | reed sieve | grazer |
| kelp browser | rillsifter | grazing | grazer |
| tide scavenger | rillsifter | sucker | scavenger |
| shell cruncher | bankjaw | crushing jaw | hunter |
| sea gaper | bankjaw | gape | hunter |

The founding rules work like this:

- **Salinity:** water habitats are now salinity-aware. Marine templates settle only where salinity exceeds 0.1, and freshwater templates only where it is at or below 0.05.
- **Same founding test:** every group must still be supported by renewable food its own anatomy reaches.
- **Receipts:** new receipts record `founding-templates/2`. Version `/1` receipts remain valid.
- **Catalog size:** the land, shore and freshwater set is unchanged at 39 templates.

## Verification

- **`tests/marine-food-web.mjs`**, which checks:
  - the policy is recorded in new planetary worlds and absent in classic worlds;
  - marine biomass exists only in seawater (open sea, coast, inland lake region);
  - all five tiers persist and cycle over 900 days of the real daily aquatic pair;
  - marine life dies back in fresh water;
  - mouths reach the marine web.
  - **Founding on the coast at region (−57600, −18176):** introduces 10 plankton sifters and 4 shell crunchers, every one in seawater, alongside the land founders.
  - **Salt gland:** gland-bearing sifters out-hydrate gland-less ones in seawater after one life stride.
  - **Mutation gating:** no salt gland in 600 mutations without the policy; some with it.
  - **Persistence:** exact save, restore and identical continuation. A historical save restores without marine fields, and a save whose policy and fields disagree is refused.
- **`tests/regional-founding.mjs`:** checks that the land, shore and freshwater set stays approximately thirty, and that an open-sea set exists.
- **Native part catalog:** 93 indexed assets.

## Limits

- **Two marine groups:** on the measured coast, only the plankton sifter and shell cruncher were founded. The other marine templates were eligible but did not fit within the regional founding slots that land templates also compete for.
- **Kelp has no turnover:** kelp beds have no mortality of their own beyond grazing, as with freshwater producers.
- **Ocean regions are far from the start:** the nearest are hundreds of regions from the landing site.
