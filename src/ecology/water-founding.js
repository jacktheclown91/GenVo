// Founding water budget (regional-founding-templates/3, morphology S6). Instead of
// requiring every land founder to have drinking water within reach, a site is
// water-sustainable for a body when either
//  - open fresh water is reachable on foot within the founding range (as /2), or
//  - the water its own diet supplies, eaten only up to its food need, covers the
//    water its own physiology loses there.
// Every term is measured with the existing authorities and the founding body
// itself; nothing is created:
//  need = resting water cost per day (anatomy, inherited size, fasting-2
//         endurance) x the metabolism step's climate term x wax plates' dry-soil
//         factor, plus evaporative cooling of the site's heat load under
//         arid-physiology/1 (from the daily-mean temperature: founding is a
//         judgement over days, not over the hour);
//  diet = renewable plant tissue the body's mouth reaches (the founding food
//         measure's regrowth) x each plant's water per unit of tissue, plus,
//         under tissue-water/1, the body water of the prey tissue it can take;
//         eaten only in the share its daily food need requires.
import {SPECIES} from '../organisms/species.js';
import {PLANTS} from '../sim/config.js';
import {BIO_STEPS_PER_DAY} from '../sim/day-clock.js';
import {groundDiet,preyPreference} from './functional-diet.js';
import {FOOD_PROFILES} from '../gameplay/foraging.js';
import {plantMealWater} from './physiology.js';
import {basalResourceCosts} from '../organisms/body-mass.js';
import {basalScale,metabolismActive} from './metabolism-policy.js';
import {aridityWaterFactor} from '../lineage/terrain-cover-physiology.js';
import {tissueWaterActive} from './tissue-water.js';
import {meatEnergy} from './tissue-energy.js';
import {preyBodyMass} from './prey-biomass.js';
import {captureLikelihood} from './juvenile-biology.js';
import {toAbsolute,toReserve} from '../organisms/body-size.js';
import {aridPhysiologyEnabled,evaporativeCooling} from './arid-physiology.js';
import {thermalDemand} from './thermal-demand.js';
import {FOUNDING_RANGE,founderDailyNeed} from './resource-founding.js';

const MEAL_ENERGY=3.6;// meal energy per unit of tissue x nutrition (the plant meal rule)
export function dailyWaterNeed(sim,a,point){
 const w=sim.world,i=w.idx(point.x,point.y),basal=basalResourceCosts(a).water*(metabolismActive(sim)?basalScale(sim,a).water:1)*BIO_STEPS_PER_DAY;
 const resting=basal*(1+(sim.climate?.temp??.5)*.3)*aridityWaterFactor(a,w.moisture[i]);
 if(!aridPhysiologyEnabled(sim))return resting;
 const temperature=w.temperature[i],comfort=.55*(a.genes?.climate??1);
 return resting+(temperature>comfort?evaporativeCooling(basal,thermalDemand(sim,a,{temperature,comfort}).thermal):0);
}
// Water (reserve units per day) from eating renewable food only up to the body's need.
export function dailyDietWater(sim,a,point){
 const w=sim.world,at={...a,x:point.x,y:point.y},r2=FOUNDING_RANGE*FOUNDING_RANGE;
 let energy=0,water=0;
 if(plantMealWater(sim)){
  const diet=Object.entries(groundDiet(a)).filter(([k,e])=>PLANTS[k]&&e>0);
  for(let y=Math.floor(point.y-FOUNDING_RANGE);y<=Math.floor(point.y+FOUNDING_RANGE);y++)for(let x=Math.floor(point.x-FOUNDING_RANGE);x<=Math.floor(point.x+FOUNDING_RANGE);x++){
   const px=x+.5,py=y+.5;if((px-point.x)**2+(py-point.y)**2>r2||!w.isPlayable(px,py))continue;const i=w.idx(px,py);if(w.water[i])continue;
   for(const [k,eff] of diet){const s=w.plants[k]?.[i]||0;if(!(s>0))continue;const P=PLANTS[k],prof=FOOD_PROFILES[k],regrowth=P.growth*s*Math.max(0,1-s/P.carry);
    energy+=regrowth*P.nutrition*eff*MEAL_ENERGY*(prof?.energy??1);water+=regrowth*((prof?.water??0)/Math.max(.001,prof?.bite??.18))}}
 }
 if(tissueWaterActive(sim)){const perMass=meatEnergy(sim,at);
  for(const b of sim.animals){
   if(b===a||!b.alive||(b.x-point.x)**2+(b.y-point.y)**2>r2)continue;const p=preyPreference(at,b);if(!(p>0))continue;
   const mass=Math.max(1e-9,preyBodyMass(b)),tissue=mass*p*captureLikelihood(at,b)/Math.max(1,SPECIES[b.species]?.lifespan||365);
   energy+=tissue*perMass;water+=tissue*toAbsolute(b,Math.max(0,b.hydration))/mass;
  }}
 const need=founderDailyNeed(a.species,a),eaten=energy>0?Math.min(1,need/energy):0;
 return toReserve(a,water*eaten);
}
export function foundingWaterBudget(sim,a,point){
 const w=sim.world,drinking=(w.waterDistance?.[w.idx(point.x,point.y)]??Infinity)<=FOUNDING_RANGE;
 const need=dailyWaterNeed(sim,a,point),diet=dailyDietWater(sim,a,point);
 return{drinking,need,diet,ratio:need>0?diet/need:Infinity,sustainable:drinking||diet>=need};
}
