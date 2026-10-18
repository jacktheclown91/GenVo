import {currentCourtshipMove} from '../reproduction/courtship-performance.js';
import {tasteText} from '../reproduction/mate-preferences.js';
// Observable behavior only: never reads the partner's preferences, appeal, chances or genotype. When the
// player's own creature held back, its own inclination is put in plain words (Phase 3J).
function declineText(actor,r){if(r.declinerId==null)return'The pairing was declined.';if(r.declinerId===actor.id)return`Your creature held back: ${tasteText(r.taste)}.`;return`The partner turned away from your creature.${(r.count||1)>=2?' It has refused before; another partner may suit better.':''}`}
export function courtshipObservation(sim,actor,target,baseline={}){
 if(!actor||!target)return{kind:'ended',text:'The partner is no longer here.'};
 if(actor.lastMate===target.id&&actor.lastMate!==baseline.lastMate)return{kind:'accepted',text:'Both creatures accepted the pairing.'};
 if(actor.lastCourtshipRefusal!==baseline.refusal&&actor.lastCourtshipRefusal?.otherId===target.id)return{kind:'declined',text:declineText(actor,actor.lastCourtshipRefusal)};
 if(actor.lastCourtshipFailure!==baseline.failure&&actor.lastCourtshipFailure?.partnerId===target.id)return{kind:actor.lastReproductiveAttempt?.accepted&&!actor.lastReproductiveAttempt?.conceived?'accepted-no-conception':'interrupted',text:actor.lastCourtshipFailure.reason};
 if(target.courtshipPerformance?.partnerId===actor.id)return{kind:'responding',text:'Partner is responding with '+(currentCourtshipMove(sim,target)||'a display')+'.'};
 const distance=Math.hypot(target.x-actor.x,target.y-actor.y);
 const moved=Number.isFinite(baseline.targetX)&&Number.isFinite(baseline.targetY)?Math.hypot(target.x-baseline.targetX,target.y-baseline.targetY):0;
 const previousDistance=Math.hypot(baseline.targetX-actor.x,baseline.targetY-actor.y);
 if(moved>.15&&distance>previousDistance+.15)return{kind:'away',text:'Partner is moving away.'};
 if(moved>.15&&distance<previousDistance-.15)return{kind:'closer',text:'Partner is moving closer.'};
 const angle=((target.dir&7)-2)*Math.PI/4,f=[Math.cos(angle),Math.sin(angle)],dx=actor.x-target.x,dy=actor.y-target.y;
 if(distance>.01&&(f[0]*dx+f[1]*dy)/distance>.65)return{kind:'facing',text:'Partner is facing you.'};
 return{kind:'nearby',text:'Partner is nearby; no clear response yet.'};
}
