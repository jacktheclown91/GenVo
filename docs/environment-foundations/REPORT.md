# Elevation and drainage foundation - October 17

New worlds now generate dimensionless elevation above the existing freshwater datum, with smooth seeded uplands and valleys approaching the existing river network. This is a terrain foundation fitted to existing freshwater topology, not a geology-first river generator. No simulation RNG draws are added, and existing water masks, initial producer stocks and organism coefficients are unchanged by generation.

Four-neighbor slope and strictly downhill drainage destinations are derived from elevation. Local basins remain basins; no forced drainage outlet is fabricated. Groundwater exchange now uses hydraulic head (elevation plus normalized groundwater store). Every pair exchanges the same volume in opposite directions, each donor supplies at most one quarter of its prior store per edge, map edges remain closed, and existing open water is a fixed reservoir. Net river exchange is recorded in the existing lateral boundary term. Infiltration, evaporation, producer withdrawals and storage overflow retain the existing accounting. Surface runoff still leaves the modeled store; this slice does not simulate river discharge or erosion.

Terrain fields have normalized model units, not calibrated meters or hydraulic conductivity. Elevation affects water distribution and therefore existing producer water availability; the derived slope does not yet impose movement costs, and this change adds no climate lapse rate, marine depth, salinity, biome bonuses or new creature physiology.

## Persistence

Terrain schema 1 saves elevation explicitly. Slope and drainage are derived on restore, rather than trusting saved directions. Wrong-sized, non-finite, out-of-range or wrongly typed elevation fails validation. The existing save schema remains compatible through an optional world terrain record. Saves without terrain restore with legacy flat-ground water exchange and preserve that mode on subsequent saves. Existing saves are not silently assigned newly generated topography.

## Presentation and focused evidence

The ground palette now includes continuous interpolated relief lighting from actual elevation. This is restrained ground shading, not visible mountain geometry. Inspected real headed-browser frames: `runtime/new-world.png`, `runtime/walking.png`, `runtime/continued.png`. Native art loaded; the player moved from (18.5,37.5) to approximately (23.38,37.98), ticks advanced from 30 to 71, and Continue loaded the temporary context's existing autosave at tick 46 without page errors. These frames establish fresh-world rendering and movement only. The restored autosave predates the final walking position; exact biological save/resume is established by the focused tests, not by claiming that screenshot represents the latest tick.

The browser used a newly launched nonpersistent Chromium context with empty storage. No existing user browser profile or autosave was opened. Captured elevation range was 0 to approximately 0.896.

Focused topography fixture passes: seeded determinism and variation, acyclic strictly downhill directions, equal-store downhill exchange, internal conservation, extreme dry/saturated states, 12 daily budget checks, exact whole-simulation resume, old-save fallback and corrupt-elevation rejection. Affected soil/weather fast selection: seven pass, zero new failures, one long scenario explicitly deferred (14 seconds). Full fast regression and one canonical 100-day observation are recorded below when completed. No multi-world or 420-day rerun is scheduled.

## Fast regression result

`docs/test-runs/topography-fast-2026-10-17.json`: 384 pass, five existing known failures, zero new failures, zero timeouts, 12 long suites explicitly deferred; 401 total, 109 seconds. Observer Play passed under its existing ceiling.

## Canonical 100-day integration completed

One `GENVO8-TEST-A` world completed all 100 days in 94.9 seconds with strict integrity passing. Initial baseline plus requested completed-day checkpoints 1, 10, 30, 60 and 100 were recorded. Full receipt: `docs/test-runs/topography-development-100-2026-10-17/ecology-diagnostic/GENVO8-TEST-A.json`; compact checkpoint summary sits beside it. No multi-world or long-horizon rerun was made.

| Completed day | Living animals | Births | Deaths | Seed cohorts | RSS MiB |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0 | 181 | 0 | 0 | 0 | 71.0 |
| 1 | 181 | 0 | 0 | 85 | 100.8 |
| 10 | 180 | 0 | 1 | 4821 | 268.4 |
| 30 | 233 | 55 | 3 | 71748 | 504.6 |
| 60 | 282 | 104 | 3 | 188597 | 811.3 |
| 100 | 375 | 198 | 4 | 338438 | 1359.1 |

Largest sampled recent absolute daily water closure: 0.00000550. These are observed outcomes, not population targets. RSS grows substantially and is not a post-GC live-heap measurement; this run does not establish bounded long-term memory or mature-world frame pacing. The earlier retained long-run cohort growth remains an unresolved scalability concern. Ordinary gameplay through day 100, full mountain scenery, elevation-based climate and marine environments remain unproven/unimplemented.
