# Playtest corrections (October 22–23, 2026)

Creator playtest priorities:
1. AUTO locomotion animation.
2. Anatomical-vision presentation.
3. Remaining frame pacing.

All three are presentation and pacing changes. Perception, AI sensing, interaction legality, locomotion physics, biological costs, saves and simulation results are unchanged.

## 1. AUTO locomotion

**Cause** (measured in the exported build):
- Under AUTO there is no keyboard input, but `predictPlayerPose` still returned the creature's raw position. That position only changes on the 8 Hz simulation tick, so the drawn creature hopped eight times a second.
- The fallback interpolation also used the 64 Hz control rate.
- The player was drawn walking only while mid-interpolation, without the displacement-based grace wildlife gets.

Result: in AUTO the walk cycle never showed while travelling (0% of frames), and 85% of travelling frames showed no movement at all.

**Fix** (`src/render/renderer.js`):
- The keyboard prediction is used only when it actually predicts input. Otherwise the player is eased across the real tick rate, simulation rate under AUTO and control rate otherwise, with that easing kept synced while the prediction is in use.
- The player's walk pose follows its actual drawn displacement (`recentlyMoving`), on its own motion state, so keys, click-to-move and AUTO behave alike.
- Leg anatomy still sets stride, lift and cadence (`LEG_GAIT`: walking, spring, runner, sturdy, webbed, padded, grasper, digging and climber legs differ).

**Evidence** (`tools/verify-auto-locomotion-browser.mjs`, exported build, 1x; [locomotion/](playtest-corrections-2026-10-23/locomotion/) holds the before and after videos and JSON):

| Case | Walking while travelling, before → after | Still frames while travelling, before → after |
|---|---|---|
| AUTO, Spring jumper | 0% → 95% | 85% → 8% |
| AUTO, Shore swimmer | 0% → 76% | 87% → 24% |
| AUTO, Burrower | 0% → 82% | 87% → 18% |
| AUTO, Flier | 0% → 83% | 87% → 17% |
| Keyboard, Spring jumper | 88% → 89% | 13.5% → 13% |

Remaining still frames are stops at targets and sliced day-boundary ticks. A stale-easing jump of 6.8 tiles, seen once when a key was released during development, was fixed before commit.

## 2. Viewing modes

Three presentation modes are selectable in Esc → Options → View. The choice is stored in browser storage (`genvo.viewMode`), not in saves. Implemented in `src/render/view-modes.js` and `src/render/sensory-fog.js`.

| Mode | Sensed | Remembered | Unexplored | Vegetation outside the senses |
|---|---|---|---|---|
| Biological Vision | clear | very dark | near black | hidden |
| **Comfort View** (default) | clear | lightly dimmed terrain | dimmed terrain | hidden |
| Sandbox View | clear | slightly dimmed | dimmed | shown (presentation only) |

**No leaks:**
- Creatures remain filtered by perception (`visuallyObservable`), exactly as before.
- Live map layers are clipped to the cells the creature currently senses, computed at the start of each frame from the same perception authority. These are carrion, stalker dens, sites, eggs and tracks in every mode, plus vegetation and habitat scenes in Biological and Comfort.
- The player's own knowledge stays visible: shelters, family guidance, memory, territory and migration overlays, and guide targets.
- Comfort View shows the shape of unexplored land, including water. That is the deliberate trade-off for readability.

**Transitions:** each cell's darkness eases over time (reveal about 12/s, fade about 3/s, so turning no longer snaps). It is drawn as one mask pixel per cell, scaled up with smoothing, which replaces the hard-edged rectangles. Caves, water depth, terrain occlusion, snow and the sensory signals are unchanged.

**Evidence** (`tools/verify-view-modes-browser.mjs`, exported build, after 50 s of AUTO exploration; [visibility/](playtest-corrections-2026-10-23/visibility/)):
- With the world frozen, all three modes draw the same 8 creatures.
- A paint-through probe confirms the live-layer clip covers 29 of 29 sampled sensed cells and 0 of 211 unsensed cells in each mode.
- Default is Comfort, the Options select works, there were no page errors, and rapid turning was recorded.
- Before and after session videos: `visibility/before.webm`, `visibility/after-comfort.webm`, plus a still comparison.

`tests/view-modes.mjs` (in the gate) checks the default, the ordering of fog levels, Sandbox-only vegetation, the stored preference, and that the information layers are clipped.

## 3. Frame pacing

A CPU profile of 90 s at 1x (days 19–34) found 60 frames of 100 ms or more, mostly 100–250 ms (worst 366 ms). By dominant cause:

| Dominant cause | Long frames |
|---|---|
| Headless software rasterising (`(program)`) | 43 |
| Simulation slices (mostly garbage collection) | 7 |
| Dynamic-tile drawing | 4 |
| Autosave snapshot | 3 |
| Garbage collection | 2 |

Without real-GPU measurements, nothing here justified a renderer rewrite. The new fog costs less than the previous full-screen cache.

The sliced day-boundary tick holds player control while it runs. Early in a world that window is about 50–150 ms median, under 470 ms at worst; it is longer late in a world.

To diagnose lag on a real machine, use the in-game frame meter (backquote). It shows per-part timings.

## Not done

- Manual playtesting by the creator.
- Real-GPU timing.
- A longer late-game pacing run with these changes.
- The upload kit in `../GenVo-itch-upload-2026-10-22/` holds the `af020f9` build and predates these fixes.
