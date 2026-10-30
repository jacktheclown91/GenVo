import {ARID_PHYSIOLOGY,aridExpressionOf} from '../ecology/arid-physiology.js';

// Presentation authority is the real arid-physiology readout. Most wildlife
// has neither anatomical radiator nor wax plates; skip expensive heat/part
// sampling for those individuals. The exact rule gate protects recorded saves.
const SPECIAL=new Set(['heat-frill','wax-plates']);
export function aridVisualReading(sim,animal){
 if(sim?.aridPhysiologyRules!==ARID_PHYSIOLOGY.policy||!animal?.alive)return null;
 const relevant=animal.torpor&&animal.torporKind==='aestivation'||
   animal.bodyPlan?.nodes?.some(n=>SPECIAL.has(n.partId));
 if(!relevant)return null;
 const reading=aridExpressionOf(sim,animal);
 return reading?.policy===ARID_PHYSIOLOGY.policy?reading:null;
}

// Reuse the native torpor/rest pose. Dehydration dormancy is a settled,
// tucked body, not an invented sleep action or another clock.
export function applyAestivationPosture(behavior,life,arid){
 if(!arid?.aestivating||!life?.dormant||!behavior)return false;
 behavior.bodyDrop=(behavior.bodyDrop||0)+.26;
 behavior.headDrop=(behavior.headDrop||0)+.22;
 behavior.compress=(behavior.compress||0)+.12;
 behavior.feelerPin=Math.max(behavior.feelerPin||0,.92);
 behavior.feelerForward=Math.min(behavior.feelerForward??1,.48);
 behavior.guardPlanted=true;
 return true;
}
