import {PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {FRESHWATER_FOOD,growthOf} from './freshwater-food.js';
import {canHunt,preyPreference} from './functional-diet.js';
import {preyBodyMass} from './prey-biomass.js';
import {captureLikelihood} from './juvenile-biology.js';
import {founderDailyNeed,FOUNDING_RANGE,TISSUE_ENERGY} from './resource-founding.js';

// Shared breeding support (breeding-support/1, creator direction 2026-10-22).
// One rule for every living body, founders, evolved descendants, hybrids and
// new lineages, with no species-named thresholds:
//   production: food this body's anatomy can renew each day around it, the
//     regrowth of plants and water food its mouth reaches (from the same
//     accessible-food survey the breeding check already performs), carrion
//     inflow, and, for bodies that can hunt, prey turnover weighted by actual
//     capture ability;
//   share: production divided among local consumers whose diets truly overlap
//     (consumer-equivalent dietary demand), so competition, not a species cap,
//     limits crowding;
//   need: the body's own anatomical maintenance (resource-founding's daily
//     need) times one shared reproductive margin for funding offspring.
// Breeding is supported only when the share exceeds that need. Nothing here
// creates food or guarantees reproduction; extinction remains possible.
export const BREEDING_SUPPORT=Object.freeze({policy:'breeding-support/1',reproductiveMargin:1.5,sampleArea:9,carrionTurnover:.03,radius:10});
export const breedingSupportEnabled=sim=>sim?.breedingSupportRules===BREEDING_SUPPORT.policy;
// Renewable daily energy over the surveyed rows (each sample stands for a 3x3 area).
export function renewableSupply(sim,a,supply){
 let production=0;
 for(const r of supply.rows){
  if(r.kind==='carrion'){production+=r.energy*r.preference*BREEDING_SUPPORT.carrionTurnover;continue}
  if(r.wet){const P=FRESHWATER_FOOD[r.kind];if(!P)continue;const f=r.stock??r.energy/P.nutrition,regrow=growthOf(r.kind,P)*f*Math.max(0,1-f/(P.carry||1)),net=P.source?regrow-(P.upkeep||0)*f:regrow;if(net>0)production+=net*P.nutrition*r.preference;continue}
  const P=PLANTS[r.kind];if(!P)continue;const s=r.stock??r.energy/P.nutrition;production+=P.growth*s*Math.max(0,1-s/P.carry)*P.nutrition*r.preference;
 }
 production*=BREEDING_SUPPORT.sampleArea;
 if(canHunt(a))sim.forEachNearby(a,FOUNDING_RANGE,b=>{if(b===a||!b.alive||Math.hypot(b.x-a.x,b.y-a.y)>FOUNDING_RANGE)return;const p=preyPreference(a,b);if(p>0)production+=preyBodyMass(b)*TISSUE_ENERGY*p*captureLikelihood(a,b)/Math.max(1,SPECIES[b.species]?.lifespan||365)});
 return production;
}
export const breedingNeed=a=>founderDailyNeed(a.species,a)*BREEDING_SUPPORT.reproductiveMargin;
export function breedingSupport(sim,a,supply,competitors){
 const production=renewableSupply(sim,a,supply),share=production/(1+Math.max(0,competitors)),need=breedingNeed(a);
 const ratio=need>0?share/need:0,resource=Math.max(0,Math.min(1.12,ratio-1));
 return{production,share,need,supportRatio:ratio,resource};
}
export function validateBreedingSupportRules(core){
 if(core.breedingSupportRules!==undefined&&core.breedingSupportRules!==BREEDING_SUPPORT.policy)throw Error('Unknown breeding support policy.');
}
