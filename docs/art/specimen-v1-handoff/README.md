# Creature specimen presentation handoff

Creator-selected coordination: checked-in handoff and patches. Shared FieldGuide, main callbacks, index and styles remain unchanged by Codex. Presentation assets live in `assets/ui/`; their imports reuse existing canonical anatomy/rendering/reading modules, which the public exporter already includes. No additional biological authority or asset-loader mechanism is introduced.

## For Claude

1. Review/apply `field-guide-integration.patch` after `git apply --check`. It adds specimen selection, eight visual facings, a collapsible retained-body collection and the dedicated sheet renderer. Current and recorded entries get distinct presentation keys even when their physical body IDs match. The original body IDs and discovery records stay intact. Every original guide tab remains available.
2. Review/apply `main-observe-integration.patch` after `git apply --check`. It narrowly updates both existing Observe callbacks to select the retained body example, open the Creatures tab and fold the collection before showing the guide. The existing `noteCreatureAppearance` call remains exactly where the native action already records an observation.
3. Review/apply `index-integration.patch` using `git apply --check --unidiff-zero` and then `git apply --unidiff-zero`. The narrow link patch omits trailing context, requiring that flag; it can coexist with pending menu, Lab and journal stylesheet links.
4. Run the specimen-sheet, plate-protection-reading, knowledge, contextual-interactions, quick-access and public-export checks. After coordinated activation/review, consolidate superseded styling through the shared owner rather than retaining a permanent competing stylesheet layer.

## Biological and historical boundaries

Discovery currently keeps the first observed example of a body type. This sheet states that plainly. It does not pretend that a newly clicked individual is the first recorded individual, or that an old record knows present health, intent or location. Current anatomy and the retained example stay separate even if their plans match. The previous body-type deduplication would otherwise hide one of those views.

The large portrait uses the retained native phenotype and parts. Static image fitting measures that same native draw, with one reusable canvas and a bounded 32-entry extent cache. No per-frame image scan is added. Anatomy uses adult display scale, explicitly labeled. Mounted-part counts come directly from the actual plan. Current-creature action labels use the existing body-verbs/capability authority; observed records do not claim current action availability. Plate protection uses the existing shared protection reading, including honest older-record limitations. Unknown schema or missing genes yields unavailable anatomy rather than a founder fallback.

The new model test uses explicit automated fixtures to protect immutability, absence of invented live state, safe labels and live/retained key separation. Those fixtures are not natural gameplay evidence. Browser proof uses a real freshly generated PLANET-B0-A world with official `?day=30`, normal onboarding and actual sensory observations. Native public controls perform every selection, rotation, tab change and Observe action.

## Reproduce

`node tools/review-natural-history-specimen.cjs <new-output> --modern` reviews the original and candidate app through an inspection-server source overlay. It never writes shared source or simulation/discovery fields. Its exact-state probe refreshes only presentation cache/style and compares the complete canonical snapshot graph.

`node tools/stage-specimen-presentation.cjs <empty-directory-outside-source>` makes an isolated public export with the proposed patches. `node tools/review-natural-history-specimen.cjs <new-output> --candidate-only --modern --exported <build>` serves those build files without overlays or inspection hooks. The selected build is `C:\Users\jackt\AppData\Local\Temp\genvo-specimen-v1-web-20261023-reviewed`.

[Selected evidence and limits](../../art-refinement-specimen-v1-2026-10-23/README.md). Shared activation and creator acceptance remain pending. Dense 256-body collection performance, full individual live telemetry, the separate resource inspector and overall HUD/notification acceptance remain unfinished; this bounded pass does not establish full v1 completion.
