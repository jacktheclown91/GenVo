// E12: anatomy-selected cold-season torpor and short-range thermal refuge seeking.
// Existing actor energy and hydration are the ONLY reserves. The usual metabolism,
// locomotion, predation and migration controllers remain authoritative.
import {SPECIES} from '../organisms/species.js';
import {planPartCounts} from '../lineage/part-abilities.js';
import {groundDiet} from './functional-diet.js';
import {PLANTS} from '../sim/config.js';

export const COLD_BEHAVIOR=Object.freeze({
 enterTemperature:.27,wakeTemperature:.38,
 autoStartTemperature:.23,minimumEnergy:.48,autoEnergy:.73,
 minimumHydration:.43,wakeEnergy:.27,wakeHydration:.30,
 minimumHealth:68,minimumMaturity:1,
 energyRate:.48,waterRate:.68,heatOutput:.35,
 exposureMultiplier:1.32,predationMultiplier:1.46,
 fleeDistance:5, migrationTemperature:.24,migrationDifference:.095,
 migrationRange:14,migrationStep:4
});
const ratio=(value,maximum)=>Math.max(0,value/Math.max(1,maximum));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function winterFatAnatomy(animal){
 const parts=planPartCounts(animal);
 return (parts['fat-tail']||0)+(parts['fat-pad']||0)>0;
}
export function torporStatus(sim,animal){
 const fail=reason=>({enabled:false,reason});
 if(animal?.underground||animal?.burrowWork)return fail('Return to the surface before seasonal torpor.');
 if(!animal?.alive)return fail('No living creature.');
 if(animal.torpor)return{enabled:true,active:true,reason:'Wake and resume normal movement.'};
 if(!winterFatAnatomy(animal))return fail('Evolve a fat pad or fat tail to fuel a cold-season torpor.');
 if(animal.airborne||animal.perched)return fail('Find safe ground before slowing your body.');
 if(sim.world.water[sim.world.idx(animal.x,animal.y)])return fail('A land resting site is needed.');
 const s=SPECIES[animal.species];if(!s)return fail('Unknown physiology.');
 const temp=sim.world.temperature[sim.world.idx(animal.x,animal.y)];
 if(temp>COLD_BEHAVIOR.enterTemperature)return fail('The local ground is too warm for cold-season torpor.');
 if(animal.age<s.maturity*COLD_BEHAVIOR.minimumMaturity)return fail('Young creatures must keep feeding and growing.');
 if(animal.pregnant)return fail('Pregnant creatures must remain metabolically active.');
 if(animal.health<COLD_BEHAVIOR.minimumHealth||animal.infected)return fail('Too sick or injured for deep rest.');
 if(ratio(animal.energy,s.maxEnergy)<COLD_BEHAVIOR.minimumEnergy||ratio(animal.hydration,s.maxHydration)<COLD_BEHAVIOR.minimumHydration)
  return fail('Build up food energy and water reserves first.');
 // Current offspring need a caregiver more than their parent needs dormancy.
 if(sim.family?.livingChildren?.(animal,{dependentOnly:true})?.length)return fail('Dependent young still need care.');
 if(sim.findNearest?.(animal,other=>other.alive&&sim.isPredatorTo(other,animal),COLD_BEHAVIOR.fleeDistance))
  return fail('A nearby predator makes deep sleep too dangerous.');
 return{enabled:true,active:false,reason:'Enter cold-season torpor: save energy but remain vulnerable.'};
}
export function enterTorpor(sim,animal){
 const status=torporStatus(sim,animal);
 if(!status.enabled||status.active)return{ok:false,type:'torpor',message:status.reason};
 animal.torpor=true;animal.torporStartedDay=sim.day;
 animal.intent='torpor';animal.target=null;animal.navigationRoute=null;
 return{ok:true,type:'torpor',message:'Entered torpor. Food and water use slows, but cold exposure and predators remain dangerous.'};
}
export function wakeTorpor(animal,{reason='Woke from torpor.'}={}){
 if(!animal?.torpor)return{ok:false,type:'torpor',message:'Not in torpor.'};
 animal.torpor=false;animal.intent='idle';animal.target=null;
 return{ok:true,type:'torpor',message:reason};
}
export function maintainTorpor(sim,animal,temp){
 if(!animal?.torpor)return false;
 const spec=SPECIES[animal.species];
 if(!spec||animal.airborne||animal.perched||animal.pregnant||animal.health<COLD_BEHAVIOR.minimumHealth||animal.infected||
  temp>COLD_BEHAVIOR.wakeTemperature||ratio(animal.energy,spec.maxEnergy)<COLD_BEHAVIOR.wakeEnergy||
  ratio(animal.hydration,spec.maxHydration)<COLD_BEHAVIOR.wakeHydration){
  wakeTorpor(animal,{reason:'Temperature, bodily condition or low reserves ended torpor.'});return false;
 }
 return true;
}
export function torporMetabolism(animal){
 return animal?.torpor?{energy:COLD_BEHAVIOR.energyRate,water:COLD_BEHAVIOR.waterRate,heat:COLD_BEHAVIOR.heatOutput,coldExposure:COLD_BEHAVIOR.exposureMultiplier}:{energy:1,water:1,heat:1,coldExposure:1};
}
export function torporPredationMultiplier(prey){
 return prey?.torpor?COLD_BEHAVIOR.predationMultiplier:1;
}
export function decideTorpor(sim,animal){
 if(animal?.torpor)return{intent:'torpor',target:null};
 if(!animal?.alive||animal.player&&!sim.playerAutonomy)return null;
 const s=SPECIES[animal.species],temp=sim.world.temperature[sim.world.idx(animal.x,animal.y)];
 if(temp>COLD_BEHAVIOR.autoStartTemperature||ratio(animal.energy,s.maxEnergy)<COLD_BEHAVIOR.autoEnergy)return null;
 const availability=torporStatus(sim,animal);
 if(!availability.enabled)return null;
 enterTorpor(sim,animal);return{intent:'torpor',target:null};
}
// Wild routes use the EXISTING MigrationController's routing and target state.
// At most 48 local candidates, all verified by the same locomotion authority.
// No cross-planet teleport, population relocation or simulated extra region.
export function coldMigrationOpportunity(sim,animal){
 const s=SPECIES[animal?.species];if(!animal?.alive||!s||winterFatAnatomy(animal)||
  animal.age<s.maturity||animal.pregnant||sim.family?.isDependent?.(animal))return null;
 const w=sim.world,source=w.idx(animal.x,animal.y),temp=w.temperature[source];
 if(temp>COLD_BEHAVIOR.migrationTemperature||ratio(animal.energy,s.maxEnergy)<.50||ratio(animal.hydration,s.maxHydration)<.40)return null;
 const diet=Object.entries(groundDiet(animal)).filter(([kind,eff])=>eff>0&&PLANTS[kind]);
 if(!diet.length)return null;
 const valueAt=i=>diet.reduce((v,[kind,eff])=>v+eff*Math.min(1,(w.plants[kind]?.[i]||0)/PLANTS[kind].carry),0);
 const currentFood=valueAt(source),best={x:animal.x,y:animal.y,temp,food:currentFood,score:temp+Math.min(.2,currentFood*.05)};
 const radius=Math.min(COLD_BEHAVIOR.migrationRange,8*Math.max(.7,animal.genes?.senses||1));
 for(let dy=-radius;dy<=radius;dy+=COLD_BEHAVIOR.migrationStep)
  for(let dx=-radius;dx<=radius;dx+=COLD_BEHAVIOR.migrationStep){
   if(dx===0&&dy===0||Math.hypot(dx,dy)>radius||Math.hypot(dx,dy)<3)continue;
   const x=animal.x+dx,y=animal.y+dy;
   if(!w.isPlayable(x,y)||!sim.canOccupy(animal,x,y)||!sim.canReach(animal,x,y))continue;
   const i=w.idx(x,y),candidateTemp=w.temperature[i],food=valueAt(i);
   if(candidateTemp<temp+COLD_BEHAVIOR.migrationDifference||food<.03)continue;
   const score=candidateTemp+Math.min(.2,food*.05)-Math.hypot(dx,dy)*.002;
   if(score>best.score&&score>temp+COLD_BEHAVIOR.migrationDifference){
    Object.assign(best,{x,y,temp:candidateTemp,food,score});
   }
  }
 return best.x===animal.x&&best.y===animal.y?null:{...best,quality:best.score};
}
