# Family Journal presentation handoff

Creator-selected coordination: checked-in handoff and patch. Shared `src/ui/journal.js`, `index.html` and `styles.css` remain unchanged by Codex. The dedicated stylesheet and renderer-only candidate transform are ready for the shared UI owner to review.

## Integration for Claude

1. Check `git apply --check docs/art/journal-v1-handoff/journal-integration.patch`, then apply that patch in your integration commit. It adds retained immediate-family portraits and markup around the existing selected specimen. It preserves model construction, lineage registration, navigation, handoff eligibility, knowledge-window state and native comparison controls.
2. Check `git apply --check --unidiff-zero docs/art/journal-v1-handoff/index-integration.patch`, then apply with the same `--unidiff-zero` flag. The narrow stylesheet link has no trailing context, so that flag is required; it can coexist with the pending menu and Lab stylesheet links.
3. Run the journal, lineage-comparison, knowledge, quick-access and public-export checks, and review the real recorded-family frames. Consolidate superseded styling through the shared owner after integration; do not leave competing permanent style authorities.

The model remains authoritative. Parents and children are only records already returned by `buildJournalEntry`. No partner, birth, mutation, death or ancestry is fabricated. Parent miniatures are retained individual body records; the existing deeper comparison remains the authority for anatomy at conception. Missing/unknown body-plan schema or missing genes is shown as unavailable instead of using a founder fallback. All portraits use the native modular renderer. Selected and miniature anatomy is shown at adult scale, with the member's actual age stated separately.

At most twelve children are illustrated at once; an explicit count/continuation note appears for larger families. Existing Previous/Next browsing still reaches every retained family record. A single horizontally scrollable sibling row avoids implying that wrapped siblings are descendants of each other. This is a readable immediate-family plate with the existing ancestry path, not a completed interactive whole-population genealogy browser.

## Reproduce the review

`node tools/review-natural-history-journal.cjs <new-output> --fresh` starts a real PLANET-B0-A world, uses public AUTO/native speed controls and waits for a genuine birth. Any native inherited editor is exited with Keep old body. No organism, lineage, resources, pregnancy or clock field is set. A bounded wait without a birth fails the evidence requirement instead of manufacturing a family.

`node tools/stage-journal-presentation.cjs <empty-directory-outside-source>` exports the public app with these presentation changes in an isolated build. `node tools/review-natural-history-journal.cjs <new-output> --fresh --candidate-only --exported <build-directory>` then serves that build without source overlays or inspection hooks. Native exposed state is read to verify relationship IDs and exact snapshot parity; all gameplay and journal changes use public controls.

Selected evidence and limits: [review packet](../../art-refinement-journal-v1-2026-10-23/README.md). Canonical activation, creator acceptance, multi-generation interaction, full HUD visibility acceptance and full v1 completion remain unproven.

The final isolated review build is `C:\Users\jackt\AppData\Local\Temp\genvo-journal-v1-web-20261023-reviewed`. Its hashes are retained in the review packet. The exact-state probe refreshes only the journal presentation cache and stylesheet; it does not set biological fields.
