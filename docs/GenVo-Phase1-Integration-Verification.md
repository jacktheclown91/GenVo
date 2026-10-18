# Phase 1 — combat + locomotion integration verification (October 15, 2026)

**Status: build verified, not creator accepted.** Everything below is uncommitted, on top of `d2f676c`. The working tree was snapshotted before this phase; the patch and untracked archive were verified reversible.

## What was run

`tools/capture-integrated-gameplay.cjs` (new) drives real headless Chromium with the game's own rAF loop. Canvas clips are recorded in-page with `captureStream(60)`, giving about 50 fps real capture where Playwright's page video gives 25. Each clip carries rAF frame-time statistics.

- **Controlled demos**, each labelled in `capture.json` with exactly what was staged:
  - five gait families walking with real keyboard input;
  - a paddle swimmer and a blocked non-swimmer at a shore;
  - a braced charge (heavy plated body);
  - a club-tail repel, a shell bitten from behind, and a prey bite and miss.

  Legal bodies are mounted through the canonical `applyLineageTarget` path. Hits and misses are forced with `rng.chance` only where named; damage, repel and reactions come from the real authorities.
- **Natural session:** a fresh world with nothing staged, opening grace ended, and keyboard wandering at normal time.

Outputs: `docs/integrated-gameplay/800x600/`, `1440x900/`, `1440x900-norecord/`. Each holds clips (`.webm`), end screenshots, `capture.json`, plus `800x600/consecutive-frames-native.png`. About 32 MB per recorded viewport; the long natural clip dominates.

## Results

| Check | 800×600 | 1440×900 |
| --- | --- | --- |
| Page errors / console errors | 0 / 0 | 0 / 0 |
| Controlled clips fps (no recording) | — | 46–58 |
| Controlled clips fps (recording) | 49–59 | 32–57 (VP9 encoding cost) |
| p95 frame time | 16.8 ms (33 ms at combat onset) | 16.8–33 ms |
| Reaction kinds produced | stagger, brace-frontal, armor-absorb, organ-recoil, club, retreat-cowed, shell-turn, prey-bitten, prey-dodge | same |
| Natural session | 45 s, 56 fps, **no encounters** | 20–30 s, 55 fps, no encounters |

- **Hitches.** Isolated 83–300 ms frames occur while walking at fullscreen. **The same measurement on an untouched HEAD copy shows the same hitches** (83–300 ms) and the same fps, so they are pre-existing and not caused by this work. Terrain chunk-texture builds as the camera crosses chunks are the likely cause, consistent with the documented doubled chunk-texture memory. Not investigated further here.
- **Swimming in gameplay.** The non-swimmer stops at the shore with real input; the webbed + paddle body swims out.
- **Fullscreen readability.** Creatures stay at the fixed 2× zoom, so at 1440×900 they occupy a much smaller share of the screen. Reaction readability there is lower than at 800×600.
- **Natural play.** Combat reactions are rare in ordinary early play: none occurred in 45 s of wandering. Their value depends on encounters actually happening, a Phase 4 engagement question rather than a defect.

## Gait cadence investigation

The shipped cadence comes from stride length, not speed. One full gait cycle covers `gaitTravelFor` ≈ 4.6 × limb scale sprite px: about 0.33 tile, or about 0.4 of the ~14 px body length. Real small quadrupeds at comparable relative speed cover roughly 1–2 body lengths per stride cycle.

`GAIT_REVIEW.strideScale` (new, default **1**, so shipped behaviour is unchanged) scales stride length uniformly for review only. Pose stance sweep and renderer gait phase share it, so feet stay planted. Drift is ≤7×10⁻¹⁵ at 1×, 1.5× and 2×; maximum root-to-foot extension grows modestly (runner 7.2 → 7.9 → 8.6 px).

`tools/capture-gait-cadence-comparison.cjs` recorded walker, heavy and runner at each scale in real Chromium (`docs/gait-cadence-comparison/`, with `strip-native.png`). Gait cycles per second:

| Body | 1× (shipped) | 1.5× | 2× |
| --- | --- | --- | --- |
| Walker (2.2 tiles/s) | 6.9 | 4.5 | 3.5 |
| Heavy (2.1 tiles/s) | 8.3 | 5.5 | 4.2 |
| Runner (2.4 tiles/s) | 5.8 | 3.9 | 2.9 |

The anatomy ordering is preserved at every scale. **Proposal for creator review:** 1.5×, which brings heavy to about 5.5 Hz and the walker to about 4.5 Hz, longer visible strides with feet still planted. Not applied. Compare the clips in `docs/gait-cadence-comparison/` before deciding.

## Defects found

None in the integrated combat and locomotion code. The only problems found during this phase were in my own capture tooling (ffmpeg frame duplication on variable-rate WebM; an idle-input harness), and both were corrected.

## Remains unproven

- How the motion feels to a person at 60 fps.
- Unfamiliar-player comprehension of reactions.
- Natural encounter frequency over a longer session.
