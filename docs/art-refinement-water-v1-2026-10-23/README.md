# World-space water surface refinement

The renderer previously stamped a short glint in nearly every simulation-water tile, plus rectangular dark pool marks. Native-32 stepped ripple crests now use jittered absolute-world anchors, cross tile/cache boundaries and shimmer on the existing simulation tick clock. No directional current, foam, rain impact or organism is invented. Redundant dark rectangles and the old per-tile reach mark function are removed. Existing reach/season tones, depth bands, bank contours, navigation, targets and physical water remain authoritative.

An owned painter caches immutable mask-clipped geometry, bounded at 1024 tiles per World in a WeakMap; it creates no per-frame texture canvases. Unreferenced World keys can be collected. The painter draws only existing wet mask pixels, preserves incoming canvas alpha/style, stays exactly still on a paused clock and suppresses liquid shimmer under canonical coherent surface ice. Broken ice uses the existing exposed-water rule. Existing ice, weather and sensory layers remain in their original order.

## Evidence and scope

Ten focused checks pass: water-surface-art, landform, uniform-mask parity, terrain continuity, native biome substrates, surface ice, surface-ice access, world-swap rendering, view modes and public export. The new check proves multiple cross-tile crests, absolute coordinate equivalence, nonrepeated placements, native mask clipping, immutable geometry reuse, pause stability, actual ice-rule reading, canvas restoration and complete saved-graph/RNG parity. Ice/broken-ice fixtures are explicitly unit evidence, not invented natural weather observations.

The ordinary public export contains 838 files / 413 module/dependency entries. Canonical source audit passes with 97 registered/native parts. Three ordinary New Worlds in one running application pass public Return/New World controls, native art/pigment and closed location details without overlays or organism edits. This checks native renderer/world replacement, not every possible environment.

Two genuine public generated sites (PLANET-B0-A pool and AUDIO-RAIN-3 river) are compared with the exact retained original renderer against current source. The review-only server adds an original-module endpoint; normal exported source requests are not rewritten. Application RAF and paint time are frozen for the pair. No camera/player position, climate, stocks, hydrology, anatomy or event values are staged. Both preparations and every alternating draw stage preserve the entire canonical saved-state graph exactly. Screenshots were inspected at native gameplay zoom 2. Independent native UI save notices may appear between full-page frames; those are not part of water paint comparison.

Eight alternating ABBA/BAAB stages per site use 20 warmup and 80 measured full-render CPU draws. The retained receipt includes both cold preparations and all stage distributions. Sample noise, JIT/cache warming and unrelated frame work prevent a speedup claim. These timings exclude GPU completion and do not establish mature-world or live frame-pacing acceptance. Ordinary public-world captures separately use the normal clock and no original/candidate route.

The old renderer is retained byte-for-byte at assets/art/production-review/water-continuity-v1/renderer.js.before (SHA-256 fea680bcf9f3123215c534e512a0ff80bbc7551397a9eeeb845943b92f3478ab); it is required by the review tool and excluded from the public game export. The checked-in handoff and applied patch live in ../art/water-continuity-v1-handoff/. Do not reapply the historical patch to integrated source. Raw evidence is preserved in the canonical development archive reports/art-session-20261023-water-v1-raw.

## Reproduce and limits

Run node tools/export-public.mjs <new-output>, then node tools/review-water-continuity.cjs <export> <new-report> from the source checkout. The normal review export is C:\Users\jackt\AppData\Local\Temp\genvo-water-v1-web-20261023-review. The review tool needs the retained original file; ordinary gameplay does not.

This removes another identified repetition source. It does not establish complete ocean/river art, all weather/ice/extremes, underwater/subterranean presentation, full performance, creator approval, migration/release or completed GenVo v1. Existing simulation and save authorities are unchanged. The full shared-renderer integration gate is pending; focused/browser evidence above is already established.
