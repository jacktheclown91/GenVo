// Shared physiology (Phase 3J Step 1, creator decision 2026-10-16). One survival physiology for every
// organism, whoever controls it. Removed player-ownership rules (restored by ?physiologyParity=0):
//  - CFG.playerChallenge: the active player's basal energy burn x6 and water use x8 after the opening;
//  - CFG.manualMoveCostScale: manual movement cost 1/6 of the same distance moved autonomously;
//  - the opening immunity (isOpeningProtected: founding family and starter mate unhuntable to day 20);
//  - plant meals: wild bites were capped at 0.16 and gave no water; the player's used the food's own
//    bite size, its energy profile, a diet-variety bonus and water from juicy food. Both now use one rule
//    (below); per unit eaten, energy was already identical, and the energy profile and variety bonus apply
//    to everyone.
// Genuine action costs stay: movement per distance, sprinting, bracing, attacks, handling coats,
// reproduction and healing.
// Plant meals: one rule for everyone. Default = the rule wild ecology was calibrated on (bites capped at 0.16,
// no water from food). The food-property alternative (each food's own bite, water from juicy food) roughly
// doubles wild births in 360-day runs (docs/physiology-parity/), so it awaits a creator decision:
// mealBite:'food', foodWater:true. ?physiologyParity=0 restores the old split (player food rule, wild cap).
export const PHYSIOLOGY_PARITY={enabled:true,mealBite:'wild',foodWater:false};
export const WILD_PLANT_BITE=.16;
// Food properties (creator decision 2026-10-23, GenVo v1): on worlds with this policy every organism
// eats each food's own bite size and handling and gets water from juicy food (dry seed kernels give
// none), the alternative above. Worlds recorded before it keep the rule they were calibrated on.
export const FOOD_PROPERTIES=Object.freeze({policy:'food-properties/1'});
export function foodPropertiesActive(sim){return sim?.foodRules===FOOD_PROPERTIES.policy}
export function mealBiteFor(profile,sim=null){return !PHYSIOLOGY_PARITY.enabled||PHYSIOLOGY_PARITY.mealBite==='food'||foodPropertiesActive(sim)?profile.bite:Math.min(WILD_PLANT_BITE,profile.bite)}
export function plantMealWater(sim=null){return !PHYSIOLOGY_PARITY.enabled||PHYSIOLOGY_PARITY.foodWater||foodPropertiesActive(sim)}
export function restoreFoodRules(sim,core){
 if(core.foodRules!==undefined&&core.foodRules!==FOOD_PROPERTIES.policy)throw Error('Unknown saved food rules.');
 if(core.foodRules===undefined)delete sim.foodRules;
}
const GROUP_MEMORY=4;
// Diet variety for any animal: the same projected-breadth bonus the player's foraging state gives.
export function noteFoodGroup(a,group){if(!a)return;const r=(a.dietRecent??=[]);r.push(group);if(r.length>GROUP_MEMORY)r.shift()}
export function breadthBonusFor(a,group){const recent=[...(a?.dietRecent||[]).slice(-3),group];return 1+Math.max(0,new Set(recent).size-1)*.025}
