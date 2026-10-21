# Unloading distant regions to indexed storage — October 21, 2026

New planetary worlds record `regional-residency/1`. Visited regions within two regions of the player (a 5×5 neighbourhood) stay in memory; farther population-model regions are **unloaded**: their complete session exists only as its committed indexed record, and the simulation keeps that record's directory entry. The 16-region archive ceiling no longer limits exploration for these worlds. Worlds without the policy keep the previous 16-archive limit and complete in-memory archives.

## Pieces

- **`src/world/regional-residency.js`** (simulation side, no I/O):
  - **Unloaded entry:** `planetaryTravel.unloaded` holds exact directory entries (`kind, key, origin, id, capture, storage?, life, unloaded:true`).
  - **`unloadRegion`** releases a *parked* resident region only when the supplied committed entry's identity header equals the live payload's.
  - **`reloadRegion`** reinstalls a payload only when its identity header equals the entry's.
  - **Allocation and validation:** unloaded identity headers take part in global ID ownership and the allocator watermark; restore validates them.
  - **Crossing gate:** refuses a crossing while any region within one step of the destination is still unloaded or more than two days behind.
- **`src/persistence/regional-records.js`:**
  - **Unloaded entries:** directory entries may carry `unloaded:true`, allowed only for population-model sessions with an identity directory. A complete partition carries unloaded entries by reference and refuses one that is not identical in the previous committed root.
  - **`partitionRegionalJournal` / `commitRegionalJournal`** build a root from the live owner order: new or changed owners are written, and clean and unloaded owners are retained by reference. Membership changes and active-region changes no longer force a complete rewrite.
  - **`readRegionalCheckpoint(…,{residentOnly:true})`** leaves unloaded records on disk and returns their entries; ordinary complete reads (export, fork, backup) still hydrate everything.
- **`src/persistence/regional-dirty.js`:**
  - **Owner list:** the journal lists unloaded owners and builds the retain/write plan.
  - **`clean()`** reports whether a session equals its record in the acknowledged committed root.
- **`SaveManager`:**
  - **Live loading:** `load` reads resident regions only.
  - **`maintainRegionalResidency(sim)`** performs one action per call, serialized with saves:
    1. reload an unloaded region within two steps, through a capacity-one `RegionalCheckpointReader` lease;
    2. catch a lagging resident population-model region up by up to a day of its genuine ticks;
    3. park the farthest population-model region outside the radius, save if its record is not yet the live state, then unload it;
    4. rotate: reload the unloaded region furthest behind, so steps 2–3 run its elapsed ecology and store it again.
- **`src/main.js`** schedules one maintenance action per idle callback during unpaused play.

Parked regions do not advance. An unloaded region's clock stops at its committed tick; rotation and reload run exactly the ticks it missed, through the same population-model kernel, before it is needed nearby. Nothing is summarized, regenerated or reset.

## Verification

- `tests/regional-residency.mjs` (Node, real codec and journal over an in-memory commit) covers:
  - unloading after four crossings;
  - saves that never rewrite unloaded records;
  - resident-only and complete reads;
  - rejection of a forged directory flag;
  - the crossing gate while a needed region is unloaded;
  - rejection of a mismatched payload;
  - reload with genuine catch-up and promotion back to individual simulation;
  - rotation choice;
  - 20 explored regions with at most 25 resident.
- `tools/verify-regional-residency-browser.mjs` (exported build, real IndexedDB, the runtime's own driver) covers:
  - four held-key crossings, after which `0,0` and `128,0` are unloaded and only `256,0` and `384,0` stay resident;
  - native Save and Continue keeping both on disk;
  - walking back, which reloads `128,0` and then promotes it to individual simulation, with all 70 individuals verified as survivors or real births.
- The 63 focused playable checks, the canonical audit and public export pass.
- The regional storage, stage recovery, preparation and seam-work Chromium checks pass.
- `verify-regional-storage-browser.mjs` now builds a uniform complete checkpoint before rewriting it as a historical `indexed-regions/1` root. A real v1 save always had one capture per record; ordinary saves now legitimately retain older records.
- `verify-regional-replay-browser.mjs` fails with a JSON circular-structure error identically on the build from before this session's work.

## Limits

- **Background evolution is best-effort.** Rotation runs one region at a time during idle play. With many explored regions it falls behind, and regions then catch up on approach; a crossing can wait for that.
- **Compute:** far-region vegetation and soil cost is unchanged.
- **Unload cost:** unloading needs a save in which that region's record matches its parked state. Saves write only changed owners, but the active record is rewritten each time.
- **Not covered:**
  - Surveyed Worlds are not unloaded; runtime play creates none.
  - Leased replay of persisted records (`replayNext`) applies only to canonical sessions. Unloaded regions are advanced by rotation through the live kernel instead.
  - Rule adoption for historical worlds iterates resident sessions only. Historical worlds never record this policy.
- **Not done:** seamless region presentation and long-run journey acceptance.
