# Need-driven activity per day on 30-second days (October 23, 2026)

**Creator request:** measure option 2 from [the first-month study](WILDLIFE-NEEDS-2026-10-23.md), making need-driven activity count per day rather than per tick on 30-second days, before recalibrating yields.

**The question:** the 30-second day has five times as many ticks as the recorded 6-second day, while daily biology is unchanged. Does activity that repeats per tick or per decision multiply each day's travel and energy use?

## Measurements

### Travel per animal-day, GENVO8-TEST-A, 8 days (`tools/probe-need-movement.mjs`)

| Rules | Day | Tiles a day | With a need | Without a need |
|---|---|---|---|---|
| Old physiology | 6 s | 8.4 | 4.5 | 3.9 |
| Old physiology | 30 s | 17.6 | 8.2 | 9.4 |
| Real needs | 6 s | 6.9 | 6.4 | 0.4 |
| Real needs | 30 s | 34.8 | 26.2 | 8.5 |

### What the extra travel is

- **Herd cohesion and spacing** (`group`, `group-space`): these moves have no need behind them, but they sat outside the rest-when-sated allowance.
  - On old physiology they grew from 0.44 and 0.19 tiles a day to 1.71 and 1.02.
  - Under real needs they reached 1.53 and 1.26, against 0.06 each on the 6-second day.
- **Feeding travel under real needs** grew from 1.9 to 13.5 tiles a day. Broken down (`tools/probe-feed-travel.mjs`):
  - most of it is sated animals walking to bramble, 4–4.6 tiles a day, while moderately low on water. This is the water route using juicy food, which is genuine travel for water;
  - then sunmoss, 1.4–1.5 tiles a day.

  On the 6-second day animals had no time for this travel; that day was too short for real needs.

### What it costs (`tools/probe-energy-budget.mjs`)

Energy spent per animal-day under real needs, as a share of the maximum:

| Species | Movement, 6 s day | Movement, 30 s day | Total, 6 s day | Total, 30 s day |
|---|---|---|---|---|
| Mosskip | 0.005 | 0.031 | 0.13 | 0.18 |
| Rootling | 0.004 | 0.028 | 0.10 | 0.14 |
| Needlejaw | 0.008 | 0.048 | 0.06 | 0.11 |

On the 6-second day, intake falls far short of spending (mosskip: gains 0.04, spends 0.13).

**Movement is about 15% of daily turnover under real needs, and most of it is genuine travel to food and water.** The 1.3–1.8× inflation reported in the first-month study was measured on old physiology, where tiny resting costs let movement dominate.

## Changes

**Herd moves count against the rest allowance** (correction to `day-clock/30s`, `ambient-allowance.js` and the decision step):
- `group` and `group-space` count toward the daily allowance.
- A sated animal that has spent its allowance no longer keeps re-forming the herd.
- The allowance is re-measured to include herd moves on the recorded clock: three seeds, 8 days, `tools/probe-ambient-allowance.mjs`, [data](day-activity-2026-10-23/ambient-allowance-6s.json):

  | Species | Before (tiles a day) | After (tiles a day) |
  |---|---|---|
  | Mosskip | 4.1 | 4.1 |
  | Rootling | 1.2 | 1.2 |
  | Stalker | 5.5 | 5.8 |
  | GenVo | 5.1 | 5.5 |
  | Rillsifter | 2.2 | 3.0 |
  | Mirelick | 1.6 | 2.0 |
  | Podshell | 4.8 | 4.9 |
  | Bankjaw | 2.0 | 2.2 |

- Effect on travel: herd moves fall from 1.71 and 1.23 to 0.46 and 0.59 tiles a day, and travel without a need from 8.8 to 6.2.

**Tried and removed:** patch grazing, where a grazer returns to the patch it last ate from while it holds a full mouthful. Feeding travel stayed at 13.7 against 14.4 tiles a day, because the hypothesis (hopping between random rich cells) was not what drives feeding travel.

**Measurement switch:** `sim.correctionExperiment.socialAllowance=false` (development only) leaves herd moves out.

## Population evidence

**First 40 days, all earlier corrections, with and without the herd allowance** ([data](day-activity-2026-10-23/)):

| Seed | Without (alive at day 41) | With (alive at day 41) |
|---|---|---|
| GENVO8-TEST-A | 46 | 60 |
| PLANET-OBS-3 | 68 | 61 |
| PLANET-OBS-2 | 50 | 41 |

The differences go both ways and are within the run-to-run variation of a single seed.

**360 days** ([data](day-activity-2026-10-23/arm-v1fw-herd-allowance-360d.json)): wild species are gone by about day 91–151, and GenVo stands at 54. This is the same shape as before.

## Conclusion

The premise of option 2, that per-tick activity drives the collapse, does not hold under real needs. The herd allowance is kept as a correctness fix, since it removes travel with no need behind it, and its effect on the populations is neutral. The collapse remains a question of yields against needs, which is option 1, next: [YIELDS-2026-10-23.md](YIELDS-2026-10-23.md).

**Tests:** `tests/wildlife-needs.mjs` checks that:
- herd moves are counted;
- a sated animal that has spent its allowance does not re-form the herd, and it does with the correction switched off;
- recorded worlds keep no allowance.
