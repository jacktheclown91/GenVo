# Phase 3J — Biological parity, predator ecology, generational accessibility, performance (October 16, 2026)

**Status: implementation and investigation complete. Build verified (tests, headless Chromium). Not creator accepted. Uncommitted.**

No visual or human gameplay acceptance is claimed. Every new number is a proposal. Every change has a switch:

| Switch | Default | What it controls |
| --- | --- | --- |
| `?physiologyParity=0` | on | Shared player and wildlife physiology |
| `?rarityReview=0` | on | Rarity affects encounters only |
| `?trophicRecognition=0` | on | No predator–prey courtship |
| `?huntCommitment=1` | **off** | Pursuit commitment (measured, no benefit) |
| `?motionReveals=1` | **off** | Motion keeps a tracked prey visible in cover |
| `?plantTurnover=1` | **off** | Plant tissue turnover candidate |
| `?modularHead=1` | **off** | Modular head rendering prototype |
| `?demandReview=1` | **off** | Breeding-habitat accounting candidate (from Phase 3I) |

## Step 1 — One physiology for player and wildlife (integrated; `src/ecology/physiology.js`)

**Why the multipliers existed.** `docs/SIMULATION_SPEC.md`: "The autonomous ecosystem and the controlled survival game intentionally share state but do not need identical pacing." They gave the player sharper hunger and thirst after the opening.

**Removed player-ownership rules:**

- `CFG.playerChallenge`: player basal energy ×6 and water ×8.
- `CFG.manualMoveCostScale`: manual movement cost **1/6** of the same distance moved autonomously. I found this third asymmetry during the work.
- The 20-day opening immunity of the founding family and starter mate.
- The split plant-meal rule:
  - wild bites were capped at 0.16 and gave no water;
  - the player used each food's own bite and got water from juicy food;
  - per unit eaten, energy was already identical.

Genuine action costs (movement per distance, sprinting, bracing, attacks, coat handling, reproduction, healing) are unchanged.

**Equivalence test** (`tests/physiology-parity.mjs`): a player and a wild GenVo with identical age, genes, body, condition and position have:

- identical basal energy and water use;
- identical energy per tile moved (manual vs autonomous, within 2%);
- identical energy and water from the same bite;
- equal predation eligibility on day 1.

### Impact measured before choosing the shared meal rule

**Player pacing, food-property rule for everyone** (corrected bot, 16 runs × 160 days):

| | Old physiology | Shared physiology |
| --- | --- | --- |
| Lineage alive at day 160 | 12 / 16 | 15 / 16 |
| Generation 3 reached | 6 / 16 | 7 / 16 |
| Lineage births (total) | 51 | 101 |
| AUTO median energy | 0.23–0.64 | 0.70–0.74 |

**Wild ecology** (3 seeds × 360 days, `docs/physiology-parity/`):

| Variant | Births | Time spent drinking |
| --- | --- | --- |
| Old rules | 144–178 | 25–26% |
| Food's own bite, no food water | 162–212 | about 24% |
| Wild bite cap, with food water | 293–421 | about 18% |
| Old wild rule (0.16 cap, no food water) | 140–187 | 24–25% |
| Food's own bite **and** food water | 278–428 | 16–18% |

Water from juicy food is what roughly doubles wild births; bite size alone barely matters.

**Chosen default:** the rule wild ecology was calibrated on (0.16 cap, no food water) for **everyone**. The player therefore loses water from reeds and fruit; with the 8× water use gone, the player drinks rarely anyway. **Decision 1.**

**Pacing under the final defaults** (16 runs × 160 days, `docs/player-viability/phase3j/`):

- Lineage alive in **16 of 16** runs; no founder death in any run.
- Generation 3 in 6 of 16.
- 76 lineage births.

Survival is now considerably easier, as you anticipated, and the player needs food and water at wildlife rates.

## Step 2 — Rarity affects encounters, not captures (integrated; `src/ecology/prey-encounter.js`)

Removed, all population-counter protections:

- the contact capture penalty for locally scarce species (down to 15%);
- three choice-stage terms reading **world-wide** counts that no hunter could perceive:
  - the global-frequency term in prey ranking;
  - the `rarityRefuge` value cut (to 0.28 or 0.58 for globally rare species);
  - the recovery system's global-ratio prey refuge.

Kept: what is actually in range and perceptible, local abundance (search image), anatomy, vigilance, speed, cover, refuges, distance, defences and capture likelihood.

**Controlled test** (`tests/rarity-encounter.mjs`): a lone prey and a herded prey get identical capture odds on contact, and a globally rare but visible prey can be chosen.

**Natural** (3 seeds × 360 days, `docs/rarity-review/`): predation kills change modestly (12 → 36, 23 → 28, 42 → 35 per seed), and **no species went extinct** on any seed.

## Step 3 — Stalker reproduction and danger (investigated; `docs/stalker-reproduction/`)

**Why there are no Stalker births:**

1. **Energy at or below upkeep.** Hunting brings in 0.43–0.78 energy a day against 0.76 basal upkeep, before movement. Median energy is 0.43–0.67, against a 0.72 breeding gate.
2. **Contact is rare.** Contacts run about 0.1 per Stalker-day; kills about one per 65–110 Stalker-days. Stalkers start about 600–1,200 pursuits per 180 days; about 3% reach contact.
3. **Courtship went to the wrong species.** Every courtship attempt (10–42 per seed) targeted another species, the nearest eligible partner, often mosskip, its own prey. Conspecifics were 16–40 tiles apart (median), beyond the near mate-search radius, and the far search only runs when nothing near qualifies.

**Integrated: trophic recognition** (`src/reproduction/trophic-recognition.js`, `tests/trophic-recognition.mjs`).

- An animal doesn't court a creature of another species that it would hunt, or that would hunt it. The test is diet and body (`preyPreference`).
- The rule doesn't apply within a species: GenVo allows unrelated cannibalism, and a cannibal-capable species still courts its own kind.
- With it, futile predator–prey courtship stops. Stalkers then seek conspecifics but still make no attempts: partners are rarely ready together and far apart, and energy is marginal.

**Tested and left off:**

- **Pursuit commitment** (keep chasing the current perceptible prey): halved target-switching (abandoned pursuits 533 → 175) but didn't raise contacts (0.13 → 0.11 a day) and lowered hunting income (0.78 → 0.66).
- **Cover, three tests:**
  - excluding moss from concealment didn't raise contacts;
  - the Phase 3I cover rule isn't the main cause (with refuges off, contacts were about 0.11–0.12 a day);
  - motion-reveals made no difference for wildlife, because stalked prey are usually still.

**Danger in play.** Under AUTO over 60 days the player was attacked 0 times on all four seeds, and wild adult GenVo 0–2 times.

**Conclusion:** the binding limit is pursuit-to-contact. Prey usually escape, or the hunter breaks off, before contact: an issue of chase and escape decision-making, not a missing bonus. This is exactly the kind of decision coordination your intelligence-layer note describes. **Decision 2.**

## Step 4 — Reproductive accessibility (`docs/conception-trace/`)

**Every player-lineage attempt is now traced by stage.** STRAT-B, where 8–11 attempts produced 0 conceptions in Phase 3I:

- **Biological compatibility is excellent:** conception chance 0.98, fertility 1.
- **The failures are mate-choice refusals**, mostly by the **player's own creature**: 8 of 11 refusals under AUTO, 5 of 8 for the forager. Its inherited preference rejects the partner the player chose. The same partner was retried several times a day.
- **"Encounter ended" blocks:** a wild suitor approached the player, but the player wasn't courting it. That's an agency rule, not biology.

**Under the final defaults** (16 runs), attempts end mostly as "declined" or "blocked"; the conception roll failed once.

**Improvement (integrated).** The refusal record now names who declined and the dominant inherited taste. The courtship observation and partner inspector say, in plain words:

- **When your creature declines:** "Your creature held back: it is drawn to partners that look unlike itself."
- **When the partner declines:** "The partner turned away from your creature." After a repeat: "It has refused before; another partner may suit better."

The partner's genotype is never shown, and older saved refusals keep the neutral wording (`tests/courtship-refusal-explanation.mjs`).

**Still true:**

- rituals are optional (a court with no queued ritual proceeds);
- there's no species-label barrier;
- nothing guarantees conception.

## Step 5 — Mirelick and the fungal cycle (`tools/fungal-cycle.mjs`, `docs/fungal-cycle/`, `docs/plant-turnover/`)

- **Litter is the limit.** Litter is nearly absent (0.0001–0.0018 per land cell), consumed as fast as it arrives, so fungal growth is limited by litter input, not by processing capacity.
- **Rotcap is thin, not missing.** About 0.05–0.065 per cell, roughly 600–800 units world-wide, but spread so thin that mirelick eat only 1–3 units per 20 days.
- **Model bottleneck found.** Rooted plants at equilibrium shed almost no tissue: litter 5.9 a day from 16,000 units of standing biomass, a tissue lifetime of about **2,700 days**. Grazing removes 9.9 a day. Real herbaceous tissue turns over in months, and most production goes to decay.
- **Candidate (off): tissue turnover** (`PLANT_TURNOVER`).

  | Rate | Rotcap per cell | Mirelick births | Sunmoss per cell | Mosskip births |
  | --- | --- | --- | --- | --- |
  | Off | about 0.055 | 0–5 | 0.66 | 109–136 |
  | 1/600 per day | about 0.09 | 1–7 | 0.39 | 67–74 |
  | 1/120 per day | about 0.18 | 4–11 | 0.04 | 45–54 |

- **Deeper finding:** plants can't fund regrowth even at 0.17% a day. Producer productivity (about 16 units a day from 16,000 standing) is the upstream limit.
- **Conclusion:** mirelick is limited by an unrealistic transfer (no tissue turnover) and by low primary productivity, not by its own physiology. No species tuning was done. **Decision 3.**

## Step 6 — Provisional coefficients (`tools/coefficient-review.mjs`)

| Coefficient | Finding |
| --- | --- |
| Hollow log (mass ≤ 1.6) | Every species and stage fits except adult Stalkers (2.1); bankjaws and young Stalkers can follow. In practice a refuge against adult Stalkers only |
| Cover (size-scaled) | A full stock of **ground moss** (weight 0.42) hides any quiet animal, even an adult Stalker. Moss is the commonest plant, so this is too generous geometrically. Recommendation: only tall vegetation conceals bodies taller than it |
| Healing | 8.4–11.3 days to heal a severe wound resting well fed, across species and stages; repair costs 3–10% of maximum energy |
| Founding activity factor (2) | Measured wild intake is about 1.3–1.5× basal upkeep, so 2 leaves about a 35–50% margin. The Phase 3H 6× error is corrected; it doesn't underestimate need |

All of these stay provisional.

## Step 7 — Modular head rendering prototype (off; `src/render/genvo-draw.js`)

**Design.**

- Head, mouth and eyes are drawn after every body part, and head-turn moves only head sockets.
- So a body layer cached without head-turn, plus a live head, outlined together, can reproduce the sprite.
- The body portion's canvas state at the split is clean: default alpha, composite and transform.

**Measured** (live world, 1920×1080, day 120):

| | Current renderer | Modular head |
| --- | --- | --- |
| Frame rate | 30–31 fps | **18–23 fps** |
| Render p50 | 17–18 ms | 26–32 ms |

**Not pixel-identical:** 20 pixels differ on a swimming rillsifter. Time-animated body parts (fins, paddle tails) animate on continuous time, which no cache key holds. A body layer reused across head-turn shows an older fin frame.

**Why it's slower:** each sprite rebuild still runs the body layout code (through a do-nothing canvas), plus a second cache. A real gain needs `drawGenvoBody` split into a layout step and a drawing step, and time-animated parts kept live or keyed. **Decision 4.**

## Step 8 — Natural play

Fresh worlds, unstaged. Automated play only; these are rule evidence, not human acceptance.

### Ten-minute Chromium sessions (real keys; `../genvo-review-artifacts/2026-10-15/phase4-playtest/run8-1440`, `run8-800`)

| Session | What happened | Frames |
| --- | --- | --- |
| 1440×900 | Survived to about day 98 at full health; hunters nearby in 28 of 109 windows, fled 13 times. Found a thorn brake, a hollow log and a carcass. Courted repeatedly (C pressed 64 times, mostly "an approach is already underway"); **no family** | Median 16.7 ms; p95 16.8 ms in most minutes, 33 ms at worst |
| 800×600 | Survived to about day 98 at full health. Outran a Stalker (trial complete); a carcass drew a Stalker; reached "Find a mate" at about day 84; **no family** | Steady 60 fps |

Both sessions had 0 page errors.

- The bot's log captures toasts only, not the courtship tray where the new refusal explanations appear, so I can't say from these logs why the 1440×900 courtships failed. That's a tool limitation to fix before the next playtest.
- The Phase 3I 800×600 session formed a family; this one, on the same seed under different rules, didn't.

### Strategy experiment (16 runs × 160 days, same rules as wildlife)

| Survival | Generation 3 | Births | Attempt outcomes |
| --- | --- | --- | --- |
| 16 / 16 alive, no founder deaths | 6 / 16 | 76 | Mostly mate refusals and blocked encounters; a failed conception roll once |

### What it felt like, as far as a bot can show

**Survival.**

- Food and water are no longer a constant pull: with wildlife-rate needs, the player eats and drinks only a few times per game week.
- Danger exists: Stalkers are announced ("STALKER WEST · RUN"), carcasses draw them, and they can be outrun.
- But attacks are rare: none landed in either session or in 60-day AUTO runs.

**Reproduction.**

- **The main obstacle is now partner choice, not biology.** Your own creature's inherited taste often refuses the partner you chose, and the game now says so.
- Choosing another partner is the in-world response.

**Pacing.** At about 10 game days per real minute, a 10-minute session is a third of a lifespan.

**What I'd want to learn from you in human play:**

- whether the refusal wording is understandable at the moment it happens;
- whether the lack of danger feels hollow;
- whether three generations feels reachable.

## Verification

**Full suite.** `node tools/run-tests.mjs --all --jobs 4` gave **377 pass, 7 known, 0 new failures, 0 timeouts** of 384 (`docs/test-runs/all-phase3j-2026-10-16.json`). The 7 known failures are unchanged.

**Regressions found and how each was handled**, all reported separately:

- **`consolidation-demand-parity`:** needed the new switches off for its frozen-copy comparison.
- **`onboarding`, `gameplay-pressure`, `predator-retaliation`:** asserted the opening immunity. Revised by your decision; the old protection returns only with `?physiologyParity=0`, and that's tested.
- **`foraging-choice`:** asserted water from reeds. Now tests both meal rules explicitly.
- **`decisions-under-pressure`:** "standing still dies within 25 s" held only by luck of one random sequence (a bite lands about 39% of the time). It now checks that a motionless player is bitten in at least 4 of 6 independent arenas and killed in at least 1.
- **`player-facing-feedback`:** unchanged; older refusal records keep the neutral wording.

**Saves.**

- **Older saves:** a world saved by HEAD `d2f676c` loads and runs 60 more days (`docs/test-runs/older-save-compat-phase3j.txt`).
- **Save/resume identity:** holds day by day in a player world (`tools/save-resume-determinism.mjs DET-3J 30 70 1`).

**Not demonstrated:** human gameplay, visual acceptance, three generations in human play.

## Decisions for you

1. **Shared meal rule:** keep the wild-calibrated default (no water from food, 0.16 bites) for everyone, or adopt water from juicy food for everyone? The latter roughly doubles wild births and populations.
2. **Predator ecology:**
   - Stalkers live at an energy deficit because pursuits rarely reach contact (about 3%).
   - The cause is chase and escape decision-making, not a missing bonus.
   - Should Stalker hunting behaviour (approach, ambush, chase persistence, prey flight) be the first subject of the ecological-intelligence audit?
3. **Primary productivity:**
   - Plants shed almost no tissue at equilibrium (tissue lifetime about 2,700 days), and can't fund turnover even at 0.17% a day. That starves the fungal chain and mirelick.
   - Should the producer energy budget be reviewed before any decomposer or mirelick tuning?
4. **Head rendering:** the prototype is slower (18–23 fps against 30–31). Approve a proper layout/draw split of creature drawing (a larger refactor) as the next rendering step, or set it aside?
5. **Cover:** ground moss currently conceals any body. Restrict concealment to vegetation tall enough for the body?
6. **Danger level:** with parity and no player-only attacks, the player wasn't attacked in any automated session. Accept that until predator ecology is fixed, or prioritise it?
