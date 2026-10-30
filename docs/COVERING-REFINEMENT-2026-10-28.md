# Refined modular coverings: fur, feathers and shell

Implemented six replacement optional artwork surfaces: fur-mantle, feather-mantle and shell-back at native64/native128. Fur now uses finer directional hair flow instead of broad leaf-like bundles; feather coverts have clearer quills, vanes and ordered overlap; the shell has more legible central/costal/marginal scutes and growth rings. The refined masters were inspected, compiled through the existing indexed-art codec, then inspected on actual assembled creatures. This is a production-batch refinement within C1, not acceptance of the full next-generation initiative.

Saved source masters, created with the built-in **image_gen** edit tool:

- [Fur](../assets/art/production-candidate-v1/source/refinement-v2/fur-mantle-master.png)
- [Feathers](../assets/art/production-candidate-v1/source/refinement-v2/feather-mantle-master.png)
- [Shell](../assets/art/production-candidate-v1/source/refinement-v2/shell-back-master.png)
- [Exact prompt set and tool provenance](../assets/art/production-candidate-v1/source/refinement-v2/prompts.json)

`tools/art-production/generate.mjs --refine-coverings` extends the existing compiler. It registers one explicit north-view tissue image once, preserves its aspect ratio, and produces all eight headings at the existing physical pivot. It changes only these six entries; the other 24 optional variants stay byte-for-byte referenced as before. The earlier masters remain intact, as do all native32 assets, original human artwork, indexed pigment regions, frame timing and world scale. Shell paint stays rigid; these images do not grant anatomy or flight. Frozen preceding variants support direct comparison without rewriting previous evidence.

## Native evidence

Public sandbox founder import created three explicitly authored organisms using the actual body-plan authority, followed by ordinary keyboard movement in a new planetary world. No living body, coordinates, food, weather or resource was injected. Their existing anatomy determines movement; no biological sizes were introduced.

| Organism | Actual anatomy | Ordinary travel | Evidence |
| --- | --- | --- | --- |
| Furred runner | Soft torso, runner legs, fur mantle, grazing mouth | 2.33 tiles | [Receipt](art-covering-refinement-2026-10-28/gameplay-fur/receipt.json) |
| Feathered forager | Soft torso, walking legs, feather mantle, beak | 2.15 tiles | [Receipt](art-covering-refinement-2026-10-28/gameplay-feathers/receipt.json) |
| Shelled walker | Dome torso, sturdy legs, shell, grazing mouth | 1.99 tiles | [Receipt](art-covering-refinement-2026-10-28/gameplay-shell/receipt.json) |

Each folder retains native32, preceding64, refined64 and128 captures at the identical paused world/camera/footprint, plus a live movement screenshot and recording. Complete save-graph snapshots remain exact during art loading/switching/rendering. Native64 gameplay images were inspected. [Public Lab checks](art-covering-refinement-2026-10-28/creature-lab/receipt.json) cover all three materials at 32/64/128, all eight facings, exact unchanged plans, responsive controls and artist-override priority. The three 128px assembled close-ups were inspected. The normal-zoom differences are subtler than in the Lab; creator artistic acceptance remains open.

Full-renderer median timings, preceding64 → refined64: fur 7.3 →7.6 ms; feathers 7.4 →7.7 ms; shell 8.3 →8.8 ms (10 samples after warmup per setting, same paused scene). These are small-scene CPU measurements, not a mature populated-world or giant-creature benchmark. [Integrity/memory receipt](art-covering-refinement-2026-10-28/integrity.json): optional catalog compressed bytes 392,596 →432,733; decoded RGBA remains 3.75 MiB at 64 and 15 MiB at 128. No per-frame source generation or new decoded surfaces were introduced.

Focused checks pass: `covering-refinement`, `part-art-variants`, `art-resolution-study`, `limb-paint-handedness`, architecture and canonical-source audit. The refinement check verifies changed native tissue, preserved palettes/pivots/scale/timing, dense dorsal coverage and eight-direction frames. Native observations have no browser errors. Comprehensive regression remains Claude's responsibility.

Still required: further proportion/head/eye/limb refinement and animation evaluation, inherited/juvenile body comparisons, creator review before any global resolution change, mature-world costs and the updated C2-C8 work. Authoritative continuous adult size, growth-scaled dimensions, contact footprint and structural clearance remain dependencies requested from Claude in the coordination note. Native32 remains the gameplay default and fallback.
