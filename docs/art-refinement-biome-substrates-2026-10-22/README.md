# Native ground material candidates

Implemented artwork commit `9085897`, then conflict-free canonical aquatic merge `6e81278` (includes `47ea305`). This packet is a bounded continuation of the comprehensive art mission. Creator acceptance and integration onto main remain open.

| Actual generated environment | Before | After |
|---|---|---|
| Dry steppe | [Gameplay](before-dry-gameplay.png) | [Gameplay](after-dry-gameplay.png) |
| Cold exposed soil | [Gameplay](before-cold-gameplay.png) | [Gameplay](after-cold-gameplay.png) |
| Exposed high ground | [Gameplay](before-rock-gameplay.png) | [Gameplay](after-rock-gameplay.png) |

All captures are actual 1000x750 gameplay, default zoom 2, using the canonical founder population and unmodified generated planetary regions. Only the player's observation position is staged on real occupiable ground. No terrain, weather, body, vegetation, reserves or resource fields are edited. The current warm spell means the cold-soil and high-ground observations are canonically labelled grassland. These are not claims of natural tundra/alpine exploration. No snow, edible objects, plants, cliffs or obstacles are painted into the ground art.

Three preserved imagegen masters yield twelve four-tone indexed native32 surface cells. [Exact prompts and original masters](../../assets/art/production-review/biome-substrates-v1/prompts.json) remain editable through the mechanical [preparation script](../../tools/prepare-biome-substrates.py). Continuous moisture, stored physical temperature and elevation weights blend quiet transparent surfaces below vegetation. The existing ground palette receives matching continuous material tint. Water remains excluded. No shared renderer, world, ecology, inheritance or persistence authority was independently edited. All prior creature mounts, rigs and native-art catalog entries remain intact.

Normal-scale inspection rejected the first overly pronounced cold/rock texture and reduced its opacity. Final paint is capped at 25 percent before the existing visual-hierarchy attenuation. A bounded 1024-tile per-world canvas cache avoids repeated native pixel assembly; physical weight changes invalidate affected entries. The cache is renderer-owned and never serialized.

[Paired receipts](receipt.json) show exact complete canonical saved-state equality for all three before/after comparisons, with a fixed envelope timestamp and no omitted state fields. Browser page errors: zero. Before artwork comes from `e67d953:src/render/identity.js`; both stages run the same current merged simulation. The [survey tool](../../tools/survey-biome-substrates.mjs) searches existing planetary geography; the [capture tool](../../tools/review-biome-substrates.cjs) reproduces observations using the retained generated-site inputs.

[Focused checks](focused-postmerge.txt) pass: twelve native frame identities and master hashes, water exclusion, physical field selection, continuous transitions, immutable sampling, bounded texture-cache reuse/invalidation, existing terrain cohesion budgets, habitat identity and contour checks. [Care compatibility](care-postmerge.txt) and the [canonical source audit](source-audit-postmerge.json) also pass after the aquatic merge.

Final paused renderer CPU command measurements use 300 warm draws per stage and five complete shared-world-cache rebuilds. The playable gate had finished before these samples. GPU completion and long-world behavior are excluded.

| Scene | Warm mean before/after ms | Warm median before/after ms | Cache-build median before/after ms |
|---|---|---|---|
| Dry | 5.57 / 6.12 | 3.6 / 4.4 | 103.2 / 90.0 |
| Cold soil | 6.30 / 5.92 | 3.5 / 3.4 | 115.4 / 121.6 |
| High ground | 4.94 / 5.21 | 3.0 / 3.1 | 113.3 / 115.0 |

This records a small measured warm cost in dry/high-ground scenes, rather than claiming every scene became faster. No substantial absolute frame-time regression appeared in these limited paused samples. The [earlier concurrent samples](concurrent-timing-receipt.json) and [initial isolated samples](initial-isolated-timing.json) are also retained: one early cold-soil rebuild rose from 120.2 to 152.8 ms, which did not persist as that magnitude in repeated samples. This is not a broad performance guarantee.


The [current playable integration gate](playable-gate.log) passes all 84 focused checks on merged runtime tree `6e81278`. Only this capture harness and evidence files changed afterward; runtime, assets, tests and gate inputs stayed fixed. [Native preparation](preparation-parity.txt) is byte-for-byte reproducible; [earlier artwork contracts](native-compatibility.txt) also pass. Earlier full fast-gate non-green evidence remains unchanged in the preceding art packets; this work does not claim to repair those baseline failures/timeouts. Remaining art scope includes other biome/environment coverage, weak anatomy, action/effect review and creator acceptance. No whole-game completion, release or push is claimed.
