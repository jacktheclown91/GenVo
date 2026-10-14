# Lossless seed saves and inherited ambient nutrition

The previous botanical inheritance pass changed gameplay and shipped a verified build. This pass addresses a measured scalability failure rather than re-exporting unchanged source.

## Authoritative changes

`src/persistence/flora-seed-codec.js` stores seed cohorts as per-kind column tables. Cell and row order, genotype identities, every Float64 quantity, null/undefined property presence, metadata arrays and parental provenance survive decoding exactly. Repeated values use dictionaries; live ecological Maps and canonical quantities remain unchanged. Malformed tables fail closed. No positive cohort is culled or rounded.

`src/persistence/save-manager.js` uses the codec for saved dispersal state, and decodes before existing ecological validation. Old Map-based saves still load. The IndexedDB save schema remains compatible with prior saves; the embedded seed table has its own explicit version. Older game binaries cannot read this new table format; backward compatibility here means the updated game reads prior saves.

`src/sim/simulation.js` fixes an actual authority mismatch: ambient crop feeding now uses the plant's inherited nutrition rather than its founding resource constant. Existing diet, anatomy, reach, handling, lifecycle and resource controllers still execute the action. No extra feeding implementation or AI reward was introduced.

## Evidence

- `seed-save-tests.json`: all 20 focused current-source integration/regression checks pass. Includes preserved botanical stages, interactions, clonal inheritance, resource conservation, Lab, lineage comparison and persistence.
- `flora-seed-codec.mjs`: exact Number.MIN_VALUE, 1e-30 and negative-zero quantities; null versus absent versus explicit undefined; map and metadata order; dictionary isolation; malformed indices; actual continuation after restore. No tolerance relaxation.
- `seed-save-browser-proof.json`: native Chromium 800x600, twelve controlled canonical vegetation phases, existing pause-menu hotkey, mouse Save World, actual browser IndexedDB and actual application restore. All 6,288 cohorts and botanical state/RNG match; no browser-storage mocks. `seed-save-restored-800.png` and `seed-save-runtime.webm` show the runtime.
- `seed-save-size-comparison.json`: 100 resource-only days on three seeds preserve exact cohort counts (289,804; 304,509; 312,143), genotype counts, reproduction statistics, mass inventory and drift. Raw snapshots shrink from 147,599,129/155,107,907/158,883,002 bytes to 54,565,716/57,263,155/58,464,707 bytes: about 63%. This is raw V8 serialization measurement, not browser disk-quota or compressed-transfer measurement.
- `lab-windows-prior-save-receipt.json`: exact earlier delivered saves retain stocks, seed banks, resource reserves, genetics and RNG.
- `inherited-wild-nutrition.mjs`: controlled identical actor/resource-label comparison through the real ambient feeding resolver; inherited nutrient variation affects both quotes and actual gained energy.
- `botanical-natural-lifecycle.json`: three fresh seeded worlds run 4,800 normal full-lifecycle updates each (600 simulation seconds, accelerated wall clock), without position, reserve, terrain, genotype or anatomy fixtures. With no player, natural animal feeding produced 3, 0 and 1 cross-fertilizations. Selfing and rejection remained autonomous; endpoint save parity passed. These are simulation observations, not rendered ten-minute human playtests, guaranteed crossbreeding, proven crossed-adult survival or ecological equilibrium.

## Remaining requirements

Snapshots are still 55-58 MB after 100 resource-only days, and vegetation phases average 261-286 ms on this host. The codec improves storage size, not live cohort count or all gameplay-frame costs. Further bounded optimization must preserve rare positive seeds and inheritance. Natural crossed offspring survival, selection, bottlenecks and reproductive divergence still need longitudinal evidence.

The full seven-priority development goal stays active. Next substantive work should make biological encounter reactions/audio more readable and complete inappropriate species-ID authority gates, while tracking natural offspring and performance. Human first-time comprehension and creator visual approval remain unproven; actual terrain-height/support design remains outstanding before flight/climbing.
