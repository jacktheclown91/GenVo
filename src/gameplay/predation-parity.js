// Predation parity (Phase 3H candidate; integrated as the default in Phase 3I by creator decision).
// The player is prey and predator under exactly the rules wildlife uses:
//  - Choice: a hunter begins any hunt, including the Stalker encounter against the player, only when it
//    is hungry by the wildlife threshold (below 72% energy, or needing recovery forage) AND the player is
//    its best-ranked prey (Simulation.bestPrey: suitability, appraisal, distance, perception, refuges).
//    The old rule started an encounter for any hunter below 90% energy (98% in its den core).
//  - Execution: one capture chance, damage, bite-meal, armour-deterrence and bitter-slime rule for every
//    pair (Simulation.tryKill); the Stalker charge no longer adds +0.34 to the bite.
// The encounter remains the hunter's real approach (tells, wind-up, charge lane), and the player's own
// actions (brace, sprint, noise, refuges) still matter. ?predationParity=0 restores the previous rules.
export const PREDATION_PARITY={enabled:true};
