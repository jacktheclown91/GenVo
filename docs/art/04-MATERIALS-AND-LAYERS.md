# 04 — Surface Materials, Pattern Masks & Render Layers
**Status:** LOCKED DESIGN for distinction; PROPOSED numeric/material details.

## Material is not automatically a part sprite
Armor textures, scales, fur, wet sheen, hard chitin, soft skin, scars and patterns must bind to the surface of an underlying body or appendage. Separate protruding armor plates, horns, large scales, shell rims, spines and articulated fins remain structural parts if they affect silhouette, reach, collisions or physical articulation.

### Decision test
- **Does it extend reach, change contact silhouette, add a joint or offer a targeting surface?** Prefer *attachment*.
- **Does it alter localized hardness, texture, coverage, friction, insulation or pigmentation?** Prefer *surface material/coverage mask*.
- **Both?** Keep a coverage mask for material and add a separately socketed geometric cap/plate/spine; ensure gameplay effects are not counted twice.

## Render pipeline (logical order)
1. Resolve authoritative body plan, pose, part transforms, skin geometry and depth for given facing.
2. Draw back-side appendages and their surfaces, applying occlusion/connectors.
3. Draw torso/head/root layers with patterned region masks and material stamps.
4. Draw near-side attachments, actual eyes/mouths and their material masks.
5. Apply inherited pigment ramps and pattern masks in *local part coordinates*, so scales/stripes follow a bending limb.
6. Add state/condition overlays—dust, mud, water, injury, scars, age, hunger stress, mating display—without rewriting the inherited palette.
7. Add bounded environmental lighting/shadow/highlight; UI selection glows separately (never part of the creature's genome).

Note: rendering can optimize/combine passes, but the logical semantics and depth ordering must remain stable. Segment-aware masks should remain connected through joints and turn with their parent surface.

## Material catalog contract (proposed)
| Surface | Primary look | Physical hooks to propose | Source of gameplay authority |
|---|---|---|---|
| Smooth hide | broad flat/shaded groups | low mass, baseline cover | anatomy + skin material |
| Thick hide | dense shaded rim, creases | puncture resistance, heat cost | coverage/durability resolver |
| Fine scales | small repeated directional plates | water retention, abrasion | cover density and physiology |
| Heavy scales | larger thick overlapping plates | local defense, flexibility cost | directional coverage solver |
| Chitin | crisp segmented tiles | hard armor, brittle impact response | coverage/defense resolver |
| Fur | clustered tuft edges + undercoat | insulation, wetness penalty | insulation/wetness physiology |
| Slime | soft continuous bands and sheen | drag/wetness/defensive secretion | gland and surface physiology |
| Membrane | translucent plane/soft folds | gliding/swim control only if supported | installed structural anatomy |
| Scars/mud | nonheritable marks | condition, visibility if modeled | injury/environment state |

No color or texture should confer a gameplay ability unless a particular inherited material/organ trait and relevant game authority explicitly support it.

## Surface regions and coverage
Every body/limb segment should have region maps: `dorsal`, `ventral`, `lateral-left`, `lateral-right`, `head`, `joint`, `tail`, `limb` as applicable. A trait references these regions and a numeric coverage amount. `body.armoredDorsal=0.75` does not automatically protect a completely exposed mouth or underside. Local attacks and penalties should consult **coverage**, not merely a global material name.

Pattern generators may use `scale`, `density`, `angle`, `seed`, and inherited colors. They must be stable to part deformation, rotation, scaling, zoom and facing. Reuse sprite mask coordinates when transforming each limb.

## Texture quality standards at 32px
- Pattern tiles must have a coherent spacing range. Avoid applying one-pixel scattered scales to every body, which reads as noise at gameplay zoom.
- Outlines and facial features take precedence over texture. Use density reduction near eyes, mouth, feet and socket seams.
- Prevent repeating texture visibly resetting at a knee; cross-joint continuity or believable scale breaks are required.
- Distinguish smooth thick hide from shell by silhouette/edge treatment and material shading, not by hue alone.
- Use an authored region/brush vocabulary over high-frequency pure procedural noise.

## Acceptance
1. A single body displays hide, scales, fur and chitin variants without sprite swaps or broken sockets.
2. Damage coverage acts on the correct surface regions, not on generic color tags.
3. Same inherited material mask animates coherently when a knee bends; no texture swimming/flickering.
4. Fur/scale overlays never erase eye pupils, jaw opening, silhouette or readability.
5. Visual effects from injuries/wetness can change without mutating the inherited genome.
