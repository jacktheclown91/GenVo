# GenVo v1.73.0 — Detailed Limb Art (Development Checkpoint)

## Creator correction
The eight existing 32×32 limb candidates had too few painted pixels: each frame
held both upper and lower bones side-by-side in roughly 11-pixel-long source
regions. The creator explicitly requested substantially more *individual limb
art detail*, rather than only motion or attachment improvements.

## Current implementation

- The eight original limb **part IDs** remain unchanged: `walking-leg`,
  `spring-leg`, `grasper`, `runner-leg`, `sturdy-leg`, `webbed-leg`,
  `padded-leg`, `digging-forelimb`.
- Each limb's 32×32 editable source frame now places **two ~32×16 anatomical
  strips one above the other**, with rig endpoints spanning 23 native source
  pixels. Previously they spanned only ten. A 32×32 part still contains both
  segments; this is not 64×64 art or an artificial upscale.
- Opaque source-pixel coverage increased approximately 3.4×–4.1× on the eight
  revised candidate sheets. The renderer maps the new source endpoints onto
  the game's original hip/knee/foot positions, so the same live movement,
  genetics, attachments and physiological abilities remain authoritative.
- Art uses purposeful muscle planes, tendon contours, ridges, armor/plates,
  pads, claws, grips, or webbing as appropriate. Existing five-tone hereditary
  skin ramp is retained. Bone, keratin and webbing are protected accent colors.
- The native draw width was reduced from the legacy ratio because the new full
  16px-height strips made creatures visibly oversized in an initial real
  Chromium comparison. The art source keeps its complete native detail.
- The original human authored reference files are left intact. All 78 native
  parts remain canonical, with no additional species or biological part types.

## Source artwork density (opaque pixels, face 2/frame 0)

| Limb | Previous | Revised |
|---|---:|---:|
| walking-leg | 126 | 517 |
| spring-leg | 128 | 491 |
| grasper | 140 | 532 |
| runner-leg | 113 | 463 |
| sturdy-leg | 198 | 674 |
| webbed-leg | 153 | 542 |
| padded-leg | 177 | 608 |
| digging-forelimb | 189 | 644 |

These figures measure source pixels, **not pixels visible after a creature is
minified at normal world zoom**. Detail at distant game zoom remains constrained
by the rendered creature's size. Normal-scale and zoomed art need separate
creator evaluation. Creature silhouette/limb motion remains under development.

## Implementation and review

- `tools/upgrade-native-limb-detail-v173.py` regenerates these **specific AI-
  assisted development candidates**, not the original creator samples.
- `assets/art/parts/<limb>.json` / `.png` are editable 32×32 source; the
  existing indexed build generates `.indexed.json` from the source.
- `src/render/indexed-part-renderer.js` uses the unchanged two-bone authority
  to align newly larger source sections with live animation bones.
- `tests/native-limb-detail-v173.mjs` checks pixel coverage per section,
  anatomical length, full 128-frame RGBA identity, independent rig transforms.
- `references/generated-native-parts/detailed-limbs-comparison-v173.png`
  juxtaposes prior and revised actual pixel art.
- `docs/runtime-v173-limb-review.png` is a real Chromium assembled eight-part
  review, and `docs/runtime-v173-gameplay.png` is real Chromium gameplay.

## Approval and remaining work

**Not creator-approved artwork.** The source sheets are significantly denser,
but dense pixels alone do not establish expressive, attractive sprites. Do not
mark final based on source coverage or automated gameplay capture. Keep further
motion-specific frame development, gait timing, torso/leg coordination and
normal zoom readability on the open visual QA list. Save/reproduction baseline
issues have not been addressed in this art pass. Stable-release provenance
remains unchanged.
