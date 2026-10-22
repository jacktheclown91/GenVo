# Cross-region wildlife dispersal — October 21, 2026

New planetary worlds record `regional-dispersal/1`. Wildlife can now leave one region and continue life in the physically adjacent one, so successful lineages can spread across the explored planet through real movement. Historical worlds never open a border.

## When an animal leaves

The decision is the existing migration authority (`MigrationController.recommendWild`), not a new rule. A mature, healthy, independent animal whose breeding the shared carrying authority refuses, for crowding or food, searches its sensing radius for a reachable site where breeding would be allowed. Only when no such site exists inside its region, and its senses reach an **open** border, does it head for that border (migration purpose `emigration`) and cross on arrival.

- **Individually simulated regions:** the active region and canonical neighbours use the canonical decision and movement.
- **Population-model regions:** the same decision runs once per animal every 4 days, staggered by identity, sampling candidate sites every 4 cells instead of 2. Readiness is tested before the survey. The animal walks to its target, paying the canonical locomotion cost. Under this policy, population-model regions also migrate within the region.
- **Excluded:** player-lineage animals and dependents never emigrate.
- **No immediate return:** a disperser keeps moving away. The border back to the region it last came from stays closed to it for one season (8 days) after arrival. The first prototype bounced animals straight back and forth; this rule replaced that.

## Open borders and delivery (`src/world/planetary-dispersal.js`)

A direction is open only when all of these hold:

- the neighbouring region is the active region or a resident regional record;
- that neighbour is not parked;
- its clock is within one life stride of the source;
- a position this body can occupy exists on the far side of the seam (land, or water for water dwellers), within 8 cells along the seam.

Unvisited regions are never materialized by wildlife, and unloaded regions stay closed, so no animal waits in an unsimulated limbo and storage does not grow from wildlife exploration.

An emigrant is removed from its source at the end of that region's step and delivered in the same synchronous operation:

- **Destination:** into the live active simulation, or into the resident region's saved state (marked dirty; its ledger population and immigrant count are updated).
- **Order:** for a regional replay step, delivery happens **before** the source publishes, so a failed delivery throws with nothing changed.
- **What travels:** the animal keeps its identity, body, genome, ancestry and founding lineage. Transient intent and targets reset. It gains a bounded `dispersalHistory` entry, and the planet keeps a bounded `dispersalLog`.
- **Ownership:** global identity ownership is validated as before.

The dispersal context is transient and never saved.

## Verification

- **`tests/regional-dispersal.mjs`** (three-region world, 10 real days):
  - borders open only to the resident neighbour;
  - 6 natural crossings by 5 animals, every one between existing regions;
  - ownership valid each day, genomes and generations unchanged by travel, each animal carrying its recorded crossings;
  - no return within a season;
  - ledgers matching populations;
  - exact save, restore and identical continuation;
  - historical worlds without the policy.
- **`tools/verify-regional-dispersal-browser.mjs`** (Chromium): two held-key crossings, then unpaused real-time play. A natural wildlife crossing happened by day 2, with ownership valid at each check and persistence through Save and Continue.
- **Regressions:** demography, residency, warm cache, evolved library, E15–E18, founding, journal, records, persistence, projection, border and preparation tests pass.

## Cost

Population-model days, measured over 6 days in Node:

| Region | Before | After |
|---|---|---|
| founded region | 109–135 ms | 126–147 ms |
| crowded 195-animal valley | 130 ms | 270 ms |

The valley costs more because many of its ready breeders are refused and each reconsiders its options. The first, unstaggered version cost 1,093 ms there.

## Limits

- **Explored planet only:** wildlife spreads only across regions that already exist; open frontier land stays closed until the player's exploration materializes it.
- **Pressure-driven only:** dispersal requires refused breeding. There is no seasonal long-distance migration between regions, no juvenile natal dispersal without crowding, and no flight or ocean crossing beyond the ordinary body rules at the seam.
- **Scheduling-dependent:** which borders are open depends on clock alignment at that moment, so in the browser the exact crossings depend on scheduling.
- **Unmeasured:** long-run colonization patterns.
