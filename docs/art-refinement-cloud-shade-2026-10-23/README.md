# Rain-front cloud shade candidate — October 23

Four retained, authored 64×32 overhead opacity masks now paint the existing regional rainfall fronts. Observed planetary wind moves their world-anchored presentation. This is a rainfall-derived lighting proxy, not a simulated cloud inventory. Nearest-owned-cell sampling at regional edges is a presentation limitation.

The source master, exact generation prompt, native masks, deterministic preparation and rejected prototypes remain in `assets/art/production-review/cloud-shade-v1/`. Native format 2 uses neutral black opacity; it cannot brighten dark terrain or introduce a colored veil. The compositor retains two bounded viewport buffers, avoids per-frame scaling and respects the existing surface, immersion and visibility policy guards. No weather, biological, resource, persistence or RNG authority changes. Shared renderer source was not independently edited.

## Actual runtime evidence

`rainiest-before.png` / `rainiest-after.png` show the same real generated cold front at ordinary 2× zoom. `motion-0..2.png` show three presentation phases, and `low-detail.png` the reduced layout. `receipt.json` records exact complete canonical graph equality across original/current draws and drift, with no browser errors. The HTTP-only inspection swap and fixed paint clock are recorded in the review tool; normal terrain refresh work was drained before timing. Observer relocation is explicit and changes no weather.

The separate `live-walking/` run uses the uninterrupted application loop, public Enter onboarding and held WASD, with no actor relocation or clock replacement. The actual creature moved 3.822 tiles over 19 ticks, with ordinary energy/hydration changes and zero browser errors. Cloud shade was visible in 43 of 66 measured frames. Maximum measured cloud call was 11.6 ms; cached calls were usually below timer resolution. This proves input and rendering coexist, not GPU frame pacing.

Earlier warm-rain and dry receipts are retained under explicitly labeled folders. They precede the conditional canvas-allocation optimization and latest water-cache integration; they establish naturally varied rainfall and dry absence, not final-version performance. Failed resumed-RAF and misaligned observer captures remain in the raw archive and are not selected proof.

## Validation and limits

All 14 checks in `final-checks.json` passed. Canonical source audit has no errors; public-export passed. No tests, population targets or budgets were weakened. Latest concurrent main through `2149a32` was merged; its water-cache gains are not attributed to cloud art.

Latest paused CPU draw means (milliseconds; GPU completion excluded):

| Site | Before | After | Delta |
| --- | ---: | ---: | ---: |
| rainiest | 7.361 | 7.469 | +0.108 |
| leastRain | 7.472 | 8.145 | +0.673 |

These paired draws exclude GPU completion and are not a full performance acceptance claim. Cloud rebuilding still has a measurable live cost. Whole-game biome/action art completion and creator acceptance remain open. This packet is a reviewable candidate.
