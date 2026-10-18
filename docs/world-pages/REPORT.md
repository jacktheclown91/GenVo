# A: current-map pages verification

October 17, 2026. Implemented within the reviewed A boundary; map remains 128 x 128 with 64-tile page views.

WorldPages supplies strict global/local coordinates, shared field reads, visible windows and view eviction. World and Simulation remain the sole physical and biological authorities. Evicting a page view neither deletes organisms nor resets resources. Existing renderer terrain caches and artwork are retained. Saves record and validate layout; older saves reconstruct views without changing biology.

The established freshwater/1 map remains the default while coastal/1 stays explicitly selectable and persisted. The first fast run exposed 30 regressions from the unfinished coastal prototype becoming implicit default; its failed receipt is retained at ../test-runs/a0-a-fast-2026-10-17.json. No failed assertion was removed, weakened or given a larger budget. Prototype mechanism tests continue explicitly.

## Verification

Final fast gate: **389 pass, 5 known failures, 0 new failures, 0 timeout, 0 stale ledger, 12 deferred of 406**, 119 seconds. Code fingerprints match at start and end; inputDrift is false. Receipt: ../test-runs/a0-a-reviewed-fast-2026-10-17.json. Focused page tests cover negative-coordinate division, seam crossing, strict boundaries, live canonical fields, deterministic view eviction, unchanged organism identity/genome, save compatibility and exact resumed history. A0 topology, water/salt accounting and corruption rejection checks also pass.

Headed Chromium ran in an empty isolated context. A controlled fixture placed an existing founder at x62.5,y8.5, then ordinary keyboard movement crossed x64 to x67.3772797477581. Explicit save/reload/Continue retained player ID109 and position on page1,0. The simulation advanced and reported no browser errors. Walking and continued screenshots were inspected; no page seam was visible. Evidence: runtime/evidence.json and runtime/{new-world,walking,continued}.png. This controlled lane experiment is not an ordinary founding or ancestry playthrough.

## Scope and remaining gates

This is dense current-map biology with page views, not memory-discarding terrain streaming or continent-scale ecology. Mature-world performance and a planet-scale geography contract remain unproven; do not increase world size from this receipt. Silent maxAnimals birth clipping remains unresolved, and an authentic new inherited anatomical capability has not been demonstrated. The accessibility audit and autonomous/player-guided evaluation contract remain active requirements. No new major 100-day trial, commit, push or release was performed.
