import {FRESHWATER_FOOD,canAccessFreshwater} from '../ecology/freshwater-food.js';
// Position projection asks the existing food authority about one remembered
// source. It never substitutes another resource, feeds, drinks or edits memory.
export function learnedResourceTarget(sim,animal,type,memory){
  const fail=reason=>({enabled:false,reason,target:null});
  if(!memory||!Number.isFinite(memory.x)||!Number.isFinite(memory.y))return fail('the learned place is missing');
  if(type==='water'){
    if(!sim.canOccupy(animal,memory.x,memory.y)||!sim.canReach(animal,memory.x,memory.y))return fail('the learned water approach is unreachable');
    if(!sim.world.isDrinkable(memory.x,memory.y))return fail('the learned water approach is no longer drinkable');
    return{enabled:true,reason:'',target:{x:memory.x,y:memory.y,learned:true}};
  }
  const kind=memory.kind;if(!kind)return fail('the remembered food identity is missing');
  const water=FRESHWATER_FOOD[kind],i=sim.world.idx(memory.x,memory.y),positions=water?[{x:memory.x,y:memory.y},...[[-1,0],[1,0],[0,-1],[0,1]].map(([x,y])=>({x:memory.x+x,y:memory.y+y}))]:[{x:memory.x,y:memory.y}];
  if(water&&!canAccessFreshwater(sim,animal,memory.x,memory.y,water))return fail('the remembered aquatic food is inaccessible to this body');
  for(const at of positions){
    if(!sim.canOccupy(animal,at.x,at.y)||!sim.canReach(animal,at.x,at.y))continue;
    const projected={...animal,...at},options=sim.foraging.options(projected,{index:i,kind,tissue:memory.tissue??null}).filter(o=>o.handling.enabled).sort((a,b)=>b.needScore-a.needScore);
    for(const option of options){
      const check=sim.foraging.availability(projected,{i,kind,tissue:option.tissue});if(!check.enabled)continue;
      return{enabled:true,reason:'',target:{...at,kind,i,tissue:option.tissue,learned:true,...(water?{foodX:memory.x,foodY:memory.y}:{})}};
    }
  }
  return fail('the remembered food is spent, incompatible, unreachable or cannot be handled with current reserves');
}
