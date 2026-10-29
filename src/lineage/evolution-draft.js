import {attachHeadPlan,detachHeadPlan} from './head-plan.js';
import {partDef} from './part-registry.js';
import {structuralProblem} from '../organisms/structural-support.js';
import {makePlan,validatePlan,partCounts} from './body-plan.js';

// Evolution Expansion Phase C (GDD v1, sections 5, 7.2 and 7.3; backlog EV-008): the editor draft.
// Pure: it edits a copy of the next-generation lineage target, never a living creature or the
// world. Cost is the difference from the parent body (existing parts are free, so reverting a
// change inside the draft returns its budget); prerequisites follow the lineage's ancestry; a
// draft can only be committed when it is valid, viable and within budget. Proposed tuning.

export const DRAFT_COSTS=Object.freeze({remove:1,reposition:1});
const MIRROR={'eye.left':'eye.right','eye.right':'eye.left','eye.left.2':'eye.right.2','eye.right.2':'eye.left.2','flank.left':'flank.right','flank.right':'flank.left'};
// Radial limb i mirrors to (8-i)%8; an in-between limb 8+i mirrors to 15-i.
export function mirrorSocket(socket){if(MIRROR[socket])return MIRROR[socket];const m=/^limb\.(\d+)$/.exec(socket);if(!m)return socket;const n=Number(m[1]);return n<8?`limb.${(8-n)%8}`:`limb.${15-(n-8)}`}

const placementsOf=plan=>plan.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
const keyOf=p=>`${p.parent}|${p.socket}|${p.partId}`;

// Phase G: parts the player has seen on wild GenVo8s cost 1 MP less (never below 1).
export function partCost(draft,partId){const c=partDef(partId)?.mutationCost??0;return draft?.known?.has?.(partId)&&c>1?c-1:c}
// `structural` (structural-support/1 worlds): refuse anatomies that cannot carry themselves.
export function createDraft({base,ancestry=[],budget=8,known=null,unlocked=null,structural=false}){
  const start=makePlan(placementsOf(base),{headMode:base.headMode});
  return{base:start,plan:start,ancestry:new Set([...ancestry,...partsIn(start)]),budget,known:known?new Set(known):null,unlocked:unlocked?new Set(unlocked):null,history:[],future:[],...(structural?{structural:true}:{})};
}
function partsIn(plan){return plan.nodes.map(n=>n.partId)}

// Mutation cost of the draft against its base: new or replaced parts cost their mutationCost,
// removals and repositioning cost a fixed amount; unchanged parts are free.
export function draftCost(draft){
  const base=placementsOf(draft.base),now=placementsOf(draft.plan),baseKeys=new Map(base.map(p=>[keyOf(p),p])),nowKeys=new Map(now.map(p=>[keyOf(p),p]));
  let cost=0;const added=[],removed=[];
  for(const [k,p] of nowKeys)if(!baseKeys.has(k))added.push(p);
  for(const [k,p] of baseKeys)if(!nowKeys.has(k))removed.push(p);
  // A part that only moved sockets is a reposition, not an add plus a removal.
  for(const a of [...added]){const i=removed.findIndex(r=>r.partId===a.partId&&((r.parent===a.parent&&r.socket!==a.socket)||(r.socket===a.socket&&[r.parent,a.parent].every(p=>p==='root'||p==='root/head'))));if(i>=0){cost+=removed[i].socket===a.socket?0:DRAFT_COSTS.reposition;removed.splice(i,1);added.splice(added.indexOf(a),1)}}
  for(const a of added)cost+=partCost(draft,a.partId);
  // Removing a part that was replaced on the same socket is already paid by the replacement.
  for(const r of removed)if(!added.some(a=>a.parent===r.parent&&a.socket===r.socket))cost+=DRAFT_COSTS.remove;
  return cost;
}

// Viability (GDD 6.4, 7.3): grossly feasible support and feeding, plus graph validity and ancestry.
export function draftProblems(draft){
  const v=validatePlan(draft.plan,{ancestry:[...draft.ancestry]}),out=[...v.errors];
  const counts=partCounts(draft.plan),legs=draft.plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)).length,mouths=draft.plan.nodes.filter(n=>n.socket==='mouth').length,eyes=draft.plan.nodes.filter(n=>n.socket?.startsWith('eye')).length;
  if(legs<4)out.push('Needs at least four legs to stand and walk.');
  if(!mouths)out.push('Needs a mouth to feed.');
  if(!eyes)out.push('Needs at least one eye.');
  if(draft.structural){const why=structuralProblem(draft.plan);if(why&&legs>=4)out.push(why)}
  const cost=draftCost(draft);if(cost>draft.budget)out.push(`Costs ${cost} MP, more than the ${draft.budget} MP available.`);
  return out;
}

// Why a part cannot go on a socket right now (null when it can).
export function whyNot(draft,partId,parent,socket){
  if(parent==='root'&&(socket==='mouth'||socket?.startsWith('eye'))&&draft.plan.nodes.some(n=>n.socket==='head'))return'Attach facial organs to the head.';
  const def=partDef(partId);if(!def)return'Unknown part.';
  if(def.tags.includes('exclusive')&&!draft.unlocked?.has(partId)&&!draft.ancestry.has(partId))return'A relic part: find the relic of a special creature to unlock it.';
  for(const q of def.developmentalPrerequisites)if(!draft.ancestry.has(q)&&!draft.ancestry.has(partId))return`Requires ${partDef(q)?.id.replace(/-/g,' ')} in the lineage first.`;
  const host=draft.plan.nodes.find(n=>n.id===parent);if(!host)return'Nothing to attach to there.';
  const s=partDef(host.partId)?.providedSockets.find(x=>x.id===socket);if(!s)return'No such socket.';
  if(!def.compatibleSocketTypes.includes(s.type))return`Does not fit a ${s.type} socket.`;
  return null;
}

function apply(draft,placements,headMode=draft.plan.headMode){const next=makePlan(placements,{headMode});draft.history.push(draft.plan);draft.future=[];draft.plan=next;return{ok:true,plan:next,cost:draftCost(draft)}}
function subtree(plan,id){const out=new Set([id]);let grew=true;while(grew){grew=false;for(const n of plan.nodes)if(n.parent&&out.has(n.parent)&&!out.has(n.id)){out.add(n.id);grew=true}}return out}

// Put a part on a socket, replacing what is there (and anything mounted on it).
export function place(draft,partId,parent,socket){
  if(parent==='root'&&socket==='head'){const why=whyNot(draft,partId,parent,socket);if(why)return{ok:false,reason:why};const next=attachHeadPlan(draft.plan,partId);return apply(draft,placementsOf(next),null)}
  const why=whyNot(draft,partId,parent,socket);if(why)return{ok:false,reason:why};
  const s=partDef(draft.plan.nodes.find(n=>n.id===parent).partId).providedSockets.find(x=>x.id===socket);
  let nodes=draft.plan.nodes;const occupants=nodes.filter(n=>n.parent===parent&&n.socket===socket);
  if(occupants.length>=s.max){const drop=subtree(draft.plan,occupants[0].id);nodes=nodes.filter(n=>!drop.has(n.id))}
  return apply(draft,[...nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId,parent,socket}]);
}
export function remove(draft,nodeId){if(draft.plan.nodes.find(n=>n.id===nodeId)?.socket==='head'){const result=detachHeadPlan(draft.plan);if(!result.ok)return result;return apply(draft,placementsOf(result.plan),'torso')}if(nodeId==='root')return{ok:false,reason:'The torso cannot be removed.'};const drop=subtree(draft.plan,nodeId);if(!draft.plan.nodes.some(n=>n.id===nodeId))return{ok:false,reason:'Nothing there.'};return apply(draft,draft.plan.nodes.filter(n=>!drop.has(n.id)).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})))}
// Swap the torso, keeping everything mounted on it (both torsos provide the same sockets).
export function replaceRoot(draft,partId){
  const def=partDef(partId);if(!def?.tags?.includes('root'))return{ok:false,reason:'Only a torso can be the body core.'};
  for(const q of def.developmentalPrerequisites)if(!draft.ancestry.has(q)&&!draft.ancestry.has(partId))return{ok:false,reason:`Requires ${q.replace(/-/g,' ')} in the lineage first.`};
  const rootNode=draft.plan.nodes.find(n=>!n.parent);if(rootNode?.partId===partId)return{ok:true,plan:draft.plan,cost:draftCost(draft)};
  // Parts on sockets the new torso lacks, or beyond its capacity, fall off with anything mounted on them.
  const provided=new Map(def.providedSockets.map(s=>[s.id,s.max])),used=new Map(),drop=new Set();
  for(const n of draft.plan.nodes.filter(n=>n.parent==='root').sort((a,b)=>a.id<b.id?-1:1)){const max=provided.get(n.socket)||0,k=used.get(n.socket)||0;if(k>=max)for(const id of subtree(draft.plan,n.id))drop.add(id);else used.set(n.socket,k+1)}
  return apply(draft,draft.plan.nodes.filter(n=>!drop.has(n.id)).map(n=>({partId:n.parent?n.partId:partId,parent:n.parent,socket:n.socket})));
}
export function mirror(draft,nodeId){const n=draft.plan.nodes.find(x=>x.id===nodeId);if(!n?.parent)return{ok:false,reason:'Nothing to mirror.'};const target=mirrorSocket(n.socket);if(target===n.socket)return{ok:false,reason:'This part sits on the middle line.'};return place(draft,n.partId,n.parent,target)}
export function undo(draft){if(!draft.history.length)return false;draft.future.push(draft.plan);draft.plan=draft.history.pop();return true}
export function redo(draft){if(!draft.future.length)return false;draft.history.push(draft.plan);draft.plan=draft.future.pop();return true}
export function revert(draft){if(draft.plan===draft.base)return false;draft.history.push(draft.plan);draft.future=[];draft.plan=draft.base;return true}

// Atomic commit: validates and returns a transaction record, or the reasons it cannot commit.
export function commitDraft(draft,{tick=0,day=0,generation=1}={}){
  const problems=draftProblems(draft);if(problems.length)return{ok:false,problems};
  return{ok:true,record:Object.freeze({from:draft.base.id,to:draft.plan.id,spent:draftCost(draft),budget:draft.budget,tick,day,generation,plan:draft.plan})};
}
