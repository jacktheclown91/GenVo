import {CFG} from '../sim/config.js';
import {partEffectFactors} from '../lineage/part-abilities.js';
// Renderer-owned encounter reactions: how a body answers a hit it braced, a charge that
// stalled, a wound it carries and the retreat that follows. Every reaction is read from
// state the combat authorities already wrote (lastPlayerBrace, playerHunt.lastOutcome,
// playerHunt.wounds, playerAversion). No simulation writes, RNG or hidden values.

const TAU=Math.PI*2;
const FACING=[[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071],[-1,0],[-.7071,-.7071]];
export const REACTION_SECONDS=Object.freeze({brace:.7,stagger:.9,overrun:.75,flinch:.55,settle:.6});
// Whole-body displacement away from the force, in sprite pixels (same units as impact recoil).
const SHOVE={'brace-frontal':.9,'brace-side':1.6,'brace-rear':2.2,stagger:2.8,flinch:1.8};
const RETREAT_COWED=new Set(['driven-off','repelled',undefined]);
const RETREAT_INTENTS=new Set(['escape','return-den']);
const clamp01=v=>Math.max(0,Math.min(1,v));
// Sharp onset, then a long ease out: an impact should land before it fades.
function impulse(age,dur){if(age<0||age>=dur)return 0;return age<.07?age/.07:1-(age-.07)/(dur-.07)}

// How well this body's anatomy holds a brace (sturdy legs/spine ridge > runner legs).
// Uses the same factor canonical brace damage uses, so the visible rock matches the rule.
export function braceSteadiness(animal){const b=partEffectFactors(animal)?.brace??1;return clamp01((1.08-b)/.2)}

export class EncounterReactionPresentation{
 constructor(){this.reset()}
 reset(){this.entries=new WeakMap();this.defenseEntries=new WeakMap();this.world=null}
 since(a,key,time,map=this.entries){let e=map.get(a);if(!e){e={};map.set(a,e)}if(e.key!==key){e.key=key;e.at=time}return Math.max(0,time-e.at)}
 sample(sim,a,time=0){
  if(this.world!==sim){this.reset();this.world=sim}
  if(!a?.alive)return null;const tick=sim.tickCount,hz=CFG.simHz;
  // 1. The active creature receives a hit while braced: frontal guard holds, a side hit
  // twists it, a rear hit buckles it. Body steadiness comes from its own anatomy.
  const brace=a.player?sim.lastPlayerBrace:null;
  if(brace&&tick-brace.tick>=0&&tick-brace.tick<=hz){
   const age=this.since(a,'brace:'+brace.tick+':'+brace.kind,time),k=impulse(age,REACTION_SECONDS.brace);
   if(age<REACTION_SECONDS.brace){const steady=braceSteadiness(a),attacker=sim.animals.find(o=>o.id===brace.attackerId);
    const kind='brace-'+brace.kind;
    return{kind,strength:k,steadiness:steady,absorbed:brace.absorbed||0,source:attacker?{x:attacker.x,y:attacker.y}:null,age,shove:(SHOVE[kind]||0)*k*(1-.45*steady)};}
  }
  // 2. An engaged hunter's recovery reads as what happened to its charge.
  const h=a.playerHunt;
  if(h?.phase==='recover'){
   const outcome=h.lastOutcome,player=sim.animals.find(o=>o.id===h.targetId&&o.alive),age=this.since(a,'recover:'+h.startedTick+':'+outcome,time);
   const kind=outcome==='braced'?'stagger':outcome==='evaded'||outcome==='contact-miss'?'overrun':outcome==='countered'||outcome==='repelled'?'flinch':'settle';
   const k=impulse(age,REACTION_SECONDS[kind]);
   return{kind,strength:k,age,wounds:h.wounds||0,source:player?{x:player.x,y:player.y}:null,lane:Number.isFinite(h.aimDirX)?{x:h.aimDirX,y:h.aimDirY}:null,shove:(SHOVE[kind]||0)*k};
  }
  // 3. A creature breaking off: beaten (cowed, glancing back) or merely disengaging.
  const av=a.playerAversion;
  if(av&&av.untilTick>tick&&RETREAT_INTENTS.has(a.intent)){
   const from=sim.animals.find(o=>o.id===av.targetId&&o.alive),age=this.since(a,'retreat:'+av.untilTick,time);
   const cowed=RETREAT_COWED.has(av.reason),remaining=clamp01((av.untilTick-tick)/(hz*2));
   // The beaten creature checks over its shoulder on a slow cadence, not continuously.
   const glance=cowed&&from&&Math.sin(age*TAU/1.6+a.id)>.55;
   return{kind:cowed?'retreat-cowed':'retreat-disengage',strength:Math.max(.45,remaining),age,wounds:av.wounds||0,source:from?{x:from.x,y:from.y}:null,glance};
  }
  // 4. Wounds taken during a still-running engagement stay visible between beats.
  if(h&&(h.wounds||0)>0)return{kind:'wounded',strength:1,age:0,wounds:h.wounds,source:null};
  return null;
 }
 // What the body's own defensive anatomy did with a hit, sampled separately so a brace
 // receipt and an armour/shell/spine answer can play together on the same frame.
 // Reads lastDefenseReceipt (written by tryKill for player-involved hits) and
 // lastPlayerCombatImpact (player strikes); organ choice comes from the actual body plan.
 sampleDefense(sim,a,time=0){
  if(this.world!==sim){this.reset();this.world=sim}
  if(!a?.alive)return null;const tick=sim.tickCount,hz=CFG.simHz,fresh=t=>Number.isInteger(t)&&tick-t>=0&&tick-t<=hz;
  const at=id=>{const o=sim.animals.find(x=>x.id===id&&x.alive);return o?{x:o.x,y:o.y}:null};
  const r=sim.lastDefenseReceipt;
  if(r&&fresh(r.tick)&&(r.preyId===a.id||r.attackerId===a.id)){
   const defender=r.preyId===a.id,kind=defender?(r.hit?(r.shell>0?'shell-turn':r.raw>0&&r.armor/r.raw>.1?'armor-absorb':a.player?null:'prey-bitten'):(a.player?null:'prey-dodge')):(r.repelled?'organ-recoil':null);
   const organ=defender&&r.repelled?defenseOrgan(a):null;
   if(kind||organ){const age=this.since(a,'def:'+r.tick+':'+r.attackerId+':'+r.preyId,time,this.defenseEntries),dur=DEFENSE_SECONDS[kind||'organ'];
    if(age<dur){const k=impulse(age,dur),share=r.raw>0?clamp01((r.armor+r.shell)/r.raw):0;
     return{kind:kind||'organ-flare',organ,strength:k,share,age,source:at(defender?r.attackerId:r.preyId),shove:(DEFENSE_SHOVE[kind]||0)*k*(kind==='armor-absorb'?1-share:1)};}}
  }
  const im=sim.lastPlayerCombatImpact,player=sim.player?.();
  if(im&&fresh(im.tick)&&(im.spines||im.armored)&&im.kind!=='miss'&&im.kind!=='kill'){
   const target=im.targetId===a.id,striker=player?.id===a.id&&im.spines;
   if(target||striker){const kind=target?(im.spines?'spines-flare':'armor-absorb'):'spine-prick',age=this.since(a,'imp:'+im.tick+':'+kind,time,this.defenseEntries),dur=DEFENSE_SECONDS[kind];
    if(age<dur){const k=impulse(age,dur);return{kind,organ:kind==='spines-flare'?'spines':null,strength:k,share:im.armored?.4:0,age,source:target?(player?{x:player.x,y:player.y}:null):at(im.targetId),shove:(DEFENSE_SHOVE[kind]||0)*k};}}
  }
  return null;
 }
}

export const DEFENSE_SECONDS=Object.freeze({'armor-absorb':.55,'shell-turn':.9,organ:.6,'organ-recoil':.7,'prey-bitten':.55,'prey-dodge':.45,'spines-flare':.55,'spine-prick':.45});
const DEFENSE_SHOVE={'armor-absorb':.6,'shell-turn':.4,'organ-recoil':2.6,'prey-bitten':2,'prey-dodge':0,'spine-prick':1.2};
const ORGANS={club:['club-tail'],horn:['horn-crest'],spines:['spine-cluster','thorn-carapace','spine-ridge','spined-tail','armored-hide','barb']};
// The defensive part that actually carries a repel effect on this body, if any.
export function defenseOrgan(animal){const parts=new Set(animal?.bodyPlan?.nodes?.map(n=>n.partId)||[]);for(const [organ,ids] of Object.entries(ORGANS))if(ids.some(id=>parts.has(id)))return organ;return null}
// A sidestep moves across the line of attack; every other answer is pushed away from it.
export function defenseShove(r,animal){
 if(!r||!animal)return null;
 if(r.kind==='prey-dodge'&&r.source){const dx=animal.x-r.source.x,dy=animal.y-r.source.y,len=Math.hypot(dx,dy)||1,side=(animal.id&1)?1:-1,k=r.strength*3;return{x:-dy/len*side*k,y:dx/len*side*k}}
 return reactionShove(r,animal);
}
export function applyDefenseReaction(behavior,r){
 if(!behavior||!r)return behavior;const k=r.strength||0,add=(key,v)=>{behavior[key]=(behavior[key]||0)+v};
 if(r.kind==='armor-absorb'){add('compress',.25*k);add('bodyDrop',.2*k);behavior.guardPlanted=true;behavior.eyeNarrow=true}
 else if(r.kind==='shell-turn'){add('bodyDrop',1.4*k);add('headDrop',1.9*k);add('stanceSpread',-.7*k);add('compress',.45*k);behavior.feelerPin=Math.max(behavior.feelerPin||0,1.4*k);behavior.eyeNarrow=true;behavior.guardPlanted=true}
 else if(r.kind==='organ-recoil'||r.kind==='prey-bitten'||r.kind==='spine-prick'){const m=r.kind==='spine-prick'?.55:1;add('bodyLean',-1.8*k*m);add('headDrop',1.2*k*m);add('compress',.3*k*m);behavior.eyeNarrow=true;behavior.feelerPin=Math.max(behavior.feelerPin||0,1.1*k*m)}
 else if(r.kind==='prey-dodge'){add('bodySway',((r.age*18)%2<1?1:-1)*.6*k);add('bodyRise',.5*k);add('stanceSpread',.8*k);behavior.eyeWide=true;behavior.feelerPin=Math.max(behavior.feelerPin||0,.8*k)}
 if(r.organ==='club')add('tailSweep',Math.sin(r.age*TAU*2.2)*3.2*k);
 else if(r.organ==='horn'){add('headReach',1.6*k);add('headDrop',-.8*k)}
 else if(r.organ==='spines'){add('compress',.2*k);behavior.eyeNarrow=true}
 return behavior;
}
// Marks on the defending body: plate glints on the struck side, a shell highlight,
// raised quills, the club's contact chip, or dust where a prey animal sidestepped.
export function drawDefenseMarks(c,{reaction:r,animal,scale,dir}){
 if(!r||!(r.strength>0))return;const k=r.strength;let fx,fy;
 if(r.source&&animal){const dx=r.source.x-animal.x,dy=r.source.y-animal.y,len=Math.hypot(dx,dy);if(len>.01){fx=dx/len;fy=dy/len}}
 const face=FACING[(dir??animal?.dir??0)&7]||FACING[0];if(fx===undefined){fx=face[0];fy=face[1]}
 const sx=-fy,sy=fx;c.save();
 if(r.kind==='armor-absorb'){c.globalAlpha=.95*k;const n=2+Math.round(r.share*4);for(let i=0;i<n;i++){const t=n>1?i/(n-1)*2-1:0,x=fx*3.6+sx*t*3.2,y=fy*3.6+sy*t*3.2-3;px(c,x-.6,y-.6,1.2,1.2,scale,i%2?'#e9f2ff':'#ffffff')}}
 else if(r.kind==='shell-turn'){c.globalAlpha=.9*k;for(let i=-2;i<=2;i++){const x=-face[0]*2.5-face[1]*i*1.3,y=-face[1]*2.5+face[0]*i*1.3-4;px(c,x-.6,y-.5,1.2,1,scale,i===0?'#fff8de':'#e8dcb4')}}
 else if(r.kind==='prey-dodge'){c.globalAlpha=.6*k;for(const o of [-1,1])px(c,sx*o*3-1,sy*o*3+5,2,1,scale,'#cdb88d')}
 else if(r.kind==='prey-bitten'||r.kind==='organ-recoil'||r.kind==='spine-prick'){c.globalAlpha=.85*k;for(let i=-1;i<=1;i++)px(c,fx*5+sx*i*1.6-.7,fy*5+sy*i*1.6-2.7,1.4,1.4,scale,i===0?'#f6e7d2':'#d9b9a4')}
 if(r.organ==='spines'){c.globalAlpha=.95*k;const lift=1.5+2.5*k;for(let i=0;i<5;i++){const a=(i-2)*.42,ux=fx*Math.cos(a)+sx*Math.sin(a),uy=fy*Math.cos(a)+sy*Math.sin(a);for(let j=0;j<3;j++){const d=4+j*lift*.5;px(c,ux*d-.5,uy*d-3.5,1,1,scale,j===2?'#ffffff':'#f1e8cf')}}}
 else if(r.organ==='club'){c.globalAlpha=.9*k;const x=-face[0]*8+fx*2,y=-face[1]*8+fy*2-1;px(c,x-1,y-1,2,2,scale,'#fff4d6');px(c,x+sx*2,y+sy*2,1,1,scale,'#e7cf86');px(c,x-sx*2,y-sy*2,1,1,scale,'#e7cf86')}
 else if(r.organ==='horn'){c.globalAlpha=.9*k;const x=face[0]*8,y=face[1]*8-4;px(c,x-1,y-1,2,2,scale,'#fff4d6');px(c,x+fx*2,y+fy*2,1,1,scale,'#e7cf86')}
 c.restore();
}

// Pose channels are the same shared ones the anatomy renderer already consumes.
export function applyEncounterReaction(behavior,r){
 if(!behavior||!r)return behavior;const k=r.strength||0,add=(key,v)=>{behavior[key]=(behavior[key]||0)+v};
 if(r.kind==='brace-frontal'){const rock=1-.55*r.steadiness;add('bodyLean',-1.5*rock*k);add('compress',.4*k);add('stanceSpread',.5*k*(1+r.steadiness));add('bodyDrop',.35*k);behavior.guardPlanted=true;behavior.eyeNarrow=true}
 else if(r.kind==='brace-side'){const rock=1-.4*r.steadiness;add('bodySway',Math.sin(r.age*TAU*2.4)*1.5*rock*k);add('bodyLean',-.5*k);add('headDrop',.6*k);add('compress',.18*k);behavior.eyeNarrow=true;behavior.feelerPin=Math.max(behavior.feelerPin||0,.6*k)}
 else if(r.kind==='brace-rear'){add('bodyDrop',1.2*k);add('headDrop',1.3*k);add('bodyLean',.9*k);add('compress',.32*k);behavior.limp=Math.max(behavior.limp||0,.8*k);behavior.recoil=k>.4?1:behavior.recoil;behavior.eyeNarrow=true;behavior.feelerPin=Math.max(behavior.feelerPin||0,1.1*k)}
 else if(r.kind==='stagger'){const shake=Math.sin(r.age*TAU*3.2)*Math.max(0,1-r.age/REACTION_SECONDS.stagger);add('bodyLean',-2.4*k);add('bodySway',shake*2.4);add('headDrop',1.5*k);add('stanceSpread',1.2*k);add('compress',.25*k);behavior.eyeNarrow=true;behavior.feelerPin=Math.max(behavior.feelerPin||0,1.2*k);behavior.mouthPulse=0;behavior.guardPlanted=true}
 else if(r.kind==='overrun'){add('bodyLean',1.8*k);add('stanceSpread',1.5*k);add('bodyDrop',.7*k);add('compress',.15*k);behavior.groundEmphasis=Math.max(behavior.groundEmphasis||0,.9*k);behavior.eyeWide=k>.3}
 else if(r.kind==='flinch'){add('bodyLean',-1.8*k);add('headDrop',1.2*k);add('compress',.35*k);behavior.eyeNarrow=true;behavior.feelerPin=Math.max(behavior.feelerPin||0,1*k)}
 else if(r.kind==='settle'){add('bodyRise',.25*k);behavior.mouthPulse=Math.max(behavior.mouthPulse||0,.4*k)}
 else if(r.kind==='retreat-cowed'){add('bodyDrop',1.5*k);add('headDrop',1.7*k);add('compress',.32*k);add('stanceSpread',.4*k);behavior.feelerPin=Math.max(behavior.feelerPin||0,1.2);behavior.eyeWide=true;behavior.tailTuck=Math.max(behavior.tailTuck||0,k)}
 else if(r.kind==='retreat-disengage'){add('bodyRise',.2);behavior.feelerForward=Math.max(behavior.feelerForward||1,1.15);behavior.eyeWide=false}
 const wounds=Math.min(2,r.wounds||0);
 if(wounds>0){behavior.limp=Math.max(behavior.limp||0,.45*wounds);add('headDrop',.22*wounds);add('bodyDrop',.18*wounds)}
 return behavior;
}

// Screen-space shove away from the reaction's source, in sprite pixels.
export function reactionShove(r,animal){
 if(!(r?.shove>0)||!r.source||!animal)return null;const dx=animal.x-r.source.x,dy=animal.y-r.source.y,len=Math.hypot(dx,dy);if(len<.01)return null;
 return{x:dx/len*r.shove,y:dy/len*r.shove};
}

// Attention the head should follow (the source of the hit, or a glance back on retreat).
export function reactionAttention(r){
 if(!r?.source)return null;
 if(r.kind==='retreat-cowed')return r.glance?r.source:null;
 if(r.kind==='retreat-disengage'||r.kind==='wounded')return null;
 return r.source;
}

function px(c,x,y,w,h,s,color){c.fillStyle=color;c.fillRect(Math.round(x*s),Math.round(y*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}

// Sparse marks in the creature's local pixel space (after translate). They show where
// the force went, not a number: guard sparks on the struck side, skid dust, scuffs.
export function drawEncounterReactionMarks(c,{reaction:r,animal,scale,dir}){
 if(!r||!(r.strength>0))return;const k=r.strength;
 let fx,fy;
 if(r.source&&animal){const dx=r.source.x-animal.x,dy=r.source.y-animal.y,len=Math.hypot(dx,dy);if(len>.01){fx=dx/len;fy=dy/len}}
 if(fx===undefined){const f=FACING[(dir??animal?.dir??0)&7]||FACING[0];fx=f[0];fy=f[1]}
 const sx=-fy,sy=fx;c.save();
 if(r.kind==='brace-frontal'){
  // The guard arc flares toward the attacker; a steadier body throws fewer, tighter sparks.
  c.globalAlpha=.9*k;const spread=6.8+2*(1-r.steadiness),reach=8.6+1.6*(1-k);
  for(let i=-3;i<=3;i++){const t=i/3,bend=(1-t*t)*1.8,x=fx*(reach+bend)+sx*t*spread,y=fy*(reach+bend)+sy*t*spread-2;px(c,x-1,y-1,2,2,scale,i===0?'#fffbe6':'#f3dc92')}
  const chips=r.absorbed>8?3:2;for(let i=0;i<chips;i++){const o=(i-(chips-1)/2)*3,d=11+(1-k)*4;px(c,fx*d+sx*o-.6,fy*d+sy*o-2.6,1.2,1.2,scale,'#fff6cf')}
 }else if(r.kind==='brace-side'){
  c.globalAlpha=.8*k;const side=(sx*fx+sy*fy)>=0?1:-1;
  for(let i=0;i<4;i++){const t=i/3,x=fx*(6+t*2)+sx*side*(2+t*4),y=fy*(6+t*2)+sy*side*(2+t*4)-2;px(c,x-.8,y-.8,1.6,1.6,scale,'#e7cf86')}
 }else if(r.kind==='brace-rear'||r.kind==='flinch'){
  // No guard: the hit lands on tissue. A short scuff where it struck.
  c.globalAlpha=.85*k;const d=r.kind==='flinch'?5:6;
  for(let i=-1;i<=1;i++)px(c,fx*d+sx*i*1.8-.7,fy*d+sy*i*1.8-2.7,1.4,1.4,scale,i===0?'#f6e7d2':'#d9b9a4');
 }else if(r.kind==='stagger'){
  // Dust kicked from planted feet as the charge is stopped dead.
  c.globalAlpha=.7*k;for(const side of [-1,1]){const x=-fx*5+sx*side*5,y=-fy*5+sy*side*5+5-(1-k)*2;px(c,x-1,y,2,1,scale,'#c9b48a');px(c,x+sx*side*1.5,y-1,1,1,scale,'#d8c79f')}
 }else if(r.kind==='overrun'){
  // Skid marks trail behind along the spent lane.
  const lx=r.lane?.x??-fx,ly=r.lane?.y??-fy;c.globalAlpha=.65*k;
  for(let i=1;i<=3;i++){const x=-lx*(3+i*2.2),y=-ly*(3+i*2.2)+5;px(c,x-1,y,2,1,scale,i===1?'#cdb88d':'#b9a57c')}
 }
 c.restore();
}
