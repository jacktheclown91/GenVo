// Presentation adapters expose canonical controller truth and recheck on invocation.
// They never define a second combat simulation or invent a biological capability.
export function combatActions(sim,targetId=null){
 const combat=sim.playerCombat;
 return [{id:'attack',label:'Attack',hotkey:'Space',pounce:false},{id:'pounce',label:'Pounce',hotkey:'Shift+Space',pounce:true}].map(action=>({
  ...action,targetId,...combat.attackAvailability({...action,targetId}),
  invoke(){const status=combat.attackAvailability({...action,targetId});if(!status.enabled)return{ok:false,type:action.id,message:status.reason};return combat.startAttack({pounce:action.pounce,targetId})}
 }));
}
