# GenVo tools

Active tools only: those referenced by the gate, tests, other tools, CI workflows or the current documents. Run everything from the repository root.

## Release pipeline (see `docs/RELEASE-CHECKLIST.md`)

| Step | Tool |
| --- | --- |
| Playable regression gate (Node 22 and 24) | `node tools/check-playable.mjs` (`--list`, `--shard=i/n`) |
| Full suite with tiers and the known-failure ledger | `node tools/run-tests.mjs --all --jobs 6 --json OUT.json` |
| Static checks | `node tools/architecture-check.mjs`, `node tools/canonical-source-audit.mjs` |
| Presentation reference sheets (needed by the audit) | `node tools/export_sprite_sheets.cjs` |
| Browser export of exactly the reachable runtime | `node tools/export-public.mjs OUT_DIR` |
| itch.io HTML5 ZIP and report | `python tools/package-itch-preview.py EXPORT ZIP REPORT` |
| Browser verification of an extracted ZIP | `node tools/verify-release-browser.mjs EXTRACTED EVIDENCE --autonomous-populations` |
| First-player and integrated acceptance | `tools/capture-first-player-acceptance.cjs`, `tools/capture-integrated-acceptance.cjs` |
| Mature-world performance | `node tools/measure-mature-regions-browser.mjs PUBLIC_ROOT OUT.json [SECONDS]` |
| Store screenshots and cover | `docs/itch-page-2026-10-30/tools/` |
| Source package | `python tools/source_package_inventory.py`, `python tools/package-development.py` |
| Provenance ledger | `tools/provenance-record.mjs`, `tools/provenance-verify.mjs` |

## Folders

- `creature-lab/`: the optional sprite authoring Lab (shipped with the export).
- `art-production/`, `art-resolution/`, `presentation/`: art-pipeline helpers used by tests.
- `fixtures/`, `experiments/`: data used by tests and studies.
- `archive/`: one-off review, capture and probe scripts from earlier passes (see its README).
