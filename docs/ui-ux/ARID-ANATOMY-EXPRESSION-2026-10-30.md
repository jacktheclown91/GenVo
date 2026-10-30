# Anatomical heat and drought expression — October 30, 2026

## Ownership, scope and baseline

Presentation owner: ChatGPT. Simulation, ecology, genetics, saved-world rules, performance gates and release integration: Claude. Codex is not active. This branch began from `e64d1ea8de35723f0df25af6a7e77b5d7e4fdf7b` (Claude's current demographic investigation on main). Draft PR is **independent** of #46–#49. It modifies the shared creature rendering path, so it needs Claude's code/benchmark review before integration. Do not merge or publish without the creator's acceptance.

Existing canonical source: `aridExpressionOf(sim,animal)` in `src/ecology/arid-physiology.js`, reporting `{policy,heat,frillFlushed,waxSealed,aestivating}` based on the **actual** air temperature, moisture, mounted part counts and existing torpor kind.

## Changes

- `src/render/arid-expression.js`: rule-gated read-only state adapter and a restrained tucked posture for **genuine, still** drought aestivation. Never changes animal intent, torpor, survival resources, action feasibility, RNG or time. Most wildlife is skipped before querying temperature because it lacks the two relevant parts or real aestivation.
- `src/render/arid-surface-art.js`: isolated 32px-aligned colored accents at the *actual native part mounts*, using only pixel-art utilities; no biology imported into low-level sprite artwork.
- `src/render/part-sprites.js`: warm coral frill tips for real frill flush; pale wax seams when the animal's own wax plates are sealed. Covers both procedural fallback and existing native authored dorsal/flank art without replacing their shapes, sockets, indexed art, articulation, paint or palette.
- `src/render/genvo-draw.js`: forwards the read-only receipt to the actual `drawPart` contexts.
- `src/render/renderer.js`: calls the adapter for visible animals, adds a small tucked resting pose only when `life.dormant` and `arid.aestivating` are simultaneously true, and distinguishes warm drought-dormancy marks from ordinary cool torpor marks. Appends all three expression flags to the finished sprite cache key so day/heat/moisture transitions cannot use stale art.
- `tests/arid-expression-presentation.mjs`: current-physiology transitions, old-save gating, no mutation, dormant posture, native accent drawing, and wiring assertions.

**Never fabricated:** heat, wax or aestivation state for a creature without the required body part/torpor state; no general red shader over the creature; no new arid physiology, animation authority, memory or legacy save changes.

## Evidence collected

- Inspected latest canonical arid physiology, part registry, body assembler, native/procedural paint and the current rendering/cache pipeline.
- Connector-side V8 source execution against the actual canonical `aridExpressionOf`, actual pixel helpers, the new readout/art modules, and the **actual `drawPart` native dorsal and flank pathways**, using controlled world and art-provider fixtures. 26 focused checks passed. All changed renderer/body/part and focused-test sources parsed.
- Historical worlds without `arid-physiology/1` return null before any art change. Ordinary wildlife without these parts avoids temperature lookup. Receipts are frozen; exact inputs were checked for mutation.

**Evidence limitations:** This is not execution of the checked-in `node tests/arid-expression-presentation.mjs` in a real checkout, not the Node 22/24 gate, not actual browser screenshots/video, not a performance benchmark, and not proof of exported-browser compatibility. Avoid reporting them as performed. Remote Git access for complete checkout is unavailable in the current execution environment.

## Must verify before merge

1. Run `node tests/arid-expression-presentation.mjs` and the current complete `node tools/check-playable.mjs` gate on Node 22 and Node 24.
2. In real Chromium gameplay, compare **the same** animal and viewing angle at cool/wet, hot/wet, cool/dry, hot/dry and aestivating. Use actual environmental and biological state, not made-up UI signals. Verify no false flush for the decorative `display-frill`, signal crest or generic armor.
3. Test authored `heat-frill` dorsal art and `wax-plates` flank art as well as procedural fallback. Inspect eight facings, 2×/3×/4× zoom, body-shape extremes, small juveniles, larger inherited adults, two dorsal slots, several flanks and dormant positions in cover.
4. Compare existing older world (no `arid-physiology/1`), cold torpor, ordinary rest and true aestivation (including buried/underwater cases) for exact presentation gating and unchanged saves.
5. Stress test a mature region containing many visible custom bodies with and without heat/wax parts. Measure game loop, creature prep/compose p50/p95/p99, ImageBitmap cache occupancy/evictions, Node heap and GPU upload stalls against current main. If scanning parts per visible animal each frame is expensive, cache the **authoritative receipt keyed by sim/tick/animal** rather than manufacturing biology or stripping the cue.
6. Merge/reconcile this shared renderer and `genvo-draw.js` with #47 (inherited size) and #48 (motion strain); reconcile the shared renderer lighting hook in #49. Maintain single authoritative pose and single sprite-cache key.
7. Inspect mobile/itch embedded window, reduced motion, frame clarity and accessibility of hunger/thirst alerts. No biological sensory/UI leaks.
8. Creator gameplay review and Claude regression/performance approval required. Keep as a draft until then.

## Following presentation work

Integrate the existing open UI drafts and these presentation branches in coordination with Claude. Avoid further independent shared renderer work until reviewed and reassembled into a measured release candidate.
