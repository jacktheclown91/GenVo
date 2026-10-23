# GenVo v1: dependency-ordered plan (October 23, 2026)

This plan implements the creator's brief "GENVO v1: Complete Development, Survival Rebalance, Visual Overhaul and Canonical Rebuild". The creator has final authority over gameplay, art direction, major architecture and release acceptance. Jam deadline: November 4, 2026, 1:00 PM Central.

## Baseline (verified)

- **Development repository:** https://github.com/jacktheclown91/GenVo, `main` at `96d9f96` (local and origin in sync). Two untracked junk files in the working copy (`h origin main`, `pace=cr-at-eol diff --cached --check`) are not project files.
- **Gate:** `node tools/check-playable.mjs` passes 98 of 98 at `96d9f96`. A rerun on the same HEAD with Codex's cloud work is recorded below once it finishes.
- **New canonical repository:** https://github.com/jacktheclown91/GenVo-v1 is public, empty and created today. Nothing has been pushed to it.
- **Tracked material:** 6,709 files.

| Area | Files | Size | Note |
|---|---|---|---|
| `src/` | 397 | 3.0 MB | the game |
| `assets/` | 772 | 89 MB | includes art review material, not only runtime art |
| `docs/` | 3,762 | 40 MB | reports and evidence |
| `reports/` | 551 | 13 MB | historical |
| `tests/` | 620 | 2.4 MB | 98 in the gate; the 2026-10-23 ungated audit found 26 older failures |
| `tools/` | 507 | 2.7 MB | |
| `.github/workflows` | 49 | | many one-off phase smokes |

- **Survival physiology:** player and wildlife already share one physiology (`PHYSIOLOGY_PARITY`, 2026-10-16). The old player multipliers, the cheaper manual movement and the opening immunity are off. "I never lose" is therefore not a hidden player protection; it has to be measured in the shared rules (Phase 1).
- **Clock:** 8 simulation ticks per second and 48 ticks per day, so 6 seconds per day. A season is 8 days (48 s) and a year is 32 days.
  - `dayTicks` is used in 60 places across 28 files: memories, fades, cooldowns and daily cadences.
  - Metabolism, movement and many rates run per tick.
  - So raising `dayTicks` alone would multiply daily costs, and slowing the tick rate alone would make every animal crawl (see Phase 1).

## Ownership

Per the brief, both agents work on one canonical `main`. Neither overwrites or reverts the other's work, and neither force-pushes.

| Claude | Codex |
|---|---|
| Simulation, physiology, ecology, reproduction, inheritance, pacing (the day clock), autonomy, persistence and saves | Visual identity, interface styling and layout, icons |
| Gameplay UI logic: what a control does and which state it shows | Creature art, anatomy refinement, sprite animation, rendered behaviour expression |
| Asset loading; audio event integration (which real event fires) | Environment art, visual effects, main menu and Creature Lab presentation |
| Performance engineering; test organisation; automated and browser verification | Audio assets and sound design |
| Clean-repository migration; release build validation | Screenshots and release presentation material |

**Shared files** need a heads-up, ideally in a commit message or a note in this file, before structural edits: `src/render/renderer.js`, `src/main.js`, `index.html`, `styles.css`, `src/ui/front-end.js`, `src/ui/creature-editor.js`.

- **Rule:** presentation reads authoritative state and never becomes a second biological authority.
- **Claude** exposes state and stable events: reaction stages, feeding receipts, combat and courtship records, threat-display verdicts, world-story beats.
- **Codex** turns them into pictures and sound.

## Phases, in dependency order

Dates follow the creator's allocation and are targets, not reasons to ship unfinished systems.

### Phase 1: survival evidence and day length (Claude, Oct 23–26). Blocks the balance work.

1. **Measure before changing**, on equal seeds, with real resource accounting:
   - passive AUTO; idle (no input);
   - reckless travel; prepared play;
   - winter with different strategies; a biome transition.
   - Record energy and water margins, distance per day, causes of death, and how often AUTO resolves danger.
2. **Explain the wandering:** trace autonomous targets (target length, re-targeting rate, competing priorities) for the player on AUTO and for wildlife.
3. **Day-length policy**, versioned and saved with each world:
   - **Separate movement time from the biological day:** movement, combat and control stay in real-time steps at today's speed. Per-day biology (metabolism, growth, ageing, plant growth, pregnancy, seasons) keeps its daily totals. Per-tick rates are scaled by ticks per day.
   - **Day-based cadences** convert through one helper.
   - **Old saves** keep their recorded day length.
   - **Proof:** parity and determinism tests show that daily biological totals are unchanged by the policy, and that only the real-time length of a day changes.
4. **Compare 12, 16 and 30 seconds per day** with the measurements from step 1: distance per day, encounters per day, preparation time per season. The creator chooses.

### Phase 2: consequences and seasons (Claude, Oct 26–28). Needs Phase 1.

- **Travel:** cost per distance against daily needs; unfamiliar ground (food compatibility, water, predators, climate) made legible and consequential, using the existing systems.
- **Seasons:**
  - Autumn preparation pays off: food storage, shelter, known winter food, migration, torpor where the anatomy allows.
  - Winter pressure differs by biome. It comes from the existing thermal, ice, snow and plant-phenology systems, not from multipliers.
- **Injuries** that persist and matter; death and extinction explained ("why it happened").
- **AUTO checks:** confirm AUTO is legitimate but not omniscient. No crippling.

### Phase 3: performance (Claude, Oct 27–30, in parallel with Codex visuals).

- **Simulation ticks:** perception and decision spikes (perception reached 134 ms on one world), made cheaper with outcome parity (`tools/simulation-parity.mjs`).
- **Mature and regional play:** remeasure the mature world and regional transitions on a real GPU (frame-time distributions).
- **Memory:** garbage collection and memory in long runs.

### Phase 4: readable evolution and the first 15 minutes (Claude and Codex, Oct 28–31).

- **Evolution:** generation transitions show real inherited gains, losses and trade-offs (extends the first-young card and the Lab verb list). Consequence comparisons come from real performance (speed, cold, diet, senses).
- **First 15 minutes:** evaluated against the creator's minute targets on fresh and advanced starts, with no scripted events.

### Phase 5: canonical rebuild (Claude, staged from Oct 26, cut-over Nov 1–2).

1. **Classify every tracked file:** active runtime, build dependency, development tool, required test, compatibility dependency, historical record, redundant, verified obsolete.
   - Build it from the import graph plus dynamic imports, save restoration, scenario loading, browser assets, Lab dependencies, and test and tool consumers.
2. **Reproducible clean-source script:** an allowlist, with no `.git` history and no caches, screenshots or old packages, plus licences, credits and AI disclosure. It can be re-run at any time, so ongoing work continues here until cut-over.
3. **Test reorganisation:** core, integration, extended and historical. Historical tests are retired only one by one, with a reason, and their coverage kept.
4. **Workflows:** a few meaningful CI workflows instead of 49 phase smokes.
5. **Equivalence:** prove the clean build is equivalent (gate, browser journeys, saves, evolved-world checkpoints).
6. **Push to GenVo-v1.** The original repository stays untouched as the fallback and historical archive.

### Phase 6: release (Nov 2–4).

- A reproducible web build from clean source; asset completeness; save and load validation; accurate screenshots.
- The itch.io page changes only with creator authorization.

### Codex track (parallel, from now)

- One interface design system: the natural-history aesthetic on the existing palette.
- Main menu; New World with illustrated world-start cards (the functional cards from 2026-10-23 are the logic layer to style).
- Creature Lab layout (creature at 50–60%, catalog on the left, consequences on the right); journal, inspector, map, evolution summary, HUD and notices.
- Anatomy art and animation for the action list; audio identity.

## Decisions for the creator

1. **Day length:** 12, 16 or 30 seconds, after the Phase 1 comparison.
2. **Migration timing:** recommended is staging the clean-source script now and cutting over Nov 1–2, once it demonstrates equivalence, so jam work never stalls on the move.
3. **Food rule:** the pending "food-property" meal rule (each food's own bite size and water from juicy food) roughly doubles wild births in 360-day runs (`docs/physiology-parity/`). Whether it belongs in the survival rebalance is open.
4. **Default camera zoom:** 2× (more land) or 3× (readable creatures and animation).

## Status log

- **2026-10-23:** plan written; baseline verified (gate 98 of 98 on HEAD including Codex's cloud work); GenVo-v1 inspected (empty).
- **2026-10-23, Phase 1 first findings** (`docs/SURVIVAL-EVIDENCE-2026-10-23.md`):
  - A resting adult loses 0.34% of its energy and 0.35% of its water per day (summer water 1.05%), so it would take about 290 days to starve, its whole lifespan.
  - A whole day of walking covers 10 tiles at 6 s per day.
  - Passive AUTO and idle play die only to predators.
  - The cause is shared physiology with tiny daily needs, not player protection.
  - Decisions needed: day length, and target starvation and dehydration timescales for a versioned metabolism policy.
