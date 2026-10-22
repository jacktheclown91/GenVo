# Seed viability — October 22, 2026

New planetary worlds record `seed-viability/1`. It is the first botanical scalability pass under the creator's direction: give seeds a real lifecycle instead of capping genomes or deleting rare variants. Historical worlds keep the continuous seed bank.

## The problem

Seed banks decayed multiplicatively, by × 0.976–0.992 per day depending on the plant, so a cohort never reached zero. A cohort holding one-hundredth of a seed, which can never germinate, stayed positive for thousands of days. Its genome stayed alive with it.

By day 100 of a natural world, 828,000 cohorts held 41,000 genomes, while adults carried only about 4,900. Most cohorts held 10⁻⁴ to 10⁻³ units. That is one-hundredth to one-tenth of the plant's own ovule unit (`dispersal.localRelease`, 0.007–0.024), which the fertilisation model already uses as the mass of one seed.

## The rule (`src/ecology/seed-viability.js`)

A seed is a discrete propagule with the existing ovule unit as its provision. Each day, after ordinary bank decay, the following applies within one cell:

- **Whole-seed cohorts are untouched:** cohorts holding one or more whole seeds keep their mass and genome.
- **Fractional cohorts are pooled:** cohorts holding less than one seed pool their mass, and the pool funds a whole number of discrete seeds. The count is the whole part, plus one more with probability equal to the remainder, so **the expected seed count is unchanged**.
- **Survivors are drawn by share:** surviving genotypes are drawn without replacement, weighted by their seed mass. A rare genotype persists with exactly the chance its share of seeds gives it. This is finite-seed drift: no cap, no rarity filter, no deletion of variation that is physically present.
- **Mass is conserved:** survivors share the pool exactly. When no seed survives, the pool returns to litter through the existing seed-litter route, and so back to the mineral cycle.
- **No RNG disturbance:** draws are hashed from the world seed, plant kind, cell, day and genome, and never consume the simulation RNG.

Identical genotypes in one cell already share one cohort and one immutable genome definition. Distinct genotypes remain distinct.

The policy is recorded in the simulation, saved, validated on restore (unknown values are rejected) and copied on regional travel. It adds no new saved state.

## Verification

- **`tests/seed-viability.mjs`** (in the playable gate):
  - whole-seed cohorts are untouched;
  - over 4,000 draws, surviving seeds plus litter equal the pool exactly;
  - seed survival frequency matches the expected count, and a rare genotype survives in proportion to its share;
  - the simulation RNG is untouched;
  - over 20 natural days, ecological integrity holds and every cell's bank equals its cohort ledger;
  - bookkeeping is far lower: 8,012 against 19,832 cohorts, and 2,988 against 4,417 genomes (separate checks showed 20,569 against 97,769 cohorts by day 30);
  - exact save, restore and continuation; historical restore; unknown-policy rejection.
- **Same world, 151 days** (`PLANET-OBS-2`, policy on against off):

  | Day 151 | Policy off | Policy on |
  |---|---|---|
  | Plant biomass | 26,973 | 26,715 (−1%) |
  | Living animals | 253 | 247 |
  | Seed cohorts | 1.31 million, still rising | 24,000, plateaued since day 75 |
  | Genomes | 58,661, rising | 10,838, near plateau |
  | Heap | about 1.1 GB | about 265 MB |
  | Simulation time | 376 s | 273 s |

  Cells holding a tracked established plant fell from 20,600 to 9,700, because fractions of a seed can no longer found a plant. Standing biomass is unaffected.
- **Matched 400-day observatory runs** (OBS-1/2/3, `seeds` against `unbounded`) are reported in [the observatory addendum](NATURAL-OBSERVATORY-2026-10-22.md#seed-viability-re-measurement).
  - **Memory, saves and day time are now sustainable:** heaps of 223–335 MB against 2.3–3.6 GB, snapshots of 27–56 MB in under a second, and day times that level off.
  - **Plant biomass is 7–50% lower by day 400,** mostly in seed-spreading plants, because fractional seed mass no longer recolonises ground. Seed release, germination and dormancy were calibrated for the continuous bank and need the creator's plant-lifecycle decision.

## Not yet done

These are further passes from the creator's botanical plan:

- **Seed age and dormancy:** per-cohort age with kind-specific dormancy and viability curves.
- **Plant lifecycles:** senescence, mortality, flowering conditions and the environmental cost of reproduction.
- **Stricter niche failure:** root, light and nutrient competition strong enough that unsuitable plants fail rather than grow slowly.
- **Reproductive boundaries:** inherited compatibility, flowering timing and embryo viability, instead of permissive initial pollen recognition.
- **Faster vegetation updates:** incremental and scheduled updates, which remain the largest share of tick time.
