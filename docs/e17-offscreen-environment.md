# E17: Bounded Offscreen Physical Seasons and Conservation Ledger

## Scope

The first genuinely **time-advancing environment** beyond the player's currently inhabited planetary region is now implemented. Previously an inactive regional archive was frozen entirely. E17 keeps its **fauna and producers frozen** but lets its already-existing water, snowpack, soil moisture, groundwater, temperature, and salt move forward under **actual deterministic historical rainfall and season temperature**, using the very same active-world `advanceEnvironmentWater` and `advanceSoilDay` functions.

The scheduler runs **outside the rendering and input hot path**, on the simulation's existing ecology life strides. Each pass can advance at most **two archived regions by two calendar days each**. It prioritizes the largest historical environmental lag so a reasonable number of archived territories do not indefinitely fall behind. Regions have a historical day cursor and a persisted per-region conservation ledger. The weather factor comes from the existing seeded autocorrelated weather model and time-dependent seasonal climate, not biome-name boosts or rescue dice. Offscreen geography uses the proper absolute continental location.

The full water system provides its own receipts for rain, snowfall, melt, infiltration, runoff, groundwater exchange, evaporation, drainage, and salt. E17 accumulates explicit rainfall and salt import/export totals, and records peak ledger closure. The persistence layer validates that historical days and ledger counters match the region's actual saved environment and are finite; tampered histories are rejected.

Returning to a region replays any **short remaining physical environmental lag** before activating the region and restores the real changed water and salt arrays. This is bounded to **24 historical days per entry**; if backlog is larger, travel is denied with an explicit catchup notice instead of a large synchronous freeze. Normal active ecology cycles continue reconciling such archives in the background. No weather is replayed twice across a save/load boundary.

## Deliberate nonfeatures

**No offscreen species births, aging, autonomous movement, predation, feeding, migration, diseases, egg incubation, vegetation growth, seed germination or photosynthesis.** In particular the simulation does not synthesize food to "balance" fauna, and it does not pretend a living creature spent years feeding while frozen. The remote physical environment changes but remote plant and wildlife populations remain snapshots. A future biological scheduling milestone needs real bounded ecological production and fauna metabolism with canonical energy and family accounting.

Also outstanding: cross-border hydrological exchange between separate regions, migration across global sea/river borders, continuous camera rendering and large memory/performance validation.

## Verification

`tests/e17-offscreen-environment.mjs` uses a real traversable planetary border and archived population, explicitly advances environmental time, proves the field changes without replacing fauna or creating plant tissue, audits the hydrological closures, saves and reloads exactly, returns the real player to the altered ecosystem, tests the scheduler through a real simulation life stride, and rejects forged ledgers and unbounded replay work. The E17 CI also runs the preceding E16 family, E15 single traveler and E14 planetary and geography suites.

This is a structural step toward a living planet across huge continents, not a claim that every distant ecosystem is already autonomously evolving.
