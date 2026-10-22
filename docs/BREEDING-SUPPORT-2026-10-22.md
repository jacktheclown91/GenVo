# Shared breeding support — October 22, 2026

New planetary worlds record `breeding-support/1`. Whether an animal's surroundings can fund reproduction is now decided by **one rule for every living body**: founders, evolved descendants, hybrids and new lineages alike. It replaces the species-named forage minimums and optimums, including the provisional overrides in `breeding-calibration.js` for rillsifter, mirelick and podshell; hunter prey counts and radii; crowding caps; and drive scales and recovery boosts.

Historical worlds keep the legacy calibration unchanged, for comparison and save compatibility.

This follows the creator's design correction: no creature may be able or unable to do something because of its species name. No species was tuned to survive. Extinction remains possible.

## The rule (`src/ecology/breeding-support.js`, used by `carrying.breedingState`)

- **Production:** food this body's anatomy can renew each day around it, taken from the accessible-food survey the breeding check already performs:
  - logistic regrowth of the plants its mouth eats;
  - net growth of the water food its mouth and body can reach, which respects `aquatic-foraging/1` water-only scoring for water dwellers;
  - carrion inflow;
  - for bodies that can hunt, prey turnover: prey tissue energy × preference × the hunter's actual capture likelihood, divided by the prey's lifespan.
- **Share:** production divided among local consumers whose diets genuinely overlap (consumer-equivalent dietary demand, within 10 tiles). Competition, not a species cap, limits crowding.
- **Need:** the body's own anatomical maintenance (the daily need from resource founding: basal cost of its anatomical mass × activity), times one shared reproductive margin of 1.5.
- **Decision:** breeding is supported when the share exceeds that need. Drive rises with the surplus. Nothing creates food or guarantees reproduction.

Energy, maturity, mate choice, kinship and gestation gates are unchanged. The reproductive margin (1.5) and the 10-tile radius are shared proposals, not species values.

## Verification

- **`tests/breeding-support.mjs`** (in the playable gate):
  - eight unrelated anatomies, plus coastal land, shore and open-sea founders, are all decided by the same rule (allowed exactly when the share exceeds the need);
  - food is shared among overlapping consumers;
  - an identical, fully grown body relabelled with another founding name gets identical support;
  - changing the mouth changes the food reached, and a heavier body needs more;
  - poorer ground and added competitors reduce support;
  - legacy worlds keep the old calibration;
  - exact save, restore and continuation, historical restore, unknown-policy rejection.
- **Day-30 snapshot** (`PLANET-OBS-2`), median support ratio and mature animals allowed:

  | Body | Median support ratio | Allowed (shared rule) | Allowed (legacy) |
  |---|---|---|---|
  | Grazers (mosskip, rootling, genvo) | 3.3–4.0 | all | most |
  | Mirelick | 1.45 | 14 of 18 | 2 of 18 |
  | Podshell | 1.21 | 13 of 18 | 13 of 18 |
  | Hunters (needlejaw, bankjaw) | 0.06–0.32 | few | most, but their energy was below the breeding gate anyway |
  | Rillsifter shoal | 0.05 | 6 of 18 | 5 of 18 |

  The rillsifter result means a narrow river's renewable production cannot fund 18 filter feeders, which is consistent with their later starvation. Births by day 31 were 54 against 26.
- **Matched 300-day natural runs:** OBS-1/2/3, `shared` against `legacy`, with every other default identical ([datasets and analysis](test-runs/observatory-2026-10-22/breeding-support/)):

  | Seed | Population d100 / d200 / d300 (S vs L) | Plants d300 (S / L) | Starvation (S / L) | Rillsifter (S / L) | Bankjaw (S / L) |
  |---|---|---|---|---|---|
  | OBS-1 | 227 / 390 / 638 vs 211 / 266 / 286 | 9,376 / 11,179 | 41 / 33 | survives / extinct d171 | survives / survives |
  | OBS-2 | 272 / 390 / 534 vs 245 / 302 / 339 | 26,207 / 27,082 | 63 / 32 | survives / extinct d249 | survives / survives |
  | OBS-3 | 280 / 238 / 459 vs 258 / 232 / 296 | 12,433 / 12,919 | 56 / 34 | extinct d165 / extinct d287 | survives / extinct d104 |

  - **Broader success.** Mirelick, rillsifter and hunters persist more often, and no crash occurred in either arm.
  - **Larger populations.** They were still rising at day 300, with plant biomass 3–16% lower and starvation higher. Crowding is now limited only by food sharing and regrowth, not by species caps.
  - **Sustainability not yet established.** Whether food regulation settles these populations or overshoots into a crash needs a longer run; 300 days is not enough to call it.
  - **Cost.** Simulation time per day rises with the larger populations (2.2–4.2 s against 1.8–2.7 s after day 250).

## Remaining carrier dependency

The test exposed one: **juvenile growth**, and therefore current body mass and need, still reads the species record's `maturity`. Adult need is anatomical; a young body's need depends on its founding name.

That dependency, together with lifespan, litter, gestation, the breeding energy gate and others, is recorded as an explicit future task in the [development plan](../design/FULL-GAME-DEVELOPMENT-PLAN-2026-10-21.md#4-creature-evolution-and-anatomy). It is not attempted before the jam build.
