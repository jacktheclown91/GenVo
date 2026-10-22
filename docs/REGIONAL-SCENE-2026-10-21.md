# Persistent regional scene handoff

This is a direct dependency of the creator's continuous-world requirement. It removes startup blanking during a regional ownership transfer; it does **not** establish complete seamless planetary gameplay.

## Runtime changes

`src/render/regional-scene.js` hands the existing main Renderer and canvas from one active canonical region to its cardinal neighbour. Finished native destination terrain caches are promoted from the already-prepared neighbour view. The region just left receives an independent presentation World restored from its actual newly archived snapshot, along with its finished native terrain. Existing nearby views keep their absolute region keys and are rebased into the new local coordinates. The active region is removed from the neighbour set, which remains bounded by the eight actual neighbours.

This neither creates a second biological Simulation nor draws imaginary neighbouring fauna. Canonical `planetary-travel.js` still owns validation, organisms, unique identities, family placement, biology catch-up, energy, stocks and publication. Actor interpolation, visible-actor lists, pointer hit boxes and sensing caches are cleared on handoff; the camera centres on the real arriving creature. New World and ordinary Continue retain their existing full startup path. `sceneReady()` still resolves only after the new owner has actually rendered its first frame, while the displayed scene stays visible throughout a regional handoff. Cold frontier paths stay visible through the normal progressive terrain renderer, with no claim that they already have detailed chunks prepared.

The initial browser trial found that same-world cave geometry revisions could clear every completed terrain chunk immediately before crossing. The failure was retained. Such edits now invalidate revision-aware signatures while retaining the last native chunk until the existing bounded refresh queue replaces it. Masks and tile caches still rebuild against current physical fields; unrelated worlds still drop every old terrain chunk. This is the same progressive drawing contract used for other terrain refreshes, not an alteration of physical geology or visibility.

Terrain-only neighbour Renderers now allocate 1x1 backing surfaces and register no global resize listener. Previously every neighbour allocated a full-viewport canvas and an uncancelled resize callback. Chunk and tile canvases retain their native dimensions; only the unused backing viewport is tiny.

## Verification

- `tests/regional-scene.mjs` exercises actual canonical crossings in all four cardinal directions; prepared chunk identity promotion; independent source buffers without writeback; correct offsets and exclusion of active-region duplicates; interaction invalidation; cold frontier and unrelated-load behavior; same-world revision invalidation; native chunk retention; no additional resize listeners; and unchanged complete saved state/RNG.
- Existing world-swap, border-terrain and performance-hotfix contracts pass. Source audit and public-export parity pass.
- The corrected exported Chromium trial captures the **first** crossing frame, instead of inferring continuity from a later settled screenshot. It records zero startup preparations, sceneShown true, scenePending false, 14,338 non-background pixels in the central sample, 42 promoted native destination chunks and 136 retained departing chunks in the final first-frame capture.
- Pixel/camera and real neighbouring terrain checks pass at 1366x768, 800x600, 1024x768 and 1920x1080; neighbour backing surfaces remain 1x1. Actual before/after gameplay frames were inspected.
- The [first-frame browser receipt](test-runs/regional-scene-first-frame-browser-2026-10-21.json), [native unload/Continue/return receipt](test-runs/regional-scene-ready-residency-browser-2026-10-21.json) and [export/source equality proof](test-runs/regional-scene-source-proof-2026-10-21.json) cover the final runtime. The exact first crossing canvas was saved and inspected, alongside the settled screenshots. The first failed browser artifact and superseded integration runs remain separate preserved diagnostics; only the [stable-source final gate](test-runs/regional-scene-certified-playable-2026-10-21.log), with all 77 checks passing, is applicable.

## Still unfinished

The active Simulation still changes at the ownership seam. The existing collision margin, validated arrival placement and fixed canonical transfer cost remain unchanged, so this is not yet continuous physical player motion across the exact geographic seam. Neighbouring wildlife rendering, interaction and movement into unvisited/unloaded owners remain incomplete. No visual interpolation is being used to conceal that physical gap.

Canonical destination construction, archival snapshots and biology catch-up remain atomic. The final first-frame capture trial measured a 217 ms gap in its crossing phase and a 1233 ms maximum during its resize phase; this is not responsive continental-scale acceptance. Ongoing mature ecological ticks can still take about a second. Saved policies, RNG, biological cadence and resource budgets were not changed.

Creator visual approval, natural long journeys, sustainable remote backlog and the remaining full-game phases stay open.

Physical-frontier follow-up: newly created solo planetary worlds now reach the actual regional line through paid movement and preserve exact planetary actor/camera positions during ownership transfer. The earlier margin-gap limit still applies to historical worlds and explicit family-group passage. See [current implementation, native trace and remaining work](REGIONAL-FRONTIER-2026-10-21.md).
