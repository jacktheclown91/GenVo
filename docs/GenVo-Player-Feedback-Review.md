# GenVo player-facing feedback refinement

This pass implements the five requested refinements without adding a permanent interface panel or a second command/biology system.

1. Courtship sequences are ordered icon chips, with the actual current beat highlighted and completed beats marked. A read-only observation view reports the partner facing the player, moving toward/away, returning an actual display, or the actual reciprocal outcome. It never reads preference scores, appeal, genotype or predicted acceptance. Movement is attributed only to the partner's own displacement. Outcomes remain visible as routine feedback after the encounter dock compacts.
2. Both radial and dock explanations use the same descriptor reason. Combat and reproductive validators now explain their existing restrictions individually: reach, feeding anatomy, adulthood, reproductive roles, close kin, cooldown, pregnancy, health and food. Existing thresholds and reciprocal choice are preserved, including fail-closed invalid numeric values. Resource approach availability uses the same route solver as navigation, with revalidation at execution. An unreachable route is Unavailable rather than Approachable.
3. Main HUD labels use the recognized taxon name when present, or a deterministic display alias generated through the existing anatomy-aware naming authority. The alias is not species recognition, grants no capability and changes no save/biology record. Life stage and a mounted anatomical trait accompany selected targets; numeric IDs remain in existing deeper inspectors. Player portrait caption uses the generated name.
4. Needs have larger icons, hover explanations and accessible focusable meters. Live HUD refresh retains focused needs; injury conditions continue through the existing condition display. Explanations state the immediate consequence and how to recover food, water and breath.
5. Critical warnings, objective/discovery progress and routine actions have independent deduplicated bounded queues. Routine interaction failure is an action message, not a critical warning. Notices avoid active radial controls, the objective, top utilities and dock. Placement checks are throttled rather than forcing geometry work every frame.

## Verification

`node tools/capture-unified-dock.cjs` passed the real 800x600 browser workflow, including graphical chosen sequence, a single current beat during actual performance, generated adult identity, matching disabled action reasons, water hover explanation, three simultaneous notification lanes without control overlap, ordinary resource use, brace, combat, courtship completion and dismissal. The latest receipt is `hierarchy-proof.json`.

Inspected native screenshots:

- `feedback-courtship-sequence-800.png`
- `feedback-courtship-performing-800.png`
- `feedback-action-reason-800.png`
- `feedback-needs-800.png`
- `feedback-notifications-800.png`

The three-channel notification screenshot uses explicitly labeled layout fixtures. Other interaction frames use natural resources and real actors positioned/readied for repeatability, preserving their anatomy and mating preferences. This is UI/controller evidence, not a human comprehension or retention study.

New targeted checks: `player-facing-feedback.mjs` (read-only identity, observable reactions, no hidden preference access, independent notification queues), `action-restriction-reasons.mjs` (specific reasons and invalid numeric safety), and `pointer-route-availability.mjs` (read-only availability, execution parity, arrival and manual cancellation). Existing mouse courtship, courtship performance, selected combat, held brace and resource parity checks also pass.

The exploration strip measures 65 px at 800x600 after enlarging need icons. The courtship dock remains 184.375 px in the native receipt. First-time comprehension still requires observing new players; the larger art and simulation roadmap remains unfinished.
