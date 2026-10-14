import {bodyPlanFromLegacy,validatePlan} from '../lineage/body-plan.js';
import {limbSlot,BODY_SHAPES} from '../lineage/part-registry.js';

// Evolution Expansion Phase B (GDD v1, sections 10 and 11; backlog EV-007): creature assembler.
// Turns a body plan into a per-socket layout the GenVo8 sprite draws from: which part sits on
// each of the eight legs (indexed relative to facing, 0 = front, clockwise), each leg's spur,
// the mouth, both eyes, both flanks, the dorsal socket, the tail and the torso.
// A creature's plan comes from `animal.bodyPlan` when one is set (previews, the coming editor)
// and otherwise from its expressed adaptations via the legacy adapter. Layouts are cached.
// Rendering never grants abilities.
//
// Wave 1: a designed body (explicit plan) is drawn from its own leg slots (up to sixteen, in
// sixteenths of a turn), its body shape, a second pair of eyes and a second back part. Bodies
// from the legacy adapter keep the original eight-leg drawing exactly.

const cache=new Map();
const SIDE={'flank.left':-1,'flank.right':1,'eye.left':-1,'eye.right':1};
// How far each leg type reaches, relative to a walking leg.
// v1.59.0: how each leg type moves. stride scales how far a foot swings, lift how high it rises.
export const LEG_GAIT=Object.freeze({'runner-leg':{stride:1.4,lift:.75},'sturdy-leg':{stride:.65,lift:.55},'spring-leg':{stride:1.1,lift:1.5},'walking-leg':{stride:1,lift:1},'grasper':{stride:.9,lift:.9},'digging-forelimb':{stride:.8,lift:.8},'webbed-leg':{stride:1,lift:.85},'padded-leg':{stride:.95,lift:.7}});
export const LEG_REACH=Object.freeze({'runner-leg':1.16,'sturdy-leg':.84,'spring-leg':1,'walking-leg':1,'grasper':1,'digging-forelimb':.94,'webbed-leg':1,'padded-leg':.96});

export function layoutFromPlan(plan,{explicit=false}={}){
  const out={planId:plan.id,explicit,torso:'soft-torso',legs:Array(8).fill(null),spurs:Array(8).fill(null),slotLegs:{},slotSpurs:{},legSlots:null,mouth:null,eyes:{'-1':null,'1':null},eyes2:{'-1':null,'1':null},flanks:{'-1':[],'1':[]},dorsal:null,dorsal2:null,tail:null,shape:null,head:null,headNodeId:null,implicitHead:false,faceNodes:{}};
  const headNode=plan.nodes.find(n=>n.parent==='root'&&n.socket==='head');
  out.head=headNode?.partId||null;out.headNodeId=headNode?.id||null;
  for(const n of plan.nodes){
    if(!n.parent){out.torso=n.partId;continue}
    const limb=/^root\/limb\.(\d+)$/.exec(n.id);if(limb){const i=Number(limb[1]);if(i<8)out.legs[i]=n.partId;out.slotLegs[limbSlot(`limb.${i}`)]=n.partId;continue}
    const spur=/^root\/limb\.(\d+)\/spur/.exec(n.id);if(spur){const i=Number(spur[1]);if(i<8)out.spurs[i]=n.partId;out.slotSpurs[limbSlot(`limb.${i}`)]=n.partId;continue}
    if(n.parent==='root'||n.parent===out.headNodeId){
      if(n.socket==='mouth'||n.socket?.startsWith('eye'))out.faceNodes[n.socket]=n.id;
      if(n.socket==='mouth')out.mouth=n.partId;
      else if(n.socket==='eye.left.2'||n.socket==='eye.right.2')out.eyes2[n.socket==='eye.left.2'?-1:1]=n.partId;
      else if(n.socket in SIDE&&n.socket.startsWith('eye'))out.eyes[SIDE[n.socket]]=n.partId;
      else if(n.socket in SIDE)out.flanks[SIDE[n.socket]].push(n.partId);
      else if(n.socket==='dorsal'){if(out.dorsal)out.dorsal2=n.partId;else out.dorsal=n.partId}
      else if(n.socket==='tail')out.tail=n.partId;
    }
  }
  // Old plans keep their default head without rewriting graph IDs or saves.
  out.implicitHead=!out.head&&plan.headMode!=='torso'&&Object.keys(out.faceNodes).length>0;
  if(explicit){
    out.legSlots=Object.keys(out.slotLegs).map(Number).sort((a,b)=>a-b).map(slot=>Object.freeze({slot,reach:LEG_REACH[out.slotLegs[slot]]||1,gait:LEG_GAIT[out.slotLegs[slot]]||LEG_GAIT['walking-leg']}));
    out.shape=BODY_SHAPES[out.torso]||BODY_SHAPES['soft-torso'];
  }
  return Object.freeze(out);
}

export function assemblyFor(animal){
  const explicit=animal?.bodyPlan;
  if(explicit){const key=`plan:${explicit.id}`;let hit=cache.get(key);if(!hit){hit=validatePlan(explicit).ok?layoutFromPlan(explicit,{explicit:true}):null;cache.set(key,hit)}if(hit)return hit}
  const adaptations=animal?.adaptations||[],key=adaptations.length?[...adaptations].sort().join(','):'';
  let hit=cache.get(key);if(!hit){hit=layoutFromPlan(bodyPlanFromLegacy({adaptations}));cache.set(key,hit);if(cache.size>256)cache.delete(cache.keys().next().value)}
  return hit;
}

// Leg index relative to facing (0 = front, clockwise) from a leg's front/side components.
export function relativeLegIndex(leg){const a=Math.atan2(leg.side||0,leg.front||0);return((Math.round(a/(Math.PI/4))%8)+8)%8}
