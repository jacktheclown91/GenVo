# World-time illumination — October 30, 2026

## Scope

Source baseline: `bb05eda54d8de4a7ab0871518adcb1359bbcd331` (`main`). This is an **independent draft**, not stacked on the inherited size or motion branches (#47 and #48). Changes remain presentation-only. Claude owns authoritative simulation/physics, save compatibility, full performance testing and release integration. ChatGPT owns this visual layer.

- **Add** `src/render/diurnal-light.js`.
- **Modify** `src/render/renderer.js` only to import and draw this layer, after weather and before biological sensory fog and remaining readable UI cues.
- **Add** `tests/diurnal-light-presentation.mjs`.
- Do not change `src/main.js`, `src/sim`, `src/ecology`, climate, genetics, sensing, animal behavior, art assets or save formats.

## Intent

Modern GenVo worlds have a real `diurnal-temperature/1` rule, with sunrise 0.25 of the day, noon 0.5 and sunset 0.75. The scene currently renders near-identically at all hours despite temperature and animal physiology changing. This layer makes that **existing** world state legible without producing new environmental facts.

- A neutral, unchanged scene at actual noon.
- A restrained cool-night tint rather than an unreadable black screen.
- Brief warm coloration at the authoritative sunrise/sunset.
- Existing world art, native 32px creatures, habitat, weather and contact mark layers are tinted together.
- Biological sensory fog and visible prompts are drawn afterwards. Light changes **no perception, visibility rights, foraging, movement, ecology, climate or saved state**.
- Exactly one full-canvas fill when tint is nonzero; no new per-tile redraw, texture allocation, gradient, animated particle field, shadow simulation or clock.
- Underground, submerged, missing-player and world-without-diurnal-rule conditions leave their previously established presentation unchanged.
- 30s days and historical 6s day clocks use `dayPhaseOf` via `dayTicksFor`, with no new timekeeping.

## Source-level evidence

Through the connected repository API we inspected current rendering, climate, world clock, visibility and weather authority; the current branch's actual `dayTicksFor`, `dayPhaseOf`, and `diurnalLightReading` sources were evaluated in V8. **17 focused checks passed**, including noon identity, midnight readability range, symmetric sunrise/sunset timing, legacy clock and legacy lighting gates, no draw when underwater/underground, single fill, render ordering and syntax of the renderer and new test. The focused test is also checked into the repository.

**Not verified in an actual game checkout:** the new Node test as an external command, full Node22/24 playable suite, Chromium canvas visual output, screenshot comparisons, mature-world GPU frame times, camera view mode interactions, browser itch export. These are required before merging. Do not report this PR as fully integrated.

## Browser and release acceptance

1. Verify no changed pixels in a historical save lacking `diurnal-temperature/1` and at canonical noon in a new world.
2. Capture the same actual camera view at night (0), pre-dawn, sunrise (.25), morning, noon (.5), sunset (.75) and evening. Confirm creatures and terrain remain distinguishable on 2×, 3× and 4× camera zoom.
3. At 30s day length verify the visual cycle follows the current tick clock without unrelated wall-clock drift, especially pause, resume, 2× speed, save/load, region travel and the title-world backdrop.
4. Confirm biological fog continues to restrict unknown/live entities; test Comfort, Biological and Sandbox View. Lighting cannot reveal anything the creature did not perceive.
5. Verify HUD, contextual action hints, weather and important threat attack cues stay visible, including muddy/snow/wetlands and storms.
6. Inspect phone portrait, 800×600 embedded, 1366×768 and 1920×1080 windows, low-detail mode and reduced-motion settings. No extra motion is introduced.
7. Measure actual current main vs this change at new and day-100 regions: render p50/p95/p99 and per-frame `fillRect` cost with default GPU renderer. The extra full-screen blend is bounded but **not yet benchmarked**.
8. Run `node tests/diurnal-light-presentation.mjs` and all current `tools/check-playable.mjs` checks on Node 22/24. Confirm no regression in old saved worlds or release export.
9. Review alongside #46/#47/#48, but do **not** merge shared renderer changes without Claude inspecting his active checkout. Human visual approval remains necessary before a stable release.

## Next presentation wave

Anatomy-specific heat frill flushing, wax plates and drought dormancy from `aridExpressionOf`, as a separate, measured read-only layer. Do not add new heat or survival mechanics.
