# Phase 3G / Phase 4 continuation — inherited reproduction, aquatic viability, juveniles, player lineage (October 15, 2026)

**Status: code complete; build verified in source tests and real Chromium play. Not creator accepted. Uncommitted.**

Every new value below is a proposal. Each integrated change has an off switch for comparison: `?foundingGenetics=0`, `?aquaticReview=0`, `?ecologyReview=0`, `?breedingReview=0`.

## A. Founding reproductive genotypes (implemented, `src/reproduction/reproductive-compatibility.js`)

Every founding lineage keeps the conserved ancestral architecture: the same two loci, centred on the ancestral value 1. What's new:

- **Lineage offsets from founding anatomy, not names** (`foundingLineageCentre`).
  - *Gamete locus:* follows the founder's log body mass across the founding range, within ±0.16. Similar-sized lineages start close.
  - *Development locus:* follows aquatic body and hunting mouth, within ±0.10.
- **Individual variation:** each founder carries ±0.02 per gamete allele. Founders are homozygous at the development locus, so a pure lineage keeps full fertility.
- **Separate processes, unchanged:** compatibility is the existing allele-match rule. Mate choice (reciprocal, inherited preferences), anatomical capability and conception compatibility remain separate stages. Hybrids inherit one development allele from each parent lineage, so their own fertility falls through the existing heterozygosity term. Ordinary mutation (±0.045 per generation) lets lineages drift apart, so isolation can evolve but isn't imposed.
- **Saves:** older saves keep their stored genomes. New worlds use founding genotypes.

Proposal values: `FOUNDING_GENETICS = {gamete: .16, development: .10, individual: .02}`.

### Founder conception chance (rows female, columns male)

| | Mosskip | Rootling | Needlejaw | GenVo | Rillsifter | Mirelick | Podshell | Bankjaw |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Mosskip** | .97 | .73 | .48 | .68 | .95 | .92 | .71 | .71 |
| **Needlejaw** | .50 | .74 | .98 | .79 | .42 | .55 | .76 | .76 |
| **GenVo** | .73 | .96 | .78 | .97 | .65 | .78 | .99 | .98 |

### Natural observation (`tools/hybrid-observation.mjs`, 3 seeds × 300 days, `docs/hybrid-observation/`)

| | Shared genome (old) | Founding genotypes |
| --- | --- | --- |
| Hybrid births | 25 / 55 / 25 | **20 / 39 / 14** |
| Cross-lineage conception chance (median) | about 1.0 | **0.72–0.77** |
| Conceptions by hybrid parents | 0/10, 16/144, 3/56 | 1/43, 10/110, 0/5 |

- Pure-lineage conception per attempt is unchanged (about 13%).
- All integrity checks pass.
- Hybridisation stays real and fertile, but less likely.

**Not solved by genetics: needlejaw still made 0 of 47–70 attempts with its own lineage.** It's sparse, and the nearest opposite-sex adults are other species. Two facts matter here:

- The same-taxon bonus never separated wild founding species, because they all share the root taxon until a lineage branches.
- **Proposal (decision needed):** an inherited *phenotype-matching* component of mate preference (assortative choice, a heritable individual trait). It would favour similar-looking partners without any name gate.

### Same-taxon bonus +0.01 (kept provisionally)

Swept across set sizes and weak, natural and strong inherited preferences (`docs/mate-affinity/`):

- natural preferences, 4 candidates: hybrid ranks first 18.6% (neutral 25%);
- strong preferences: 20.0%.

It stays a soft tendency, below genuine individual preference.

## B. Aquatic food web and founding habitat (integrated as provisional defaults)

- **Defaults now on:** `AQUATIC_REVIEW = {fryGrowth: true, founding: true}` and `ECOLOGY_REVIEW = {amphibiousForage: true, shoreHabitat: true}`.
- **Founding habitat is now conditional on anatomy and food.**
  - It applies only to a land-start species whose founding body swims and whose mouth eats freshwater food.
  - Candidate sites are shoreline cells, each scored by the freshwater food that founder's own mouth can eat within 4 tiles, less a distance cost.
  - If no shoreline offers usable food, the inherited site is kept.
- **Supportability: no.**
  - The initialised web holds about 3.9 units of fry (about 130 energy) across the whole world. It stays flat for about 180 days while larvae build.
  - Eight bankjaws burn about 570 energy in that time.
  - Over 3 seeds × 720 days, bankjaws died out on every seed in every variant (`docs/aquatic-review/AQ-INT-*.json`).
  - Their median energy reaches about 0.3 by day 120; fry only rise (to 8–24) after they're gone.
- **Side effect: rillsifters collapse.** Once fry boom, larvae (rillsifters' preferred food) fall from 68–88 to 4–35, and rillsifters drop to 0–2 on most seeds (base: 8–24). The energy is conserved and flows through a real food chain, but the outcome is destabilising.
- **Decision needed:** founding numbers matched at world generation to the food each body can use (eight bankjaws exceed what the founding water supports, roughly 1–2), and whether fry should also face density limits or predation.

## C. Juvenile survival and replacement

**Why 321 births produced 0 juvenile deaths** (instrumented, `LIFE-B`, 300 days). The reporting is correct; three rule properties combine:

1. **No developmental cost.** Juveniles grow into adult body mass for free.
2. **Lower burn.** Their energy burn scales with body mass (`bodyMassFraction`), so they rarely hit zero (minimum observed 0.04–0.08).
3. **Not targeted by predators.** Hunters choose prey by edible biomass, so juveniles are passed over for adults. Over 300 days, aquatic and GenVo juveniles had hunters able to target them nearby for thousands of ticks but were attacked 0 times; mosskip juveniles 8 times.

Health loss applies to juveniles exactly as to adults (only at energy or hydration 0), so no exemption exists. **Proposals (decision needed):** a growth energy cost, and a vulnerability term in prey choice.

**Mirelick and podshell don't replace their founders** (3 seeds × 365 days, funnel):

- **They rarely search for mates:** 0.27% and 0.9% of adult time (needlejaw 16.6%, mosskip 4.8%). Their energy gates (0.74/0.75) sit just above their natural median energy (about 0.73), so with the habitat gate they qualify about 9% of the time.
- **Their lives are short and births spaced:** lifespan 210/258 days, maturity 25/29, postpartum recovery about 95 days. At best about 2 litters of 1–2 young per female.

That's a legitimate life-history limit. **Decision needed** if replacement is intended.

## D. Wild GenVo boom-and-bust and the player lineage

**Not a finite-food crash.**

- World GenVo-edible plant energy only goes from about 137,000 to 125,000 over 160 days.
- Food near GenVo equals the world average (7.8 against 8.2 per cell).
- Yet once GenVo double (24 → 56), their median energy settles at about 0.49 with few deaths.

**Mechanism: a thin energy margin.**

- Continuous feeding brings in about 3.8 energy/day (about 49 ticks of feeding per 3.9-energy meal), against a basal burn of about 2.5/day.
- While hungry, GenVo also spend 29% of their time drinking, 14% on group alarms and 8% escaping.
- So the population plateaus below the 0.72 breeding gate instead of dying off.

**Player strategies** (`tools/player-strategy-experiment.mjs`, 4 seeds × 160 days, same rules, no bonuses):

| Strategy | Outcome |
| --- | --- |
| AUTO | Starvation on 3 seeds (median energy 0.33–0.48). **Generation 3 reached on STRAT-D** (7 lineage births, first child on day 22). |
| Careful forager (flee, drink when thirsty, eat best food, court when fed) | Energy stays high (0.75–0.81), but **killed by Stalkers on day 24–53 on every seed**. Hiding in open ground isn't possible for an unspecialised founder, and running doesn't escape a charge. |

So the two failure routes are energy deficit (AUTO) and player-targeted predation (manual). **Decision needed:** Stalker pressure on the founding player, and early defensive options.

**Visibility improvement:** when the player is below 70% energy and lost energy over the last day, a notice states the measured daily loss and what genuinely helps: richer food (bigger meal numbers), less time fleeing or drinking, a quieter patch (`src/ui/tutorial.js` `noteEnergyBalance`, at most every 3 days). No biology changes.

## E. Frame time at larger populations (`tools/profile-population-frames.cjs`)

1440×900, same world, day 0 against day 81:

| | Day 0 (196 animals) | Day 81 (283 animals) |
| --- | --- | --- |
| Frame p95 | 16.8 ms | 33.4 ms |
| Render p95 | 13.3 ms | 21.2 ms |
| Everything else p95 (simulation, UI, GC, rasterising) | 12.7 ms | 23.5 ms |

Render cost grows about 60% with more visible creatures. Once it passes the 16.7 ms budget, frames snap to 33 ms. A safe optimisation needs per-creature render profiling and pixel-identity checks; it's queued, not done here.

## F. Ecological validation

- `autonomous-soil-engineering` now **reports** natural seedling establishment (seed germination attempts on disturbed soil and seedlings established there) instead of requiring one within 90 days, per your decision. The causal test `soil-disturbance-establishment.mjs` still asserts the rule.
- `docs/evolution-baseline.json` is unchanged.

## G. Ordinary play (real Chromium, no staging; logs in `../genvo-review-artifacts/2026-10-15/phase4-playtest/run4`, `run5`)

| Session | Outcome |
| --- | --- |
| 1440×900, 10 min | Survived (about day 95). Stalkers and bankjaws approached 50 times. Fullscreen frame p95 rose from 33 to 117–167 ms in the last 2 minutes as the population grew (headless software rasterising). |
| 800×600, 10 min | Survived. The energy notice fired at minute 8 ("Losing about 3 energy a day: meals are not keeping up…"). |

- **Pairing came late in these sessions.** My policy only reached the "Find a mate" goal at 6.5–8.7 minutes, because it doesn't drink until thirsty and "fed and watered" needs a first drink. So the delay is partly the policy.
- **Two more bot limitations, corrected in later runs:**
  - Holding movement keys cancels the game's own courtship approach, by design ("Movement keys cancel the route"). The policy now waits once C has started an approach.
  - No family formed within 10 minutes in any session.
- **Genuine experience findings:**
  - About 10 game days pass per real minute.
  - The goal pill makes "Find a mate" visible, and C now acts on a ready partner.
  - Pairing happens only after the first goals, and in these sessions that came late.

## Verification

`node tools/run-tests.mjs --all --jobs 4` gives **367 pass, 7 known-fail, 0 new failures, 0 timeouts** of 374 (`docs/test-runs/all-phase3g-2026-10-15.json`). Phase 3F was 366 pass and 8 known.

- **Six failures caught by the first full run and fixed:** every one was a fixture assuming an old certainty.
  - Certain conception: shared helper `tests/helpers/conception.js` gives staged pairs real repeated attempts.
  - Fixed litter size: one staged extra birth when the litter is a singleton.
  - Lucky spawn positions: prey placed beside the predator.
  - Hunt success: several genuine attempts against a 90% cap.
  - An exact-1 compatibility expectation for cross-lineage founders.
  - Parity against a frozen copy: now run under the same biology.
- **The 7 known failures:** 5 release-only, `evolution-baseline` (kept by your decision), and `wild-evolution`.
- **Chromium:** all play sessions showed 0 page errors at 800×600 and 1440×900.

## Decisions for you

1. **Founding genetics values:** `{gamete .16, development .10, individual .02}`, with anatomy-based relatedness (body mass, aquatic body, hunting mouth).
2. **Assortative mate choice:** an inherited preference for similar-looking partners, proposed so sparse species like needlejaw court their own kind.
3. **Founding numbers matched to food the body can use** (bankjaw 8 vs about 1–2 supportable). Also: should fry face density limits, given the rillsifter collapse under the integrated aquatic defaults?
4. **Juveniles:** a growth energy cost, and vulnerability in prey choice.
5. **Mirelick and podshell life history:** energy gate vs natural energy; postpartum period vs lifespan.
6. **Player lineage:** Stalker pressure on the founding player and early defensive options; and GenVo's thin energy margin (intake about 1.5× burn).
7. **Fullscreen render cost at larger populations:** next optimisation target.
