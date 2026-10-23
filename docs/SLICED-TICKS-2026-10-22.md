# Sliced simulation ticks (October 22, 2026)

**Creator direction:** spread the day-boundary tick across frames, keeping results identical, and defer saves, crossings and input while a tick is in progress.

## Design

- **Resumable tick** (`src/sim/simulation.js`):
  - `updateSteps()` is the tick body as a generator; `update()` completes any pending tick, then runs a whole tick at once.
  - Node, tests, regional replays and every existing caller therefore see the same atomic tick as before.
  - The body pauses only:
    - between phases;
    - inside daily vegetation (every 16 land rows; inside botanical reproduction between embryo batches, pollen packets and plant kinds, and every 2,048 cells of the flowering scan);
    - inside perception (the migration survey pauses every 4 animals);
    - inside decision (every 24 animals).
  - A pause reads and writes nothing, so the work, its order and every random draw are unchanged. `src/sim/resumable.js` holds `drain()`.
- **Browser API:**
  - `beginTick(input, options, deadline)` starts a tick and runs it until the deadline;
  - `continueTick(deadline)` resumes it;
  - `finishTick()` completes it;
  - `tickInProgress` reports it.

  The pending tick is kept in a module WeakMap, never on the instance, so it cannot enter saves, copies or travel.
- **Frame pacing** (`src/sim/frame-stepper.js`):
  - A pending tick is resumed first on each frame, with a 24 ms slice budget, and nothing else steps until it completes, even while paused.
  - Control steps and ticks keep the exact unsliced order.
  - Frame time keeps accumulating and is caught up afterwards under the normal 12 ms step budget.
- **While a tick is pending** (`src/main.js`):
  - A frame only draws the scene. Travel, regional and planetary work, tutorial, editor, notices and HUD do not run.
  - Planetary jobs wait: `playing` and border preparation require no pending tick.
  - Travel refuses to start.
  - Installing another world completes the tick first.
- **Input:**
  - Keyboard, pointer, mouse, click and context-menu events that arrive mid-tick are held in order (`heldInput`) and replayed once the tick completes.
  - Text fields and Ctrl/Meta shortcuts are never held.
- **Saves:**
  - `createSimulationSnapshot` completes a pending tick before reading, exactly as the atomic tick would have. It is the one path for saves, travel copies and residency writes, including page-hide saves while frames are stopped.
  - A scheduled autosave that lands mid-tick reschedules itself 120 ms later instead.

## Evidence

- **Identical results** (`tools/simulation-parity.mjs`, canonical daily snapshot digests):
  - PLANET-B0-A, 50 days, every tick advanced one step at a time (up to 593 pauses in a tick): the digest equals the original HEAD before this session's optimizations.
  - PLANET-B0-A and PLANET-OBS-2, 30 days, sliced: equal to committed HEAD.
- **`tests/sliced-ticks.mjs`** (in the gate):
  - three fully fragmented days equal atomic days;
  - a mid-tick save records the completed tick and round-trips;
  - `update()` completes a pending tick before its own;
  - the pending tick is not instance state;
  - the stepper resumes first, holds control steps, keeps order, and completes a started tick even while paused.
- **Step sizes** (Node, day 45–49, 252 animals). The longest uninterrupted step:

  | Tick | Before | After |
  |---|---|---|
  | Day boundary | 520–720 ms (one block) | 15–24 ms |
  | Tick 6 | 160–215 ms | about 15 ms |
  | Other stride ticks | about 60 ms | about 7 ms |

  Single steps of 50 ms or more were major garbage collections, which cannot be split.
- **Chromium, exported build, 1x, the full First Legacy journey** (PLANET-B0-A, [report](jam-readiness-2026-10-22/sliced/report.json)), compared with the previous build:

  | | Before | After |
  |---|---|---|
  | Worst frame | 700 ms | 283 ms |
  | Frames over 250 ms | 74 | 19 |
  | Long tasks over 200 ms | 128 | 96 |

  - The heir was reached on day 56 at 5.9 minutes, about real time, so the game kept pace.
  - The milestone flow worked, with no page errors.
- **`tools/verify-sliced-ticks-browser.mjs`:**
  - A real backquote pressed during a pending tick had no effect and was held (keydown and keyup).
  - It was replayed when the tick completed, toggling the frame meter.
  - Day-boundary ticks spanned up to 7 frames.

## Limits

- **Remaining long frames** (about 230–260 ms, roughly three per simulated day in headless Chromium) are now rendering: dynamic tiles, environmental history, terrain and vegetation refresh, water masks, plus software rasterisation. They are not simulation ticks. Real-GPU timing is not measured.
- **During a sliced tick:**
  - creatures hold still for its duration, roughly half a second to a second in late game at 1x;
  - player input waits until it ends;
  - the world then catches up.

  The camera and drawing stay live.
- The FPS overlay's per-phase timers wrap the drained phase methods, so they no longer see ticks run through `updateSteps`. They only show work outside slicing.
