# GenVo biological development roadmap (recorded October 16, 2026)

This is the creator's direction, recorded for planning. Nothing here is implemented. Sequencing: finish the Phase 3L GPU rendering work first; inherited pigmentation is the next creature-art milestone after performance stabilizes.

Principle throughout: guarantee biological rules, not outcomes. No trait (a colour, a covering, a thermal strategy) receives a bonus for its label. Consequences come from the actual tissue, body and environment.

## Starting point (checked in the code)

- **Colour.**
  - `src/render/creature-palette.js` starts every creature at hue 145° (green and teal).
  - `phenotypeFor` (`src/organisms/species.js` lines 50–74) shifts hue by `(climate − 1) × 165 + (temperament − 1) × 36` and lightness by the metabolism and immunity genes, clamped to 0.35–0.65.
  - Chroma is fixed at 0.26.
  - Pattern bands and spots are read from the digestion and immunity genes.
  - So colour has no genes of its own, saturation never varies, and most creatures land in a narrow muted teal band.
- **Temperature.**
  - World cells carry a temperature (`Simulation.phaseSoil` relaxes it toward the climate).
  - `phaseMetabolism` charges extra energy in proportion to the gap between cell temperature and a comfort point of `0.55 × genes.climate`.
  - There is no heat balance, no body heat, no insulation and no behavioural thermoregulation.
- **Detection.** Concealment uses vegetation cover (`refuges.js`, `coverAt`) and predator stealth. Body colour plays no part.
- **Developmental symmetry** (just added; `docs/symmetry/REPORT.md`). Mirrored pairs develop together, with a rare heritable one-sided route. Pigment patterns and coverings should use the same mirrored developmental model.

## Stages

Creator's sequence (updated October 16, 2026): **now** Phase 3L GPU rendering, verified at real playable frame rates; **next** inherited pigmentation and recognizable visual variation; **then** investigate and correct the soil-water cycle before any thermal survival pressure; **later** heat balance, thermoregulation, insulating anatomy and temperature-driven selection.

| Stage | Work | Priority |
| --- | --- | --- |
| 1 | Independent inherited pigmentation and more diverse visible palettes | High, after Phase 3L |
| 2 | Colour and pattern inheritance through hybridization and mutation; pattern placement following developmental symmetry | High |
| 2b | Camouflage through actual visual contrast, as a separate change after the visual system is stable | Medium |
| W | Soil moisture and hydrology: investigate and correct the water budget | Critical to investigate, before stage 3 |
| 3 | Environmental temperature field and organism heat balance | Future foundation |
| 4 | Metabolic thermoregulation, basking, sheltering, torpor and hibernation, thermal stress | Future biology |
| 5 | Fur, feathers, scales and plates, exposed skin as modular coverings | After stage 3 |
| 6 | Natural selection on insulation, climate tolerance and coloration; separating selection from drift (`tools/selection-observation.mjs`) | Integrated validation |

**Design requirement for every stage.** Pigmentation, body coverings and thermal physiology must develop through the inherited developmental symmetry system (`docs/symmetry/REPORT.md`): mirrored regions share instructions, and naturally occurring, heritable asymmetry remains possible. New anatomy must look grown, not randomly attached.

### Stage 1–2: pigmentation

- **Genes.** Add dedicated pigment genes, separate from physiology genes:
  - primary hue, saturation and brightness;
  - secondary (marking) hue and contrast;
  - pattern geometry (bands, spots, saddle, countershading, stripes), with density and scale;
  - optionally, expression that depends on sex or maturity.

  Existing creatures keep their current look: their first pigment values are derived from today's formula, and new variation comes through inheritance and mutation. No saved creature is silently recoloured.
- **Inheritance.**
  - Children recombine their parents' pigment genes per trait, with mutation adding new hues and patterns.
  - Hybrids show recognizable mixtures of both parent lineages.
  - Pattern placement follows mirrored body regions, with the same rare one-sided route as anatomy.
- **Visual first, selection second.** Stage 1–2 changes only genetics and appearance. They change no detection, predation or mating outcome, so an artistic expansion is never combined with a predator-prey balance change. Camouflage (stage 2b) and colour-based mate choice come afterwards as separate, switchable changes, each measured on its own.
- **Selection only through real effects (stage 2b onwards):**
  - **Camouflage.** Detection compares the body's colour and pattern with the local ground and vegetation colour, combined with the existing cover and stealth terms. It helps only where it actually reduces visual contrast to the observer, and only against observers whose senses are visual.
  - **Mate choice.** Extend `src/reproduction/mate-preferences.js` with inherited colour preferences.
  - **Display.** Bright colours can raise courtship or warning value, and raise detectability equally.
- **Rendering constraint (performance).**
  - Use the existing indexed native-art pipeline: recolour through the skin-ramp/palette path with bounded caches.
  - Never generate per-creature canvases every frame.
  - Cache keys must account for the pigment values without making the sprite cache thrash: quantize to a bounded palette set if measurement shows a need.
  - Measure with `tools/gpu-render-benchmark.cjs` before and after.

### Stage 3–4: thermal physiology

- **Organism heat balance.** Body temperature changes with:
  - metabolic heat, scaling with mass and activity;
  - exchange with the surroundings through body surface area, insulation and wetness;
  - sunlight, wind and rain from the weather and the cell;
  - shelter and water.

  Replace the current comfort-gap energy charge with this model once it exists, comparing old and new behind a switch.
- **No fixed classes.**
  - Endothermy is the capacity to produce regulated heat, at a food cost.
  - Ectothermy is low heat production, with activity depending on body temperature.
  - Intermediate and flexible strategies (torpor, hibernation, seasonal metabolic shifts, limited heat production) are inherited capacities that evolve continuously.
- **Behaviour.** Basking, shelter seeking, huddling, and sluggishness when cold come from the animal's own body temperature through the decision system, with no scripted rescue.
- **Gradual evolution, no categories.** Organisms never switch between cold-blooded and warm-blooded by gaining one organ. Thermoregulation comes from interacting inherited traits: metabolic heat production, insulation, circulation, body size, heat tolerance and behavioural temperature management. A lineage can become steadily better at holding its body temperature without ever entering a predefined class.
- **Dependency.** Stage W must come first.
- **HUD: a thermal comfort indicator (creator decision, October 17, 2026).** Added only when body heat balance is simulated; until then no meter implies a system that doesn't exist.
  - It shows the organism's thermal condition (body temperature against its own comfort range), not the outside temperature. Outside temperature belongs to weather information and the inspector.
  - The comfort range is individual: it comes from that creature's physiology (heat production, insulation, size, tolerance), not its species label. Two creatures in identical weather can read differently.
  - It's a small fifth indicator in the existing compact vitals panel, keeping the two-row layout. The full cold–comfort–hot gradient, with the comfort band outlined and a marker for current body temperature, and an explanation of why (for example, insulation or recent basking), appears on hover or expansion. The creator's concept image is the reference.
  - It stays quiet when comfortable and becomes more noticeable under thermal stress (overheating, dangerous cooling).
  - Its consequences are the simulation's, not the meter's. For example, cold slows an uninsulated ectotherm, and heat raises water loss or prompts cooling behaviour, according to the creature's own abilities and metabolism.

### Stage 5: coverings

- **Coverings as inherited parts** on body regions, with developmental precursors like existing anatomy:
  - fur: insulation, density, shedding, waterproofing, colour;
  - feathers: insulation, display, protection, later flight with the right anatomy;
  - scales and plates: protection, water retention, thermal properties;
  - exposed skin: heat exchange, moisture dependence, sensory functions.
- They aren't mutually exclusive across regions: for example, a fibrous torso, a plated back and exposed sensory skin.
- Each has real growth and maintenance costs, paid through the existing funded-growth and energy rules.
- Seasonal coats, juvenile coverings and display structures come later.
- Rendering uses the same indexed-art and bounded-cache rule.

### Stage W: the soil-water cycle (critical; before stage 3)

The finding (`docs/GenVo-Phase3K-Report.md` §6):
- Each day, `Simulation.phaseSoil` changes moisture by `rain × 0.06 − (0.025 + 0.035 × temp)`. At this world's typical climate that is about −0.021 a day.
- Every land cell without seepage reaches the 0.05 floor within about a month (mean moisture 0.531 → 0.120 by day 60) and stays there.
- Wetland plants decline for two years even with no animals.

Investigate first whether this is an intended climatic consequence or a broken water budget, then correct it with real interacting processes:
- precipitation, evaporation that depends on available water, drainage, soil permeability;
- uptake by vegetation, groundwater and retention, and wicking from adjacent water.

No artificial rainfall to keep plants alive. Prolonged droughts must stay possible, but dryness has to come from those processes, not from a budget that only ever removes water. Validate with the no-animal plant probe (`tools/long-run-resources.mjs`, `NOANIMALS=1`) and multi-year ecology runs.

### Weather patterns (creator direction, October 17, 2026; with stage W)

Today `phaseClimate` redraws rain on every ecology step as a seasonal base times a random factor, with no persistence and no regional variation. There are no wet or dry spells, no droughts and no storm events (storm gameplay only reacts to rain thresholds).

Planned:
- **A seeded, persistent weather process:** multi-day wet and dry spells, with storms and droughts emerging as runs of it, not scripted events.
- **Optionally, a regional rain field** moving across the map.
- **Feeds the soil-water budget** (stage W) and, later, thermal physiology (stage 3: sun, wind, rain exposure).
- **Outputs stay `sim.climate.temp` and `sim.climate.rain`,** so existing storm, shelter and exposure code keeps working.
- **Behind its own switch**, separate from the soil-water switch.

The visual side (rain, clouds, fronts) follows after the Phase 3L renderer work. The soil-water session has this in scope, bounded by the October 30 feature freeze.

### One developmental body plan

Paired limbs, dorsal markings, feather or fur placement and insulating tissue should all grow from one inherited plan with shared regional instructions, so a hybrid looks like a recognizable combination of both lineages.
