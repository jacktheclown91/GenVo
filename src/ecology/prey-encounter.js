// Rarity is not armour (Phase 3J Step 2, creator decision 2026-10-16). A rare population should face less
// predation because predators MEET it less often, not because a population counter protects an individual
// that a hunter has already found or touched. With this on:
//  - contact: Simulation.tryKill no longer lowers capture odds for locally scarce species (scarceFloor .15);
//  - choice: Simulation.bestPrey no longer reads WORLD-WIDE population (the global-frequency term, the
//    rarityRefuge value cut below 18%/32% of the commonest edible species, and RecoveryController's
//    global-ratio prey refuge), which no hunter could perceive.
// Kept: who is actually within range and perceptible, local abundance (a hunter's search image favours prey
// it meets often), anatomy, vigilance, speed, cover, refuges, distance, defences and capture likelihood.
// ?rarityReview=0 restores the old rules.
export const RARITY_REVIEW={enabled:true};
