import {FRESHWATER_FOOD,freshwaterField,AQUATIC_REVIEW,CROWDING_STRENGTH} from './freshwater-food.js';
import {fundAquaticGrowth,exportAquaticReserve} from './organic-resource-cycle.js';
import {PLANT_RESOURCE_UNITS as U} from './plant-resources.js';
import {salinityAt} from '../world/environment.js';
import {coordNoise} from '../core/rng.js';

// Marine food web (marine-food-web/1, creator direction 2026-10-21). Ocean
// cells gain the same kind of biomass-field web as fresh water: producers
// funded by the shared mineral and aquatic-energy accounts, and consumer tiers
// that grow only by transferring their sources' biomass, paying upkeep, and
// returning losses as carrion and litter. Producers grow with salinity; marine
// kinds die back in fresh water just as freshwater kinds die back in salt.
// Nothing here is a population of animals; animals eat these fields through
// the shared aquatic feeding authority.
export const MARINE_FOOD=Object.freeze({policy:'marine-food-web/1',patchSeed:0x5ea7c,foundingShare:.1});
export const MARINE_KEYS=Object.freeze(Object.keys(FRESHWATER_FOOD).filter(k=>FRESHWATER_FOOD[k].marine));
const PRODUCERS=MARINE_KEYS.filter(k=>!FRESHWATER_FOOD[k].source),CONSUMERS=MARINE_KEYS.filter(k=>FRESHWATER_FOOD[k].source);
export const marineFactor=(world,i)=>Math.max(0,Math.min(1,(salinityAt(world,i)-.1)/.4));
const patch=(world,i)=>coordNoise(world.seedHash^MARINE_FOOD.patchSeed,i%world.n,i/world.n|0);
const eligible=(world,i,p)=>!p.minPatch||patch(world,i)>p.minPatch;
// New worlds only. Consumer tiers start funded from producer biomass at the
// ordinary transfer efficiency; no food is added after the world begins.
export function initializeMarineFood(world){
 world.marineProducerKinds=[...PRODUCERS];
 world.marineFood=Object.fromEntries(MARINE_KEYS.map(k=>[k,new Float32Array(world.len)]));
 const f=world.marineFood;
 for(let i=0;i<world.len;i++){
  if(!world.water[i]||!world.isPlayable(i%world.n+.5,(i/world.n|0)+.5))continue;
  const m=marineFactor(world,i);if(!(m>0))continue;const fert=world.fertility[i];
  f.phytoplankton[i]=(.25+.35*fert)*m;
  f.kelp[i]=eligible(world,i,FRESHWATER_FOOD.kelp)?(.2+.3*fert)*m:0;
  const zoo=f.phytoplankton[i]*MARINE_FOOD.foundingShare;f.phytoplankton[i]-=zoo/.2;f.zooplankton[i]=zoo;
  const shell=f.phytoplankton[i]*MARINE_FOOD.foundingShare*.5;f.phytoplankton[i]-=shell/.2;f.shellfish[i]=shell;
  const fish=zoo*MARINE_FOOD.foundingShare;f.zooplankton[i]-=fish/.2;f['forage-fish'][i]=fish;
 }
 const o=world.organicResources;
 if(o)for(const k of PRODUCERS){o.energy[k]=Float64Array.from(f[k],v=>Math.min(U.energyCapacity,v*.1));o.limits[k]=new Uint8Array(world.len)}
 return world.marineFood;
}
export function removeMarineFood(world){
 delete world.marineFood;delete world.marineProducerKinds;
 const o=world.organicResources;if(o)for(const k of PRODUCERS){delete o.energy[k];delete o.limits[k]}
}
export function validateMarineFood(world){
 if(world.marineFood===undefined)return;
 for(const k of MARINE_KEYS){const a=world.marineFood[k];if(!(a instanceof Float32Array)||a.length!==world.len||a.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid marine food field: '+k)}
 for(const k of PRODUCERS){const e=world.organicResources?.energy?.[k];if(!(e instanceof Float64Array)||e.length!==world.len||e.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid marine producer energy: '+k)}
}
// Daily step, after the freshwater step.
export function advanceMarineFood(world){
 if(!world.marineFood)return;
 const producers=world.marineProducerKinds||PRODUCERS;
 for(let i=0;i<world.len;i++){
  if(!world.water[i]||!world.isPlayable(i%world.n+.5,(i/world.n|0)+.5))continue;
  const m=marineFactor(world,i),light=Math.max(.15,1-Math.abs(world.temperature[i]-.58)*1.7),nutrients=Math.max(0,Math.min(1,world.fertility[i]));
  const requests=producers.map(kind=>{const p=FRESHWATER_FOOD[kind],field=freshwaterField(world,kind);return{kind,field,wanted:eligible(world,i,p)&&m>0?m*Math.min(Math.max(0,p.carry-field[i]),p.growth*light*nutrients*(.1+field[i]/p.carry)):0}});
  fundAquaticGrowth(world,i,requests,light);
  for(const kind of CONSUMERS){const p=FRESHWATER_FOOD[kind],field=freshwaterField(world,kind);
   const before=field[i],maintenance=before*p.upkeep*(AQUATIC_REVIEW.crowding?1+CROWDING_STRENGTH*before/(p.carry||1):1);
   const growth=Math.min(p.growth*before*light,Math.max(0,p.carry-before));
   let needed=maintenance+growth,assimilated=0,consumed=0;
   for(const src of [p.source,...(p.otherSources||[])]){
    const source=freshwaterField(world,src),half=(FRESHWATER_FOOD[src].carry||1)*.5,encountered=source[i]/(source[i]+half);
    const gain=Math.min(needed*encountered,source[i]*p.efficiency),sb=source[i];
    source[i]=Math.max(0,source[i]-gain/p.efficiency);consumed+=sb-source[i];exportAquaticReserve(world,src,i,sb-source[i],sb);assimilated+=gain;needed-=gain;
   }
   const loss=Math.max(0,maintenance-assimilated);field[i]=Math.max(0,Math.min(p.carry,before+assimilated-maintenance));
   const cb=world.carrion[i];world.carrion[i]+=loss*p.nutrition/FRESHWATER_FOOD.detritus.nutrition;
   const waste=Math.max(0,consumed-(field[i]-before)-(world.carrion[i]-cb));world.organicResources.litter[i]+=waste;world.organicResources.totals.aquaticWaste+=waste;
  }
  if(m<1)for(const kind of MARINE_KEYS){const field=freshwaterField(world,kind),before=field[i],loss=before*(1-m)*.1;if(!(loss>0))continue;field[i]-=loss;exportAquaticReserve(world,kind,i,loss,before);world.organicResources.litter[i]+=loss;world.organicResources.totals.aquaticWaste+=loss}
 }
}
