# GenVo8 — Menu, Multi-World Saves, Settings & Credits Expansion

**Status:** Approved design proposal for next UI/UX pass; not implemented by this document.  
**Date:** 2026-10-10  
**Basis:** User's requested menu enrichment and tester feedback, plus source inspection of the uploaded `genvo8-toolkit-v1.60.1.zip`. Newer Codex working files were **not** available for inspection; reconcile before editing.

## 1. Goal

Bring GenVo8's outer interface up to the level of its evolving survival systems. Make it possible to maintain several independent evolving worlds, navigate the game without refreshing the page, change settings from either location, and credit contributors appropriately.

**Required outcomes:**
- Fully functional **Main Menu** and **Pause Menu** with consistent Back/Resume routes.
- **Multiple independent world save slots** with separate autosaves, manual saves, and metadata.
- Organized **Settings**, discoverable full-screen control, clear in-game controls.
- **Credits** with an accurate, consented acknowledgment of **Pentagram Star (Alex)**.
- No destructive regressions, forced fullscreen, or hidden one-key-only navigation.

### Context from tester feedback
- Alex repeatedly found the evolution editor cramped and did not discover the game's `Tab` control to switch playable family members.
- Alex did not realize fullscreen was available through itch's host expand control.
- The first mate was recognizable but subsequent mate discovery was confusing.
- Earlier menus and scrolling regions were judged visually rough. This pass must not produce generic, dense control panels.

## 2. Current source integration points (v1.60.1 baseline only)

- `src/main.js` controls game initialization, tutorial screens, and input; `KeyP` toggles `manualPause` and `#pauseNotice`. `Escape` closes several panels. Preserve those behaviors during transition.
- `src/persistence/save-manager.js` already writes snapshots and metadata to IndexedDB database `genvo8-saves`, object stores `saves` and `meta`, keyed by `SAVE_KEY='autosave'`; `SAVE_SCHEMA=9` in this baseline. Replace the *single-key model* with world-slot-aware keys without rewriting the serializer unnecessarily.
- A 45-second autosave interval and some lifecycle saves are already implemented. Preserve or deliberately revise autosave policy; never rely only on `pagehide` for persistence.
- `index.html` has welcome flow and manual Save/Load controls. Refactor into a navigation flow rather than duplicating stateful overlays.
- This inspection is **not** a claim about current unpublished Codex changes; check their version and merge safely.

## 3. Main Menu (player-visible)

Entry: boot, Return to Main Menu, and Back from secondary menu screens.

Actions:
1. **Continue** — loads the selected / most recently active valid world slot; if none, disabled with explanation. Show which world will load.
2. **New World** — configure world name, seed (optional), and currently *implemented* experience mode. Guided Survival is default once implemented; do not expose unfinished modes as usable.
3. **Load Worlds** — opens save browser with per-world metadata and management controls.
4. **Settings** — same categories accessible in pause.
5. **How to Play / Controls** — show `Tab` / `Shift+Tab` family switching, movement, abilities, pause, evolution editor, mate-finding clues and native fullscreen.
6. **Credits** — view approved credit entries.
7. **Fullscreen / Windowed** — visible labeled toggle where supported; gracefully explain limitations in itch embedded browsers.

Do **not** put a fake desktop-style Exit/Quit button in the browser build.

A decorative world may render behind the menu, but **simulation ticks, ecology, hunger, AI, timers and reproduction must not progress** behind a main menu. Use non-simulated motion only when desired.

## 4. Pause Menu

- `Escape` is the standard open/back/resume key when not closing a higher-priority overlay. Existing `P` shortcut may remain an alias if it does not conflict with modal state.
- Actions: **Resume**, **Save World**, **Load World**, **Settings**, **Controls**, **Return to Main Menu**. Optionally show **Credits** if layout permits; main menu must always have it.
- Show active slot/world title and a short state summary: generation, world age, biome/region, last save, and save status.
- Any modal that owns simulation pause must respect a centralized **pause-reason controller** (e.g. `main-menu`, `pause-menu`, `editor`, `tutorial`, `load`, `visibility`). Closing one overlay must not accidentally resume when another still requires pause.
- When leaving to main menu, offer **Save and Return**, **Return Without Saving**, **Cancel**; only label it saved after IndexedDB confirms completion.
- Loading a different slot while in play requires clear confirmation about unsaved progress. Release stuck movement input and safely recreate UI/controllers around loaded sim.
- Pause gameplay clocks and AI updates, not merely movement input. Music should pause or duck in a predictable way; settings remain responsive.

## 5. Save Slots & Persistence

### Data model

Use **world IDs** (not a single global `autosave` key). Each world contains:
- Unique stable ID; user-editable name; creation and last-save timestamps.
- World seed, active generation, world age/day/year, current creature/lineage summary, game version and save schema.
- **Autosave** checkpoint and separately kept **manual** checkpoint(s); autosave must never silently destroy the manual checkpoint.
- Optional thumbnail from a *real* game render, not fabricated art. Thumbnail failure must not block saving.
- Last known validation state: playable, migration needed, incompatible, or corrupt.

Offer at least six worlds in the visible browser and support scrolling/paging without a permanently hardcoded world-count ceiling. Storage quotas may limit actual capacity; report failures clearly. These are independent worlds; never make world A's autosave overwrite world B.

### World browser actions

**Play / Continue · New · Rename · Save · Load checkpoint · Delete (confirmation) · Export · Import**. A duplicate/copy action can be a later enhancement.

- Start a new world into a chosen empty/new slot. Never overwrite a previously occupied slot without explicit confirmation.
- Each slot must have separate autosave policy and metadata. Switching worlds updates active world ID atomically.
- Save is considered successful only after the relevant IndexedDB transaction completes; handle transaction errors, storage quota, serialization failures, and tab interruption.
- Keep last good checkpoint on write failures; preferably implement a recoverable previous snapshot or transactional checkpoint rotation.
- On version/schema change: provide explicit supported migrations. Incompatible saves remain visible with an explanation rather than being silently deleted or corrupted.
- Provide **Export World** and **Import World**, because browser/itch saves can be lost if site storage or browser profiles are cleared. Validate imported files before commit; sanitize names; avoid running data as code.
- Consider tab coordination for same-origin concurrent play, preventing silent cross-tab world overwrites.
- Snapshot completeness must cover evolving populations, world layer states (aquatic, underground), seasonal climate, stores/caches, relationships, lineage genetics, preferences, and deterministic RNG state if those systems are present in the **current** code.
- Avoid aggressive whole-world serialization every frame. Autosave asynchronously when safe; preserve simulation consistency.

### Autosave and manual checkpoints

- Keep a clearly displayed last-save indicator; if save unavailable, **warn conspicuously** rather than implying safety.
- Autosave periodically and after significant safe milestones when appropriate; do not assume background page unload can finish asynchronous writes.
- Autosave after switching player members/lineages should be evaluated against losing a previously recoverable state; provide explicit manual checkpoint ability.
- Do not automatically load a death-state autosave over the player's earlier manual save without choice.

## 6. Settings navigation

Suggested categories:

- **Audio:** master, music, ambience, SFX, optional mute, persisted globally.
- **Display:** fullscreen/windowed button, readable UI scaling, effective resolution/stretch policy, pixel-perfect option where practical, zoom, optional camera behavior.
- **Gameplay:** tooltips, tutorial/objective display, autosave preference, warnings, notification frequency. Simulation-rule changes belong to **world creation** or an explicitly labeled world-rules panel, not silently global toggles.
- **Controls:** readable keyboard map with `Tab` and `Shift+Tab`, pause, editor access; remappable binds if supported, with conflict detection.
- **Accessibility:** text scaling, reduced motion/screenshake, contrast cues, large click targets, focus visibility, keyboard navigation, optional non-time-critical tooltip behavior.

**Acceptance rule:** Settings screens are navigable with mouse and keyboard and remain usable at 900×650 and at a typical itch embed size. Avoid clipped controls, modal overlap, tiny expand arrows, and nested hidden scrollbar traps. Show immediate Apply/Cancel semantics for settings that can be previewed or reverted.

## 7. Fullscreen and embedded web behavior

- Provide a visible **Fullscreen** control in both main and pause menus; don't depend solely on itch's host controls.
- Request browser fullscreen only from a direct user gesture; test when the game lives inside an iframe, where fullscreen permissions may be restricted.
- When browser denies fullscreen, give a helpful fallback such as using the itch page's expand control.
- Preserve UI readability and pointer interaction during viewport changes and while exiting fullscreen with `Escape`.

## 8. Credits — accurate attribution with consent

The user reports Alex explicitly consented to being credited and supplied his preferred novelist pen name: **Pentagram Star**. No public account/profile link is available yet, so do not invent one.

Suggested entry in the Credits menu:

> **Playtesting, Brainstorming & Design Feedback**  
> **Pentagram Star (Alex)**  
> Contributions to early-game challenge, competition, creature behavior, courtship and mate preferences, and usability feedback.

The role is *community playtesting and design input*, **not** programmer, co-creator, owner, or credited code/asset author unless independently justified by actual work and agreement. If author wishes public display only as **Pentagram Star**, remove the parenthetical real-world/chat name. Preserve approval for the exact published spelling before external release when practical.

Other provisional labels: **Created & Directed by SevenFoldStories [QUIλ]**, **AI-assisted implementation/art/audio** where appropriate and factually supported; keep credits data-driven and accurate, with more contributors as relevant. Copyright/legal authorship and acknowledgment are different matters. Store credited decisions and provenance without assigning work the person did not perform.

Credits UI: scrollable only if necessary, stylized consistently with authored world/menus, keyboard accessible, back to previous menu, no dead or speculative profile URL.

## 9. Navigation model and modular implementation

Recommended *responsibility boundaries*; exact module names should follow the latest canonical source:

- `src/ui/main-menu.js` — menu view and actions.
- `src/ui/pause-menu.js` — contextual pause controls.
- `src/ui/world-slots.js` — slots, metadata, confirmation and import/export UI.
- `src/ui/settings-menu.js` — tab navigation, labels, settings controls.
- `src/ui/credits-menu.js` + `src/data/credits.js` — credits, no hardcoded DOM strings scattered across source.
- `src/app/navigation.js` and/or `src/app/pause-state.js` — one authoritative navigation stack/pause-reason model.
- `src/persistence/save-manager.js` — refactor keyed database layer, preserve existing serializers where valid.
- `src/settings/settings-store.js` — validated persisted settings independent of world saves.

Preserve the canonical **source** and **public/itch** deliverables. Do not create a third release toolkit. No monolithic `main.js` expansion or scattered `sim.paused` overwrites.

## 10. Acceptance tests / QA matrix

| ID | Verification | Expected result |
|---|---|---|
| MENU-01 | Fresh boot with no saves | New World accessible; Continue disabled and explained |
| MENU-02 | Create worlds A, B, C with different seeds | Three separate slots, metadata, and timelines |
| MENU-03 | Save A, play B, load A | A restored exactly; B unchanged |
| MENU-04 | Autosave A then manual-save A, then autosave again | Manual checkpoint still selectable |
| MENU-05 | Rename/Delete one slot | Other slots intact; deletion requires confirmation |
| MENU-06 | Save export + import into empty slot | World, seed, lineages and ecology restored; invalid import rejected |
| MENU-07 | Force IndexedDB quota/write failure | User sees error, last known good save preserved |
| MENU-08 | Schema mismatch or corrupt save | Slot visible with explicit state, safe recovery; no silent deletion |
| MENU-09 | Pause amid predation, pregnancy, weather, and AI | All simulation progress freezes; resumes from consistent state |
| MENU-10 | Pause then open Settings then Back | Still paused, correct prior menu returns |
| MENU-11 | Open editor/tutorial pause then dismiss pause menu | No accidental simulation resume while another pause reason remains |
| MENU-12 | Return to Main Menu then Continue | Correct active world; HUD/controllers reset; movement keys clear |
| MENU-13 | Request fullscreen inside and outside itch iframe | Native switch when allowed; fallback explanation when denied |
| MENU-14 | Browser resize 900×650 and typical embed | No clipped text, overlapping modal, inaccessible part controls or tiny click areas |
| MENU-15 | Keyboard-only menu route | All primary actions focusable, Esc works, focus visible, no accidental Tab-to-switch-family while menu focused |
| MENU-16 | Controls screen | Tab/Shift+Tab, pause, editor and movement instructions discoverable |
| MENU-17 | Credits | Pentagram Star displayed as approved acknowledgment, with no invented profile link |
| MENU-18 | Reload/refresh and re-open | Per-world state and settings persist correctly; no accidental world ticking behind menus |
| MENU-19 | With existing current-world save | Upgrade/migrate safely or expose explicit incompatibility without wiping existing data |
| MENU-20 | 15+ separate world slots / large save browser | Efficient navigation, no fixed eight-slot ceiling, graceful storage handling |
| MENU-21 | Active ecology including water/underground/seasons | Relevant current-generation data all captured on save/load |
| MENU-22 | Real-play screenshot + console audit | No runtime errors, no fabricated screenshots, no unstable navigation loops |

## 11. Sequencing & delivery

1. **Reconcile latest Codex baseline** and complete the current aquatic/seasonal stability work without overwriting changes.
2. **Build authoritative menu / pause navigation**, preserve old shortcuts and cleanly separate editor/tutorial pauses.
3. **Refactor world-slot persistence** with migration/recovery and tests before removing the old one-slot flow.
4. **Settings + fullscreen + controls discovery**; verify small viewports and iframe behavior.
5. **Credits** with consented `Pentagram Star` acknowledgement, no speculative link.
6. **Run all new tests and existing regression suites**, then browser playtest using real screenshots.
7. **Package only canonical source and public builds** once stable and update provenance/handoff records.

### Non-goals

- Do not rebuild the evolutionary simulation or tamper with its rules in this UI phase.
- Do not introduce a separate launcher/framework or hidden network/cloud service.
- Do not delete old saves to simplify implementation.
- Do not claim working current-game features before they have been implemented and tested.

## 12. Codex continuation prompt

> Add the GenVo8 Menu, Multi-World Saves, Settings & Credits Expansion using this specification. First inspect the latest canonical working tree, especially changes after v1.60.1, and preserve ongoing aquatic, underground, seasonal, and ecology work. Implement in small audited modules and verify each navigation/persistence pass with tests and actual browser screenshots. The initial build must introduce reliable pause/resume and multiple independent save slots without deleting existing user data. Provide a native fullscreen action, accessible controls/settings, and credits listing **Pentagram Star** under **Playtesting, Brainstorming & Design Feedback**. No invented profile link. Preserve provenance and produce only the updated source and public/itch packages once tests and screenshots are real and passing.
