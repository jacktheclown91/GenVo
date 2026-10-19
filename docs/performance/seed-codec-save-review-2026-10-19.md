# Day-100 save and codec review

The default GENVO8-TEST-A autonomous world completed 100 days with 408,966 seed cohorts. Its unoptimized day-100 save passes exact complete-state roundtrip and a full day of continuation against the uninterrupted world. Retained baseline receipt: ../first-100-days/2026-10-19/day100-save-receipt.json.

## Measured cost

The raw Node V8 checkpoint is 88,692,169 bytes (88.7 MB). Seed columns account for about 37.0 MB, registered flora genomes 11.8 MB and botanical state 16.1 MB. These component sizes are separately serialized diagnostics, not additive accounting of shared references. The initial full snapshot construction took 3.60 seconds and restore 4.87 seconds. Node V8 bytes/timing do not establish browser IndexedDB storage size or responsiveness.

The optimized codec skips redundant cloning of immutable primitives, interns strings directly rather than re-escaping them repeatedly, and uses native JSON for dense string-only field-order keys. Mutable arrays and objects still receive independent copies. Live ecological Maps, cohort identities, positive rare quantities and ancestry are not changed. The existing Float64 column schema and logical packed table remain unchanged; no biological/save-rule migration is required.

| Same checkpoint, alternating codec diagnostic | Before mean | After mean |
|---|---:|---:|
| Seed-table encoding | 3.282 s | 2.012 s |
| Seed-table decoding | 3.722 s | 1.903 s |

Encoding took 38.7% less time and decoding 48.9% less in the four-run before/after/after/before diagnostic. A separate single ordered complete-restore comparison measured 5.50 versus 2.88 seconds; treat that pair as illustrative, not an alternating benchmark. All codec runs preserve the exact packed table and decoded cohort records. The complete old/new restored worlds match and continue identically for a real full day, ending at calendar day 102. Detailed receipt: seed-codec-mature-benchmark-2026-10-19.json.

## Verification and provenance

- tests/flora-seed-codec-reference-parity.mjs compares 8,000 cohorts with the SHA-locked pre-change codec, including field ordering, null versus undefined, negative zero, smallest positive Float64 amounts, historical/new bidirectional compatibility, corruption rejection and independent mutable metadata.
- Existing flora-seed-codec and save-persistence checks pass; a two-day smoke of the new horizon-save tool also passes exact full-state roundtrip/continuation.
- The day-100 checkpoint is intentionally ignored, indexed by size/hash in ../LOCAL-CHECKPOINT-MANIFEST.json and retained locally. A clone alone cannot repeat the mature checkpoint benchmark without that file; the tool can regenerate a horizon checkpoint into a fresh folder.
- Reproduce: node --expose-gc tools/check-development-100-save.mjs --out FRESH_LOCAL_ARTIFACT_FOLDER. Then node --max-old-space-size=4096 --expose-gc tools/benchmark-seed-codec.mjs SNAPSHOT_BIN FRESH_RECEIPT_JSON.
- Each comparison world receives an independent copy of binary input. The historical false-positive comparisons and their shared-groundwater-buffer cause are explained in history/README.md; they are not treated as product failures. Large comparisons now use bounded diagnostics rather than dumping whole mature worlds.

## Limits

This does not solve live cohort-memory growth, change ecological outcomes, remove rare variants, bound populations or demonstrate planetary-scale saves. The source checkpoint remains about 88.7 MB; no meaningful file-size reduction is claimed. Browser autosave timing, opt-in planetary day-100 persistence and player acceptance still need direct evidence. Full integration: 444 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (460 suites, 226 seconds, no input drift). The observer timing gate passed unchanged. Receipt: ../test-runs/seed-codec-integration-2026-10-19.json.
