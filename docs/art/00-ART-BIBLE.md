# 00 — Modular Creature Art Bible
**Status:** LOCKED DESIGN — proposed implementation contracts are elaborated in companion documents.

## Creative thesis
**An organism is an assembly, not a species sprite.** Every player creature, ordinary wildlife, rare creature and special encounter must be reconstructed from the **same** body/part/material/color system. What a creature *can* do derives from the physical anatomy and physiology it inherits; what it *chooses* to do derives from its ecology, drives and individual experience. Species/lineage labels are historical identity, not invisible stat classes.

## Non-negotiable art rules
**Creator addition, 2026-10-11:** Every authored part must support palette substitution without losing its original pixel shading, detail, or animation. [Detailed contract and evidence](09-PALETTE-PRESERVATION.md).
1. **No authoritative full-body species silhouette.** Fixed creature drawings may exist as archival references and marketing work, but never determine a live creature's anatomy or combat stats. Named special creatures are authored assemblies.
2. **Every visible anatomical feature has a source.** It is a rooted body, attachment, surface material, patterned region, or temporary condition mark. No anonymous hand-painted eyes on bodies that also accept eye parts.
3. **Part-first authoring.** Each independently recognizable feature is produced as a cataloged reusable asset with a documented pivot/anchor, render order, masks and animation vocabulary.
4. **Part-owned motion, coordinated action.** The **part definition** owns joint constraints and its compatible animation responses. The locomotion/action coordinator schedules requests and synchronizes them. World physics and authoritative movement/collision remain outside the renderer.
5. **Joint motion is physical and readable.** Hips, knees, jaws, stalk roots and tail joints use real pivots and allowed angles; no continuous whole-creature wavy deform as a substitute for joints. Secondary squash/sway is optional and subordinate.
6. **Scale is not identity.** A 32×32 authoring *canvas per part* does not mean a 32×32 total creature, 32-unit world tile, or native runtime attachment. Complex parts may use larger registered canvases after explicit review.
7. **Layered skin.** Fine scales, fur, chitin, armored hide and color patterns are surface masks/materials; projecting shells, plates, claws and spikes are geometry/attachments. Both can coexist.
8. **Color communicates, never hard-codes a role.** Inheritable pigment and pattern influence camouflage, signaling and recognition. Red alone cannot confer attack; green alone cannot confer defense.
9. **One creature grammar for all wildlife.** Player editor, offspring inheritance, wild recombination and special assemblies share the same validator/phenotype/render assembly.
10. **Guided evolution.** A child may express changed anatomy through heredity and an allowed mutation budget, subject to development and ancestry. Living adults do not instantly acquire a changed genetic body.
11. **Eight-way legibility.** Eight-direction movement persists; every art/motion system must resolve all eight facings and left-right occlusion, not only an attractive side portrait.
12. **Actual gameplay proof.** Judge art in the running build, at the actual game camera, during idle/movement/combat/water movement; not solely in a 32px preview or a static atlas.

## Art language and readability
- **Pixel clusters:** favor purposeful 2–4 pixel masses at native 32px; avoid random single-pixel noise, inconsistent anti-aliasing and stock-like procedural speckling. One-pixel glints are reserved for focal micro-details such as eye highlights.
- **Outlines:** use a consistent dark, hue-shifted outline family; generally one native pixel at part scale, with silhouettes continuous across adjoining pieces. Avoid doubling outlines at joints: overlapping connectors are visually hidden under the proximal component, gasket or tissue mask.
- **Lighting:** common overhead/front-biased shading model; one dominant highlight plane and one deep shadow family. Keep eye highlight directions consistent across bodies and facings.
- **Organic joints:** exposed hinges should have believable overlap, muscle/tendon forms, or skin-fold bridging instead of empty gaps. Large movement must not reveal the sprite sheet transparency between parts.
- **Species distinctiveness:** derive from actual torso geometry, part morphology, joint proportion, material, color distribution and behavior. Do not impose species-specific silhouette paint passes that contradict those parts.
- **Expression:** eyes, jaws, crests, posture, tail, body mass and timing carry emotion; avoid compulsory cartoony bouncing for every organism. Parts own expressive responses, while shared emotional/physical state coordinates them with actions and anatomical constraints. Different anatomies can express the same experience differently. See [10 — Shared state and expression](10-SHARED-STATE-AND-EXPRESSION.md).
- **Material identity:** wet slime has soft rim highlights and rounded shapes; hard chitin uses crisp planes; fur uses clustered edge tufts; scales use repeatable directional plates; don't blend these looks indiscriminately.
- **Readability:** anatomy silhouette and action tell must remain distinguishable against biome backgrounds; material textures should not hide the limbs/face.

## At-runtime priority order
1. gameplay authority (physics/collisions/damage/sensing) owns the result;
2. a creature action/request selects **what** is needed;
3. gait/action coordinator selects synchronization and ground/world targets;
4. each part solves **how its joints** achieve compatible targets within safe limits;
5. composition applies local masks, layered colors/materials and occlusion;
6. render output is always a faithful depiction of current authoritative state.

## Design boundaries
- No arbitrary category bonuses like `if species == stalker then red=attack`.
- No stat bonuses granted by choosing a paint swatch without a physical/sensory/social pathway.
- No separate animation implementation per named creature if an equivalent assembled part rig can handle it.
- No unreviewed migration that erases player body plans, ancestry, special creatures, or save compatibility.
- No escalating registration count as a substitute for finished part design and real animation.

## First proof target
A small round body, a four-leg runner build, and a stalk-eye variation must assemble using the same authored rules as a visually distinct wild creature. The eye tracks and blinks on its own; feet plant without slipping; the body can rotate through eight facings; surface materials recolor without destroying pixels. The three organisms must have capabilities derived from actual components, not preset names.
