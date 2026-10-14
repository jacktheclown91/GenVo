# 01 — Biological Palette & Inherited Color Rules
**Status:** LOCKED DESIGN for meaning; numerical palettes and selection coefficients are PROPOSED defaults pending visual review and ecological tests.

## Purpose
Color should reveal clues about adaptation, ancestry, habitat, camouflage, warning and social signaling, but **not enforce predator/herbivore classes**. A red herbivore is valid; a green predator is valid; a poisonous organism may evolve conspicuous warning colors only if detection/avoidance and reproductive outcomes support it.

## Required creature color genome (proposed)
- `pigment`: continuous/heritable hue, saturation, lightness, contrast; avoid turning color into only one of seven immutable tags.
- `regionColors`: body-primary, body-secondary, underside, exposed-tissue, hard-material, eye-iris, display-accent. Regions choose compatible semantic ramp indices rather than unrelated RGB for every pixel.
- `pattern`: pattern type (`solid`, `mottle`, `stripe`, `spot`, `band`, `countershade`, `patch`, `gradient`) plus spacing, density, symmetry, orientation and scale.
- `signal`: optional warning/display region selection; does not by itself produce venom or intimidation.
- `sexAgeExpression`: age/season/breeding dependent *presentation* modifiers where biologically relevant.
- `environmentalCondition`: mud, wetness, fading, wounds, scars and stress as **nonheritable** overlays.

## Palette families (design vocabulary, not class locks)
| Family | Typical hues | What it may suggest | What it must NOT grant by itself |
|---|---|---|---|
| Threat / display | ember, rust, coral, crimson | conspicuous warning, rivalry, courtship | attack damage, mandatory carnivory |
| Forest / cover | moss, bark, fern, olive | low visual contrast in vegetation | armor, guaranteed herbivory |
| Open grassland | straw, golden-green, light olive | crypsis in yellow grass, fast-prey visibility | free speed |
| Desert / dust | sand, ochre, terracotta | concealment in arid ground | water stores or heat resistance |
| Freshwater / marsh | teal, cyan-muted, kelp | shoreline blending, aquatic display | swimming ability |
| Night / understory | charcoal, indigo, black-violet | low-light camouflage or high-contrast display | night vision |
| Alpine / tundra | chalk, ice-gray, slate | snow/rock concealment | insulation |

## Inheritance and selection
1. Pigment parameters are inherited and recombined from compatible parents using controlled variance (bounds and dominant/recessive handling are implementation decisions). New phenotype must stay within lineage mutation/compatibility budgets, **not repaint existing adults**.
2. Selection emerges through measurable context: prey/predator detection against biome contrast, mate preferences, warning signal reliability, temperature exposure (if modeled), and population survival. **Do not directly select red because attack is high**; predators with conspicuous coloration may succeed at display or warning but suffer stealth costs.
3. Color matching should evaluate *appearance under local lighting and background* rather than comparing just categorical biome strings.
4. If a warning color has no associated deterrent (poison, spines, retaliation) and predators learn the bluff, it can incur higher predation. Signal efficiency can be learned rather than universally hard-coded.
5. Any camouflage benefit applies to vision-capable observers at relevant range/contrast; it cannot hide from scent or echolocation unless other parts justify it.
6. Offspring retain a traceable lineage palette. Two related family branches can diverge slowly under distinct ecosystems; random spawning recolors that erase ancestry are disallowed.

## Rendering contract
- Mandatory creator addition: every authored part supports palette substitution while preserving original pixel shading, detail and animation. See [09 — preservation contract and acceptance](09-PALETTE-PRESERVATION.md). Semantic masks must retain every authored tone rather than quantizing detailed artwork into a smaller ramp.
- Normalize each authored source asset into semantic indexed masks: `line`, `shadow`, `base`, `light`, `accent`, optional `eye`, `hard`, `soft` and `emissive` (where appropriate). Actual pixel colors generated from an inherited palette at render time.
- Preserve contrast ordering: outline darkest, shade darker than base, highlight brighter than base; never allow a pale body's eye or jaw to disappear into its highlight.
- When converting a part, palette **regions** are separately maskable; avoid recoloring sclera/pupil, water glare or materials like bone as ordinary skin.
- Show palette variation in the editor, ancestry portraits, known-wildlife journal and in-game combat; UI contrast and threat recognition must not rely solely on hue (shape, motion, sounds, distinct markings).
- Tinting and surface pattern generation must be deterministic for the same genome, pose, world seed and render time. Visual noise is stable on a stationary creature, not regenerated per frame.

## Proposed editable ramps
See `design/art/biological-palettes.v1.json`. Each has `outline`, `shadow`, `base`, `light`, `accent`, `underside`, and `display`. These swatches are **new art direction values**, not colors extracted from the shipped game.

## Proof/acceptance
- Same genome under same conditions yields same phenotype colors; no flickering pixel noise while animating.
- Two related offspring show recognizable inheritance but reasonable variation.
- Five palette families on the *same assembled creature* preserve silhouette, eyes and joint readability at game zoom.
- Red grazing creature remains physically a grazer; green venom creature still uses venom.
- Camouflage changes only through actual sensory context. At least one test pits color against background and observer senses.
- Near grayscale / color-vision-difference simulation must preserve action/readability using non-color cues.
