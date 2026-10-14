import {FRESHWATER_FOOD,freshwaterPreference,freshwaterField} from './freshwater-food.js';
import {plantPreference} from './functional-diet.js';
import {PLANTS} from '../sim/config.js';

// Retain a previously selected meal, not an unobserved global food search.
// Higher-priority danger, thirst and family decisions run before this check.
export function usableKnownFoodTarget(sim,a,target){
  const kind=target?.kind;
  if(!Number.isFinite(target?.x)||!Number.isFinite(target?.y))return null;
  if(!(FRESHWATER_FOOD[kind]?freshwaterPreference(a,kind)>0:plantPreference(a,kind)>0))return null;
  const field=FRESHWATER_FOOD[kind]?freshwaterField(sim.world,kind):kind==='carrion'?sim.world.carrion:PLANTS[kind]?sim.world.plants[kind]:null;
  if(!field||!sim.canReach(a,target.x,target.y))return null;
  const cell=sim.world.idx(target.x,target.y);
  if(!(field[sim.world.idx(target.foodX??target.x,target.foodY??target.y)]>0)||a.navigationRoute?.failed&&a.navigationRoute.goal===cell)return null;
  if(a.lineage&&!sim.isManualPlayer(a)&&sim.stalkerTerritory.landscapeAt(target.x,target.y,{animal:a}).risk>.52)return null;
  return target;
}

export function committedFoodTarget(sim,a){
  return a.intent==='feed'?usableKnownFoodTarget(sim,a,a.target):null;
}
