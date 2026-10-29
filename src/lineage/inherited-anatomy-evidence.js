import {partDef} from './part-registry.js';

// Borrowed by ProtoSpeciationController. Read existing inherited physical parts,
// never write anatomy, assign abilities, rank mutations by habitat, or name taxa.
export const INHERITED_PARTS='inherited-parts/1';
// inherited-parts-size/1 (morphology S8, body-size/2 worlds): the same part
// evidence plus inherited body size. Each body also inherits an ancestral
// baseline size (the mean of its parents' baselines, in log scale); a body whose
// own inherited adult scale differs from it is read as a size divergence, with
// strength |ln(scale/baseline)| / ln 2 under the same floor and cap as parts (a
// doubling is a full divergence; the floor is a change of about 12%). Size only
// enters through inheritance and selection; nothing assigns it.
export const INHERITED_PARTS_SIZE='inherited-parts-size/1';
export const physicalEvidenceRules=value=>value===INHERITED_PARTS||value===INHERITED_PARTS_SIZE;
const FLOOR=.16;
const logScale=animal=>{const a=animal?.bodySize?.alleles;return a?(a[0]+a[1])/2:null};
function partProfile(animal){
  const counts={};
  for(const node of animal?.bodyPlan?.nodes||[]){
    if(partDef(node.partId))counts[node.partId]=(counts[node.partId]||0)+1;
  }
  return counts;
}
function historyFor(animal){
  const history=animal?.protoHistory?.physical;
  if(history&&!physicalEvidenceRules(history.rules))throw Error('Unknown inherited physical evidence.');
  return history||null;
}
function familyTotal(counts,family){
  return Object.entries(counts).reduce((sum,[id,count])=>
    sum+(partDef(id)?.family===family?count:0),0);
}
function differences(animal,baseline,baselineSize=null){
  const current=partProfile(animal),out=[];
  const size=logScale(animal);
  if(baselineSize!==null&&size!==null){const delta=size-baselineSize,strength=Math.min(.72,Math.abs(delta)/Math.LN2);
    if(strength>=FLOOR){const direction=delta>0?'larger':'smaller';out.push({id:'size:'+direction,direction,strength,currentScale:Math.exp(size),ancestralScale:Math.exp(baselineSize)})}}
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
  const size=/^size:(larger|smaller)$/.exec(id||'');
  if(size){const larger=size[1]==='larger';return{id,label:larger?'Larger body':'Smaller body',short:larger?'larger body':'smaller body',pressure:null,
    summary:'Observed inherited body size '+(larger?'increase':'decrease')+' relative to recorded ancestry.',
    cause:'inherited size variation and selection, not an assigned size',mechanic:'size alone changes its normal physical costs and limits'}}
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
  return differences(animal,history.baseline,history.baselineSize??null).map(feature=>{
    const track=history.tracks[feature.id];
    if(!track)return null;
    return{...physicalTraitMeta(feature.id),...feature,...track,
      reading:INHERITED_PARTS,inheritanceState:'inherited-neutral',
      populationKey:history.populationKey,populationLabel:history.populationLabel};
  }).filter(Boolean);
}
export function recordInheritedPhysicalEvidence(child,parents,population,day,{size=false}={}){
  const sources=parents.filter(p=>p?.bodyPlan?.nodes?.length);
  const sized=size&&logScale(child)!==null&&sources.every(p=>logScale(p)!==null);
  const baselineSize=sized?sources.reduce((t,p)=>t+(historyFor(p)?.baselineSize??logScale(p)),0)/sources.length:null;
  if(!child?.bodyPlan?.nodes?.length||!sources.length)return null;
  const baselines=sources.map(parent=>historyFor(parent)?.baseline||partProfile(parent));
  const baseline={};
  for(const id of [...new Set(baselines.flatMap(b=>Object.keys(b)))].sort())
    baseline[id]=baselines.reduce((sum,b)=>sum+(b[id]||0),0)/baselines.length;
  const parental=sources.map(parent=>({parent,readings:inheritedPhysicalReadings(parent)}));
  const tracks={};
  for(const feature of differences(child,baseline,baselineSize)){
    const contributors=parental.flatMap(({parent,readings})=>
      readings.filter(r=>r.id===feature.id).map(reading=>({id:parent.id,depth:reading.lineageDepth})));
    contributors.sort((a,b)=>b.depth-a.depth||a.id-b.id);
    tracks[feature.id]={lineageDepth:(contributors[0]?.depth||0)+1,
      sourceParentId:contributors[0]?.id??null,
      sourceParentIds:contributors.map(c=>c.id),bornDay:day};
  }
  child.protoHistory={...(child.protoHistory||{}),physical:{rules:sized?INHERITED_PARTS_SIZE:INHERITED_PARTS,
    baseline,...(sized?{baselineSize}:{}),tracks,populationKey:population?.key||'unassigned',
    populationLabel:population?.label||'Unassigned population'}};
  return inheritedPhysicalReadings(child)[0]||null;
}
