// Developmental symmetry (creator decision 2026-10-16). Homologous left/right structures develop from shared
// instructions: a mutation to one member of a mirrored pair (limb 1/7, 2/6, 3/5, left/right eyes and flanks,
// and spurs on mirrored legs) changes both, and front and hind pairs stay free to differ. Measured before
// this module (tools/symmetry-audit.mjs, docs/symmetry/): bodies were already mostly symmetric, but a paired
// mutation could half-apply silently (the first side succeeded, the mirror failed), and spur mutations
// always went onto one foreleg only.
// Now:
//  - paired mutations are all-or-nothing: if the mirrored side cannot develop the change, the mutation fails
//    and the body is unchanged;
//  - spur mutations go onto a mirrored pair of legs;
//  - asymmetry is still possible, but only through a deliberate developmental route: with probability
//    ASYMMETRIC_SHARE a mutation event expresses on one side only (one leg of a pair becomes a reachable variant,
//    or one leg of a pair gains a spur). It is inherited like any other anatomy.
// Existing bodies are never rewritten; recombination already inherits mirrored pairs as a unit, so an inherited
// asymmetric pair stays as it was. Consequences of asymmetry come from the parts' real function, with no
// separate penalty. Midline sockets (limb 0/4, mouth, dorsal, tail) have no partner. ?developmentalSymmetry=0
// restores the previous mutation behaviour. ASYMMETRIC_SHARE is a PROPOSAL.
export const DEVELOPMENTAL_SYMMETRY={enabled:true};
export const ASYMMETRIC_SHARE=.05;
