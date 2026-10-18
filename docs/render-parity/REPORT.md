# Render cost under movement parity (October 16, 2026)

Nothing is committed. These are automated Chromium measurements on this machine (NVIDIA RTX 3050, Windows, D3D11); they are not visual or gameplay acceptance. Evidence is in `docs/render-parity/evidence/`, with full copies in `../genvo-review-artifacts/2026-10-16/render-parity/`.

## Findings

1. **Earlier headless frame measurements did not use the GPU.** By default, headless Chromium renders through SwiftShader, a software GPU (`ANGLE … SwiftShader driver`). That applies to every `profile-population-frames` and playtest number from Phase 3H to 3K. A headed window, as a player would use, renders through the real GPU, and was about 4× slower:

   | Mode (day 20, 187 animals, parity on) | Render p50 | Frame p50 |
   | --- | --- | --- |
   | Headless, software (the old default) | 24.3 ms | 33.4 ms |
   | Headless, `--enable-gpu --use-angle=d3d11` | 134 ms | 150 ms |
   | Headed Chromium, GPU | 98–105 ms | 107 ms |

   The frame profiler now accepts `GPU=1` (real GPU, headless) and `HEADED=1` (a visible window).

2. **The cost was copying each freshly drawn creature onto the page, not drawing it.** I timed each step inside `drawGenvoSprite` with temporary counters, since removed. Headed GPU at day 20, about 29 freshly drawn creatures per frame:
   - final copy onto the page: 83.5 ms per frame (about 2.9 ms per creature);
   - body: 6.8 ms;
   - outline: 1.5 ms;
   - cached-sprite draws: 0.02 ms.

   In software rendering the same copy took 1 ms. Every creature was painted into one shared canvas and copied onto the page from it. On a GPU, each copy of a just-repainted canvas waits for the previous upload. This is the slowdown the v1.57.3 comments describe ("creature drawing took 35 ms a frame on the creator's machine").

3. **Movement parity made this much worse:**
   - Moving creatures near the player: 26 → 42.
   - A walking creature's pose varies by 32 phases per stride × direction × head turn.
   - In 4 seconds, 3,483 of 3,483 sampled cache misses were new keys; none was drawn twice.
   - Caching these poses therefore only paid a bitmap upload each (on a GPU, 226 against 76 ms of render per frame at day 120) and evicted reusable resting poses.
   - Sprites can't be shared between animals: all 90 sampled animals had distinct appearances, since palettes come from genes.

## Changes (`src/render/genvo-draw.js`; switches in `src/main.js`)

Both changes leave pixels unchanged. The render pixel-parity tool shows 24 of 24 identical frames between the old and new paths (`QUERY_A="?scratchPool=1&spriteCacheMoving=1"`, 80 days). Those frames are paused, so walking poses aren't covered; not caching them is identical by construction, because it is the same drawing, just not stored.

1. **Finished-sprite canvas pool** (`SPRITE_CACHE.scratchPool`, default 256, capped at 32 MB of canvas memory; `?scratchPool=1` restores the single canvas). Headed GPU, day 20, render p50 by pool size:

   | Pool | 1 | 16 | 64 | 128 | 256 |
   | --- | --- | --- | --- | --- | --- |
   | Render p50 | 103 ms | 36.5 ms | 29 ms | 28.9 ms | 20.8 ms |

2. **Walking poses are drawn directly, not cached** (`SPRITE_CACHE.skipMoving`; `?spriteCacheMoving=1` restores caching).

I also tried two things and removed them, because neither made a measurable difference:
- least-recently-used eviction (render p50 72 against 76 ms);
- GPU-backed scratch canvases (110 against 117 ms).

The diagnostic counters remain (`SPRITE_STATS`: one increment per sprite draw). The frame profiler reports them as `sprites`, along with the creatures near and moving near the player.

## Results (day 120, 321 animals with parity, 277 without, 1600×900)

| Configuration | Headed GPU render p50 / p95 | Frame p50 |
| --- | --- | --- |
| Parity on, old rendering | 231 / 303 ms | 240 ms |
| **Parity on, new rendering** | **75.7 / 140 ms** | **93 ms** |
| Parity off, old rendering | 147 / 202 ms | 160 ms |
| Parity off, new rendering | 85.6 / 222 ms | 93 ms |

Software headless, parity on: frame p50 66.7 ms with old and new rendering alike. Render p50 is 42.9 (old) against 50.5 ms (new), within this setting's run-to-run spread of 34–49 ms.

With the new rendering, movement parity no longer costs extra render time. The game is still slow on the GPU path (about 11 fps at day 120).

## What remains

At day 120, copying about 64 freshly drawn walking creatures per frame onto the page is still about 46% of time on the GPU. The remaining options change either the renderer's structure or what is seen:
- **Two-pass frame atlas.** Draw every fresh creature into one canvas first, then copy them all from it, so there is one upload per frame. The renderer would have to prepare creature poses before its draw loop. Pixels unchanged.
- **Coarser walk phases for small or distant wildlife,** for example 8 instead of 32 per stride (the granularity before v1.59). Fewer distinct poses would let the cache work again. The walk would look choppier; that is your call.

## Verification

Fast tier: 372 pass, 5 known failures, 0 new (`docs/test-runs/fast-render-parity-2026-10-16.json`). No page errors in any Chromium run.
