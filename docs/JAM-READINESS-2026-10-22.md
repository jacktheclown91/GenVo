# Jam readiness pass (October 22, 2026)

These are the creator's jam priorities, in order:
1. First Legacy gameplay acceptance.
2. Stalls and performance.
3. Player-facing clarity.
4. Persistence and continuity.
5. Release preparation.

This pass covers items 1–4 as far as automation can. Item 5 waits for the accepted art.

## 1. The First Legacy at 1x, in real time

`tools/verify-first-legacy-realtime.mjs` plays the exported game in headless Chromium through its own UI, with no time acceleration and no state edits:
- a fresh New World (PLANET-B0-A) with the opening played, not skipped;
- AUTO switched on through the in-game Menu;
- the Creature Lab left with "Keep the old body" when a pregnancy opens it;
- once a grown heir exists, H to open the chooser and H to confirm.

Frame intervals and long tasks are recorded throughout and matched to what the game was doing at the time.

Results of the final run ([after](jam-readiness-2026-10-22/after/)):

| Time at 1x | Event |
|---|---|
| 0:47 | Opening complete; pill shows `Legacy 1/3` |
| ~2:00 | Young born; `Legacy 2/3` |
| 5:44 | Grown heir (day 52, 6 offspring) |
| 5:47 | H handoff; generation reveal; summary |
| 6:47 | Continue Evolving; play resumes as generation 2, with pill `G2/8` |

No page errors. Frames: [opening](jam-readiness-2026-10-22/after/opening.png), [before handoff](jam-readiness-2026-10-22/after/before-handoff.png), [chooser](jam-readiness-2026-10-22/after/heir-chooser.png), [reveal](jam-readiness-2026-10-22/after/generation-reveal.png), [summary](jam-readiness-2026-10-22/after/legacy-summary.png), [continued](jam-readiness-2026-10-22/after/continued.png).

This is automated evidence of the full loop at normal speed. **It is not manual-play acceptance.** It shows nothing about how readable the game is to a new player who has to steer, feed and court by hand.

## 2. Stalls

**Measurement.** The first real-time run showed a median frame of 17 ms, but:
- 116 frames over 250 ms;
- 171 long tasks over 200 ms, most of them 650–760 ms;
- the stalls were not tied to region crossings or saves.

Profiling located them in simulation ticks, not rendering spikes. In late game (day 52, 252 animals), per simulated day:

| Tick | Cost before | Main work |
|---|---|---|
| Day boundary | 575–780 ms | Botanical reproduction (pollen delivery and wind pollination, gamete and genome construction and validation), producer growth, soil |
| Tick 5 | 275–375 ms | Daily migration survey: breeding state for every wild animal through dietary demand, `canReach` and `iceSurfaceReach` |
| Every 6th tick | 60–130 ms | Social observation through `canReach` and `iceSurfaceReach` |

Rendering is the steady cost: about 40% of main-thread time at a 1600×900 headless viewport. It is not the source of the spikes.

**Fixes.** Both are value-identical.
- **`iceSurfaceReach`** (`src/lineage/ice-locomotion.js`) cached its connectivity map by each animal's exact body mass, keeping 8 entries. Every animal missed, so every reach query re-flooded the whole map.
  - Loads that lie between two neighbouring ice capacities allow exactly the same cells, so the map is now keyed by the smallest covered-ice capacity at or above the load.
  - The cache holds 32 entries and is still invalidated by the ice and topology revisions.
- **Botanical validation** (`src/ecology/botanical-genetics.js`): `validBotanicalGenome` and `validBotanicalGamete` remember positive results for deep-frozen genomes and gametes, whose contents cannot change. Mutable or invalid objects are checked every time.

**Evidence.** `tools/simulation-parity.mjs` hashes every day's full snapshot canonically: numbers by value, typed arrays by bytes, Maps and Sets in order. Committed HEAD and the change give identical digests on every day:

| Seed, days | Total tick time (HEAD → change) | Worst tick in last 10 days |
|---|---|---|
| PLANET-B0-A, 50 | 62.1 s → 46.1 s (−26%) | 602 → 598 ms |
| PLANET-OBS-2, 40 | 36.6 s → 28.9 s (−21%) | 687 → 622 ms |

In late game, tick 5 drops to about 170 ms and the periodic tick to about 45 ms.

In Chromium at 1x over the same journey ([before](jam-readiness-2026-10-22/before/report.json), [after](jam-readiness-2026-10-22/after/report.json)):

| | Before | After |
|---|---|---|
| Frames over 250 ms | 116 | 74 |
| Long tasks over 200 ms | 171 | 128 |
| 99th-percentile frame | 200 ms | 167 ms |
| Worst task during play | about 760 ms | about 700 ms |

Each run's single largest task (2,286 ms before, 1,156 ms after) was at world creation.

**Remaining.** The day-boundary tick still costs about 500–600 ms in Node and up to about 700 ms in headless Chromium, once per simulated day (6 s at 1x). What remains is spread across about 25 botanical and producer functions with no single hotspot.

`FrameStepper` deliberately treats a tick as atomic. Removing this hitch therefore means one of two things, which is a design decision:
- spreading the day-boundary work across frames, which would break that contract and requires deferring saves, crossings and input while a tick is partly done;
- a deeper reorganisation of daily botanical work.

Headless Chromium uses software rendering; frame times on a real GPU will differ.

## 3. Clarity: the opening never finished under AUTO

Moist food can meet a creature's whole water need (`foraging.js`), so a creature on AUTO never drank. "First drink" was never recorded, and the opening stayed at 2/3 ("Eat and drink") for the entire run. That hid the `Legacy n/3` guidance and showed the opening goals again to the heir.

Under AUTO only, the opening now counts the creature as watered once it has eaten and its water is at least 60%. In manual control a drink is still required, so the opening still teaches drinking. Covered in `tests/opening-goals.mjs`.

## 4. Persistence along the journey

`tests/journey-continuity.mjs` (in the gate) plays a native New World under AUTO. It saves, reloads and continues at five points:
1. a natural pregnancy;
2. a natural birth;
3. the handoff to an heir that earns The First Legacy;
4. advanced anatomy (raptor and sentinel eyes applied through the lineage authority);
5. after a border crossing.

At each point the save round-trips exactly, and the reloaded world continues identically to the world that was never saved. Two steps are staged: for test time, the child is aged to maturity, and the heir is placed on a natural frontier.

**Bug found and fixed:** the First Legacy record was not carried across a regional crossing. The destination world lost the achievement and could award it a second time. `legacyMilestones` is now in the crossing copy list (`src/world/planetary-travel.js`). It is copied only when present.

## Not covered

- Manual play by a person at 1x.
- A real GPU or other browsers.
- The day-boundary hitch, described above.
- Browser-level save and reload through IndexedDB during these moments. The Node snapshot path is what is tested.
- Release packaging.
