# E15: Controlled Player Travel Between Persistent Planetary Regions

E15 adds the first functional **player creature crossing** between 128×128 global planetary regions, using E14's absolute coordinates and canonical regional World ownership.

### Interaction
Move close to a planetary region border on passable ground. A contextual **Cross Region (9)** option appears in the mouse-first interaction dock. Press 9 or click the action to enter the adjacent region. Nonplanetary worlds do not offer this action. Crossing checks the **intervening planetary terrain** through the collision-margin cells, so a land creature cannot simply cross an ocean barrier; evolved swimmers and actual fliers can cross water. The crossing incurs a physical food-energy cost. It is currently an explicit gateway transition, **not** continuous camera walking through the boundary.

### Real region ownership
A departure snapshots the complete source regional Simulation, including population, each organism's condition/genetics/body, its world resource stores, regional controllers, territory and weather history. The active traveling creature is **removed from that archive**. It is inserted as a single same-ID, same-genotype, same-body, live organism into the destination simulation. Regions not currently installed are frozen rather than being silently simulated or reseeded. Global lineage progression/evolution authority moves with the player; region-local ecology controllers stay with their region.

The first visit to a region seeds **its own initial wild population exactly once**, using a distinct deterministic regional random stream and a global monotonic actor-ID counter. Later visits restore the precise former population and resource state rather than generating a clone. The save file preserves session archives and validates physical location, origin alignment, single traveler ownership and absence of recursive serialized worlds. Archived World stocks are not duplicated in `regionalWorlds`.

Dependent young, pregnancy, active courtship, combat and autonomous player control currently prohibit departing the region. This is a deliberate early limitation to avoid splitting nursing, gestation and combat commitments across independent controllers. Players can return after resolving those obligations.

### Not yet in E15
- Wild creature migrations and player-led family group transfers across a region boundary
- Background life/aging, seed dispersal, disease, river exchange, predator pursuit and reproduction across borders
- Walk-through seamless edge rendering: still a deliberate button action and new-region scene preparation
- Full shared planetary genealogy for simultaneous remote animal reproduction
- Global flora/soil budget ledger, dense continental ocean ecosystems or world-scale simulation scheduling
- Real Chromium playtesting and multiyear evolutionary balance

The core architecture now has player-controlled physically gated expeditions and exact return to inhabited regions. E16 should extend to selected family/cohort transfers and scheduled offscreen ecology without inventing births, resources or skipped time.
