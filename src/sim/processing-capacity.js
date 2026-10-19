import {CFG} from './config.js';
import {MAX_WORLD_EGGS} from '../reproduction/reproductive-anatomy.js';

const runtimeLoad=new WeakMap();
export function setProcessingLoad(sim,load){runtimeLoad.set(sim,{pendingSeconds:load.pendingSeconds,budgetLimited:load.budgetLimited,workMs:load.workMs,regionalWork:!!load.regionalWork})}

// Diagnostics only: never consulted by reproduction, inheritance or mortality.
// Historical limit names remain compatible configuration, not ecological ceilings.
export function processingCapacity(sim){
  const living=sim.animals.reduce((n,a)=>n+(a.alive?1:0),0),eggs=sim.eggs?.length||0;
  return {living,eggs,animalReference:CFG.maxAnimals,eggReference:MAX_WORLD_EGGS,
    exceeded:living>CFG.maxAnimals||eggs>MAX_WORLD_EGGS,
    load:runtimeLoad.get(sim)||{pendingSeconds:0,budgetLimited:false,workMs:0}};
}
export function processingCapacityMessage(status){
  const delayed=(status.load?.pendingSeconds||0)>=.25;
  if(status.load?.regionalWork)return 'Simulating life in visited regions. Local time waits while all organisms continue in order.';
  if(!status.exceeded&&!delayed)return '';
  return `Processing ${status.exceeded?'capacity warning':'load'} - ${status.living} living organisms, ${status.eggs} eggs. All offspring are retained.`+(delayed?` Simulation is running behind; ${status.load.pendingSeconds.toFixed(1)} simulation seconds queued. Updates continue in order.`:' Simulation may run more slowly.');
}
