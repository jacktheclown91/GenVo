# Mouse navigation between neighbouring regions

This connects the mouse-first navigation path to actual planetary transfer. The full continuous-world and full-game goals remain open.

## Player workflow

Select visible neighbouring ground in the contextual menu and choose **Move here**. The existing PointerApproach supplies ordinary control input to the existing paid player movement. It walks to a physically valid local frontier, requests the same canonical crossing used by keyboard/manual travel, then replans the final walk to the originally selected planetary coordinate. The same living creature and its lineage cross; no animal is duplicated or regenerated to satisfy the route.

`src/ui/regional-pointer-route.js` retains user intent as a seed-bound absolute point. It reads existing terrain views rather than creating new Worlds or biological simulations. The target must be visible through the same surface sight rule used by border terrain. Planning calls `canPlanPlanetaryPassage` in the canonical travel module, which reuses its actual physical border transect, and the shared anatomical occupancy authority. The live crossing still rechecks family, action state, available reserves, terrain, regional clocks and residency.

After a handoff, the pointer controller requires the actual active owner, matching creature ID, seed and canonical from/to receipt before resuming. Unrelated world loads, actor changes, manual movement, pause or an invalid route cancel the intent without executing an arrival action. Arrival remains subject to the existing local route tolerance, not an artificial teleport to the clicked coordinate.

Transient storage/catch-up refusals expose a structured retryable marker from the crossing authority. A route can wait for real work rather than bypassing it or timing out as a stuck walker at a closed frontier. Permanent refusals interrupt with the canonical explanation. This changes no replay amounts, ledgers, cost, saved movement rules or biological cadence.

Neighbour ground is a distinct navigation-only target. It provides **Move here**, not local resource/creature commands or inspection. It cannot fall through to a local edge cell's food, water, eggs or other resources. Ordinary local pointer routes retain their existing cancellation and action-readiness behavior. The chosen route is ephemeral: native Save/Continue retains the resulting world and organism state, not a persistent navigation itinerary.

## Evidence

- `tests/regional-pointer-route.mjs`: real canonical Worlds and paid playerControlStep routes in all four cardinal directions; read-only planning with whole-snapshot/RNG equality; final planetary position within ordinary tolerance; unchanged creature ID; no duplicate owned organisms; exactly-once arrival; cancellation/pause and invalid-goal guards; sensory and navigation-only target checks.
- `tests/pointer-route-availability.mjs`: existing local behavior, authoritative early readiness, no arrival on pause/manual cancellation or blocked routes. Both suites now belong to the playable gate.
- Existing contextual interaction and world-resource-selection contracts pass; source audit and public-export parity pass.
- The exported Chromium trial uses actual New World, right-click and **Move here** with no movement keys during the crossing. Its only controlled setup is initial placement on genuine traversable ground near the frontier; no anatomy, stocks or RNG are edited.
- The recorded target was Planet (131.5, 40.5). The same actor arrived at approximately (131.287, 40.5), within the normal 0.22-cell route threshold, with paid energy and valid unique IDs. Actual manual cancellation and native Save/Continue preserve the subsequently saved position, tick and RNG. Screenshots were inspected.

The [complete playable gate](test-runs/regional-pointer-playable-2026-10-21.log) passes all 79 checks. The [final native browser receipt](test-runs/regional-pointer-viewports-browser-2026-10-21.json) also checks menu bounds and zero player overlap at 800x600, 1024x768, 1366x768 and 1920x1080. The 800x600 menu, native arrival and restored gameplay frames were inspected. [Export/source equality](test-runs/regional-pointer-source-proof-2026-10-21.json) pins the trial to current runtime bytes. The real unloaded-region test additionally asserts that a required storage wait is retryable. Existing receipts are retained separately.

## Limits

This removes the need to manually switch to WASD or a separate Cross button during a selected neighbouring-ground walk. It does not remove the existing physical collision-margin/arrival gap or fixed canonical transfer cost. The active Simulation still changes under the already-integrated persistent scene handoff. Long-range map itineraries, unsupported/unknown terrain and broad diagonal journey coverage remain unproven.

Neighbouring wildlife rendering, cross-border contact/combat/resource execution, unloaded/unvisited colonization, true global wrapping/poles, sustainable remote backlog and atomic performance stalls remain unfinished. No natural continental journey, multi-generation acceptance, smooth-frame guarantee or creator approval is claimed.

Physical-frontier follow-up: newly created solo planetary worlds now reach the actual regional line through paid movement and preserve exact planetary actor/camera positions during ownership transfer. The earlier margin-gap limit still applies to historical worlds and explicit family-group passage. See [current implementation, native trace and remaining work](REGIONAL-FRONTIER-2026-10-21.md).
