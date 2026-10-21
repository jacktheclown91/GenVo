# Finite cave drinking through shared actions

`src/ecology/cave-drinking.js` now owns cave drinking availability and execution for players and underground wildlife. It composes the existing exposed-groundwater, anatomical hydration capacity, sensory targeting and physical reach authorities. HUD Drink, mouse contextual Drink cave water, E-selection and Shift+E call the same simulation action; UI does not invent a separate biological rule.

## Physical debit and accounting

A drink removes water from the existing Float32 groundwater owner at the actor's actual passage. It cannot exceed the exposed liquid, requested drink size or remaining hydration capacity. The explicit dimensionless conversion is 0.0001 normalized water per hydration point. Hydration is credited only from the exact representable debit. No surface filter meal, energy, algae or extra water stock is created. Source water-table exposure and displaced gas capacity update immediately through their existing authority.

`core/float32-transfer.js` supplies the bounded debit primitive shared by cave drinking and funded springs. It never rounds a donor debit past the declared allowance; a sub-quantum transfer can do no work. The previously repaired spring limit remains unchanged.

Immediate cave withdrawals accumulate in saved `soilWater.pendingCaveDrinking` and `totals.caveDrinking`. The pending amount is an output receipt, not a stored water inventory. The next soil step includes the already-withdrawn amount in its opening accounting boundary and records it once as an output, then clears the pending receipt. This closes the finite-water budget without rewriting a closed daily history. Snapshot validation rejects malformed cumulative/pending/output records.

## Gameplay and compatibility

Targets carry the underground layer and exact cell identity. Queries are read-only. Closed/depleted water, stale coordinates, another layer, an unseen source, paused play, unfinished movement and full hydration are revalidated at execution. A selected depleted source does not silently substitute another one. Approach points to the actual shallow cell through the existing collision authority. Historical regions lacking exposed-water policy retain their previous disabled cave drinking behavior.

Thirsty underground wildlife use the same execution and finite debit at their normal interaction cadence while in contact with a seep; they gain no special unlimited-water path. This does not yet provide complete underground thirst navigation or lifetime ecological acceptance. Existing cave food, air, flood and roof hazards continue independently of whether the player sees them.

## Evidence

`tests/cave-drinking.mjs` uses actual normally progressed planetary groundwater, with explicitly staged actor position/thirst to isolate execution. It verifies exact water/hydration conversion, unchanged energy, read-only action/target queries, mouse/E option composition, no stale-target substitution, depletion refusal, shared wildlife consumption, immutable closed soil receipts and exact immediate/next-day save continuation. All 45 focused playable integration checks pass, including existing contextual action, Q/E priority, cave water, soil and spring contracts. Canonical source/export parity passes.

The exported Chromium `--cave-water --cave-drinking` trial advances a genuine planetary day and stages only the observation position in an actual wet cave. The native Drink button removes `0.0011995434761047363` groundwater for `11.995434761047363` hydration; after ordinary metabolic ticks, Shift+E removes another `0.000005364418029785156` for `0.05364418029785156` hydration. Both actual calls preserve energy. Native Save/Continue preserves every groundwater/oxygen cell, actor hydration/receipt, pending/cumulative output, geometry, RNG, survey memory and tick. The success frame was inspected and its feedback is readable. No water/body/reserve edits were used for this browser trial; the observer's location and pause state are explicit test controls.

Raw evidence is under `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366\cave-drinking-browser`, with sibling derived `cave-drinking-web` and focused gate log. This is automated native control/continuation evidence, not creator acceptance or naturally navigated lifetime gameplay.

Full cave ecology, thirst navigation to distant seeps, groundwater contamination/salinity, multi-level streams, underground swimming, comprehensive body-water conservation and late-session performance remain incomplete.
