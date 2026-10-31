---
name: genvo-release-engineering
description: Create verified HTML5 web packages from exact commits, run full gates, validate extracted bundles, preserve rollbacks, and prepare itch.io assets.
---

# GenVo Release Engineering Skill

Use this skill when preparing, packaging, or verifying candidate and production builds for itch.io.

## Activation Criteria
- Preparing a release candidate (RC) or production build.
- Verifying file quotas, safe zip extraction, or itch.io bundle requirements.

## Release Procedure

1. **Verify Exact Commit & Working Tree**:
   ```powershell
   git status
   git log -1 --oneline
   ```
   - Ensure working tree is clean. Record the exact source commit SHA.

2. **Full Playability & Architecture Gate**:
   ```powershell
   node tools/check-playable.mjs
   node tools/architecture-check.mjs
   node tools/canonical-source-audit.mjs
   ```

3. **Package Generation**:
   - Run the public exporter to build the HTML5 package:
     ```powershell
     node tools/export-public.mjs
     ```
   - Or run the source package inventory:
     ```powershell
     python tools/source_package_inventory.py
     ```

4. **Verify Extracted Public Build**:
   - Test the generated zip package in headless Chromium:
     ```powershell
     node tools/verify-public-build.cjs
     node tools/verify-release-browser.mjs
     ```

5. **Itch.io Alignment & Rollback**:
   - Verify checksums against `releases/`.
   - Ensure rollback copies are preserved in `releases/`.
   - Maintain AI disclosures (`submission/AI_DISCLOSURE.txt`) and metadata (`submission/ITCH_PAGE_NOTES.md`).
   - **Never push to public itch.io without explicit human creator authorization.**
