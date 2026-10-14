# Living rest and visible growth

This pass changes actual world creature animation, preserving all 79 native modular parts and the existing anatomy, locomotion, development and interaction controllers. No new biological rules or named creature templates were introduced.

## Source changes

- `src/render/life.js`: continuous individual breathing and timed blinking use the existing pause-aware presentation clock; occasional calm stance resettling is suppressed under strain. Life sampling reads injury/recovery state without initializing biological care records.
- `src/render/renderer.js`: actual movement drives walking presentation, idle whole-body bobbing is removed, and the existing clock pauses resting animation. NPC sprite keys include bounded breathing, stance and within-stage developmental growth. Existing cache limit remains 2,400 entries.
- `src/render/genvo.js`: resting legs stay planted; at most one leg resettles in multi-legged anatomy. Breathing does not alter the skeleton. Developmental growth scales previously adult-sized body minima.
- `src/render/genvo-draw.js`: the existing native torso surface expands softly without moving skeletal contacts.
- `src/render/head.js`: soft head motion follows the same breathing state while keeping existing mounts and native assets.

The player can watch a creature rest with planted feet and individual breathing, stop walking without a lingering walking pose, pause a stable scene, and see juveniles grow before their next life-stage transition. Existing movement costs, body mass, inherited traits and physiological growth remain authoritative.

## Verification

All 15 focused checks in `living-rest-tests.json` pass after the final changes: life presentation, articulated support, native anatomy/assets, player motion, Lab projection, lineage comparison, phenotype audio, conception and persistence. The life sampler preserves actor state and simulation RNG.

`living-rest-browser-proof.json` compares the exact prior delivered web build against current canonical source at native 800x600. Both use the same generated creature body and genes. Real keyboard movement/release and paused presentation were captured. Player placement on an existing central dry lane and fixed-pose NPC ages are controlled; terrain, food, reserves, anatomy and genes were not authored into the scenes.

Actual renderer buffers changed seven times during the old paused interval versus one stable image after the fix, with the presentation clock constant in both. A controlled actual NPC at 20% and 50% maturity remained juvenile in both samples: prior cached alpha area was 587/587 pixels; current rendered areas were 536/570. These diagnostics establish pause and growth behavior, not artistic approval. Native whole-world screenshots and paired runtime videos accompany the receipt. Small isolated body frames are diagnostic copies of the actual world-rendered buffer, not substitute component acceptance.

## Limits and next milestone

This pass does not repaint part assets or claim creator visual approval, unfamiliar-player comprehension, subjective audio quality, natural juvenile observation or large-ecosystem frame-time acceptance. The original native parts remain unchanged. Additional bounded NPC variants can affect cache churn; the existing cap remains, but large-world performance still needs measurement.

The approved aquatic-only adult-prey normalization correction remains integrated (Conception Gates review): real accessible finite aquatic biomass contributes using actual eligible anatomy, with no imaginary stock or species-name gate. Broader population-demand catalog gates remain unfinished.

Next substantive work: audit remaining population-demand biological gates, measure native large-world presentation cost, and improve natural encounter/vegetation readability. The full seven-priority development goal remains active; human ten-minute playtesting, adaptive outcomes and height/support design are still open.
