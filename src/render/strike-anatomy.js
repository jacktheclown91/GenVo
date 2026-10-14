import {physicalAttackProfile} from '../lineage/physical-attack.js';
export const strikeAnatomy=physicalAttackProfile;
export function applyAnatomicalStrike(behavior,status,animal){
 if(!status?.attackPhase)return behavior;
 if(status.attackPhase==='recover'&&animal?.attackAction?.outcome==='interrupted'){behavior.bodyLean=(behavior.bodyLean||0)-1.8*(1-status.attackProgress);behavior.forelegLift=0;behavior.mouthPulse=0;behavior.attackMouthOpen=0;behavior.attackLimbSlots=[];behavior.attackLimbLift=0;behavior.attackLimbReach=0;behavior.eyeNarrow=true;return behavior;}
 const anatomy=strikeAnatomy(animal),p=Math.max(0,Math.min(1,status.attackProgress)),recover=status.attackPhase==='recover'?1-p:0,wind=status.attackPhase==='windup'?p:0;
 if(anatomy.mode==='peck'){behavior.headReach=(behavior.headReach||0)-.55*wind+1.7*recover**2;behavior.headDrop=(behavior.headDrop||0)+1.6*recover**2;behavior.mouthPulse=0;behavior.attackMouthOpen=0}
 else if(anatomy.mode==='bite'||anatomy.mode==='legacy'){behavior.headReach=(behavior.headReach||0)-.65*wind+1.25*recover;behavior.mouthPulse=Math.max(0,.7*wind+1.6*recover);behavior.attackMouthOpen=status.attackPhase==='windup'&&p>.15||status.attackPhase==='recover'&&p>.45&&p<.85?1:0}
 else{behavior.mouthPulse=0;behavior.attackMouthOpen=0;behavior.forelegLift=0;}
 if(anatomy.mode==='strike'&&!animal?.attackAction?.pounce){behavior.attackLimbSlots=anatomy.slots.length?[anatomy.slots[0]]:[];behavior.attackLimbLift=.9*wind+1.5*recover;behavior.attackLimbReach=-.8*wind+2*recover;}
 return behavior;
}
