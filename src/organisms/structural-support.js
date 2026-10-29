// structural-support/1 (morphology S3): what a body's own anatomy can carry.
//
// Load-bearing limbs carry the body. Peak limb stress is the body's weight over
// the cross-section of its supporting tissue. Each part's reviewed load stands
// for its tissue: the body load is the sum over all parts, the support is the
// sum over legs mounted on the torso's limb sockets. Heavier torsos, plates,
// sacs and wings raise the load; more legs, or stouter legs (more tissue), raise
// the support. No class or species rule enters: only the anatomy itself.
//
// For the same anatomy scaled by s (and a juvenile at growth g), weight grows as
// (s·g)^3 and cross-section as (s·g)^2, so stress grows as s·g. The stress index
// sigma is relative to the founder anatomy (small torso, four walking legs:
// 5.00 load over 1.60 leg tissue) at adult reference size, where sigma = 1.
//
// Biomechanical anchors: limbs normally work at a safety factor near 3 against
// tissue yield, which is where the founder is placed. Below safety factor 2
// (sigma > 1.5, COMFORT) a body adapts its gait: it accelerates less, loses
// its sprint progressively and moves less economically. At safety factor 1
// (sigma >= 3, YIELD) peak locomotor loads reach yield: no sprint at all, and
// walking slows in proportion. Nothing kills a body for its size; impacts
// (falls, hard landings) injure in proportion to sigma.
//
// An anatomy whose own reference-size sigma already reaches YIELD cannot bear
// its own movement. Mutation and the editor refuse it with an explanation.
import {PARTS} from '../lineage/part-registry.js';
import {structuralScale} from './body-size.js';

export const STRUCTURAL_SUPPORT=Object.freeze({policy:'structural-support/1',referenceLoad:5,referenceLegLoad:1.6,comfort:1.5,yield:3});
const REFERENCE_RATIO=STRUCTURAL_SUPPORT.referenceLoad/STRUCTURAL_SUPPORT.referenceLegLoad;
export const structuralSupportEnabled=sim=>sim?.structuralSupportRules===STRUCTURAL_SUPPORT.policy;
const NEUTRAL=Object.freeze({stress:1,acceleration:1,walk:1,sprint:1,cost:1,impact:1});

const LIMB=/^root\/limb\.\d+$/;
const cache=new WeakMap();
// Body load and leg support of an anatomy (reviewed part loads).
export function planSupport(plan){
 const nodes=plan?.nodes;if(!Array.isArray(nodes))return null;
 const hit=cache.get(plan);
 if(hit&&hit.n===nodes.length&&hit.ids.every((id,i)=>nodes[i]?.partId===id&&hit.sockets[i]===nodes[i]?.id))return hit.support;
 let body=0,legs=0,count=0;
 for(const node of nodes){const part=PARTS[node.partId];if(!part)continue;body+=part.mass;if(LIMB.test(node.id)&&part.tags.includes('leg')){legs+=part.mass;count++}}
 const support=Object.freeze({bodyLoad:body,legLoad:legs,legs:count,ratio:legs>0?body/legs:Infinity,anatomicalStress:legs>0?body/legs/REFERENCE_RATIO:Infinity});
 cache.set(plan,{n:nodes.length,ids:nodes.map(x=>x.partId),sockets:nodes.map(x=>x.id),support});
 return support;
}
// Stress index of a living body: anatomy x inherited size x growth. A body
// without an anatomical plan carries the founder's proportions.
export function stressIndex(animal,growth=1){
 const anatomical=animal?.bodyPlan?planSupport(animal.bodyPlan)?.anatomicalStress??1:1;
 return anatomical*structuralScale(animal)*Math.max(0,growth);
}
// Locomotor limits from stress. Swimming bodies are carried by the water.
export function structuralLimits(sim,animal,{growth=1,swimming=false}={}){
 if(!structuralSupportEnabled(sim)||!animal)return NEUTRAL;
 const {comfort,yield:limit}=STRUCTURAL_SUPPORT,stress=stressIndex(animal,growth);
 if(swimming)return Object.freeze({...NEUTRAL,stress,impact:stress});
 return Object.freeze({stress,
  acceleration:stress<=comfort?1:comfort/stress,
  sprint:stress<=comfort?1:Math.max(0,Math.min(1,(limit-stress)/(limit-comfort))),
  walk:stress<=limit?1:limit/stress,
  cost:stress<=comfort?1:stress/comfort,
  impact:stress});
}
// Speed multiplier for a gait whose sprint factor is `sprintFactor` (1 = walking).
export function structuralSpeed(limits,sprintFactor=1){
 if(limits===NEUTRAL)return 1;
 return limits.walk*(1+(sprintFactor-1)*limits.sprint)/sprintFactor;
}
// Why an anatomy cannot carry itself (null when it can), for mutation and the editor.
export function structuralProblem(plan){
 const s=planSupport(plan);if(!s)return null;
 if(!s.legs)return'Has no load-bearing legs to carry the body.';
 if(s.anatomicalStress<STRUCTURAL_SUPPORT.yield)return null;
 return`Its legs would carry ${s.ratio.toFixed(1)} load per unit of leg tissue, ${s.anatomicalStress.toFixed(1)}x a founder's: they could not bear its own movement. Add or strengthen load-bearing legs, or shed heavy parts.`;
}
// Read-only explanation (editor, inspection and Codex presentation).
export function structuralViability(sim,animal,{growth=1}={}){
 const support=animal?.bodyPlan?planSupport(animal.bodyPlan):null,limits=structuralLimits(sim,animal,{growth});
 const stress=structuralSupportEnabled(sim)?limits.stress:stressIndex(animal,growth),{comfort,yield:limit}=STRUCTURAL_SUPPORT;
 const state=stress<=comfort?'sound':stress<limit?'strained':'overloaded';
 const reasons=[];
 if(state!=='sound')reasons.push(`Limb stress ${stress.toFixed(2)}x a founder's (comfortable up to ${comfort}x).`);
 if(limits.sprint<1)reasons.push(limits.sprint>0?`Sprint limited to ${Math.round(limits.sprint*100)}% of its gain.`:'Cannot sprint without exceeding tissue strength.');
 if(limits.walk<1)reasons.push(`Walks at ${Math.round(limits.walk*100)}% speed to keep loads below yield.`);
 if(limits.acceleration<1)reasons.push(`Accelerates and turns at ${Math.round(limits.acceleration*100)}% of its muscle limit.`);
 return Object.freeze({policy:structuralSupportEnabled(sim)?STRUCTURAL_SUPPORT.policy:null,state,stress,comfort,yield:limit,
  legs:support?.legs??null,bodyLoad:support?.bodyLoad??null,legLoad:support?.legLoad??null,limits,reasons:Object.freeze(reasons)});
}
export function restoreStructuralSupportRules(sim,core){
 if(core.structuralSupportRules===undefined)delete sim.structuralSupportRules;
 else if(core.structuralSupportRules!==STRUCTURAL_SUPPORT.policy)throw Error('Unknown saved structural support rules.');
}
