# Population sustainability — demography evidence (stabilization P0, October 30)

The creator's stabilization brief asks why populations decline and births fall after about day 150, and whether that is ecology or an implementation defect. This report is evidence only: nothing was tuned.

## Method

`tools/measure-population-demography.mjs` (new) runs a new-game world with the full new-game rule stack (`climate-water/6`, `body-size/2`, breeding support and the rest) under autonomous play. Each period it records, per species:
- adults and juveniles by sex, old adults (past 80% of lifespan) and median age;
- adult females free to breed (not carrying, cooldown spent), those the breeding-support gate allows, and those with a reachable compatible mate;
- mating attempts, accepted courtships and conceptions (from `tryMate` receipts);
- births, deaths by cause and life stage, and juveniles that reach maturity.

Three seeds ran for 730 days (receipts in `population-demography-2026-10-30/`), plus targeted probes of the gate's inputs, female energy spending and plant regrowth.

## Findings

**1. Every seed goes extinct or nearly so within two years.**

| Seed | Alive at start | Day 361 | Day 731 | Births, days 1–361 | Births, days 362–731 |
| --- | --- | --- | --- | --- | --- |
| S9-YEAR-2 | 194 | 53 | 0 | 88 | 7 |
| DEMO-A | 189 | 36 | 3 | 33 | 4 |
| DEMO-B | 192 | 30 | 5 | 40 | 9 |

**2. The breeding pipeline narrows at the breeding-support gate, then at mate finding.** Juvenile survival is not the problem: most young that are born reach maturity (54 of 58 mosskips in S9-YEAR-2).

| Seed, day | Adult females | Free to breed | Gate allows | With a reachable mate |
| --- | --- | --- | --- | --- |
| S9-YEAR-2, 61 | 92 | 79 | 10 | 4 |
| S9-YEAR-2, 151 | 86 | 60 | 3 | 0 |
| S9-YEAR-2, 421 | 18 | 8 | 2 | 1 |
| DEMO-A, 31 | 89 | 55 | 0 | 0 |
| DEMO-B, 601 | 9 | 4 | 3 | 1 |

At founding density the gate refuses about 90% of free females. At low density it allows more, but almost none has a compatible mate within reach (an Allee effect). Mating attempts stay at 0–36 per 15 days for about 150 animals.

**3. The founding population exceeds what the vegetation renews.** Measured over the whole start region (S9-YEAR-2), plants regrow about 400–550 energy units a day in the cool first season, while about 190 founders spend roughly 1,350 a day. Animals live off standing vegetation, which runs down, and numbers fall toward what regrowth can carry (about 40–60).

**4. The gate's production estimate does not match the real plant model.** The gate estimates renewable food with logistic regrowth (growth × stock × (1 − stock / carry)). The real vegetation step grows far less: sunmoss regrows about 100 a day region-wide against a logistic estimate of 1,690; thistlepod 80 against 290; dustsage 40–60 against 165. The gate is optimistic about food, so this inconsistency does not explain the refusals; it means the gate measures a different quantity from the plants animals actually eat.

**5. The gate's need is about a third above actual spending.** Need = basal metabolism × 2 (founding activity allowance) × 1.5 (reproductive margin). Adult females actually spend 0.64–0.85 of the basal × 2 figure (about 1.3–1.7× basal) and eat about what they spend, keeping energy reserves at 0.73–0.96. So the gate demands a renewable share of about 2.1–2.4× real spending before breeding.

**6. Hunters can never breed.** For needlejaw the gate counts prey production as prey biomass × capture chance ÷ prey lifespan, which gives 0.3–0.9 energy units a day against a need of 28 (share/need about 0.01). Every needlejaw female is refused in every period of every seed.

**7. Many adult females are on a breeding cooldown.** In year 2, only about half of the adult females are free to breed at any census.

## Interpretation

The decline is partly legitimate ecology: founders start well above the region's renewable food, and an overshoot followed by a decline is expected. Extinction within two years in every seed is not: at the reduced density the region could feed, the population produces almost no young, because of the gate thresholds above and the shortage of mates. The hunter rule (finding 6) is a clear defect: no predator can breed under any conditions. The need overstatement (finding 5) and the production mismatch (finding 4) are inconsistencies between the gate and the bodies and plants it describes. `breeding-support/1` was set by creator direction (October 22), so changes to it await a creator decision.

## Outcome

The creator chose to build both fixes together: `grazing-nutrients/1` and `breeding-support/2` ([design and results](BREEDING-SUPPORT-2-DESIGN-2026-10-30.md)). The re-assessment there also withdraws finding 6 as a defect: realised prey turnover is lower than the gate assumes, so predators genuinely cannot breed at these prey numbers. With both rules, reproducing populations persist through two years in all three seeds (37, 92 and 87 alive at day 731, against 0, 3 and 5).

## Not yet

- Active against archived regional populations (the brief asks for both); these fields stay in the start region.
- Cooldown sources (finding 7) and mate-search radius against real densities.
- Plant growth limits: why sunmoss regrows at about 6% of its logistic rate (temperature, moisture or the perennial-regrowth rule).
