// Read-only body-language eligibility from successful canonical care/birth records.
// These queries never feed offspring, create eggs, move actors or change a receipt.
import {CFG} from '../sim/config.js';
import {MAMMAL,milkEligible} from '../ecology/mammalian-care.js';
const CALM=new Set(['idle','player','rest','social','group','guard','follow','explore','feed','forage','herd-rest','herd-browse','den-rest']);
const has=(a,id)=>!!a.bodyPlan?.nodes?.some(n=>n.partId===id);
const fresh=(sim,tick,seconds)=>Number.isInteger(tick)&&Number.isInteger(sim?.tickCount)&&sim.tickCount>=tick&&sim.tickCount-tick<CFG.simHz*seconds;
const surface=a=>a?.alive&&!a.airborne&&!a.perched&&!a.underground&&!a.climb&&!a.burrowWork&&!a.caveTransit&&!(a.diveDepth>.03);
function milkPair(sim,parent,child){
 return surface(parent)&&surface(child)&&(child.milkMeals||0)>0&&fresh(sim,child.lastMilkTick,1.15)&&milkEligible(parent,child)&&Math.hypot(parent.x-child.x,parent.y-child.y)<=MAMMAL.contactDistance;
}
export function careVisualAction(sim,animal,{moving=false}={}){
 if(!sim||moving||!surface(animal)||animal.bracing||animal.attackAction||animal.courtshipPerformance||!CALM.has(animal.intent||'idle'))return null;
 const events=sim.family?.events||[];
 const hatched=animal.hatchedFromEggId!=null&&events.find(e=>e.type==='egg-hatched'&&e.animalId===animal.id&&e.eggId===animal.hatchedFromEggId&&fresh(sim,e.tick,1.6));
 if(hatched)return'hatch-settle';
 const laid=has(animal,'egg-chamber')&&events.find(e=>e.type==='eggs-laid'&&e.animalId===animal.id&&e.count>0&&fresh(sim,e.tick,1.15));
 if(laid)return'lay-settle';
 if((animal.milkMeals||0)>0&&fresh(sim,animal.lastMilkTick,1.15)){
  const parent=sim.animals?.find(a=>a.id===animal.lactationParentId&&a.alive);
  if(milkPair(sim,parent,animal))return'suckle';
 }
 if(has(animal,'mammary-gland')&&sim.animals?.some(child=>child.lactationParentId===animal.id&&milkPair(sim,animal,child)))return'nurse';
 return null;
}
