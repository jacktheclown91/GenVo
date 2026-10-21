# Codex integration handoff | October 21, 2026

## Branch and source boundary

- Verified remote canonical `main` starting commit: `2fb053dedeaeb05eb11c125ee2fede12bb1d3637`.
- Proposed **separate** branch: `dev/interim-vibration-sensing-2026-10-21`.
- The local Windows project remains the canonical development location for Codex. The GitHub connector changed **only the remote development branch**. No claim is made that `C:\Users\jackt\Desktop\Games\game jam october\genvo-toolkit` has been updated.
- This work does not merge PR #32/#33/#35 again. Their reconciled sensory/underground authority history is already in `main` as documented by `docs/SENSORY-RECONCILIATION-2026-10-20.md`.
- Do not fast-forward or auto-merge into `main` from this handoff. Check all uncommitted local changes and concurrent Codex commits first.

## Integration order and contracts

1. **Physical vibration rule:** `stratum-senses.js` and `sensory-world.js`; new worlds only, quill/bristle count + inherited senses; real recent movement, jump landing and energy-funded digging; substrate connectivity, moisture, stratum and contact checks; uncertain bearings only.
2. **Consumers and compatibility:** `threat-perception.js` adds cue-based detection and restores attention to a recently perceived predator via routed hearing; `sensory-fog.js` presents a separate symbol; `part-abilities.js` describes implemented capability. `Simulation`, save restore and regional travel propagate the versioned `physical-ground-vibrations/1` policy without silently converting historical saves.
3. **Focused tests:** `tests/vibration-sensing.mjs`, updated pre-existing `tests/threat-perception.mjs` fixture (its source position now matches the claimed distance), existing sensory/stratum tests and persistence/export parity. Keep historical policy tests and actual physical route checks intact.
4. **Player exploration:** `src/ui/world-resource-target.js` asks existing `sim.caveStatus` for actual body/ground requirements after the biological-vision guard; `src/render/sensory-fog.js` labels sound, scent and ground cues; `tests/cave-exploration-feedback.mjs` tests actual generated entrances, action parity and hidden-information protection.
5. **Navigation and profiling:** `docs/ARCHITECTURE.md` linked from README and registry; pure coarse-bearing extraction with unchanged results; bounded finite-cohort benchmark CI and `docs/performance/INTERIM-PERFORMANCE-2026-10-21.md`.

Resolve overlap with Codex changes in that dependency order; preserve the single owners in `design/governance/implementation-authorities.json`. Never copy only the renderer or part descriptions without the mechanical source of truth.

## Verification

The branch-focused workflow `.github/workflows/interim-vibration-regression.yml` checks vibration, sensory fog, stratum routing, threat perception, cave mouse feedback, save persistence and source-identical public export. Its latest run also compares 163,840 positive seed cohorts against a historical reference and verifies botanical identity parity. [Run 39554432483](https://github.com/jacktheclown91/GenVo/actions/runs/39554432483) records the precise tested SHA and result. Early failing runs exposed a missing mock climate and an old fixture's position/distance mismatch; they were corrected rather than hidden. Existing nonfocused failures and long-run ecological debt were not reclassified as green.

## Remaining limits and next work

- The standalone ground pulse is an evidence-window/medium-conductivity model, **not** full elastic wave physics. Long-term sensory tuning, cross-material transmission, natural-world effectiveness and player comprehension remain to be measured.
- The actual Chromium cave/ground display has **not** been inspected in this branch. No approval of finished art or of first-time onboarding is claimed.
- Full aquatic chemoreception, more extensive multi-elevation geology and complete Creature-stage scope remain on the completion matrix. This branch does not implement them.
- Mature Day-100 vegetation and perception stalls remain unresolved; use the committed October 20 measurements and bounded October 21 test, not an unverified optimization claim.
- Full-length ecology/balance campaigns and exhaustive browser play remain deferred.

## Safe local integration

From the **existing** canonical project, inventory local uncommitted work first, then fetch both tips and compare ancestry. Integrate this branch only after Codex's current in-flight work is clean and reconciled. Run the focused workflow's commands and your regular public-export/canonical-source audit in the final checked-out tree. Reproduce the same seed/profile before changing update order. Keep this pull request draft until user/Codex review; do not overwrite local source with a remote checkout without preserving local changes.
