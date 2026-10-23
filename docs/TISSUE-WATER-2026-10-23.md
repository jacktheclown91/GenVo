# Water from prey and carrion (October 23, 2026)

**Creator decision:** fresh animal tissue carries water, in proportion to the tissue actually eaten, from finite existing resources, under the same rules for player and wildlife. Carnivores still drink when they need to and can; tissue water only reduces how often. Keep the approved 3.5-day water reserve. Compare the baseline, meat water alone and a 5-day reserve separately before combining anything. Adopt meat water as the default for new worlds only if it resolves the water-access problem without breaking biological or resource constraints.

## What was built

`src/ecology/tissue-water.js`, policy `tissue-water/1`, saved with each world. It goes through the existing hunting, carcass and carrion code.

- **Bites from living prey.** A bite carries the eaten share of the prey's current water. The prey loses exactly that, and the predator gains it up to its capacity. Water beyond capacity is lost, never stored. This covers wildlife wound bites, kill meals in both mass models, and the player's kills.
- **Carcasses.** On death, a body's remaining water stays with its tissue in `world.carrionWater`, a per-tile array that exists only on worlds with this policy. It is saved and restored when present, so old saves are unaffected.
- **Carrion.** Scavengers take the share of a tile's water that matches the tissue they eat. This covers wildlife bites and the player's Eat.
- **Drying.** Once a day, carrion water dries by 35% scaled by warmth, and it is capped at what the remaining tissue can hold. It never outlasts the tissue.
- **Drinking is unchanged.** Every animal, carnivores included, still seeks and drinks water by the same rules.
- **Ledger.** `sim.stats.tissueWater` records water from prey, water deposited in carcasses, water from carrion, water dried, and water lost when the eater was already full.

**Not covered yet:**
- food carried to shelters does not take its water with it;
- the remote regions' population model does not track carrion water.

## Evidence

**Gate:** 101 of 101 checks pass, so recorded worlds are unchanged.

**`tests/tissue-water.mjs`** (gate) checks that:
- a quarter of the tissue moves a quarter of the prey's water, to the exact unit;
- a full predator gains nothing;
- death moves water into the carcass without creating any;
- half the carrion carries half its water;
- carrion dries within days and never outlasts its tissue;
- hunting returns water, and hunters still chose to drink 726 times in 6 days;
- saves keep the policy and carrion water;
- worlds without the policy keep dry meat.

**Three 360-day arms**, same seed (GENVO8-TEST-A), all with 30-second days, real needs and food properties ([baseline](tissue-water-2026-10-23/arm-v1f-360d.json), [meat water](tissue-water-2026-10-23/arm-v1fm-360d.json), [5-day reserve](tissue-water-2026-10-23/arm-v1f5-360d.json)):

| Arm | Alive at day 61 | Births | Thirst | Starvation | Predation | Alive at day 361 |
|---|---|---|---|---|---|---|
| Baseline | 3 | 3 | 74 | 38 | 53 | 0 |
| Meat and carrion water | 0 | 12 | 84 | 38 | 57 | 0 |
| 5-day water reserve | 8 GenVo | 31 | 95 by day 61, 109 in all | 28 | 52 | 1 |

**Water conservation in the meat arm** balances:
- carcasses received 2,956 units of water;
- of that, scavengers drank 217 and 2,739 dried, leaving almost none standing;
- prey offered 7,215 units, of which 4,733 were lost because the predators were already full.

## Why the ecosystem still collapses

Thirst deaths come from every species, not mainly hunters (`tools/probe-thirst-deaths.mjs`, 40 days). They include:
- 24 mosskip, 9 podshell, 6 rootling, 3 mirelick;
- 8 needlejaw and 3 bankjaw (the hunters);
- 31 GenVo.

Many died standing on wet ground or fleeing, with no reachable open water.

`tools/probe-water-census.mjs` shows why. On this world the water is fresh all year, but **all 512 water cells freeze over from about day 29 to day 41**, through late winter into early spring, and with them every drinkable bank. That is about 12 days with no drinkable water at all. With a 3.5-day reserve, any animal that depends on drinking cannot outlast it unless food gives it water, and in winter juicy plants are scarce. On PLANET-OBS-2 the river turns salty within the first day, a separate, permanent shortage on that world.

## Decision

Meat and carrion water behaves consistently and conserves water, but **it does not resolve the access problem**: the binding constraint is frozen water in winter, and on some worlds salt. Following the creator's rule, it is **not adopted as the default**. It stays opt-in with the other new rules (`?day=30`).

**Next step** (creator direction: when water is frozen, life must migrate, go dormant, break ice or find water another believable way): winter water. Animals can take water from snow and ice at a real cost, the energy to melt it in the body, drawn from the world's finite snow and ice. Where anatomy allows, they can also break thin ice at the edge of open water. This makes winter a real test of reserves, shelter and anatomy, rather than a 12-day period with no water anywhere, and it is the creator's central winter objective. The 5-day reserve arm suggests tolerance matters too (births 31 against 3), but per the creator's rule it needs independent evidence before any change.
