# Art refinement candidates - October 22, 2026

Implemented in a detached worktree from canonical `983a95a`. This is a partial implementation of the comprehensive art assignment. Creator acceptance is open; these candidates are not installed on main.

## Native aquatic surfaces

Four existing parts: gill-slits, silt-fin, filter-mouth and reed-sieve-mouth. Skin-only lamellar folds, fin rays and feeding-rim clusters preserve every original alpha pixel, protected material, pigment region, mount, rig, display scale, directional key and duration. Sixty-four frames compiled through the existing indexed codec. Visual changes are subtle at ordinary gameplay size; this is surface refinement, not completed aquatic anatomy or new action animation. Existing sail-fin imagegen art, whole-body sprites and creator originals were retained.

Actual 1000x750 gameplay, default zoom 2, controlled legal adult aquatic anatomy on unchanged generated terrain. Before and after share the same paused canonical simulation state (only save-envelope timestamps excluded). The fixture changes anatomy, age and observation position explicitly; no natural evolution or biological action claim. Both mouth variants were captured in eight directions. Local full captures remain in `reports/aquatic-surface-review/`.

| Part | Before | After |
|---|---|---|
| Filter mouth | [Gameplay](filter-mouth-before.png) | [Gameplay](filter-mouth-after.png) |
| Reed sieve | [Gameplay](reed-sieve-mouth-before.png) | [Gameplay](reed-sieve-mouth-after.png) |

## Native limestone surfaces

Preserved built-in imagegen master, four native32 indexed surface frames, reproducible crop/nearest/palette preparation. The existing cave renderer applies painted tonal planes only inside canonical natural rock and floor masks. Passage geometry, connected openings, excavated earth and physical water remain unchanged. No invented plants, resources, caves or lighting sources.

[Before gameplay](cave-before.png) / [After gameplay](cave-after.png). The player is explicitly relocated into a real generated natural passage for observation. This does not prove normal exploration or entry. At normal zoom the painted rock replaces the earlier high-frequency noise while preserving the visible opening. [Generated master and preparation provenance](../../assets/art/production-review/cave-surfaces-v1/provenance.txt).

## Evidence and limits

- Native catalog: 97 packs, 1552 exact source/compiled RGBA frames.
- Aquatic contract: unchanged silhouette, protected pixels and all assembly/animation metadata.
- Cave contract: preserved master checksum, native32 frames, exact geometry/water/dug-earth comparison, no world writes.
- Focused native, indexed renderer, source RGBA, articulation, animation catalog, cave geology, cave water and roof checks pass.
- Canonical source audit passes after regenerating its required ignored reference sheets.
- Presentation/release gate: one pass, four existing known failures, no new failures. This is not a green release gate.
- Browser: zero page errors; exact paired canonical-state equality for both groups. Render CPU samples exclude GPU completion: aquatic mean 17.0 -> 17.5 ms, p95 61.9 -> 61.9 ms; cave mean 9.7 -> 6.2 ms, p95 25.5 -> 18.7 ms. These small paused samples are not a broad performance guarantee.
- Full fast integration: 534 pass, 4 known failures, 18 other failures, 2 timeouts, 12 deferred; no input drift during the run. All 18 other failures also reproduce on untouched canonical `983a95a`; see [comparison](baseline-comparison.json) and [full receipt](fast-gate.json). The two timeouts remain undiagnosed. This gate is non-green. Long ecological observations were deferred. New authoring-tool line endings were normalized afterward; runtime behavior did not change.

Candidate commits: `b33a546` (aquatic surfaces), `d57ec4c` (native limestone). Neither is merged or pushed.

The remaining comprehensive work is open: a complete normal-play biome survey, other under-refined anatomy, action-state visual acceptance, environment effects and creator review. Existing native flora, torso/limb, jaw, eye, dorsal display and coat passes have prior provenance; their presence does not establish final artistic acceptance. No claim that every category has now been completed.
