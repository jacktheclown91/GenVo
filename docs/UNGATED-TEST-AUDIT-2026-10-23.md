# Ungated test audit (October 23, 2026)

All 512 test files outside `tools/check-playable.mjs` were run on `bdb8127` plus that day's working changes. Each run used a 240 s timeout, four at a time.

**Result:** 483 pass, 26 fail and 3 time out.

**Baseline:** each failure was rerun on `bdef370`, the commit before that day's First Legacy, tick-slicing and renderer work, in a temporary detached worktree. "Fails at baseline" means the failure predates that work.

## Regressions found and fixed

- **`family-decision-observer`** (passed at baseline). After tick slicing, the tick called the step versions of the decision, perception and vegetation phases, so tools that wrap those methods on a simulation instance saw nothing. The tick now calls a phase method whole when it is overridden on the instance. Observers and profilers see every call; the game, whose FPS overlay wraps the prototype, keeps slicing. Results are identical either way.
- **`player-copy-style`**. Em dashes in source comments (five files from that day's work, two older) violated the copy-style rule. None was player-visible. They were replaced with ordinary punctuation.
- **`ecology-resume`** first failed during the audit only because `src` was being edited while it ran: its checkpoint is tied to a source fingerprint. Rerun undisturbed, it passes; at baseline it passes given enough time.

## Remaining failures (all predate that day's work)

| Test | Now | At `bdef370` | First error |
|---|---|---|---|
| `ai-disclosure.mjs` | 1 | 1 | Error: ENOENT: no such file or directory, open 'C:\Users\jackt\Desktop\Games\game jam october\genvo-toolkit\su |
| `autonomous-soil-engineering.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `consolidation-demand-parity.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal: |
| `decisions-under-pressure.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `dietary-scan-parity.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: complete natural saved state differs at day 2 |
| `engineer-loss-return.mjs` | timeout | timeout | timed out after 240 s |
| `evolution-baseline.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: natural AUTO runs match the consolidation baseline |
| `evolution-contract.mjs` | 1 | 1 | Error: ENOENT: no such file or directory, open 'C:\Users\jackt\Desktop\Games\game jam october\genvo-toolkit\do |
| `forage-season-competition.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `natural-world-soak.mjs` | timeout | timeout | timed out after 240 s |
| `observer-play.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: 4x with 560+ animals costs 1733 ms per real second of play |
| `perceived-threat-escape.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `persistent-coat-moisture.mjs` | 1 | 1 |  if(e.seasonalCoatPolicy!==undefined&&(e.seasonalCoatPolicy!==SEASONAL_COAT.policy//e.coatMoisturePolicy!==COA |
| `planetary-boundary-exchange.mjs` | 1 | 1 |  if(e.icePolicy!==SURFACE_ICE.policy//world.generator!=='planetary/1'//e.schema<3//!(e.volume instanceof Float |
| `planetary-internal-water.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: The input did not match the regular expression /Invalid planetary water-volume |
| `planetary-paired-seam-salt.mjs` | 1 | 1 |  if(e.icePolicy!==SURFACE_ICE.policy//world.generator!=='planetary/1'//e.schema<3//!(e.volume instanceof Float |
| `planetary-runoff-inundation.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `planetary-terrain-sediment.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: |
| `planetary-water-seam-ownership.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: |
| `planetary-wind-pollination.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: existing flora has funded gametes |
| `provenance.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: last ledger record must fingerprint current canonical source tree |
| `regional-environment.mjs` | 1 | 1 |  if(rule===DIVING.policy&&!world.environment&&!d)throw Error('Saved diving bathymetry is missing.'); |
| `restore-deferred-flora.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: freshwater/1 current entire restored state |
| `topography.mjs` | 1 | 1 | TypeError: Cannot read properties of undefined (reading 'elevation') |
| `wild-evolution-observation.mjs` | timeout | timeout | timed out after 240 s |
| `world-restore-base-cache.mjs` | 1 | 1 | AssertionError [ERR_ASSERTION]: complete restore freshwater/1 |

**Groups:**
- **Missing historical fixtures:** `submission/AI_DISCLOSURE.txt`, `docs/evolution-expansion/baseline-v1.33.7/creature-fixture.json`.
- **Stale exact-state baselines** that no longer match deliberate later rule changes: consolidation, dietary-scan and evolution-baseline parity, and restore-deferred-flora / world-restore-base-cache for `freshwater/1`.
- **Planetary environment fixtures** that no longer satisfy current water, ice and diving validation.
- **A performance budget at 4x with 560+ animals** (`observer-play`).
- **A provenance ledger** that must fingerprint the current tree.
- **Long soak tests** that exceed the 240 s cap.

None is in the playable gate, and none was changed to pass. Each needs its own decision: update the baseline for a deliberate rule change, restore the fixture, or retire the test.
