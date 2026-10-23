# Own-body reserves (October 23, 2026)

**Creator decision:** option (b) from [the yields step](YIELDS-2026-10-23.md). Calibrate each animal's resting cost to its own body, so every animal lasts 15 days. Keep the recorded growth cost for now. Measure it as its own step.

## What changed

**`metabolism/fasting-2`** (`src/ecology/metabolism-policy.js`):
- Each animal's resting cost is calibrated to its own body, so full reserves last 15 days of food and 3.5 of water at rest whatever its size or anatomy.
- Under `fasting-1` the species' reference body was calibrated, and founding wild bodies weigh 1.3–1.6 times that, so their reserves lasted about 9 days.
- New real-needs worlds get `fasting-2`. Worlds saved under `fasting-1` keep it. `metabolism:'fasting-1'` selects it for comparison runs.
- Heat, cold, aridity, sleep and torpor, young exposure and inherited metabolism still modify resting cost. Body size and anatomy no longer do.

**Tissue energy** (`tissue-energy/1`):
- Growing and repairing tissue keep the recorded cost (34 per unit), by creator decision.
- `sim.correctionExperiment.tissueGrowth=true` (development only) applies the physical cost.

**Tests:**
- `tests/body-reserves.mjs` (gate) checks that:
  - every animal in a new world, including bodies well above their species reference, lasts exactly 15 days of food and 3.5 of water at rest;
  - under `fasting-1` a heavy wild body lasts less;
  - both rules survive saves.
- `tests/tissue-energy.mjs` checks the recorded growth cost and the switch.

## Evidence

**First 40 days, three seeds.** Both arms have every earlier correction and tissue energy, with the recorded growth cost. The only difference is the metabolism rule ([data](body-reserves-2026-10-23/)):

| Seed | Rule | Alive at day 41 | Births | Starvation | Thirst | Predation |
|---|---|---|---|---|---|---|
| GENVO8-TEST-A | reference body | 58 | 19 | 88 | 28 | 38 |
| GENVO8-TEST-A | **own body** | **186** | 43 | 19 | 8 | 25 |
| PLANET-OBS-3 | reference body | 72 | 14 | 59 | 23 | 21 |
| PLANET-OBS-3 | **own body** | **164** | 34 | 19 | 4 | 10 |
| PLANET-OBS-2 | reference body | 57 | 12 | 41 | 59 | 18 |
| PLANET-OBS-2 | **own body** | **149** | 34 | 6 | 21 | 16 |

With own-body reserves, every species except the rillsifter is alive at day 41 on all three seeds.

**360 days, GENVO8-TEST-A** ([reference body](body-reserves-2026-10-23/arm-v1fw+e+t-B-360d.json), [own body](body-reserves-2026-10-23/arm-v1fw+e+t-360d.json)):

| Day | Reference body: alive | Own body: alive | Own body: births so far | Own body: starvation so far |
|---|---|---|---|---|
| 31 | 67 | 183 | 30 | 13 |
| 91 | 45 | 239 | 141 | 39 |
| 151 | 36 | 188 | 217 | 137 |
| 211 | 33 | 96 | 233 | 219 |
| 271 | 33 | 28 | 240 | 257 |
| 361 | 32 GenVo | 4 | 242 | 263 |

## Why it still fails after about day 100

The own-body world grows to 248 animals by day 106, then starves down. It keeps starving at low density, while 8,000–9,000 units of sunmoss stand on the map.

**Where food is left matters, not how much** (`tools/probe-grazing-bands.mjs`, [output](body-reserves-2026-10-23/grazing-bands-GENVO8-TEST-A.txt)):
- Grazers must drink every two to three days, so they feed within reach of water and strip that belt.
- Day 1: sunmoss averages 0.63–0.71 in every band from water, with no bare tiles.
- Day 151:
  - within 6 tiles of water, 0.12 on average and 64% of tiles bare;
  - 6–12 tiles, 0.19 and 50% bare;
  - beyond 35 tiles, 0.68 and none bare.
- Plant growth is logistic (proportional to the amount present), so a grazed-out tile barely regrows. Total sunmoss recovers only from 7,700 to 8,950 over 140 days of almost no grazing (`tools/probe-plant-demand.mjs`, [output](body-reserves-2026-10-23/plants-300d-GENVO8-TEST-A.txt)).
- Starvation by species and month: mosskip, GenVo and rootling, from day 91 on ([data](body-reserves-2026-10-23/deaths-240d-GENVO8-TEST-A.json)).
- Rillsifters still die out in the first month (11 starved in the first 30 days); their algae are eaten out, as before.

**Contributing:** births run to 141 in 90 days, past what the land carries. Breeding support still computes needs on the old metabolism (`founderDailyNeed`), which assumes about a fifth of real needs.

## Decision

**Own-body reserves are the largest improvement so far:** about three times as many animals alive after 40 days, on all three seeds. They stay opt-in with the other v1 rules until the ecosystem holds over a year.

**Next candidates, each to be measured on its own:**
1. **Regrowth from grazed ground.** Grazed perennial plants regrow from roots and seed rain, not from nothing. Logistic growth with no floor leaves the near-water belt bare.
2. **Breeding and founding estimates on real needs.** This would stop the overshoot (option 4).
3. **Rillsifter food.** Algae are eaten out within a month.
