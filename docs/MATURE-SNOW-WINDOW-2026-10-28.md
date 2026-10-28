# Mature-world snow-window retention

This focused performance correction preserves the native artwork and biological state. The wider ecological-motivation objective remains active; this is not completion of regional recognition or full-game acceptance.

## Measured defect

A real preserved Day 321 world, with 147 living organisms and recorded `autonomous-evolution/1`, was imported through the actual recorded-world menu. Native requestAnimationFrame, retained AUTO, normal controls, existing saves and ordinary biological updates ran for one minute. No organisms, resources, preferences, anatomy or RNG were injected. Only pause state was changed for setup.

Direct component timing reproduced a 524 ms renderer call coinciding with a 540 ms browser long task. Snow-window calls repeatedly took 174–209 ms. Direct timing rejected an earlier hydrology hypothesis: all 15 hydrology rebuilds totaled about 269 ms over the entire minute. CPU sample counts alone were not a sufficient optimization target.

The snow cache's capacity already matched the visible window. However, on a reverse row-major scan, inserting a newly visible cell could evict the next still-visible cell. That miss could cascade across the window. Rightward scans can already discard outgoing cells in a safe LRU order; the defect does not imply every camera movement is inefficient.

`beginSnowWindow` now accepts the actual clipped integer bounds and releases off-screen entries before inserting any new strip. The intersection remains warm. Capacity remains bounded by the actual visible window, worlds remain weakly owned, and changing world, snow cover or water mask still invalidates the relevant artwork. There is no larger cache, predictive terrain, skipped ecology, altered snowpack or new weather authority. Existing numeric-capacity callers retain their interface.

## Pixel and state proof

The untouched published painter was read from Git commit `04c9a41524667481b0ae625d892abc5abcf29770`. Its sole import relocation lets the browser use the same unchanged snow-cover authority. A real saved world supplied all physical data.

Six wide 46×30 windows and six dense 4×4 windows produced zero changed RGBA bytes between the original and candidate. The dense crop was found in actual stored snow, not generated or edited for the test. On the leftward return, the original rebuilt 16 textures and the candidate rebuilt four. Both drew the same image; repeated stable windows rebuilt nothing. The complete canonical snapshot graph before and after all painting was identical.

The wide sparse-edge case required image parity, not an invented speedup: some movements already rebuilt only the entering strip. Earlier proof attempts incorrectly required improvement on the initial rightward scan. Their failed diagnostics are retained; the final proof explicitly exercises the reverse-scan defect while preserving every wide-window image assertion. A separate initial harness failed to reach the visible pause control and is not product or performance evidence.

Node 22 and 24 tests retain the original dense-window, clipping, physical melt, regional-coordinate and state-purity assertions, and add horizontal, reverse, vertical, diagonal, shrinking, empty and invalid windows. The assertion fixture initially attempted to clone a function; its data copy was corrected without weakening production or test criteria.

## Native timing

| Native run | Frame p99 | Total snow-paint time | Slowest snow call |
| --- | ---: | ---: | ---: |
| Original diagnostic | 213.4 ms | 13,924.4 ms | 208.7 ms |
| Candidate | 66.7 ms | 8,572.6 ms | 23.0 ms |
| Original painter returned in browser | 213.4 ms | 14,713.0 ms | 480.9 ms |
| Portable-tool candidate repeat | 66.7 ms | 8,484.8 ms | 22.8 ms |

The return control changed only the browser response for the snow module to the untouched Git source; repository work was never reverted. Candidate and return-control instrumentation and input match, including initial tick 76800, RNG 796587876, 147 living bodies, controlled organism 109 and retained AUTO. The current renderer's clipped bounds remain in both, and their pixel contract is verified separately. All runs use visible Chromium at 1440×900 with CPU-profiler and timing overhead on this machine. They do not establish a universal device, GPU-completion or hosted-network benchmark.

Other spikes remain: the candidate's maximum frame gap was still 613.5 ms and its slowest overall renderer call was 343.1 ms. Logical tick counts after a wall-clock minute differ, so end-of-minute worlds are not asserted identical. The read-only painting proof and independent complete-state deterministic controls establish the biological boundary. This correction addresses one measured source of recurring stalls, not every performance problem.

The portable `tools/profile-mature-frame-loop.mjs` takes a fresh evidence directory and actual `.snapshot.v8`, with `--native` for a visible browser. `--reference-snow=<full-commit>` enables the explicit counterfactual response. It refuses a successful timing result if the world remains paused or ticks do not advance. `tools/verify-snow-window-browser.mjs` separately checks exact pixels and complete state using a fresh imported world. Neither reads a user's browser profile or autosave.

[Matched native observations](mature-snow-window-2026-10-28/native-performance.json), [all twelve exact pixel/state cases](mature-snow-window-2026-10-28/pixel-state.json), [original pixels](mature-snow-window-2026-10-28/reference-pan.png), [candidate pixels](mature-snow-window-2026-10-28/candidate-pan.png), [inspected native after-frame](mature-snow-window-2026-10-28/native-after.png) and [retained negative diagnostic recap](mature-snow-window-2026-10-28/retained-diagnostics.json) keep the evidence attributable. Raw profiles and unsuccessful captures remain in their original reports directories.

## Verification and continuation

The full maintained 140-check gate passes, retaining every check and budget. The changed syntax/Windows-aware whitespace, source/architecture and exact public export checks pass, as do original complete-state modernization controls on Node 22 and 24. This correction's exact-commit CI follows its coherent commit. The preceding regional-history checkpoint `04c9a415` passed all 140 local checks and exact-head CI 40577984474, including both workers and the required summary. Its pending-at-commit receipt remains unchanged.

Keep cross-region related-population references, temporal alignment of real ecological evidence and natural final-source fields as explicit unfinished recognition work. Do not activate recognition by default, fabricate missing unloaded evidence, lower thresholds or tune toward a species quota. Preserve the verified survival/home tutorial, original art/audio, Creature Lab and on-demand advanced scenarios. No published itch ZIP was replaced.
