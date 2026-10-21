# Groundwater exposed inside real cavities

New subsurfaces record `groundwater-exposed-cavities/1`. `src/world/cave-water.js` derives the liquid occupying a passage from its real floor/void, terrain height and the existing `World.soilWater.groundwater` inventory. This is a subset of that owned groundwater, never an additional water store. Existing soil storage, rainfall, runoff, spring, page and seam ledgers keep their original ownership boundaries.

## Physical and gameplay integration

The dimensionless constitutive model maps groundwater saturation to a local water table within a 0.12 normalized-height aquifer interval. Liquid exposure is bounded by actual groundwater stock and actual excavated volume. An empty aquifer exposes no water. Closed passages expose no occupiable pool; their underlying groundwater remains owned and conserved. Surface open-water boundaries retain their existing separate treatment.

When compatible adjacent passages expose liquid, the existing paired groundwater authority uses their actual free-water heads and bounded conduit transfer. It replaces that edge's ordinary matrix-flow calculation, rather than running a second transfer or creating a cave aquifer. Other edges and historical missing-policy worlds retain the existing calculation. Cave water therefore drains through connected geometry and the same finite aquifer, but this is not yet a separately resolved stream-channel/groundwater exchange model.

Exposed water reduces the physical gas capacity of the same passage. Displaced oxygen is exported proportionally with the displaced gas; receding water expands empty headspace that must ventilate again. Air synchronization occurs at actual committed soil, spring, runoff-sediment, topology and regional seam boundaries. A changed liquid/air interface publishes a subsurface revision so same-day perception and water artwork cannot retain stale geometry.

Shallow water slows charged underground movement. Deep water blocks the current dry-cave walking/entrance routes and connects to the existing finite-air hazard; flooded entrances explain their unavailability through the shared traversal authority. Air, daylight/hearing paths and rendering read the same physical exposure query. Native pixels depict real shallow wetness and deeper flooded floors; the local air cue identifies flooding. Underground swimming, dedicated cave-water drinking, dissolved oxygen and aquatic cave ecology are still unfinished.

## Compatibility and evidence

Ordinary historical restore preserves absence of the water policy and retains its recorded groundwater/traversal rules. New regions persist their own policy and exact groundwater/gas state. Migration validators now receive actual active/archived terrain, water mask and groundwater fields; they do not bypass the capacity checks. Existing atomic backup/failure rollback passes.

The new cavity-water contract checks single groundwater ownership, volume bounds, conservative edge transfers, gas displacement, flooded movement/art, two real planetary daily updates, exact complete save continuation, historical absence and unknown-policy rejection. All 44 focused playable integration checks pass. Existing groundwater seam, spring, page-transfer, topology, source-audit and public-export checks also pass.

A pre-existing spring-budget failure was measured at `0.022000014781951904` against an unchanged `0.022` cap. The donor's Float32 rounding is now corrected upward when necessary, so the actual paired debit/credit never exceeds the declared allowance. No budget or assertion was weakened. The original funded-spring test passes.

The exported Chromium `--cave-water` run advances one ordinary day, then stages only the observation position in an actual naturally shallow wet cave. No water, anatomy or terrain is edited for that frame. Native Save/Continue compares the complete groundwater array, every oxygen cell/ledger field, passages, actor, memory, RNG and tick. Evidence is under `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366\cave-groundwater-final-browser`, with the sibling final derived web export and gate log. The final run passes with no browser errors; the naturally wet cave frame was inspected. It shows groundwater-linked wet floor pixels while the body remains in breathable shallow water. Earlier diagnostic receipts remain preserved.

## Remaining work

This integrates exposed groundwater and conduit drainage within the current aquifer discretization. It does not yet resolve independent cave streams, surface spill outlets, waterfalls, saturated-rock porosity, salt exchange, cave-water freezing, multi-level flow, sediment transport within passages or full cave ecology. Air pressure/convection and underwater cave locomotion/senses also remain unfinished. Natural lifetime balance, sustained performance and creator visual acceptance are not established by these checks.
