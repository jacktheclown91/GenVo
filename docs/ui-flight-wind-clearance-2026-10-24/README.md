# Flight wind cue clearance

Public guided Winged flier start, actual paid takeoff and native camera zoom revealed the old fixed body-clearance box underestimates the renderer envelope: label/body-envelope intersection was 0 at zoom2, 68px squared at zoom3 and 816px squared at zoom4 on both 1024x768 and 390x844. These are conservative body bounds, not a claim that every intersecting pixel was opaque creature art.

Wind placement now receives the existing renderer actor bounds and requested UI obstacles in logical canvas coordinates. The old conservative fallback remains for callers without a renderer. The same read-only constraints previously embedded in weather-readout are extracted to readout-layout.js and shared with wind, retaining the existing weather constraint calculation. Actual flightWindReading, direction, eligibility, anatomy, energy, wind physiology, RNG and saves remain unchanged. Ownership note: docs/art/flight-wind-clearance-v1-handoff/README.md.

Native public flight passed six cases at desktop/phone and zoom2/3/4 with zero label/body-envelope overlap; close-up desktop and phone captures inspected. This founder is explicitly guided/authored, not naturally evolved ancestry. Baseline and refined screenshots came from separate generated worlds and are not a frozen-state pixel pair. No all-anatomy, GPU/performance or creator acceptance is claimed.

The first desktop capture occurred before renderer sceneReady and showed no rendered world; it was rejected. A later capture waits for sceneReady plus a real projected player position. The early public Flight command was accepted during preparation; this remains a startup-visibility observation for the controller/performance owner, not a GPU diagnosis. No forced simulation or renderer-ready state was used.

Flight wind physiology/restore, wind-label fallback bounds, storm-readout, thermal-label, overlay-placement, canonical audit and exact public-export checks passed. This does not complete the remaining animation/audio integration or full v1 acceptance.

Reproduce: node tools/review-flight-wind-ui.cjs reports/ui-flight-wind-new.
