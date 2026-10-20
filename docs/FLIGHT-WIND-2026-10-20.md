# Shared atmospheric flight integration

New planetary worlds record `directional-flight-wind/1` in their existing saved environment. `src/lineage/flight-wind.js` observes the same deterministic absolute-coordinate wind and physical day already used by planetary plant dispersal. `src/lineage/lifestyle.js` applies heading-dependent ground speed and existing movement-energy costs to every airborne creature, including player, autonomous, family and restored organisms. Headwinds slow travel and increase energy per tile; tailwinds assist travel. Basal powered-flight costs, anatomical lift limits and takeoff/landing remain under the existing flight authority.

There is no new atmosphere inventory, RNG draw, hidden energy reserve, body mutation or population adjustment. Policy-free historical checkpoints keep exactly their prior aerial speed/cost rules. Unknown policies fail environment/save validation. The existing environment snapshot/region ownership carries the policy; no save-schema reset or automatic migration is used.

`src/render/flight-wind.js` draws a local wind arrow and direction beside the airborne controlled creature, including in low-detail mode. The takeoff/landing tooltip explains directional costs. Renderer and movement read the same atmosphere. This is powered-flight coupling; it does not claim gliding, lift turbulence, wind drift or a new flight-control anatomy catalog.

## Verification

- `tests/flight-wind.mjs`: actual controlled movement is slower against wind and charges more energy per tile; identical autonomous/control profiles, no RNG consumption, grounded invariance, exact midflight restore/continued input, historical opt-out and malformed-policy refusal PASS.
- Existing inherited wing/takeoff/collision/cost/emergency-descent check PASS (`e8-powered-flight`).
- Regional/world persistence, boundary water exchange, rainfall/runoff and handoff-copy checks PASS.
- All 15 focused playability checks, public-export parity and canonical audit PASS (286 reachable modules, 91 parts).
- Actual Chromium ordinary New World, takeoff button, keyboard movement, native rendered body, visible wind cue and IndexedDB midflight restoration PASS. Evidence: `test-runs/flight-wind-browser-2026-10-20/review.json` and `wind-aware-flight.png`; screenshot inspected.
- Browser anatomy was an explicitly controlled valid wing-body fixture with configured adult age/reserves. This proves renderer/control integration, not natural wing evolution or human playtesting. Existing ancestry/takeoff tests remain separate.

The unchanged fast integration gate completed in 243 seconds: **479 pass, four known failures, 11 additional failures, zero timeouts/stale entries, 12 deferred, 506 total**, with no input drift. Receipt: `test-runs/flight-wind-integration-2026-10-20.json`. A new player-presence source-order failure was corrected afterward by restoring immediate weather-to-player-anchor order; its unchanged test and the flight-wind test pass. The entire gate was not rerun after that one-line correction.

Nine other failures reproduce against unchanged `07ee3e4` runtime modules through an in-process loader without rewriting source: aquatic, inherited-embryo-climate, persistent-coat-moisture, planetary-boundary-exchange, planetary-groundwater-springs, planetary-terrain-sediment, planetary-water-seam-ownership, planetary-wind-pollination, and restore-deferred-flora. Exact outputs are retained in `test-runs/flight-wind-baseline-reproduction-2026-10-20.json`. Several are invalid older test setups; some expose actual biology/rounding problems, and require individual source-backed repair rather than blanket classification as harmless.

The observer timing check failed at 610 ms in the gate and 563 ms in a focused rerun against its unchanged 500 ms ceiling. Unchanged-main modules passed narrowly at 496 ms on the same host. That comparison is not sufficiently isolated to certify the cause or exclude a regression; performance acceptance remains open. No population parameters, assertions, timing budgets or known-failure entries were weakened. Do not call the full gate green.

The existing consolidation-demand comparison test rewrote its historical fixed-path JSON receipt. Its newly measured output was preserved as `test-runs/flight-wind-consolidation-demand-parity-2026-10-20.json`, then the historical receipt's exact committed bytes were restored. No historical evidence was replaced.

Remaining: independent starting-lineage/custom-founder modes, genuine glide/jump/diving/underground movement and wider anatomy/weather/gameplay completion remain tracked in the full matrix. This pass does not close full-game Gates B through E.
