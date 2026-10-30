# Finite water-column presentation

Claude365b5f5e was merged normally before this package; new-game wild recognition remains Claude's unchanged authority. This presentation addresses water color that previously followed geometric distance from shore but did not distinguish an actually shallow liquid inventory from a full column.

`water-column-art.js` reads owned environment.volume through canonical liquidVolume/ice accessors. Shallow water gains a restrained earth-toned bed tint; a genuinely zero-liquid, nonfrozen inventory covers the blue base with a dry bed. Deeper columns remain unchanged. Refill immediately replaces/suppresses the bed tint. The existing exact shoreline mask owns every painted pixel; no topology, collision, resources, sediment movement, drinking source or biological state is created. Coherent ice is excluded; frozen stock is never called a dry bed. Legacy worlds without finite volume keep their original appearance.

The layer runs alongside live surface marks. One optional renderer argument excludes it from static ground-cache painting. The shared-file heads-up is in PRESENTATION-COORDINATION-2026-10-28.md. Partial-mask run geometry is retained for at most256 masks; full masks share one rectangle. No canvas, texture, audio or per-frame asset generation is added. Actual columns are reread live, independent of terrain-cache refresh.

## Checks and native evidence

Focused column, water-surface, wet-surface and underwater checks pass; canonical-source, architecture, syntax and configured whitespace pass. Tests cover shallow/deep/dry/refill, actual ice partition, no-volume legacy neutrality, exact mask coverage/cache reuse and bounded eviction, restored canvas state, static-pass exclusion, no depleted-water glints and full saved-state/RNG parity. The older glint-only check now explicitly disables column paint; its zero-glint requirement is unchanged and the independent column check verifies dry-bed paint.

water-columns-2026-10-29/new-final/ uses public New World AUDIO-RAIN-3 with actual finite water.682 cells qualify as shallow; an actual0.2 column produces tint alpha0.13333. Paused before/current gameplay changes5,616 environmental pixels with exact saved graph. The actual-world shore survey and scalar palette are retained. The palette is explicitly controlled artwork data, not a naturally observed pond or depletion/refill event. No naturally zero-inventory cell was found (dryCount0); natural dry-down history remains unproven.

mature-verified/ uses the actual recorded day101 valley. Its columns are deeper (example2.0), shallow/dry counts0. The terrain survey is pixel-identical before/current; complete saved graph remains exact.108 full-game raster pixels differ in independent live interface marks, not the column layer. Player anchor overlay is omitted equally in the paired environment captures; creatures remain drawn. Images inspected.

Earlier mature/ initially required a positive shallow witness that this dataset lacks. mature-neutral/ and mature-final/ then exposed an overly broad whole-frame equality assertion: player rings/interface marks changed while terrain did not. Their failure receipts and diagnostic pixel differences remain intact. The final harness checks exact terrain neutrality and reports interface differences separately, rather than changing product behavior or hiding artifacts.

## Cost and limits

New-world18-sample alternating warm renderer medians7.9/7.9ms before/current; noisy p95s91/84.1ms. Recorded-world medians29.4/33.1ms and p95s45.5/45.4ms. These short scene samples do not establish a performance improvement or mature-world acceptance; C8 performance remains open. No biological complexity or existing budget was reduced. Natural pool recession/refill, dry-channel history, broader habitats, giant layering, creator acceptance and full C1-C8 remain open. No release published.
