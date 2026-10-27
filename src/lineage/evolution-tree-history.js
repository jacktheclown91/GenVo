// Borrowed by the existing evolutionary-tree authority and its regional carriers.
// This merges recorded history only; it never recognizes or assigns a taxon.
const eventKey=event=>JSON.stringify(Object.keys(event).sort().map(key=>[key,event[key]]));
const counts=events=>{
  const out=new Map();
  for(const event of events){const key=eventKey(event);out.set(key,(out.get(key)||0)+1)}
  return out;
};
const includesCounts=(outer,inner)=>[...inner].every(([key,count])=>(outer.get(key)||0)>=count);
function checkHistory(history){
  if(!(history?.nodes instanceof Map)||!Array.isArray(history.events))
    throw Error('Invalid recorded evolutionary-tree history.');
  for(const [id,node] of history.nodes){
    if(!node||node.id!==id||!(node.memberIds instanceof Set)||
       node.parentId!==null&&typeof node.parentId!=='string')
      throw Error('Invalid recorded evolutionary-tree node.');
  }
}
function branchEvents(history,id){return history.events.filter(event=>event.branchId===id)}
function lastDay(node,events){
  let day=Math.max(node.formedDay||0,node.endedDay||0);
  for(const event of events)day=Math.max(day,event.day||0);
  return day;
}
function statusSource(existing,incoming,target,source){
  const oldEvents=branchEvents(target,existing.id),newEvents=branchEvents(source,incoming.id);
  const oldDay=lastDay(existing,oldEvents),newDay=lastDay(incoming,newEvents);
  if(newDay>oldDay)return incoming;
  if(oldDay>newDay)return existing;
  const oldCounts=counts(oldEvents),newCounts=counts(newEvents);
  const newerIncludesOlder=includesCounts(newCounts,oldCounts);
  const olderIncludesNewer=includesCounts(oldCounts,newCounts);
  if(newerIncludesOlder&&!olderIncludesNewer)return incoming;
  if(olderIncludesNewer&&!newerIncludesOlder)return existing;
  if(existing.status!==incoming.status||existing.endedDay!==incoming.endedDay||
     existing.endedReason!==incoming.endedReason)
    throw Error('Conflicting recorded evolutionary boundary history.');
  return existing;
}
function mergeNode(existing,incoming,target,source){
  const members=new Set(existing.memberIds);
  for(const id of incoming.memberIds)members.add(id);
  if(existing.parentId===null&&incoming.parentId===null){
    // An empty constructor root is not an observation of a founding species.
    const chosen=!existing.kind&&incoming.kind?incoming:existing;
    if(existing.kind&&incoming.kind&&
       (existing.species!==incoming.species||existing.label!==incoming.label))
      throw Error('Conflicting recorded founding ancestry.');
    const out={...structuredClone(chosen),memberIds:members};
    if(existing.kind&&incoming.kind)out.formedDay=Math.min(existing.formedDay,incoming.formedDay);
    return out;
  }
  for(const key of ['parentId','originPopulationKey','traitId','label','depth','formedDay','formedGeneration']){
    if(existing[key]!==incoming[key])throw Error('Conflicting recorded taxon identity: '+existing.id);
  }
  const chosen=statusSource(existing,incoming,target,source);
  return {...structuredClone(chosen),memberIds:members,
    recognitions:Math.max(existing.recognitions||0,incoming.recognitions||0)};
}
function checkParents(nodes){
  for(const node of nodes.values()){
    let current=node;const seen=new Set();
    while(current){
      if(seen.has(current.id))throw Error('Cyclic recorded evolutionary ancestry.');
      seen.add(current.id);
      if(current.parentId===null)break;
      current=nodes.get(current.parentId);
      if(!current)throw Error('Missing recorded evolutionary ancestor.');
    }
  }
}
export function mergeEvolutionaryTreeHistory(target,source){
  checkHistory(target);checkHistory(source);
  const nodes=structuredClone(target.nodes);
  for(const [id,incoming] of source.nodes){
    const existing=nodes.get(id);
    nodes.set(id,existing?mergeNode(existing,incoming,target,source):structuredClone(incoming));
  }
  checkParents(nodes);
  // Preserve historical event multiplicity and order. Repeated publication of
  // the same regional history adds neither duplicate events nor recognitions.
  const events=structuredClone(target.events),available=counts(target.events),seen=new Map();
  for(const event of source.events){
    const key=eventKey(event),number=(seen.get(key)||0)+1;seen.set(key,number);
    if(number>(available.get(key)||0))events.push(structuredClone(event));
  }
  return {nodes,events};
}
export function evolutionaryHistoryForBodies(history,bodies){
  checkHistory(history);
  const needed=new Set(),seen=new Set(),pending=[...bodies];
  const add=id=>{if(id!==undefined&&id!==null)needed.add(id)};
  while(pending.length){
    const body=pending.pop();if(!body||seen.has(body))continue;seen.add(body);
    add(body.evolutionaryAncestry?.rootId);
    for(const id of body.evolutionaryAncestry?.parentTaxonIds||[])add(id);
    add(body.speciesBranch?.id);
    for(const branch of body.speciesBranchHistory||[])add(branch.id);
    add(body.evolutionaryPopulationAtConception?.taxonId);
    if(body.speciesBranch?.id&&!history.nodes.get(body.speciesBranch.id)?.memberIds.has(body.id))
      throw Error('Recorded carrier lacks its authoritative tree membership.');
    pending.push(body.pregnant?.maternalInheritance,body.pregnant?.paternalInheritance);
  }
  const nodes=new Map(),queue=[...needed];
  while(queue.length){
    const id=queue.pop();if(nodes.has(id))continue;
    const node=history.nodes.get(id);
    if(!node)throw Error('Carrier lacks recorded evolutionary ancestry: '+id);
    nodes.set(id,structuredClone(node));
    if(node.parentId!==null)queue.push(node.parentId);
  }
  checkParents(nodes);
  return {nodes,events:structuredClone(history.events.filter(event=>nodes.has(event.branchId)))};
}
