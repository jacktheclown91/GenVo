import {basalResourceCosts,ANATOMICAL_MASS,massPolicy} from '../organisms/body-mass.js';
import {SPECIES} from '../organisms/species.js';
import {PLANTS,CFG} from '../sim/config.js';
import {groundDiet,preyPreference} from './functional-diet.js';
import {FRESHWATER_FOOD,freshwaterField,freshwaterPreference,growthOf} from './freshwater-food.js';
import {preyBodyMass} from './prey-biomass.js';
import {captureLikelihood} from './juvenile-biology.js';

// Resource-informed founding (Phase 3H; renewable food since Phase 3I, creator decision 2026-10-15).
// After every founder has been placed by the ordinary rules (so the RNG sequence and everyone's positions
// are unchanged), each species keeps only as many founders as the food its own anatomy can reach around
// its founding sites can RENEW each day:
//   - land plants it eats: logistic regrowth growth x stock x (1 - stock/carry) x nutrition x preference;
//   - freshwater food its mouth can use: producer regrowth likewise; consumer tiers (larvae, fry) their net
//     growth (growth x biomass x (1 - biomass/carry) - upkeep x biomass);
//   - live prey: standing prey biomass x tissue energy x preference x capture likelihood / prey lifespan
//     (production-to-biomass turnover).
// Each founder needs its basal upkeep (base metabolism x mass x metabolism steps per day) x
// FOUNDING_ACTIVITY. Never more than configured. A species whose renewable food cannot support a breeding
// pair is founded ABSENT rather than as a doomed pair (there is no immigration from outside the map, so it
// stays absent unless a later process brings it). No food or animals are created. ?resourceFounding=0
// disables. FOUNDING_ACTIVITY is a PROPOSAL. (Phase 3H used standing stock over 30 days with a per-day
// need overstated 6x by counting ticks instead of metabolism steps, and a minimum of one pair.)
export const RESOURCE_FOUNDING={enabled:true};
export const FOUNDING_RANGE=12,FOUNDING_ACTIVITY=2,TISSUE_ENERGY=FRESHWATER_FOOD.detritus.nutrition;
const STEPS_PER_DAY=CFG.dayTicks/CFG.lifeStride;
export function founderDailyNeed(species,animal=null){if(animal&&massPolicy(animal)===ANATOMICAL_MASS)return basalResourceCosts(animal).energy/animal.genes.metabolism*STEPS_PER_DAY*FOUNDING_ACTIVITY;const s=SPECIES[species];return s.baseMetabolism*(s.mass||1)*STEPS_PER_DAY*FOUNDING_ACTIVITY}

export function renewableFood(sim,a){
  const w=sim.world,diet=Object.entries(groundDiet(a)).filter(([k,e])=>PLANTS[k]&&e>0),wet=Object.keys(FRESHWATER_FOOD).filter(k=>k!=='detritus').map(k=>[k,freshwaterPreference(a,k)]).filter(([,p])=>p>0);let energy=0;
  for(let y=Math.floor(a.y-FOUNDING_RANGE);y<=a.y+FOUNDING_RANGE;y++)for(let x=Math.floor(a.x-FOUNDING_RANGE);x<=a.x+FOUNDING_RANGE;x++){
    const px=x+.5,py=y+.5;if(!w.isPlayable(px,py)||Math.hypot(px-a.x,py-a.y)>FOUNDING_RANGE)continue;const i=w.idx(px,py);
    if(w.water[i]){for(const [k,pref] of wet){const P=FRESHWATER_FOOD[k],f=freshwaterField(w,k)?.[i]||0;if(f<=0)continue;const regrow=growthOf(k,P)*f*Math.max(0,1-f/(P.carry||1)),net=P.source?regrow-(P.upkeep||0)*f:regrow;if(net>0)energy+=net*P.nutrition*pref}}
    else for(const [k,e] of diet){const P=PLANTS[k],s=w.plants[k]?.[i]||0;if(s>0)energy+=P.growth*s*Math.max(0,1-s/P.carry)*P.nutrition*e}
  }
  for(const b of sim.animals){if(b===a||!b.alive||Math.hypot(b.x-a.x,b.y-a.y)>FOUNDING_RANGE)continue;const p=preyPreference(a,b);if(p>0)energy+=preyBodyMass(b)*TISSUE_ENERGY*p*captureLikelihood(a,b)/Math.max(1,SPECIES[b.species]?.lifespan||365)}
  return energy;
}
export function resourceInformedFounding(sim){
  if(!RESOURCE_FOUNDING.enabled)return null;const report={};
  for(const species of Object.keys(SPECIES)){
    const group=sim.animals.filter(a=>a.alive&&a.species===species&&!a.player&&!a.lineage);if(!group.length)continue;
    const need=group.reduce((sum,a)=>sum+founderDailyNeed(species,a),0)/group.length;
    // A founding group shares the food around its founding sites: measure it once per distinct site.
    const sites=(sim.spawnCenters?.[species]||[]).filter((c,i,all)=>all.findIndex(d=>Math.hypot(d.x-c.x,d.y-c.y)<FOUNDING_RANGE)===i);
    const shared=(sites.length?sites:[group[0]]).reduce((n,c)=>n+renewableFood(sim,{...group[0],x:c.x,y:c.y}),0);
    const scored=group.map(a=>({a,food:renewableFood(sim,a)})).sort((x,y)=>y.food-x.food);
    let supportable=Math.min(group.length,Math.floor(shared/need));if(supportable<2)supportable=0;
    report[species]={configured:group.length,supportable,renewableFood:+shared.toFixed(2),needPerFounder:+need.toFixed(3)};
    if(supportable<group.length){const remove=new Set(scored.slice(supportable).map(x=>x.a));sim.animals=sim.animals.filter(a=>!remove.has(a))}
  }
  return report;
}
