import {PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {FRESHWATER_FOOD,growthOf} from './freshwater-food.js';
import {canHunt,preyPreference} from './functional-diet.js';
import {preyBodyMass} from './prey-biomass.js';
import {captureLikelihood} from './juvenile-biology.js';
import {founderDailyNeed,dailyMetabolicNeed,FOUNDING_RANGE,TISSUE_ENERGY} from './resource-founding.js';
import {MEASURED_BREEDING_SUPPORT,measuredRegrowth,regrowthPerCell} from './plant-regrowth.js';
import {toAbsolute} from '../organisms/body-size.js';

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
// breeding-support/2 (stabilization, October 30) measures what plants and bodies
// actually do: production is the plants' measured regrowth (plant-regrowth.js),
// and need is the body's own measured daily spending times the same margin. Under
// /1 the logistic estimate ran up to seventeen times real regrowth and the need
// (basal x 2 x 1.5) stood about a third above what bodies spend.
export const BREEDING_SUPPORT=Object.freeze({policy:'breeding-support/1',measured:MEASURED_BREEDING_SUPPORT,reproductiveMargin:1.5,sampleArea:9,carrionTurnover:.03,radius:10,spendingDays:10});
export const breedingSupportEnabled=sim=>sim?.breedingSupportRules===BREEDING_SUPPORT.policy||sim?.breedingSupportRules===BREEDING_SUPPORT.measured;
// Renewable daily energy over the surveyed rows (each sample stands for a 3x3 area).
export function renewableSupply(sim,a,supply){
 let production=0;
 for(const r of supply.rows){
  if(r.kind==='carrion'){production+=r.energy*r.preference*BREEDING_SUPPORT.carrionTurnover;continue}
  if(r.wet){const P=FRESHWATER_FOOD[r.kind];if(!P)continue;const f=r.stock??r.energy/P.nutrition,regrow=growthOf(r.kind,P)*f*Math.max(0,1-f/(P.carry||1)),net=P.source?regrow-(P.upkeep||0)*f:regrow;if(net>0)production+=net*P.nutrition*r.preference;continue}
  const P=PLANTS[r.kind];if(!P)continue;const measured=measuredRegrowth(sim)?regrowthPerCell(sim.world,r.kind,r.x,r.y):null;
  // Measured regrowth converts to the energy this body gains from it when eating.
  if(measured!==null){production+=measured*sim.plantEnergyPerBiomass(a,r.kind,r.preference);continue}
  const s=r.stock??r.energy/P.nutrition;production+=P.growth*s*Math.max(0,1-s/P.carry)*P.nutrition*r.preference;
 }
 production*=BREEDING_SUPPORT.sampleArea;
 if(canHunt(a))sim.forEachNearby(a,FOUNDING_RANGE,b=>{if(b===a||!b.alive||Math.hypot(b.x-a.x,b.y-a.y)>FOUNDING_RANGE)return;const p=preyPreference(a,b);if(p>0)production+=preyBodyMass(b)*TISSUE_ENERGY*p*captureLikelihood(a,b)/Math.max(1,SPECIES[b.species]?.lifespan||365)});
 return production;
}
export const breedingNeed=(a,sim=null)=>(measuredRegrowth(sim)&&a.spendDays>0?toAbsolute(a,a.spendRate):dailyMetabolicNeed(a.species,a,sim))*BREEDING_SUPPORT.reproductiveMargin;
// breeding-support/2: each body's running mean of the energy it actually spends a
// day (every fall in its reserve; a tick that also feeds counts net). The mean
// covers the last ten days, a plain mean until ten exist.
export function trackEnergySpending(sim,a){
 if(!measuredRegrowth(sim))return;const e=a.energy;
 if(a.spendDay!==sim.day){if(a.spendDay!==undefined){const daily=a.spentToday/Math.max(1,sim.day-a.spendDay),n=Math.min(BREEDING_SUPPORT.spendingDays,(a.spendDays||0)+1);a.spendRate=a.spendDays?a.spendRate+(daily-a.spendRate)/n:daily;a.spendDays=(a.spendDays||0)+1}a.spentToday=0;a.spendDay=sim.day}
 if(a.spendMark!==undefined&&e<a.spendMark)a.spentToday+=a.spendMark-e;a.spendMark=e;
}
export function breedingSupport(sim,a,supply,competitors){
 const production=renewableSupply(sim,a,supply),share=production/(1+Math.max(0,competitors)),need=breedingNeed(a,sim);
 const ratio=need>0?share/need:0,resource=Math.max(0,Math.min(1.12,ratio-1));
 return{production,share,need,supportRatio:ratio,resource};
}
export function validateBreedingSupportRules(core){
 if(core.breedingSupportRules!==undefined&&core.breedingSupportRules!==BREEDING_SUPPORT.policy&&core.breedingSupportRules!==BREEDING_SUPPORT.measured)throw Error('Unknown breeding support policy.');
}
