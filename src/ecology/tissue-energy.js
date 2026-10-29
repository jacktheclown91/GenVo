import {SPECIES} from '../organisms/species.js';
import {toAbsolute} from '../organisms/body-size.js';
import {bodyMass} from '../organisms/body-mass.js';
import {METABOLISM,metabolismActive} from './metabolism-policy.js';

// Energy in animal tissue from a physical basis (creator direction 2026-10-23, option 1 of
// docs/WILDLIFE-NEEDS-2026-10-23.md). Recorded worlds count 34 energy units per unit of tissue mass,
// set when daily needs were tiny; under real needs a kill fed a hunter for about 3 days. On worlds
// with this policy and real needs, tissue energy is derived in each eater's own energy units:
//  - real needs calibrate a species' resting day to maxEnergy / reserveDaysFood units;
//  - Kleiber's law puts a resting day at about 70 * M^0.75 kcal (M in kg, the game's mass unit), which
//    fixes how many energy units a kcal is for that species;
//  - whole small-vertebrate carcasses hold about 1.5 kcal per gram wet mass, and meat is about 85%
//    assimilated.
// One kill meal is at most what fills the eater's reserves and at most a gorge of 20% of its body
// mass; the rest stays on the carcass as carrion (recorded worlds consume the whole body at once and
// lose what does not fit). Wildlife and the player follow the same rules: kills, wound bites and
// carrion. Growing and repairing tissue keep the recorded cost for now (tissueEnergy below).
export const TISSUE_ENERGY=Object.freeze({policy:'tissue-energy/1',recorded:34,
 kleiberKcal:70,carcassKcalPerMass:1500,assimilation:.85,gorgeShare:.2});
export function tissueEnergyActive(sim){return sim?.tissueEnergyRules===TISSUE_ENERGY.policy&&metabolismActive(sim)}
function unitsPerKcal(a){const s=SPECIES[a.species];return s.maxEnergy/METABOLISM.reserveDaysFood/(TISSUE_ENERGY.kleiberKcal*s.mass**.75)}
const physical=a=>TISSUE_ENERGY.carcassKcalPerMass*unitsPerKcal(a);
// Energy one unit of this animal's tissue mass costs it to grow or repair. Creator decision
// 2026-10-23: the recorded cost for now, because development is time-compressed (a mosskip matures in
// 20 days) and the physical cost starved the young (docs/YIELDS-2026-10-23.md).
// sim.correctionExperiment.tissueGrowth=true (development measurement only) applies the physical cost.
export function tissueEnergy(sim,a){return tissueEnergyActive(sim)&&SPECIES[a?.species]&&sim.correctionExperiment?.tissueGrowth===true?physical(a):TISSUE_ENERGY.recorded}
// Energy an eater gains per unit of tissue eaten (before diet preference and digestion).
export function meatEnergy(sim,eater){return tissueEnergyActive(sim)&&SPECIES[eater?.species]?physical(eater)*TISSUE_ENERGY.assimilation:TISSUE_ENERGY.recorded}
// Most tissue an eater takes at one kill, given the energy it gains per unit mass. Unlimited on
// recorded worlds.
export function killMealLimit(sim,eater,energyPerMass){
 if(!tissueEnergyActive(sim))return Infinity;const s=SPECIES[eater.species];
 return Math.max(0,Math.min(bodyMass(eater)*TISSUE_ENERGY.gorgeShare,toAbsolute(eater,s.maxEnergy-eater.energy)/Math.max(1e-9,energyPerMass)));
}
export function restoreTissueEnergy(sim,core){
 if(core.tissueEnergyRules!==undefined&&core.tissueEnergyRules!==TISSUE_ENERGY.policy)throw Error('Unknown saved tissue-energy rules.');
 if(core.tissueEnergyRules===undefined)delete sim.tissueEnergyRules;
}
