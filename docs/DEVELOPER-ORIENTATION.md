# GenVo Developer Orientation Guide

**Role:** Systems Architecture & Development Orientation  
**Project:** GenVo — Living Planet Evolution Survival  
**Collaborators:** Antigravity (Lead Systems Developer) & Codex (Visuals, Animation, UI Presentation & Audio)  
**Target Platform:** Web (HTML5/Canvas/WebAudio) & Native Desktop Wrappers  

---

## 1. Architectural Philosophy & Vision

GenVo is an evolutionary survival simulator aiming for emergent ecological and generational storytelling on a living, persistent procedural planet. Its primary simulation principles are:

1. **Physical & Biological Conservation Laws:**
   - Mass, water, energy, and salt are strictly accounted for and conserved.
   - Water drunk by an animal debits the local water body or plant tissue; eating prey transfers verified biomass into the predator's digestive system; animal excretion and carcass decay return nutrients to soil and flora.
   - Never generate resources, energy, hydration, or movement from thin air to bypass constraints or pass tests.

2. **Single Authoritative Source of Truth:**
   - Every physical and biological fact has exactly one authority module:
     - Anatomy & part definitions: [`src/lineage/part-registry.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/lineage/part-registry.js)
     - Movement profiles & traversal: [`src/lineage/lifestyle.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/lineage/lifestyle.js)
     - Feeding & diets: [`src/ecology/functional-diet.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/ecology/functional-diet.js)
     - Subsurface geology & caves: [`src/world/subsurface.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/world/subsurface.js) and [`src/world/natural-caves.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/world/natural-caves.js)
     - Regional transition & border crossings: [`src/world/planetary-travel.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/world/planetary-travel.js)
     - Persistence & snapshots: [`src/persistence/save-manager.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/persistence/save-manager.js)

3. **Separation of Presentation & Simulation:**
   - Systems logic never directly manipulates the DOM, canvas drawing contexts, or WebAudio nodes.
   - Rendering reads state non-destructively. Queries made by renderer passes (e.g. `movementProfile`, `threatDisplay`, `canOccupy`) are strictly read-only and never consume random number generator states (`sim.rng`).

---

## 2. Collaborator Boundaries & Rules of Engagement

- **Codex Authority:**
  - CSS stylesheets (`src/style.css`, inline presentation layouts).
  - Canvas sprite rendering, limb kinematics drawing, and particle effects ([`src/render/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/render/)).
  - UI markup layout, modals, menus, and typography formatting ([`src/ui/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/ui/)).
  - Procedural WebAudio sound synthesizers ([`src/audio/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/audio/)).
  - **Rule:** Never overwrite or alter presentation assets, aesthetic palettes, audio syntheses, or CSS layouts during systems work without direct coordination.

- **Antigravity Authority:**
  - Simulation loop, FrameStepper, tick slicing, and input queues ([`src/sim/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/sim/)).
  - Planetary geography, regional atlas, biome founding, and seamless frontier crossings ([`src/world/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/world/)).
  - Ecological cycles, population models, predation, metabolism, and hydrology ([`src/ecology/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/ecology/)).
  - Genetic recombination, body inheritance, mutation trees, and lineage tracking ([`src/lineage/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/lineage/)).
  - Persistence, compression, scenario migration, and snapshot schemas ([`src/persistence/`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/persistence/)).

---

## 3. Core Simulation & Execution Model

### The Tick Pipeline
- Real simulation time progresses in discrete biological steps called ticks (`CFG.simHz = 8` ticks per second in normal play).
- A day consists of `CFG.dayTicks` (48 ticks in modern 30-second days; 6-second legacy option exists).
- Each tick executes atomically in [`src/sim/simulation.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/sim/simulation.js):
  1. Weather, temperature, and seasonal shifts.
  2. Soil moisture, hydrology, and plant growth/seed dispersal.
  3. Animal metabolism, respiration, and thermal demand.
  4. Cognitive intents (foraging, seeking water, fleeing, courting, social following).
  5. Physical movement, collision resolution, and territory claims.
  6. Feeding, drinking, combat strikes, mating, and birth/death resolution.
  7. Spatial index rebuild (`rebuildSpatial()`).

### Sliced Ticks & Frame Stepping
- For high frame rate display on low-power devices, long simulation ticks can be sliced into sub-frame execution intervals via [`src/sim/frame-stepper.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/sim/frame-stepper.js).
- Input responsiveness is preserved using [`src/ui/movement-input-buffer.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/ui/movement-input-buffer.js), ensuring short taps (down to 100 ms) are never dropped even if an atomic tick is in progress.

---

## 4. Planetary Architecture & Seamless Exploration

1. **Procedural Planetary Window:**
   - The planet is partitioned into seamless 128×128 tile regions managed by `PlanetRegionAtlas` ([`src/world/planet-atlas.js`](file:///c:/Users/jackt/Desktop/Games/game%20jam%20october/genvo-toolkit/src/world/planet-atlas.js)).
   - Continuous coordinate projection ensures global elevation, hydrology, and temperature continuity across boundaries.

2. **Frontier Crossing Pipeline:**
   - As an animal nears a boundary, `PlanetaryPreparation` asynchronously prepares the destination region in the background.
   - When stepping over the border line:
     - `strippedRegionSnapshot` captures departing regional state while stripping the traveler cohort.
     - `foundRegionalPopulations` populates new regions based on native ecological carrying capacities without artificial quotas.
     - `crossPlanetaryBorder` performs an atomic, deterministic migration handoff preserving exact identities, parentage, inventories, and elapsed world time.

---

## 5. Verification & Test Suite

GenVo maintains a comprehensive automated quality gate:
```bash
# Run the complete playable test suite (111 focused checks)
node tools/check-playable.mjs
```
- Every feature or optimization must preserve 100% passing tests.
- Never write tests that fake numbers, inject free energy, or fabricate mutations.
- Keep tests fast and deterministic by relying on seeded RNG (`new RNG(seed)`).

---

## 6. Release & Packaging Pipeline

To produce a self-contained, offline-compatible release package for itch.io or web distribution:
```bash
python tools/package-itch-preview.py . ../GenVo-web.zip reports/itch-release-report.json
```
The packaging script verifies:
- File count limits (< 1000 files) and payload sizes (< 500 MB).
- Valid `index.html` at archive root.
- SHA-256 integrity of all scenario checkpoints in `assets/scenarios/catalog.json`.
- Strict absence of broken symbolic links or corrupted zip entries.
