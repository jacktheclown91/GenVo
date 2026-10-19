# Current implementation and acceptance

Integration snapshot: October 18, 2026, branch `codex/repository-consolidation`. This document supersedes earlier checkpoint lists as the session entry status. Governing intent: [current design](../design/CURRENT-DESIGN.md). Exact inputs and cleanup scope: [manifest](REPOSITORY-CLEANUP.md).

## Source integrated

The earlier main checkpoint c4453fe has been advanced on a separate branch to the E18 feature chain at dfe097a, with divergent E3/E2 fixes, P1-P3 performance work and the inherited-pigmentation branch merged. Existing published branches remain intact. This is a pinned integration, not a claim that other ongoing branches have stopped changing.

Runtime entry: src/main.js. World and simulation ownership: src/world/world.js and src/sim/simulation.js. Anatomy identity and capabilities: src/lineage/part-registry.js and part-abilities.js. Persistence: src/persistence/save-manager.js and explicit rule/generator migrations. See the implementation-authorities registry for declared consumers.

The integrated source contains current-map pages and opt-in planetary geography, regional travel and offscreen environment/biological replay; woody/canopy and dry/cold flora; developmental loss/head and body inheritance; anatomy-dependent mass; climbing/cover, flight, cold physiology and care; and independent inherited pigmentation. These are code-presence statements, not blanket completion or creator acceptance. Check the current source and specific tests before extending a mechanism.

The registry currently has 91 parts, all with procedural fallbacks and native source/compiled packs (1,456 exact RGBA frames). Six newer packs are runtime-integrated review candidates, not creator-approved final artwork. See [physiology artwork evidence](physiology-art-review-2026-10-18/README.md). Full evolutionary accessibility, complete tissue/material conservation, planetary-scale performance, player readability and First 100 Days acceptance remain unfinished. Experimental tissue kernels and standalone fauna checkpoints remain tested contracts; non-runtime classification does not mean disposable source.

## Evidence for this integration

- Focused P1 mutation/thermal/grip, carrying-reach, P3 diet parity, E6 dryland and inherited-pigmentation tests passed after merge resolution.
- Canonical source audit: 273 source modules, 265 runtime-reachable source modules, eight classified test/tool modules; 267 dependency files including non-src dependencies; 91 matching registered/procedural part IDs; no identical source copies.
- Public-export dependency and byte-parity check passed. Sprite reference sheets were regenerated with the existing exporter; these derived images are ignored, not live source.
- Packaging inclusion regression checks ignored outputs and accidentally tracked snapshots while retaining comparison fixtures and small test receipts.
- Latest full fast gate: **449 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred** out of 465, in 215 seconds without input drift. Receipt: docs/test-runs/traveler-mortality-integration-2026-10-19.json. The unchanged observer timing gate also passed. Four known failures still remain, so this is not complete acceptance or a release claim. Earlier receipts remain historical evidence.
- Chromium loaded all 91 native packs, rendered six legally mounted expanded parts across eight facings, and verified wing folding/deployment/stroke with zero page errors. The contact sheet and current-world capture were visually inspected. These controlled previews do not prove natural evolution or human playability.

No human visual acceptance, long-world ecological acceptance or release is claimed. Automated Chromium rendering is established for the bounded artwork review; unfamiliar-player testing remains open. Distinguish a functional lineage experiment from an ordinary run producing that trait; distinguish player-guided from autonomous trials. Population declines after day 100 are not defects by themselves.

## Continue work

Inspect branch status and remote divergence before editing. Use targeted mechanism tests during construction. First 100 Days remains a mechanism/playability milestone with legitimate young and established-world trials, not a quota for persistence or biodiversity. Keep larger-world, anatomy accessibility, physiology conservation and human-facing evidence gaps visible. New merged mechanisms do not silently inherit creator approval from older bounded passes.

## Follow-up: soil/snow integration repair (October 18)

Local working-tree follow-up to the pinned cleanup checkpoint: soil-water, terrain-travel and weather-soil-resume now pass. Their fixtures now provide actual temperature/moisture fields, and precipitation accounting includes snow storage and melt without relaxing total-water closure or exact save/resume assertions. A runtime diagnostic correction excludes snow from meanMoisture; snow remains in total water storage. This changes reporting, not biological coefficients or resource flows. Historical saved daily receipts are preserved until new days are computed; no rule migration is needed for a corrected derived diagnostic.

New snowy-world regression verifies the reported liquid soil average independently. Soil-focused runner: seven pass, one long suite deferred, zero failures/timeouts/input drift (docs/test-runs/soil-snow-integration-repair-2026-10-18.json). E13 snowpack, terrain travel, E17/E18 offscreen replay and save-persistence checks also pass. No full-gate rerun or day-100/visual acceptance is claimed for this follow-up. At that checkpoint native artwork coverage, vocabulary expectations and observer performance remained outstanding; subsequent artwork/vocabulary repair is recorded below. The overall goal remains active.

## Follow-up: expanded physiology artwork (October 18)

Local review candidates now close the six native-art gaps: 91 registered parts have 91 native packs and 1,456 compiled/source-identical frames. See physiology-art-review-2026-10-18/README.md and its actual Chromium evidence. Arid-pad art follows the limb rig; powered-wing panels fold/deploy from the rendered action/phase. Existing biology and inheritance rules are unchanged. Four native catalog suites now pass, as does the vocabulary suite after explicitly including the four already-implemented dry/cold producer labels. Creator visual approval and natural-lineage/player demonstrations remain open. Earlier missing-art counts above describe the pinned cleanup snapshot, not this working-tree follow-up.

## Crop-yield performance repair (October 19)

The profiler identified cropYield as a leading cost. Forecasts now avoid constructing harvest provenance and explanation strings, use the shared finite-tissue arithmetic, cache mouth-specific handling costs with existing recipe invalidation and return zero immediately for empty current crop stock. Affordability still reads current energy on every call. No resource coefficients, RNG rules, birth limits or save policies changed.

Frozen reference comparison establishes exact complete saved-state parity across four natural days and 3,520 stock/mouth/reserve cases, including depletion and regrowth. The six-run alternating diagnostic averaged 546.96 ms before versus 476.42 ms after (12.90% less), with identical final saved-state hashes. A standalone observer test passed at 439 ms and the full gate passed at 453 ms against its unchanged 500 ms limit. See performance/README.md for evidence and methodological limits. Mature-world/browser/offscreen scale remains unproven by this local workload.

## First 100 Days baseline (October 19)

The existing autonomous diagnostic completed 100 days of GENVO8-TEST-A with mechanical integrity passing: 188 initial organisms, 152 actual births, 16 deaths, 324 final living organisms. Maximum recorded daily water closure was 8.162e-6 water-index units. This is one default local world with seeded founding templates, not the planetary generator or a simple-origin/player-guided demonstration. Full evidence and provenance: first-100-days/2026-10-19/README.md.

Post-GC sampled heap rose from 16.1 MB to 399.5 MB, with 408,966 stored seed cohorts and about 834 MB resident memory at the final sample. Vegetation, decisions and perception dominated measured phase cost. This identifies a concrete scaling/representation investigation; no variants or offspring were clipped. Planetary-scale 100-day behavior and human play acceptance remain open; the subsequent default-world Node save/restore check below now passes. The overall goal remains active.

## Day-100 persistence and lossless codec (October 19)

A regenerated default GENVO8-TEST-A world saved after 100 completed days. Its 88.7 MB raw Node V8 checkpoint restores to exactly the complete saved state and continues for a full day identically to the uninterrupted world. The same mature checkpoint verifies old/new codec equivalence for all 408,966 seed cohorts, the entire packed table, restored worlds and full-day continuation. The existing Float64 schema, positive rare quantities, row ordering, ancestry and mutable-metadata isolation remain unchanged.

Metadata fast paths reduced mean seed encoding from 3.282 to 2.012 seconds (38.7%) and decoding from 3.722 to 1.903 seconds (48.9%) in an alternating diagnostic. Complete restore measured 5.50 versus 2.88 seconds in a single ordered comparison, not a benchmark average. No cohorts or offspring were removed. Details: performance/seed-codec-save-review-2026-10-19.md. The large checkpoint is local/ignored and indexed in LOCAL-CHECKPOINT-MANIFEST.json; small receipts and the SHA-locked reference codec remain versionable.

The early comparison harness shared a groundwater buffer when repeatedly decoding the same V8 bytes. Independent transport copies fix that diagnostic contamination; corrected before/after checks pass. Historical false-positive receipts are explicitly explained in performance/history/README.md. This did not require a biological rule change.

Live cohort-memory growth, browser IndexedDB save timing/size, planetary 100-day persistence, simple-origin accessibility and player experience remain incomplete. The overall goal stays active.

## Planetary 100-day and regional replay checks (October 19)

Two planetary/1 local-region runs of GENVO8-TEST-A completed 100 days and exact save/restore/full-day continuation: inland (0,0), 301 final living organisms and an 83.4 MB Node checkpoint; coastal (0,2560), 321 and 73.9 MB. Counts are observations, not survival targets. Existing founding templates remain; no simple-origin or player acceptance is inferred. See first-100-days/2026-10-19/PLANETARY-FINDINGS.md and its retained raw receipts.

The coastal run audits soil and salt budgets on every completed day. All close within existing limits. It also reveals incomplete planetary coupling: initial salt 659.887 falls to 0.354685 through explicitly recorded rainfall exports with no surrounding-ocean input. The current planetary regional boundaries are deliberately closed. An explicit shared, versioned exchange authority is needed; do not repair the result with constant salinity or population tuning.

A separate controlled-border five-day profile advances 240 real archived ticks with zero time debt and valid ledgers. Restore/World construction and cloning are substantial measured costs; this is not a mature multi-region performance verdict. Runtime source and tests were unchanged by these checks. Only diagnostic tooling/docs were added or extended after the last full gate; ecological-observation and E18 checks passed directly. Global coupling, long regional replay, live memory scaling, browser persistence and human experience remain incomplete. The overall goal stays active.

## Restore scaffolding performance (October 19)

Restoration now opts into a four-entry cache of pristine deterministic generated world data. Every restored world still receives independent mutable arrays and page views and passes existing saved-state validation; only immutable geography is shared. Fresh-world creation, save schemas, biological ticks, scheduling and atomic remote publication are unchanged. Frozen-reference tests verify complete freshwater/coastal/planetary restores, full-day continuation, historical defaults, isolation and invalidation.

A paired five-day replay measured 11.580 seconds uncached versus 9.342 seconds cached (19.3% less time), with exact equality of the entire active-plus-archived final saved state, 240 completed remote ticks and zero debt. This single ordered diagnostic does not establish mature planetary performance or browser responsiveness. See performance/world-restore-cache-review-2026-10-19.md. Full fast integration passes with the four previously known failures and 12 deferred suites recorded above. Changes remain local and uncommitted; the overall goal is incomplete.

## Multi-hop regional biology repair (October 19)

A new three-region regression reproduced a travel integration defect: crossing into a third region discarded biologicalMode and both ledgers from older archives. Travel now retains the complete unaffected archive record. Both inactive regions continue canonical animal/plant/resource ticks, preserve exact save state and resume deterministically. Previously stripped records cannot have missing history safely inferred; no retroactive biological-mode migration is performed. Details: performance/regional-multi-hop-review-2026-10-19.md.

The ten-active-day diagnostic with two archives exposes a separate scheduler limitation: each remote region advances only five days, accumulating five days of debt. Continuing active time cannot clear this growing backlog, so current return advice is insufficient. Node update p95 was 271 ms and maximum 820 ms; these are responsiveness risks, not browser measurements. The 31.8 MB raw checkpoint roundtrips exactly; two independent reloads continue identically for a full day. Synchronized planetary scheduling, mature replay, browser responsiveness and the overall goal remain incomplete.

Multi-hop integration verification: 446 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (462 total, 207 seconds, no code input drift). The observer timing gate passed unchanged. Receipt: test-runs/multi-hop-biology-integration-2026-10-19.json. No commit or push was made.

## Synchronized timing for new planetary worlds (October 19)

New planetary worlds explicitly save synchronized-strides/1. Subsequent local time and control wait at each life-stride boundary until all biological archives reach that same tick. Browser pacing admits one existing atomic regional job then yields; synchronous callers execute the same ordered jobs before the next local update. Existing saves without a policy preserve bounded-strides/1 with no hidden migration. Unknown/null values are rejected, and travel transfers the exact policy. Contract: performance/REGIONAL-REPLAY-POLICY.md.

In a ten-active-day, three-region run, both archives reached tick 474 against local tick 480 (six pending ticks, resolved before another local tick), instead of the earlier five-day lag. It took 36.58 seconds versus 18.50 seconds under the older schedule because nearly twice the archived biological time runs. These are ordered observations, not a performance benchmark. Exact synchronous/frame-yielded state and mid-barrier saves pass.

Real Chromium main-loop and IndexedDB evidence confirms held local time during remote progress, a visible catchup notice, exact save roundtrip, and zero page errors over one active day. Maximum observed frame gap remains 450 ms: individual regional jobs still stall frames. These controlled border captures do not establish human visual/play acceptance. Details: performance/regional-synchronized-review-2026-10-19.md. Old saves retain their original limitations; mature multi-region day-100 proof, per-job responsiveness and the overall goal remain incomplete.

Synchronized timing integration: 447 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (463 suites, 216 seconds, no code input drift). The unchanged observer timing gate passed. Receipt: test-runs/synchronized-regions-integration-2026-10-19.json. Source remains local and uncommitted.

## Restore initialization follow-up (October 19)

Restore now defers generated flora initialization when the saved dispersal controller replaces it, while keeping the final loaded-state upgrade/validation and original missing-controller fallback. New-world generation, replay order, resources and save policies are unchanged. Frozen-reference comparisons cover three generators, complete restores, full-day continuations, historical fixtures, crop-consumption callbacks and malformed-state rejection.

A three-region checkpoint restore averaged 207 ms before versus 156 ms after across four alternating samples. The complete ten-day run fell from 36.58 to 33.56 seconds in one ordered pair, with exact active-plus-archived saved-state equality. The mature default day-100 checkpoint and next day also match exactly; restore remains about 2.5 seconds, with no meaningful improvement established there. Browser/IndexedDB checks pass, but maximum observed frame gap was 583 ms, so smoother frames are not proven. See performance/deferred-flora-review-2026-10-19.md. Mature planetary scale, per-job responsiveness and the overall goal remain incomplete.

Deferred-flora integration: 448 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (464 suites, 215 seconds, no code input drift). The unchanged observer timing gate passed. Receipt: test-runs/deferred-flora-integration-2026-10-19.json. No commit or push was made.

## Long regional trial: mortality/return-position repair (October 19)

The first autonomous three-region day-100 attempt stopped after 15 completed days: wildlife mortality shortened an archive but did not shift its remembered departed-traveler index. That later failed ownership validation. Canonical lifecycle compaction now shifts single/cohort traveler positions using the same alive-or-player removal predicate, preserving surviving order and appended newborn placement. Mortality, births, resources and validation limits are unchanged.

The new regression fails against the prior code and passes after repair for a real remote death, exact save/restore, actual return, family positions and retained dead-player semantics. Existing E18 and family-travel checks pass. No past missing order is inferred retroactively; historical stale checkpoints remain attributable rather than silently clamped. First failure and the corrected fresh-run protocol: performance/regional-autonomous-100day-protocol-2026-10-19.md. This is not day-100 acceptance.

Mortality/return-position integration: 449 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (465 suites, 215 seconds, no code input drift). The original observer timing gate passed. The corrected 100-day three-region trial restarts from the original fixture in local artifacts/regional-autonomous-100day-r2-2026-10-19; it is not yet complete. No commit or push was made.

## Current structural route audit while long trial runs (October 19)

A fresh 91-part audit finds replayed actual mutation-operator witnesses for 82 parts and a twelve-leg body. Eight exclusive/relic parts remain excluded by existing policy. A separate declared seven-step stout-torso/fur/womb/endothermy/gland route resolves the one bounded-search miss, giving structural witnesses for all 83 non-exclusive parts. No runtime mutation policy was changed. This is not inherited-birth, viable-intermediate, material-funding or functional acceptance; the four-legged founder is not truly minimal life. Evidence: performance/current-part-route-review-2026-10-19.md.

The unchanged-source three-region trial has passed day 33. Its day-30 raw checkpoint is 140 MB and sampled post-GC heap about 364 MB. It is still running toward day 100; current process/log state remains authoritative. No new full runtime gate was needed solely for diagnostic additions; the latest runtime result remains 449 pass, four known failures and 12 deferred.

## Natural regional births and a newly observed accounting gap (October 19)

Read-only day-30 checkpoint analysis verifies 23 naturally recorded offspring with parts absent from both matching retained parents. Natural offspring 595 crosses actual water under normal charged movement while both parents stop, with anatomy/genes/age/reserves preserved. This is a real inherited functional difference under controlled placement, not minimal-life diversification, natural navigation, descendant reproduction or browser acceptance.

Natural digger 630 can execute a new action denied to both parents. The action exposes a rule gap: +9.11 energy and +2 hydration with unchanged complete physical-world and flora-resource states. Current digging reward is not funded by an existing resource debit. The ongoing trial remains useful for scaling/persistence but cannot certify complete food-resource balance. Source remains fixed during the run; finite digging repair follows its terminal result with explicit policy/save handling. Detailed receipts and repair boundary: first-100-days/2026-10-19/REGIONAL-BIRTH-FINDINGS.md.

## Staged finite-digging repair while source is held fixed (October 19)

An isolated tools/experiments candidate routes represented local marshroot/dune-bulb food through the existing finite consume authority, with exact normal-meal resource/seed/nutrient parity for natural child 630. Empty/depleted ground and calendar-only renewal grant no reward. Dry-food coverage and explicitly reinstalled candidate save/continuation checks pass. The original checker exhausted its 2 GB heap by copying entire planetary archives repeatedly; isolating private local fixtures fixes the harness within the same ceiling.

The candidate is not installed, has no automatic runtime policy migration and does not finish mound integration or belowground physiology. The live controller still has the known reward gap. Integration plan and receipts: first-100-days/2026-10-19/FINITE-DIGGING-CANDIDATE.md. The main trial passed day 60 (265 MB raw checkpoint, about 700 MB sampled post-GC heap) and continues beyond day 63. It remains a scale/persistence trial, not complete food-resource balance acceptance. Runtime source remains fixed; no new runtime gate was claimed for these separate diagnostic candidates.

## Staged digging policy/mound checks (October 19)

The experiment adapter preserves missing-rule legacy saves/actions, records explicit future-rule adoption, rejects bad versions/history and updates three synchronized regions atomically without changing complete biological/resource state. Mound clues cannot refill or multiply food; successful visits persist. Player/wild stocks and flows match exactly, with proximity-only receipt amounts checked separately against actual debit. Environmental-only archive adoption is guarded pending a verified clock conversion; their original saves remain usable.

Latest staged receipt: performance/finite-digging-policy-candidate-r2-2026-10-19.json; details in first-100-days/2026-10-19/FINITE-DIGGING-CANDIDATE.md. No production import or runtime source changed. Constructor/restore/travel/remote-action/UI wiring and subsequent full tests remain pending. The unchanged-input legacy-rule long trial continues beyond day 81, so the known live reward gap and food-balance acceptance limitation still apply.
