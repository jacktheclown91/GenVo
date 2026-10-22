# Evolutionary stasis, population success and the living library — October 21, 2026

## What the inspection found

- **No forced novelty.**
  - Body mutation (`body-inheritance.js`) applies one random add, replace or loss operation to 25% of births, with no direction.
  - Newborns inherit their parents' adaptation lists; the pressure-ranked handoff draft is disabled (`CFG.evolution.handoffDraft`).
  - Lived pressure is only recorded, for the player's lineage.
  - Nothing schedules novelty, complexity or specialization. A configuration stays common exactly as long as its carriers keep reproducing better than variants, which is stabilizing selection by real costs and benefits. This pass does **not** change any mutation rate.
- **One artificial population ceiling existed and is removed.** Far-region replay threw once a remote region passed 600 animals, which would have halted a successful far population. Regional populations are now bounded only by their ecology; replay work grows with them and is scheduled, never culled. `CFG.maxAnimals` remains a diagnostic reference that never touches biology.
- **Already neutral:** the rarity reproduction boost (`recovery.driveBoost`) returns 1.
- **Remaining for creator review:** breeding readiness still includes a crowding term, consumer-equivalent demand on shared finite food divided by a per-species legacy `density.softCap`. Its demand side is food-based, but the divisor is a carrier constant rather than an anatomical or ecological quantity. It is unchanged here because changing it alters every world's ecology; it needs an explicit, versioned decision.

## Living evolutionary library (`evolved-lineage-library/1`)

New planetary worlds record the policy; historical saves keep neither observations nor registrations.

**Recognition** (`src/lineage/evolved-library.js`) runs in each regional Simulation's daily step. That covers the active region, canonical neighbours, population-model regions and unloaded regions when they replay, so stable populations are recognized across long spans without simulating every movement. A *configuration* is the exact inherited body plan on its life-history carrier. A configuration qualifies only when all of these hold continuously for **30 days**:

- at least **8** living carriers;
- at least **3** carriers whose two parents both carried it (it breeds true);
- at least **3** carriers born with it that reached maturity;
- it is not an authored founding template, template variant or starting body.

It then registers once per region. Observation only records; it never alters reproduction, mutation or mortality. Configurations that stop qualifying simply stop progressing toward registration.

**Each entry records:**

- the representative anatomy (serialized plan) and carrier;
- documented ancestry: the representative's real parent and grandparent IDs, generation, birth day, and its **founding lineage** — the founding templates or library entries it descends from. Births in new worlds now inherit this through the canonical gestation snapshot.
- **emergence**: the recorded mutation or recombination event in a living carrier that produced the configuration, when still observable;
- per-gene mean and spread, distinct pigment genomes, sexes and generations;
- sampled reproductive compatibility between carriers;
- the observed habitat (region, mean temperature and moisture, water share, medium);
- history: seed, projection, first observation, qualifying start, registration day and tick, and the evidence counts.

Entry IDs derive from the configuration, so the same inherited configuration never creates two entries; another world's registration adds a sighting instead. There is no fixed entry limit.

## Storage and use

- Registrations live in each region's own save (`evolvedRegistrations`). After every successful save, `SaveManager.recordEvolvedRegistrations` merges those of the active and resident regions into a separate `genvo8-library` IndexedDB database. The saves database needs no migration and stays at version 2. Writes and reads validate each entry; invalid entries are refused or skipped.
- A **new** planetary world freezes a copy of the library at creation (`foundingLibrary`, saved with the world). Later registrations elsewhere never change how that world founds regions.
- Regional founding then offers each frozen entry beside the 39 authored templates, using tolerance around the habitat the population actually occupied and the same renewable-food, thermal-load and trophic-order measures. Library founders are generation-one introductions with `foundingOrigin.library` provenance and the evolved body. No ancestry is fabricated, and evolved bodies are not subject to the authored depth limits because they already evolved.
- A world never founds its own regions from its own registrations, so expansion within a planet must come from real movement.

## Validation

- **`tests/evolved-library.mjs`:**
  - A controlled cohort was built only through canonical inheritance: founders' real births, the ordinary mutation operator, and two carriers breeding true. Ordinary mutation then ran for 54 real population-model days. The configuration qualified at day 22 and registered at day 52 with 17 living carriers and its mutation event.
  - Six run-time births had a carrier parent; three inherited the configuration and three did not.
  - It also covers no authored or duplicate registrations, exact save and restore with rejection of a forged entry, new-world founding evaluating the entry with library provenance, and a remote region above the former 600 advancing.
- **`tests/evolved-library-store.mjs`:** cross-world store, deduplication with per-world sightings, and validation on write and read.
- **`tools/verify-evolved-library-browser.mjs`** (Chromium): the shared library database, the new world's frozen copy through the native menu, persistence through Save and Continue, and the saves database staying at version 2.
- **Regressions:** founding, demography, residency, E15–E18, persistence, records, journal, projection, authored founders and reproduction tests pass.

## Limits

- **No wildlife migration between regions.** Only the player's family crosses region borders. A successful lineage therefore cannot yet spread beyond its region within a planet. Real cross-region dispersal is the missing piece for geographic expansion and is the next ecological dependency.
- **Exact matching only.** Configurations differing by a single part are separate entries; nothing merges near-duplicates.
- **Labels can repeat.** Labels come from wildlife branch naming and are not identities.
- **No browsing UI yet.** There is no in-game view of the library.
- **Recognition timing.** Unloaded regions are recognized only when rotation replays them.
- **Long runs unmeasured.** Long-run behaviour (centuries, many lineages) has not been run, per your instruction to validate focused cases first.
