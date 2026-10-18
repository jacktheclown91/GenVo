# Preserved prototype status at architecture review

Current-state notice: this document retains historical review/baseline statements. The current A-H and LP-1 through LP-7 status is mapped in CURRENT-ACCEPTANCE-MAP.md. Earlier topology/birth-cap/directed-inheritance failures have bounded repairs and newer receipts; the full milestone remains incomplete. Older fast fingerprints and100-day trials are not current full-objective acceptance.


The following production changes preceded the creator's review-first instruction. They are preserved, uncommitted, and are not accepted continental architecture:

- `src/world/environment.js`: local climate, fixed-depth surface salt/mixing and reservoir budgets, sea/freshwater separation.
- `src/world/world.js`: local coastal generation and environment initialization.
- `src/world/topography.js`, `src/lineage/lifestyle.js`, `src/world/land-route.js`: continuous slope effort and cost-aware local detours.
- `src/ecology/soil-water.js`, `plant-resources.js`, `freshwater-food.js`, `src/sim/simulation.js`: regional rain/temperature consequences and freshwater/saline resource/refill separation.
- `src/persistence/save-manager.js`: optional environment persistence/validation and legacy fallback, with an unresolved topology mutation regression.
- Focused new tests: `regional-environment.mjs`, `terrain-travel.mjs`; catalog registration in `validation-kinds.json`.

Focused results from the current prototype: regional environment PASS; terrain travel PASS; manual/autonomous movement parity PASS (7.95 tiles/day each); topography PASS; soil-water PASS. Normal two-day whole-state resume passes in the new focused fixture.

**Retained failure:** `node tests/surface-water-persistence.mjs` exits 1: `Environment water topology mismatch.` at environment.js validation during save restore. Existing test adds a river column using `w.water`, rebuilds hydrology, snapshots, then expects exact continuation. The new depth/salt state is not atomically updated with that topology change. No assertion or invariant was removed, and this failure is not treated as an ecological outcome. Repair requires a canonical World topology update contract and generator-version-aware legacy handling (proposal Pass A0).

No new full fast gate, browser runtime acceptance, 100-day evaluation or long soak was run after this prototype. Historical topography-fast report and terrain screenshots refer to earlier inputs. Marine production, organism osmoregulation, saline soil/groundwater, continental architecture and the full Living Planet milestone remain incomplete.

After the creator instructed review first, only audit/design documentation, a read-only catalog export and focused checks of the existing prototype were performed. No further feature implementation, reversion, commit, push or release occurred.
