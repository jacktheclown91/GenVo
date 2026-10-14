// Pointer hold belongs to one world and actor. Only the existing combat step enters brace.
export class HeldBraceInput{
 constructor({getSim,blocked=()=>false,onBegin=()=>{}}){Object.assign(this,{getSim,blocked,onBegin});this.owner=null;this.pointerId=null}
 begin(pointerId){const sim=this.getSim(),actor=sim.player();if(this.owner||this.blocked()||!sim.playerCombat.braceAvailability().enabled)return false;this.owner={sim,actor};this.pointerId=pointerId;this.onBegin();return true}
 release(pointerId=null){if(pointerId!==null&&pointerId!==this.pointerId)return false;const owner=this.owner,button=this.button,id=this.pointerId;this.owner=null;this.pointerId=null;this.button=null;if(button){button.setAttribute('aria-pressed','false');if(button.hasPointerCapture?.(id))button.releasePointerCapture(id)}if(owner)owner.sim.playerCombat.releaseBrace(owner.actor);return !!owner}
 read(){const sim=this.getSim();if(!this.owner)return false;if(this.owner.sim!==sim||this.owner.actor!==sim.player()||this.blocked()||!sim.playerCombat.braceAvailability().enabled){this.release();return false}return true}
 bind(button){
  button.onpointerdown=e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();if(this.begin(e.pointerId)){this.button=button;button.setPointerCapture?.(e.pointerId);button.setAttribute('aria-pressed','true')}};
  const end=e=>{if(this.release(e.pointerId))button.setAttribute('aria-pressed','false')};
  button.onpointerup=end;button.onpointercancel=end;button.onlostpointercapture=end;
 }
}
