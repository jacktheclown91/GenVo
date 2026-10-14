# Creature Lab, whole-creature comparisons and expanded information windows

The immediate interface priority now has substantive source improvements rather than another HUD arrangement. Lab assemblies fit their measured native whole gait, retain visibility while using controls, and can be compared to a pinned anatomy reference at the same scale and facing. Expanded Lab preview keeps both specimens in one bounded stage while the separate tools pane scrolls. Fit/zoom, real socket placement, anatomy import/export, undo/redo and native artwork editing remain available.

Socket targets are compatible with the selected registered part, facing-correct, and resolved by nearest distance within 22 CSS pixels. Mouse click or keyboard activation mounts through the same canonical immutable attachPart command; named precise mounts remain available. The Lab is an anatomy/art sandbox, not permission to rewrite living game creatures or to bypass the reproductive editor gate.

Shared information windows now offer Expand/Restore, keeping one scrollable body between fixed identity/header and footer controls. Size, fold, scroll and keyboard focus survive live HTML refresh. Ordinary Saved and progress/action badges no longer obstruct an expanded reading window; warnings and save errors remain operational. This is an application layout expansion, not a requirement for browser fullscreen permission.

The journal's optional parent–offspring anatomy fold compares the actual descendant with stored parent bodies at conception, at a common adult display scale. New birth observations retain the parents' genes, adaptations and anatomy so a wild parent is represented accurately even without a lineage record. These are read-only birth-time observations, not a new inheritance or reproduction system. Parents, current offspring and RNG remain untouched during editing/visual comparison. Older records use available historical data and explicitly avoid inventing missing wild-parent biology. Juvenile size in the actual world remains unchanged.

## Source modules

- tools/creature-lab/assembly-ui.js, lab.css: native footprint fit, current/reference stage, compatible magnetic placement and preview expansion.
- src/render/creature-footprint.js (new): shared measurement of authored anatomy through the native renderer across all eight gait frames; supports current Lab artwork overrides.
- src/ui/workshop-preview.js: existing editor fit API reexports the shared renderer measurement.
- src/render/lineage-portrait.js: bounded footprint cache and fitted whole-creature portraits.
- src/ui/lineage-comparison.js (new), journal.js: optional actual conception/descendant model and matched-scale native rendering.
- src/lineage/lineage.js: read-only conception phenotype observations in the existing birth record, with no mating/compatibility changes.
- src/ui/knowledge-panel.js, styles.css: one owner for window expansion, fixed header/footer and preserved live scroll/focus.

Hashes: lab-windows-source-receipt.json.

## Runtime and test evidence

Real Chromium at 800x600 and 1440x900: magnetic east-facing spring-leg placement at 10 CSS pixels off the socket; unchanged pinned reference; canonical undo/redo; both complete native specimens visible during walking; no canvas-edge opaque pixels over eight facings and eight actual walking frames. Native artwork library still loads. Journal expansion measures 780x580 at 800x600, fixed header/footer, zero outer scroll and a scrollable body. Normal object-inspector Close/Expand fit; expanded live biological details retain chrome and scroll ownership. Memory expansion/restoration works. See lab-windows-proof.json, PNGs and lab-windows-runtime.webm.

Current workshop runtime: actual jaw drag, mount choices, draft projections, explicit review and confirmation, committed target save restoration, canonical funded birth and exact edited anatomy in the child. The journal compares both actual conception records with that descendant and all three canvases are populated. This uses the documented matched-parent pending-pregnancy/reserve fixture. It is not natural courtship or a naturally completed generation. See workshop-proof.json, workshop-parent-offspring-comparison-800.png and workshop-runtime.webm.

Native paint/undo preserves exact RGBA; artwork frame duplicate/delete, native assembly head mounting, authored playback and old information-panel workflows pass again (knowledge-panels-proof.json). Thirteen focused tests pass; tests/knowledge.mjs expects implicit drinking from an ambiguous old command and fails identically in the exact prior GenVo-seed-journeys source ZIP. No assertion was weakened. Exact previous-save restoration preserves plant/seed/coat/organic/genotype stocks and RNG. See lab-windows-tests.json and lab-windows-prior-save-receipt.json.

## Remaining scope

This advances priority 1; it does not prove human learnability, creator visual approval, every naturally evolved morphology, or natural generation transitions. The complete seven-part development goal remains active. Audio reaction refinement, pollen exchange/structures/self-compatibility/hybridization/selection, inappropriate founding-ID authority, vegetation/audio cohesion, longer unstaged ecosystems/saves, unfamiliar-player testing and terrain-height foundations still require work. The creator approved dedicated botanical recognition loci and separate inherited self-compatibility, with explicit staged pollen delivery/fertilization/viability/germination and no generic species-distance cutoff. Implementation follows this preserved checkpoint.

Next independent development pass: phenotype-driven reaction/audio authority and crowded early-survival readability, while preserving existing lineage metadata. Plant sexual reproduction follows the approved compatibility architecture rather than assuming resource labels define species.
