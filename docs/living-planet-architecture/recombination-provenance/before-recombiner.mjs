// Reconstructed from the exact pre-edit algorithm inspected in this turn.
// Kept as a scoped parity reference, not a prior release or independent genetics model.
import {partDef} from '../../../src/lineage/part-registry.js';
import {makePlan,validatePlan} from '../../../src/lineage/body-plan.js';
import {mirrorSocket} from '../../../src/lineage/evolution-draft.js';
export function recombineBodyPlans(rng,motherPlan,fatherPlan){
  if(!motherPlan||!fatherPlan)return motherPlan||fatherPlan;
  if(motherPlan.id===fatherPlan.id)return motherPlan;
  const source=[motherPlan,fatherPlan];
  const base=source[rng.int(0,1)],root=base.nodes.find(n=>!n.parent);
  if(!root)return base;
  const sockets=partDef(root.partId)?.providedSockets||[];
  const assembled=[{partId:root.partId,parent:null,socket:null}];
  const groups=(plan,socket)=>{
    const tops=plan.nodes.filter(n=>n.parent==='root'&&n.socket===socket);
    const retained=new Set(tops.map(n=>n.id));
    let changed=true;
    while(changed){changed=false;for(const n of plan.nodes)if(n.parent&&retained.has(n.parent)&&!retained.has(n.id)){retained.add(n.id);changed=true}}
    return plan.nodes.filter(n=>retained.has(n.id)).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
  };
  // Mirrored attachments normally travel as a unit, including spur descendants, so an
  // inherited pair of legs is not unnecessarily shattered into one-off unusable limbs.
  const visited=new Set();
  for(const socket of sockets){
    if(visited.has(socket.id))continue;
    const mirrored=mirrorSocket(socket.id),partner=sockets.find(q=>q.id===mirrored&&q.type===socket.type);
    const block=partner&&partner.id!==socket.id?[socket,partner]:[socket];
    block.forEach(q=>visited.add(q.id));
    const chosen=rng.int(0,1),other=1-chosen;
    const selected=which=>block.flatMap(q=>groups(source[which],q.id));
    const valid=group=>{
      for(const q of block){
        const top=group.filter(n=>n.parent==='root'&&n.socket===q.id);
        if(top.length>q.max||top.some(n=>!partDef(n.partId)?.compatibleSocketTypes.includes(q.type)))return false;
      }
      return validatePlan(makePlan([...assembled,...group])).ok;
    };
    const preferred=selected(chosen),fallback=selected(other);
    // Core organs must remain functional when one ancestor lacked the paired socket.
    // Other empty groups are heritable absence (loss of ornament/defense is possible).
    const vital=block.some(q=>q.type==='mouth'||q.type==='eye'||q.type==='limb');
    let pick=preferred;
    if((vital&&!pick.length)||!valid(pick))pick=fallback;
    if(valid(pick))assembled.push(...pick);
  }
  const plan=makePlan(assembled,{headMode:base.headMode});
  return validatePlan(plan).ok?plan:base;
}

