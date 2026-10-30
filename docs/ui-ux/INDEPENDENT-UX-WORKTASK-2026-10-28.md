# Independent UI usability review and staged redesign task

Date: 2026-10-28 (America/Chicago)  
Tracking: [UI/UX workstream #41](https://github.com/jacktheclown91/GenVo/issues/41)  
Starting source: `main` at `d66b768167c733f2e344a4f952631f7499ead2d4`  
Branch: `ux/independent-audit-20261028`  
Status: **Research and preparation only. No runtime/UI changes, tests or browser captures are claimed by this document.**  
Origin: creator-directed review of UI clutter, generic title motifs and unreadable panels, compared with actual repository code and current design/ownership contracts.

## Parallel-development contract

**Codex:** visual/identity/design art, current HUD/menu styling, animation/audio/environment. Do not touch Codex's active branch or replace native art.  
**Claude:** gameplay action and state authority, biology, persistence, performance and integrated regression. Do not add UI-owned biology, replicate an action controller, or rewrite simulation data.  
**Independent UX branch:** validate learnability and surface hierarchy; propose and implement separately scoped, screen-specific refinements after explicit filename handoff. Remain read-only until then.

Hard shared-file boundary: no uncoordinated modifications to `src/main.js`, `src/render/renderer.js`, `src/audio/audio.js`, `src/ui/front-end.js`, `src/ui/creature-editor.js`, `index.html`, `styles.css`, the currently active menu or HUD CSS, or simulation/persistence. Before any implementation branch, re-fetch current main and `docs/PRESENTATION-COORDINATION-2026-10-28.md`, compare branch diff, and check for active PRs. Use a dedicated draft PR and request ownership review. Do not merge, force-push, publish or cut releases.

## Evidence baseline: what already exists

Avoid reimplementing existing working controls:
- `src/ui/creature-context-tray.js`, `src/ui/interaction-dock.js`, `src/ui/context-radial.js` and `src/ui/gameplay-actions.js` already connect selection to canonical contextual commands.
- `src/ui/action-icons.js` and the existing indexed-native asset catalog paint anatomy-related controls. Icon fidelity/recognition and consistency still need subjective review.
- `docs/GenVo-Creature-Stage-HUD-Development.md` describes persistent Combat/Social modes, responsive compact vitals, task chip and embedded courtship corrections.
- `docs/GenVo-Interface-Hierarchy-Review.md` describes measured compact dock, context action ownership and real-browser verification at 800×600.
- `docs/GenVo-Window-Behavior-Review.md`, `docs/GenVo-Knowledge-Panels-Review.md` and `docs/COMPACT-PLAYER-CLEARANCE-2026-10-28.md` document fixed window scroll/focus and medium viewport improvements.
- `design/UI-READABILITY.md` is the authoritative visibility/placement requirement; historical proposal screenshots are not current acceptance evidence.

## Risk register and candidate ownership

| Level | Surface | Question to test before changing | Candidate source files | Integration boundary |
| --- | --- | --- | --- | --- |
| P0 | Main menu | Is starting/continuing instantly obvious without decoding generic motifs? | `assets/ui/natural-history-menu.css`, `assets/ui/natural-history/*` | **Codex reserved** for title art; independent UX offers measured critique only. |
| P0 | New World | Can a beginner begin without processing advanced generator/biology options? | `src/ui/front-end.js`, `assets/ui/natural-history-menu.css` | Shared Codex/Claude: proposal only until scheduled. |
| P0 | Survival HUD | Does player, danger and immediate food/water state dominate over calendar, tips, action inventory? | `src/ui/interaction-dock.js`, `assets/ui/natural-history-survival.css` | Codex active presentation; audit first. |
| P0 | Context and encounters | Can the player find a legitimate, labeled action in 1–2 clicks without losing the target or Flee/Brace? | `src/ui/creature-context-tray.js`, `src/ui/context-radial.js`, `src/ui/courtship-tray.js` | Share canonical action authority; modify only after handoff. |
| P1 | Field Guide | Can a new player identify the observed specimen, then reach real anatomy/ecology detail? | `src/ui/field-guide.js`, `assets/ui/natural-history-specimen.css` | **Proposed first isolated screen** after Codex file-ownership check. |
| P1 | Journal | Are parentage and inherited visible differences understood without reading a wall of data? | `src/ui/journal.js`, `assets/ui/natural-history-journal.css` | Follow Field Guide; birth data remains Claude-owned. |
| P1 | Population | Does the default display tell only defensible, observation-backed ecological trends? | `src/ui/knowledge-panel.js`, `styles.css` | Shared: require separate explicit coordination. |
| P1 | Creature Lab | Does creature preview visually dominate while real part requirements and editing tools remain clear? | `tools/creature-lab/*` | Reserve editor mechanics and shared UI with current owners. |
| P1 | Settings/Save | Are zoom/UI-scale, focus, safe slot actions and return paths discoverable? | `src/ui/front-end.js`, menu CSS | Shared: research/QA until scheduled. |

## Capture matrix and exact source harnesses

Existing scripts, not a proposed replacement infrastructure:
- `node tools/review-natural-history-menu.cjs` — real Chromium title and New World comparison in five viewports, including candidate-mode output (review docs for mode and route).
- `node tools/review-ui-clarity-current.cjs` — source gameplay utilities and labeled actions, movement smoke; checks **1920×1080, 1366×768, 1024×768, 800×600, 390×844**.
- `node tools/review-ui-panels-current.cjs` — help/population/territory/guide/journal/map at 1024×768 and 390×844; optionally `--notice-fixture` for temporary notice overflow (not naturally-occurring events).
- `node tools/capture-first-play.cjs`, `node tools/capture-unified-dock.cjs` — real target/vital/action controller flow; fixtures and limited observations are documented in existing reports.
- `node tools/playtest-ten-minutes.cjs 800x600 10 <output-directory> <seed>` — policy-driven ordinary play, **not a substitute for a human unfamiliar-player session**.

Some capture tools use a developer-specific Playwright installation path in `USERPROFILE`. Establish a usable test runtime before executing; don't claim portability or passing output here. Use ignored `reports/` for raw screenshots; inspect pictures manually instead of trusting bounding boxes as aesthetic proof.

For every screen, inspect at the five authoritative sizes, after resize while open, keyboard-only navigation, ability to scroll to last detail, pointer reach, focus visibility, modal dismissal, native art readiness and actor/target visibility. On smaller screens, avoid controls underneath the taskbar, dock, keyboard or browser insets. Explicitly record failures; do not infer unobserved correctness.

## First UX implementation slice: Field Guide (pending owner approval)

**Minimum scope:** improve the default specimen reading order and navigability without revising observations or adding content. Keep actual native subject portrait, known name, legitimately observed location/traits, optional known ecology/behavior/lineage and advanced numerical details. Unknown observations must say unknown or remain unavailable; no fictional prey, risk rating, relationships or evolving species taxonomy.

Proposed default order:
1. Species/individual identity and specimen picture.
2. One short **observed facts** summary (do not synthesize claims from unmeasured systems).
3. Labeled access to Anatomy, Ecology, Behavior, Habitat, History and Full Records where data exists.
4. Deep records remain scrollable and preserved behind deliberate action; no information deletion.

Acceptance: screenshot-reviewed 1920, 1366, 1024, 800 and 390 widths; native focus/scroll; no cutoff at long historical entries; no invented fields; old inspections and hotkeys stay functional; targeted `tests/knowledge.mjs`, `tests/journal.mjs`, `tests/contextual-interactions.mjs` when relevant and public export check; report existing known failure baseline without disguising it. Do not change any shared CSS or `knowledge-panel.js` without coordination.

## Usability and accessibility heuristics (proposals, not certified compliance)

- Prefer visible action labels over icon-only actions. Existing icon artwork should support comprehension, not substitute for it.
- Progressive disclosure: immediate survival and actions → selected-target context → optional full biology. Make routes to deep information obvious, not hidden in three nested menus.
- Target normal informational text around 14–16 CSS px where layout permits, and provide larger accessible scale; avoid blanket changes to densely packed existing screens before checking.
- Aim for high text/background contrast and a large, forgiving pointer target. WCAG 2.2 SC 2.5.8 specifies 24×24 CSS px or qualifying spacing/equivalence exceptions; a game may choose larger practical targets. Do not claim full accessibility certification from one numeric check.
- Preserve mouse first, real keyboard equivalence, right-click family behavior and urgent defensive actions; distinguish temporarily disabled from biologically impossible commands using canonical reasons.

References:
- NN/g, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g, Icon Usability: https://www.nngroup.com/articles/icon-usability/
- W3C, WCAG 2.2 target-size minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Game Accessibility Guidelines, resizable interface: https://gameaccessibilityguidelines.com/allow-interfaces-to-be-resized/
- Freehold Games, Caves of Qud Spring Molting: https://freeholdgames.itch.io/cavesofqud/devlog/744713/the-spring-molting-update-is-now-live

## Acceptance/provenance record template for future PRs

For each bounded change record: baseline main SHA, collaborator branch/head status, named owned files, actual current screenshots, issue/error observed, hypothesis, before/after layout measurements, action/keyboard parity, focused check names and outcomes, browser errors, screenshot interpretation, known gaps, creator approval (pending/accepted/rejected), and whether Claude integrated it. A passing test is **not** human comprehension or visual acceptance.

**Next step:** get Codex's explicit filename handoff for `src/ui/field-guide.js` and `assets/ui/natural-history-specimen.css`. After that, open a *separate* `ux/field-guide-...` branch and make a small functioning change; leave this PR as the collision-free preparation artifact.
