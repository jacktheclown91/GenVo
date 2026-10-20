# Canonical main and exported world-start integration

The existing project `C:\Users\jackt\Desktop\Games\game jam october\genvo-toolkit` is the sole active source. October 20 fetch identified newer consolidation work through `2e07fb565c9d1e93d9154d2434c18875dc44cdb4`. All feature/work branch tips were already integrated there. Remaining diagnostic branches contain comparison workflows; the P1 optional-loss implementation matches its later accepted canonical version exactly. Diagnostic history is preserved remotely, without installing superseded experimental engines.

Local main and GitHub main were fast-forwarded from `c4453fe` to `2e07fb5` and verified with `git ls-remote`. No reset, forced push, branch deletion, alternative checkout or save migration was performed. Two preexisting untracked files containing terminal help remain untouched.

## First completion pass

The fetch-loaded scenario catalog and its two genuine checkpoint files were missing from browser exports. `tools/export-public.mjs` now validates catalog paths and exact SHA-256 hashes before writing, and copies only listed assets plus the catalog. The public-export contract checks identical catalog bytes, each checkpoint hash, and exclusion of unlisted request documents. `tools/verify-scenario-browser.mjs` now accepts an explicit served web root so source files cannot accidentally satisfy a packaged-build check. The focused playability workflow now also runs on canonical main.

## Observed verification

- Canonical audit: PASS, 284 reachable runtime modules, 91 registered parts, no errors.
- Existing focused playability gate: all 15 checks PASS, before and after edits.
- Public export and scenario checkpoint contracts: PASS. Fixed export has 661 files.
- Real Chromium save-coherence check: exact transported tick 12 and restored state; no page errors. Receipt: `test-runs/canonical-main-save-2026-10-20/review.json`.
- Exported Day 30 scenario: ordinary New World menu, gzip/hash validation, canonical restore, displayed gameplay frame and independent IndexedDB slot PASS; actual calendar Day 31, source history retained. Receipt: `test-runs/exported-day30-2026-10-20/report.json`.
- Exported Day 100 continuation: same actual packaged workflow PASS at calendar Day 101 with 292 living creatures and retained history. Receipt: `test-runs/exported-day100-2026-10-20/report.json`.
- Both captured gameplay frames were inspected. They show the playable top-down world, native creatures, action dock and save feedback. This is automated browser observation, not creator art acceptance or human playtesting.

No long ecological replay, balance campaign or release certification was substituted for implementation. Full Creature-stage gaps remain in `FULL-GAME-COMPLETION-MATRIX.md`. Gates B through E are open.
