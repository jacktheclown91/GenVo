import {STRUCTURAL_SUPPORT,structuralViability,structuralProblem} from '../../src/organisms/structural-support.js';
import {developmentalPreview} from './development-preview.js';
import {attachPart} from './assembly-model.js';

// This is an explicitly current-rules workshop study, never the imported
// world's rules or a new biological validity check. The shared query owns load.
const RULES=Object.freeze({structuralSupportRules:STRUCTURAL_SUPPORT.policy});
const LABELS={sound:'Comfortable support',strained:'Strained support',overloaded:'Overloaded support'};
const stressText=r=>Number.isFinite(r.stress)?r.stress.toFixed(2)+'× founder limb stress':'No load-bearing legs';
const description=r=>LABELS[r.state]+' · '+stressText(r);
export function labStructuralStudy(animal,percent=100,selected=null){
 const preview=developmentalPreview(animal,percent);
 const current=structuralViability(RULES,preview.animal,{growth:preview.development.growth});
 const adult=structuralViability(RULES,animal,{growth:1});
 const problem=structuralProblem(animal.bodyPlan);
 let candidate=null;
 if(selected){
  try{
   const bodyPlan=attachPart(animal.bodyPlan,selected.parent,selected.socket,selected.partId);
   const reading=structuralViability(RULES,{...animal,bodyPlan},{growth:1});
   const difference=reading.stress-adult.stress;
   const change=!Number.isFinite(adult.stress)&&Number.isFinite(reading.stress)?'restores load-bearing support':Number.isFinite(adult.stress)&&!Number.isFinite(reading.stress)?'removes load-bearing support':Number.isFinite(difference)&&Math.abs(difference)>1e-9?(difference<0?'reduces':'increases')+' adult limb stress by '+Math.abs(difference).toFixed(2)+'×':'same adult limb stress';
   candidate={available:true,reading,text:'Selected attachment: '+description(reading)+'; '+change+'.'};
  }catch(error){candidate={available:false,text:'Selected attachment unavailable: '+error.message}}
 }
 return{current,adult,problem,candidate,
  summary:description(current)+(percent<100?' at preview age. Adult: '+LABELS[adult.state].toLowerCase()+'.':'.'),
  adultSummary:description(adult)+' · '+adult.legs+' supporting '+(adult.legs===1?'leg':'legs')+'.'};
}
