# Plant lifecycle candidate — October 22, 2026

`plant-lifecycle/1` is an **opt-in candidate**. No world records it by default, so gameplay is unchanged. It follows the creator's botanical direction: unsuitable plants should fail naturally rather than just grow slowly everywhere.

## Mechanisms (`src/ecology/plant-lifecycle.js`)

- **Drought stress.** Daily tissue death equals tissue × 0.02 × (1 − moisture fit), where moisture fit compares the plant's inherited water need with habitat moisture. Chronic mismatch kills; seasonal cold is treated as dormancy.
- **Senescence.** Tissue turns over at growth rate × 0.25 per day: fast groundcover is short-lived and woody tissue long-lived. Losses go to litter, and regrowth stays funded by water, minerals and stored energy.
- **Flowering conditions.** Flowers, pollen and local seed release need a site fit (moisture × temperature, the same fit germination uses) of at least 0.5.

## Why it is not on by default

The policy was measured over 120 winter days on `PLANET-OBS-2`, against the same world without it:

| Day 121 | Without | With |
|---|---|---|
| Sunmoss | 12,993 at day 31, rising | 5,969 |
| Woodspire | 1,558 at day 91, rising | 402 |
| Marshroot | about 370 | 77 |
| Cumulative litter | about 25 | 36,191 |
| Rotcap (decomposers) | 1,555 at day 91 | 5,860 |

- **Too broad:** standing biomass falls across all plants, not only in unsuitable habitat.
- **Winter imbalance:** senescence continues through winter while growth is temperature-limited.
- **Stress targeting works:** marshroot loses ground, as intended.

## Open questions

- Does spring growth restore balance over a full year?
- Should turnover pause in dormancy?
- Are the 0.02, 0.25 and 0.5 constants right?

These are decisions for the creator. They should be settled through matched observatory runs before any default change.
