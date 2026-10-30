// Grazing nutrients (grazing-nutrients/1, stabilization October 30): the minerals
// in plant tissue an animal digests return to the soil where it fed, as dung and
// urine return them in real grazing systems. Without it every mouthful removed
// its minerals from the ecosystem for good: in a new-game start region 30% of all
// minerals (soil, plants, litter and carrion) were gone within half a year, plant
// growth became mineral-limited and the land's capacity kept shrinking.
// Only the digested tissue returns here. Discarded tissue already becomes litter
// (mineralized when it decays) and carried seeds become plants elsewhere.
import {PLANT_RESOURCE_UNITS} from './plant-resources.js';
export const GRAZING_NUTRIENTS=Object.freeze({policy:'grazing-nutrients/1'});
export const grazingNutrientsEnabled=sim=>sim?.grazingNutrientRules===GRAZING_NUTRIENTS.policy;
export function returnGrazedMinerals(sim,i,digested){
 if(!grazingNutrientsEnabled(sim)||!(digested>0))return 0;
 const r=sim.world?.plantResources;if(!r?.minerals)return 0;
 const minerals=digested*PLANT_RESOURCE_UNITS.mineralPerBiomass;
 r.minerals[i]+=minerals;r.totals.excretedMinerals=(r.totals.excretedMinerals||0)+minerals;
 return minerals;
}
export function restoreGrazingNutrientRules(sim,core){
 if(core.grazingNutrientRules===undefined)delete sim.grazingNutrientRules;
 else if(core.grazingNutrientRules!==GRAZING_NUTRIENTS.policy)throw Error('Unknown saved grazing nutrient rules.');
 const excreted=sim.world?.plantResources?.totals?.excretedMinerals;
 if(excreted!==undefined&&(!Number.isFinite(excreted)||excreted<0))throw Error('Invalid excreted mineral total.');
 if(excreted&&!grazingNutrientsEnabled(sim))throw Error('Saved excreted minerals without the recorded grazing nutrient rule.');
}
