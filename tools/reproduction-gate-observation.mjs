import {SPECIES} from '../src/organisms/species.js';
// Necessary observable decision gates only; no controller calls or hypothetical mating.
export function observedReproductionGates(animal,species){
 const s=SPECIES[species];if(!s)throw Error('Unknown species');const threshold=s.reproduction?.energy??.72;
 const blocked=[];if(animal.age<=s.maturity)blocked.push('immature');if(animal.energyRatio<=threshold)blocked.push('energy');if(animal.reproCooldown>0)blocked.push('cooldown');if(animal.infected)blocked.push('infection');
 return {threshold,blocked,observableGatesPass:blocked.length===0,drive:animal.reproDrive,intent:animal.intent};
}
