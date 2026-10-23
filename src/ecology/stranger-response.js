import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {bodyMass} from '../organisms/body-mass.js';
import {canHunt,huntingAbility,preyPreference} from './functional-diet.js';
import {detects} from './threat-perception.js';

// Responses to a stranger (Living Creature Pass, creator direction 2026-10-23: "Watching five
// creatures for two minutes should reveal differences in how they behave"). The stranger is the
// player's creature when it is not a predator to the animal: wildlife previously ignored it
// entirely. A healthy wild adult that actually perceives it nearby (its own senses, as for
// threats) answers from its own state:
//  - a parent with dependent young close by stands its ground between them and the stranger
//    and postures, stepping toward it (no attack);
//  - otherwise a disposition is weighed: inherited boldness (genes.temperament), its own bite,
//    condition (energy), the stranger's size relative to its own, and recent experience (a
//    predator it watched lately); having seen the stranger strike someone nearby, it remembers
//    and keeps away for a while whatever its temperament;
//  - a low disposition keeps its distance; a high one investigates once: it approaches to a
//    short distance, stops and watches, then loses interest for a while; between the two it
//    carries on with what it was doing.
// Deterministic (no RNG); the state it keeps (a.stranger) is saved with the animal. Hunters that
// could prey on the stranger, lineage members and the player itself are not affected.
export const STRANGER_RESPONSES=Object.freeze({policy:'stranger-responses/1',radius:4.5,adultHealth:70,energy:.5,hydration:.45,
 investigateFrom:.3,avoidBelow:-.25,stop:2.2,investigateSeconds:6,cooldownSeconds:45,keepAway:6,closeIn:1.2,
 youngRadius:5,postureRadius:3.5,postureGap:1.4,frightSeconds:20,witnessRadius:7,
 weights:{bold:.7,bite:.3,condition:.8,size:.8,fright:.5,witness:.8}});

const clamp=(lo,hi,v)=>Math.max(lo,Math.min(hi,v));
// The stranger this animal can respond to, or null.
function strangerFor(sim,a){
 const p=sim.player?.();if(!p?.alive||p===a||a.player||a.lineage)return null;
 if(sim.isPredatorTo(p,a))return null;// a threat, handled by staged threat perception
 if(canHunt(a)&&preyPreference(a,p)>0)return null;// a potential meal, handled by hunting
 return p;
}
// Own dependent young within reach.
function youngNearby(sim,a){
 const S=STRANGER_RESPONSES,mature=SPECIES[a.species]?.maturity??0;
 return sim.animals.some(c=>c.alive&&c!==a&&c.age<mature&&c.parentIds?.includes(a.id)&&Math.hypot(c.x-a.x,c.y-a.y)<=S.youngRadius);
}
// The weighed disposition toward the stranger (-.. cautious, +.. curious), with its parts.
export function strangerDisposition(sim,a,p,{energy=1}={}){
 const W=STRANGER_RESPONSES.weights,S=STRANGER_RESPONSES,hz=CFG.simHz;
 const bold=clamp(-1,1,((a.genes?.temperament??1)-1)/.12),bite=huntingAbility(a),size=clamp(-.5,1,(bodyMass(p)/Math.max(.001,bodyMass(a))-1)*W.size);
 const frightened=(a.vigilance?.untilTick??-Infinity)>sim.tickCount-S.frightSeconds*hz?1:0;
 const hit=sim.lastPlayerCombatImpact,victim=hit&&hit.kind!=='miss'&&sim.tickCount-hit.tick<=S.frightSeconds*hz?sim.animals.find(o=>o.id===hit.targetId):null;
 const witnessed=victim&&Math.hypot(victim.x-a.x,victim.y-a.y)<=S.witnessRadius?1:0;
 const score=W.bold*bold+W.bite*bite+W.condition*(energy-.7)-size-W.fright*frightened-W.witness*witnessed;
 return{score,bold,bite,size,frightened,witnessed};
}
// The decision for this step: {intent,target} or null to carry on.
export function strangerResponse(sim,a,{energy=1,hydration=1}={}){
 const S=STRANGER_RESPONSES,hz=CFG.simHz;
 if(sim.strangerRules!==S.policy||!a?.alive||a.player||a.lineage)return null;
 const p=strangerFor(sim,a);if(!p)return null;
 const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy),state=a.stranger?.id===p.id?a.stranger:null;
 const investigating=state?.mode==='investigate'&&sim.tickCount<state.untilTick;
 if(d>S.radius*(a.genes?.senses||1)&&!investigating)return null;
 if((a.age??0)<(SPECIES[a.species]?.maturity??0)||a.health<S.adultHealth||energy<S.energy||hydration<S.hydration)return null;
 if(!investigating&&!detects(sim,a,p,d,S.radius*(a.genes?.senses||1)))return null;
 const away=(k)=>({x:a.x-dx/(d||1)*k,y:a.y-dy/(d||1)*k}),reach=t=>t&&sim.canReach(a,t.x,t.y)?t:null;
 // Parents stand their ground between their young and the stranger.
 if(d<=S.postureRadius&&youngNearby(sim,a)){a.stranger={id:p.id,mode:'posture',startTick:state?.mode==='posture'?state.startTick:sim.tickCount,untilTick:sim.tickCount+hz};
  const step=Math.max(0,d-S.postureGap);return{intent:'stranger-posture',target:step>.2?reach({x:a.x+dx/d*Math.min(1,step),y:a.y+dy/d*Math.min(1,step)})||null:null}}
 if(investigating){
  if(d<S.closeIn){a.stranger={...state,mode:'done',cooldownUntil:sim.tickCount+S.cooldownSeconds*hz};const t=reach(away(1.5));return t?{intent:'stranger-avoid',target:t}:null}
  if(d>S.stop+.4){const t=reach({x:p.x-dx/d*S.stop,y:p.y-dy/d*S.stop});if(t)return{intent:'stranger-investigate',target:t}}
  return{intent:'stranger-watch',target:null};
 }
 if(state?.mode==='investigate'&&sim.tickCount>=state.untilTick)a.stranger={...state,mode:'done',cooldownUntil:sim.tickCount+S.cooldownSeconds*hz};
 const view=strangerDisposition(sim,a,p,{energy});
 const afraid=view.witnessed||(a.stranger?.id===p.id&&(a.stranger.fearUntil??-Infinity)>sim.tickCount),fearUntil=view.witnessed?sim.tickCount+S.frightSeconds*3*hz:a.stranger?.fearUntil;
 if(afraid||view.score<=S.avoidBelow){if(d>=S.keepAway)return null;const t=reach(away(S.keepAway-d+.5))||reach(away(2));if(!t)return null;
  a.stranger={id:p.id,mode:'avoid',startTick:state?.mode==='avoid'?state.startTick:sim.tickCount,untilTick:sim.tickCount+hz,...(afraid?{fearUntil}:{})};return{intent:'stranger-avoid',target:t}}
 if(view.score>=S.investigateFrom&&!((a.stranger?.cooldownUntil??-Infinity)>sim.tickCount)){
  a.stranger={id:p.id,mode:'investigate',startTick:sim.tickCount,untilTick:sim.tickCount+S.investigateSeconds*hz};
  const t=d>S.stop+.4?reach({x:p.x-dx/d*S.stop,y:p.y-dy/d*S.stop}):null;return t?{intent:'stranger-investigate',target:t}:{intent:'stranger-watch',target:null};
 }
 return null;
}
// Saves: worlds recorded before this rule keep their recorded behaviour.
export function restoreStrangerRules(sim,core){
 if(core.strangerRules!==undefined&&core.strangerRules!==STRANGER_RESPONSES.policy)throw Error('Unknown saved stranger-response rules.');
 if(core.strangerRules===undefined)delete sim.strangerRules;
}
