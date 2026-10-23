# First-session review: pacing, first impressions, presentation (October 23, 2026)

**Context:** the creator named three jam risks: performance, first impressions and presentation. They then set the next milestone as the Living Creature Pass, with performance work scheduled for Oct 29–30. This review records evidence for those windows. It changes no game code.

## 1. Performance on a real GPU

This is the first measurement on real graphics hardware. The earlier ones used headless software rendering.
- **Hardware:** NVIDIA GeForce RTX 3050, GPU canvas, rasterisation and compositing enabled.
- **Run:** visible Chromium, exported build, fresh Day 1 world with about 196 animals.
- **Tool:** `tools/measure-real-gpu-pacing.mjs` ([data](first-session-review-2026-10-23/real-gpu-pacing-new-world.json)).

| 30 s at 1x | fps | median frame | p95 | p99 | frames over 100 ms |
|---|---|---|---|---|---|
| Walking by hand | 52 | 13.4 ms | 40 ms | 160 ms | 35 |
| AUTO | 54 | 13.4 ms | 40 ms | 147 ms | 18 |

The median frame is smooth. While walking, though, a 150–270 ms hitch occurs about once a second. That is the lag a new player feels.

**Attribution:**
- The browser's Long Animation Frame API puts every hitch inside the game's own per-frame function (`frame` in `src/main.js`), with no layout or style cost.
- A CPU profile of 29 long frames while walking splits the time inside them as follows:
  - **Renderer (`render`): about 64%.** Within that:
    - canvas recorder flush: about 15%, mostly large `drawImage` calls;
    - dynamic tile drawing: about 10%;
    - terrain chunk refresh as the view moves: about 8%. This is `stepTerrainChunkWork`, then `buildVisualWaterMask`, then `smoothSeedNoise` / `smoothedWaterScore`;
    - creature drawing: about 7%.
  - **Simulation tick slices: about 16%.**
  - **Garbage collection: about 4%.**
  - **`getBoundingClientRect`: about 3%.**

**Suggested order:**
1. Spread or cache the terrain water-mask rebuild that happens as the view scrolls.
2. Reduce full-layer `drawImage` work in the recorder flush.
3. Look at dynamic tiles.

The simulation share is already sliced, and making it cheaper must not change outcomes.

**Not measured yet:** the established and mature starts (Day 31 and Day 101), and other GPUs.

## 2. First impressions

These are the first two minutes with default choices and no setup, as a first-time player meets them (`tools/capture-first-minutes.mjs`, [log](first-session-review-2026-10-23/first-minutes-log.txt)).

**What works:**
- The title screen shows the living world behind the menu.
- A world is ready about 3 seconds after Begin.
- The first frame shows the creature with a gold ring, a short movement hint and three goals.
- After walking, the next goal hint points at water ("click water for Approach & Drink").

**Findings:**
- **The New World screen speaks engine language** ([screenshot](first-session-review-2026-10-23/02-new-world.png)). It shows Geography, Starting point and Starting creature menus. The help text includes "finite archive/projection limits… not yet infinite or seamless", "legitimate guided precursor design" and "Import a real evolved-world checkpoint". The creature menu defaults to "Continue the recorded lineage". The choice between a new ecosystem and an established one (Day 1, Day 31, Day 101) is hard to read. This is the creator's point 5.
- **Field-guide notices in the first minute.** Every 5–10 seconds a notice reads like "spotted a stout torso, eyespot, digging forelimb, nibbler mouth and fat tail on a wild creature · each now costs 1 point less to evolve". It is followed by "Trial complete: Spot five wild body parts · counts toward bonus mutation points". These use vocabulary the player has not met yet, and they compete with the movement hint.
- **Pace.** Day 20 is reached after 2 minutes, so a season lasts about 50 seconds. That helps the ecological story beats, but early survival pressure arrives fast.
- **Goals.** After two minutes of walking without drinking, goals still read 0/3, which is expected without input.

## 3. Presentation

These are visible inconsistencies a judge would notice in the same captures ([first frame](first-session-review-2026-10-23/04-first-frame.png), [two minutes in](first-session-review-2026-10-23/10-after-120s.png)):
- **Debug-like readouts in the world:** a floating dive depth ("↓ 0.21") over swimming creatures, a "scent" text label under the player, and "Planet 69, 73 · Region 0, 0" coordinates in the HUD.
- **Notice styles differ:** progress cards with a "+" prefix, action cards with ✓ or ×, and a grey weather chip ("Cold spell · below seasonal temperature") in a third style at mid-left.
- **Fog edges:** remembered ground shows large stair-stepped blocks at its edges in Comfort view.

## Status

This is evidence only; nothing here is fixed yet. It feeds the creator's schedule: first-session improvements and performance on Oct 29–30, and art and UI on Nov 2–3.
