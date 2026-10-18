# Phase 2 — population accounting investigation (October 15, 2026)

**Verdict: the simulation's population accounting is correct. The three failing suites used an obsolete hardcoded starting population.**

## Invariant and authorities traced

Invariant checked by `tools/ecological-integrity.mjs`:

> living creatures = initial population + `stats.births` − `stats.deaths`

| Transition | Path | Accounting |
| --- | --- | --- |
| Initial population | `Simulation` constructor spawns `CFG.initial` per species | — |
| Births | Every in-simulation creature creation is `spawnFundedOffspring` → `spawnAnimal` (live birth and hatched eggs alike) | `stats.births++` once per child |
| Deaths | `alive=false` is set only in `kill()` (starvation, predation, age, disease…) | `stats.deaths++` once; guarded by `if(!a.alive)return` |
| Removal | No path splices, filters or reassigns `sim.animals` except construction and save restore (`sim.animals=snapshot.animals`) | — |
| Save/load | Restore keeps the array and the `stats` together | Verified below |

There is no migration-out, despawn or inactive-region transfer of creature objects in the current source. The regional-ecology and migration systems move live creatures or note events; they do not add or remove animals.

## Measured

- **Starting population is 196 in every world**, with or without the player: `CFG.initial` = mosskip 64, rootling 32, needlejaw 12, genvo 24, rillsifter 18, mirelick 20, podshell 18, bankjaw 8. The tests hardcoded **132**, which is the total before the four aquatic species (64 creatures) were added.
- **Long natural runs with the real starting count:**

| Run | Length | Births | Deaths | Save/load round trips | Checks | Worst mismatch |
| --- | --- | --- | --- | --- | --- | --- |
| No player | 1 year | 22 | 0 | 1 | 192 | **0** |
| With player | 1 year | 7 | 0 | 1 | 192 | **0** |
| No player | 3 years | 76 | 25 (6 predation, 19 starvation) | 4 | 144 | **0** |

## Change

The three suites now read the real starting population from the world they construct, instead of a hardcoded 132. The assertion itself is unchanged and just as strict.

| Suite | Result |
| --- | --- |
| `tests/engineer-colony-natural.mjs` | **now passes** |
| `tests/engineer-natural-regional-observation.mjs` | **now passes** |
| `tests/autonomous-soil-engineering.mjs` | Gets past every population and digging assertion; now fails at line 87 (see below) |

No simulation source was changed.

After the change, a full 201-suite sweep had **38 failing** (down from 40). The two suites above now pass, and there are no new failures.

## The remaining `autonomous-soil-engineering` failure is a seed-outcome expectation, not a defect

Line 87 expects naturally disturbed soil to increase seed-pod biomass in seed `NATURAL-ENGINEERS-A`; both worlds end bit-identical. Instrumented over 60 days:

- 3,902 seed-pod germination attempts and 8 dug cells.
- **No germination attempt on a dug cell got past the seed-bank / existing-plant / habitat-fit gates** to the point where disturbance is consulted.
- Where disturbance can apply, establishment there is bounded by seed supply (`min(seed amount, …, establish × rate)`), so the rate boost has no effect.

The control world's override is genuinely in effect: same instance, retained for the whole run.

The disturbance rule works as written. This world just never meets the conditions under which it helps. `docs/TEST_INVENTORY_AND_POLICY.md` classes this suite as a legacy seeded scenario: seed-specific outcomes are not universal requirements. Per "guarantee rules, not outcomes", the assertion is **left unchanged** pending a creator decision.

Separately, the suite's worker budget is 65 s, but the child run takes about 160 s. Before this fix the child failed fast on the stale population check, so the budget was never reached.

## Creator decisions needed

1. Soil-disturbance test: should it assert the rule (disturbance raises the establishment rate when germination is rate-limited) rather than a seed-specific biomass outcome?
2. Should disturbance also help when establishment is seed-limited? The code comment suggests prepared ground helps seeds "that actually arrive", but the cap means it often cannot.
3. Raise the 65 s worker budget, or shorten the scenario?
