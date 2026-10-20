import {canopyContact} from '../lineage/climbing.js';
import {sameDepth,submerged} from '../lineage/diving.js';
import {JUMP,springLegs,jumpKinematics,jumpAvailability,launchJump} from '../lineage/jumping.js';
import {physicalAttackProfile} from '../lineage/physical-attack.js';
import {preyPreference,canHunt} from '../ecology/functional-diet.js';
import {wildTraits} from '../organisms/wild-bodies.js';
import {partEffectFactors} from '../lineage/part-abilities.js';
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {bodyAbility,syncAnatomy} from '../lineage/evolution.js';

// Direct-control combat actions for the active creature.
// Attack is a dedicated action with a short wind-up and recovery, so it is a commitment
// instead of the first entry in the E priority list. Brace is a held stance that trades
// movement and breath for frontal protection. Strike damage itself stays on
// Simulation.playerStrike()/tryKill(), so adaptations and Stalker openings keep one authority.

// Same facing table as Simulation (dir 0 is up, clockwise).
const FACING=[[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071],[-1,0],[-.7071,-.7071]];

export class PlayerCombatController{
  constructor(sim){
    this.sim=sim;this.clock=0;this.pending=null;
    // Reused scratch objects (non-enumerable so saves skip them and restore keeps them).
    Object.defineProperty(this,'_mods',{value:{scale:1,sprint:false,moving:false},enumerable:false});
    Object.defineProperty(this,'_status',{value:{bracing:false,attackPhase:null,attackProgress:0,slow:false,braceLocked:false},enumerable:false});
  }

  isStill(a,seconds=.5){return !!(a&&Number.isFinite(a.stillSince)&&this.clock-a.stillSince>=seconds)}
  attackActive(a){return !!(a?.attackAction&&a.attackAction.until>this.clock)}
  attackWindingUp(a){return !!(a?.attackAction?.phase==='windup'&&a.attackAction.until>this.clock)}

  // Pure: what the current stance allows this step. Reuses one object (no hot-path allocation).
  movementModifiers(a,input){
    const m=this._mods;m.scale=1;m.sprint=false;m.moving=false;if(!a)return m;
    const moving=!!input&&(!!input.up!==!!input.down||!!input.left!==!!input.right);m.moving=moving;
    if(a.bracing)m.scale*=CFG.brace.move;
    const act=a.attackAction;if(act&&act.until>this.clock)m.scale*=act.pounce&&act.phase!=='recover'?0:act.phase==='windup'?CFG.attack.windupMove:CFG.attack.recoverMove;
    m.sprint=!!input?.sprint&&moving&&!a.bracing&&!(act?.phase==='windup'&&act.until>this.clock)&&this.sim.exertion.canSprint(a);
    return m;
  }

  // One control step for the active creature: brace stance, attack timing, breath.
  step(a,input,dt){
    if(!(dt>0))return this.movementModifiers(a,input);
    this.clock+=dt;if(!a)return this.movementModifiers(null,input);
    this.sim.exertion.ensure(a);
    const wantBrace=!!input?.brace&&!a.airborne&&!a.perched&&!submerged(a);
    if(!wantBrace){if(a.bracing)a.bracing=false}
    else if(!a.bracing&&!this.attackWindingUp(a)&&!((a.braceLockUntil||0)>this.clock)&&this.sim.exertion.canStartBrace(a)){a.bracing=true;a.braceStartedAt=this.clock}
    const act=a.attackAction;
    if(act?.phase==='leap')this.leapStep(a,act);
    if(act&&this.clock>=act.until&&!(act.sharedJump&&a.aerialMode==='jump')){if(act.pounce&&act.phase==='windup')this.beginLeap(a,act);else if(act.phase==='leap')this.resolvePounce(a,act);else if(act.phase==='windup')this.resolveAttack(a,act);else a.attackAction=null}
    const mods=this.movementModifiers(a,input);
    this.sim.exertion.step(a,dt,{moving:mods.moving,sprinting:mods.sprint,bracing:!!a.bracing});
    if(a.bracing&&a.exertionWinded){a.bracing=false;a.braceLockUntil=this.clock+CFG.brace.brokenLock;this.queue({ok:false,type:'brace',message:'Guard broken. Catch your breath before bracing again.'})}
    if(mods.sprint&&!partEffectFactors(a)?.quiet)a.noisyUntilTick=this.sim.tickCount+2;
    // Stillness matters for cover: a creature that stops in dense plants is harder to find.
    if(mods.moving)a.stillSince=null;else if(!Number.isFinite(a.stillSince))a.stillSince=this.clock;
    return mods;
  }

  braceAvailability(){
    const a=this.sim.player();
    if(!a?.alive)return{enabled:false,reason:'No active creature.'};
    if(this.sim.paused)return{enabled:false,reason:'Resume the world first.'};
    if(a.airborne||a.perched||submerged(a))return{enabled:false,reason:'Land or surface before bracing.'};
    if(this.attackWindingUp(a))return{enabled:false,reason:'Finish the attack windup first.'};
    if((a.braceLockUntil||0)>this.clock)return{enabled:false,reason:'Guard is recovering.'};
    if(a.exertionWinded||(!a.bracing&&(a.exertion??CFG.exertion.max)<CFG.exertion.braceStartMin))return{enabled:false,reason:'Need more breath to brace.'};
    return{enabled:true,reason:''};
  }
  releaseBrace(actor){if(actor)actor.bracing=false}
  attackTargetStatus(a,id){
    const target=this.sim.animals.find(o=>o.id===id&&o.alive&&o.id!==a.id);if(!target)return{enabled:false,state:'unavailable',reason:'The selected creature is no longer here.',target:null};
    if(!sameDepth(a,target)||!canopyContact(a,target)||a.airborne||a.perched)return{enabled:false,state:'unavailable',reason:'Surface attack cannot reach an aerial or canopy creature.',target:null};
    const hunter=canHunt(target);if(!hunter&&preyPreference(a,target)<=0)return{enabled:false,state:'unavailable',reason:'Your feeding anatomy cannot hunt this creature.',target:null};
    const reach=hunter?CFG.attack.stalkerReach:CFG.attack.preyReach;
    if(!(Math.hypot(target.x-a.x,target.y-a.y)<reach))return{enabled:false,state:'approachable',reason:'Selected creature is out of reach. Approach it first.',target:null};
    return{enabled:true,state:'available',reason:'',target};
  }
  targetForAttack(a,id){return this.attackTargetStatus(a,id).target}
  // Canonical availability for mouse controls. Read-only; execution still uses
  // the existing windup/recovery controller and hotkey pounce fallback is retained.
  attackAvailability({pounce=false,targetId=null}={}){
    const a=this.sim.player();
    if(!a?.alive)return{enabled:false,reason:'No active creature.'};
    if(this.sim.paused)return{enabled:false,reason:'Resume the world first.'};
    if(a.airborne||a.perched)return{enabled:false,reason:'Land on the surface before using a ground attack.'};
    if(this.attackActive(a))return{enabled:false,reason:'Finish the current attack and recovery.'};
    if(!pounce&&a.bodyPlan?.nodes?.length&&!physicalAttackProfile(a).mode)return{enabled:false,state:'unavailable',reason:'A biting or striking part is required for this attack.'};
    if(targetId!==null&&!pounce){const status=this.attackTargetStatus(a,targetId);if(!status.enabled)return{enabled:status.enabled,state:status.state,reason:status.reason}}
    if(pounce){
      if(this.sim.jumpingRules===JUMP.policy){const jump=jumpAvailability(this.sim,a,{pounce:true});if(!jump.enabled)return jump}
      if(!(this.pounceReach(a)>0))return{enabled:false,reason:'Need developed spring tendons.'};
      if(a.exertionWinded||(a.exertion??CFG.exertion.max)<CFG.pounce.cost)return{enabled:false,reason:'Not enough breath to pounce.'};
      if(!this.pounceTarget(a,undefined,targetId))return{enabled:false,reason:'No reachable target ahead.'};
    }
    return{enabled:true,reason:''};
  }
  startAttack({pounce=false,targetId=null}={}){
    const a=this.sim.player();if(!a)return{ok:false,type:'attack',message:'No active animal.'};
    if(targetId!==null){const valid=this.attackAvailability({pounce,targetId});if(!valid.enabled)return{ok:false,type:pounce?'pounce':'attack',message:valid.reason}}
    else {if(pounce&&!this.attackAvailability({pounce:true}).enabled)pounce=false;const valid=this.attackAvailability({pounce});if(!valid.enabled)return{ok:false,type:pounce?'pounce':'attack',message:valid.reason}}
    if(this.attackActive(a))return{ok:false,type:'attack',quiet:true,message:'Still recovering from the last attack.'};
    if(pounce){const started=this.startPounce(a,targetId);if(started)return started;if(targetId!==null)return{ok:false,type:'pounce',message:'Pounce is no longer available.'}}
    const E=CFG.exertion,A=CFG.attack;this.sim.exertion.ensure(a);
    const slow=a.exertionWinded||a.exertion<E.attackCost;this.sim.exertion.spend(a,E.attackCost);
    a.bracing=false;if(a.hidden)a.hidden=false;a.noisyUntilTick=this.sim.tickCount+3;
    a.attackAction={phase:'windup',...(targetId!==null?{targetId}:{}),startedAt:this.clock,until:this.clock+(slow?A.slowWindup:A.windup)*(partEffectFactors(a)?.strikeWindup??1),slow};
    return{ok:true,type:'attack-start',quiet:!slow,slow,message:slow?'Winded attack. The wind-up is slower.':''};
  }

  resolveAttack(a,act){
    const A=CFG.attack,scale=act.slow?A.slowDamage:1;let result;
    const selected=act.targetId!==undefined?this.targetForAttack(a,act.targetId):null;
    const stalker=act.targetId!==undefined?(selected&&canHunt(selected)?selected:null):this.sim.nearestPlayerCombatTarget(a,A.stalkerReach);
    if(stalker){result=this.sim.playerStrike(stalker,{damageScale:scale});this.sim.lastPlayerAction={type:'fight',species:stalker.species,tick:this.sim.tickCount}}
    else{
      const prey=act.targetId!==undefined?(selected&&!canHunt(selected)?selected:null):this.nearestPrey(a,A.preyReach);
      if(prey){const label=SPECIES[prey.species].label,hit=this.sim.tryKill(a,prey);this.sim.lastPlayerAction={type:'hunt',species:prey.species,tick:this.sim.tickCount};result={ok:hit,type:'hunt',species:prey.species,message:hit?`Bit ${label}.`:`Missed ${label}.`}}
      else result={ok:false,type:'attack',quiet:true,message:'Your attack hit nothing.'};
    }
    a.attackAction={phase:'recover',...(act.targetId!==undefined?{targetId:act.targetId}:{}),startedAt:this.clock,until:this.clock+A.recovery,slow:!!act.slow,outcome:result?.ok?'hit':'miss'};
    this.queue(result);return result;
  }

  // v1.33.1 Pounce. A body with highly developed rear-leg tendons can spring at a creature in
  // front of it: a still crouch, a leap that closes the gap, the normal bite on landing, and a
  // longer recovery (longer still after a miss). It costs breath like any attack. Without the
  // body for it, or without the breath, Shift+Space is the ordinary bite.
  pounceReach(a){if(this.sim.jumpingRules===JUMP.policy)return springLegs(a)>=2?jumpKinematics(a).range:0;const v=bodyAbility(a,'pounce');if(!v)return 0;const P=CFG.pounce;return P.reach[0]+(v-.8)/.2*(P.reach[1]-P.reach[0])}
  pounceTarget(a,reach=this.pounceReach(a),targetId=null){
    if(!a||!(reach>0))return null;const P=CFG.pounce,f=FACING[a.dir&7]||FACING[0],s=SPECIES[a.species];let best=null,bestD=reach;
    for(const o of this.sim.animals){
      if(!o.alive||o.id===a.id||(targetId!==null&&o.id!==targetId))continue;const hunter=canHunt(o);if(!hunter&&preyPreference(a,o)<=0)continue;
      const dx=o.x-a.x,dy=o.y-a.y,d=Math.hypot(dx,dy);if(d<P.minRange||d>bestD)continue;if((f[0]*dx+f[1]*dy)/d<P.frontDot)continue;best=o;bestD=d;
    }
    return best;
  }
  startPounce(a,targetId=null){
    syncAnatomy(a);const P=CFG.pounce,E=CFG.exertion;this.sim.exertion.ensure(a);
    if(a.exertionWinded||a.exertion<P.cost)return null;const target=this.pounceTarget(a,undefined,targetId);if(!target)return null;
    this.sim.exertion.spend(a,P.cost);a.bracing=false;if(a.hidden)a.hidden=false;a.noisyUntilTick=this.sim.tickCount+4;
    a.attackAction={phase:'windup',pounce:true,targetId:target.id,startedAt:this.clock,until:this.clock+P.windup,slow:false};
    return{ok:true,type:'pounce-start',quiet:true,message:''};
  }
  beginLeap(a,act){
    const P=CFG.pounce,target=this.sim.animals.find(o=>o.id===act.targetId&&o.alive);
    if(!target){a.attackAction={phase:'recover',...(act.targetId!==undefined?{targetId:act.targetId}:{}),startedAt:this.clock,until:this.clock+P.missRecovery,slow:false,outcome:'miss',pounce:true};this.queue({ok:false,type:'pounce',message:'Your pounce lost its target.'});return}
    const dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy)||1,travel=Math.max(0,Math.min(this.pounceReach(a)||P.reach[0],d-P.landGap));
    a.dir=dirFor(dx,dy);
    if(this.sim.jumpingRules===JUMP.policy){
      const launched=launchJump(this.sim,a,{dx,dy,range:travel,pounce:true});
      if(!launched.ok){a.attackAction={phase:'recover',pounce:true,startedAt:this.clock,until:this.clock+P.missRecovery,slow:false,outcome:'miss'};this.queue(launched);return}
      a.attackAction={phase:'leap',pounce:true,sharedJump:true,targetId:target.id,startedAt:this.clock,until:this.clock+.001,slow:false};this.queue(launched);return;
    }
    a.attackAction={phase:'leap',pounce:true,targetId:target.id,startedAt:this.clock,until:this.clock+P.leap,from:{x:a.x,y:a.y},to:{x:a.x+dx/d*travel,y:a.y+dy/d*travel},slow:false};
  }
  leapStep(a,act){
    if(act.sharedJump)return;
    const t=Math.max(0,Math.min(1,(this.clock-act.startedAt)/Math.max(.001,act.until-act.startedAt))),x=act.from.x+(act.to.x-act.from.x)*t,y=act.from.y+(act.to.y-act.from.y)*t;
    if(this.sim.canOccupy(a,x,y)){a.x=x;a.y=y}else act.until=this.clock; // blocked by water or rock: land here
  }
  resolvePounce(a,act){
    const P=CFG.pounce,A=CFG.attack;let result;
    const selected=act.targetId!==undefined?this.targetForAttack(a,act.targetId):null;
    const stalker=act.targetId!==undefined?(selected&&canHunt(selected)?selected:null):this.sim.nearestPlayerCombatTarget(a,A.stalkerReach);
    if(stalker){result=this.sim.playerStrike(stalker,{damageScale:P.stalkerDamage});result={...result,type:'pounce',message:result.ok?`Pounced on the ${SPECIES[stalker.species].label}. ${result.message||''}`.trim():result.message};this.sim.lastPlayerAction={type:'fight',species:stalker.species,tick:this.sim.tickCount}}
    else{
      const prey=act.targetId!==undefined?(selected&&!canHunt(selected)?selected:null):this.nearestPrey(a,A.preyReach);
      if(prey){const label=SPECIES[prey.species].label,hit=this.sim.tryKill(a,prey,{chanceBonus:P.preyBonus});this.sim.lastPlayerAction={type:'hunt',species:prey.species,tick:this.sim.tickCount};result={ok:hit,type:'pounce',species:prey.species,message:hit?`Pounced on a ${label}.`:`Pounce missed the ${label}.`}}
      else result={ok:false,type:'pounce',message:'Your pounce landed short.'};
    }
    a.attackAction={phase:'recover',...(act.targetId!==undefined?{targetId:act.targetId}:{}),startedAt:this.clock,until:this.clock+(result.ok?P.recovery:P.missRecovery),slow:false,outcome:result.ok?'hit':'miss',pounce:true};
    this.queue(result);return result;
  }
  nearestPrey(a,radius){
    const s=SPECIES[a.species];let best=null,bestD=radius;
    for(const other of this.sim.animals){if(!other.alive||other.id===a.id||preyPreference(a,other)<=0||canHunt(other))continue;const d=Math.hypot(other.x-a.x,other.y-a.y);if(d<bestD){bestD=d;best=other}}
    return best;
  }

  // How a held brace changes an incoming hit from `attacker`. Null when not bracing.
  // Wave 1: sturdy legs brace harder, runner legs softer.
  braceResponse(player,attacker){const r=this.braceKind(player,attacker),b=partEffectFactors(player)?.brace??1;return r&&b!==1?{...r,damage:Math.min(1,r.damage*b)}:r}
  braceKind(player,attacker){
    if(!player?.bracing||!attacker)return null;const B=CFG.brace,f=FACING[player.dir&7]||FACING[0];
    const vx=attacker.x-player.x,vy=attacker.y-player.y,len=Math.hypot(vx,vy)||1,dot=(f[0]*vx+f[1]*vy)/len;
    if(dot>=B.frontalDot)return{kind:'frontal',damage:B.frontalDamage,knockback:B.frontalKnockback,dot};
    if(dot>=B.sideDot)return{kind:'side',damage:B.sideDamage,knockback:B.sideKnockback,dot};
    // Phase D: a wide-field eye sees an attack from behind coming, so it is met like a side attack.
    if(partEffectFactors(player)?.wideField)return{kind:'side',damage:B.sideDamage,knockback:B.sideKnockback,dot,wideField:true};
    return{kind:'rear',damage:B.rearDamage,knockback:B.rearKnockback,dot};
  }

  // Called by tryKill() after a Stalker hit lands on the active creature.
  onPlayerHit(player,attacker,{damage=0,rawDamage=damage,brace=null}={}){
    if(!player?.alive||!attacker)return;
    const B=CFG.brace,frontal=brace?.kind==='frontal';
    if(frontal)this.sim.exertion.spend(player,Math.max(0,rawDamage-damage)*CFG.exertion.blockCostPerDamage);
    this.knockback(player,attacker,B.knockback*(brace?brace.knockback:1)*wildTraits(attacker).impact);
    if(!frontal&&this.attackWindingUp(player)){player.attackAction={phase:'recover',startedAt:this.clock,until:this.clock+CFG.attack.recovery,slow:false,outcome:'interrupted'};this.queue({ok:false,type:'attack',message:'The hit knocked your attack aside.'})}
    this.sim.lastPlayerBrace=brace?{tick:this.sim.tickCount,kind:brace.kind,absorbed:Math.max(0,rawDamage-damage),attackerId:attacker.id}:null;
  }

  knockback(player,attacker,distance){
    if(!(distance>.01))return 0;
    const h=attacker.playerHunt;let dx=Number.isFinite(h?.aimDirX)?h.aimDirX:player.x-attacker.x,dy=Number.isFinite(h?.aimDirY)?h.aimDirY:player.y-attacker.y;const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
    let moved=0;const step=distance/4;
    for(let i=0;i<4;i++){const nx=player.x+dx*step,ny=player.y+dy*step;if(!this.sim.canOccupy(player,nx,ny))break;player.x=nx;player.y=ny;moved+=step}
    return moved;
  }

  queue(result){
    if(!result)return;
    this.pending={ok:!!result.ok,type:result.type,message:result.message||'',quiet:!!result.quiet,damage:result.damage||0,killed:!!result.killed,repelled:!!result.repelled,opening:!!result.opening,species:result.species||null,...(['jump-land','glide-land'].includes(result.type)?{water:!!result.water}:{}),drivenOff:!!result.drivenOff};
  }
  consumeResult(){const r=this.pending;this.pending=null;return r}

  status(a=this.sim.player()){
    const s=this._status;s.bracing=!!a?.bracing;s.attackPhase=null;s.attackProgress=0;s.slow=false;s.braceLocked=!!(a&&(a.braceLockUntil||0)>this.clock);
    const act=a?.attackAction;if(act&&act.until>this.clock){s.attackPhase=act.phase;s.slow=!!act.slow;s.attackProgress=Math.max(0,Math.min(1,(this.clock-act.startedAt)/Math.max(.001,act.until-act.startedAt)))}
    return s;
  }
  // Hint text for the action prompt when a pounce is possible right now.
  pounceHint(a=this.sim.player()){if(!a||this.attackActive(a)||a.exertionWinded||(a.exertion??100)<CFG.pounce.cost)return'';const t=this.pounceTarget(a);return t?`Shift+Space · Pounce ${SPECIES[t.species].label}`:''}
  clearFor(a){if(!a)return;a.bracing=false;a.attackAction=null}
}

function dirFor(dx,dy){let best=0,bestDot=-Infinity;for(let i=0;i<8;i++){const d=FACING[i][0]*dx+FACING[i][1]*dy;if(d>bestDot){bestDot=d;best=i}}return best}
