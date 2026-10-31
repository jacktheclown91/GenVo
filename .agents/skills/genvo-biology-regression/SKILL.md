---
name: genvo-biology-regression
description: Validate deterministic biological behavior, finite resources, lineage inheritance, save continuity, and regional ecology.
---

# GenVo Biology Regression Skill

Use this skill to protect the biological integrity of the Living Planet simulation whenever modifying simulation or ecology code.

## Activation Criteria
- Making changes to `src/sim/`, `src/world/`, `src/ecology/`, `src/lineage/`, or `src/reproduction/`.
- Verifying save/restore determinism, genetic inheritance, or population demography.

## Regression Verification Suite

1. **Deterministic Baseline Check**:
   - Verify tick-by-tick snapshot determinism:
     ```powershell
     node tests/modernization-baseline.mjs
     node tests/save-persistence.mjs
     node tests/extinct-lineage-save.mjs
     ```

2. **Reproduction & Inheritance**:
   - Verify sexual/clonal inheritance, mate choice, and viability:
     ```powershell
     node tests/reproduction.mjs
     node tests/conception-parental-inheritance.mjs
     node tests/reproductive-similarity.mjs
     node tests/autonomous-recognition.mjs
     ```

3. **Physiology & Finite Resources**:
   - Verify water/energy conservation and Kleiber scaling:
     ```powershell
     node tests/tissue-water.mjs
     node tests/tissue-energy.mjs
     node tests/carrying-demand.mjs
     ```

4. **Regional Continuity**:
   - Verify multi-hop regional travel and synchronization:
     ```powershell
     node tests/regional-synchronized-replay.mjs
     node tests/regional-multi-hop-biology.mjs
     ```

5. **Full Playable Gate**:
   ```powershell
   node tools/check-playable.mjs
   ```
