# Seed metadata copying: measured restore optimization

Canonical codec change. Mature whole-world checkpoint/continuation parity passes. Full fast gate: 454 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred of 470 in 224 seconds, no input drift. Receipt: ../test-runs/metadata-copy-integration-2026-10-19.json. No biological coefficient, quantity, variant, RNG, clock or save-format change is intended or accepted without parity evidence.

## Measured bottleneck

The isolated day-60 restore CPU profile records about 2.58 seconds of wall time. Seed-bank unpacking accounts for about 1.38 seconds of inclusive sampled time; metadata copying accounts for about 0.66 seconds. Inclusive samples overlap, and profiler stop overhead is outside useful restore work; do not sum the rows or treat them as frame timings. Input decoding is outside capture and the generated-base cache initially cold.

Receipt: mature-restore-day60-cpu-2026-10-19.json; reproducer: tools/profile-mature-restore.mjs. The raw profile is local/ignored in docs/test-runs/artifacts/. Its original codec line numbers refer to the frozen pre-change source below, not the now-expanded current file.

## Change and compatibility

copyMetadata now copies validated plain arrays/objects directly with per-value memoization, preserving internal aliases, sparse arrays, own undefined, property order and safe __proto__ keys. Each copy call owns independent mutable data. Native structuredClone remains the fallback for historically accepted non-plain array-extension values; rejection of uncloneable extensions remains intact. The old fingerprint/packing grammar is unchanged, including its handling of array extension keys. This optimization does not redefine that grammar or silently discard fields.

Frozen comparison source: flora-seed-codec-before-metadata-copy.txt, SHA256 6290803b5bca29ab1c397c506660f55e069f459fd7c3c0fd983a4ffa813802b0. It is essential reference evidence, not another runtime authority. Staged helper/benchmark tools in tools/experiments/ are not imported by gameplay. The benchmark asserts that its helper body matches canonical code.

## Evidence so far

- tests/flora-seed-metadata-copy.mjs compares the complete old/new packed and decoded tables, tiny Float64 quantities, internal aliases, independent records, sparse arrays, prototype-key safety, historical native extensions and unsupported-value rejection.
- mature-metadata-copy-canonical-2026-10-19.json alternates before/after/after/before on the actual day-60 active-region bank: mean decode 1,427.83 ms before versus 842.71 ms after (about 41% less). Every decoded bank and the whole re-encoded table match exactly. Explicit GC is outside timing. The earlier staged receipt is retained with its earlier candidate hash; the current receipt includes the compatibility fallback.
- metadata-copy-regional-world-parity-2026-10-19.json compares a real young three-region checkpoint. Complete restored state and the next full canonical day match exactly. Restore means are about 116.95 versus 113.06 ms; this small young-world difference is not the mature-bank result.

The actual mature day-60 checkpoint passes the same complete restore and next-day comparison: metadata-copy-mature-world-parity-2026-10-19.json. Only the reference codec differs inside otherwise identical restore authorities; transport buffers are independent. All active and two archived regional state match exactly. Alternating restore means are 2,348.53 ms before versus 1,880.02 ms after (about 20% less for this checkpoint). The two-world parity harness was observed around 8.6 GB resident memory; no memory improvement or browser frame result is inferred. The young-world timing ranges overlap, so its small mean difference does not establish a speed improvement.

## Limits

This is not a solution for 16-second mature regional jobs, growing save sizes, resident memory or browser responsiveness. No cohorts were pruned or rare amounts clipped. New-world finite digging/carcass rules and historical policies remain unchanged. Mature regional execution, archive transport cost, long-run finite-rule ecology, browser performance and creator play acceptance remain open. The unchanged observer timing test passes in the full gate. The known failures/deferred suites and the distinct performance/biology acceptance requirements remain open.
