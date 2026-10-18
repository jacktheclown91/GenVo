# Phase 3I — Biological parity and ecological reliability (October 15–16, 2026)

**Status: implementation complete for Milestones 1–5; Milestone 6 verified with automated play and headless Chromium only.**

- **Build verification:** tests and Chromium runs listed below.
- **Creator acceptance:** not given. This report doesn't claim visual or human gameplay acceptance.
- **Git:** uncommitted.

New numbers are proposals. Every behaviour change has a switch that restores the previous rule:

| Switch | Default | What it controls |
| --- | --- | --- |
| `?predationParity=0` | on | One hunting decision and bite rule for player and wildlife |
| `?refuges=0` | on | Logs, thorn brakes and cover protect any eligible organism |
| `?healing=0` | on | Healing physiology for every animal |
| `?resourceFounding=0` | on | Founding by renewable food |
| `?demandReview=1` | **off** | Breeding-habitat accounting candidate (no material effect) |
| `?lifeHistory=1` | **off** | Phase 3H life-history candidates (kept off by decision) |

## Milestone 1 — Universal predation and survival rules

### Predation parity (integrated; `src/gameplay/predation-parity.js`)

**Choice.**

- A hunter starts any hunt, including the Stalker encounter against the player, only when two things hold:
  - it's hungry by the wildlife threshold (below 72% energy, or needing recovery forage);
  - the player is its best-ranked prey (`Simulation.bestPrey`: suitability, appraisal, distance, perception, refuges, prey abundance).
- **Removed:**
  - the player-only rule (any hunter below 90% energy, 98% in its den core, within about 9 tiles);
  - the den-core aggression that only ever targeted the player.

**Execution.** `Simulation.tryKill` has one rule for every pair. Removed player branches:

- the exemptions from scarcity and hunter crowding;
- the separate body ratio and leg-speed ratio;
- the separate damage formula (32 × ratio, cap 82; now the wildlife 55 × ratio, cap 60);
- player-only bite meals, armour deterrence and bitter slime;
- the Stalker charge's +0.34 contact bonus.

**What stays:** the encounter itself (tells, wind-up, charge lane), and what the player actually does (brace, sprint noise, refuges).

**Verification** (`tests/predation-parity.mjs`):

- The same hunter biting the player and a wild GenVo with an identical body, from the same random state, gets identical hit and damage on 12 of 12 attempts.
- A hunter at 85% energy no longer starts an encounter; a hungry one whose best prey is the player does.

**Consequence to review (rare-prey rule).**

- The wildlife rule "rare prey is harder to catch" (fewer than 6 of a species within 12 tiles lowers capture odds to as little as 15%) now applies to a lone player too, exactly as to a lone wild animal.
- It applies at the moment of contact, after the hunter has found its prey, so it acts more like a population brake than a search cost.
- **Decision 1** below.

### Refuges for every organism (integrated; `src/ecology/refuges.js`)

- **Hollow log:** protects an animal sheltering inside when its current body fits (mass ≤ **1.6**) and the hunter doesn't.
  - Adult Stalkers (2.1) can't follow.
  - Bankjaws (1.36) and young Stalkers can.
  - The player shelters with V; wildlife enter while fleeing.
- **Thorn brake:** keeps out hunters without body-covering armour, and scratches unarmoured occupants of any species.
  - Thorn-proofing is body covering only: plates, armoured hide, shells, reinforced or dome torso, hardened mantle.
  - Dorsal spine ridges, spine clusters and spined tails are weapons and don't count. (Every Stalker has a spine ridge, so under the old discovery list thorn brakes would never have stopped one.)
- **Cover:** the cover rule that hid only the player from Stalkers now applies to any quiet prey from any hunter.
  - Larger bodies need denser cover, scaled by the cube root of mass relative to GenVo.
  - Hunter senses and eyes set the range.
  - "Still" means not having moved for half a second, measured the same way for every animal.
- **Wildlife awareness:** a threatened animal heads for the nearest refuge that would protect it from that threat, if it can reach the refuge first; otherwise it flees as before. Nothing guarantees escape.
- **Verification:** `tests/refuge-parity.mjs` covers logs, thorn brakes, identical cover results for player and wild twin, noise, and wildlife refuge seeking.

### Healing physiology (integrated; `src/ecology/healing-review.js`, `src/gameplay/injury-recovery.js`)

Health regained per metabolism step (8 a day) is `0.45 × nourishment × activity × infection × development × immunity × healing adaptations`:

| Factor | Values |
| --- | --- |
| Nourishment (lower of energy and water) | 1 at ≥ 0.6; 0.55 at ≥ 0.38; 0.2 at ≥ 0.2; none below |
| Activity | Shelter rest 1.8; cover rest 1.6; rest 1.5; moving 1; fleeing or straining 0.4 |
| Infection | 0.5 |
| Juveniles | 1.25 |

- **Cost:** repair uses energy. Restoring 100 health rebuilds 25% of body mass at tissue energy over efficiency 0.75. Tissue a hunter ate is paid once, inside that cost.
- **Wound state for every animal:** every bitten animal gets the existing wound state (sore, wounded, severe), which slows it and recovers by the same daily rest and strain rules, wild or player.
- **Result:** a severe 60-health wound heals in about **12 days** resting well fed, longer when active. Before: 0.64 a day, about 70 days. A starving or parched body doesn't repair.
- **Verification:** `tests/healing-review.mjs` covers player and wild twin identical, nourishment, activity, infection, energy cost and wound slowdown.

### Finding needing your decision: the player's metabolism

`CFG.playerChallenge = {energyScale: 6, waterScale: 8}`: outside the opening grace, the player burns **6× the energy and 8× the water** of an identical wild GenVo. The player also eats with a different meal formula, and the founding family and starter mate are immune to predation until day 20 (2 minutes).

This contradicts the acceptance criterion: identical organisms, equivalent treatment. It's also the basis of the player's whole pacing (frequent meals and drinks), so I haven't changed it. **Decision 2.**

## Milestone 2 — Reproductive and ecological viability

### Mirelick and podshell (`tools/species-viability-funnel.mjs`, `docs/species-viability/`; candidates kept off)

Share of adult-days at each stage (3 seeds × 300 days):

| Stage | Mirelick | Podshell | Mosskip |
| --- | --- | --- | --- |
| Energy above breeding gate | 13–19% | 24–30% | 31–48% |
| Habitat food-support gate allows breeding | **0.5–5.9%** | 9–24% | 33–70% |
| Ready to breed | 0.2–1.3% | 4–8% | 11–26% |
| Ready with a ready partner in range | 0–0.2% | 2–3% | 9–17% |
| Same-species mating attempts | **0** | 7–25 | 266–486 |
| Births | 0–2 | 5–6 | 64–102 |

Why:

1. **Mirelick's food is scarce everywhere.**
   - Its staple, rotcap fungus, averages about 0.06 per land cell; the best 17×17 window anywhere is barely higher.
   - Rotcap grows only from decomposing carrion and plant litter, a genuine organic cycle.
   - The habitat survey's food value (about 2.5) sits below mirelick's breeding minimum (2.8) in every habitat.
   - Mirelick spends 30–50% of its time searching (mosskip 13–22%).
2. **Both species sit just under their breeding gates:** median energy 0.71–0.73 against gates of 0.74–0.75.
3. **They're "crowded" by heads, not appetite.** The density gate counts every overlapping consumer as one competitor, so mosskip and GenVo herds sharing a little food keep the crowding ratio near 1.8.
4. **Podshell lives in mediocre thistlepod ground:** 0.08–0.12 around it against 0.12–0.16 at the best sites.

**Accounting candidate tested (off).** Counting carrion in the survey and weighting competitors by appetite changed mirelick and podshell outcomes negligibly (`docs/species-viability/demand-*`). Those gaps exist but aren't the cause.

**Conclusion:** mirelick fails because this world's decomposer production can't fund its reproduction; podshell is marginal. No numbers were changed. **Decision 3.**

### Renewable-food founding (integrated; `src/ecology/resource-founding.js`)

**Rule.** Founders are kept only up to what the food their anatomy can reach around their founding sites can renew each day:

- **Plant regrowth:** logistic.
- **Freshwater food:** producer regrowth, and net growth of the larvae and fry tiers.
- **Live prey:** biomass × capture likelihood ÷ prey lifespan, the usual production-to-biomass turnover.

Against each founder's need: basal upkeep × activity **2** (proposal).

**A species that can't support a pair is founded absent.** There's no immigration from outside the map, so it stays absent unless a future dispersal process brings it.

**Correction to Phase 3H:** the previous version overstated each founder's daily need 6× (it counted ticks instead of metabolism steps).

| | Founded (6 seeds) |
| --- | --- |
| Bankjaw | **0** on 5 of 6 seeds (renewable food 0.9–1.9 a day against 1.02 per founder); 5 on one |
| Needlejaw | **3–6** (configured 12) |
| Other species | As configured |

Over 360 days (`docs/founding-review/`):

- Needlejaw doesn't reproduce under either founding: 0–1 births and 0 same-species attempts. So its founding count sets the Stalker population for the whole game. **Decision 4.**
- Rillsifters do better without bankjaws.

### Aquatic chain (`docs/aquatic-chain/`)

- **Fry can't grow anywhere at first.** Fry need at least 0.080 larvae per cell, and the founded world has about 0.025.
- **Larvae build slowly:** median 0.069 per cell by day 240.
- **Fry stay flat:** they become growable in about 40% of water cells only by days 200–240, holding at about 4 units world-wide all that time.

That lag is why bankjaw can't be supported at founding. Nothing was tuned.

## Milestone 3 — Heritable mate preference validation

`tests/similarity-preference-validation.mjs` verifies:

- conception compatibility is unaffected by the allele;
- a strong contrast-seeker can refuse a compatible look-alike, and one refusal ends the pairing (reciprocal acceptance);
- the same chooser scores a contrasting partner, even another species, higher: attraction is by perceived anatomy and colour, not species name;
- neutral preferences never block an isolated compatible pair;
- scores stay bounded at extreme genotypes;
- close kin can't pair however attracted.

The +0.01 same-taxon tendency only orders candidates.

**Selection over generations** (3 seeds × 720 days, `tools/similarity-selection.mjs`, `docs/similarity-selection/`):

| Allele band | Offspring per adult |
| --- | --- |
| Strong similarity-seekers | 1.39–1.49 |
| Neutral | 1.09–1.16 |
| Strong contrast-seekers | 0.96–1.06 |

- The newborn mean drifts mildly positive.
- Extreme alleles become rarer over generations: blending inheritance (parental mean ±0.10) pulls every allele toward the middle.
- Contrast preferences persist at low frequency and are selected against. No runaway.

## Milestone 4 — Ecological test integrity (`engineer-loss-return`)

**Persistence verified.** An uninterrupted run and a save/resumed run from the same state are **identical**: RNG, every actor, soil disturbance, plant stocks and dig counts, checked every day to day 168. Saves were made before the digging pause, during it, and in a player world (`tools/save-resume-determinism.mjs`, `docs/save-resume/`).

**Why digging varies.** Diggers dig only when hungry, on fertile undug land, when other food is more than 2.75 tiles away. So natural dig counts follow each trajectory: 3–24 digs after the pause across seeds (`docs/engineer-observation/`).

**Test revised (by your decision).**

- The single-seed requirement (more than 10 digs) is now a logged observation.
- The test now asserts that a staged, eligible digger chooses to dig after the pause and completes a dig with soil effects.
- The deterministic pause assertions are unchanged, and the digging rules remain covered by `intrinsic-digging`, `soil-disturbance`, `digging-calendar` and `engineer-recovery-foraging`.
- Removed from the known-failure ledger (now 7 entries).

## Milestone 5 — Fullscreen rendering

**Correction to Phase 3H.** The earlier day-200 frame measurements were taken with the **simulation paused**.

- Skipping 200 days with no one controlling the player let it die; the game then sat on its transition screen.
- The Phase 3H before/after gains were real for rendering a still world, but not for live play. The pixel-parity checks and Chromium play sessions weren't affected.
- The profilers now run the player on AUTO during the skip, and refuse to measure unless the world is live with a living player.

**Live-world measurements** (day 120, 20 s walking; headless Chromium, software rasteriser):

| Viewport | fps before → after | Frame p95 (ms) | Render p95 (ms) |
| --- | --- | --- | --- |
| 800×600 | 45.3 → 49.8 | 33.4 → 33.4 | 27.3 → 22.3 |
| 1440×900 | 31.5 → 36.9 | 66.6 → 50 | 44.5 → 30.5 |
| 1920×1080 | 23.6 → 25.4 | 83.3 → 66.8 | 54.2 → 47 |

**Change:**

- The recolour cache per body-part asset grows from 64 to 256 frames, pixel-identical (24 of 24 frames at 1920×1080).
- 64 thrashed with about 80 individually pigmented creatures on screen.

**Bottleneck found.**

- Native `drawImage` and rasterising dominate (about 45% of CPU).
- Creature sprites are rebuilt about 40 times a frame: the sprite cache hits only about 47%, because head-turn (0.1 steps), the animation frame and its breathing value, and action give each creature hundreds of variants.
- A least-recently-used policy didn't help, since the key space exceeds any reasonable cache.

**Tried and rejected:** 8×8 terrain chunks, because they changed pixels in 4 of 24 frames.

A large further gain needs a visual decision. **Decision 5.**

## Milestone 6 — Natural generational gameplay

### Bot limitations, separated from game findings

My automated player is not a knowledgeable human. In Phase 3H I found and fixed four bugs in it:

1. input sent only every 8th step;
2. no controls passed to `update`;
3. courtship restarted every decision;
4. stopping beside water instead of on it.

Remaining limits:

- The refuge and defend bots camp in a refuge while any hunter is within 9 tiles, and can dehydrate there.
- The 10-minute session bot drinks only when thirsty, so it reaches "Find a mate" late.

**These sessions are evidence about the rules, not human acceptance.**

### Strategy experiment (corrected bot, same rules as wildlife, 4 seeds × 4 strategies × 160 days; `docs/player-viability/phase3i/`)

| | Phase 3H current rules | Phase 3H parity candidate | **Phase 3I** |
| --- | --- | --- | --- |
| Lineage alive at day 160 | 3 / 16 | 6 / 16 | **12 / 16** |
| Generation 3 reached | 2 / 16 | 3 / 16 | **6 / 16** (STRAT-C ×3, STRAT-D ×3) |

What still prevents progression:

- **STRAT-A:** predation (AUTO on day 125, forager on day 67), and refuge-bot dehydration.
- **STRAT-B:** survives, but 8–11 mating attempts gave 0 conceptions on every strategy. Not yet diagnosed: compatibility, the conception roll, or partner choice.
- **Starvation:** several runs survived only through succession after the founder starved.

### Predation pressure under AUTO (`docs/player-viability/phase3i/predation-pressure.txt`)

- **Player:** 0 attacks in 60 days on all four seeds.
- **Wild adult GenVo:** 0 attacks on three seeds and 5 on one (0.004 per animal-day).
- **Why it's lower:** fewer founded Stalkers, parity, cover and refuges together.
- **Trade-off:** predation is now rare and uniform, not a player-targeted threat. **Decision 4** covers whether that's the danger level you want.

### Ordinary 10-minute sessions in Chromium (real keys, no staging; logs in `../genvo-review-artifacts/2026-10-15/phase4-playtest/run7-1440`, `run7-800`)

| Session | Outcome | Frames |
| --- | --- | --- |
| 1440×900, PHASE4-ORDINARY | Survived to about day 96 at full health; hunters nearby in 38 of 109 windows, fled 59 times. Found a hollow log and a thorn brake; reached "Find a mate" at about day 88 and courted twice; no family | Median 16.7 ms throughout; per-minute p95 16.7–67 ms |
| 800×600, PHASE4-ORDINARY-B | Survived to about day 98 at full health. **Family formed:** 4 young, generation 2, a newborn tended. First family formation in any automated 10-minute session | Steady 60 fps (p95 16.8 ms) |

Both sessions had 0 page errors.

### What a knowledgeable player can realistically pursue (automated evidence only)

| Goal | Evidence |
| --- | --- |
| Sustainable survival | Yes on 3 of 4 seeds over 160 days |
| Predator avoidance and refuges | Refuges are found and announced in play; protection is now geometric and anatomical. Bot policy limits the evidence here |
| Courtship and mating | Achieved on 3 of 4 seeds in the strategy runs and in one 10-minute session; STRAT-B blocked at conception |
| Offspring and generational handoff | Generation 3 in 6 of 16 strategy runs; successions occurred |
| Meaningful inherited anatomical differences | Not evaluated here; needs human play and visual review |

**At about 10 game days per real minute, a 10-minute session spans about 100 days:** about a third of a GenVo lifespan. Your note about pacing stands; the player's 6×/8× metabolism (Decision 2) is part of the same question.

## Verification

**Full suite.** `node tools/run-tests.mjs --all --jobs 4` gave **373 pass, 7 known, 0 new failures, 0 timeouts** of 380 (`docs/test-runs/all-phase3i-2026-10-16.json`). The 7 known failures are the same as before: 5 release-only, `evolution-baseline` (kept by your decision) and `wild-evolution`.

**Defect found and fixed during regression (`family-observer-resume`).**

- Restoring a save re-ran the HUD's selection refresh, which could pick a mate selection the uninterrupted run never had.
- The player's courtship uses that selection, so a resumed world could diverge from the same world played on.
- It surfaced now only because a partner happened to be eligible at the test's checkpoint.
- **Fix:** restore keeps the saved selections exactly, and clears one only if its animal no longer lives.

**Test revisions made by your decisions**, each commented in the test:

- **Parity:** an exemption assertion became an equality assertion.
- **Hunger and isolation fixtures:** staged hunters must be hungry, and fixtures isolate the staged pair.
- **Damage:** judged against an unprotected bite.
- **Healing:** every animal now has a wound state.
- **Founding:** per-species fixtures run with founding as configured. Founding itself is asserted in `seed-shore-niches`.
- **Natural single-seed counts become observations:**
  - `engineer-loss-return` (now covered by a causal continuation test);
  - `autonomous-soil-engineering`: the count of at least 20 digs in 90 days. Seed B made 18 including descendants; the requirements that real diggers and descendants dig remain.

**Saves.**

- `save-persistence`, `save-storage` and the resume suites pass.
- **Older saves:** a world saved by the committed tree (HEAD `d2f676c`) loads and runs 60 more days (`docs/test-runs/older-save-compat-phase3i.txt`).
- **Save/resume identity:** verified day by day in natural and player worlds (`docs/save-resume/`).

**Rendering.** Pixel parity holds for the recolour-cache change: 24 of 24 frames at 1920×1080, day 120, 34–86 creatures visible.

**Not demonstrated:** human gameplay acceptance, visual acceptance, three generations in ordinary human play.

## Decisions for you

1. **Rare-prey capture rule:** it now protects a lone player exactly as a lone wild animal, and it applies at the moment of contact. Keep it, or move scarcity to the search and choice stage?
2. **Player metabolism:** the player burns 6× the energy and 8× the water of an identical wild GenVo, eats with a different meal formula, and has opening immunity until day 20. Align it with wildlife? That reshapes the whole pacing, including your question about game days per real minute.
3. **Mirelick:** decomposer production (rotcap from litter and carrion) can't fund its reproduction anywhere in this world. Leave it to decline, revisit the decomposer cycle, or revisit its diet or breeding threshold?
4. **Danger level:**
   - **Stalker numbers:** renewable founding gives 3–6 Stalkers (configured 12), and needlejaw doesn't reproduce under either rule (0 same-species attempts). Should needlejaw mate access be investigated next?
   - **Is the present danger what you want?** Together with parity and refuges, predation under AUTO is now rare (0 attacks in 60 days).
5. **Creature sprite cost:** a large further rendering gain needs either quantised head-turn and breathing steps, or the head outlined separately from the body. Both are visible changes. Is either acceptable for review?
6. **Proposed coefficients to confirm:**
   - log interior 1.6 mass;
   - cover scaled by the cube root of mass;
   - healing base 0.45 and the factor table;
   - repair 25% of tissue;
   - founding activity 2.
7. **STRAT-B:** repeated conception failure. Should it be the first generational-accessibility investigation?
