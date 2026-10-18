import {adaptationAxis} from './water-physiology.js';
import {PARTS,REGISTRY_VERSION,partDef} from './part-registry.js';
import {anatomyFromAdaptations} from './evolution.js';

// Evolution Expansion (GDD v1, sections 6.4 and 12, backlog EV-003 and EV-004): the BodyPlan.
// A phenotype is a rooted acyclic part graph. Each node's id is its socket path from the root
// ("root", "root/limb.4", "root/limb.2/spur"), so identical bodies serialize identically and
// get the same canonical id. Phase A: plans are derived from v1.33.7 anatomy by a read adapter;
// the legacy anatomy travels with the plan and stays the authority until a later phase moves it.

export const BODY_PLAN_SCHEMA='genvo8.bodyplan/0';

export function nodeId(parent,socket,ordinal=0){return parent?`${parent}/${socket}${ordinal?`#${ordinal+1}`:''}`:'root'}
const baseId=id=>String(id).replace(/#\d+$/,'');

// Build a plan from a list of {partId, parent, socket} placements (parent/socket null for root).
export function makePlan(placements,{legacyAnatomy=null,headMode=null}={}){
  // Parts sharing a multi-slot socket are numbered in part-id order, so placement order never changes identity.
  const groups=new Map();for(const p of placements){const k=`${p.parent}|${p.socket}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)}
  const nodes=[];for(const list of groups.values()){list.sort((a,b)=>a.partId<b.partId?-1:a.partId>b.partId?1:0);list.forEach((p,k)=>nodes.push({id:nodeId(p.parent,p.socket,k),partId:p.partId,partVersion:partDef(p.partId)?.partVersion??p.partVersion??null,parent:p.parent??null,socket:p.socket??null}))}
  const plan={schema:BODY_PLAN_SCHEMA,registryVersion:REGISTRY_VERSION,nodes:canonicalNodes(nodes)};
  if(headMode==='torso'&&!plan.nodes.some(n=>n.socket==='head'))plan.headMode='torso';
  if(legacyAnatomy)plan.legacyAnatomy={...legacyAnatomy};
  plan.id=canonicalId(plan);return plan;
}
function canonicalNodes(nodes){return [...nodes].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)}

// Canonical id: FNV-1a over the canonical node list (legacy anatomy is not part of identity).
export function canonicalId(plan){
  const text=canonicalNodes(plan.nodes||[]).map(n=>`${n.id}=${n.partId}@${n.partVersion}`).join('|')+(plan.headMode==='torso'?'|headMode=torso':'');
  let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
  return `bp0-${(h>>>0).toString(16).padStart(8,'0')}`;
}

export function serializePlan(plan){return JSON.stringify({schema:plan.schema,registryVersion:plan.registryVersion,id:plan.id,nodes:canonicalNodes(plan.nodes),legacyAnatomy:plan.legacyAnatomy||null,...(plan.headMode==='torso'?{headMode:'torso'}:{})})}
export function deserializePlan(text){
  const raw=typeof text==='string'?JSON.parse(text):text;if(!raw||raw.schema!==BODY_PLAN_SCHEMA)throw new Error(`Unknown body plan schema: ${raw?.schema}`);
  const plan={schema:raw.schema,registryVersion:raw.registryVersion,nodes:canonicalNodes(raw.nodes.map(n=>({...n}))),id:raw.id};if(raw.headMode==='torso')plan.headMode='torso';if(raw.legacyAnatomy)plan.legacyAnatomy={...raw.legacyAnatomy};return plan;
}

// Validation (GDD 6.4): known parts and versions, one root, exactly one compatible parent socket per
// non-root part, socket capacity, no cycles. `ancestry` (optional) is the set of part ids the
// lineage's ancestors expressed, for developmental prerequisites. Unknown parts fail visibly.
export function validatePlan(plan,{ancestry=null}={}){
  const errors=[];if(!plan||plan.schema!==BODY_PLAN_SCHEMA)return{ok:false,errors:['not a body plan']};
  const byId=new Map();for(const n of plan.nodes){if(byId.has(n.id))errors.push(`duplicate node ${n.id}`);byId.set(n.id,n)}
  const roots=plan.nodes.filter(n=>!n.parent);
  if(roots.length!==1)errors.push(`expected exactly one root, found ${roots.length}`);
  if(plan.headMode!==undefined&&plan.headMode!=='torso')errors.push('Unknown head mode');
  const head=plan.nodes.find(n=>n.parent==='root'&&n.socket==='head');
  if(head&&plan.nodes.some(n=>n.parent==='root'&&(n.socket==='mouth'||n.socket?.startsWith('eye'))))errors.push('Facial organs must attach to the mounted head');
  const used=new Map();
  for(const n of plan.nodes){
    const def=partDef(n.partId);
    if(!def){errors.push(`unknown part ${n.partId} at ${n.id}`);continue}
    if(n.partVersion!==def.partVersion)errors.push(`part ${n.partId} version ${n.partVersion} does not match registry ${def.partVersion}`);
    if(!n.parent){if(!def.tags.includes('root'))errors.push(`${n.partId} cannot be a root`);if(n.id!=='root')errors.push(`root node must be named root`);continue}
    if(def.tags.includes('root'))errors.push(`${n.partId} is a root part attached below ${n.parent}`);
    const parent=byId.get(n.parent);if(!parent){errors.push(`orphan part ${n.partId} at ${n.id}`);continue}
    const pdef=partDef(parent.partId);const socket=pdef?.providedSockets.find(s=>s.id===n.socket);
    if(!socket){errors.push(`${parent.partId} has no socket ${n.socket}`);continue}
    if(!def.compatibleSocketTypes.includes(socket.type))errors.push(`${n.partId} cannot mount on a ${socket.type} socket`);
    const key=`${n.parent}#${n.socket}`;used.set(key,(used.get(key)||0)+1);if(used.get(key)>socket.max)errors.push(`socket ${key} holds more than ${socket.max}`);
    if(baseId(n.id)!==nodeId(n.parent,n.socket))errors.push(`node ${n.id} is not named by its socket path`);
  }
  // Cycles: walk each node to the root.
  for(const n of plan.nodes){const seen=new Set();let cur=n;while(cur?.parent){if(seen.has(cur.id)){errors.push(`cycle through ${n.id}`);break}seen.add(cur.id);cur=byId.get(cur.parent)}}
  if(ancestry){const have=new Set(ancestry);for(const n of plan.nodes){const def=partDef(n.partId);for(const q of def?.developmentalPrerequisites||[])if(!have.has(q)&&!have.has(n.partId))errors.push(`${n.partId} needs ancestral ${q} first`)}}
  return{ok:!errors.length,errors};
}

export function partsOf(plan){return plan.nodes.map(n=>n.partId)}
export function partCounts(plan){const out={};for(const n of plan.nodes)out[n.partId]=(out[n.partId]||0)+1;return out}

// EV-004: read adapter from v1.33.7 continuous anatomy to a BodyPlan. Pure: never changes the
// animal. Each expressed legacy body part becomes the part that stands for it; everything else
// is the founder default (soft torso, eight walking legs, grazing mouth, two simple eyes).
export function bodyPlanFromLegacy(animal){
  const an=animal?.anatomy?{...animal.anatomy}:anatomyFromAdaptations(animal?.adaptations);
  const at=(axis,t)=>(an[axis==='waterBody'?adaptationAxis(an,t>=.8?'webbed-limbs':'water-sacs',axis):axis]||0)>=t,placements=[{partId:'soft-torso',parent:null,socket:null}];
  // Legs in DIR8 order relative to facing: 0 front ... 4 rear. Rear legs 3-5 carry the tendons, the three
  // front legs (7, 0, 1) the hooks, and the six side legs the barbs, matching how v1.33.7 drew them.
  for(let i=0;i<8;i++){
    let leg='walking-leg';if(at('spring',.5)&&[3,4,5].includes(i))leg='spring-leg';else if(at('forelimb',.5)&&[7,0,1].includes(i))leg='grasper';
    // Wave 1: a water-crossing body (Webbed Limbs) has webbed side legs.
    else if(at('waterBody',.8)&&[1,2,3,5,6,7].includes(i))leg='webbed-leg';
    placements.push({partId:leg,parent:'root',socket:`limb.${i}`});
    if(at('barbs',.5)&&[1,2,3,5,6,7].includes(i))placements.push({partId:'barb',parent:`root/limb.${i}`,socket:'spur'});
  }
  placements.push({partId:at('jaw',.8)?'crushing-jaw':at('jaw',.5)?'tearing-jaw':'grazing-mouth',parent:'root',socket:'mouth'});
  placements.push({partId:'simple-eye',parent:'root',socket:'eye.left'},{partId:'simple-eye',parent:'root',socket:'eye.right'});
  // Each flank holds up to two parts: a storage sac (water-holding body) and an armor plate.
  const sac=at('waterBody',.5),armor=at('armor',.5),crest=at('signal',.5);
  for(const side of ['flank.left','flank.right']){if(sac)placements.push({partId:'storage-sac',parent:'root',socket:side});if(armor)placements.push({partId:'armor-plate',parent:'root',socket:side})}
  if(crest)placements.push({partId:'signal-crest',parent:'root',socket:'dorsal'});
  return makePlan(placements,{legacyAnatomy:an});
}
