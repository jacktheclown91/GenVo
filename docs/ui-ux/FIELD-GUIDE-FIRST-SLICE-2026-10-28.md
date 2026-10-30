# Field Guide readability and focus — first independent UX candidate

**Date:** 2026-10-28 (America/Chicago)  
**Branch:** `ux/field-guide-readability-20261028`  
**Starting baseline:** `main` `d66b768167c733f2e344a4f952631f7499ead2d4`  
**Tracking:** #41; independent UX coordination draft #42  
**Status:** Draft candidate for Codex visual review and Claude integration, **not merged or released**.

## User-facing changes

- **Observed creature first.** The creature tab now explicitly distinguishes your **current living anatomy** from a **retained past observation**. It does not confuse retained anatomy with a currently living animal's needs or whereabouts.
- **Fewer competing records.** The detailed protection comparison for *all* recorded bodies is now an optional disclosure instead of another always-visible wall below the selected specimen. The complete recorded text is still available, and an expanded comparison remains expanded on a subsequent live refresh.
- **Readable controls.** Increased size of Field Guide labels, body-part rows, biological descriptions, record notes, and button targets in the scoped specimen stylesheet. No global stylesheet, native creature art or gameplay HUD was changed.
- **Don't lose your place.** When real discoveries cause the Field Guide to rebuild every two seconds, maintain its scroll position and the focused active chapter, specimen rotation control, collection summary, or protection-comparison summary. Selecting a different specimen deliberately resets the prior record's scroll and places keyboard focus on the newly displayed specimen heading. Main Guide tabs now indicate the current page to accessibility tools.

## Authority and safety

Only these paths changed:
- `src/ui/field-guide.js` (read-only view/interaction preservation).
- `assets/ui/natural-history-specimen.css` (Field Guide-specific readable text and one disclosure).
- `tests/field-guide-ui-state.mjs` (focus/scroll behavior regression).

**No simulation, genetics, mating, event, persistence, command controller, rendering pipeline, audio, shared layout or index files have changed.** Existing selected-specimen drawing, record data, native art, map handlers, keyboard Y shortcut, and guide tab navigation remain intact. Other developers' branches are untouched.

## Evidence and limits

- GitHub compare of the isolated branch against the recorded base: **3 changed files**, no baseline deletions or branch-behind state at creation.
- JavaScript grammar checked for the updated `FieldGuide` class in an isolated V8 context: **pass**.
- Independently evaluated `captureView()/restoreView()` with representative focus, body scroll, catalogue position and details-open inputs: **pass**.
- A repository-local Node regression `node tests/field-guide-ui-state.mjs` has been committed, **but has not been executed in the full repository runtime here**.
- **Still required:** current-source Chromium captures and manual inspection at 1920×1080, 1366×768, 1024×768, 800×600, 390×844; inspect native art readiness, scroll, wrapping, keyboard focus, both selected bodies, expanded/collapsed comparisons and Guide Map unchanged.
- **Still required:** run the new focused test plus applicable existing Field Guide/knowledge/public-export tests on the integrated checkout. No current CI, creator visual acceptance or unfamiliar-player comprehension has been claimed.

### Manual review checklist

1. Start a real new world and open Field Guide (Y, and game UI entry).
2. At 800×600 and 390×844, verify creature canvas, part names and counts remain readable; rotating a specimen keeps focus on the arrow and the record in place.
3. Open the observed-body collection and select a different retained body; newly selected heading receives focus, old detail scroll is not inherited.
4. Open the optional plate comparison; wait for a real discovery-induced refresh (or record an explicit state fixture). Confirm its open state and reading position persist.
5. Navigate Creatures → Places → Map → Trials → Parts with keyboard and pointer. The selected chapter is announced; chapter changes begin at top, and Map continues to retain its own controls.
6. Open a long record; scroll to bottom, observe that the end of the record and Close can both be reached.
7. Confirm creature/player visibility and no horizontal clipping at the five creator viewports. Record before/after screenshots and any corrections; do not approve solely on passing DOM geometry.
8. Ask Codex to review typography and native visual consistency; ask Claude to gate integration when ready.

## Next isolated UX candidate

After this component is reviewed, consider Journal navigation/inheritance comparison **or** beginning-world comprehension. Do not change Codex's main menu or HUD simultaneously without explicit file-level coordination.
