# D2: Conserved page-to-page seed dispersal receipts

D2 observes **actual successful deposits** into the existing finite `world.seedBank[kind][i]` and canonical `dispersal.floraState.seeds` genotype cohorts. Both remain the only live inventories. D2 does not plant, germinate, mutate, rescue or create seed material.

- The existing `PlantDispersalController.deposit` allocates real funded deposit material (with existing biomass caps). The page observer runs **only after** `addSeedCohorts` succeeds and the canonical bank increases. Failed or water-blocked deposits never produce receipts.
- A deposit with one origin in another 64-tile World page adds that actual successful quantity to a directional page/kind ledger. `payload.cohorts` mixed-source material is split by exactly the **same proportional weights** used by the canonical seed cohort allocation; locally sourced shares are not counted as cross-page transfers. Unknown or invalid legacy origin cells are **not** fabricated into origins.
- Directed per-page/kind transferred masses and deposit counts are cumulative. A rolling maximum of 64 detailed receipts records actual deposit ID, originating and receiving page, kind, day/tick, physical amount and any carrier ID. Monotonic `depositId` prevents counting a duplicate audit call or reusing a prior committed deposit.
- On save/restore the versioned ledger is validated for page ranges, positive finite material, cumulative mass/count reconciliation and chronological deposit IDs. Legacy schema-10 saves lacking it remain loadable with no invented historical transfers.
- `page-seed-transfers.js` has no randomness, no camera queries, no world biology writes and no arbitrary population/seed targets. `World.pages` is still a disposable render view; old 128x128 World remains the entire physical world.

## Limitations

This receipt records the original physical seed-bank delivery and genotype lineage but it does **not** itself transfer material between independently loaded continents. The canonical cargo, animal survival, local seed bank, genome registry, seed decay and establishment remain the sole authorities. Off-world/unknown parent provenance cannot be inferred. Full autonomous offscreen seed/animal ownership and interrupted-step recovery still require later work.

## Verification

`tests/page-seed-transfers.mjs` verifies true deposits across a dry page seam, local-only drops, mixed-source genotype proportionality, real seed stocks, idempotent monotonic audit, bounded history, malformed save rejection and resumed page-load neutrality. CI also exercises existing seed, flora, botanical, save, D0 and D1 suites and the original fast regression without weakening thresholds. Whole-simulation parent parity is compared with the exact D1 parent head after excluding **only** D2's optional audit field.
