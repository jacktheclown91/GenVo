// Living Creature Pass (creator direction 2026-10-23): make each animal's own reaction to danger
// visible. Staged threat perception (ecology/threat-perception.js) already decides, per animal,
// from its own senses, inherited boldness (genes.temperament) and current need, whether a
// predator is only watched (vigilance), backed away from (alarm: the 'wary' retreat) or fled.
// Two animals in the same place can therefore be at different stages; this shows which.
// Presentation only: reads a.vigilance, a.intent and genes, writes nothing, consumes no RNG.
import {FLEEING} from '../ecology/threat-appraisal.js';
import {displaySpread} from '../gameplay/threat-display.js';

const valid=b=>b&&b.alive&&Number.isFinite(b.x)&&Number.isFinite(b.y);
// The predator this animal is tracking right now, if any.
export function watchedThreat(sim,a){
 const v=a?.vigilance;if(!v||!(v.untilTick>sim.tickCount))return null;
 const b=sim.animals.find(o=>o.id===v.id);return valid(b)?b:null;
}
// Inherited boldness in -1 (most cautious) .. 1 (boldest), from the same gene the thresholds use.
export function boldness(a){const t=a?.genes?.temperament??1;return Math.max(-1,Math.min(1,(t-1)/.12))}

// The reaction stage and how it should look, or null when the animal is not reacting.
// time is the renderer's presentation clock (seconds), used only for glance timing.
export function reactionExpression(sim,a,{moving=false,time=0}={}){
 if(!a?.alive||a.player)return null;
 const threat=watchedThreat(sim,a),bold=boldness(a);
 const stage=FLEEING.has(a.intent)&&a.intent!=='wary'&&threat?'flee':a.intent==='wary'?'wary':threat?'watch':null;
 if(!stage)return strangerExpression(sim,a,{moving,time,bold});
 const at=threat?{x:threat.x,y:threat.y}:null,pose={};
 if(stage==='watch'){
  // Frozen and staring. A cautious animal crouches and pins its feelers; a bold one stands
  // tall and square-on.
  Object.assign(pose,{bodyRise:moving?.1:.28+.22*Math.max(0,bold),bodyDrop:Math.max(0,-bold)*.35,compress:Math.max(0,-bold)*.14,
   stanceSpread:.25+.35*Math.max(0,bold),feelerForward:1.3,feelerPin:Math.max(0,-bold)*.6,eyeWide:true});
 }else if(stage==='wary'){
  // A low, tense retreat that glances back. Cautious animals glance back more often.
  const every=1.6-.5*Math.max(0,-bold)+.4*Math.max(0,bold),glancing=((time+a.id*.37)%every)<.45;
  Object.assign(pose,{bodyDrop:.42,compress:.14,bodyLean:.35,feelerForward:.8,feelerPin:.55,eyeWide:true,glancing});
 }
 return{stage,bold,attention:stage==='flee'?null:stage==='wary'?(pose.glancing?at:null):at,pose};
}
// Responses to the player's creature (ecology/stranger-response.js): curious approach and
// watching, keeping away with glances back, and a parent's posture with any display spread.
const STRANGER={'stranger-investigate':'investigate','stranger-watch':'curious','stranger-avoid':'avoid','stranger-posture':'posture'};
function strangerExpression(sim,a,{moving,time,bold}){
 const stage=STRANGER[a.intent],p=stage&&sim.player?.();if(!stage||!valid(p)||a.stranger?.id!==p.id)return null;
 const at={x:p.x,y:p.y},pose={};let attention=at;
 if(stage==='investigate')Object.assign(pose,{bodyLean:.2,feelerForward:1.38,eyeWide:true});
 else if(stage==='curious')Object.assign(pose,{bodyRise:.18+.18*Math.max(0,bold),feelerForward:1.35,feelerSweep:.45,eyeWide:true});
 else if(stage==='avoid'){const every=1.5-.4*Math.max(0,-bold),glancing=((time+a.id*.37)%every)<.4;attention=glancing?at:null;Object.assign(pose,{bodyDrop:.3,compress:.1,feelerPin:.45,glancing})}
 else Object.assign(pose,{bodyRise:.55,stanceSpread:1.25,feelerForward:1.25,eyeWide:true,crestSpread:displaySpread(a)>0?.85:0});
 return{stage,bold,attention,pose,stranger:true};
}
// Apply a reaction's body language on top of the action pose.
export function applyReactionPose(behavior,reaction){
 if(!reaction)return;const p=reaction.pose;
 for(const k of ['bodyRise','bodyDrop','compress','stanceSpread','bodyLean'])if(p[k])behavior[k]=(behavior[k]||0)+p[k];
 if(p.feelerForward)behavior.feelerForward=Math.max(behavior.feelerForward||0,p.feelerForward);
 if(p.feelerPin)behavior.feelerPin=Math.max(behavior.feelerPin||0,p.feelerPin);
 if(p.eyeWide){behavior.eyeWide=true;behavior.eyeNarrow=false}
 if(p.feelerSweep)behavior.feelerSweep=Math.max(behavior.feelerSweep||0,p.feelerSweep);
 if(p.crestSpread)behavior.crestSpread=Math.max(behavior.crestSpread||0,p.crestSpread);
 behavior.attention=reaction.stranger?'stranger':'threat';
}
