---
name: genvo-feature-development
description: Plan, implement, test, and commit bounded feature changes while respecting subsystem authorities, biological rules, and UI doctrine.
---

# GenVo Feature Development Skill

Use this skill when implementing new gameplay features, bug fixes, or visual/UI adjustments.

## Activation Criteria
- Addressing creator feedback, gameplay defects, or completion matrix tasks.
- Modifying simulation, presentation, UI, or persistence subsystems.

## Development Workflow

1. **Authority Inspection**:
   - Consult `design/governance/implementation-authorities.json` to identify owning files and dependent modules.
   - Review relevant contracts in `docs/` and design rules in `design/CURRENT-DESIGN.md`.

2. **Establish Baseline**:
   - Capture current runtime behavior and screenshots/measurements before modifying code.
   - Run relevant unit tests to verify pre-change behavior:
     ```powershell
     node tests/<relevant-test>.mjs
     ```

3. **Bounded Implementation**:
   - Keep changes scoped to owning modules.
   - Preserve physical state vs. presentation separation: presentation reads state, never dictates biology.
   - Respect resource conservation, mass scaling, and determinism.

4. **Verification & Proof**:
   - Run targeted test suites:
     ```powershell
     node tests/<relevant-test>.mjs
     ```
   - Run the integration gate:
     ```powershell
     node tools/check-playable.mjs
     ```
   - For UI/visual changes, launch Chromium and verify directly across resolutions.

5. **Commit & Provenance**:
   - Review diff (`git diff`).
   - Create a clean, focused commit with an informative message.
   - Record architectural decisions in `provenance/ledger.jsonl` if mechanism ownership or contracts changed.
