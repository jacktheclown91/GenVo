import {CFG} from '../sim/config.js';
import {currentCourtshipMove,COURTSHIP_PERFORMANCE,availableCourtshipMoves} from '../reproduction/courtship-performance.js';
// Renderer-owned transient state. No preference reads, controller calls or simulation writes.
export class EncounterPresentation{
 constructor(){this.reset()}
 reset(){this.entries=new WeakMap();this.time=0;this.lastNow=null}
 beginFrame(sim,now){if(this.world!==sim||sim.tickCount<this.tick){this.reset();this.world=sim}if(this.lastNow!==null&&!sim.paused)this.time+=Math.min(.05,Math.max(0,(now-this.lastNow)/1000));this.lastNow=now;this.tick=sim.tickCount;this.incoming=new Map();for(const a of sim.animals){const p=a.courtshipPerformance;if(!a.alive||a.intent!=='mate'||!p||sim.tickCount>p.endsAt)continue;const target=sim.animals.find(b=>b.id===p.partnerId&&b.alive);if(target&&Math.hypot(a.x-target.x,a.y-target.y)<=COURTSHIP_PERFORMANCE.contestRadius&&!this.incoming.has(target.id))this.incoming.set(target.id,a)}}
 sample(sim,a,phase=0){
  let e=this.entries.get(a);if(!e){e={mate:a.lastMate};this.entries.set(a,e)}
  const impact=sim.lastPlayerCombatImpact,hit=impact?.targetId===a.id&&impact.kind!=='miss'&&sim.tickCount-impact.tick<=CFG.simHz?impact:null;
  const injured=a.injuryCare?.active&&sim.tickCount-a.injuryCare.lastHitTick<=CFG.simHz?a.injuryCare:null;
  const key=hit?'hit:'+hit.tick:injured?'injury:'+injured.lastHitTick:null;
  if(key&&key!==e.hit){e.hit=key;e.hitAt=this.time}
  if(a.lastCourtshipRefusal?.tick!==undefined&&sim.tickCount-a.lastCourtshipRefusal.tick<=CFG.simHz*2&&a.lastCourtshipRefusal!==e.refusal){e.refusal=a.lastCourtshipRefusal;e.outcome='declined';e.outcomeAt=this.time}
  if(Number.isInteger(a.lastMatingTick)&&sim.tickCount-a.lastMatingTick<=CFG.simHz*2&&a.lastMatingTick!==e.matingTick){e.matingTick=a.lastMatingTick;e.outcome='paired';e.outcomeAt=this.time}e.mate=a.lastMate;
  const state=a.courtshipPerformance,active=a.intent==='mate'&&state&&sim.tickCount<=state.endsAt&&sim.animals.some(b=>b.id===state.partnerId&&b.alive&&Math.hypot(b.x-a.x,b.y-a.y)<=COURTSHIP_PERFORMANCE.contestRadius);
  const move=active?currentCourtshipMove(sim,a):null,lawful=!!move&&(move==='approach'||availableCourtshipMoves(a).includes(move));
  const displayPhase=((this.time*(1.1+(state?.tempo||0)*.2)+(a.id%7)*.07)%1)*8,wave=Math.sin(displayPhase*Math.PI/4),beat=(1+wave)*.5,intensity=active?Math.max(.35,Math.min(1,state.intensity||.35)):0;
  const pose={move:lawful?move:null,displayPhase:active?displayPhase:undefined,bodySway:0,displayStride:0,displayLift:0,forelegLift:0,crestSpread:0,tailSweep:0};
  if(pose.move==='dance')Object.assign(pose,{bodySway:wave*1.6*intensity,bodyRise:.4+beat*.65,displayStride:1.8*intensity,displayLift:1.1,stanceSpread:.4,feelerSweep:.8});
  if(pose.move==='call')Object.assign(pose,{bodyRise:.45,headDrop:-1.3*beat,mouthPulse:.25+.75*beat,compress:-.25*beat,feelerForward:1.5});
  if(pose.move==='flare')Object.assign(pose,{bodyRise:.7,stanceSpread:1.2,crestSpread:.3+.4*beat,eyeWide:true,compress:-.2});
  // Presentation-only settling uses the existing paused encounter clock.
  // It changes no paid move, preference, energy, physiology or simulation state.
  const displayDt=Math.max(0,this.time-(e.displayAt??this.time));e.displayAt=this.time;
  const targetSpread=pose.crestSpread,spread=targetSpread===0&&!e.crestSpread?0:targetSpread+((e.crestSpread||0)-targetSpread)*Math.exp(-displayDt/.12);
  pose.crestSpread=e.crestSpread=Math.abs(spread)<.0001?0:spread;
  if(pose.move==='scent')Object.assign(pose,{bodyLean:-.4,tailSweep:wave*1.4,feelerSweep:.35,bodySway:wave*.3});
  if(pose.move==='gesture')Object.assign(pose,{forelegLift:1.6*beat,feelerSweep:1.4,bodySway:wave*.4,headDrop:-.4});
  const incoming=this.incoming?.get(a.id);if(incoming&&!pose.move&&['idle','social','group','rest','wander'].includes(a.intent))Object.assign(pose,{attention:{x:incoming.x,y:incoming.y},headDrop:-.3,feelerForward:1.22,eyeWide:beat>.65});
  const hitAge=this.time-(e.hitAt??-99);if(hitAge<.65){const k=Math.sin(Math.min(1,hitAge/.65)*Math.PI);Object.assign(pose,{impact:k,compress:.35*k,headDrop:1.4*k,bodyLean:-1.2*k,feelerPin:.7*k,eyeNarrow:true})}
  const age=this.time-(e.outcomeAt??-99);if(age<1.6){pose.outcome=e.outcome;pose.outcomeStrength=1-age/1.6;if(e.outcome==='declined')Object.assign(pose,{headDrop:.8*pose.outcomeStrength,feelerForward:.72,bodyLean:-.5*pose.outcomeStrength});else Object.assign(pose,{relaxed:true,feelerSweep:.5,bodyRise:.2*pose.outcomeStrength})}
  return pose;
 }
}
export function applyEncounterPose(behavior,pose){for(const key of ['bodySway','bodyRise','bodyLean','headDrop','compress','stanceSpread','feelerSweep','feelerPin'])if(pose[key]!==undefined)behavior[key]=(behavior[key]||0)+pose[key];for(const key of ['displayPhase','displayStride','displayLift','forelegLift','crestSpread','tailSweep','mouthPulse','feelerForward','eyeWide','eyeNarrow','relaxed'])if(pose[key]!==undefined)behavior[key]=pose[key];return behavior}
