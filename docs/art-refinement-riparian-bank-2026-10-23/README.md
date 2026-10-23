# Native bank sediment candidate - 22-23 October 2026

Shoreline depth bands now contain four native32 sediment cells rather than uniform fill colors. Implementation: c792887. The change is confined to bank color lookup and its retained painted source; original coverage, opacity, water contours, accents and draw order remain intact. No water, collision, plants, food or resources were added or altered. The shared renderer and simulation were not edited by this pass.

[Normal-scale before/after](normal-bank-comparisons.png) and accompanying whole 1000x750 screenshots show three unmodified generated bank sites at zoom 2. Lower/higher moisture labels are relative within this moist world; these do not establish a dry-biome or marine-coast pass. Only the actual founder's observation position is staged, with real terrain, bodies, climate and resources retained. The first palette was too subdued and was replaced by stronger tone separation inside the same exact mask and opacity. Its comparison, receipt and palette remain retained.

The 360 comparisons against the retained original painter preserve every draw position, dimension, alpha and existing accent, including four depth orientations, fallback sampling, all cardinal/no-edge combinations and moisture variations. New source hashes, four distinct native cells, palette bounds, context balance and immutable world fields pass. All 10 applicable environment checks pass: bank art, habitat contour/ground art, landform, depth, identity, terrain cohesion/motifs, existing native substrates and render caching. Repeating preparation reproduces the compiled asset and all four native PNGs exactly. [Master, exact prompt, original painter, initial palette and native crops](../../assets/art/production-review/riparian-bank-v1/) preserve provenance and editability.

Before/after browser stages use the original and new painters through HTTP-only inspection. The final runtime probe confirms native colors reach the live bank painter. Complete graph-encoded saved state matches across every swap, without field filtering; no page errors occurred. Normal screenshots were visually inspected. This remains restrained material detail, not a complete wetland environment or vegetation refinement.

Counterbalanced ABBA BAAB timing covers 30 warmup and 100 paused CPU draws per sample, plus four cold rebuilds per sample. Warm means remain effectively unchanged; median cold rebuilds add approximately 1-4 ms against a 105-114 ms baseline. Raw warm/cold samples and probe counts are adjacent. The cold probe gathers colors on the first draw; other cold draws and all warm samples disable collection. GPU completion and general hardware performance are outside this local measurement.

| Site | Warm mean ms, before / after | Cold median ms, before / after |
| --- | ---: | ---: |
| drier-bank | 9.255 / 9.384 | 113.65 / 114.75 |
| moister-bank | 9.031 / 9.004 | 107.55 / 110.95 |
| bank-turn | 8.756 / 8.556 | 105.20 / 109.30 |

Concurrent canonical renderer/view-mode work remains separate and preserved. These captures establish the committed candidate's bank presentation and stated invariants, not acceptance of that separate work. No long ecology trial was rerun. Creator acceptance and the comprehensive creature/environment/action/effect objective remain open.
