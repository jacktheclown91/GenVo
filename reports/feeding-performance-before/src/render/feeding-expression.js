// Receipt-driven body language. No extraction, costs or simulation intent are changed.
import {CFG} from '../sim/config.js';
import {mouthOf} from '../ecology/functional-diet.js';
import {PARTS} from '../lineage/part-registry.js';
export function feedingExpression(sim,a,{moving=false,phase=0}={}){
 const r=a?.lastPlantMeal,age=(sim?.tickCount??0)-(r?.tick??-Infinity),duration=CFG.simHz*(1.05+Math.min(.9,r?.processingCost||0));
 if(!r||r.actorId!==a.id||age<0||age>=duration||moving||a.bracing||a.attackAction||a.courtshipPerformance||!['idle','player','rest','feed','explore','herd-browse','forage'].includes(a.intent))return null;
 const caps=PARTS[mouthOf(a)]?.actionCapabilities||[],mode=r.tissue==='kernel'?'crush':r.processingCost>0?(caps.includes('crush')?'crush':caps.includes('peck')?'peck':'pull'):'graze',cycle=(phase/8)%1,beat=(1-Math.cos(cycle*Math.PI*2))/2,strength=Math.min(1,age/duration<.8?1:(1-age/duration)*5);
 const pose={mode,strength,seedFate:r.viableSeeds>0?'carried':r.destroyedSeeds>0?'crushed':'none',mouthPulse:(.25+beat)*strength,headDrop:(.7+beat*.4)*strength,bodyDrop:.35*strength};
 if(mode==='peck')Object.assign(pose,{headDrop:(.25+Math.pow(beat,3)*2.3)*strength,bodyLean:.4*beat*strength,stanceSpread:.3*strength,mouthPulse:.45*beat*strength});
 else if(mode==='crush')Object.assign(pose,{headDrop:(.6+beat*.6)*strength,compress:.25*beat*strength,stanceSpread:.65*strength,bodyLean:-.3*beat*strength,mouthPulse:1.6*Math.pow(beat,2)*strength});
 else if(mode==='pull')Object.assign(pose,{headDrop:(1.1-beat*.7)*strength,bodyLean:-.85*beat*strength,stanceSpread:.5*strength,compress:-.12*beat*strength,forelegLift:.25*beat*strength});
 return pose;
}
export function applyFeedingExpression(behavior,pose){if(!pose)return behavior;for(const key of ['headDrop','bodyDrop','bodyLean','stanceSpread','compress','forelegLift'])if(pose[key]!==undefined)behavior[key]=(behavior[key]||0)+pose[key];behavior.mouthPulse=Math.max(behavior.mouthPulse||0,pose.mouthPulse);return behavior}
