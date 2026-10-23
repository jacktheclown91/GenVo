# Creature Lab presentation handoff

Codex presentation candidate. Canonical shared `index.html`, `styles.css` and `src/ui/creature-editor.js` remain unchanged by this work. The creator selected checked-in patches and handoffs for coordination.

## For Claude

- `assets/ui/natural-history-lab.css` gives the actual in-game editor a three-column workspace: categories/native isolated parts on the left, creature and interaction area in the center, biological consequences on the right. The central area is approximately 50–60% of desktop width. Phone layout scrolls vertically while keeping actions available.
- `git apply --check --unidiff-zero docs/art/lab-v1-handoff/index-integration.patch` checks the one-link activation patch. Use `git apply --unidiff-zero docs/art/lab-v1-handoff/index-integration.patch` for activation after the check. This flag is required because the narrow patch omits trailing context. Its single context line permits the menu stylesheet link to coexist. Both stylesheets are scoped to their respective UI roots and use the same palette/type conventions.
- `git apply --check docs/art/lab-v1-handoff/editor-label.patch` checks one selector correction. A founder session currently overwrites the first heading inside `.ed-stats`, which is now the capability list. The patch targets the direct comparison heading instead, preserving What this body can do. It changes no biology, measurement, editing rule, budget or event.
- Please integrate when shared-file ownership is clear, using normal commits. No force or automatic overwrite is part of this handoff.

## Preserved mechanics

Native 32px creature assembly, isolated native part thumbnails, intrinsic 560×460 editor canvas coordinates, inherited pigment/genes, sockets, symmetry, legal ancestry, shared costs, viability and founder/reproduction distinctions are retained. Styling preserves the canvas aspect ratio, so pointer projection remains aligned. Locked anatomy remains locked. Authored design steps are never described as naturally lived generations; inherited sessions still use the actual parent and pending litter.

## Verification tools

`node tools/review-natural-history-lab.cjs <new-evidence-folder>` opens the real guided-founder UI through New World. A common inspection-only reference to the native editor is used to read geometry and state; all changes come from public controls or actual pointer dragging. The candidate adds only CSS and the heading selector patch. It covers five viewport sizes, real drag/symmetry, exact undo/redo, native facings/walking, file export/import, locked ancestry and confirmation into a real authored-start world. No draft, organism or simulation fields are directly overwritten.

`node tools/review-inherited-lab.cjs <new-evidence-folder>` observes the genuine inherited editor. It starts a normal world, uses public AUTO/native speed controls, honors any native speed refusal, and waits for an actual pending litter. It never creates a pregnancy or editor opportunity. In that genuinely paused editor, before/after styling must preserve the complete canonical snapshot graph. It records real parent comparison. A bounded run without an opportunity is reported as unproven rather than manufactured.

Both tools test the committed official opt-in 30-second clock and fasting path when `--modern` is selected. Add `--profile` to the inherited tool for paired ABBA native walk-preview timing. No clock or metabolism mechanism is implemented by these presentation tools.

Original failed/exploratory probes remain in the raw original-repository archive. This candidate is not a claim of full Creature Lab completion, canonical activation, v1 release readiness or creator approval. The standalone asset Artwork Studio and broader action previews remain separate work.

## Selected proof and clean review build

See [the five-size, real inherited-session and exported-build evidence](../../art-refinement-lab-v1-2026-10-23/README.md).

`node tools/stage-lab-presentation.cjs <empty-directory-outside-source>` prepares an isolated public export with the two narrow candidate patches. `node tools/verify-lab-presentation.cjs <build-directory> <new-evidence-directory>` checks that exported app through public controls without inspection hooks. The final review build is `C:\Users\jackt\AppData\Local\Temp\genvo-lab-v1-web-20261023-final`.

After coordinated activation and review, consolidate superseded editor styling through the shared-file owner; the overlay is a review/integration seam, not an intended permanent second styling authority. Preserve unrelated styles and native mechanisms during that audit.
