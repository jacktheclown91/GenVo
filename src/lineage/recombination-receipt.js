// Observational birth evidence, never a developmental or material authority.
// Socket names locate selected structures; they are not persistent tissue IDs.
export const RECOMBINATION_RECEIPT='genvo.recombination-receipt/1';
export function recombinationReceipt(plan,parents,selections,mode){
  return{schema:RECOMBINATION_RECEIPT,mode,bodyId:plan.id,nodes:plan.nodes.map(n=>({nodeId:n.id,partId:n.partId,partVersion:n.partVersion,sources:(selections.get(n.id)||[]).flatMap(parentIndex=>{
    const source=parents[parentIndex]?.nodes.find(p=>p.id===n.id&&p.partId===n.partId&&p.partVersion===n.partVersion&&p.parent===n.parent&&p.socket===n.socket);
    return source?[{parentIndex,nodeId:source.id}]:[];
  })}))};
}
export function singlePlanSelections(plan,indices){return new Map(plan.nodes.map(n=>[n.id,[...indices]]));}
export function recordedInheritanceSummary(receipt,variation){
  if(receipt?.schema!==RECOMBINATION_RECEIPT||!Array.isArray(receipt.parents)||receipt.recombined?.schema!==RECOMBINATION_RECEIPT||!Array.isArray(receipt.recombined.nodes))return null;
  const counts=[0,0];let matching=0,unresolved=0;
  for(const n of receipt.recombined.nodes){if(n.sources?.length===2)matching++;else if(n.sources?.length===1&&[0,1].includes(n.sources[0].parentIndex))counts[n.sources[0].parentIndex]++;else unresolved++;}
  const selected=counts.map((count,i)=>`${count} from parent ${i+1}${receipt.parents[i]?.id!=null?' #'+receipt.parents[i].id:''}`).join(', ');
  const ambiguity=matching?` ${matching} match both parent bodies; no separate donor was selected for those structures.`:'';
  const unknown=unresolved?` ${unresolved} source positions are unresolved.`:'';
  const moved=variation?.accepted?variation.moved?.length||0:0,removed=variation?.accepted?variation.removed?.length||0:0;
  const development=moved?` Development relocated ${moved} existing structures.`:removed?` Development removed ${removed} mounted structures.`:variation?.attempted&&variation.accepted?` Development changed the selected layout (${variation.operator}).`:'';
  const filtered=receipt.parents.some(p=>p.filteredExclusiveParts)?' Exclusive relic structures were filtered from an ancestral layout before selection.':'';
  const guided=variation?.guidedOverride?' A later guided design changed the expressed layout.':'';
  return `Recorded recombination: ${selected}.${ambiguity}${unknown}${development}${filtered}${guided} This records structure selection before development, not transferred parental tissue.`;
}
