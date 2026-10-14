# Near-vertical overhead correction — October 14, 2026

Creator direction: near-vertical overhead, with eight horizontal-world-plane facings under one camera. This checkpoint corrects presentation and four modular art packs. It does not adopt new physical coefficients, change swimming eligibility, or replace inherited organisms with complete creature templates.

## What changes in the game

Ordinary walking limbs and lateral organs sit underneath the dorsal torso. A limb raised by an actual strike can cross above it. Feeding reaches along the head's forward direction instead of falling toward the bottom of the screen. Dorsal sockets no longer project biological height into a screen-north offset. Left/right organs reflect around the body's current forward axis, so their handedness follows all eight facings. The contact shadow follows the actual body footprint and displayed heading; the player marker and drinking ripple occupy the world plane.

Walking-leg tissue now has fuller muscle, rounded toes, toe flex and an optional hip insertion sampled from its own native pixels. Hip/knee anchors, planted-foot positions, stride timing, mounted capabilities and physiology stay under the existing authorities. Other leg types retain their original artwork and rig.

Grazing-mouth art now shows dorsal grazing margins and blunt leading pads rather than a frontal opening. Sail-fin art shows a narrow overhead ridge rather than its standing triangular side. The existing creator-guided eye painting and blink are retained; their orientation now rotates in the world plane. All remain native 32×32 indexed modules with inherited pigmentation and existing animation/controllers.

## Source audit and unfinished art

| Source group | Current assessment and next work |
| --- | --- |
| Torso/head bases | Generally compatible with overhead assembly. Surface quality and head/torso transitions still need stronger authored painting; no complete-body replacement is justified. |
| Grazing mouth, simple eye, sail fin, walking leg | Revised in this pass, with preserved source masters and native preparation. Direction and joins are improved; this is not creator visual approval. |
| Tearing jaw, crushing jaw, gape mouth, tusk jaw | Frontal/profile openings remain visible in source artwork. Prioritize dorsal surfaces and anatomy-specific working margins using the same overhead convention. |
| Signal crest, display frill, spine ridge/cluster, thorn carapace, horn crest, sensory quills, echo crest | Several sources show upright side silhouettes. Review projected top surfaces and actual raised-action visibility individually. Do not flatten biological capability or delete inherited structures. |
| Gill slits and other flank organs | Body occlusion and handedness now follow overhead anatomy. Source paintings still warrant a dorsal/lateral transition review. |
| Stalk eyes | Tall silhouettes need a dedicated top-view interpretation without losing original identity. Ordinary round eyes can already be dorsal; their roundness alone is not a camera error. |
| Other limbs and tails | Jointed tissue and planar tails can remain. Review joins and silhouette per module rather than discarding the catalog. |
| Environment | Terrain and water already use a horizontal map. Sunmoss is a low overhead mat. Bramble/shrub canopies remain somewhat elevated; reed/pod stems especially need top-surface source art. No new camera is needed. |

The entire 79-part catalog was inspected as native east-facing source frames. These are priorities and identified ambiguities, not acceptance of all existing assets. At ordinary zoom creatures are still small and many surfaces remain stylized; this pass does not deliver the final organic art standard.

## Changed gameplay source

| Modules | Purpose |
| --- | --- |
| `src/render/socket-layout.js`, `head.js`, `part-sprites.js` | Planar socket/head placement and body-relative reflection |
| `src/render/anatomy-depth.js`, `genvo.js`, `genvo-draw.js` | Dorsal body occlusion and actual raised-strike ownership |
| `src/render/depth.js`, `renderer.js` | Body-oriented contact shadow, circular world-plane marker and water ripple |
| `src/render/indexed-part-art.js`, `indexed-part-renderer.js` | Validated optional hip surface using the same source canvas and exact rig anchors |
| `assets/art/parts/{walking-leg,grazing-mouth,simple-eye,sail-fin}.*`, `catalog.json` | Prepared native art and indexed/runtime catalog records |

`tools/prepare-walking-leg-production.py`, `prepare-overhead-art.py` and `install-art-production.mjs` retain reproducible integration. Generated originals, preparation details and prompts are under `assets/art/production-review/walking-leg-v2/` and `overhead-v1/`. Original human art is unchanged. Preparation uses crop, alpha threshold 128, nearest sampling, explicit palette mapping and planar rotations. These are mechanically prepared paintings, not eight independently hand-painted views. Sail-fin's shared idle image leaves funded articulation to the real encounter controller.

## Runtime evidence

The actual browser game was captured at 800×600, with the same natural-world checkpoint and before/after source routing. Two cases each show N, NE, E, SE, S, SW, W, NW: the natural player body and a controlled legal headed body with sail fin, paired gills and paddle tail. For each case, camera position, body, genes and simulation tick remain fixed. The renderer's actual heading is independently recorded and matched to the requested heading. Normal-size and enlarged full screenshots are retained; contact sheets are labeled crops from those real frames.

- [Before, headed body](overhead-before-headed-fin-eight-views.png)
- [After, headed body](overhead-after-headed-fin-eight-views.png)
- [After, natural body](overhead-after-natural-eight-views.png)
- [Full 800×600 gameplay](overhead-after-headed-fin-2-800.png)
- [Actual runtime recording](overhead-after-runtime.webm)
- [Before proof](overhead-before-proof.json), [after proof](overhead-after-proof.json)

The final walk uses actual keyboard movement and independently checks that the rendered simulation animal moved. Posing eight headings and assembling the second body are controlled presentation fixtures, not evidence of natural evolution or human usability.

Actual E-driven feeding was separately exercised with grazing-mouth, beak-mouth and kernel-beak bodies, plus canonical NPC feeding and filter-feeding hydration. Natural pod stocks are consumed through existing controllers; body, location and reserves are controlled fixtures. See [feeding receipts](overhead-feeding-browser-proof.json) and [recording](overhead-feeding-after-runtime.webm). No forced courtship success, conception or ecological stability is claimed.

Four alternating unrecorded initial-world runs provide separate unscripted renderer observations, about 32 visible creatures. Average renderer command time was 8.547 ms before and 8.565 ms after; the 0.018 ms difference is within run variation. This is not a speedup, GPU-latency measurement or large-world acceptance. See [profile](overhead-render-profile.json).

## Evidence correction

The first heading capture was rejected during visual inspection because its images did not actually turn. JSON transfer of a simulation snapshot duplicated a cached player reference: posing that detached object did not pose the rendered animal. The harness now rebuilds the derived player cache and asserts exact player/animal identity and actual rendered headings. Recent feeding presentation is cleared only in the controlled idle-heading fixture so genuine source attention cannot override the requested pose. Final captures replace the rejected attempts.

Normal structured-clone save/load retains shared references and passes save identity checks. This was a capture transport defect, not evidence that normal game saves lose player identity. Earlier JSON-transferred `art-production` natural-world movement receipts must not be used as proof of actual player motion; their state comparisons alone do not establish movement. Current captures supply that missing assertion. Earlier draft limb captures are archived under ignored `reports/limb-production-draft/`, outside the curated evidence and current source package.

## Verification and limits

All 27 focused checks in [the current test receipt](overhead-focused-tests.json) pass, covering planar projections, native art, 96 hip insertion cases, 384 joint cases, planted-foot continuity, head attention, anatomy-owned attacks, 24 controller-parity trials, saves, Lab assembly and all 79 parts / 1,264 native frames. Existing material/density constraints were retained.

`tests/creature-assembly.mjs` still fails its old fixed 48-pixel fallback bound at facing 6, frame 3 (`46,-4`). The same failure reproduces with the preserved pre-correction source through `tools/overhead-baseline-loader.mjs`. This unresolved baseline check was not weakened or counted as a pass. Native catalog, actual browser rendering and save checks are separate passing evidence.

The broad development goal remains active. No first-time human playtest, final visual approval, natural generational acceptance, full ecology verification, physical calibration or swimming migration is established here. Next substantial visual milestone: dorsal attack mouths and raised display structures, followed by consistent overhead vegetation, using small real-game checkpoints and the current shared anatomy/action authorities.
