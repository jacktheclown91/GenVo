import {applyAnatomicalStrike} from './strike-anatomy.js';
// Presentation-only combat feedback for v1.28 decisions under pressure.
// Reads simulation state, never mutates it, and allocates nothing per frame beyond
// canvas calls. Drawn in the creature's local pixel space (after translate).

const FACING=[[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071],[-1,0],[-.7071,-.7071]];

function px(c,x,y,w,h,s,color){c.fillStyle=color;c.fillRect(Math.round(x*s),Math.round(y*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}

// Pose offsets layered onto the shared behavior state for the active creature.
export function applyPlayerCombatPose(behavior,status,winded,animal=null){
  if(!behavior||!status)return behavior;
  if(status.bracing){behavior.bodyDrop=(behavior.bodyDrop||0)+.9;behavior.stanceSpread=(behavior.stanceSpread||0)+1.1;behavior.compress=(behavior.compress||0)+.22;behavior.eyeNarrow=true;behavior.guardPlanted=true}
  if(status.attackPhase==='windup'){behavior.bodyLean=(behavior.bodyLean||0)-1.15*status.attackProgress;behavior.headDrop=(behavior.headDrop||0)+.75*status.attackProgress;behavior.bodyDrop=(behavior.bodyDrop||0)+.35;behavior.compress=(behavior.compress||0)+.18}
  else if(status.attackPhase==='leap'){behavior.bodyLean=(behavior.bodyLean||0)+1.8;behavior.bodyRise=(behavior.bodyRise||0)+.7;behavior.stanceSpread=(behavior.stanceSpread||0)+.9;behavior.mouthPulse=Math.max(behavior.mouthPulse||0,status.attackProgress)}
  else if(status.attackPhase==='recover'){const k=1-status.attackProgress;behavior.bodyLean=(behavior.bodyLean||0)+1.8*k;behavior.forelegLift=Math.max(behavior.forelegLift||0,.8*k);behavior.mouthPulse=Math.max(behavior.mouthPulse||0,k)}
  if(animal)applyAnatomicalStrike(behavior,status,animal);
  if(winded){behavior.bodyDrop=(behavior.bodyDrop||0)+.4;behavior.headDrop=(behavior.headDrop||0)+.35;behavior.feelerForward=(behavior.feelerForward??1)*.82}
  return behavior;
}

export function drawPlayerCombatFeedback(c,{animal,status,winded,scale,now,dir}){
  if(!animal||!status)return;
  const f=FACING[(dir??animal.dir)&7]||FACING[0],fx=f[0],fy=f[1],sx=-fy,sy=fx;
  if(status.bracing){
    // A guard arc in front of the body: the protected angle reads at a glance.
    const pulse=.72+.18*Math.sin(now/120);c.save();c.globalAlpha=pulse;
    for(let i=-3;i<=3;i++){const t=i/3,bend=(1-t*t)*1.6,x=fx*(8.2+bend)+sx*t*6.4,y=fy*(8.2+bend)+sy*t*6.4-2;px(c,x-1,y-1,2,2,scale,i===0?'#fff2c2':'#e7cf86')}
    c.restore();
  }
  if(status.attackPhase==='windup'){
    // Coiled marks behind the head show the commitment before the bite lands.
    const k=status.attackProgress;c.save();c.globalAlpha=.55+.4*k;
    for(let i=0;i<3;i++){const x=-fx*(4+i*1.6)+sx*(i-1)*2.2,y=-fy*(4+i*1.6)+sy*(i-1)*2.2-3;px(c,x,y,1.4,1.4,scale,status.slow?'#d89a74':'#f1e2a8')}
    c.restore();
  }else if(status.attackPhase==='recover'&&animal.attackAction?.outcome==='hit'&&status.attackProgress<.45){
    const k=1-status.attackProgress/.45;c.save();c.globalAlpha=.85*k;
    for(let i=-1;i<=1;i++){const x=fx*(8+k*2)+sx*i*2.4,y=fy*(8+k*2)+sy*i*2.4-2;px(c,x-.8,y-.8,1.6,1.6,scale,'#fff6d8')}
    c.restore();
  }
  if(winded){
    // Short breath puffs near the mouth: exhaustion is visible without a meter.
    const cycle=(now/520)%1,rise=cycle*4;c.save();c.globalAlpha=.65*(1-cycle);
    const x=fx*7+sx*1.5,y=fy*7-3-rise;px(c,x,y,2,2,scale,'#e9f1ee');px(c,x+sx*2.5,y-1.5,1.4,1.4,scale,'#dce7e2');
    c.restore();
  }
}

// Stalker pursuit read: a searching hunter shows a scanning mark, a tiring one sags.
export function drawStalkerPursuitFeedback(c,{animal,scale,now}){
  const h=animal?.playerHunt;if(!h)return;
  if(h.pursuit==='search'&&h.phase==='stalk'){
    const blink=Math.sin(now/160)>0;c.save();c.globalAlpha=blink?.9:.55;
    px(c,-1,-15,3,1,scale,'#f0d7a0');px(c,1,-14,1,2,scale,'#f0d7a0');px(c,0,-12,1,1,scale,'#f0d7a0');px(c,0,-10,1,1,scale,'#f0d7a0');
    c.restore();
  }
  if(Number.isFinite(h.stamina)&&h.stamina<30){
    const cycle=(now/430+animal.id*.17)%1;c.save();c.globalAlpha=.6*(1-cycle);px(c,6,-6-cycle*4,2,2,scale,'#e8ece6');c.restore();
  }
}
