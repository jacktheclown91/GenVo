// Presentation adapters expose canonical controller truth and recheck on invocation.
// They never define a second combat simulation or invent a biological capability.
import {actionCapabilities,activeAction} from '../lineage/action-capabilities.js';
export {actionCapabilities,activeAction};
const common=['interact','eat','drink','rest'];
export function orderQuickActions(buttons,animal){
 const rank=b=>common.includes(b.dataset.command)?common.indexOf(b.dataset.command):
  activeAction(animal,b.dataset.command)?4:!b.disabled?5:6;
 return [...buttons].sort((a,b)=>rank(a)-rank(b)||Number(a.dataset.actionIndex)-Number(b.dataset.actionIndex));
}
const protectedAttackIntents=new WeakMap();
function confirmProtectedAttack(sim){
 if(!sim.isOpeningProtected?.(sim.player()))return true;
 const now=performance.now(),prior=protectedAttackIntents.get(sim);
 if(prior&&prior.actor===sim.playerId&&prior.until>now){protectedAttackIntents.delete(sim);return true}
 protectedAttackIntents.set(sim,{actor:sim.playerId,until:now+6000});return false;
}
export function combatActions(sim,targetId=null){
 const combat=sim.playerCombat;
 const capabilities=actionCapabilities(sim);
 return [{id:'attack',label:'Attack',hotkey:'Space',pounce:false},{id:'pounce',label:'Pounce',hotkey:'Shift+Space',pounce:true}].map(action=>({
  possessed:!!capabilities[action.id],
  ...action,targetId,...combat.attackAvailability({...action,targetId}),
  invoke(){const status=combat.attackAvailability({...action,targetId});if(!status.enabled)return{ok:false,type:action.id,message:status.reason};if(!confirmProtectedAttack(sim))return{ok:false,type:action.id,message:'Attacking ends your protected opening. Repeat Attack to confirm.'};return combat.startAttack({pounce:action.pounce,targetId})}
 }));
}
