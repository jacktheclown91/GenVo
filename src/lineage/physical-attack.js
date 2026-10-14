import {PARTS,limbSlot} from './part-registry.js';
// Shared mounted attack identity for availability, wording and presentation.
// The existing controller remains authoritative for reach, cost, timing and damage.
export function physicalAttackProfile(animal){
 const nodes=animal?.bodyPlan?.nodes;if(!nodes?.length)return{mode:'legacy',slots:[]};
 const capable=c=>nodes.filter(n=>PARTS[n.partId]?.actionCapabilities.includes(c));
 if(capable('peck').length)return{mode:'peck',slots:[]};
 if(capable('bite').length)return{mode:'bite',slots:[]};
 const strikes=capable('strike'),slots=[];for(const n of strikes){let parent=nodes.find(p=>p.id===n.parent);const seen=new Set();while(parent&&!seen.has(parent.id)){seen.add(parent.id);if(parent.parent==='root'&&parent.socket?.startsWith('limb.')){const slot=limbSlot(parent.socket);if(slot!==null&&!slots.includes(slot))slots.push(slot);break}parent=nodes.find(p=>p.id===parent.parent)}}
 slots.sort((a,b)=>Math.min(a,16-a)-Math.min(b,16-b)||a-b);
 return{mode:strikes.length?'strike':null,slots};
}
