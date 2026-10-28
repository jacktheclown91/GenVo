import {regionalEvolutionEnabled,regionalEvolutionPolicy} from './autonomous-evolution.js';
import {recordedBranchFor,recordedTaxonFor} from './evolution-tree-identity.js';

const integer=value=>Number.isSafeInteger(value)&&value>=0;
export function validateRecordedTaxonCensus(census,{tick,living}){
  if(census?.schema!==1||!regionalEvolutionPolicy(census.rules)||census.tick!==tick||!Array.isArray(census.counts))
    throw Error('Invalid recorded regional taxon census.');
  let total=0,previous=null;
  for(const row of census.counts){
    if(typeof row?.id!=='string'||!row.id||!integer(row.living)||!row.living||
       previous!==null&&row.id<=previous)
      throw Error('Invalid recorded regional taxon counts.');
    previous=row.id;total+=row.living;
  }
  if(total!==living)throw Error('Recorded regional taxon count does not match its owner.');
  return census;
}
export function recordedRegionalTaxonCensus(snapshot){
  if(!regionalEvolutionEnabled(snapshot?.core))return undefined;
  const nodes=snapshot.controllers?.evolutionTree?.nodes;
  if(!(nodes instanceof Map))throw Error('Regional census lacks recorded evolutionary history.');
  const counts=new Map();let living=0;
  for(const animal of snapshot.animals){
    if(!animal.alive)continue;
    if(animal.speciesBranch?.id&&!recordedBranchFor(nodes,animal))
      throw Error('Regional carrier lacks its recorded taxon membership.');
    const id=recordedTaxonFor(nodes,animal);
    if(!nodes.has(id))throw Error('Regional census lacks recorded taxon ancestry.');
    counts.set(id,(counts.get(id)||0)+1);living++;
  }
  const rows=[...counts].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([id,count])=>({id,living:count}));
  return validateRecordedTaxonCensus({schema:1,rules:snapshot.core.autonomousEvolutionRules,
    tick:snapshot.core.tickCount,counts:rows},{tick:snapshot.core.tickCount,living});
}

// Read actual resident bodies and committed unloaded-owner projections. This
// is a census of existing records, never another species or population registry.
export function recordedPlanetaryTaxonCensus(sim,nodes,{activePopulation=()=>null}={}){
  const rows=new Map([...nodes.keys()].map(id=>[id,{living:0,populations:new Map(),regions:new Map()}]));
  const owners=new Set(),identities=new Set(),observed=[];let complete=true,unresolvedLiving=0;
  const add=(id,count,key,tick,population=null)=>{
    if(!nodes.has(id)){complete=false;unresolvedLiving+=count;return}
    const row=rows.get(id);row.living+=count;
    row.regions.set(key,{key,tick,living:(row.regions.get(key)?.living||0)+count});
    if(population?.key)row.populations.set(population.key,population.label||population.key);
  };
  const bodies=(animals,history,key,tick,active=false)=>{
    if(owners.has(key))throw Error('Duplicate regional taxon census owner.');owners.add(key);
    if(!active&&tick!==sim.tickCount)complete=false;
    observed.push({key,tick});
    for(const animal of animals){
      if(identities.has(animal.id))throw Error('Duplicate planetary organism in taxon census.');
      identities.add(animal.id);
      if(!animal.alive)continue;
      if(animal.speciesBranch?.id&&!recordedBranchFor(history,animal))
        throw Error('Observed carrier lacks recorded taxon membership.');
      add(recordedTaxonFor(history,animal),1,key,tick,active?activePopulation(animal):null);
    }
  };
  const origin=sim.world?.regionOrigin;
  const activeKey=origin?`${origin.x},${origin.y}`:'active';
  bodies(sim.animals,nodes,activeKey,sim.tickCount,true);
  for(const session of sim.planetaryTravel?.sessions||[]){
    const snapshot=session.snapshot;
    if(!regionalEvolutionEnabled(snapshot.core))throw Error('Inconsistent regional autonomous evolution policy.');
    bodies(snapshot.animals,snapshot.controllers.evolutionTree.nodes,session.key,snapshot.core.tickCount);
  }
  for(const entry of sim.planetaryTravel?.unloaded||[]){
    if(owners.has(entry.key))throw Error('Duplicate regional taxon census owner.');owners.add(entry.key);
    const life=entry.life;
    for(const id of life.ids){
      if(identities.has(id))throw Error('Duplicate planetary organism in taxon census.');identities.add(id);
    }
    observed.push({key:entry.key,tick:life.tick});
    if(!life.evolution){complete=false;unresolvedLiving+=life.living;continue}
    validateRecordedTaxonCensus(life.evolution,life);
    if(life.tick!==sim.tickCount)complete=false;
    for(const row of life.evolution.counts)add(row.id,row.living,entry.key,life.tick);
  }
  // Residency and lease order are storage details, not observation order.
  const byKey=([a],[b])=>a<b?-1:a>b?1:0;
  for(const row of rows.values())row.regions=new Map([...row.regions].sort(byKey));
  observed.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  return {rows,complete,observed,unresolvedLiving};
}
