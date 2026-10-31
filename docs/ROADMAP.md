# GenVo roadmap (current)

This is the one current development roadmap. Earlier roadmaps are in `history/roadmaps/`. The ownership table and shared-file rules are in `../design/GENVO-V1-PLAN-2026-10-23.md`, and the refactor list in `REFACTOR-BACKLOG.md`.

**Roles (creator direction, October 30):** Claude owns simulation, gameplay, persistence, performance, tests, integration and release. ChatGPT owns UI and UX, visuals, animation and audio presentation. The creator decides design, authorizes features and approves releases.

## Now: jam release (deadline November 4, 2:00 PM ET)

1. Upload the verified package (`docs/RELEASE-CHECKLIST.md` §6–7). Then check the public page, add the Discord username, update the itch.io AI disclosure field, and sign the jam attestation.
2. After the deadline, ship only fixes for game-breaking bugs, each noted in a devlog.

## Next: creator decisions on known failures (`../tests/known-failures.json`)

- **Frozen-copy parities** (`restore-deferred-flora`, `world-restore-base-cache`, `consolidation-demand-parity`, `dietary-scan-parity`): retire them or refreeze.
- **`evolution-baseline`:** refresh its natural-run block, or keep the comparison file.
- **`evolution-contract`:** retire the missing-fixture section, or supply the fixture.
- **`provenance`:** add a release record to the ledger.

## Then: simulation and performance (Claude)

- **Mature-world speed:** 4x with 560+ animals (`observer-play`); regional replay after long absences.
- **`engineer-loss-return`:** redesign its return-patch experiment for finite root digging.
- **Long field soaks** (`natural-world-soak`, `wild-evolution-observation`): run outside the gate and review population and evolution trends.
- **Locomotion report:** `tests/grounded-locomotion.mjs` rewrites the tracked `docs/locomotion-support-measurements.json` on every run, and its support-drift reading moved from 0.007 to 0.35 after the padded-limb art (the test still passes). Write the output to an untracked run folder, and review the drift with the presentation owner.
- **Historical saves:** offer the October 30 new-game rules (`underground-feeding/1`, `starter-partner/1`, `breeding-support/2`, `climate-water/6`, `grazing-nutrients/1`) as explicit adoptions with a backup.

## Presentation (ChatGPT)

- Refreeze or fix the art catalog variants (`detailed-*`, `wing-root-refinement`).
- Terrain hue continuity (`terrain-cohesion`).
- Player copy style (`player-copy-style`).
- The frequent "The world is busy" notice in mature worlds.

## Working rules

- `main` is the only branch.
- The playable gate (`tools/check-playable.mjs`) passes on Node 22 and 24 before every push.
- New behaviour goes behind versioned rules that new games opt into; worlds built without them stay exactly original.
- No test is weakened or deleted to go green; known failures live in `tests/known-failures.json` with a reason.
