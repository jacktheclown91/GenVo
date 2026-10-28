# Regional replay and save snapshot cost — October 28, 2026

Performance-only. No biological rule, RNG draw or saved simulation field changes. The flora seed table's storage encoding changes from seed columns `/1` to `/2`, and `/1` saves and bundled scenarios still load. Creator acceptance and native GPU behaviour are not claimed.

## Measured cause (Day 100 catalogue world, Node 24.14.0)

A controlled two-hop crossing followed by 96 canonical ticks took about 51 s. A CPU profile attributes about 85% of it to snapshot work, not archived ecology:

| Cost | Time |
|---|---:|
| `structuredClone` | 18.3 s |
| Capture, almost all flora seed packing | 14.8 s |
| Garbage collection | 12.9 s |
| Restore | 4.5 s |

Each 6-tick stride of each archived region publishes `structuredClone(createSimulationSnapshot(warmSim))`. Removing one part at a time from a Day 100 snapshot shows flora state is 97% of its clone: 1,255 ms in total, 35 ms with flora removed. 920,000 of its 1.23 million objects are deep-frozen flora genomes and gametes.

## Changes

- **Seed columns `/2`** (`flora-seed-codec.js`). This uses the same rows, field orders and decoded records as `/1`, but stores typed per-field columns:
  - finite numbers in a `Float64Array`;
  - strings by dictionary index;
  - null, undefined and booleans as tags;
  - plain arrays of finite numbers or of strings in flat typed arrays.
  
  Every other value keeps the `/1` dictionary, with its copying and validation. `packFloraSeedBanks` (`/1`) is unchanged, and the decoder reads both. Saves and regional checkpoints write `/2`.
- **Warm regional publication** (`snapshot-copy.js`, `planetary-offscreen-biology.js`). The checkpoint a warm region publishes is copied with `structuredClone` semantics, except for two kinds of object:
  - **Deep-frozen objects are shared.** These are frozen plain objects or arrays whose own properties are all enumerable data values, recursively, with no symbol keys. They can't change, so sharing is equivalent to copying.
  - **The just-packed seed table passes through.** It was built by the same capture with copied metadata, so nothing else holds it.

  Frozen cycles, shallow-frozen objects, accessors, holes, class instances, DataViews and typed arrays sharing a buffer all fall back to a whole-value `structuredClone`.

## Evidence

- **Codec exactness:**
  - On the real Day 100 banks (860,000 cohorts), `/2` decodes deep-strictly equal to `/1` and to the live banks, including after a structured clone.
  - `tests/flora-seed-columns-2.mjs` covers every value shape (−0, subnormals, empty, mixed and nested arrays, extended and sparse arrays, own `__proto__`), field order and ownership transfer. It also covers non-finite rejection identical to `/1`, eleven corrupt-table rejections that leave the input unchanged, and an unknown codec tag.
  - `tests/flora-seed-codec.mjs` now expects saves to write `/2`. It also checks that a `/1` encoding of the same world restores identically.
- **Codec cost** (median of 5):

| Day 100 seed banks | `/1` | `/2` |
|---|---:|---:|
| Pack | 1,018 ms | 752 ms |
| Clone | 305 ms | 79 ms |
| Unpack | 612 ms | 464 ms |

  Serialized size grows from 94 MB to 114 MB.
- **Copy exactness:** on a Day 100 snapshot the copy has the same complete signature (order and aliases) as `structuredClone` and is deep-strictly equal. It is unchanged after 60 further live ticks, and restored continuation is identical. The copy takes 360 ms against 945 ms for `structuredClone`. `tests/snapshot-copy.mjs` covers sharing, every fallback shape, independence and a real simulation.
- **Frozen fixtures:** `tests/modernization-baseline.mjs`, `tests/autonomous-evolution-v1/v2-compatibility.mjs`, `tests/autonomous-policy-compatibility.mjs` and `tests/interleaved-day-clock.mjs` compare against complete-snapshot signatures recorded from untouched historical source. These now pass `tools/canonical-seed-tables.mjs` first, which re-encodes `/2` tables with the unchanged `/1` packer. That packer is proven byte-identical to the frozen historical packer by `tests/flora-seed-metadata-copy.mjs`. Every cohort and value is still compared exactly, and no fixture was regenerated. All five pass on Node 22.23.4 and 24.14.0.
- **Regional parity:** the controlled Day 100 two-hop scenario with 96 ticks was run on current `main` `0cfa3ff0` and on this change, with seed tables decoded before signing.
  - Of 60,720 subtree signatures (to depth 5), only the sessions-array container differs.
  - With each session copied separately, the candidate's complete signature equals the baseline's (`7e07b6ec…`).
  - The two sessions now share exactly 2 objects, both deep-frozen. Two regions can hold the same process-cached genome objects, and deep copies previously hid that.
  - Indexed planetary saves store each region as its own IndexedDB record, so that sharing never reaches disk.
- **Regional timing** (single runs, same machine):

| 96 mature regional ticks | `main` `0cfa3ff0` | This change |
|---|---:|---:|
| Total | 51.3 s | 29.6 s |
| p95 tick | 3.1 s | 1.5 s |
| Worst tick | 5.8 s | 4.8 s |

- **Save cost** (Day 100, median of 5): capture plus structured clone, the synchronous main-thread part of an IndexedDB save, is 2,225 ms on `main` and 1,757 ms with this change (−21%).
- **Integration:** the full local playable gate passes 145 of 145. That is the prior 143, plus `flora-seed-columns-2` and `snapshot-copy`; no budget or assertion was relaxed. The architecture gate and its adversarial test, the canonical source audit and the public export pass. Every regional, offscreen and flora suite listed in `tools/check-playable.mjs` passes.

## Pre-existing ungated failures

`tests/dietary-scan-parity.mjs`, `tests/restore-deferred-flora.mjs` and `tests/world-restore-base-cache.mjs` are not in the playable gate. They fail identically on untouched `main` `0cfa3ff0`, before this change. `dietary-scan-parity` shows a genuine biological divergence from its historical reference controller, and the other two feed current snapshots to frozen historical restore code. They are unchanged here and remain listed for separate repair.

## Remaining

- Regional replay is still slower than real time on mature worlds. Each stride still captures the full region (seed packing about 750 ms), and each archived region runs its daily vegetation pass atomically.
- Saves still clone the flora genome registry and botanical records: about 700 ms on Day 100.
- Next candidates:
  - a versioned genome-table encoding for saves, which must rebuild genome sharing exactly, including animals' cargo and meal references;
  - resumable archived-region strides, so daily regional work can spread across frames like the active region's ticks.
