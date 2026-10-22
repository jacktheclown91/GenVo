import {coldFloraTemperatureFactor} from './cold-flora.js';

// Plant lifecycle (plant-lifecycle/1, creator direction 2026-10-22). New
// planetary worlds only; historical worlds keep the continuous rules.
//  - Drought stress: chronic moisture mismatch kills tissue in proportion to
//    the mismatch (inherited water need against habitat moisture), so a plant
//    in the wrong habitat dies back instead of lingering at reduced growth.
//    Seasonal cold is dormancy, not stress (cold specialists already have heat
//    die-back).
//  - Senescence: living tissue turns over at a rate tied to the plant's own
//    growth rate (fast groundcover short-lived, slow woody tissue long-lived);
//    dead tissue becomes litter and regrowth stays funded by water, minerals
//    and stored energy.
//  - Flowering conditions: flowering and seed release need suitable local
//    conditions — the same moisture x temperature fit seed germination uses.
// All losses go to the existing plant-litter route; nothing is created.
export const PLANT_LIFECYCLE=Object.freeze({policy:'plant-lifecycle/1',droughtLoss:.02,turnoverPerGrowth:.25,floweringFit:.5});
export const plantLifecycleEnabled=sim=>sim?.plantLifecycleRules===PLANT_LIFECYCLE.policy;
export const moistureFit=(waterNeed,moisture)=>Math.max(0,1-Math.abs(moisture-waterNeed)*1.75);
// Local suitability shared with germination: inherited water need and the
// kind's temperature response.
export function siteFit(kind,waterNeed,moisture,temp){return moistureFit(waterNeed,moisture)*coldFloraTemperatureFactor(kind,temp)}
// Daily tissue losses for a standing producer with phenotype p.
export function lifecycleLosses(current,p,moisture){
 if(!(current>0))return{stress:0,senescence:0};
 const stress=current*PLANT_LIFECYCLE.droughtLoss*(1-moistureFit(p.waterNeed,moisture));
 const senescence=current*Math.min(.05,p.growth*PLANT_LIFECYCLE.turnoverPerGrowth);
 return{stress,senescence};
}
export function canFlower(kind,waterNeed,moisture,temp){return siteFit(kind,waterNeed,moisture,temp)>=PLANT_LIFECYCLE.floweringFit}
export function validatePlantLifecycleRules(core){
 if(core.plantLifecycleRules!==undefined&&core.plantLifecycleRules!==PLANT_LIFECYCLE.policy)throw Error('Unknown plant lifecycle policy.');
}
