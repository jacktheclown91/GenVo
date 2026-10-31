---
name: genvo-project-inspection
description: Inspect local/GitHub status, canonical source, outstanding changes, architecture ownership, current test results, release readiness, and blockers.
---

# GenVo Project Inspection Skill

Use this skill to assess repository state, verify authority, and audit readiness without guessing or relying on stale documentation.

## Activation Criteria
- Starting a new development session or taking over work.
- Verifying local vs. remote Git synchronization.
- Inspecting working tree cleanliness, active branches, or release artifacts.

## Inspection Procedure

1. **Git & Repository Verification**:
   ```powershell
   git status
   git log -n 5 --oneline
   git remote -v
   git worktree list
   ```
   - Ensure the working directory is the canonical repository (`genvo-toolkit` on `main`).
   - Check if there are uncommitted changes or divergent branches.

2. **Architecture & Authority Audit**:
   - Check mechanism owners in `design/governance/implementation-authorities.json`.
   - Run the dependency architecture check:
     ```powershell
     node tools/architecture-check.mjs
     ```

3. **Source Integrity & Assets**:
   - Verify canonical source audit and exports:
     ```powershell
     node tools/canonical-source-audit.mjs
     ```

4. **Test & Release Readiness**:
   - Inspect existing release kits in `releases/` and docs in `docs/itch-page-2026-10-30/`.
   - Run the fast playable gate:
     ```powershell
     node tools/check-playable.mjs
     ```
