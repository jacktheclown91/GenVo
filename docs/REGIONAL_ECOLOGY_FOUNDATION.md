# Regional ecology foundation

Creator objective: updated development objective attachment6e05bd2e-1900-4d68-b14d-2100e02f4889, Priority3. Agent-authored implementation, development status only.

`Simulation.regionalEcology` provides a persistent spatial observation boundary. Regions are16×16 chunks with coordinate keys, clipped to `world.n`. They are accounting areas, not new biological species territories, biome definitions or permission to cross disconnected terrain. `landConnectivityIds` exposes the existing terrain connectivity labels within each chunk; movement still requires the actor's existing anatomical occupancy and route checks.

Daily observation costs one actor pass and one pass over established records. It tracks living populations, lineage membership, sampled arrivals/departures, cumulative real births/deaths/mortality causes and a twelve-census history. Population and movement timestamps identify the sampled state; boundary crossings between censuses may be missed. A death removes membership at the next census. Events arise from the canonical birth/death functions; no observation creates organisms or food.

`habitat(key)` reads current moisture, temperature, fertility, water/drinkable cell counts and raw finite plant/freshwater/carrion inventories for one bounded chunk. It does not copy stock ownership, consume food, draw RNG or grant access. Raw stock is not accessible dietary energy or carrying capacity: physiology, mouth, route and competition remain under the existing authoritative controllers. Repeated habitat queries always read current canonical fields; there is no stale persistent resource cache.

`regionsInRadius(x,y,radius)` indexes nearby chunk bounds without walking all world cells. It is a preparation interface for future nearby/distant scheduling. Current distant creatures continue their existing individual simulation; no aggregate birth/mortality model or unloaded population approximation has been enabled.

Regional records and membership are saved in controller state. Old schema10 saves lacking the controller initialize empty records and collect new observations; no past biology is invented. Existing world climate/resources and lineage history remain separately owned and saved. The schema stays10 because this is an optional additive controller, not a replacement stock format. Changing future terrain dimensions still requires explicit world/save migration; this pass does not enlarge the world.

Verified: census reconciliation, exact disjoint inventory totals, no inventory mutation/RNG use, real birth/death accounting, sampled boundary movement, bounded history, full controller persistence, legacy initialization and unchanged biological trajectory with observation disabled. A real Chromium560-actor staged gameplay probe populated64 records without errors. No biome climate model, desert survival benchmark, distant ecological simulation, independent family colony or release acceptance is claimed.
