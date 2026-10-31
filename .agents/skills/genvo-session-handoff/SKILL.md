---
name: genvo-session-handoff
description: Record the authoritative commit, changes made, test evidence, unresolved issues, and the next bounded task at the conclusion of a development session.
---

# GenVo Session Handoff Skill

Use this skill at the conclusion of every development session to preserve full project state and clear continuation instructions.

## Activation Criteria
- Ending an active development session or preparing a handover report.
- Logging work completed and remaining priorities.

## Handoff Checklist

1. **State Capture**:
   - Record exact Git commit SHA:
     ```powershell
     git rev-parse HEAD
     ```
   - Check status and uncommitted files:
     ```powershell
     git status --short
     ```

2. **Evidence Summary**:
   - Record tests executed and passing counts (e.g. `check-playable.mjs` check count).
   - Document browser visual verification outcomes and resolutions tested.
   - Note any performance or frame-time measurements (p50, p95, p99).

3. **Status Ledger**:
   - Update `provenance/ledger.jsonl` if major decisions or milestones occurred.
   - Summarize changes made across source files.

4. **Next Bounded Work**:
   - Clearly articulate the exact next task, priority, and relevant source files.
   - Flag any open risks or prerequisites.
