# Underwater observer presentation — October 29

Submerged creatures previously stayed at 55% opacity and carried a surface ellipse even when the observer was submerged beside them. The renderer now paints same-depth submerged creatures at 96% of their preceding opacity, grading back to 55% with depth separation. Existing hidden/injury and other composition effects remain multiplicative. Surface observers retain the preceding 55% opacity and surface-location cue. Underwater observers do not receive a surface ellipse or floating depth number over each submerged creature.

`src/render/underwater-presentation.js` also applies two restrained depth-dependent color washes before the existing sensory fog and player/readout marks. Canonical `submerged`, `waterColumn`, diving policy and actual coherent ice gate the view. There is no new water transparency, turbidity, lighting, perception, actor eligibility, swimming, resource or save authority. No seabed, bubbles, sediment or plants are invented. Existing 32px pixel artwork is unchanged. The treatment draws two screen rectangles without per-frame canvases or gradients.

## Evidence

`tests/underwater-presentation.mjs` verifies depth/ice/legacy/zero-water exclusions, depth-separated opacity, unchanged surface cues, canvas restoration and complete simulation graph preservation. `tests/diving.mjs`, `tests/swimming-limbs.mjs`, `tests/swim-motion.mjs`, `tests/canonical-source.mjs` and `tools/architecture-check.mjs` passed. Changed syntax and whitespace checks passed.

`tools/review-underwater-presentation.mjs` imports a legal authored two-webbed-leg founder through public controls, selects the existing public Legacy local geography, and explicitly stages only its position in an actual generated 0.75-deep water column. Public Dive, Page Down and Page Up perform real submersion/deepening/ascent. Final before/current game-canvas captures at depth 0.525 preserve the complete paused simulation graph exactly; the browser reported no page errors. Screenshots were inspected. This is a controlled placement in real gameplay, not natural autonomous underwater behavior.

Evidence is in `underwater-presentation-2026-10-29/final/`. Local 16-frame CPU render observations measured median 4.8 ms before and 4.2 ms current; p95 42.6/39.9 ms. These short sequential samples do not establish a performance improvement or full C8 acceptance. The new layer is bounded to two screen fills and no retained scene allocations.

The initial `native/` review found no actual water column deeper than its 0.7 fixture requirement in the default planetary region. Its eligibility failure is retained; no water was deepened. The subsequent `local/` captures were obstructed by the DOM pause menu and are retained as such, not used for visual acceptance. `final/` captures the actual renderer canvas so the pause menu cannot obscure it. Both successful runs retained exact same-state comparison. Source before/current switches exist only in the review server, never in the game runtime.

## Remaining scope

Native submerged-neighbour/depth separation, coherent ice cover, and broad marine/coastal/wetland scenery still need coverage. Existing surface-water scenery remains visible; this pass is not a new seafloor renderer or complete underwater habitat. No new optical visibility claims are made. Natural wildlife observation, mature populated-world performance and creator acceptance remain open. Full C1–C8 remains active.
