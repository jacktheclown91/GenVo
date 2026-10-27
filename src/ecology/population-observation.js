import {SPECIES} from '../organisms/species.js';
import {BREEDING_SUPPORT,breedingSupport} from './breeding-support.js';

// Borrowed by PopulationPressureMemoryController. Survey the actual resident
// bodies, mouths and occupied cells; player G3 site assumptions do not apply.
// All food and predator assessments come from existing biological authorities.
const unit=value=>Math.max(0,Math.min(1,value));
export function observePopulationEcology(memory,population){
  const sim=memory.sim,world=sim.world;
  const residents=sim.animals.filter(a=>a.alive&&population.memberIds.has(a.id));
  if(!residents.length)return null;
  const totals={food:0,competition:0,danger:0,overload:0,load:0,
    moisture:0,temperature:0,waterEdge:0};
  const pressure={scarcity:0,competition:0,predation:0,crowding:0,dryness:0,wetness:0,heat:0,cold:0};
  let adults=0;
  for(const animal of residents){
    const state=sim.carrying.breedingState(animal);
    const support=state.support||breedingSupport(sim,animal,sim.carrying.surveyAt(animal),state.competitors);
    const need=support.need/BREEDING_SUPPORT.reproductiveMargin;
    const food=need>0?unit(support.share/need):0;
    const competitors=Math.max(0,state.competitors||0),competition=competitors/(1+competitors);
    const load=state.local||0;
    // Observe the existing crowding rule, not an obsolete species headcount cap.
    const overload=unit(1-(state.crowd??1));
    let predators=0;
    sim.forEachNearby(animal,9,other=>{
      if(other.alive&&other.id!==animal.id&&Math.hypot(other.x-animal.x,other.y-animal.y)<=9&&
            sim.isPredatorTo(other,animal)&&sim.canReach(other,animal.x,animal.y))predators++;
    });
    const danger=unit(predators/2),i=world.idx(animal.x,animal.y);
    const moisture=world.water[i]?1:world.moisture[i],temperature=world.temperature[i];
    const waterEdge=world.water[i]?1:(world.waterDistance?.[i]??Infinity)<=2?.45:0;
    for(const [key,value] of Object.entries({food,competition,danger,overload,load,moisture,temperature,waterEdge}))totals[key]+=value;
    pressure.scarcity+=1-food;pressure.competition+=competition;pressure.predation+=danger;pressure.crowding+=overload;
    // Existing population-memory environmental scales, at actual occupied cells.
    pressure.dryness+=unit((.46-moisture)/.38);
    pressure.wetness+=unit(Math.max((moisture-.54)/.38,waterEdge*.82));
    pressure.heat+=unit((temperature-.67)/.24);pressure.cold+=unit((.49-temperature)/.24);
    if(animal.age>=SPECIES[animal.species].maturity)adults++;
  }
  for(const key of Object.keys(totals))totals[key]/=residents.length;
  for(const key of Object.keys(pressure))pressure[key]/=residents.length;
  const score=unit(totals.food*.62+(1-totals.competition)*.14+(1-totals.danger)*.12+.08-totals.overload*.24);
  return{...totals,pressure,score,status:sim.populationEcology?.statusFor?.(score)||null,
    sampledMembers:residents.length,localAdults:adults,
    observation:'Actual resident bodies, maintenance supply and occupied habitat'};
}
