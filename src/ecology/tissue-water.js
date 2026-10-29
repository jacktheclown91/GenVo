import {SPECIES} from '../organisms/species.js';
import {toReserve,toAbsolute} from '../organisms/body-size.js';

// Water from prey and carrion (creator decision 2026-10-23, GenVo v1 survival rebalance). Fresh
// animal tissue is mostly water. On worlds with this policy, eating tissue returns water from the
// eaten animal's own body water, nothing more:
//  - a bite from a living prey carries the eaten share of the prey's current water, which the prey
//    loses (a wounded animal loses water with its tissue);
//  - a carcass keeps the dead animal's remaining body water with its tissue (world.carrionWater);
//  - carrion water dries each day, faster when warm, and can never exceed what the remaining
//    tissue holds; scavengers get the share of the cell's water that matches the tissue they eat.
// Water beyond the eater's capacity is lost, never stored, so no water is created. Every organism,
// player or wild, follows the same rule. Drinking is unchanged: animals still seek and drink water
// when they need it; tissue water only reduces how often. Worlds recorded before this policy keep
// dry meat.
export const TISSUE_WATER=Object.freeze({policy:'tissue-water/1',
 // Most hydration units one unit of carcass tissue can hold, and the share that dries per day
 // (scaled by warmth): fresh carrion is wet for a day or two and dry within a few.
 waterPerTissue:40,dryPerDay:.35});
export function tissueWaterActive(sim){return sim?.tissueWaterRules===TISSUE_WATER.policy}
// Water accounting for conservation checks (sim.stats.tissueWater).
function ledger(sim){return sim.stats.tissueWater??={fromPrey:0,carcassDeposited:0,fromCarrion:0,dried:0,overflowLost:0}}
function drink(sim,a,water,source){const s=SPECIES[a.species];if(!s||!(water>0))return 0;const before=a.hydration;a.hydration=Math.min(s.maxHydration,a.hydration+toReserve(a,water));const got=toAbsolute(a,a.hydration-before),l=ledger(sim);l[source]+=water;l.overflowLost+=water-got;return got}
// A predator eats `meal` tissue from `prey`, which held `remainingBefore` tissue before the bite.
// Returns the water the predator gained.
export function waterFromPrey(sim,pred,prey,meal,remainingBefore){
 if(!tissueWaterActive(sim)||!(meal>0)||!(remainingBefore>0))return 0;
 const share=Math.min(1,meal/remainingBefore),held=Math.max(0,prey.hydration)*share,water=toAbsolute(prey,held);prey.hydration=Math.max(0,prey.hydration-held);
 return drink(sim,pred,water,'fromPrey');
}
// A body becomes carcass tissue: its remaining water stays with it.
export function depositCarcassWater(sim,animal,i,tissue){
 if(!tissueWaterActive(sim)||!(tissue>0))return;const w=sim.world;w.carrionWater??=new Float32Array(w.len);
 const water=toAbsolute(animal,Math.max(0,animal.hydration));w.carrionWater[i]+=water;ledger(sim).carcassDeposited+=water;animal.hydration=0;
}
// An eater takes `got` tissue from carrion cell i, which held `before` tissue. Returns water gained.
export function waterFromCarrion(sim,a,i,got,before){
 if(!tissueWaterActive(sim)||!(got>0)||!(before>0))return 0;const w=sim.world;if(!w.carrionWater)return 0;
 const water=w.carrionWater[i]*Math.min(1,got/before);w.carrionWater[i]-=water;return drink(sim,a,water,'fromCarrion');
}
// Once a day: carrion water dries, and never exceeds what the remaining tissue holds.
export function dryCarrion(sim){
 const w=sim.world,cw=w.carrionWater;if(!tissueWaterActive(sim)||!cw)return;const warmth=Math.max(.2,Math.min(1.6,.5+(sim.climate?.temp??.5)));
 const l=ledger(sim);for(let i=0;i<cw.length;i++){if(!(cw[i]>0))continue;const before=cw[i];cw[i]=Math.min(cw[i]*Math.max(0,1-TISSUE_WATER.dryPerDay*warmth),Math.max(0,w.carrion[i])*TISSUE_WATER.waterPerTissue);if(cw[i]<1e-6)cw[i]=0;l.dried+=before-cw[i]}
}
export function restoreTissueWater(sim,core){
 if(core.tissueWaterRules!==undefined&&core.tissueWaterRules!==TISSUE_WATER.policy)throw Error('Unknown saved tissue-water rules.');
 if(core.tissueWaterRules===undefined)delete sim.tissueWaterRules;
}
