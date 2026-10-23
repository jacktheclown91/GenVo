# The First Legacy (October 22, 2026)

Creator direction (October 22): make The First Legacy the jam's primary achievement, keep eight generations as an optional long-term milestone, and leave the world fully playable afterwards. No predefined final creature, guaranteed mutation, protected family or manufactured offspring.

## Rule

Authority: `src/gameplay/legacy-milestones.js`.

- **The First Legacy** has three steps:
  1. Establish your life.
  2. Establish your family.
  3. Continue your lineage.

  It is earned at the first real handoff of control to a living **descendant** of the creature you were. The handoff can happen through the H succession chooser, or automatically after that creature's death, through the existing lineage controller (`Lineage.handoffTo`, `handleActiveDeath`). A handoff to a relative who is not a descendant continues the run but doesn't earn it.
- **Eight-Generation Legacy** is earned at the first handoff to a descendant of generation 8 or higher. This matches the existing "lineage established" generation.
- Each milestone is earned once per world. Nothing in the module:
  - creates organisms, mutations or protection;
  - changes the conditions for maturity, eligibility or handoff;
  - ends the simulation.
- The record (`sim.legacyMilestones`, schema 1) is created only when a milestone is earned, so saves without one round-trip unchanged.
- Each record is a summary of the actual bodies at the moment of handoff:
  - the ancestor's and descendant's id, generation, sex, species, age, parts and adaptations;
  - inherited, new and lost parts;
  - the ancestor's offspring born and still alive;
  - the living lineage size;
  - the day, year, tick and reason (`handoff` or `death`).
- Restore validates the record and rejects corrupt entries.

## Presentation

- **Goal pill** (`src/ui/tutorial.js`): once the opening is complete or skipped, the compact objective shows `Legacy n/3` until the milestone is earned, then returns to the `G n/8` generation progress.
  - Step 1 counts as met when the creature is alive and playing.
  - Step 2 is met by a living child or an eligible heir.
  - Step 3 is the handoff.
- **Summary** (`src/ui/legacy-summary.js`): after the existing generation reveal closes, a dialog headed "The First Legacy — Your Legacy Begins" ("Survive. Reproduce. Become the next generation.") lists the real ancestor, descendant, inherited / new / lost anatomy, offspring, living lineage and day. It offers:
  - **Continue Evolving** (default; Enter or Escape), which resumes the same world;
  - **Begin a New World**, which opens world creation.

  The game is paused while the dialog is open.

## Timing

Measured with `tools/measure-first-legacy-timing.mjs`:
- native New World, the same options the menu uses (`planetary/1` with the regional frontier);
- the founder driven by AUTO with no player input;
- the clock stops when a descendant is grown enough to inherit (30 development days for GenVo).

One simulated day is 6 s at 1x.

| Seed | First birth (day) | Heir eligible (day) | Minutes at 1x |
|---|---|---|---|
| PLANET-B0-A | 19 | 53 | 5.3 |
| PLANET-OBS-2 | 51 | 94 | 9.4 |
| PLANET-OBS-1 | 19 | 178 | 17.8 |
| PLANET-OBS-3 | 19 | 270 | 27.0 |

Every founder survived. The spread is ecological:
- Development age advances only while a juvenile is fed, so underfed young mature late.
- Litters can be lost.
- A failed pregnancy carries a long recovery.

The founder also begins alone, and must court a wild mate first.

Two caveats on these figures:
- They are for an autonomous player. An active player who feeds, shelters and chooses mates may be faster or slower.
- Earlier figures measured without the regional frontier (52–71 days) are not representative of the game.

The 15–30 minute target holds for three of the four seeds; the fastest seed is quicker, at about 5 minutes.

## Verification

- **Automated:** `tests/legacy-milestones.mjs` is in the playable gate. It covers:
  - a natural birth under AUTO;
  - no award for a non-descendant;
  - the award at an ordinary handoff to a descendant, with a correct summary;
  - one award only, with play continuing;
  - the eight-generation rule;
  - exact save round-trips, both with and without a record;
  - rejection of corrupt records.

  For test time only, the naturally born child is aged to maturity before the handoff.
- **Chromium** (`tools/verify-first-legacy-browser.mjs`, exported build, 1600×900), evidence in [first-legacy-review-2026-10-22](first-legacy-review-2026-10-22/):
  - Setup: PLANET-B0-A, a native New World with the opening skipped.
  - The only staging is time acceleration: whole days run in the page under the game's own AUTO.
  - The Creature Lab opened once at the pregnancy and was left with "Keep the old body", so no design was applied.
  - First birth was on day 19 and an heir was eligible on day 56.
  - The pill read `Legacy 2/3` ([goal-pill](first-legacy-review-2026-10-22/goal-pill.png)).
  - H opened the chooser and H confirmed ([heir-chooser](first-legacy-review-2026-10-22/heir-chooser.png)).
  - The generation reveal played ([generation-reveal](first-legacy-review-2026-10-22/generation-reveal.png)), then the summary appeared with real values ([legacy-summary](first-legacy-review-2026-10-22/legacy-summary.png)): ancestor male aged 87 days, descendant aged 30 days, four parts inherited, 4 offspring born and alive, 5 living members, day 56.
  - Continue Evolving resumed play as generation 2 ([continue-evolving](first-legacy-review-2026-10-22/continue-evolving.png)).
  - Begin a New World opened world creation ([begin-new-world](first-legacy-review-2026-10-22/begin-new-world.png)).
  - No page errors.
- **Found and fixed during the browser pass:** `Legacy n/3` overflowed the 30 px step badge and overlapped the objective title. A CSS rule now widens only the legacy step.

**Real-time 1x run (later on October 22):** the exported game in Chromium, opening played, AUTO, no acceleration. The milestone is reached in 5.7 minutes. That run exposed and fixed two defects:
- the opening never completed under AUTO, which hid `Legacy n/3`;
- the legacy record was not carried across a regional crossing.

See [JAM-READINESS-2026-10-22.md](JAM-READINESS-2026-10-22.md).

The creator has not yet accepted this. It has not been played by hand at 1x.
