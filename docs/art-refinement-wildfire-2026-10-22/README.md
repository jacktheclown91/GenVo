# Native overhead wildfire candidate

Artwork commit `078a855`, based on the isolated art candidate including canonical aquatic commit `47ea305`. This improves actual active-fire painting; it does not claim completion of every environmental effect or creator approval. Main and Claude's active files were not edited.

| Real canonical fire state | Before | After |
|---|---|---|
| Initial ignition, intensity 0.25 | [Gameplay](ignition-before-gameplay.png) | [Gameplay](ignition-after-gameplay.png) |
| Burning patch, tick 18 | [Gameplay](before-gameplay.png) | [Gameplay](after-gameplay.png) |
| Next phase, tick 21 | [Gameplay](before-phase-1.png) | [Gameplay](after-phase-1.png) |
| Next phase, tick 24 | [Gameplay](before-phase-2.png) | [Gameplay](after-phase-2.png) |
| Next phase, tick 27 | [Gameplay](before-phase-3.png) | [Gameplay](after-phase-3.png) |

All frames are actual 1000x750 gameplay at normal zoom 2. Real generated dry vegetation is ignited through `igniteWildfire`, followed by zero or twelve ordinary updates; subsequent phases advance three actual updates apiece. The player observation position is explicitly staged. Phase-review facing is staged toward existing fire because the player turns away while escaping. Each phase asserts actual canonical sight of burning cells; no visibility filter is bypassed. No terrain, climate, plant, body, reserve or fire-intensity fields are edited. This is controlled ignition, not natural lightning incidence or normal exploration.

The previous renderer draws repeated smooth upright flame symbols. Four transparent native32 painted overhead phases now follow each actual burning cell's saved start tick and current intensity. The first generated candidate was rejected for detached ember noise; the selected revision uses broader connected orange/gold clusters. Transparent gaps keep terrain and creatures readable. No smoke, burned-ground decal, invented fuel or object is added. Extinguished/hidden cells and historical missing-policy worlds receive no fire paint. Biological injury, finite fuel consumption, mineral/export accounting, spread, weather and persistence remain canonical.

[Original and revised imagegen masters, exact generation/edit prompts and native PNGs](../../assets/art/production-review/wildfire-v1/refinement-prompt.json) are retained. [Mechanical preparation](../../tools/prepare-wildfire-art.py) uses quadrant crop, nearest native32 sampling, explicit five-tone palette mapping and exact sampled alpha. [Source parity](source-parity.txt) proves byte-for-byte regeneration and exact native PNG/indexed RGBA identity. Existing creature catalog entries, sockets, rigs and inherited pigment masks are unchanged. Four cached native canvases are reused across all cells and phases.

[Native art tests](native-check.txt), [finite-fire tests](fire-contract.txt), [visibility tests](visibility-contract.txt) and [canonical source audit](source-audit.json) pass. Tests cover source hash, four distinct transparent phases, exact alpha/palette, canonical clock/intensity, bounded cache, canvas-state restoration, real fire/observer/policy gates and full saved-state immutability. [Strong-fire and all-phase receipts](receipt.json) and [initial-ignition receipts](ignition-receipt.json) prove complete saved-state equality within every before/after pair, using one fixed envelope timestamp and excluding no state fields. Browser page errors: zero.

An initial phase comparison crossed the ordinary HUD food-selector refresh after burning changed crop availability. The [exact two-field diagnostic](phase-ui-diagnostic.json) is retained; native UI refresh now finishes before each paired boundary. No fields were filtered or assigned to manufacture equality. Physical state legitimately advances between separate phase cases.

Paused render CPU timings use 200 whole-renderer calls per stage and exclude GPU completion. The strong-fire sample changed from mean 10.84 / median 6.0 / p95 31.5 ms to 9.19 / 5.1 / 28.1 ms. Initial-ignition means changed from 11.02 to 10.07 ms. These machine samples ran alongside the integration gate and are narrow observations, not a broad performance guarantee. No substantial regression appeared in the paired samples.

The [current playable integration gate](playable-gate.log) passes all 84 focused checks with the exact native-fire runtime committed in `078a855`. Earlier full fast-gate baseline failures/timeouts remain recorded in prior art packets and are not claimed repaired. Remaining comprehensive scope includes other weak anatomy, remaining biome/action/effect visual review and creator acceptance/integration. No release or push is claimed.
