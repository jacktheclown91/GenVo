# Rule: Git Safety & Provenance

1. **Single Authoritative Repository**:
   - The primary repository is located at `genvo-toolkit` on branch `main`.
   - Never reset, force-push, or obliterate history.
   - Bounded, coherent commits only.

2. **No Parallel Conflicts**:
   - Only one primary agent makes changes to shared files (e.g., `src/main.js`, `src/render/renderer.js`, `styles.css`).
   - Coordinate changes and review diffs carefully before committing.

3. **Verification Before Integration**:
   - Run the applicable unit/integration checks and `node tools/check-playable.mjs` before committing.
   - Do not claim a fix or feature is complete without concrete browser or test evidence.

4. **Provenance & Audit Trails**:
   - Document significant design/architectural decisions in `provenance/ledger.jsonl`.
   - Attribute human guidance and AI assistance truthfully.
