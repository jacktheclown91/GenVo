import {autonomousEvolutionEnabled,regionalEvolutionEnabled} from './autonomous-evolution.js';
import {naturalPopulationFor,regionalPopulationFor} from '../ecology/autonomous-founding.js';
import {candidateContainsKey} from '../ecology/founding-candidate-contact.js';

// Borrowed by gestation and SpeciationController. This is evidence in its existing
// birth history, not a second population identity or reproduction authority.
export function conceptionPopulationEvidence(sim,parent){
  if(!autonomousEvolutionEnabled(sim))return undefined;
  const memory=sim.populationMemory;
  const population=memory?.populationForAnimal?.(parent)||
    (memory?.natural?naturalPopulationFor(memory,parent,{candidates:true}):null);
  const regional=memory?.natural?regionalPopulationFor(memory,parent,{candidates:true}):null;
  return{rules:'conception-population/1',key:population?.key||null,
    sourceKey:population?.scope==='regional-source'?population.key:
      population?.sourcePopulationKey||regional?.key||null,
    taxonId:sim.evolutionTree?.taxonFor?.(parent)||null,tick:sim.tickCount};
}
export function noteEvolutionaryBirth(controller,child,parents){
  const sim=controller.sim;
  if(!child?.alive||controller.births.some(event=>event.childId===child.id))return null;
  const pop=controller.childPopulation(child);
  // Unknown conception provenance cannot be upgraded to local-only breeding
  // from a parent's later birthplace, death location or ancestral origin key.
  if(!pop&&!regionalEvolutionEnabled(sim))return null;
  const witnesses=parents.map(parent=>parent?.evolutionaryPopulationAtConception||null);
  if(witnesses.some(w=>w&&w.rules!=='conception-population/1'))throw Error('Unknown conception population evidence.');
  if(!pop){controller.assignIdentity(child,null);return null;}
  const parentKeys=witnesses.map(w=>w?.key||null),sourceKeys=witnesses.map(w=>w?.sourceKey||null);
  const sourceKey=pop.scope==='regional-source'?pop.key:pop.sourcePopulationKey||null;
  const involvedKeys=[...new Set([pop.key,sourceKey,...parentKeys,...sourceKeys].filter(Boolean))];
  const event={childId:child.id,day:sim.day,generation:child.generation||1,
    populationKey:pop.key,sourceKey,parentKeys,sourceKeys,
    parentTaxa:witnesses.map(w=>w?.taxonId||null),involvedKeys,
    rules:'conception-population/1'};
  const scopeKeys=pop.scope==='regional-source'?sourceKeys:parentKeys;
  event.unknown=scopeKeys.length<2||scopeKeys.some(key=>!key)||!event.parentTaxa.every(Boolean);
  event.cross=!event.unknown&&(scopeKeys.some(key=>!candidateContainsKey(pop,key))||new Set(event.parentTaxa).size>1);
  controller.births.push(event);controller.trimBirths();controller.assignIdentity(child,pop);
  return event;
}
export function evolutionaryGeneFlow(controller,key){
  const population=controller.populationByKey(key);
  const includes=value=>!!value&&(population?candidateContainsKey(population,value):key===value);
  const events=controller.births.filter(event=>event.involvedKeys.some(includes)).slice(-12);
  let local=0,cross=0,unknown=0;
  for(const event of events){
    const keys=population?.scope==='regional-source'?event.sourceKeys:event.parentKeys;
    const childKey=population?.scope==='regional-source'?event.sourceKey:event.populationKey;
    const taxa=event.parentTaxa||[];
    const complete=keys?.length>=2&&keys.every(Boolean)&&taxa.length>=2&&taxa.every(Boolean);
    if(!complete){unknown++;continue}
    const mixedTaxa=new Set(taxa).size>1;
    if(includes(childKey)&&keys.every(includes)&&!mixedTaxa)local++;
    else cross++;
  }
  const knownTotal=local+cross,total=knownTotal+unknown;
  return{events,total,local,cross,unknown,knownTotal,knownRatio:knownTotal?cross/knownTotal:0,
    ratio:total?(cross+unknown)/total:1,isolation:total?local/total:0};
}
export function trimEvolutionaryBirths(events,day){
  const minimum=Math.max(1,day-48),counts=new Map(),kept=[];
  for(let index=events.length-1;index>=0;index--){
    const event=events[index];if(event.day<minimum)continue;
    if(!event.involvedKeys.some(key=>(counts.get(key)||0)<12))continue;
    kept.push(event);
    for(const key of event.involvedKeys)counts.set(key,(counts.get(key)||0)+1);
  }
  return kept.reverse();
}
