# 02 — Part Assets, Sockets, Coordinates & Catalog Contract
**Status:** LOCKED DESIGN for authored modularity; schema v1 is PROPOSED and may be adapted to existing `PartRegistry` without replacing it.

## The 32px rule
- Default **per-part authoring canvas: 32 × 32 RGBA pixels**. Draw at native pixel grid with no blurry resampling. Larger authoring canvas allowed only when justified (e.g., multipart torso, compound jaw, huge tail) and declared in metadata.
- **A 32px part sheet is not a 32px creature and does not set game world tile size.** In-game placement uses part world-scale, anatomy socket, and camera zoom. A small game sprite may need simplified LOD or larger camera presentation to preserve details.
- Keep source artwork, semantic mask(s), pivot metadata, animations and thumbnail separate. Final runtime art never contains colored editor markers, checkered backgrounds or red attachment dots.
- Source sheets should be transparent at rest, no forced full-species body baked behind individual features.

## Coordinate convention
- Image origin `(0,0)` is top-left; `x` right, `y` down; origin coordinates denote **pixel centers** if integer. Store `rootAnchorPx: [x,y]` in authored native pixels, not normalized world tiles.
- A part's **root anchor** is the attachment point on the part (red marker in creator's stalk-eye reference). In the game, it is snapped to the **body-owned socket transform** (`position`, `facing`, `depth`, optional mirror), never drawn as red.
- Child anchors/joints are defined in part-local coordinates; animation transforms concatenate parent-to-child. Part-local sprite and mask transforms must match joint motion.
- The body's root geometry owns socket coordinates. Parts own their *local* anatomy, end effectors and motion; neither may duplicate the other's position authority.
- At minimum each runtime socket needs unique `id`, `type`, anchor transform, facing/normal, layer/depth preference and capacity. Current source uses logical `at:{f,s,u}` and may allow `max>1` on shared sockets: **each physical occupant must eventually have a distinct resolved position** to avoid overlay collisions.

## Existing compatibility bridge (CURRENT)
- Current `part-registry.js` defines `limb`, `mouth`, `eye`, `dorsal`, `flank`, `tail`, `spur`; body roots provide sockets. Current body plans are rooted acyclic graphs with node identity based on path.
- Current `ROUND_LAYOUT` uses normalized `f/s/u` socket coordinates. Keep this as an adapter while adding authored pixel anchors and world-space transforms.
- Not every current named part has art, a high-resolution image or a complete joint spec. **Do not equate catalog registration with asset completion.**
- `legacy` bodyplan adapter and current anatomy controller should be preserved until the phenotype authority migration is tested and approved.

## Proposed minimal metadata per part
- identity: `id`, `version`, `family`, `sourceArt`, `canvasPx`, `visibleBoundsPx`, `rootAnchorPx`;
- construction: `compatibleSocketTypes`, `rootOrientation`, `mirrorPolicy`, `sizeRange`, `coverageMask`, `childSockets`, `requiresAncestry`;
- appearance: `paletteMasks`, `materialMasks`, `occlusionGroup`, `layerPolicy`, `directionalOverrides`;
- motion: `rig`, `jointSpecs`, `motionProfiles`, `contactPoints`, `animationStateVariants`;
- simulation bindings: **references** to existing authoritative `capabilities`, `mutationCost`, `mass`, `upkeep`, and inherited expression; **not duplicate stats inside artwork**;
- state/version: authored status, canonical asset checksum in asset manifest, migration notes.

## Pivot, layers and contact invariants
1. All transforms resolve from the same root anchor per part; changing palette cannot move the pivot.
2. Mirroring swaps lateral semantics (left ↔ right) without accidentally reversing forward/backward knee direction. Some asymmetrical art needs authored facing variants rather than reflection.
3. Limb child `foot` and tail tip `endEffector` are explicit rig points; feeding parts specify bite/grasp target and mouth opening axis.
4. Back layers draw behind torso where appropriate; near limbs, eyes, jaw and frontal horns draw in front. Depth changes with facing and posture, not species name.
5. Joint overlap uses trim/underlap geometry or connection masks to avoid pixel holes, double outlines and disembodied eyes.
6. Attached parts may extend beyond 32×32 creature previews without clipping. Editor must fit preview bounds dynamically.
7. Any newly exposed anchoring topology must remain genetically compatible and validate in existing BodyPlan graph logic.
8. Runtime editing may preview arbitrary drafts, but committed offspring must pass mutation/ancestry and phenotype validation.

## Creator's stalk-eye example
Reference: `references/stalk-eye-user-design.png` (creator-supplied enlarged image, approximately 370×377). The red pixel at the stalk's far end denotes **where the part attaches to its parent**. The **provisional** 32×32 metadata example uses root `[29,28]`, chosen from the reference's relative position; final native-pixel anchor must be confirmed on the redrawn 32×32 art, not mechanically inferred. Stalk root bend and eyeball tracking use separate pivots and constraints. Blink, track and alert are per-part motions requested by organism state. See `examples/eye-stalk-round-a.part.json`.

## Definition of a finished asset
A registered part becomes **ART-READY** only if it has: recognizable authored pixel silhouette; transparent runtime sprites/masks; reviewed root/child anchors; validated eight-direction presentation; at least idle + its key gameplay animation response; clear material masks; no gaps when attached to at least three compatible bodies; scale/readability at actual game camera; documented provenance. An authored eye is not ART-READY merely because it exists as a thumbnail.
