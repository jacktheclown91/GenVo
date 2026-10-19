# Repository cleanup manifest

Scope: source reconciliation and repository consolidation authorized after the cleanup audit. Snapshot October 18, 2026. Published history and remote feature branches are preserved; no force push or release.

## Retained

Canonical src/assets, functioning tests/tools, original human art, schemas, provenance, save migrations and approved decision records remain. The old main c4453fe is still in ancestry. All protected reports/*-before source fixtures remain at their original paths: import/reference searches confirmed consumers in comparison tests and capture tools. Historical experimental tissue, swimming-review and fauna-checkpoint modules are now classified explicitly, not deleted for being outside runtime reachability.

All original reports, screenshots and local checkpoints remain. The LOCAL-CHECKPOINT-MANIFEST.json still identifies large local saves; a clone alone cannot reproduce every archived experiment. Prior acceptance receipts remain unaltered.

## Consolidated

README is now a short entry point. design/CURRENT-DESIGN.md owns intent, docs/CURRENT-IMPLEMENTATION.md owns integration status, and root AGENTS.md directs new sessions to those authorities. Historical root plans, BIOLOGY-ROADMAP, old acceptance map and branch-local completion goal carry explicit history banners; their bodies and paths remain for provenance. Governance now distinguishes historical executable fixtures from runtime authority and derives part counts from source.

Git inputs pinned for integration:

- `origin/feat/e18-offscreen-biological-replay`: `dfe097a8302f4f25f3900cfb79893b4a4cabdf5d`
- `origin/feat/e3-insulation-climbing-precursors`: `7560e80d9a4172e0075e9c64eb93b5fa1bdcc41b`
- `origin/feat/e2-living-woodland`: `ed2d389fb6a0bc3779c7bd48ec640045745455d4`
- `origin/feat/p3-diet-hotpath-lookup`: `56eeb7e68f636c19e5e9ed7a972c04dde37c7a59`
- `origin/work/living-planet-completion`: `629d0f22a08b6a48ea7807557435747b756d07ad`

E3 and E2 retain their divergent fixes. P3 overlap resolution keeps E18 metabolism, the static meal-channel recipe cache and immutable-plan thermal/grip caching while preserving E6 heat-frill/wax/pad effects. Pigmentation overlap retains frozen inherited pigments and regional birth bookkeeping. Normal merge commits record both parents.

## Archived

The former 1,879-line README is preserved byte-for-byte in docs/history/README-checkpoints-through-2026-10-18.md. docs/history/README.md identifies the original path context and current replacements. Historical design/evidence remains at existing paths where moving it would disturb consumers.

## Packaging and ignore rules

Source packages now select Git-visible files (tracked plus pending nonignored work), then exclude builds, private/cache directories, archived package trees, snapshots and per-suite artifact folders. This replaces recursive docs collection, which could include approximately 2.90 GB of ignored checkpoints. Historical comparison profiles explicitly selected by existing Git rules remain. Browser export still follows the runtime graph and Creature Lab dependencies. Package manifests now identify actual revision, pending state and payload hashes; obsolete hardcoded milestone claims and source-README overwrites were removed. The package tool still requires its existing browser-proof prerequisite; no release ZIP was produced.

Derived sprite-reference sheets are reproducible, ignored and excluded from packages. Run node tools/export_sprite_sheets.cjs before the canonical audit when absent. No biological code imports those sheets.

## Proposed for later removal, not deleted

- 34 ignored dated build directories (~4.41 GB at audit; inventory in docs/history/local-build-candidates.json): inventory and select necessary browser-proof/handoff packages before relocating or removing them. Active or uniquely evidenced builds must remain available.
- Ignored raw reports and per-suite logs: retain summary receipts and referenced captures before archival; no broad reports deletion is safe because it also contains executable fixtures.
- Six exact duplicate screenshot groups (~2.09 MB redundant; exact paths/hashes in docs/history/duplicate-screenshot-candidates.json): some represent distinct before/after or failed-attempt roles. Preserve role/hash aliases before deduplicating. No screenshot was removed merely because its bytes match.
- Large local simulation snapshots (~2.90 GB): preserve the checkpoint manifest and replay requirements before external archival. They are now excluded from source packaging.

No destructive media/build cleanup was performed. These candidates remain explicit rather than being called obsolete without evidence.

## Verification

Full fast run: 458 suites, 432 pass, four known failures, nine additional failures, zero timeouts, one stale ledger entry and 12 deferred; 220 seconds with no code/configuration drift. Receipt: docs/test-runs/repository-consolidation-fast-final-2026-10-18.json.

All nine failing suites reproduced independently from committed dfe097a: four native catalog coverage checks (85 artworks versus 91 parts), soil-water and terrain-travel fixture errors, vocabulary expectations, weather-soil-resume accounting, and observer-play timing. See docs/history/pinned-e18-failure-check.json and pinned-weather-performance-check.json. The integrated observer check subsequently passed alone at 500 ms against its unchanged 500 ms ceiling; the full-run failure at 529 ms remains evidence of marginal performance, not a green gate.

The stale canonical-source failure entry was removed because its test now passes; a focused runner receipt verifies pass with no stale entry: docs/test-runs/repository-consolidation-canonical-fixed-2026-10-18.json. No new failures were added to the known-failure ledger. A full rerun after that classification-only change was not performed.

Focused merge checks, canonical audit, public-export byte parity, Python syntax and package-inventory regression passed. The parity suite rewrote its historical fixed-path report; its original committed bytes were restored and new suite logs remain in the new run's artifacts. Historical failure budgets and assertions were not weakened. No new browser/visual/100-day acceptance or release is claimed.
