# Grounded habitats and readable creatures — October 14, 2026

This integrated pass continues the approved near-vertical direction. It replaces the habitat scene and regional focal layers' upright plant silhouettes with native overhead substrate and separates terrain/vegetation composition. The complete development goal remains active.

## What changes in play

Watering margins show rooted damp ground, thickets leaf litter and exposed roots, fungal hollows decaying ground fibers, and worn areas packed earth. The scene and regional focal renderers no longer paint independent decorative berries, pods, mushroom caps, flowers or fake water. Actual edible plants remain in the canonical resource renderer, with the prior inherited coat, stock, season, seedling and reproductive states intact. Stones, ground roots, habitat interpretation, traffic/history and interaction systems are retained.

Soil and vegetation now occupy separate cached chunk textures. Habitat substrates render between them. A conservative live vegetation window excludes stale cached vegetation around the player and redraws from current canonical stock. This preserves immediate food depletion, current targeting and camera transitions. Actual organic remains render above vegetation; eggs, shelters and world trails remain in their existing object layers. Ground decoration and the existing reactive fringe now render before animals. Weather and interaction cues remain above them. Habitat substrates and regional floor details are clipped to actual land cells.

This changes composition, not sensing, pathing, ecology, resource units, inheritance, anatomy, mating, movement access or action execution. It adds no full-creature templates or biological outcomes.

## Gameplay source modules

| File | Reason |
| --- | --- |
| `src/render/habitat-ground.js` | One substrate selector/projector for existing habitat kinds; native palette/season cache, no GPU readback or food authority |
| `src/render/scene-detail.js` | Replace duplicate decorative living plants with one grounded scene substrate |
| `src/render/regional-focal.js` | Preserve real regional classification while replacing large upright/fabricated food and water paintings with broad floor structures |
| `src/render/landmarks.js` | Preserve interpretation and non-food stone/root anchors; retire the second plant/canopy painting layer |
| `src/render/renderer.js` | Separate chunk textures, live resource window, land clipping, carrion ordering and scenery-before-animal composition |
| `assets/art/environment/overhead-habitats.js` | Four native 32×32 substrate frames, prepared from a generated atlas |

`tests/flora-landmarks.mjs` now tests complete scene substrate drawing and explicitly rejects a second foreground food/canopy layer. It retains deterministic drawing and canonical biomass classification checks. The changed expectation follows the new presentation contract; no biological test was skipped or relaxed.

## Art provenance

The built-in imagegen tool produced `assets/art/production-review/overhead-habitats-v1/substrate-master.png`. Exact prompt and preparation receipt are alongside it. `tools/prepare-overhead-habitats.py` uses alpha threshold 128, four source-cell crops, nearest sampling to a 28×28 footprint inside each 32×32 frame and pigment reduction. It does not draw an illustration from primitives. Native previews and master remain in source; the master is excluded from the playable web export. Older source and artwork remain preserved in Git and `reports/overhead-habitats-before`.

## Runtime evidence

- `overhead-habitats-world-proof.json`: before/current Chromium rendering of the same natural saved world. The entire timestamp-normalized serialized simulation matches. Actual player identity is asserted. Real keyboard movement covers over 12 world tiles across several four-tile chunks. Screenshots show 800×600 normal/close/movement views and a 1280×720 viewport; curated recordings are retained. The larger viewport is not proof of the browser fullscreen toggle.
- Renderer tracing in that receipt confirms all traced habitat ground/fringe passes finish before the first animal draw. Ground and vegetation textures are distinct. The observed paused cache footprint is 5,636,096 bytes for both texture sets, excluding other renderer caches.
- `overhead-habitats-interaction-proof.json`: actual mouse selection, radial Inspect, inspector close and direct E feeding still pass for five plant resources under baseline/current renderers. Four stocks are naturally present; fungi use the explicitly controlled finite stock/substrate fixture documented by the harness. Legal body, adult reserves, placement and valid inherited coat/season fixtures are controlled. Body, stock and genotype save/load parity pass. A paused, restored-after-check depletion fixture verifies the nearby selected plant drops out of live visual targets even while the old chunk cache remains allocated.
- `overhead-habitats-focused-tests.json`: 23 passing suites include substrate structure/cache/readback, habitat/scene/regional/motif/depth interpretation, canonical flora, mouse/resource/water states, inherited tissues/coats, botanical genetics/reproduction/safety, saves and native catalog loading.
- `overhead-habitats-render-profile.json`: four alternating unrecorded initial-world runs average 9.426 ms before and 9.434 ms after for renderer CPU command timing. This is short-run parity evidence, not a measured optimization, GPU timing, long-run memory or large-world acceptance.

Complete runtime views were inspected. These checks prove neither natural adaptation nor first-time human comprehension. Controlled placement and finite food fixtures remain separate from the natural checkpoint and normal initial-world performance observations.

## Limits and next work

Separate chunk textures double the chunk texture allocation relative to the previous combined image. The observed capture uses about 5.375 MiB for these textures; travel across a large world and browser memory pressure still need dedicated testing. Existing small reactive fringe, terrain motifs, shelters and some floor accents remain procedural. Dense moss still repeats conspicuously; removing upright scene props alone does not complete environmental art or all 79 part improvements. No creator blanket approval or human playtest success is claimed.

The older fixed-bound fallback creature-assembly test remains a previously reproduced baseline limitation, not repaired or weakened here. Mass coefficients, physical consequences and swimming/save migration retain their separate creator-review requirements.

Next meaningful milestone: improve anatomy-specific injury, defense and retreat readability during actual encounters in these habitats, with contrasting legal inherited bodies at ordinary zoom and natural encounter observations separated from fixtures. The broader generational, biological, performance and first-ten-minute goals remain active.
