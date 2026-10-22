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

## Full-year evaluation

Six arms were run for 366 days on `PLANET-OBS-2` and `PLANET-OBS-3`, with every other default identical ([datasets, runner and summary](test-runs/observatory-2026-10-22/plant-lifecycle/)):

- **baseline:** lifecycle off;
- **base:** `plant-lifecycle/1` as committed;
- **dormancy:** senescence scaled by the kind's temperature response, so dormant tissue holds;
- **chronic:** drought stress only below a moisture fit of 0.5, reaching zero at that fit;
- **combined:** dormancy and chronic together;
- **lean:** combined, plus senescence counting only turnover beyond the 0.4%-per-day maintenance loss the growth rule already returns to litter.

Variants are a runtime experiment switch (`setLifecycleVariant`) that is never saved. The default is `base`.

| Day 366 (OBS-2 / OBS-3) | Plant biomass | vs baseline | Rotcap | Animals | Starvation deaths |
|---|---|---|---|---|---|
| baseline | 14,663 / 12,465 | — | 3,153 / 1,857 | 529 / 618 | 80 / 58 |
| base | 8,031 / 6,133 | −45% / −51% | 7,686 / 4,649 | 196 / 288 | 245 / 234 |
| dormancy | 8,418 / 6,727 | −43% / −46% | 7,741 / 4,833 | 264 / 355 | 248 / 202 |
| chronic | 9,589 / 8,325 | −35% / −33% | 7,620 / 4,685 | 338 / 451 | 279 / 211 |
| combined | 10,549 / 8,566 | −28% / −31% | 7,337 / 4,505 | 298 / 640 | 324 / 131 |
| lean | 12,387 / 9,859 | −16% / −21% | 7,495 / 4,350 | 310 / 649 | 82 / 146 |

### Findings

1. **No variant improves habitat differentiation.**
   - In every arm, including the baseline, at most 2.3% of plant biomass sits on chronically unsuitable ground (moisture fit below 0.25). Germination's existing site gate already keeps plants off truly wrong ground.
   - Where poor-fit biomass does occur (OBS-3: marshroot 47% and woodspire 20% in the baseline), every variant leaves the same or a worse share (marshroot 40–52%, woodspire 23–36%).
   - The biomass-weighted moisture fit is unchanged between arms. It falls from 0.77 to 0.63 in all arms on OBS-3, because the habitat itself changes.
   - Drought stress mostly shrinks marshroot everywhere (167–170 in the baseline against 25–72 with stress). It does not concentrate it on good ground.
   - The `moisture` field may not represent a wetland plant's real water access, such as surface-water proximity. That is a likely reason stress misjudges marshroot.
2. **Senescence magnitude, not its timing, drives the biomass loss.**
   - Dormancy recovers only 3–5 points.
   - Removing the double-counted maintenance loss (`lean`) recovers most of it.
   - Even `lean` loses 16–21% and lowers sunmoss, the main groundcover, sharply (to 4,545 and 1,715). The baseline also declines (to 5,925 and 4,420).
3. **Decomposers benefit in every variant.** Rotcap is 2.3–4× higher, which was the original reason for proposing turnover.
4. **Animals:**
   - `base`, `dormancy` and `chronic` roughly halve animal populations and triple or quadruple starvation.
   - `lean` is close to the baseline on OBS-3 (649 animals against 618) but lower on OBS-2 (310 against 529).
   - Starvation is near the baseline on OBS-2 (82 against 80) and higher on OBS-3 (146 against 58).

## Options for the creator

| Option | What it does | Measured tradeoff |
|---|---|---|
| **A. Keep off** (status quo) | No change. | Decomposers stay underfed; plants rarely die except by grazing, fire and existing maintenance loss. |
| **B. `lean` as a versioned `plant-lifecycle/2`** | Dormancy-aware turnover beyond existing maintenance; stress only on chronic mismatch; flowering gate. | Decomposers 2.3–4× higher; biomass −16% / −21%; animals mixed (−41% / +5%); starvation +2% / +150%. No gain in habitat differentiation. |
| **C. Turnover only, no drought stress** (to be measured) | `lean` without the stress term; leave niche failure to a competition pass. | Expected near `lean` for biomass and decomposers (stress removed only about 6,000 and 3,000 units over the year), without misjudging wetland plants. Not yet run. |

**Recommendation:** do not enable any variant for the jam build. If decomposer support matters before then, option C is the safest candidate, but it needs one matched run first.

Habitat differentiation is not achieved by moisture stress. It belongs to the creator's planned competition pass (root, light and nutrient competition with inherited traits), probably with a better wetland-water signal than `moisture`.

### Open decisions

- Is decomposer support worth a 15–20% standing-biomass reduction?
- Should drought stress be dropped in favour of competition?
- Which water signal should wetland plants use?
- Should the flowering gate (moisture × temperature fit ≥ 0.5) stay? Its effect was not isolated in these runs.
