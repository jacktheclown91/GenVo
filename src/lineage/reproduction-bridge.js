import {projectWaterPhysiology} from './water-physiology.js';
import {PARTS} from './part-registry.js';
import {bodyPlanFromLegacy,serializePlan,deserializePlan,validatePlan} from './body-plan.js';
import {syncAnatomy,refreshExpression,ANATOMY_FOR} from './evolution.js';

// Evolution Expansion Phase C (GDD v1, sections 3.2 and 7.4; backlog EV-010): reproduction bridge.
// A committed lineage target shapes the litter it was made for, and never any living creature.
// Each newborn of that litter is drawn from the target plan, and parts that stand for an ability
// that already exists (creator decision 2026-10-09) give or take that ability through the existing
// anatomy: a part present raises its body part past its threshold; a mapped part absent lowers
// it below. Parts with no ability yet (locked in the editor) change nothing. No RNG is used.
// Until Phase E adds sibling variation, the litter matches the committed target.

// The body plan a creature is drawn from: its own, or the one its adaptations imply.
export function planFor(animal){return animal?.bodyPlan||bodyPlanFromLegacy(animal)}

// Parts the lineage has expressed: this creature, its recorded ancestors and their committed targets.
export function ancestryFor(sim,animal){
  const out=new Set();const add=plan=>{for(const n of plan?.nodes||[])out.add(n.partId)};
  add(planFor(animal));
  for(const rec of sim?.lineage?.ancestryPath?.(animal?.id)||[]){if(rec.bodyPlanParts)for(const id of rec.bodyPlanParts)out.add(id);else add(bodyPlanFromLegacy({adaptations:rec.adaptations||[]}))}
  return out;
}

// Axes the editor can drive: each legacy-linked part, grouped by anatomy axis with its threshold.
const AXIS_PARTS=(()=>{const m={};for(const p of Object.values(PARTS))if(p.legacy){(m[p.legacy.axis]||=[]).push({id:p.id,threshold:p.legacy.threshold,adaptation:p.legacy.adaptation})}return m})();
export function editableAxes(){return Object.keys(AXIS_PARTS)}

export function applyLineageTarget(child,plan,{preserveLegacyWater=false}={}){
  if(!child||!plan||!validatePlan(plan).ok)return false;
  child.bodyPlan=deserializePlan(serializePlan(plan));const an=syncAnatomy(child);if(!an)return false;
  const present=new Set(plan.nodes.map(n=>n.partId));
  for(const [axis,parts] of Object.entries(AXIS_PARTS)){
    if(axis==='waterBody')continue;
    const have=parts.filter(p=>present.has(p.id)).sort((a,b)=>b.threshold-a.threshold)[0];
    if(have){const seed=have.threshold>=.8?.9:.65;an[axis]=Math.max(an[axis]||0,seed);
      // The highest part on this axis caps it below the next tier unless that tier is present too.
      const higher=Object.entries(ANATOMY_FOR).filter(([,d])=>d.axis===axis&&d.threshold>have.threshold).map(([,d])=>d.threshold).sort((a,b)=>a-b)[0];
      if(higher!=null&&!parts.some(p=>p.threshold>=higher&&present.has(p.id))&&parts.some(p=>p.threshold>=higher))an[axis]=Math.min(an[axis],higher-.15)}
    else{const low=Math.min(...parts.map(p=>p.threshold));if((an[axis]||0)>=low)an[axis]=Math.max(0,low-.15)}
  }
  projectWaterPhysiology(child,plan,{preserveLegacy:preserveLegacyWater});
  refreshExpression(child);return true;
}
