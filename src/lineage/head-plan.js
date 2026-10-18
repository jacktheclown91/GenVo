import {makePlan,validatePlan} from './body-plan.js';
import {partDef} from './part-registry.js';
// Shared structural ownership query. A torso-face compatibility body has an
// implicit head unless its saved layout explicitly says those organs are torso-mounted.
export function facialHostId(plan){return plan?.nodes?.find(n=>n.parent==='root'&&n.socket==='head')?.id||'root'}
export function hasImplicitHead(plan){return plan?.headMode!=='torso'&&facialHostId(plan)==='root'&&!!plan?.nodes?.some(n=>n.parent==='root'&&(n.socket==='mouth'||n.socket?.startsWith('eye')))}
// Receipts describe socket relocations, not persistent tissue/module identities.
export function headStructureMoves(before,after){
 const host=facialHostId(after);if(host==='root')return[];
 const sockets=new Set(partDef(after.nodes.find(n=>n.id===host).partId).providedSockets.map(s=>s.id));
 const tops=before.nodes.filter(n=>n.parent==='root'&&sockets.has(n.socket));
 return before.nodes.flatMap(n=>{const top=tops.find(t=>n.id===t.id||n.id.startsWith(t.id+'/'));if(!top)return[];const next=after.nodes.find(q=>q.id===host+'/'+top.socket+n.id.slice(top.id.length));return next&&next.partId===n.partId?[{from:n.id,to:next.id,partId:n.partId,parentFrom:n.parent,parentTo:next.parent}]:[]});
}
// Structural editing only. Existing eye/mouth identities move intact with their descendants.
export function attachHeadPlan(plan,partId='head-base'){
 const def=partDef(partId);if(!def?.compatibleSocketTypes.includes('head'))throw Error('Not a head part');
 const sockets=new Set(def.providedSockets.map(s=>s.id)),has=plan.nodes.some(n=>n.parent==='root'&&n.socket==='head');
 const relocated=new Map(plan.nodes.filter(n=>n.parent==='root'&&sockets.has(n.socket)).map(n=>[n.id,'root/head/'+n.socket]));
 const path=id=>{for(const [old,next] of relocated)if(id===old||id?.startsWith(old+'/'))return next+id.slice(old.length);return id};
 const placements=plan.nodes.map(n=>({partId:n.socket==='head'&&n.parent==='root'?partId:n.partId,parent:relocated.has(n.id)?'root/head':path(n.parent),socket:n.socket}));
 if(!has)placements.push({partId,parent:'root',socket:'head'});
 const next=makePlan(placements,{legacyAnatomy:plan.legacyAnatomy});const v=validatePlan(next);if(!v.ok)throw Error(v.errors.join('; '));return next;
}
export function detachHeadPlan(plan){
 const head=plan.nodes.find(n=>n.parent==='root'&&n.socket==='head');if(!head)return{ok:false,reason:'No head to detach.'};
 const next=makePlan(plan.nodes.filter(n=>n.id!==head.id).map(n=>({partId:n.partId,parent:n.parent===head.id?'root':n.parent?.replace(/^root\/head\//,'root/'),socket:n.socket})),{headMode:'torso',legacyAnatomy:plan.legacyAnatomy});
 const v=validatePlan(next);return v.ok?{ok:true,plan:next}:{ok:false,reason:'These organs need head sockets: '+v.errors.join('; ')};
}
