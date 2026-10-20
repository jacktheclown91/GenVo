import {thermalDemand} from './thermal-demand.js';
import {COAT_MOISTURE} from '../lineage/coat-moisture.js';
import {SEASONAL_COAT} from '../lineage/seasonal-coat.js';
import {YOUNG_CLIMATE,youngClimateExposure} from './young-climate.js';
import {torporMetabolism} from './cold-wildlife.js';
import {basalResourceCosts} from '../organisms/body-mass.js';
import {SPECIES} from '../organisms/species.js';
export const THERMAL_REFUGE=Object.freeze({policy:'physiological-thermal-refuge/1',minimumLoad:.03,minimumRelief:.008,travelPenalty:.0015,radius:6});
export function thermalSiteDemand(sim,a,x=a.x,y=a.y){
 const w=sim.world,i=w.idx(x,y),probe=Object.assign(Object.create(a),{x,y}),temperature=w.temperature[i],moisture=w.moisture[i],persistent=w.environment?.coatMoisturePolicy===COAT_MOISTURE.policy;
 const coat=persistent?{wetness:a.coatWetness??0,...(w.environment?.seasonalCoatPolicy===SEASONAL_COAT.policy?{density:a.coatDensity??SEASONAL_COAT.defaultDensity}:{})}:{wet:(sim.climate?.rain||0)>.65&&moisture>.6};
 const young=w.environment?.youngClimatePolicy===YOUNG_CLIMATE.policy?youngClimateExposure(a,temperature,moisture):null;
 const demand=thermalDemand(sim,a,{temperature,shelter:a.lineage?(sim.shelter?.thermalMultiplier?.(probe)??1):1,coat,young,sleep:torporMetabolism(a)});
 return{...demand,temperature,load:demand.thermal+demand.extraEnergy/Math.max(.001,basalResourceCosts(a).energy)};
}
// A bounded local choice, below threats and family weather care. Actual travel
// and its energy cost remain owned by normal locomotion and route authorities.
export function thermalRefugeDecision(sim,a){
 if(sim.thermalRefugeRules!==THERMAL_REFUGE.policy||!a?.alive||a.player&&!sim.playerAutonomy||a.underground||a.caveTransit||a.burrowWork||a.airborne||a.perched||a.torpor||(a.diveDepth||0)>.03)return null;
 const spec=SPECIES[a.species];if(!spec||sim.family?.isDependent?.(a)||sim.family?.livingChildren?.(a,{dependentOnly:true})?.length||a.energy/spec.maxEnergy<.3||a.hydration/spec.maxHydration<.35)return null;
 const current=thermalSiteDemand(sim,a);if(current.load<THERMAL_REFUGE.minimumLoad)return null;
 const radius=Math.min(THERMAL_REFUGE.radius,Math.max(2,4*(a.genes?.senses||1))),options=[];
 for(let dy=-6;dy<=6;dy+=2)for(let dx=-6;dx<=6;dx+=2){const distance=Math.hypot(dx,dy);if(distance<1||distance>radius)continue;const x=a.x+dx,y=a.y+dy;
  if(!sim.world.isPlayable(x,y)||sim.world.water[sim.world.idx(x,y)]||!sim.canOccupy(a,x,y))continue;
  const site=thermalSiteDemand(sim,a,x,y),relief=current.load-site.load-distance*THERMAL_REFUGE.travelPenalty;
  if(relief>=THERMAL_REFUGE.minimumRelief)options.push({x,y,relief});
 }
 options.sort((a,b)=>b.relief-a.relief);for(const target of options.slice(0,3))if(sim.canReach(a,target.x,target.y))return{intent:'thermal-refuge',target:{x:target.x,y:target.y,thermalRefuge:true}};
 if(a.target?.thermalRefuge&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<.65)return{intent:'thermal-rest',target:{x:a.x,y:a.y,thermalRefuge:true}};
 return null;
}
