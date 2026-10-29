import {SPECIES} from './species.js';
import {developmentFor} from '../family/family.js';
import {PARTS} from '../lineage/part-registry.js';
import {validatePlan} from '../lineage/body-plan.js';
import {adultSizeScale,bodyDimensions} from './body-size.js';

export const ANATOMICAL_MASS='relative-anatomical-load/1';
export const LEGACY_MASS='legacy-species/1';
export const MASS_PER_LOAD=.29,REFERENCE_MASS=1.45;
// Derived, nonpersistent cache. Compare every validation/load determinant so even
// in-place plan edits cannot retain stale capacity or bypass validation.
const capacityCache=new WeakMap();
const fields=['id','partId','partVersion','parent','socket'];
export function massPolicy(animal){
  const policy=animal?.massPolicy??LEGACY_MASS;
  if(policy!==ANATOMICAL_MASS&&policy!==LEGACY_MASS)throw Error('Unknown mass policy: '+policy);
  return policy;
}
// Structural capacity in relative game units, not kilograms or owned elemental tissue.
// Consumed edible stock remains separately accounted by prey-biomass.js.
// body-size/1 scales the anatomy's adult mass by the inherited linear scale cubed.
export function adultBodyMass(animal){
  if(!animal?.bodySize)return anatomicalAdultMass(animal);
  return anatomicalAdultMass(animal)*adultSizeScale(animal)**3;
}
function anatomicalAdultMass(animal){
  if(massPolicy(animal)===LEGACY_MASS)return SPECIES[animal?.species]?.mass||0;
  const plan=animal?.bodyPlan;
  if(!plan)throw Error('Missing anatomical mass body');
  const cached=capacityCache.get(plan);
  if(cached&&cached.schema===plan.schema&&cached.registryVersion===plan.registryVersion&&cached.headMode===plan.headMode&&cached.nodes.length===plan.nodes?.length){
    let same=true;for(let i=0;i<cached.nodes.length&&same;i++){const n=plan.nodes[i],old=cached.nodes[i];if(n.id!==old.id||n.partId!==old.partId||n.partVersion!==old.partVersion||n.parent!==old.parent||n.socket!==old.socket||PARTS[n.partId]?.mass!==old.load)same=false;}
    if(same)return cached.mass;
  }
  const validation=validatePlan(plan);
  if(!validation.ok)throw Error('Unsupported anatomical mass body: '+validation.errors.join('; '));
  let centiload=0;
  for(const node of plan.nodes){const load=PARTS[node.partId]?.mass;
    if(!Number.isFinite(load)||load<0||Math.abs(load*100-Math.round(load*100))>1e-10)throw Error('Unreviewed anatomical load: '+node.partId);
    centiload+=Math.round(load*100);
  }
  const mass=centiload/100*MASS_PER_LOAD;
  if(!(mass>0&&Number.isFinite(mass)))throw Error('Invalid anatomical mass');
  capacityCache.set(plan,{schema:plan.schema,registryVersion:plan.registryVersion,headMode:plan.headMode,nodes:plan.nodes.map(n=>Object.fromEntries([...fields.map(k=>[k,n[k]]),['load',PARTS[n.partId].mass]])),mass});
  return mass;
}
export function bodyMass(animal){return adultBodyMass(animal)*developmentFor(animal).growth**3;}
// Read-only physical size for presentation and interaction (Codex contract).
export function bodyDimensionsOf(animal){return bodyDimensions(animal,developmentFor(animal),{adultMass:adultBodyMass(animal),mass:bodyMass(animal)})}
export function bodyMassFraction(animal){
  if(massPolicy(animal)===ANATOMICAL_MASS)return developmentFor(animal).growth**3;
  const adult=SPECIES[animal?.species]?.mass;return adult?bodyMass(animal)/adult:1;
}
export function basalResourceCosts(animal){
  if(massPolicy(animal)===ANATOMICAL_MASS){const mass=bodyMass(animal);return{energy:.052/REFERENCE_MASS*mass,water:.044/REFERENCE_MASS*mass};}
  const s=SPECIES[animal.species],fraction=bodyMassFraction(animal);
  return{energy:s.baseMetabolism*fraction,water:s.waterUse*fraction};
}
export function restoreMassRules(sim,core){
  if(core.massRules===undefined)delete sim.massRules;
  else if(core.massRules!==ANATOMICAL_MASS&&core.massRules!==LEGACY_MASS)throw Error('Unknown saved mass rules: '+core.massRules);
  const expected=sim.massRules??LEGACY_MASS;
  const check=a=>{if(!a)return;if(massPolicy(a)!==expected)throw Error('Saved organism mass policy differs from world');if(expected===ANATOMICAL_MASS)adultBodyMass(a);};
  for(const a of sim.animals){check(a);check(a.pregnant?.maternalInheritance);check(a.pregnant?.paternalInheritance);}
  for(const egg of sim.eggs||[]){check(egg.maternalInheritance);check(egg.paternalInheritance);}
}
export {tissueInventory,evaluateTissueStructure,TISSUE_PARTS,TISSUE_SCHEMA} from './tissue-structure.js';
