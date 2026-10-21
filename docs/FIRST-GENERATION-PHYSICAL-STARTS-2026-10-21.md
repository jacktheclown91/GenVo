# First-generation physical starts | 2026-10-21

## Purpose

The default new game remains **one ordinary starter creature in a living ecosystem**. The New World menu additionally offers four clearly labeled quick starts for players who want to experience the biological differences immediately: spring jumper, burrower, tree climber, and shore swimmer/diver.

These starts are **explicitly authored G1 adult pairs**, not free mutations, simulated ancestry, fake naturally evolved creatures, or wildlife spawned from nothing without a receipt. They reuse `FounderDesign('guided')` and normal `place` / `advance` / `validateFounderDesign` contracts. Climbing requires a real intermediate authored grasper step before two climber legs. The authored-introduction ledger records both bodies, ages, masses, energy and hydration, and the selected focus. Neither founder has an invented biological birth day.

The placement search examines **existing** living canopy load and woodspire biomass, real dry excavatable soil, valid spring launch ground, or a shore adjoining a genuine diveable water column. A preset with no usable habitat **fails visibly** and suggests another world seed, rather than spawning water, trees, soil or special attacks. It does not guarantee that enemies, mates or rewards are conveniently staged.

The real authorities remain:
- Jumping: `jumpAvailability`, `launchJump` and paid spring-leg mechanics.
- Burrowing: `burrowingStatus` and conserved excavation.
- Climbing: canopy `roostAvailability`, persistent `startClimb` and load support.
- Diving: `divingAvailability`, `setDiveTarget`, real depth and limited air.

Use the New World selector and pick a labeled movement start. The chosen body, resources and provenance save normally, and the beginning of play shows a short instruction drawn from the selection. Continue and historical world policies remain unchanged. The default creature is unchanged.

## Verification and limits

`tests/physical-starter-presets.mjs` verifies all four guided plans, genuine site constraints and each execution authority, snapshot continuation and zero invented world resources. The normal authored-founder regression also runs.

Pending: actual new-player Chromium playthroughs, mouse-first action feedback at the selected site, authored animation approvals, and the full 20–40 minute performance target. This pass makes anatomy accessible, but **one session only receives the selected specialization** and the full first-generation narrative remains a separate acceptance gate. No AI is granted nonexistent abilities.
