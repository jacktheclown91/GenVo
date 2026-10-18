# Creature decision-coordination audit (October 16, 2026)

**Scope.** A read-only audit, the first step you proposed for an ecological-intelligence layer: where do creatures' existing decision systems fail to combine opportunities they legitimately have? It starts with Stalker hunting, then covers mate-finding over distance and foraging (including water).

**No source code was changed.** The audit added only diagnostic tools (`tools/chase-trace.mjs`, `movement-rate-audit.mjs`, `mate-search-trace.mjs`, `forage-search-audit.mjs`, `drink-trip-audit.mjs`) and evidence in `docs/decision-audit/`.

**Rules for reading this.**

- **Observations only.** All numbers come from natural runs of the current working tree (Phase 3J defaults, no player unless stated); they are not acceptance.
- **Candidate fixes are behaviour-level only.** They change what an organism considers, remembers or attempts, using information it could sense. None adds food, guarantees an outcome or rescues a population.
- **Nothing is implemented.**

## Summary

| # | Coordination failure | Main evidence | Effect |
| --- | --- | --- | --- |
| 1 | **Wildlife lives on a slower clock than the player.** Ambient movement and decisions run on the 8-per-day ecology step, while the player moves in real time | A wild GenVo walks 1.5 tiles per game day; the same body under player control walks 13.4 | Plans that need tens of steps (chases, mate trips, water trips) are re-decided every step and abandoned after 2–3 |
| 2 | **Prey flee predators by presence, not by behaviour** | 289 of 290 mosskip water trips abandoned for a Stalker were for one *not* hunting that mosskip | Prey lose drinking and feeding time to harmless predators; hunting predators are detected at 5 tiles and outpaced |
| 3 | **Unrelated conspecifics count as predators** (cannibalism in the diet model) | 47 of 59 Stalker mate-search escapes fled the chosen partner itself; 200 of 917 released chases ended fleeing another Stalker | Stalkers can't approach each other to mate; hunts break off |
| 4 | **No commitment to multi-step goals** | Chases last a median 2 ecology steps; mate searches 2–3 | Even reachable goals are released before completion |
| — | Foraging search | Hungry adults' food search finds food every time, within 0.5 tiles | **Not a failure** for grazers |

## 1. Two clocks: wildlife at about 1/9 of the player's pace

**What the code does.**

- `Simulation.update` returns early unless `tickCount % CFG.lifeStride === 0` (`src/sim/simulation.js:175`). So decisions, movement and metabolism run on 8 ecology steps per 48-tick day.
- `phaseMovement` (line 301) moves each animal `speed / simHz × moveScale` per call. `moveScale` compensates the distance level-of-detail stride, but not the 5 ticks skipped between ecology steps.
- The player moves through `playerControlStep` at 64 Hz, at its real listed speed. So do Stalkers engaged in a player encounter: v1.28.0 moved them to real time because, on the life stride, "in real time they covered about one sixth of their listed speed" (README line 659).

**This is a stated design.** `docs/SIMULATION_SPEC.md:10`: "8 ecology/lifecycle steps per simulated day, distributed across a slower 48-tick day for readable real-time pacing."

**Measured** (`tools/movement-rate-audit.mjs`, one game day, straight unobstructed lane):

| Body | Tiles per game day |
| --- | --- |
| Player GenVo, manual walk | **13.4** (listed 2.15 tiles/s × 6 s ≈ 12.9) |
| Identical wild GenVo, walking to a far target | **1.46** (8 movement calls, with ambient pauses) |
| Stalker in a wild chase | about 0.46 tiles/s; its prey about 0.36 (`tools/chase-trace.mjs`) |

**Why it breaks coordination.** Spatial thresholds are set in tiles that fit a real-time body, not a 0.3-tile ecology step:

| Threshold | Size |
| --- | --- |
| Prey flight | 5 × senses tiles |
| Hidden by cover beyond | about 3 tiles |
| Hunting range | 26 × senses |
| Mate search | 18–84 tiles |
| Starting gap at the start of a chase | about 5.8 tiles |

- A chase closing at about 0.06 tiles per step needs about 80 steps (about 10 game days).
- A Stalker 14 tiles from its partner needs about 50 steps.
- Animals re-decide every step, so these plans almost never complete (sections 3–4).

**Candidate directions** (each would be a deliberate pacing decision):

- **(a) Move wildlife the distance its elapsed time allows** (× `lifeStride` per step), with per-distance costs unchanged. Wild and player movement would then share one clock. Movement energy per day would rise about 6×, so the ecology would need recalibrating.
- **(b) Keep the slow clock and scale wildlife spatial thresholds to it:** flight radius, chase and search horizons.
- **(c) Keep both and add plan commitment** (section 4), so multi-step goals survive many steps.

(a) is the only one that makes "same rules" literally true in time as well as in cost.

## 2. Prey react to presence, not to behaviour

**What the code does.** In `phaseDecision`'s threat block (`src/sim/simulation.js:242`), an animal flees the nearest animal for which `isPredatorTo(b, a)` holds within `5 × senses × threatSenseEffect` (scaled by the hunter's stealth). Whether that predator is hunting, drinking, resting or chasing something else doesn't matter. Fleeing comes first in the decision order.

**Measured** (`tools/drink-trip-audit.mjs`, seed DRINK-A, adults' water trips):

| Species | Trips | Ended in a drink | Abandoned for escape | Steps to drink (when it happened) |
| --- | --- | --- | --- | --- |
| Mosskip | 1,747 | 20% | 1,388 | 20 (2.5 days) |
| Rootling | 273 | 35% | 178 | 32 (4 days) |
| GenVo | 270 | 48% | 132 | 20 |
| Mirelick | 229 | 25% | 172 | 18 |

Trips start a median of only 0.9–1.2 tiles from the water. In a 60-day sample of mosskip escapes, here's what the Stalker was doing:

| Stalker doing | Escapes |
| --- | --- |
| Exploring | 238 |
| Drinking | 33 |
| Hunting another animal | 18 |
| **Hunting that mosskip** | **1** |

In chases (`tools/chase-trace.mjs`), prey were fleeing about 70% of the time.

**Effect.** Prey pay heavily in water and feeding time for threats that aren't there. Because detection (5 tiles) is far larger than a hunter's step (about 0.35 tiles), a hunting predator is seen long before it can close.

**Candidate fix (threat appraisal):** flee on observable threat behaviour, not presence:

- the predator is approaching (closing distance over the last step or two) or oriented toward me;
- it's within a short close-alarm distance regardless;
- a fleeing neighbour raised an alarm (the existing `social.alarmResponse`).

Everything here is perceptible motion. Better appraisal could be a heritable trait (sensory and nervous anatomy) with a cost.

## 3. Conspecifics treated as predators

**What the code does.** `preyPreference` (`src/ecology/functional-diet.js:60`) deliberately allows unrelated cannibalism ("respect immediate relatives, not a forever-immutable species label"). So `isPredatorTo(stalker, otherStalker)` is true (preference 0.88), and the threat block makes Stalkers flee each other.

**Measured.**

- **Mate search** (`tools/mate-search-trace.mjs needlejaw`, NJ-A and NJ-C):
  - 153 episodes produced 0 mating attempts;
  - median start distance 14 tiles, median 2 steps, about 0.2 tiles closed;
  - 59 ended in escape, 47 of those from the chosen partner itself.
- **Chases:** 200 of 917 released chases on NJ-A ended fleeing "another Stalker".

**Effect.** Stalkers can't approach each other to court, the last of the barriers behind zero Stalker births (Phase 3J Step 3).

**Candidate fix (cannibalism appraisal):** an animal doesn't treat a conspecific as a threat unless it shows hunting behaviour toward it. A courting conspecific (intent `mate` aimed at me, a display) signals the opposite. The same perceptible-behaviour rule as section 2. Cannibalism remains possible when a hungry animal actually hunts.

## 4. No commitment to multi-step goals

**What the code does.** Every ecology step re-runs the decision cascade from the top: threat, thirst, then the hunting branch at line 277 (`bestPrey` re-scored), food, then mate (`autonomousMateTarget`, line 381, near then far). Except for food (`committedFoodTarget`), nothing keeps a goal across steps.

**Measured.**

- **Chases** (3 seeds, 150 days):
  - 236–943 per seed, median 2 steps;
  - mean start distance 4.5–6.1 tiles, closest approach 4.3–5.7;
  - 2.8–5.7% reach contact.
  - Of released chases on NJ-A, 517 went straight to another hunt.
- **Mate searches (GenVo):** median 3 steps, about 0.13–0.25 tiles closed. 101–150 switched straight to another mate target, and 139–152 ended because the partner was no longer ready.
- **Phase 3J test:** a narrow "keep chasing the current perceptible prey" rule halved switching but didn't raise contacts. That's consistent with section 1: committing to a goal you can't reach at 0.06 tiles per step doesn't help.

**Candidate fix:** a small, explicit plan state (goal, target, expected steps, abandon conditions) carried across steps:

- **Abandon conditions** must come from sensed facts: target lost from perception, a real threat (section 2), a more urgent need crossing its threshold, or the plan exceeding its own expected duration.
- **Only after section 1.** This is the "utility or goal-planning, not a language model" layer you described. Do it after deciding the pacing question, or it inherits the same unreachable horizons.

## Implemented: behaviour-based threat appraisal (sections 2 and 3)

**Status: on by default, `?threatAppraisal=0` restores presence-based flight. Not creator accepted, uncommitted.**

**The rule** (`src/ecology/threat-appraisal.js`, used by the single threat check in `Simulation.phaseDecision`). A predator-capable animal inside the flight radius counts as a threat only when the animal can perceive that it is one:

- it is in a hunting posture (hunting, stalking, chasing, winding up, charging, recovering from a charge, mobbing) **and facing** this animal (within 60°); or
- it is within **1.6 tiles** and not itself visibly fleeing.

A member of the same species that is courting this animal, or being courted by it, is never a threat. Shared alarms, hunting, capture odds and cannibalism are unchanged. The 1.6-tile close alarm and 60° facing cone are proposals.

**Refinement during measurement.** The first version still sent 34 Stalker mate searches on NJ-A into flight. In 32 of them the partner was itself fleeing something within close range, and the seeker took fright too, so a visibly fleeing animal no longer triggers the close alarm. With that, escapes from the partner fell to 1.

**Tests.**

- `tests/threat-appraisal.mjs`: each rule, plus integration through the real decision step. A mosskip carries on beside an exploring Stalker and flees one hunting it and facing it.
- Five fixtures that staged an idle predator and expected flight now stage it hunting and facing the prey: `escape-path`, `perceived-threat-escape`, `habits`, `refuge-parity` (the last two also refresh only the animal under test), and `consolidation-demand-parity` (switch off).

**Fast tier:** 369 pass, 0 new. **Full suite:** 378 pass, 7 known (unchanged), 0 new failures of 385 (`docs/test-runs/all-threat-appraisal-2026-10-16.json`).

### Before and after (same tools, seeds and lengths; files in `docs/decision-audit/after/`)

**Water trips (DRINK-A, 120 days).** Share of trips ending in a drink:

| Species | Before | After |
| --- | --- | --- |
| Mosskip | 20% | **59%** |
| Rootling | 35% | 89% |
| GenVo | 48% | 83% |
| Mirelick | 25% | 91% |
| Podshell | 60% | 95% |

Trips abandoned for escape fell from 1,914 to 329 across these species.

**Stalker chases (150 days):**

| Seed | Chases reaching contact, before | After |
| --- | --- | --- |
| NJ-A | 2.8% | 12.5% |
| NJ-B | 4.7% | 22.9% |
| NJ-C | 5.7% | 23.4% |

- Prey were fleeing for 67–74% of each chase after the change (70–76% before). That's expected: a chasing hunter is hunting and facing its prey, so fleeing is correct. The gain comes from contacts and from prey no longer fleeing harmless predators.
- Chases ending in flight from another Stalker fell from 38–200 to 0–26 per seed.

**Stalker hunting budget (240 days, first version of the rule):**

| Seed | Contacts per day | Hunting energy per day (upkeep 0.76) |
| --- | --- | --- |
| NJ-A | 0.13 → 0.18 | 0.78 → 1.18 |
| NJ-B | 0.07 → 0.17 | 0.43 → 1.03 |
| NJ-C | 0.09 → 0.14 | 0.72 → 0.92 |

**Stalker reproduction (funnel, 300 days):**

| Measure | Before | After |
| --- | --- | --- |
| Median energy | 0.43–0.62 | **0.74** |
| Ready to breed | 4–15% of adult days | 45–58% |
| Ready with a partner in range | 0.2–1.5% | 4.5–17.2% |
| Same-species mating attempts | 0 | 21–35 |
| Conceptions | 0 | 1–4 |
| **Births** | **0** | **1–3 per seed** (1–2 reaching maturity) |
| Stalker population (NJ-A / NJ-B / NJ-C) | 6→6 / 4→2 / 6→5 | 6→8 / 4→3 / 6→9 |

**Mate searches.** Stalker searches reaching a mating attempt on NJ-A rose from 0 of 79 to 36 of 79. GenVo and mirelick were unaffected in any meaningful way (they rarely fled during searches).

**Wider ecology (no player, 3 seeds × 360 days, `docs/decision-audit/ecology/`):**

| Seed | Predation kills, before → after | Stalkers at day 360, before → after | Mosskip at day 360, before → after |
| --- | --- | --- | --- |
| THREAT-A | 11 → 8 (3 were Stalkers eaten by Stalkers) | 3 → 1 | 62 → 66 |
| THREAT-B | 11 → 52 | 1 → 9 | 66 → 28 |
| THREAT-C | 10 → 49 | 3 → 12 | 86 → 51 |

No extinctions. This is a genuine predator–prey response, not a tuned outcome: Stalkers that can feed and court grow, and their prey pay for it.

**Danger to the player (AUTO, 4 seeds × 60 days).** 1 attack in total, no kills. Stalker populations start small and grow over months, so early danger is still low; whether that's right is a pacing question (section 1).

### Open questions

- **Cannibalism.** Without blanket fear of each other, unrelated Stalkers now occasionally kill each other (3 kills on THREAT-A, where Stalkers declined to 1). Allowing cannibalism between unrelated animals was an existing design decision; this makes it observable.
- **Mosskip decline** to 28–51 by day 360 on two seeds: whether that stabilises needs longer runs.
- **Coefficients:** the 1.6-tile close alarm and the 60° facing cone are proposals. Better threat appraisal is a natural candidate for a heritable, costly trait later.

## What isn't a failure

- **Grazers' food search** (`tools/forage-search-audit.mjs`, FORAGE-A headless and FORAGE-B with an AUTO player):
  - for hungry adults not feeding, the ordinary search would find food in 100% of samples, and the nearest edible bite was a median 0.3–0.5 tiles away;
  - those animals were almost always heading for water (drink in 600 of 670 mosskip samples), sometimes fleeing.
- **Memory is family-only** (`cognition.foodTarget` is consulted only for `a.lineage`), but with food this close it isn't the binding limit today.
- **Distance level of detail:** movement and interactions are compensated (Phase 3H fix); the stride share during chases was 0 in headless runs.
- **Cover and refuges:** the Phase 3I rules aren't the main cause of failed chases (Phase 3J: with refuges off, contacts were similar).

## Recommended order

1. **Decide the pacing question** (section 1). Every other fix depends on whether wildlife moves on the player's clock.
2. **Threat appraisal by behaviour, including toward conspecifics** (sections 2 and 3). Small, perceptible-information-only, and likely the biggest gain:
   - prey keep water and feeding time;
   - Stalkers can court;
   - hunting predators stay as dangerous as their approach actually is.
3. **Plan commitment** (section 4), on the decided clock.
4. **Only then** consider making appraisal, memory and planning heritable, costly traits.

Each step should come with the same evidence tools rerun: `chase-trace`, `mate-search-trace`, `drink-trip-audit`, `stalker-hunting-budget`.

## Evidence files

| Topic | Files |
| --- | --- |
| Chases | `docs/decision-audit/chase-NJ-{A,B,C}.json` |
| Mate search | `docs/decision-audit/mate-{needlejaw,genvo,mirelick}-*.json` |
| Foraging search | `docs/decision-audit/forage-*.json` |
| Water trips | `docs/decision-audit/drink-DRINK-A.json` (120 days), `drink-DRINK-A-60d-fled-from.json` (who was fled from, and what that Stalker was doing) |
| Movement rates | `docs/decision-audit/movement-rates.json` (`node tools/movement-rate-audit.mjs`) |
