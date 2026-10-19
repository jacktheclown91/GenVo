// STAGED EXPERIMENT ONLY. Not imported by gameplay. Apply no policy migration.
// The canonical runtime remains src/lineage/part-abilities.js during the long trial.
import {PartAbilityController,hasPart,partEffectFactors,PART_ABILITY} from '../../src/lineage/part-abilities.js';
import {recordSoilDig} from '../../src/ecology/soil-disturbance.js';
const ROOT_FOODS=Object.freeze(['marshroot','dunebulb']);
export class FiniteDiggingCandidate extends PartAbilityController{
 rootMealAt(animal,x=animal?.x,y=animal?.y){
  if(!animal?.alive)return null;const w=this.sim.world;
  if(!w.isPlayable(x,y)||w.water[w.idx(x,y)])return null;
  const i=w.idx(x,y),view=x===animal.x&&y===animal.y?animal:{...animal,x,y};
  const meals=ROOT_FOODS.filter(kind=>(w.plants[kind]?.[i]||0)>.06).flatMap(kind=>this.sim.foraging.options(view,{index:i,kind})).filter(m=>m.tissue!=='kernel'&&m.handling.enabled);
  return meals.sort((a,b)=>b.needScore-a.needScore||a.kind.localeCompare(b.kind))[0]||null;
 }
 canDigAt(animal,x=animal?.x,y=animal?.y){
  if(!hasPart(animal,'digging-forelimb')||!partEffectFactors(animal)?.dig)return false;
  const i=this.sim.world.idx(x,y),last=this.dug[i];
  if(Number.isFinite(last)&&this.dayIndex()-last<PART_ABILITY.dig.regrowDays)return false;
  return !!this.rootMealAt(animal,x,y);
 }
 digAvailability(animal){
  if(!animal?.alive)return{enabled:false,reason:'Nothing to dig with.'};
  if(!hasPart(animal,'digging-forelimb'))return{enabled:false,reason:'You have no digging forelimbs.'};
  if((animal.digUntilTick||0)>this.sim.tickCount)return{enabled:false,quiet:true,reason:'Still digging.'};
  if(!this.canDigAt(animal))return{enabled:false,reason:'No accessible root or bulb meal remains here, or this ground is recovering.'};
  return{enabled:true,reason:'Harvest existing root or bulb tissue.'};
 }
 dig(animal){
  const status=this.digAvailability(animal);if(!status.enabled)return{ok:false,type:'dig',quiet:status.quiet,message:status.reason};
  const meal=this.rootMealAt(animal);if(!meal)return{ok:false,type:'dig',message:'That root food is no longer available.'};
  const before=this.sim.world.plants[meal.kind][meal.i],fed=this.sim.foraging.consume(animal,meal);
  if(!fed.ok)return{...fed,type:'dig'};
  const removed=before-this.sim.world.plants[meal.kind][meal.i];if(!(removed>0))throw Error('Digging meal credited without a finite producer debit.');
  animal.hidden=false;this.soilDisturbance??=new Map();recordSoilDig(this.soilDisturbance,meal.i,this.sim.day,animal.id);this.sim.regionalEcology?.noteSoilDig(animal);
  this.dug[meal.i]=this.dayIndex();animal.digUntilTick=this.sim.tickCount+PART_ABILITY.dig.cooldownTicks;animal.anim=(animal.anim+2)%8;
  if(animal.player)this.sim.lastPlayerAction={type:'dig',actorId:animal.id,tick:this.sim.tickCount,kind:meal.kind,amount:removed,energyGain:fed.energyGain};
  return{...fed,type:'dig',amount:removed,message:'Dug '+meal.kind+' · '+fed.message};
 }
}
export function installFiniteDiggingCandidate(sim){Object.setPrototypeOf(sim.partAbilities,FiniteDiggingCandidate.prototype);return sim}
