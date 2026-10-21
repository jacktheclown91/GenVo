# Near individual simulation, far population model — October 21, 2026

New planetary worlds record `regional-demography/1`. Visited regions within one region (Chebyshev distance, so the eight surrounding regions) of the player's active region run full individual canonical ticks in lockstep under `synchronized-strides/1`, as before. Farther visited regions run the session biological mode `regional-demography/1`. Worlds without the policy, including all earlier saves, keep every visited region canonical; restore rejects a population-mode region in a world without the policy.

## What the population model is

`src/world/planetary-demography.js` owns mode assignment and scheduling; `src/ecology/regional-demography.js` owns the behavior. A far region is advanced by the **same** staged kernel (`stageRemoteBiology`) as canonical replay: a detached restore, real `Simulation.update` ticks, the same population bound, daily water/salt receipts, identity watermark, biological ledger and atomic publication. The only difference is `update(…,{populationModel:true})`, which replaces the per-individual perception, decision and movement phases with `phaseRegionalDemography`. Everything else in a tick stays canonical: climate, soil, daily vegetation, thunderstorms, wildfire, habitat hazards, metabolism (including thermal load), disease, injury, ageing, lifecycle mortality, gestation, eggs and funded births.

Per life stride, each animal not inside a canonical transition takes at most one canonical-scale opportunity:

- **drink:** +5.2 hydration (the canonical per-stride amount) when below 80% and a reachable drinkable cell lies within 10 cells; the trip is charged out and back;
- **when below 72% energy:** freshwater feeders harvest through `harvestFreshwater`; hunters choose prey with the canonical `bestPrey` and resolve it with the shared `tryKill` capture, damage and bite-meal rule; others take one bite of the best stock their mouth can use within 6 cells through `world.consume`, with the canonical energy conversion and dispersal/history hooks (carrion bites as canonical carrion feeding).

An animal moves to the food or prey it uses and pays the canonical locomotion cost of 0.072 × mass / metabolism per cell. Once a day, eligible females pair with nearby eligible males through the canonical `conceptionAvailability` and `tryMate`, so inherited compatibility, kinship, sex roles, cooldowns and reciprocal mate choice decide conception. Offspring come from `giveBirth`/`spawnFundedOffspring` with real inheritance and mutation.

Animals that are underground, digging, in cave transit, climbing, perched, airborne, diving or ice-immersed keep their state. Their per-tick canonical steps continue, but the population model neither moves nor feeds them. An animal walking underground stays there until its region returns to individual simulation.

## Modes, clocks and seams

- After every crossing, `assignRegionalBiologyModes` demotes far canonical regions and promotes far regions that are near again. Promotion first runs the region's genuine elapsed ticks, so the synchronized scheduler starts level. Both modes share one uninterrupted tick count and `biologicalLedger`; switching changes only how later ticks are computed.
- `advanceDemographicRegions` runs at every stride boundary and advances each due far region by one life stride, keeping far clocks within one stride of the player.
- Paired seam exchange (`planetarySeamTransaction`) now skips far regions under this policy instead of suspending all seams. Boundary ownership (`syncPlanetaryBoundaryOwnership`) already pairs only canonical regions, so an edge facing a far region uses that region's planetary boundary reservoir. Without the policy, the original all-or-nothing behavior is unchanged.
- Individuals are never aggregated, regenerated or reset. Visited regions keep their founding receipt, organisms, genomes, families and history.

## Measurements

The same founded region was stepped canonically and under the population model (Node, same seed):

| | Canonical | Population model |
|---|---|---|
| 70-animal founded region, 40 days: births / deaths | 26 / 4 | 19 / 2 |
| population at day 40 | 92 | 87 |
| mean energy at day 40 | 65 | 73 |
| total plant stock at day 40 | 24,641 | 24,716 |
| cost per simulated day (40-day mean) | 506 ms | 375 ms |
| 195-animal home valley, 12 days, cost per day | 936 ms | 211 ms |

Perception and decision dominate canonical cost and scale with population, so the saving grows with mature regions. Vegetation (~100–125 ms per region-day) and soil now dominate a far region's cost and are unchanged.

Animals under the population model carry more energy and breed somewhat less than canonical animals, because canonical wandering, pursuit and courtship travel are not simulated. This is reported, not tuned away.

## Verification

`tests/regional-demography.mjs` covers:

- canonical births with real parents and inherited bodies over 30 population-model days;
- near and far assignment through real crossings;
- far clocks within one stride, with a continuous ledger;
- live seams while a far region exists;
- global identity ownership;
- exact save/restore and identical continuation;
- promotion on return without re-founding;
- historical-policy behavior and rejection of a forged mode.

E15–E18, preparation, dirty saves, regional records, seam work, founding, direct restore, walkthrough and the playable gate pass. `planetary-paired-seam-salt` (surface-ice fixture) and `planetary-water-seam-ownership` (boundary-water assertion) fail identically on the commit before this change, as previously documented.

## Limits

- The region archive ceiling (16) and resident archive memory are unchanged. This pass bounds per-region CPU, not storage residency or eviction.
- Far-region vegetation and soil cost is unchanged.
- Migration between far regions, within-region wandering and courtship travel are not modelled.
- Distances between pairs are measured on home positions.
- The population model is not used for leased (stored) replay; persisted directories treat far regions as non-canonical and leave them to the resident scheduler.
- Long-run ecological equivalence beyond 40 days is unmeasured.
