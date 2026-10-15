# Native overhead displays and funded folding — October 14, 2026

The previous jaw milestone changed source, art and actual feeding behavior. This pass continues the approved overhead direction with two existing display organs: signal crest and display frill. It also repairs native folding and anatomical isolation. The full development goal remains active.

## What players now see

The crest's three upright tips become joined overhead lobes; the frill becomes a broad dorsal membrane. Both keep their original warm signal-color identity and native 32×32 format. They fold across the creature's lateral axis around fixed painted attachment tissue instead of enlarging the whole organ. The normal body pose still moves the mounted root; a display pulse does not scale that root or the organ's forward length.

The existing paid Flare signal drives opening. The existing encounter presentation clock eases opening and settling; pause holds it exactly. Back Off stops the real performance and the membrane settles toward rest without refunding effort or performing another display. Injury/fatigue expression now constrains the actual native frill, and the crest uses the same established physical-expression framework. Non-display dorsal anatomy such as sail fins, water humps and moss backs no longer enlarges during another organ's flare.

Native tissue follows the existing expressed body scale, including development. There is no new mass, growth, mate-choice, inheritance, physiology or cost model. No species labels grant display ability, and no predetermined whole creatures replace inherited body plans.

## Source modules

| Module | Change |
| --- | --- |
| `src/render/indexed-part-art.js` | Validate bounded native dorsal root/panel geometry and include it in the asset checksum |
| `src/render/indexed-part-renderer.js` | Prepare disjoint root/membrane paint from the selected frame's exact pixels; fold only across the anatomical lateral axis |
| `src/render/part-sprites.js` | Bind the actual dorsal socket, individual expression node and mounted flare capability; isolate non-display parts |
| `src/render/genvo-draw.js` | Pass the existing expressed/developmental body scale to native tissue |
| `src/render/encounter-expression.js` | Smooth visual opening/settling using the existing pause-aware clock; no hidden-preference reads or biological writes |
| `src/render/renderer.js` | Keep settling wildlife out of the idle sprite cache until the membrane reaches rest |
| `src/render/part-animation-catalog.js` | Register crest folding under the existing bounded fatigue/pain expression framework |
| `tools/creature-lab/app.js` | Show nonpainting root/panel guides rotated to the selected native facing, with concise advanced-art guidance |

The two source/compiled/preview packs and `assets/art/catalog.json` are updated. The rig initially sampled only east-facing paint; source review caught that this would ignore edits to other facings. Final preparation retains each selected facing and animation frame, with every visible source pixel belonging to exactly one root or panel. Folding uses affine transforms without destructive source rotation or render-loop readback. Extra panel canvases are prepared with frames/palettes and reused; this trades bounded texture storage for exact authorable paint and stable projection.

## Artwork provenance

The built-in imagegen tool produced one deployed-tissue master for each part. [Signal master](../assets/art/production-review/overhead-displays-v1/signal-crest-master.png), [frill master](../assets/art/production-review/overhead-displays-v1/display-frill-master.png), [exact prompts](../assets/art/production-review/overhead-displays-v1/generation-prompts.json), [preparation receipt](../assets/art/production-review/overhead-displays-v1/preparation-receipt.json).

`tools/prepare-overhead-displays.py` uses crop, alpha threshold 128, nearest sampling, explicit pigment mapping and world-plane rotations. Large generated masters are not themselves native-resolution artwork. Two initially identical idle cells leave folding to actual physical/display signals; editing either frame/facing remains supported. Exact prior artwork/source is preserved under `reports/overhead-displays-before/`; human originals are unchanged. Direction approval does not constitute approval of each new painting.

## Actual runtime verification

All controlled workflows use the real Chromium game at 800×600. Fixture anatomy, mature health/reserves, sex and nearby placement are explicit; existing compatibility, preferences, finite resources, funding and controllers remain in force. No mating acceptance or offspring was forced.

- Real mouse Flare → Play starts a paid performance on both complete legal bodies. Pause holds the display; real Back Off cancels it; the native membrane settles fully. Before/after energy charges match for each body. Read-only instrumentation records actual native root scale and unfolding. [Courtship receipt](overhead-displays-courtship-proof.json), [current frill recording](overhead-displays-after-display-frill-runtime.webm).
- Both bodies are captured in N, NE, E, SE, S, SW, W, NW with fixed camera, body, genes and tick. The harness checks actual rendered headings and real player identity, then ordinary keyboard movement. [Current heading proof](overhead-displays-views-after-proof.json), [before](overhead-displays-views-before-proof.json), [current frill directions](overhead-displays-views-after-display-frill-eight-views.png).
- In the real Lab, each organ's north-facing second frame was painted, compiled into a temporary preview, exported and mounted into the canonical assembly. The edited pixel changed; all other 15 frames stayed exact. Three rotated guides remain outside source pixels. [Lab receipt](overhead-displays-lab-proof.json), [assembled preview](overhead-displays-lab-display-frill-assembly-800.png). Canonical source was not replaced by these test drafts.
- All 26 focused checks in [the test receipt](overhead-displays-focused-tests.json) pass. Coverage includes 48 native facing/expression projections, root/hinge invariance, exact selected-frame pixel coverage, inherited/developmental scaling, actual paid flare smoothing, pause/cancellation, hidden-preference isolation, whole-save invariance, existing courtship, feeding, attacks, Lab and all 79 parts / 1,264 source frames.
- Separate alternating unrecorded initial-world runs measure renderer command time with about 32 visible creatures. [Profile](overhead-displays-render-profile.json). Observed run means were 10.475/9.111 ms before and 9.253/9.257 ms after. Variation is too large for a stable speedup claim. These are ordinary-world observations, not controlled all-creatures-flaring stress, GPU latency, large-world acceptance, or natural courtship success. An earlier profile overlapped capture work and was preserved outside curated evidence rather than used as the final comparison.

## Critical limits and next work

The overhead projection is more consistent than the previous upright crown/prongs. Fine membrane detail remains small at ordinary zoom, and the compact crest is less obvious than the broader frill. The close-up evidence and recordings must not substitute for ordinary-scale readability or creator approval. The active courtship dock still occupies substantial space at 800×600; this pass preserves its controls and does not claim that usability concern is solved.

Controlled paid displays do not establish spontaneous mate choice, natural reproductive success, ten-minute engagement or unfamiliar-player comprehension. Dense-world performance, natural generations, mass calibration, swimming migration and remaining frontal/vertical source art stay open. The previously documented fixed-bound fallback assembly failure is still unresolved and is not counted as a passing check.

Next substantive visual milestone: consistent overhead vegetation and environmental silhouettes, especially reeds/pods and shrub canopies, preserving finite resource/genotype/seasonal authority. Continue biological feedback and ordinary-scale encounter review alongside the larger active development goal.
