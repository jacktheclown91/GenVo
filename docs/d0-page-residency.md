# D0 canonical actor page-residency ledger

B1 remains the prerequisite branch. This first D0 slice supports future offscreen simulation authority **without activating it** or copying an animal into a second stock.

## Canonical identity and lifecycle

- `Simulation.animals` is still the only owner of living creature objects. `World.pages` remains a view and may be unloaded with no biological side effect. The new `RegionalEcologyController.pageTransit` is an **index/observation**, not a population stock or autonomous simulation.
- Each living positive integer actor ID is indexed to one existing 64-tile World page (the 16-tile ecological reporting grid is unchanged). After initial world spawning/repositioning has finished, a one-time census seeds only surviving actors, producing **no invented founding migrations**.
- New actors are registered at actual spawn, not reported as immigrants. The existing birth notification is idempotent. Death removes the index entry without creating an export/rescue population.
- Manual and ambient movement invoke page-crossing observation only when an actor really changes pages. A conservative sweep during the established regional perception phase reconciles predator/scripted movement and removals that occur outside these two pathways. The sweep does not apply decisions or mutate animals, body plans, environment or resources.
- Every actual crossing appends an increasing, unique sequence-numbered record with organism ID, species, day/tick and actual from/to pages. Counters per directed edge are cumulative, while detailed history is capped at 64 receipts. A repeated observation with no further motion is idempotent. No RNG draws occur.
- Saving persists the controller's ledger with the rest of the canonical controller state; loading validates its schema, page ranges, identities, internal cumulative counts and chronological receipt order. Old schema-10 worlds with no ledger are accepted without backfilling invented historical crossings; their first later observation seeds current residents.

## Validation

`tests/page-residency.mjs` checks actual manual player crossing through a dry physical lane, exact identity/genes, crossing count and repeated-observation idempotence, new spawn/death bookkeeping, no effect from page-view eviction, full snapshot/resume parity, corrupted-save rejection and compatibility with snapshots lacking optional observations. Also run the existing `regional-ecology`, `regional-migration-arrivals`, `world-pages`, `save-persistence`, salt and groundwater suites, followed by the normal fast gate with unmodified thresholds.

CI workflow: `.github/workflows/d0-page-residency.yml`.

## Not yet implemented or approved

This is **not** offscreen simulation, creature storage per unloaded page, transactional physical cross-world organism transfer or enlarged geography. It is a bounded provenance/index layer over the fully resident current 128x128 simulation. Future D work must review exactly-once simulation tick ownership, atomic organism transfer, ancestry and material conservation, mortality/offspring behavior offscreen, interrupted-update recovery, and migration from old saves, before replacing the present dense actor authority or allowing unload of live ecology. Existing 16-tile regional observation and actual migration/controller decision systems remain untouched.

Do not release from this draft without verified tests and real browser review. Do not adjust survival/genetic rules to obtain population targets.
