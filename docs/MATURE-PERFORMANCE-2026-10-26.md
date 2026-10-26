# Mature-world performance investigation — in progress

Baseline source: `8723b98535c5e554235cb798a2788836f6780f5b`, whose 119-check exact-head CI [40385691926](https://github.com/jacktheclown91/GenVo/actions/runs/40385691926) succeeded. The performance checkpoint has targeted automated and real browser evidence below; full 121-check exact-head CI remains pending. Creator acceptance is not claimed.

## Implemented candidate

CPU profiles of the immutable established and mature valley checkpoints identified vegetation and botanical inheritance as expensive work. `botanicalGamete` now avoids calculating its pure segregation hash when `Object.is` establishes that either chromosome choice returns precisely the same allele. Heterozygous choices and mutation processing retain their original keys, order and calculations. No RNG draw, saved state, biological equation, ecological detail or execution budget changes.

The independent original-function oracle covers 4,160 exact cases, including mutation on/off, mixed inheritance, inherited traits, mutable inputs and signed zero. Node 22 and 24 pass. The actual mature checkpoint contains 455,319 indistinguishable choices among 508,573 allele choices (89.53%). A separate controlled factory benchmark has median 66.25 ms before and 29.55 ms after for 20,000 calls: this measures the pure function, not whole-game speed.

## Unprofiled simulation measurements

Three fresh processes per version and checkpoint, alternating version order, Node 24.14.0 with `--expose-gc`, 96 actual canonical ticks each. Checkpoints are integrity-checked against the existing scenario catalog and preserve their original six-second clock. Figures below are medians across the three runs, in milliseconds.

| Checkpoint | Version | Total ticks | Median tick | P95 tick | P99 / worst tick |
|---|---|---:|---:|---:|---:|
| Day 31 | Original | 2828.11 | 1.066 | 42.450 | 1112.939 |
| Day 31 | Candidate | 2718.78 | 1.132 | 47.611 | 1040.263 |
| Day 101 | Original | 3857.17 | 1.658 | 69.011 | 1320.511 |
| Day 101 | Candidate | 3663.89 | 1.648 | 69.520 | 1254.627 |

Total tick time improves approximately 3.9% and 5.0%; worst ticks improve approximately 6.5% and 5.0%. Median/P95 do not consistently improve. With only 96 samples, empirical P99 equals the maximum: this is limited tail evidence, not a robust frame-rate claim. Raw reports: ignored `reports/engineering-D-v2-{day30|day100}-{baseline|candidate}-{0|1|2}.json`; reproduce with `tools/measure-mature-workload.mjs` against preserved original and candidate source trees.

All six complete canonical state signatures per checkpoint agree, including RNG, animals, resources and saved controller state. Independent before/after V8 snapshots also pass deep strict comparison. Raw V8 byte encodings are deliberately separate: repeated unchanged-source encoding can differ in internal representation, so byte hashes are not a biological equality test. The diagnostic signature helper has order, alias, cycle, numeric-storage and typed-view regression tests; it is not a new game save format.

## Separate allocation samples

V8 sampled allocation estimates include collected objects and are not an exact byte ledger. These instrumented runs are excluded from throughput measurements.

| Checkpoint | Original sampled bytes | Candidate sampled bytes | Original retained heap after ticks | Candidate retained heap after ticks |
|---|---:|---:|---:|---:|
| Day 31 | 2,055,804,008 | 1,979,908,608 | 282,236,032 | 282,070,152 |
| Day 101 | 2,579,765,992 | 2,510,912,112 | 720,588,128 | 720,449,360 |

Allocation estimates decline by about 3.7% and 2.7%; retained heap is effectively unchanged. Legitimate growth during two ecological days is not by itself a leak. Sampled runs produce the same complete state signatures as unprofiled runs.

## Browser and remaining acceptance

`tools/measure-mature-browser.mjs` forks the actual bundled checkpoint through New World, advances opening cards through native controls, enables native AUTO, and observes the real requestAnimationFrame loop. It does not invoke simulation updates, inject resources, move animals, change policies or force unpausing. It records frame distributions, long tasks, actual progress and blocking state, garbage-collected heap metrics, a real IndexedDB save, and one runtime screenshot. Tutorial completion is dismissed only through its native continue button and recorded.

The ten-second Day 31 smoke run advanced tick 1451 to 1523 with AUTO active and no blocking modal; actual IndexedDB save succeeded in 568.9 ms. Its inspected screenshot shows the live ecosystem, player HUD and water tutorial marker. This only validates the harness. Headless Chromium results are distinct from Windows GPU responsiveness and creator visual acceptance.

The first paired 180-second Day 31 observations naturally reached three newborns and the native inheritance modal around the last 40 seconds. Both paused there; their idle frames must not be presented as continuous active gameplay. Those receipts are retained as pilot observations. `--continue-births` explicitly clicks the native **Raise them** button and records it without altering inherited anatomy or choices.

The final Day 31 pair used that option, remained at native 1x and reached tick 2728 / Day 57 with 248 living animals, AUTO active, tutorial complete and world unpaused. Each dismissed **Raise them** at the 135-second check and native tutorial completion at the 145-second check. Both had 33.3 ms median, approximately 50 ms P95 and 100 ms P99; worst frames were 1183.3 ms original and 1149.9 ms candidate. Long tasks were 114.7/minute original and 117.8/minute candidate. Actual end saves succeeded in 1228.8 ms and 1214.0 ms. Forced-GC heap went from approximately 128.5 MB to 256.4 MB in each. No page errors occurred; the candidate's live screenshot was inspected after the newborn screen and tutorial. These observations likewise show no consistent browser responsiveness improvement.

Both Day 101 observations remained unpaused and active for 180 seconds, progressing to Day 127 (original tick 4818–6096; candidate 4818–6077). Each frame distribution includes real updates, rendering and routine saves. The original and candidate both had 50 ms median, 66.8 ms P95 and 183.4 ms P99. Worst frames were 2083.2 ms original and 2149.8 ms candidate. End-of-run IndexedDB saves succeeded in 2571.3 ms and 2507.6 ms respectively. No page errors occurred. The original's runtime screenshot was inspected and shows the active mature ecosystem and HUD. These single paired runs establish continued real browser operation, **not a demonstrated browser responsiveness improvement**. Major stalls remain despite the focused simulation improvement.

Day 101 long tasks occurred at 387.6/minute original and 378.4/minute candidate, normalized by actual observed wall time (blocking work can extend a requested wait). Forced-GC browser heap grew from 339.5 MB to 454.2 MB original, and 339.3 MB to 451.3 MB candidate, across roughly 26 ecological days and actual saves. Different native frame admission produces slightly different ending ticks; these memory observations are not same-state leak comparisons or proof of indefinite stability. Fixed-tick Node state comparisons provide the behavioral equivalence evidence.

## Mature regional work

For each original Day 31 and Day 101 checkpoint, the diagnostic placed the unchanged traveler at eligible borders and used the existing authority to cross east twice. The original region and its neighbor remain archived canonical biological populations. No creature, resource, age, anatomy or saved policy was edited; border placement makes this explicitly controlled performance evidence, not natural evolution evidence.

After 96 actual ticks in the third region, both archives advanced with maximum sampled debt six ticks, ending one existing stride behind active time. Ledger validation passes. Original/candidate complete snapshot graphs pass deep strict comparison for both scenarios; their RNG and canonical signatures match. This covers mature archived ecosystems, actual transfer, offscreen physiology/decisions, publication and bounded backlog; the newly entered foreground regions are newly generated, not falsely labelled mature populations.

| Archived checkpoint | Version | 96 tick total | P95 tick | Worst tick | First / second transfer |
|---|---|---:|---:|---:|---:|
| Day 31 | Original | 17511.6 ms | 898.0 ms | 2458.6 ms | 321.3 / 127.2 ms |
| Day 31 | Candidate | 17601.8 ms | 856.5 ms | 2476.6 ms | 394.7 / 133.0 ms |
| Day 101 | Original | 47406.2 ms | 2760.2 ms | 5645.7 ms | 1462.2 / 135.1 ms |
| Day 101 | Candidate | 47275.9 ms | 2710.3 ms | 5728.4 ms | 1447.2 / 134.5 ms |

These single paired samples demonstrate no consistent regional speed gain. Regional replay/capture remains an expensive follow-up; no budget is enlarged and no ecology is omitted to conceal it. Earlier phase/CPU profiles include perception and decision phases separately from vegetation. Raw regional receipts and full snapshots are under ignored `reports/engineering-D-regions-*`; reproduce with `tools/measure-mature-regions.mjs`.

Still required: targeted integration and complete exact-head CI; a coherent checkpoint and current handoff. Natural multigenerational investigation and a separately named, extracted release candidate remain later stages of the engineering assignment. The published release and stable ZIP are preserved.
