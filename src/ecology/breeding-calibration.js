import {SPECIES} from '../organisms/species.js';
// PROVISIONALLY ADOPTED AS DEFAULT (creator decision 2026-10-15), pending whole-life validation
// before the values are locked. ?breedingReview=0 restores the previous values for comparison.
//
// Problem: rillsifter, mirelick and podshell are well fed (mean energy 0.76-0.82, at or above their
// own reproductive energy requirement), yet their accessible-forage survey never reaches the
// breeding minimum anywhere: measured over 3 seeds x 6 times, best values 3.67 / 3.83 / 4.96 against
// minimums 4 / 5 / 5. Their narrower diets give a lower standing-food density on the shared scale
// that broad-diet grazers were calibrated on, so the requirement is unreachable, not selective.
//
// Candidate: anchor each species' minimum at the 75th percentile of its OWN measured accessible
// forage (only the top quarter of realistic habitat qualifies) and its optimum at the best observed
// value. This is stricter than mosskip's current calibration (minimum below its 25th percentile).
// No food, seeds or births are created; crowding, energy, maturity, kinship, mate choice and
// gestation gates are unchanged, and bankjaw (a different, hunting constraint) is not touched.
export const BREEDING_REVIEW={enabled:true};
export const REVIEW_FORAGE=Object.freeze({
 rillsifter:Object.freeze({minForage:2.9,optimalForage:3.7}),
 mirelick:Object.freeze({minForage:2.8,optimalForage:3.8}),
 podshell:Object.freeze({minForage:4.2,optimalForage:5.0}),
});
export function reproductionFor(species){
 const base=SPECIES[species]?.reproduction||{};
 return BREEDING_REVIEW.enabled&&REVIEW_FORAGE[species]?{...base,...REVIEW_FORAGE[species]}:base;
}

// Life-history review candidates (Milestone D), OFF BY DEFAULT; ?lifeHistory=1 enables both.
//  fundedGate: an animal may breed when its reserves can pay its species' actual reproduction cost and
//    still keep a survival floor (reproCost/maxEnergy + LIFE_HISTORY_FLOOR, within 0.5-0.8), instead of
//    a fixed per-species threshold. Shared rule for every species.
//  conditionRecovery: after a birth, recovery ends once a minimum care period (the species' gestation
//    length) has passed AND the mother's reserves are back above her breeding gate; a mother in poor
//    condition still waits the full postpartum period. Shared rule for every species.
export const LIFE_HISTORY={fundedGate:false,conditionRecovery:false};
export const LIFE_HISTORY_FLOOR=.35;
export function breedingEnergyGate(species){
 const s=SPECIES[species];if(!s)return .72;
 if(LIFE_HISTORY.fundedGate&&s.reproCost&&s.maxEnergy)return Math.max(.5,Math.min(.8,s.reproCost/s.maxEnergy+LIFE_HISTORY_FLOOR));
 return s.reproduction?.energy??.72;
}
