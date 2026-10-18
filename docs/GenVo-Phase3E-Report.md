# Phase 3E — final reliability and biological integration (October 15, 2026)

**Status: code complete; build verified (source tests and real Chromium play). Not creator accepted. Uncommitted.**

The defaults are unchanged, apart from the corrections you approved. Every new numerical biology value is marked as a **proposal**.

## 0. Mate preference: same taxon is now a tendency, not a barrier

The Phase 3D ranking put every same-taxon candidate first, which is a hard tier. It's replaced by an affinity bonus added to the existing inherited-preference value:

- `SAME_TAXON_AFFINITY = 0.04` (**proposal**), in `src/reproduction/mate-preferences.js` `compareMateOptions`;
- used by both `autonomousMateTarget` and the player's `eligibleMates`.

Measured scale (3 seeds × 30 days):

- accepted preference values mostly lie within ±0.03;
- within one chooser's options, the gap between favourite and least favourite has a median of 0.055 and a 90th percentile of 0.09.

How often a hybrid is chosen when it's one of 4 candidates, using real genotypes and random positions (it would be 25% if taxon didn't matter):

| Affinity | 0 | 0.02 | **0.04** | 0.06 | 0.08 | ≥ 0.12 |
| --- | --- | --- | --- | --- | --- | --- |
| Hybrid chosen | 25.8% | 13.1% | **5.3%** | 2.0% | 0.6% | 0% (a barrier) |

Tests:

- `species-coexistence` now tests the rule itself:
  - with neutral preferences at equal distance, the own taxon wins;
  - a strongly preferred compatible hybrid outranks a same-taxon candidate;
  - gene flow is the fallback when no same-taxon mate is reachable.
- `species-leadership` no longer asserts "every same-taxon candidate sorts first".

Biological acceptance (reciprocal choice, compatibility, conception) is untouched. Taxon only shifts search order.

## 1. Wildlife behaviour selection (`src/ecology/wildlife-rhythm.js`)

Ambient routines now come from function and circumstance, not the founding label:

| Animal | Routine |
| --- | --- |
| Fully aquatic body | Shoal (unchanged) |
| Hunter that can swim, with water within 6 tiles | Shoreline (`bank-*`) |
| Any other hunter | Prowling (`scent-watch` / `shadow-patrol` / `stalker-rest`), shaped by its inherited Stalker profile (wary, flanker or rusher, adjusted by evolved body) |
| Digger, filter feeder, scavenger, seed carrier | Their anatomy routines (unchanged) |
| Other foragers | Their live social organisation from the canonical social controller: a band keeps band rhythms (GenVo), a herd keeps herd rhythms |

Land-hunter phase shares (of a 36-beat cycle) are a **proposal**:

| Profile | Watch | Rest |
| --- | --- | --- |
| Wary | 14 | 9 |
| Flanker | 10 | 8 |
| Rusher | 6 | 6 |

Patrol reach scales with each hunter's sight-scaled trigger range.

Verification:

- `wildlife-rhythm.mjs` passes, plus new functional checks:
  - a bankjaw by water works the shoreline; the same bankjaw inland prowls;
  - a land-lineage hunter that evolves webbed legs uses shoreline behaviour by the water;
  - a wary hunter watches longer than a bold one;
  - a GenVo with a tearing jaw hunts; a grazing GenVo keeps band behaviour, not herd.
- Live autonomous play (2 seeds × 4 days) and **Chromium play (0 errors)**:
  - needlejaw prowls and scent-watches;
  - GenVo uses band routines;
  - mosskip herd, rootling digging, rillsifter shoal, podshell and mirelick keep their own routines.
- The player is unaffected (the rhythm controller never drives the player or lineage).

## 2. Lineage dispersal contract (`tests/lineage-dispersal-resume.mjs`)

The guaranteed-arrival assertion is gone. The test wraps the real `migration.progress` and checks every progress call with the controller's own gates. The invariants:

- departure only when the origin is blocked by competing consumers and the creature is ready, toward a viable destination;
- no teleport;
- no cancellation while the destination stays viable;
- cancellation exactly on the check where it became unsuitable;
- arrival only within 1 tile, followed by a real residence;
- mid-route save → resume is identical.

Two natural scenarios differ **only** in how many local GenVo relatives exist:

- **8 relatives:** the disperser arrives and establishes a home.
- **All 23:** mature relatives crowd the destination and the route is legitimately reconsidered.

Which outcome each produces is labelled as fixture coverage, not a biological requirement. The dispersal rules are unchanged.

## 3. Reproductive viability

`node tools/reproductive-viability.mjs [--candidate]` is a new diagnostic that changes nothing. Output: `docs/reproductive-viability/{current,candidate}.json`.

- **Stage 1:** natural standing, from unmodified worlds (3 seeds × 60 days).
- **Stage 2:** a controlled favourable pair. After 30 natural days, a mature natural-genotype pair sits at its best breeding cell at its own natural 90th-percentile energy and hydration, and runs on ordinary updates.

| Species | Natural births in 60 days, current → candidate | Controlled pair, current | Controlled pair, candidate |
| --- | --- | --- | --- |
| Rillsifter | 0 → 11 | No breeding cell anywhere | Conceives (gestating) |
| Mirelick | 0 → 12 | No breeding cell anywhere | **Gives birth** |
| Podshell | 0 → 10 | No courtship | Gestating |
| Bankjaw | 0 → 0 | No courtship | No courtship |
| Needlejaw | 1 → 2 | Courtship lapses ("survival-priority") | Same |

The four-seed × two-year comparison (`docs/ecology-review/ECO-CMP-*.json`) agrees with the earlier breeding comparison:

| Species | Births, current → candidate |
| --- | --- |
| Rillsifter | 0 → 33 |
| Mirelick | 0 → 11 |
| Podshell | 0 → 22 |

Other species change only slightly: GenVo 81 → 103, rootling 39 → 31, mosskip unchanged.

### Bankjaw: diagnosed root cause (not fixed; needs your decision)

1. **It lives inland.** Founding placement follows `spawnNear:['mirelick']` (inland marsh). Its median distance to water is 16–20 tiles.
2. **It chases prey it can't catch.** About 70% of its hunting time is spent on mosskip, which outrun it on land (2.35 against bankjaw's 1.76 after its webbed-leg penalty). In 30 days that's 9 attempts and 2 bites, all on rootling, the one slower prey.
3. **Its aquatic diet doesn't exist.** The gape mouth eats fry (1.0) and detritus (0.8), but freshwater food was only sought while already in water.
4. **The aquatic food web has no top tier.** Across a whole world: algae 354 → 770, larvae 7 → 12, **fry stays at about 0.1** and detritus at 0 over 60 days. With larvae at L ≈ 0.015 per water cell, fry encounter larvae at L/(L+0.2) ≈ 0.07 of their need. They can't cover their own upkeep anywhere.

So bankjaw stays below its 0.74 energy gate (median 0.63–0.69). It had 0 births and 0 deaths in all 4 seeds × 2 years.

**Candidates tried:**

- `amphibiousForage` is kept, off by default (`?ecologyReview=1`, `src/ecology/ecology-review.js`). A swimming animal seeks its aquatic food from land too. It's structurally right, but **it changes nothing until fry exist**.
- Two more were measured and **withdrawn** for no benefit:
  - prey catchability in wild prey choice;
  - water-proximity founding spawn. This one had no effect because of `spawnNear`.

**Decision needed:** the fix belongs in the aquatic food web (fry/larvae conversion parameters), bankjaw's founding habitat (`spawnNear`), or both. These are biological calibrations, and I didn't change them.

### Needlejaw (found during this phase)

Courtship costs energy, which drops the hunter below its 0.72 gate, so it switches to survival. That gives 2 births in 8 seed-years. The `wild-evolution` failure ("needlejaw bodies have evolved 0/9") follows from this: no births means no inheritance.

## 4. Evolution baseline preserved

`docs/evolution-baseline.json` is **unchanged** (same hash). The new `node tools/evolution-baseline.mjs --compare <file>` writes a separately labelled current-source comparison, `docs/evolution-baseline-comparison-2026-10-15.json`:

- The effects matrix matches exactly.
- The natural AUTO runs differ (baseline v1.60.2 → v1.65.0). They follow tiny lineages (0–5 GenVo per seed), so the differences are dominated by chance.
- A new baseline should use larger documented seeds, after the biological corrections are accepted.

## 5. Remaining failures, by severity

| Severity | Suite | Outcome |
| --- | --- | --- |
| Simulation integrity | `engineer-loss-return` | It had never reached its second scenario: the first exceeded a hardcoded 110 s child budget by about 3 s. With the budget at 300 s (long-tier policy), the second scenario showed **"Seed cohort quantity mismatch."** The fixture zeroed a cell's seed stock without its genotype ledger, and the save integrity check correctly refused it. The fixture now uses the canonical `reconcileSeedCell`. It also now picks a digger whose own mouth eats roots (the first natural descendant had evolved a tearing jaw). **Both scenarios pass.** |
| Runtime performance | `observer-play` (4× with 560 animals, budget 500 ms per real second) | **Passes, about 400 ms** (was 507–820). An exact cache of neighbour food overlap within one migration scan (`dietary-demand.js`, `carrying.js`), excluding hunters, whose sources depend on position. 0 mismatches in 3,178 recommendations; 0 divergences over 160 headless and live world-days and 6 crowded (560-animal) days. |
| Biological (decision) | Aquatic five | Pass with the breeding candidate except where day-0 forage is too low (section 3) |
| Ecological finding | `wild-evolution` | Follows from needlejaw reproduction (section 3) |
| Baseline | `evolution-baseline` | Preserved by your decision (section 4) |
| Release-only | `provenance`, `canonical-source`, `ai-disclosure`, `evolution-contract`, `player-copy-style` | Left until a release is authorized |

## Verification

`node tools/run-tests.mjs --all --jobs 4` gives **361 pass, 12 known-fail, 0 new failures, 0 timeouts, 0 stale** of 373, in 945 s. Results: `docs/test-runs/all-phase3e-2026-10-15.json`. Phase 3D was 357 / 16.

- **Two regressions were caught mid-phase and fixed:**
  - `functional-ecology-v163` expected the old "every hunter uses the shoreline routine". A land seed carrier with a hunting jaw now prowls, under the approved rule.
  - `observer-play` failed at 677 ms only when sharing the CPU with 4 jobs and 2 browsers; standalone it runs 405–415 ms. Timing-budget suites now run alone after the parallel pool (`tests/test-tiers.json` `serial`), and are still always reported.
- **Chromium gameplay from source** (1440×900, 60 s ordinary play, then 30 s with `?breedingReview=1&ecologyReview=1&strideReview=1.5`): **0 page errors**, player healthy. Live behaviour matches section 1.
- **Packaged playtest build:** `../genvo-review-artifacts/2026-10-15/playtest-build-phase3e/` (212 modules). Defaults are 1× stride and current biology. Switches: `?strideReview=1.5`, `?breedingReview=1`, `?ecologyReview=1`.

## Decisions for you

1. **Same-taxon affinity:** 0.04 (hybrid chosen 5.3% of the time against a 25% neutral share), or another value from the sweep.
2. **Aquatic forage values** (rillsifter 2.9/3.7, mirelick 2.8/3.8, podshell 4.2/5.0): adopt, keep as a switch, or revise.
3. **Bankjaw:** calibrate the aquatic food web's top tier (fry/larvae), change its founding habitat (`spawnNear`), or both. `amphibiousForage` is ready once there is food.
4. **Needlejaw:** courtship energy cost against the 0.72 gate (near-zero births; also blocks `wild-evolution`).
5. **Land-hunter rhythm shares** (wary 14/9, flanker 10/8, rusher 6/6) and `SHORE_REACH` 6 tiles.

Then Phase 4: a ten-minute natural gameplay engagement.
