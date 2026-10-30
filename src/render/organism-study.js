// Read-only handoff from a recorded animal to the isolated Creature Lab.
import {deserializePlan,serializePlan,validatePlan} from '../lineage/body-plan.js';
import {SPECIES,GENE_KEYS} from '../organisms/species.js';
import {BODY_SIZE,bodySizePolicy,validateBodySize} from '../organisms/body-size.js';
import {bodyDimensionsOf,massPolicy} from '../organisms/body-mass.js';
const FIELDS=['id','species','age','genes','pigmentGenome','anatomy','adaptations','lineageForm','populationTrait','speciesBranch','ecoLifestyle','coatDensity','sex','massPolicy','bodySize'];
export function organismStudy(animal,{seed=null,day=null,bodySizeRules}={}){
 if(!animal?.bodyPlan)throw Error('Recorded modular anatomy is unavailable.');
 const reading=Object.fromEntries(FIELDS.filter(k=>animal[k]!==undefined).map(k=>[k,structuredClone(animal[k])]));
 return readOrganismStudy({format:'genvo.organism-study/1',source:{seed,day,...(bodySizeRules===undefined?{}:{bodySizeRules})},animal:{...reading,bodyPlan:serializePlan(animal.bodyPlan)}});
}
export function readOrganismStudy(input){
 const data=typeof input==='string'?JSON.parse(input):input;
 if(data?.format!=='genvo.organism-study/1')throw Error('Not a GenVo organism study.');
 const raw=data.animal;if(!raw||!SPECIES[raw.species]||!Number.isFinite(raw.age)||raw.age<0||!Number.isFinite(raw.id))throw Error('Invalid recorded organism.');
 if(!raw.genes||!GENE_KEYS.every(k=>Number.isFinite(raw.genes[k])))throw Error('Invalid recorded genes.');
 const policy=data.source?.bodySizeRules;
 if(policy!==undefined&&!bodySizePolicy(policy))throw Error('Invalid organism study size policy.');
 if(raw.bodySize!==undefined)validateBodySize(raw.bodySize,policy??BODY_SIZE.policy);
 const bodyPlan=deserializePlan(typeof raw.bodyPlan==='string'?raw.bodyPlan:JSON.stringify(raw.bodyPlan));
 const validation=validatePlan(bodyPlan);if(!validation.ok)throw Error('Invalid recorded body plan.');
 const animal={...Object.fromEntries(FIELDS.filter(k=>raw[k]!==undefined).map(k=>[k,structuredClone(raw[k])])),bodyPlan,alive:true};
 massPolicy(animal);bodyDimensionsOf(animal);
 return{format:'genvo.organism-study/1',source:{...(policy===undefined?{}:{bodySizeRules:policy}),seed:typeof data.source?.seed==='string'?data.source.seed:null,day:Number.isFinite(data.source?.day)?data.source.day:null},animal};
}
export function downloadOrganismStudy(animal,source){
 const study=organismStudy(animal,source),url=URL.createObjectURL(new Blob([JSON.stringify(study,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='genvo-organism-'+animal.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
