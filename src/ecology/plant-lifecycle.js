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
//    conditions, the same moisture x temperature fit seed germination uses.
// All losses go to the existing plant-litter route; nothing is created.
export const PLANT_LIFECYCLE=Object.freeze({policy:'plant-lifecycle/1',droughtLoss:.02,turnoverPerGrowth:.25,floweringFit:.5});
export const plantLifecycleEnabled=sim=>sim?.plantLifecycleRules===PLANT_LIFECYCLE.policy;
export const moistureFit=(waterNeed,moisture)=>Math.max(0,1-Math.abs(moisture-waterNeed)*1.75);
// Local suitability shared with germination: inherited water need and the
// kind's temperature response.
export function siteFit(kind,waterNeed,moisture,temp){return moistureFit(waterNeed,moisture)*coldFloraTemperatureFactor(kind,temp)}
// Evaluation variants (runtime experiment switch, never saved). `base`
// reproduces plant-lifecycle/1 exactly and is the default.
//  dormancy: tissue turns over only while metabolically active, senescence is
//    scaled by the kind's temperature response, so winter-dormant tissue holds.
//  chronic: drought stress only below a moisture fit of chronicFit, scaled to
//    zero at that fit, so marginal-but-viable sites are not taxed.
//  lean: dormancy and chronic, and senescence counts only turnover beyond the
//    0.4%/day maintenance loss the growth rule already returns to litter
//    (simulation.js grow), instead of stacking a second full turnover.
//  turnover: lean without drought stress (option C): niche failure is left
//    to competition rather than a moisture penalty.
export const LIFECYCLE_VARIANTS=Object.freeze({
 base:Object.freeze({dormancy:false,chronicFit:1}),
 dormancy:Object.freeze({dormancy:true,chronicFit:1}),
 chronic:Object.freeze({dormancy:false,chronicFit:.5}),
 combined:Object.freeze({dormancy:true,chronicFit:.5}),
 lean:Object.freeze({dormancy:true,chronicFit:.5,existingLoss:.004}),
 turnover:Object.freeze({dormancy:true,chronicFit:.5,existingLoss:.004,noStress:true})});
let variant=LIFECYCLE_VARIANTS.base;
export function setLifecycleVariant(name){if(!LIFECYCLE_VARIANTS[name])throw Error('Unknown lifecycle variant: '+name);variant=LIFECYCLE_VARIANTS[name];return name}
export const lifecycleVariant=()=>variant;
// Daily tissue losses for a standing producer with phenotype p. kind and temp
// are needed only by the dormancy variant.
export function lifecycleLosses(current,p,moisture,kind=null,temp=null){
 if(!(current>0))return{stress:0,senescence:0};
 const fit=moistureFit(p.waterNeed,moisture),c=variant.chronicFit,mismatch=c>=1?1-fit:Math.max(0,(c-fit)/c);
 const stress=variant.noStress?0:current*PLANT_LIFECYCLE.droughtLoss*mismatch;
 const activity=variant.dormancy&&kind!==null&&temp!==null?coldFloraTemperatureFactor(kind,temp):1;
 const senescence=current*Math.max(0,Math.min(.05,p.growth*PLANT_LIFECYCLE.turnoverPerGrowth)-(variant.existingLoss||0))*activity;
 return{stress,senescence};
}
export function canFlower(kind,waterNeed,moisture,temp){return siteFit(kind,waterNeed,moisture,temp)>=PLANT_LIFECYCLE.floweringFit}
export function validatePlantLifecycleRules(core){
 if(core.plantLifecycleRules!==undefined&&core.plantLifecycleRules!==PLANT_LIFECYCLE.policy)throw Error('Unknown plant lifecycle policy.');
}
