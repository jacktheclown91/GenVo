# GenVo consolidation plan (October 30)

Authority: `main` at `f7f3122a` (local worktree and `origin/main` agree). Nothing below changes game behaviour. "Archive" means moved intact to `game jam october/GenVo-archive/` (same drive, path-mirrored, reversible) or preserved as a Git tag. "Delete" applies only to things provably contained elsewhere.

## 1. Local working copies

| Item | State | Action |
| --- | --- | --- |
| `genvo-toolkit/` (main checkout) | On Codex's `codex/audio-motion-presentation-20261028` (0 unique commits; fully in main). Untracked: Codex's `docs/limb-direction-review-2026-10-29/` files, my stray empty `scratch_seam.mjs` | **Keep as the one canonical project**, switched to `main`. Codex's untracked review files go to the archive; the stray file is deleted |
| `.claude/worktrees/claude-systems` | This session's worktree, on `main` | Detach at the end so the main checkout can hold `main`; you can remove it afterwards |
| `.claude/worktrees/baseline-8e724f72` (933 MB) | Clean, commit in main | **Delete** (`git worktree remove`) |
| Temp `scratchpad/base3` worktree | Emptied scratch copy, commit in main | **Delete** (prune) |
| `~/.codex/worktrees/torpor-presentation-proof` (4.6 GB) | Codex, detached at a main commit, 9 uncommitted changes: October 27 drafts of files main finished on October 28 | **Archive** the diff as a patch plus the two untracked files, then remove the worktree |

## 2. Git branches and PRs

| Branch | Unique work vs main | Action |
| --- | --- | --- |
| local `codex/hud-readability`, `codex/menu-lab-integration`, `codex/audio-motion-presentation` (local and remote) | none | **Delete** |
| `integration/visual-ux-candidate-20261030` | none (merged as PR #51) | **Delete** remote branch |
| `ux/*` ×9 (PRs #42–#50, drafts) | Content in main through PR #51; only `renderer.js` differs, where #51 combined them | **Tag** each `archive/ux/<name>`, delete the branches. **You close PRs #42–#50** with "incorporated via #51" (I can't sign in to GitHub) |
| `codex/ground-paint-candidate` | 1 unmerged Codex art candidate | **Tag** `archive/codex/ground-paint-candidate`, delete the branches |
| `release/itch-web-6d4964ba`, `release/itch-web-98b276b2` | Packaging-workflow commits only | **Tag** `archive/release/…`, delete the branches |

Tags keep every commit reachable. Nothing is force-pushed or rewritten.

## 3. Local files outside Git

| Item | Size | Action |
| --- | --- | --- |
| `genvo-toolkit/builds/` (44 old build folders, ignored) | 5.5 GB | **Archive** |
| Untracked evidence in `docs/` and `reports/` (captures, videos, run output) | about 11 GB | **Archive**, path-mirrored. The gate never reads untracked files (CI passes from a clean clone), so nothing breaks; tools still write new evidence into `docs/` |
| `genvo-toolkit/scratch/` (ignored) | small | **Archive** |
| `releases/GenVo-RC-20261026-*`, `GenVo-RC-20261027-6d4964ba`, `GenVo-20261026-36dd0e62` | about 1 GB | **Archive** |
| `releases/GenVo-RC-20261030-bc3017bf` working folder (source copy, captures) | 1.7 GB | **Archive**, keeping its ZIP and evidence |
| `releases/itch-page-before-2026-10-30/` | 56 MB | **Keep** as the rollback package |
| `releases/GenVo-itch-upload-2026-10-30/` | 69 MB | **Replace** with the final package rebuilt from the final `main` |
| `game jam october/GenVo-web.zip`, `GenVo-itch-upload-2026-10-22/`, `evidence/` | about 0.8 GB | **Archive** |
| `GenVo-Mutation-Dash*.zip`, `xenocyst-web.zip` | small | **Untouched** (not GenVo) |
| Git temporary objects (23, 39 MB) | | `git gc` |

## 4. Repository structure (tracked)

- **Root:** the eight loose design documents (`GENVO8-*`, `GenVo8_*`, `GenVo-v1.73-*`, `CHANGES-SINCE-v1.31.md`) move to `docs/history/root-plans/`. They have no code references; the move is recorded in `docs/history/README.md`, and historical receipts are not rewritten.
- **Current documents:** exactly one of each.
  - `docs/CURRENT-IMPLEMENTATION.md`: implementation reference, updated.
  - `docs/ROADMAP.md`: new. It replaces the competing roadmaps, which move to `docs/history/`; `REFACTOR-BACKLOG.md` stays as the refactor list.
  - `docs/RELEASE-CHECKLIST.md`: new, the reproducible build and verification procedure.
- **Tests:** physical moves would break about 400 relative paths. Instead, `tests/MANIFEST.json` classifies every one of the 768 scripts:
  - **gate:** 250 release checks;
  - **study:** long, under 30 minutes each;
  - **passing:** ungated;
  - **known-failing:** with the classified reason;
  - **support:** helpers.

  A fresh full sweep backs the classification. No failing test is deleted.
- **Tools:** `tools/MANIFEST.json` classifies the release pipeline, harnesses and one-off reviews. Unreferenced one-off review tools move to `tools/archive/`.
- **Duplicate presentation code:** `src/render/arid-presentation.js` and `src/render/inertia-expression.js` are Codex implementations that the game never loads; PR #51's versions run instead. They, their review tools and their tests are **removed**, preserved by tag `archive/codex/superseded-presentation`. `src/render/fauna.js` and the other test-only modules stay, classified as non-runtime.

## 5. Release and verification

Rebuild from the final `main`: one ZIP with build identity, screenshots and cover recaptured from that exact build, description, AI disclosure, provenance and a file manifest. Then:
- both gates on Node 22 and 24;
- the browser checks on the extracted ZIP: release browser, first-player and integrated acceptance;
- a regional travel and persistence check;
- mature-world performance;
- save compatibility, using the frozen interleaved-clock and save fixtures in the gate.

## Not done here

Closing PRs #42–#50 (needs your GitHub account), the itch.io upload, and the provenance ledger's release record (needs a creator decision).
