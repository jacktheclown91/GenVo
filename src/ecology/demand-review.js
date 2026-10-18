import {SPECIES} from '../organisms/species.js';
import {bodyMass,basalResourceCosts,ANATOMICAL_MASS,massPolicy} from '../organisms/body-mass.js';
// Historical candidate note: finite reachable carrion is now included by the
// local-edible-biomass/1 food authority. The metabolic competitor weighting below
// remains OFF; that separate proposal has not been adopted.
// Breeding-habitat accounting candidate (Phase 3I Milestone 2; OFF by default, for creator review).
// Investigation of mirelick and podshell found two accounting gaps in the breeding gate
// (EcologicalCarrying.breedingState), which decides whether local food can support offspring:
//  (a) carrion: scavengers eat carrion (mirelick at full preference) but the habitat survey counted only
//      plants and freshwater food. With the candidate, reachable carrion counts at its feeding energy (34).
//  (b) competitors: every overlapping consumer counted as one whole competitor whatever it eats, so a
//      herd of small grazers sharing a little food kept larger specialists "crowded". With the candidate a
//      competitor counts in proportion to its metabolic demand (base metabolism x current body mass /
//      inherited metabolism) relative to the focal animal's. ?demandReview=1 enables.
export const DEMAND_REVIEW={enabled:false};
export function appetite(a){const s=SPECIES[a?.species];return s?(massPolicy(a)===ANATOMICAL_MASS?basalResourceCosts(a).energy:s.baseMetabolism*bodyMass(a))/Math.max(.5,a.genes?.metabolism??1):0}
