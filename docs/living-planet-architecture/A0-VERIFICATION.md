# A0 implemented and focused verification

October 17, after explicit creator review/authorization. Existing World/Simulation and save schema remain authoritative; no world-size change.

`surface-topology.js` now owns deterministic generator selection, strict mask/history validation and accounted topology transitions. New snapshots name the generator and retain bounded topology receipts. Missing-mask migrations use the saved/inferred generator; truly old saves retain freshwater geometry. Supplied incompatible masks/depth/salt still reject rather than being silently repaired.

`World.setSurfaceWater` prevalidates edits and requires an explicit source/reason and water depth/salinity. Imports and exports record actual stored water depth and salt; closing water exports its dissolved salt. Existing direct mask-edit plus hydrology rebuild callers use a documented shallow-freshwater import (0.15 normalized depth, zero salt, source `legacy-mask-edit`) with a visible receipt. This compatibility default is not a biological inflow rule, creates no food/organisms, and is not calibrated meters. Legacy worlds without depth retain their historical fixed-water model.

The ledger accounts modeled surface-water/salt transfers; it does not claim that soil groundwater, living tissue and open surface water already form one complete planetary conservation model. Those remain the shared physical-state design work in later passes.

Verified without weakened assertions:

- Existing surface-water-persistence: PASS, including changed mask, exact 60-tick continuation and missing-mask fallback.
- New surface-topology: PASS; added/removed salt/water agree, food unchanged, rejected edits leave the whole snapshot unchanged, corrupt saved state rejects, truly old generator fallback retained.
- Regional-environment: PASS; connected water/sea, local climate, salt budget and whole-state resume.
- Save-persistence: PASS.
- Weather-soil-resume: PASS, uninterrupted versus save at day 6 of 14, exact full state and 14 daily water budgets.

No full planetary or 100-day trial was run. The previously retained failure remains in prototype history as the reason for this repair. Current-map world pages are the next authorized work.
