import {autonomousEvolutionEnabled,regionalReferenceEvolutionEnabled} from './autonomous-evolution.js';
import {validateRegionalPressureObservations} from '../ecology/population-profile.js';
import {physicalEvidenceRules,physicalTraitMeta} from './inherited-anatomy-evidence.js';
import {partDef} from './part-registry.js';

// Validate prospective observational history only after canonical controllers
// have restored. Missing policy leaves historical saves completely untouched.
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const identifier=value=>typeof value==='string'&&value.length>0;
const nullableIdentifier=value=>value===null||identifier(value);
const nonnegative=value=>Number.isFinite(value)&&value>=0;
const integer=value=>Number.isSafeInteger(value)&&value>=0;
function validateWitness(witness){
  if(witness===undefined)return;
  if(!object(witness)||witness.rules!=='conception-population/1'||
     !nullableIdentifier(witness.key)||!nullableIdentifier(witness.sourceKey)||
     !nullableIdentifier(witness.taxonId)||!integer(witness.tick))
    throw Error('Invalid saved conception population evidence.');
}
function validateBody(animal,nodes){
  if(!animal)return;
  const ancestry=animal.evolutionaryAncestry;
  if(ancestry!==undefined){
    const root=nodes.get(ancestry.rootId);
    if(!object(ancestry)||!root||root.parentId!==null||
       !Array.isArray(ancestry.parentTaxonIds)||ancestry.parentTaxonIds.some(id=>!nodes.has(id)))
      throw Error('Invalid saved evolutionary ancestry.');
  }
  const physical=animal.protoHistory?.physical;
  if(physical!==undefined){
    if(!object(physical)||!physicalEvidenceRules(physical.rules)||!object(physical.baseline)||!object(physical.tracks)||
       (physical.baselineSize!==undefined&&(physical.rules==='inherited-parts/1'||!Number.isFinite(physical.baselineSize)))||
       Object.entries(physical.baseline).some(([id,count])=>!partDef(id)||!nonnegative(count)))
      throw Error('Invalid saved inherited physical evidence.');
    for(const [id,track] of Object.entries(physical.tracks)){
      if(!physicalTraitMeta(id)||!object(track)||!integer(track.lineageDepth)||track.lineageDepth<1||
         track.lineageDepth>(animal.generation||1)||!Array.isArray(track.sourceParentIds)||
         track.sourceParentIds.some(parent=>!integer(parent))||
         track.sourceParentId!==null&&!integer(track.sourceParentId)||!nonnegative(track.bornDay))
        throw Error('Invalid saved inherited physical history.');
    }
  }
  validateWitness(animal.evolutionaryPopulationAtConception);
  if(animal.speciesBranch?.id){
    const node=nodes.get(animal.speciesBranch.id);
    if(!node||!node.memberIds.has(animal.id))throw Error('Saved species identity lacks its authoritative tree history.');
  }
}
export function validateAutonomousEvolutionState(sim){
  if(!autonomousEvolutionEnabled(sim))return;
  if(regionalReferenceEvolutionEnabled(sim))
    for(const history of sim.populationMemory.histories.values())validateRegionalPressureObservations(history);
  const nodes=sim.evolutionTree.nodes;
  if(!(nodes instanceof Map))throw Error('Invalid saved evolutionary tree.');
  for(const node of nodes.values()){
    if(!(node.memberIds instanceof Set)||node.parentId!==null&&!nodes.has(node.parentId))
      throw Error('Invalid saved evolutionary tree ancestry.');
    const seen=new Set();let current=node;
    while(current){
      if(seen.has(current.id))throw Error('Cyclic saved evolutionary ancestry.');
      seen.add(current.id);current=current.parentId?nodes.get(current.parentId):null;
    }
  }
  const bodies=[...sim.animals];
  for(const animal of sim.animals)if(animal.pregnant)
    for(const key of ['maternalInheritance','paternalInheritance'])bodies.push(animal.pregnant[key]);
  for(const egg of sim.eggs||[])
    for(const key of ['maternalInheritance','paternalInheritance'])bodies.push(egg[key]);
  for(const animal of bodies)validateBody(animal,nodes);
  const childIds=new Set();
  for(const event of sim.speciation.births){
    if(childIds.has(event.childId))throw Error('Duplicate saved evolutionary birth evidence.');
    childIds.add(event.childId);
    if(event.rules!=='conception-population/1'||!integer(event.childId)||!nonnegative(event.day)||
       !identifier(event.populationKey)||!nullableIdentifier(event.sourceKey)||
       !Array.isArray(event.involvedKeys)||event.involvedKeys.some(key=>!identifier(key))||
       [event.parentKeys,event.sourceKeys,event.parentTaxa].some(keys=>!Array.isArray(keys)||keys.length!==2||keys.some(key=>!nullableIdentifier(key))))
      throw Error('Invalid saved evolutionary birth evidence.');
  }
  for(const state of sim.speciation.states.values())if(state.recognized){
    const node=nodes.get(state.branch?.id);
    if(!node||node.originPopulationKey!==state.populationKey||!node.parentId)
      throw Error('Saved recognition lacks its authoritative ancestry.');
  }
}
