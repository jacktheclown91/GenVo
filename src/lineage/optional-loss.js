import {makePlan,validatePlan,serializePlan} from './body-plan.js';
import {partDef} from './part-registry.js';
import {createDraft,draftProblems,mirrorSocket} from './evolution-draft.js';
import {DEVELOPMENTAL_SYMMETRY} from './developmental-symmetry.js';
// Socket ordinals are canonical placement indices, not organ identities. On a
// multi-occupant socket match the same part and its occurrence, so an armor
// plate cannot pair with a storage sac after asymmetric occupancy shifts #2.
function mirroredNode(plan,node){
  if(!node.parent)return node;
  const parent=plan.nodes.find(n=>n.id===node.parent),oppositeParent=mirroredNode(plan,parent);
  if(!oppositeParent)return null;
  const socket=mirrorSocket(node.socket),definition=partDef(oppositeParent.partId)?.providedSockets.find(s=>s.id===socket);
  if(!definition)return null;
  const at=(parentId,socketId)=>plan.nodes.filter(n=>n.parent===parentId&&n.socket===socketId).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const candidates=at(oppositeParent.id,socket);
  if(definition.max===1)return candidates[0]||null;
  const occurrence=at(node.parent,node.socket).filter(n=>n.partId===node.partId).findIndex(n=>n.id===node.id);
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
// Failed ancestral mutations revisit the same canonical body-plan object.
// Reusing pure removal candidates avoids reconstructing and revalidating every
// possible amputated subtree on each attempt. No changed choice order or RNG.
const lossCache=new WeakMap();
export function optionalLossChoices(plan,{asymmetric=false}={}){
  const mode=asymmetric?'asymmetric':'paired';
  // Plans can be reused by external editor/tests and mutation migration. Verify
  // the COMPLETE canonical layout before using a previously compiled choice.
  const signature=serializePlan(plan)+'|sym='+DEVELOPMENTAL_SYMMETRY.enabled;
  let cached=lossCache.get(plan);
  if(cached?.signature===signature&&cached[mode])return cached[mode];
  if(cached?.signature!==signature)cached={signature};
  const out=[],seen=new Set(),paired=DEVELOPMENTAL_SYMMETRY.enabled&&!asymmetric;
  for(const n of [...plan.nodes].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){if(!n.parent)continue;const mirror=paired?mirroredNode(plan,n):null,targets=[n.id];if(mirror&&mirror.id!==n.id)targets.push(mirror.id);targets.sort();const key=targets.join('|');if(seen.has(key))continue;seen.add(key);const result=removeOptionalSubtrees(plan,targets);if(result)out.push({targets,...result})}
  cached??={};cached[mode]=out;lossCache.set(plan,cached);
  return out;
}
