# Historical development record

Begin new work with ../../README.md, ../../design/CURRENT-DESIGN.md and ../CURRENT-IMPLEMENTATION.md.

README-checkpoints-through-2026-10-18.md preserves the former README byte for byte. Links inside that snapshot retain their original root-relative context; use its original paths from the repository root.

Earlier root GenVo8 plans, dated assessments, versioned UX/GDD proposals, docs/BIOLOGY-ROADMAP.md, docs/ACTIVE-LIVING-PLANET-WORK-GOAL.md and docs/living-planet-architecture/CURRENT-ACCEPTANCE-MAP.md remain at their original paths to preserve references. Their checkpoint claims and branch ownership are historical. Approved constraints remain relevant through the current design; stale pending-work lists are not current instructions.

Reports and screenshots are evidence scoped to a commit/run. Exact older implementations in reports/*-before/ are test/capture fixtures, not obsolete disposable source. Save migrations and archived experimental kernels remain until their consumers and contracts can be retired explicitly.

IMPLEMENTATION-before-live-refresh-2026-10-19.md preserves the preceding live implementation entry byte for byte (SHA256 d2bad5d45ea09118002e232849c60c0e24cce1fd83afded405dfc6b370339d76). It is historical checkpoint prose, not current implementation instructions. Links inside retain their original context relative to docs/. Use ../CURRENT-IMPLEMENTATION.md for live status.

## October 30 consolidation

- `root-plans/`: the eight design documents formerly at the repository root (`GENVO8-*`, `GenVo8_*`, `GenVo-v1.73-*`, `CHANGES-SINCE-v1.31.md`). The paths in `provenance/decision-map.json` and `provenance/authorship-manifest.json` now point here. The ledger and tree-state receipts keep their original paths.
- `roadmaps/`: superseded roadmaps and goal documents (`SIX-MONTH-TECHNICAL-ROADMAP`, `BIOLOGY-ROADMAP`, `ACTIVE-LIVING-PLANET-WORK-GOAL`, `ACTIVE-DEVELOPMENT-GOAL`, `FULL-GAME-DEVELOPMENT-PLAN-2026-10-21`). The current roadmap is `../ROADMAP.md`.
- `../../tools/archive/`: 626 one-off scripts that historical reports name as `tools/<name>`.
- Untracked local evidence (captures, videos, run output: 57,012 files, 16.7 GB), old builds and old release packages are outside the repository, in `game jam october/GenVo-archive/`. Paths are mirrored, and the move is listed in `genvo-toolkit-untracked/MANIFEST.json` there.
- Superseded branches are preserved as tags: `archive/ux/*` (draft PRs #42–#50, incorporated through PR #51), `archive/codex/ground-paint-candidate`, `archive/codex/superseded-presentation` (the unwired `arid-presentation.js` and `inertia-expression.js`), and `archive/release/itch-web-*`.
- The plan and its rationale are in `../CONSOLIDATION-PLAN-2026-10-30.md`.
