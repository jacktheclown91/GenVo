# GenVo presentation integration candidate — October 30, 2026

## Status and provenance

**Integration candidate — not creator-accepted, runtime-certified, merged into main or publicly released.** This branch starts at Claude's main `e64d1ea8de35723f0df25af6a7e77b5d7e4fdf7b`, a hydrology/escape/demography stabilization checkpoint, and applies the changes from #43, #44, #45, #46, #47, #48, #49 and #50, plus the historical UX issue note in #42. Codex is inactive. Claude owns simulation/physics, save correctness, long-run ecology, performance, regression gates and release. ChatGPT owns UI/visual presentation.

### Included

| PR | Surface | Source integration |
| --- | --- | --- |
| #43 | Field Guide hierarchy and disclosure | `src/ui/field-guide.js`, specimen CSS and focused test |
| #44 | Journal family navigation | `src/ui/journal.js`, journal CSS and focused test |
| #45 | Population three-question overview | `src/ui/inspector.js`, `src/ui/population-overview.js` and test |
| #46 | Main menu visual hierarchy | menu CSS and acceptance record |
| #47 | Inherited adult size and gait | helper, test and merged renderer |
| #48 | Acceleration, braking, turn and load posture | helper, test and merged renderer |
| #49 | Current biological daytime lighting | helper, test and merged renderer |
| #50 | Heat-frill, wax and aestivation | body/part art, helpers, test and merged renderer |
| #42 | Readability audit | provenance documentation |

The overlapping `src/render/renderer.js` was **not** simply replaced with whichever branch was newest: #47 + #48 form the base, then #49 day/night draw order and #50 arid part/pose/cache-key logic were applied with unique-anchored checks. `genvo-draw.js` and `part-sprites.js` are taken from #50. No simulation or save-authority source files are modified. Main and all original individual draft PRs are left intact for review history.

## Acceptance required for main merge

1. Run each source-focused test from PRs #43–#50 (including `tests/inherited-scale-presentation.mjs`, `tests/physical-motion-expression.mjs`, `tests/diurnal-light-presentation.mjs`, `tests/arid-expression-presentation.mjs`) with Node 22 and 24.
2. Run full `node tools/check-playable.mjs`, `node tests/save-persistence.mjs`, `node tests/public-export.mjs`, canonical-source audit and public export parity. Record any previously known failures separately; don't remove gates to get green.
3. Real Chromium screenshots in a **fresh profile** and **existing saves**, across 1920×1080, 1366×768, 1024×768, 800×600 and 390×844. Inspect title, New World, gameplay, Field Guide, Journal, Population and Pause, including 200% zoom and narrow landscape.
4. Creature perceptual proof: 0.5×, 1×, 1.5×, 2×, 3× adults and juveniles at eight facings, 2×/3×/4× zoom, physically correct selection bounds, offscreen giant margins and regional fauna; compare the saved actual biological dimensions against drawn sizes.
5. Actual gameplay acceleration, braking, turns, dry/mud/water exceptions, strained body, heat frill and wax plates on real native art (and procedural fallback), drought vs cold torpor and day/night at 0/.25/.5/.75, with weather and biological sensory fog. Preserve the canonical motion, viability, heat and clock authorities and legacy save parity.
6. Test key/keyboard-only, mouse-first/contextual action, screenshot readout order, scroll/focus retention, long history and five-size HUD obstruction during active gameplay and notifications.
7. Native new and day-100 mature-regional browser frame-time p50/p95/p99, worst frame, sprite prep/compose and cache/atlas metrics. A single full-screen tint is low allocation but not free; per-actor structure/heat reads and more sprite-cache variants must not create a mature-world regression. Compare exact baselines.
8. Verify no ecology, RNG, genetics, pregnancy, age, resources, weather, persistence or save migration behavior changes from this presentation-only source. Claude must coordinate shared renderer changes before merge. User decides release after accepting screenshots and playthrough.

## Present evidence

- Dedicated source visual/biology tests previously passed in isolated connector-side V8 execution at draft PR heads (size: 53; physical: 19; lighting: 17; arid: 26) and scoped UI smoke probes (#43–#45). These are **not** a combined Chromium/playable-gate pass.
- Combined renderer unique-anchor merge and V8 parsing were verified at branch integration time; all four feature hooks are present.
- GitHub branch/PR diffs and GitHub Actions results should be checked at the exact integration SHA. An unrun workflow must not be represented as green.
- Full local source checkout is unavailable in this connected execution environment; GitHub Actions/Claude must carry native browser and frame-time certification.

## Release boundary

This branch is a **candidate only**. Don't merge it to `main` or upload it to itch without creator approval and Claude validation. Maintain the original PRs as evidence even after final integration review.
