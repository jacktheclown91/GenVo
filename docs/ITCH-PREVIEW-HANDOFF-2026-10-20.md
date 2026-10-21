# GenVo itch preview release candidate and Codex handoff

## Purpose

This branch packages a **playable browser preview** of the last committed canonical `main` code. It does **not** claim the full game is finished or replace the existing development source.

- Source commit pinned for preview: `e486b359f30343d8c47efb5b4326cf877884d5e2`
- Source project: `C:\Users\jackt\Desktop\Games\game jam october\genvo-toolkit` (`main`)
- Release branch: `release/itch-preview-2026-10-20`
- Source game files: **unchanged** from the pinned commit
- Current Codex session: paused mid-task connecting cave and underwater sensing. This unfinished local work was **not** taken into this preview. Do not discard it.

## Exact release-only work

1. Use the canonical `tools/export-public.mjs` exporter from the pinned source, not a manually copied `index.html` or a second codebase.
2. Run `node tools/check-playable.mjs` (focused tests), and `node tests/public-export.mjs` (source/asset parity and catalog hashes).
3. Export into a clean directory outside the repository.
4. Package files at the ZIP root so itch.io HTML5 hosting finds `index.html` directly.
5. Confirm no more than 1,000 extracted files, no more than 500 MB extracted total, and no single extracted file greater than 200 MB.
6. Include **both genuine pre-evolved valley checkpoints**, the creator/editor and all required runtime assets. Do not ship source-only reports, fixtures, or uncontrolled scenario files.
7. Publish one GitHub Actions artifact ZIP containing a single upload-ready `GenVo_Itch_Preview_e486b35.zip`. Extract the outer GitHub artifact ZIP, then upload the inner game ZIP to itch.io.
8. Do **not** alter GitHub `main`, publish to itch, rewrite old saves, change full-game completion status, or represent this as creator-approved without a human playthrough.

## Creator's final upload gate

Before making the itch build public, personally verify its actual hosted HTML5 version, not only localhost or automation:

- Fresh world and ordinary survival interactions.
- Guided and sandbox custom founders, part attachment, starting world and normal gameplay.
- Real Day 30 and Day 100 pre-evolved world starts and a working player.
- Movement: walk, jump, fly, glide, dive, climb, and dig when the creature has the required anatomy.
- Cave entry/exit, environmental visibility and ice without a blank/soft-locked screen.
- Save/Continue and independent world slots.
- Readable mouse action bar at different screen sizes; no unusable buttons on bodies without the capability.
- Loading and memory performance for both early and mature worlds, with attention to long frame stalls and browser storage quotas.
- Final itch page description/screenshots and AI disclosure.

If any item fails, keep the build as an internal preview, document the reproducible failure and issue a new release candidate.

## When Codex resumes

1. Inspect the remote `release/itch-preview-2026-10-20` branch and this handoff. **Do not merge its release workflow blindly** into runtime source or overwrite uncommitted sensing work.
2. Continue the paused cave/underwater sensing implementation in the **canonical local project only** and commit that separately to `main` after usual validation.
3. After a successful creator playthrough or discovered packaging defects, decide whether to cut a fresh preview from the newer `main`, keeping previous release provenance.
4. Continue planned Living Planet systems and focused verification. Reserve expensive heavy-gate/human instrumentation for the planned later stages.

## Known limitations of this preview

The preview baseline excludes any Codex work not committed by `e486b35`, including the interrupted cave/underwater sensing pass. Broader regression and performance gates have known issues. Multiple underground strata, complete cave food webs, major geology/disasters, larger-world performance, and full-game visual/creator acceptance remain open. Automated smoke success establishes an exportable candidate, not final human approval.
