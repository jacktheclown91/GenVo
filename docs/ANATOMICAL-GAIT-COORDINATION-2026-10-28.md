# Mounted-limb gait coordination

Walking now coordinates recovery phases from actual mounted limb positions. Bipeds alternate; four-limb bilateral bodies use diagonal support pairs. Larger bilateral banks carry a traveling recovery wave; axial/irregular bodies distribute recovery around their actual limbs. No missing counterpart is invented. The phase map is cached by the stable assembly array.

`src/render/gait-coordination.js` supplies only phase offsets to `genvo.js`. Existing anatomy-specific stride/lift, distance-driven gait, foot retraction, eight facings, knee articulation and movement authority remain intact. Static/action displays, swimming and legacy radial bodies retain exact frozen-reference poses. No biology, position, event, RNG or save state changes.

Focused checks pass for mixed limb styles and 1/2/4/5/6/8/16 geometry arrangements in all directions, with 66,360 exact planted-contact comparisons. Synthetic geometry coverage does not claim that every tested arrangement exists as a legal body. The native fixture separately validates actual legal 2/4/8/12-limb body plans.

[Native before/after sheet](gait-coordination-2026-10-28/native-gait-comparison.png) and [controlled receipt](gait-coordination-2026-10-28/controlled-receipt.json) preserve complete world-state parity. The prior phase formula is exercised through the diagnostic display-phase path and checked against an unchanged source fixture. A separate ordinary New World/AUTO recording observed 1,095 walking samples across 14 NPCs and 56 heading changes without browser errors; its [receipt](gait-coordination-2026-10-28/autonomous-receipt.json), [contact sheet](gait-coordination-2026-10-28/autonomous-contact-sheet.png) and trimmed native recording are retained here. The controlled animation and wildlife frames were visually inspected. This is evidence of the implementation, not creator acceptance or full locomotion completion.

The initial controlled capture removed live UI elements and caused a controller error; that failed local evidence remains in reports. The corrected observer overlays its canvas, preserving live DOM and passing with zero browser errors. It does not suppress application exceptions.

Passing related checks: motion bridge, anatomy locomotion, player presentation prediction, turn cadence, indexed rendering, catalog loading, architecture and canonical source audit. New presentation tests `art-resolution-study.mjs` and `gait-coordination.mjs` are ready for Claude's integration plan. No comprehensive ecology run or budget relaxation was performed.

Remaining C-package work includes persistent contact through starts/stops/reversals and turns, richer weight transfer and injury compensation, anatomy-specific swim/flight/climb/burrow expression, and broader native recordings across body sizes and actual specialized movement. The full A-I initiative remains active.
