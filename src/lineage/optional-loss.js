import {makePlan,validatePlan} from './body-plan.js';
import {partDef} from './part-registry.js';
import {createDraft,draftProblems,mirrorSocket} from './evolution-draft.js';
import {DEVELOPMENTAL_SYMMETRY} from './developmental-symmetry.js';
// Socket ordinals are canonical placement indices, not organ identities. On a
// multi-occupant socket match the same part and its occurrence, so an armor
// plate cannot pair with a storage sac after asymmetric occupancy shifts #2.
// Index lookups for exactly one mutation attempt. Unlike a persistent
// plan-object cache, this cannot carry stale optional-loss candidates across
// mutation/reconciliation; physical and RNG outcomes remain identical.
function lossIndex(plan){
 const byId=new Map(),bySocket=new Map();
 for(const node of plan.nodes){
   byId.set(node.id,node);
   if(!node.parent)continue;
   const key=`${node.parent}|\0${node.socket}`;
   if(!bySocket.has(key))bySocket.set(key,[]);
   bySocket.get(key).push(node);
 }
 for(const records of bySocket.values())records.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 return{byId,bySocket,at:(parent,socket)=>bySocket.get(`${parent}|\0${socket}`)||[]};
}
function mirroredNode(plan,node,index){
 if(!node.parent)return node;
 const parent=index.byId.get(node.parent),oppositeParent=parent?mirroredNode(plan,parent,index):null;
 if(!oppositeParent)return null;
 const socket=mirrorSocket(node.socket),definition=partDef(oppositeParent.partId)?.providedSockets.find(s=>s.id===socket);
 if(!definition)return null;
 const candidates=index.at(oppositeParent.id,socket);
 if(definition.max===1)return candidates[0]||null;
 const occurrence=index.at(node.parent,node.socket).filter(n=>n.partId===node.partId).findIndex(n=>n.id===node.id);
 return candidates.filter(n=>n.partId===node.partId)[occurrence]||null;
}
// Neutral graph operation only. No environment, population, player or preferred trait.
export function removeOptionalSubtrees(plan,targets){
  if(!Array.isArray(targets)||!targets.length||targets.some(id=>id==='root'||!plan.nodes.some(n=>n.id===id)))return null;
  const drop=new Set(targets);let grew=true;while(grew){grew=false;for(const n of plan.nodes)if(n.parent&&drop.has(n.parent)&&!drop.has(n.id)){drop.add(n.id);grew=true}}
  const next=makePlan(plan.nodes.filter(n=>!drop.has(n.id)).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{headMode:plan.headMode});
  if(!validatePlan(next).ok)return null;
  const draft=createDraft({base:next,ancestry:plan.nodes.map(n=>n.partId),budget:Infinity});if(draftProblems(draft).length)return null;
  return{plan:next,removed:plan.nodes.filter(n=>drop.has(n.id)).map(n=>({id:n.id,partId:n.partId,parent:n.parent,socket:n.socket}))};
}
export function optionalLossChoices(plan,{asymmetric=false}={}){
  const index=lossIndex(plan),out=[],seen=new Set(),paired=DEVELOPMENTAL_SYMMETRY.enabled&&!asymmetric;
  for(const n of [...plan.nodes].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){if(!n.parent)continue;const mirror=paired?mirroredNode(plan,n,index):null,targets=[n.id];if(mirror&&mirror.id!==n.id)targets.push(mirror.id);targets.sort();const key=targets.join('|');if(seen.has(key))continue;seen.add(key);const result=removeOptionalSubtrees(plan,targets);if(result)out.push({targets,...result})}
  return out;
}
