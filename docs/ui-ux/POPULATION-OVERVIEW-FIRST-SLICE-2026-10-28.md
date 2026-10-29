# Population window: three-question overview

**Date:** 2026-10-28 America/Chicago  
**Source base:** `main` `cfac14c06ee1da23b52a775684855ce1e0b3c53b`  
**Branch:** `ux/population-overview-20261028`  
**Tracking:** #41  
**Status:** isolated implementation candidate; do not merge or ship before review.

## Design decision and user impact

The existing Population (O) window displays five summary cards before four long scientific disclosure sections. That makes first-read orientation harder than necessary, even though all biological details should remain discoverable.

The new first view answers **three ordinary player questions**:

1. **Living animals:** How many creatures are currently alive? This is still the authoritative `sim.population()` sum across `SPECIES`.
2. **Your family:** How many currently active family members and dependents are recorded? These are unchanged `sim.family.relationshipSummary()` outputs.
3. **Habitat:** What does the existing sustainability snapshot say about the range, forage and competition? If forage is not measured, say **“Forage not measured”**, rather than silently presenting unknown as **0%**.

A new fold **Species census & lineage guidance** contains *all* species rows, the active taxon/lifestyle label and the original guidance/lineage reach counts. The existing four scientific folds — Evolution and lifestyles, Population centers and ecology, Evolutionary tree and leadership, and Births/dispersal/illness — remain below the census. No value or section is deleted.

## Implementation and file ownership

- `src/ui/population-overview.js` (new): pure, escaped, read-only HTML projection from supplied snapshots. It has no simulation imports and no state mutation.
- `src/ui/inspector.js`: one import and replacement of the five-card Population block with `populationOverviewHTML(...)`. Other HUD, mate, memory, territory, shelter and migration behavior untouched.
- `tests/population-overview-ui.mjs`: checks retained census data, three first-look questions, disclosure identity, unknown forage handling, escaping, and continued original ecology folds.
- This development note.

No changes to `src/main.js`, `index.html`, `styles.css`, `src/ui/knowledge-panel.js`, wildlife or simulation subsystems, render/audio, saves, or either concurrent development branch.

**Small ownership risk:** `src/ui/inspector.js` is a large presentation module and may be edited in parallel by Codex. The implementation is confined to the Population block; Codex must confirm no overlapping unpublished work before merge. Keep the draft pull request separate. Claude controls main integration.

## Evidence

The pure module was parsed and rendered in an isolated V8 context using retained example values: living population 27, family 4, 2 dependents, habitat 43% forage/8 competitors, taxa GenVo/Stalker 12/15, named active taxon, guidance, and reach. All nine checked output facts were preserved. The edited inspector class was syntax-parsed in V8; no build errors were found at the grammar level.

**Not claimed:** full project Node test execution, visual Chromium output, accessibility certification, effective screen-reader announcements, user comprehension, regression-free integration, or simulator performance impact.

## Integration/test gate

1. Run `node tests/population-overview-ui.mjs`, `node tests/knowledge.mjs` and applicable menu/panel tests in the complete checkout; record exact pass/fail.
2. Open ordinary worlds with existing family, no family, many species and no sustainability data; verify counts and missing-data wording against the canonical sim.
3. Capture Population open/collapsed/expanded and scroll-bottom at **1920×1080, 1366×768, 1024×768, 800×600 and 390×844**. Inspect player clearance. Pay particular attention to inherited global CSS that gives Population's first summary card full width.
4. Use pointer and keyboard to open and close the new census fold, keep it open while live totals change, use Close/Expand/Restore and O, and confirm no focus loss.
5. Codex verifies the information rhythm is consistent with Living Natural History styling; Claude validates integration. Do not alter main without their coordination.

## Important data boundary

`sim.population()` reports the existing aggregate. The UI does **not** know why a population rose or fell or infer the cause of speciation. Ecological explanations remain in the authoritative expanded records. No new species designation, player guidance, evolutionary dynamics or population triggers are introduced.
