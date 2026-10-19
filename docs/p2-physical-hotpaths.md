# P2: Physical food-cell and thermal-sampling hot paths

P2 builds directly on the **validated P1** stacked draft branch. It is a narrow, semantic-parity optimization pass, **not a change to biological outcomes**, material supply, species, player lineage, save schema, UI art or map scale.

## Changes

- `src/ecology/dietary-demand.js`: the existing `sources` array includes the sampled physical cell index `r.i` assigned by the canonical world `idx` function. When a nearby consumer tests seeded-crop overlap, use that exact previously established index instead of calculating `idx(r.x,r.y)` again. The source coordinates, region/water accessibility, current crop quantities, current seed/coat reserves, genotype, food handling affordability and cohort transfers are still used unchanged.
- `src/sim/simulation.js`: in the normal creature metabolism pass, calculate the canonical physical cell index once and reuse it to access the same temperature and soil moisture for cold/wet fur or feather physiology. All conditional short-circuit semantics remain the same: moisture is only checked when the actual world rain threshold is met. No new controller authority, new scans, fabricated biomass or RNG calls.

These are micro-optimizations intended to reduce duplicated coordinate work in the existing production hot paths, **not evidence of a 500ms performance fix** by themselves.

## Strict validation

P2 CI runs actual physiological, finite carrying, demand, genetics, soil, movement and save tests. It then checks a pinned P1 commit `321479301dd7e29a9548981edf418dd87274f8d2` against the P2 candidate using the same exact mutation and canonical complete-world fingerprint script, **plus the 560-organism original 4× observer-play full saved world/RNG fingerprint**. No fields are exempted, no random events may diverge.

The original `tests/aquatic.mjs` runs with its **unmodified 120-second** limit. Same-runner P1/P2 ABBA diagnostic uses the **unchanged 500ms observer-play assertion** and reports every pass/fail. The full fast tier runs **without filtering, skipping or changing any thresholds**.

### Interpretation

P1 previously passed its full original fast run in [39181231969](https://github.com/jacktheclown91/GenVo/actions/runs/39181231969) with 425 pass, 5 known failures, 0 new failures and 0 timeouts, while other runs still failed the same absolute 500ms performance target under different host conditions. P2 cannot be merged based on relative timings alone. A successful original full run is necessary but not evidence of a stable performance recovery without repeatable, isolated measurements.

This is draft work. P1/P2 and preceding architecture/content/art PRs remain separate draft branches. Do not touch `main` until explicitly approved.
