// Legacy milestones (creator direction 2026-10-22): optional achievements that
// arise from GenVo's existing biological rules, not a campaign or a fixed final
// creature. Nothing here creates offspring, protects a family, forces a
// mutation or ends the simulation; the world continues after every milestone.
//  The First Legacy — survive, reproduce, and continue the line: awarded at the
//    first real handoff of control to a living DESCENDANT of the creature you
//    were (chosen with H, or after its death). A relative who is not a
//    descendant continues the run but does not earn it.
//  Eight-Generation Legacy — the existing generation-8 "lineage established"
//    milestone, recorded with the same summary.
// The record is created only when a milestone is earned, so saves without one
// are unchanged. Summaries describe actual organisms at the moment of handoff.
export const LEGACY_MILESTONES=Object.freeze({schema:1,eightGenerations:8});
const partsOf=a=>[...new Set((a?.bodyPlan?.nodes||[]).map(n=>n.partId))].sort();
function bodySummary(a){return{id:a.id,generation:a.generation||1,sex:a.sex||null,species:a.species,age:Math.round(a.age||0),parts:partsOf(a),adaptations:[...(a.adaptations||[])].sort()}}
function summary(sim,from,to,handoff){
 const before=new Set(partsOf(from)),after=new Set(partsOf(to)),offspring=sim.animals.filter(a=>a.parentIds?.includes(from.id));
 return{day:sim.day,year:sim.year??null,tick:sim.tickCount,reason:handoff?.reason||'handoff',from:bodySummary(from),to:bodySummary(to),
  inheritedParts:[...after].filter(p=>before.has(p)),newParts:[...after].filter(p=>!before.has(p)),lostParts:[...before].filter(p=>!after.has(p)),
  offspringBorn:offspring.length,offspringAlive:offspring.filter(a=>a.alive).length,lineageAlive:sim.animals.filter(a=>a.alive&&a.lineage).length};
}
// Called by the lineage controller after every handoff. Returns the milestones
// newly earned by this handoff (possibly none).
export function recordLegacyHandoff(sim,from,to,handoff){
 if(!from||!to||!sim.lineage?.isDescendant?.(to.id,from.id))return[];
 const earned=[],state=sim.legacyMilestones||{schema:LEGACY_MILESTONES.schema};
 if(!state.firstLegacy){state.firstLegacy=summary(sim,from,to,handoff);earned.push('firstLegacy')}
 if(!state.eightGenerations&&(to.generation||1)>=LEGACY_MILESTONES.eightGenerations){state.eightGenerations=summary(sim,from,to,handoff);earned.push('eightGenerations')}
 if(earned.length){sim.legacyMilestones=state;handoff.legacy=earned}
 return earned;
}
// Read-only progress toward The First Legacy for the current creature.
export function firstLegacyProgress(sim,p,{fedAndWatered=false}={}){
 if(sim.legacyMilestones?.firstLegacy)return{complete:true,steps:3};
 if(!p)return{complete:false,steps:0};
 const children=sim.animals.filter(a=>a.alive&&a.parentIds?.includes(p.id)),heirs=sim.lineage?.eligibleHeirs?.()||[];
 const life=fedAndWatered,family=children.length>0||heirs.length>0;
 return{complete:false,steps:(life?1:0)+(family?1:0),life,family,heirReady:heirs.length>0,children:children.length};
}
export function validateLegacyMilestones(state){
 if(state===undefined)return;
 if(state?.schema!==LEGACY_MILESTONES.schema)throw Error('Invalid legacy milestone record.');
 for(const key of ['firstLegacy','eightGenerations']){const m=state[key];if(m===undefined)continue;
  if(!Number.isSafeInteger(m?.tick)||!m.from||!m.to||!Number.isSafeInteger(m.to.generation)||!(m.to.generation>m.from.generation))throw Error('Invalid legacy milestone: '+key)}
}
