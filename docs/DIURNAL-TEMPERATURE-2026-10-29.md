# Day–night temperature (`diurnal-temperature/1`)

This follows S4 (arid physiology) and S5 (climate water). Creator direction, October 29: "Day-night cycle".

**Status.** Implemented and **on for new games** (`SURVIVAL_OPT_IN`). Saved worlds without `diurnalRules` feel only the daily mean, exactly as before.

## What existed

The simulation had no time of day. Each cell's temperature moved toward its daily climate value once a day, so heat and cold were the same at noon and midnight. Nothing about the hour helped a desert animal, whether resting in the heat or moving at night, and presentation had no day phase to draw from.

## Rule (`ecology/diurnal-temperature.js`)

**Air temperature.** Air = daily mean + amplitude × cos(2π(time of day − 0.58)).
- **Timing:** warmest mid-afternoon, coldest just before dawn.
- **Amplitude:** 0.06 + 0.12 × (1 − soil moisture). That is about ±3 °C on wet ground and up to ±9 °C on bare dry ground (1 unit ≈ 50 °C, as in S5). Clear, dry air radiates heat away at night, which is why deserts show the widest swings. Open water swings a quarter as much, and burrows already damp temperature by 75%.

**Exact daily mean.** Metabolism samples the day at 8 evenly spaced biological steps, and the cosine averages to exactly zero over them. Daily-mean exposure is therefore unchanged; only its timing differs.

**Time of day** comes from the tick count, so there is no new saved state: sunrise at 0.25, noon at 0.5, sunset at 0.75.

**Who feels the hour:**
- metabolism: thermal load, and heat-water cost under arid physiology;
- thermal refuge choice;
- entering and keeping cold torpor, so nightly torpor becomes possible in cool seasons;
- aestivation's heat check;
- infant cold exposure;
- the arid expression state.

**Who keeps the daily mean, deliberately:** soil and evaporation, plants, seasons, migration and habitat scoring, founding, and egg climate. These are processes on the scale of days or longer.

**Presentation contract (Codex, read-only).** `dayPhaseOf(sim)` returns `timeOfDay`, `daylight` (0–1) and `night`, for lighting. Presentation never writes it.

## Evidence

`tests/diurnal-temperature.mjs` (new, gated) checks:
- the afternoon peak and pre-dawn low;
- dry against wet ground, and water a quarter as much;
- the 8 daily samples averaging exactly to the daily mean;
- the day phase;
- the real metabolism step on hot, dry, waterless ground, where an afternoon costs more than 1.5× a night's water;
- saves, and the unknown-rule refusal;
- recorded worlds unchanged at every hour.

The thermal refuge, cold torpor, arid physiology and climate-water suites pass.

60-day new-game soaks with all rules on, day 61 alive and births:

| Seed | Before | With day–night cycle |
| --- | --- | --- |
| SOAK-SIZE-1 | 136 / 20 | 140 / 13 |
| SOAK-SIZE-2 | 134 / 8 | 131 / 10 |
| SOAK-SIZE-3 | 164 / 2 | 157 / 0 |

This is within run-to-run spread. Observation only.

## Not yet

- **Time-of-day behaviour.** Animals benefit from refuges and torpor when the air is hot or cold, but they don't yet plan activity around the hour (nocturnal foraging as a learned or inherited rhythm). That is the next behavioural step.
- **Presentation.** Lighting from `dayPhaseOf` is Codex's.
