# Main-menu identity and first-start hierarchy — 2026-10-30

## Scope

Source parent: `bb05eda54d8de4a7ab0871518adcb1359bbcd331` on `main`.
Presentation owner: ChatGPT. Claude retains simulation, menu command correctness, saves, CI and release integration. Codex is inactive.

Change only `assets/ui/natural-history-menu.css`. Existing `src/ui/front-end.js` actions, `index.html` screen structure, existing real pixel starter portraits, canvas scene, option values, world saves, biological rules, art and audio remain untouched.

## Purpose

The title screen already provides an actual world backdrop and functioning native starter art. Its generic navigation icons, corner-arrow marks, emblem, star flourish and five equally prominent first-screen options make it resemble a template instead of an authored living-world game.

The first pass favors GenVo's own living backdrop and creature specimens rather than introducing unrelated illustrative icons, faux biology, a secondary game menu or another screen.

- Remove the old emblem, nav symbol masks, arrow marks and footer star in the menu; keep the named, discoverable actions.
- Give the title, native-world backdrop and text-only navigation a strong, quiet hierarchy.
- Keep **Continue** as the primary entry when a saved world is available.
- Hide the **disabled** Continue button on first launch and visually promote **New World**, without changing the availability or command decisions in `FrontEnd.refreshHome`.
- Preserve the actual saved-world metadata beneath the main choices.
- Increase starter portrait prominence and use text instead of a generic check glyph for chosen starter.
- Preserve existing Advanced options and keyboard focus outlines; ensure scrollable embedded and narrow menu states.

## Evidence

- Inspected exact `index.html`, `src/ui/front-end.js`, base `styles.css`, and menu CSS from parent HEAD.
- Verified the CSS braces and quoted tokens are balanced and all targeted IDs/actions are present in the actual HTML.
- Diff contains only the dedicated stylesheet. No simulation or command changes.
- **Not yet performed:** real game Chromium screenshot comparison, full-game Node gate, new-world flow, keyboard and controller assessment, visual or human playtest acceptance. Do not describe this as fully verified or merged.

## Required browser acceptance before merge

1. **Fresh profile with no saved worlds**: Continue absent from visible/keyboard navigation; New World is the clear first action; tab/Enter reaches it and opens creation. Browser status is truthful.
2. **Profile with a real saved world**: Continue is visible and prominent, operates on the actual saved slot; New World and Load remain accessible; saved-world metadata remains legible.
3. **New World**: real Walker / jumper / swimmer / burrower / flier portraits load from existing assets; card selection accurately updates the existing creature select, role and aria-checked state; Start choice selection also mirrors the real form.
4. **Advanced and edge cases**: import, fork and default planetary world fields remain functional and reachable when scrolled; no cut-off Begin World/Back controls.
5. **Viewport captures**: 1920×1080, 1366×768, 1024×768, 800×600 and 390×844. Also inspect 200% browser zoom and short-height/landscape; test at least no-save, saved, new-world and pause states.
6. **Interaction**: keyboard Tab, Shift+Tab, Enter, Space, Escape, disabled-state semantics, focus visibility, scroll reachability, pointer hit targets, reduced-motion preference; avoid covered gameplay creature when paused.
7. **Technical**: run the current full playable gate on Node 22 and 24, native Chromium with no missing CSS/art URLs and no page errors, independent web export, save/load and new-world smoke.
8. **Human visual**: creator confirms this is recognizably *GenVo* and no longer reads as generic symbols. Check actual visual distinction at ordinary game/itch scale, not only a static code review.

## Integration

- Review alongside the already-open independent Field Guide, Journal and Population drafts (#43–#45); these are separate surfaces.
- Confirm Claude has no uncommitted edit to `assets/ui/natural-history-menu.css` before integrating.
- Do not cherry-pick an outdated shared file; this PR has no shared-file edits.
- No direct `main` merge or itch publish without creator approval.

## Next presentation tasks (separate changes)

After this review: read-only size/growth drawing from `bodyDimensionsOf`, gait from `motionStateOf`, day-night lighting from `dayPhaseOf`, and structural/drought expression, all under the existing presentation contract. Preserve canonical authority, performance and visually correct selection bounds.
