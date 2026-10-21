# First-generation physical starts | 2026-10-21

## Purpose

The default new game remains **one ordinary starter creature in a living ecosystem**. The New World menu additionally offers four clearly labeled quick starts for players who want to experience the biological differences immediately: spring jumper, burrower, winged flier, and shore swimmer/diver.

These starts are **explicitly authored G1 adult pairs**, not free mutations, simulated ancestry, fake naturally evolved creatures, or wildlife spawned from nothing without a receipt. They reuse `FounderDesign('guided')` and normal `place` / `advance` / `validateFounderDesign` contracts. Winged flight requires real authored filament, feather mantle, proto-wing, then powered-wing design steps. These are legal design precursors, not four fabricated generations. The authored-introduction ledger records both bodies, ages, masses, energy and hydration, and the selected focus. Neither founder has an invented biological birth day.

The placement search examines **existing** real dry excavatable soil, valid spring-launch and winged takeoff ground, or a shore adjoining a genuine diveable water column. A preset with no usable habitat **fails visibly** and suggests another world seed, rather than spawning water, trees, soil or special attacks. It does not guarantee that enemies, mates or rewards are conveniently staged.

The real authorities remain:
- Jumping: `jumpAvailability`, `launchJump` and paid spring-leg mechanics.
- Burrowing: `burrowingStatus` and conserved excavation.
- Powered flight: `flightAvailability`, `takeoff`, inherited-wing body mass capacity, and finite energy.
- Diving: `divingAvailability`, `setDiveTarget`, real depth and limited air.

Use the New World selector and pick a labeled movement start. The chosen body, resources and provenance save normally, and the beginning of play shows a short instruction drawn from the selection. Continue and historical world policies remain unchanged. The default creature is unchanged.

## Verification and limits

`tests/physical-starter-presets.mjs` verifies all four guided plans, genuine site constraints and each execution authority, snapshot continuation and zero invented world resources. The normal authored-founder regression also runs.

Pending: actual new-player Chromium playthroughs, mouse-first action feedback at the selected site, authored animation approvals, and the full 20–40 minute performance target. This pass makes anatomy accessible, but **one session only receives the selected specialization** and the full first-generation narrative remains a separate acceptance gate. No AI is granted nonexistent abilities.

**Day 1 canopy constraint verified in CI:** In a real freshly generated test world, maximum Woodspire biomass was 0.2954, while climbing requires at least 0.85. Rather than spawning instant mature trees or bypassing canopy support, the original climber quick start was replaced with a genuinely flyable winged lineage. Tree climbing remains available through ordinary anatomy in mature woodland and prepared evolved worlds.
