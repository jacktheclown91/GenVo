import {partDef} from './part-registry.js';

// Borrowed by ProtoSpeciationController. Read existing inherited physical parts,
// never write anatomy, assign abilities, rank mutations by habitat, or name taxa.
export const INHERITED_PARTS='inherited-parts/1';
const FLOOR=.16;
function partProfile(animal){
  const counts={};
  for(const node of animal?.bodyPlan?.nodes||[]){
    if(partDef(node.partId))counts[node.partId]=(counts[node.partId]||0)+1;
  }
  return counts;
}
function historyFor(animal){
  const history=animal?.protoHistory?.physical;
  if(history&&history.rules!==INHERITED_PARTS)throw Error('Unknown inherited physical evidence.');
  return history||null;
}
function familyTotal(counts,family){
  return Object.entries(counts).reduce((sum,[id,count])=>
    sum+(partDef(id)?.family===family?count:0),0);
}
function differences(animal,baseline){
  const current=partProfile(animal),out=[];
  for(const id of [...new Set([...Object.keys(current),...Object.keys(baseline)])].sort()){
    const part=partDef(id);if(!part)continue;
    const delta=(current[id]||0)-(baseline[id]||0);
    const denominator=Math.max(1,familyTotal(current,part.family),familyTotal(baseline,part.family));
    const strength=Math.min(.72,Math.abs(delta)/denominator);
    if(strength<FLOOR)continue;
    const direction=delta>0?'gain':'loss';
    out.push({id:'anatomy:'+id+':'+direction,partId:id,direction,strength,
      currentCount:current[id]||0,ancestralCount:baseline[id]||0});
  }
  return out.sort((a,b)=>b.strength-a.strength||Number(a.direction==='loss')-Number(b.direction==='loss')||a.id.localeCompare(b.id));
}
export function physicalTraitMeta(id){
  const match=/^anatomy:([^:]+):(gain|loss)$/.exec(id||'');
  if(!match||!partDef(match[1]))return null;
  const partName=match[1].replaceAll('-',' '),direction=match[2];
  const label=partName.charAt(0).toUpperCase()+partName.slice(1)+(direction==='gain'?' specialization':' reduction');
  return{id,label,short:partName,pressure:null,
    summary:'Observed inherited '+partName+' '+direction+' relative to recorded ancestry.',
    cause:'inherited physical variation, not an environment-assigned mutation',
    mechanic:'existing parts alone supply their normal abilities and costs'};
}
export function inheritedPhysicalReadings(animal){
  const history=historyFor(animal);if(!history)return[];
  return differences(animal,history.baseline).map(feature=>{
    const track=history.tracks[feature.id];
    if(!track)return null;
    return{...physicalTraitMeta(feature.id),...feature,...track,
      reading:INHERITED_PARTS,inheritanceState:'inherited-neutral',
      populationKey:history.populationKey,populationLabel:history.populationLabel};
  }).filter(Boolean);
}
export function recordInheritedPhysicalEvidence(child,parents,population,day){
  const sources=parents.filter(p=>p?.bodyPlan?.nodes?.length);
  if(!child?.bodyPlan?.nodes?.length||!sources.length)return null;
  const baselines=sources.map(parent=>historyFor(parent)?.baseline||partProfile(parent));
  const baseline={};
  for(const id of [...new Set(baselines.flatMap(b=>Object.keys(b)))].sort())
    baseline[id]=baselines.reduce((sum,b)=>sum+(b[id]||0),0)/baselines.length;
  const parental=sources.map(parent=>({parent,readings:inheritedPhysicalReadings(parent)}));
  const tracks={};
  for(const feature of differences(child,baseline)){
    const contributors=parental.flatMap(({parent,readings})=>
      readings.filter(r=>r.id===feature.id).map(reading=>({id:parent.id,depth:reading.lineageDepth})));
    contributors.sort((a,b)=>b.depth-a.depth||a.id-b.id);
    tracks[feature.id]={lineageDepth:(contributors[0]?.depth||0)+1,
      sourceParentId:contributors[0]?.id??null,
      sourceParentIds:contributors.map(c=>c.id),bornDay:day};
  }
  child.protoHistory={...(child.protoHistory||{}),physical:{rules:INHERITED_PARTS,
    baseline,tracks,populationKey:population?.key||'unassigned',
    populationLabel:population?.label||'Unassigned population'}};
  return inheritedPhysicalReadings(child)[0]||null;
}
