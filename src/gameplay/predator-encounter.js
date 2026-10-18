import {canHunt,preyPreference} from '../ecology/functional-diet.js';
import {bodyMass} from '../organisms/body-mass.js';
import {wildTraits} from '../organisms/wild-bodies.js';
import {partEffectFactors,WAVE1} from '../lineage/part-abilities.js';
import {CFG} from '../sim/config.js';
import {SPECIES,canPreyOn} from '../organisms/species.js';
import {stalkerProfileFor} from '../organisms/stalker-profile.js';
import {hasAdaptation} from '../lineage/evolution.js';
import {PREDATION_PARITY} from './predation-parity.js';
import {REFUGE_PARITY,refugeAgainst,coverHides} from '../ecology/refuges.js';

// Player-facing predator encounter authority.
// Background predator/prey ecology remains on the canonical hunt/tryKill() path.
// The controlled lineage gets readable stalk -> windup -> committed charge -> recovery
// phases so player movement, timing and evolved defenses can matter without rebalancing
// the autonomous ecosystem.

export {stalkerProfileFor};

// v1.28: player-facing pursuit. Engaged Stalkers decide every tick and move every
// control step at their real speed (2.8 sits between GenVo8 walk and sprint). They spend
// pursuit stamina while chasing, charging and taking wounds, and give up when tired or
// when line of sight breaks for long enough.
const ENCOUNTER_INTENTS=new Set(['stalk-player','chase-player','search-player','hunt-windup','charge-player','hunt-recover']);
const MOVING_INTENTS=new Set(['stalk-player','chase-player','search-player','hunt-windup','charge-player']);

export class PredatorEncounterController{
  constructor(sim){
    this.sim=sim;
    // Runtime-only scratch (non-enumerable): never saved, never removed by save restore.
    const runtime={engaged:[],_engagedNext:[],_scanPlayerId:null,_rescan:true};
    for(const [key,value] of Object.entries(runtime))Object.defineProperty(this,key,{value,writable:true,enumerable:false,configurable:true});
    Object.defineProperty(this,'_collect',{value:b=>{if(b.alive&&b.playerHunt&&b.playerHunt.targetId===this._scanPlayerId&&canHunt(b))this._engagedNext.push(b)},enumerable:false});
  }

  // Line of sight for an engaged or committing Stalker. Dense plants hide a creature that
  // is not sprinting or attacking once the hunter is a few tiles away; light cover only
  // works at longer range. Camouflage keeps its stronger, closer-range concealment.
  canSee(hunter,player,distance=Math.hypot(hunter.x-player.x,hunter.y-player.y)){
    if(!hunter||!player)return false;
    if(this.sim.camouflageConceals(player,hunter,distance))return false;
    const P=CFG.stalkerPursuit,senses=(hunter.genes?.senses||1)*wildTraits(hunter).sight;
    const pf=partEffectFactors(player);if(distance>P.sight*senses*(pf?.quiet?WAVE1.quietSight:1)*(pf?.visibility??1))return false;
    // Phase 3I refuges: the same cover rule that hides any prey from any hunter (size-scaled, noise-aware).
    if(REFUGE_PARITY.enabled)return !coverHides(this.sim,player,hunter,distance,{tracking:hunter.playerHunt?.targetId===player.id});
    if((player.noisyUntilTick||0)>=this.sim.tickCount)return true;
    const cover=this.sim.coverAt(player);
    if(cover>=P.coverHide&&distance>(this.sim.playerCombat?.isStill?.(player)?P.stillCoverRange:P.coverHideRange)*senses)return false;
    if(cover>=P.lightCoverHide&&distance>P.lightCoverRange*senses)return false;
    return true;
  }

  pursuitDelta(state){
    const tick=this.sim.tickCount,last=Number.isFinite(state.pursuitTick)?state.pursuitTick:tick;state.pursuitTick=tick;
    return Math.max(0,Math.min(1,(tick-last)/CFG.simHz));
  }

  giveUp(hunter,player,outcome,seconds){
    this.noteOutcome(hunter,player,outcome);
    // reason/wounds are presentation evidence for the retreat; aversion timing stays the authority.
    hunter.playerAversion={targetId:player.id,untilTick:this.sim.tickCount+Math.round(CFG.simHz*seconds),reason:outcome,wounds:hunter.playerHunt?.wounds||0};
    this.clear(hunter);
    const den=this.sim.stalkerTerritory?.retreatTarget?.(hunter,player);if(den)return{intent:'return-den',target:den};
    const dx=hunter.x-player.x,dy=hunter.y-player.y,len=Math.hypot(dx,dy)||1;
    return{intent:'escape',target:{x:hunter.x+dx/len*7,y:hunter.y+dy/len*7}};
  }

  decision(hunter,player){
    if(!this.validPair(hunter,player)){this.clear(hunter);return null}
    if(hunter.playerHunt&&(REFUGE_PARITY.enabled?refugeAgainst(this.sim,player,hunter):this.sim.discovery?.refugeFor?.(player)))return this.giveUp(hunter,player,'lost',CFG.stalkerPursuit.outrunAversion||4);
    const profile=stalkerProfileFor(hunter),distance=Math.hypot(hunter.x-player.x,hunter.y-player.y),concealed=this.sim.camouflageConceals(player,hunter,distance);
    let state=hunter.playerHunt?.targetId===player.id?hunter.playerHunt:null;
    if(concealed&&state?.phase!=='charge'){this.clear(hunter);return null}
    if(concealed&&!state)return null;
    if(!state){this.beginStalk(hunter,player,distance);state=hunter.playerHunt}
    state.style=profile.id;
    const P=CFG.stalkerPursuit,dt=this.pursuitDelta(state);if(!Number.isFinite(state.stamina))state.stamina=P.stamina*wildTraits(hunter).stamina;
    const senses=hunter.genes?.senses||1,maxRange=10.5*senses;
    if(distance>maxRange){if(state.pursuit==='chase')return this.giveUp(hunter,player,'outrun',P.outrunAversion);this.clear(hunter);return null}

    if(state.phase==='recover'){
      // A missed/blocked charge now creates a real decision: punish the opening or make
      // enough distance to break the engagement before the hunter resets.
      const breakawayRange=this.breakawayRange(profile,player);
      // Distance only counts if the player actually made it: a long overrun alone is not an escape.
      if(distance>=breakawayRange&&distance>=(state.recoverStartDistance||0)+1.2){
        this.noteOutcome(hunter,player,'escaped');
        hunter.playerAversion={targetId:player.id,untilTick:this.sim.tickCount+Math.round(CFG.simHz*profile.breakawayAversion),reason:'escaped',wounds:state.wounds||0};
        this.clear(hunter);
        const dx=hunter.x-player.x,dy=hunter.y-player.y,len=Math.hypot(dx,dy)||1;
        return{intent:'escape',target:{x:hunter.x+dx/len*5,y:hunter.y+dy/len*5}};
      }
      if(this.sim.tickCount<state.untilTick)return{intent:'hunt-recover',target:null};
      if(state.stamina<=0)return this.giveUp(hunter,player,'outrun',P.outrunAversion);
      return this.beginStalk(hunter,player,distance,state);
    }

    if(state.phase==='windup'){
      if(concealed){this.beginRecover(hunter,'lost-cover');return{intent:'hunt-recover',target:null}}
      if(distance>profile.triggerRange+2.4){state.phase='stalk';state.startedTick=this.sim.tickCount;state.untilTick=this.sim.tickCount+Math.round(CFG.simHz*profile.nearDelay);this.clearAim(state);return{intent:'stalk-player',target:this.stalkTarget(hunter,player,profile)}}
      if(this.sim.tickCount<state.untilTick)return{intent:'hunt-windup',target:null};
      // Charge direction is committed at the end of the tell instead of homing on the
      // player's live position. A lateral step/sprint can therefore produce a real miss.
      if(!Number.isFinite(state.aimX)||!Number.isFinite(state.aimY))this.lockChargeAim(hunter,player,state,profile);
      state.phase='charge';state.startedTick=this.sim.tickCount;state.untilTick=this.sim.tickCount+Math.round(CFG.simHz*profile.chargeDuration*P.chargeTimeScale);state.stamina-=P.chargeCost;state.laneLength=Math.max(Math.hypot(state.aimX-hunter.x,state.aimY-hunter.y),distance+profile.chargeLead)+Math.min(P.chargeOvershoot,.5*distance+.3);state.laneTravel=0;this.noteTell(hunter,player,'charge');
      return{intent:'charge-player',target:this.chargeTarget(state,player)};
    }

    if(state.phase==='charge'){
      if(this.sim.tickCount>=state.untilTick){this.noteOutcome(hunter,player,'evaded');this.beginRecover(hunter,'evaded');return{intent:'hunt-recover',target:null}}
      return{intent:'charge-player',target:this.chargeTarget(state,player)};
    }

    // Pursuit layer: lose sight -> search the last seen point, far -> chase at full speed,
    // close -> the existing stalk/tell/charge language.
    if(!this.canSee(hunter,player,distance)){
      if(!Number.isFinite(state.lastSeenX)){state.lastSeenX=player.x;state.lastSeenY=player.y}
      if(!Number.isFinite(state.lostSinceTick)){state.lostSinceTick=this.sim.tickCount;this.noteTell(hunter,player,'lost')}
      state.pursuit='search';state.stamina-=P.chaseDrain*.5*dt;
      const searched=(this.sim.tickCount-state.lostSinceTick)/CFG.simHz,reached=Math.hypot(hunter.x-state.lastSeenX,hunter.y-state.lastSeenY)<.9;
      if(searched>=P.searchSeconds||(reached&&searched>=P.searchSeconds*.5)||state.stamina<=0)return this.giveUp(hunter,player,'lost',P.lostAversion);
      return{intent:'search-player',target:{x:state.lastSeenX,y:state.lastSeenY}};
    }
    state.lostSinceTick=null;state.lastSeenX=player.x;state.lastSeenY=player.y;
    const chaseFrom=state.pursuit==='chase'?profile.triggerRange-.4:profile.triggerRange;
    if(distance>chaseFrom){
      state.pursuit='chase';state.stamina-=P.chaseDrain*dt;
      if(state.stamina<=0)return this.giveUp(hunter,player,'outrun',P.outrunAversion);
      return{intent:'chase-player',target:player};
    }
    state.pursuit='close';state.stamina=Math.min(P.stamina,state.stamina+P.closeRecover*dt);

    // The same readable phase language is shared by all Stalkers, but inherited
    // temperament changes how they use it: ambushers flank and wait until closer,
    // rushers commit earlier/faster, and wary hunters give longer tells.
    if(distance<=profile.triggerRange&&this.sim.tickCount>=state.untilTick){
      // Multi-Stalker pressure is coordinated rather than simultaneous. Only one hunter
      // may commit a wind-up/charge lane at a time; the others keep moving and press the
      // player's flanks until the active attack resolves. This preserves danger without
      // creating unavoidable stacked hitboxes or synchronized charges.
      if(this.canCommit(hunter,player)){
        state.phase='windup';state.role='active';state.startedTick=this.sim.tickCount;state.untilTick=this.sim.tickCount+Math.round(CFG.simHz*profile.windup);
        this.lockChargeAim(hunter,player,state,profile);this.noteTell(hunter,player,'windup');
        return{intent:'hunt-windup',target:null};
      }
      state.role='pressure';state.untilTick=this.sim.tickCount+Math.max(1,Math.round(CFG.simHz*.28));
      return{intent:'stalk-player',target:this.pressureTarget(hunter,player,profile)};
    }
    state.role=this.activeCommitter(player,hunter)?'pressure':'stalk';
    return{intent:'stalk-player',target:state.role==='pressure'?this.pressureTarget(hunter,player,profile):this.stalkTarget(hunter,player,profile)};
  }

  beginStalk(hunter,player,distance=Math.hypot(hunter.x-player.x,hunter.y-player.y),carry=null){
    const profile=stalkerProfileFor(hunter),delay=distance<profile.triggerRange+1?profile.nearDelay:profile.farDelay;
    const state={targetId:player.id,phase:'stalk',style:profile.id,role:'stalk',startedTick:this.sim.tickCount,untilTick:this.sim.tickCount+Math.round(CFG.simHz*delay),lastOutcome:null,aimX:null,aimY:null,...this.carryPursuit(carry)};
    hunter.playerHunt=state;this.markEngaged();this.noteTell(hunter,player,'stalk');return{intent:'stalk-player',target:this.stalkTarget(hunter,player,profile)};
  }

  stalkTarget(hunter,player,profile=stalkerProfileFor(hunter)){
    if(profile.id!=='ambusher'||!profile.flank)return player;
    const dx=player.x-hunter.x,dy=player.y-hunter.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,side=(hunter.id&1)?1:-1;
    const x=player.x-ux*.75-uy*profile.flank*side,y=player.y-uy*.75+ux*profile.flank*side;
    const w=this.sim.world;
    if(x>1&&y>1&&x<CFG.worldSize-2&&y<CFG.worldSize-2&&!w.water[w.idx(x,y)]&&w.sameLand(hunter.x,hunter.y,x,y))return{x,y};
    return player;
  }


  activeCommitter(player,ignore=null){
    if(!player)return null;
    let best=null;
    for(const other of this.sim.animals){
      if(!other?.alive||other===ignore||other.playerHunt?.targetId!==player.id)continue;
      if(!['windup','charge'].includes(other.playerHunt.phase))continue;
      if(!best||other.playerHunt.phase==='charge'&&best.playerHunt.phase!=='charge'||other.id<best.id)best=other;
    }
    return best;
  }

  breathingRoomActive(){
    const recent=this.sim.lastPlayerPredatorOutcome;if(!recent)return false;
    const age=this.sim.tickCount-recent.tick;
    const seconds=recent.outcome==='hit'?.72:.42;
    return age>=0&&age<Math.max(1,Math.round(CFG.simHz*seconds));
  }

  canCommit(hunter,player){
    if(this.activeCommitter(player,hunter))return false;
    if(this.breathingRoomActive())return false;
    return true;
  }

  pressureTarget(hunter,player,profile=stalkerProfileFor(hunter)){
    // Deterministic flanking points keep secondary predators visible and mobile without
    // letting every Stalker occupy the same tile around the player.
    const slot=((hunter.id*5)%8),angle=slot*Math.PI/4,radius=Math.max(3.15,Math.min(5.2,profile.triggerRange*.92));
    let x=player.x+Math.cos(angle)*radius,y=player.y+Math.sin(angle)*radius,w=this.sim.world;
    for(let i=0;i<8;i++){
      if(x>1&&y>1&&x<CFG.worldSize-2&&y<CFG.worldSize-2&&!w.water[w.idx(x,y)]&&w.sameLand(hunter.x,hunter.y,x,y))return{x,y,pressure:true};
      const a=angle+(i+1)*Math.PI/4;x=player.x+Math.cos(a)*radius;y=player.y+Math.sin(a)*radius;
    }
    return this.stalkTarget(hunter,player,profile);
  }

  breakawayRange(profile,player){
    // Spring Tendons change the escape decision itself rather than only adding a number
    // to top speed: a mobile lineage needs slightly less separation to break pursuit.
    return Math.max(3.75,profile.breakawayRange-(hasAdaptation(player,'spring-tendons')?.65:0));
  }

  // Snapshot a straight charge lane. We extend slightly through the player's current
  // position, then shorten only if that projected point is invalid terrain.
  lockChargeAim(hunter,player,state=hunter?.playerHunt,profile=stalkerProfileFor(hunter)){
    if(!hunter||!player||!state)return null;
    const dx=player.x-hunter.x,dy=player.y-hunter.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    const lead=profile.chargeLead;let x=player.x+ux*lead,y=player.y+uy*lead,w=this.sim.world;
    for(let i=0;i<8;i++){
      if(x>1&&y>1&&x<CFG.worldSize-2&&y<CFG.worldSize-2&&!w.water[w.idx(x,y)]&&w.sameLand(hunter.x,hunter.y,x,y))break;
      x-=ux*(lead/8);y-=uy*(lead/8);
    }
    state.aimX=x;state.aimY=y;state.aimDirX=ux;state.aimDirY=uy;state.aimLockedTick=this.sim.tickCount;state.laneLength=Math.hypot(x-hunter.x,y-hunter.y)+Math.min(CFG.stalkerPursuit.chargeOvershoot,.5*len+.3);state.laneTravel=0;return{x,y};
  }
  clearAim(state){if(!state)return;state.aimX=null;state.aimY=null;state.aimDirX=null;state.aimDirY=null;state.aimLockedTick=null;state.laneLength=0;state.laneTravel=0}
  chargeTarget(state,player){return Number.isFinite(state?.aimX)&&Number.isFinite(state?.aimY)?{x:state.aimX,y:state.aimY,lockedCharge:true}:player}

  resolveCharge(hunter){
    const player=this.sim.player();if(!hunter?.alive||!player?.alive)return false;
    const state=hunter.playerHunt;if(!state||state.targetId!==player.id||state.phase!=='charge')return false;
    const distance=Math.hypot(hunter.x-player.x,hunter.y-player.y);
    if(this.sim.camouflageConceals(player,hunter,distance)){
      this.beginRecover(hunter,'evaded-cover');this.noteOutcome(hunter,player,'evaded');return false;
    }
    if(distance>.92)return false;
    // Real body contact at the end of a committed lane usually lands; the canonical
    // predation roll still decides it, so shelter and adaptations keep their say.
    // Predation parity (Phase 3I): contact resolves exactly like a wild hunter's bite, with no extra bonus.
    const hit=this.sim.tryKill(hunter,player,{chanceBonus:PREDATION_PARITY.enabled?0:CFG.stalkerPursuit.contactBonus});
    this.noteOutcome(hunter,player,hit?'hit':'dodged');
    // Bitter slime already writes a real aversion in tryKill(); preserve that authority by
    // ending the hunt immediately instead of overwriting it with a generic recovery state.
    if(hit&&hasAdaptation(player,'bitter-slime')&&hunter.playerAversion?.targetId===player.id){this.clear(hunter);hunter.intent='escape';hunter.target=null;return hit}
    const dmg=this.sim.lastPlayerDamage,braced=hit&&dmg?.tick===this.sim.tickCount&&dmg.attackerId===hunter.id&&dmg.brace==='frontal';
    this.beginRecover(hunter,braced?'braced':hit?'hit':'contact-miss');
    // A frontal brace stops the charge dead: the hunter staggers and loses pursuit stamina.
    if(braced&&hunter.playerHunt){hunter.playerHunt.untilTick+=Math.max(1,Math.round(CFG.simHz*CFG.brace.stagger));hunter.playerHunt.stamina-=CFG.stalkerPursuit.braceCost;this.noteOutcome(hunter,player,'braced')}
    // Hardened Mantle turns surviving contact into a visibly stronger rebound window.
    if(hit&&hasAdaptation(player,'hardened-mantle')&&hunter.playerHunt)hunter.playerHunt.untilTick+=Math.max(1,Math.round(CFG.simHz*.38));
    return hit;
  }

  // Used by Simulation.playerStrike() so the attack authority stays in one place while
  // encounter timing determines whether the player found a genuine opening.
  strikeWindow(hunter){
    const phase=hunter?.playerHunt?.phase;
    if(phase==='recover')return{phase,accuracyBonus:.18,damageMultiplier:1.24,energyMultiplier:.86,label:'Opening bite'};
    if(phase==='windup')return{phase,accuracyBonus:.08,damageMultiplier:1.08,energyMultiplier:.96,label:'Counterbite'};
    return{phase:phase||null,accuracyBonus:0,damageMultiplier:1,energyMultiplier:1,label:null};
  }

  onPlayerStrike(hunter,result){
    if(!hunter||!result)return;
    if(result.killed){this.clear(hunter);return}
    const player=this.sim.player(),profile=stalkerProfileFor(hunter),P=CFG.stalkerPursuit;
    if(result.repelled){this.beginRecover(hunter,'repelled');if(result.ok)this.noteWound(hunter);return}

    // Deliberately attacking a Stalker is an engagement even if the bite misses.
    if(!hunter.playerHunt&&player&&this.validPair(hunter,player)){this.markEngaged();
      hunter.playerHunt={targetId:player.id,phase:'windup',style:profile.id,startedTick:this.sim.tickCount,untilTick:this.sim.tickCount+Math.max(2,Math.round(CFG.simHz*profile.windup*.62)),lastOutcome:'provoked',aimX:null,aimY:null,...this.carryPursuit(null)};
      this.lockChargeAim(hunter,player,hunter.playerHunt,profile);hunter.intent='hunt-windup';hunter.target=null;this.noteTell(hunter,player,'windup');
    }
    if(!hunter.playerHunt)return;

    // Wounds wear the hunter down. Two clean wounds in one engagement drive it off.
    if(result.ok&&player){
      const st=this.noteWound(hunter);
      if(st&&(st.wounds>=P.woundsToBreak||st.stamina<=0)){
        const retreat=this.giveUp(hunter,player,'driven-off',P.drivenOffAversion);hunter.intent=retreat.intent;hunter.target=retreat.target;
        result.drivenOff=true;result.message=`${result.message} It breaks off.`;return;
      }
    }

    // Wary Stalkers can be driven out of the engagement by a clean wound.
    if(result.ok&&profile.id==='wary'&&player){
      hunter.playerAversion={targetId:player.id,untilTick:this.sim.tickCount+Math.round(CFG.simHz*2.65),reason:'driven-off',wounds:hunter.playerHunt.wounds||0};
      this.clear(hunter);hunter.intent='escape';hunter.target=null;return;
    }
    // A successful counter-hit during the tell interrupts commitment. Hitting during the
    // recovery opening keeps the hunter down slightly longer, buying a real retreat choice.
    if(result.ok&&hunter.playerHunt.phase==='windup'&&hunter.playerHunt.lastOutcome!=='provoked')this.beginRecover(hunter,'countered');
    else if(result.ok&&hunter.playerHunt.phase==='recover')hunter.playerHunt.untilTick=Math.max(hunter.playerHunt.untilTick,this.sim.tickCount+Math.round(CFG.simHz*.58));
  }

  playerStatus(player=this.sim.player()){
    if(!player?.alive)return null;let best=null;
    for(const hunter of this.sim.animals){
      if(!hunter.alive||hunter.playerHunt?.targetId!==player.id)continue;
      const phase=hunter.playerHunt.phase;if(!['stalk','windup','charge','recover'].includes(phase))continue;
      const distance=Math.hypot(hunter.x-player.x,hunter.y-player.y),priority=phase==='charge'?4:phase==='windup'?3:phase==='stalk'?2:1;
      if(!best||priority>best.priority||priority===best.priority&&distance<best.distance){
        const duration=Math.max(1,(hunter.playerHunt.untilTick||this.sim.tickCount)-hunter.playerHunt.startedTick),remaining=Math.max(0,(hunter.playerHunt.untilTick||this.sim.tickCount)-this.sim.tickCount);
        best={hunterId:hunter.id,species:hunter.species,phase,style:hunter.playerHunt.style||stalkerProfileFor(hunter).id,distance,priority,remainingTicks:remaining,progress:Math.max(0,Math.min(1,1-remaining/duration)),x:hunter.x,y:hunter.y,outcome:hunter.playerHunt.lastOutcome||null,aimX:hunter.playerHunt.aimX,aimY:hunter.playerHunt.aimY,counterWindow:phase==='recover'||phase==='windup',pursuit:hunter.playerHunt.pursuit||null,stamina:Math.max(0,Math.min(1,(Number.isFinite(hunter.playerHunt.stamina)?hunter.playerHunt.stamina:CFG.stalkerPursuit.stamina)/CFG.stalkerPursuit.stamina)),wounds:hunter.playerHunt.wounds||0};
      }
    }
    if(best){
      const threats=this.playerThreats(player);best.threatCount=threats.length;best.pressureCount=threats.filter(x=>x.phase==='stalk'&&x.role==='pressure').length;best.breakawayRange=this.breakawayRange(stalkerProfileFor(this.sim.animals.find(a=>a.id===best.hunterId)),player);
    }
    return best;
  }

  playerThreats(player=this.sim.player()){
    if(!player?.alive)return[];
    const out=[];
    for(const hunter of this.sim.animals){
      const h=hunter?.playerHunt;if(!hunter.alive||h?.targetId!==player.id||!['stalk','windup','charge','recover'].includes(h.phase))continue;
      out.push({hunterId:hunter.id,phase:h.phase,style:h.style||stalkerProfileFor(hunter).id,role:h.role||'stalk',distance:Math.hypot(hunter.x-player.x,hunter.y-player.y)});
    }
    return out.sort((a,b)=>a.distance-b.distance||a.hunterId-b.hunterId);
  }

  // Phase D: venom slows whatever it poisoned, on every movement path.
  speedMultiplier(animal){return (this.sim.partAbilities?.slowFactor?.(animal)??1)*this.intentSpeed(animal)}
  intentSpeed(animal){
    const profile=stalkerProfileFor(animal);
    if(animal?.intent==='stalk-player')return profile.stalkSpeed;
    if(animal?.intent==='chase-player')return CFG.stalkerPursuit.chaseSpeed*wildTraits(animal).chaseSpeed;
    if(animal?.intent==='search-player')return CFG.stalkerPursuit.searchSpeed;
    if(animal?.intent==='charge-player')return profile.chargeSpeed;
    if(animal?.intent==='hunt-windup'||animal?.intent==='hunt-recover')return 0;
    return 1;
  }

  validPair(hunter,player){
    return !!(hunter?.alive&&player?.alive&&canHunt(hunter)&&preyPreference(hunter,player)>0&&!this.sim.isOpeningProtected(player)&&this.sim.world.sameLand(hunter.x,hunter.y,player.x,player.y));
  }
  state(hunter,player){
    if(hunter.playerHunt?.targetId===player.id)return hunter.playerHunt;
    this.beginStalk(hunter,player);return hunter.playerHunt;
  }
  clear(hunter){if(hunter)hunter.playerHunt=null}
  carryPursuit(prev){const P=CFG.stalkerPursuit;return{stamina:Number.isFinite(prev?.stamina)?prev.stamina:P.stamina,wounds:prev?.wounds||0,pursuit:prev?.pursuit||null,pursuitTick:Number.isFinite(prev?.pursuitTick)?prev.pursuitTick:this.sim.tickCount,lastSeenX:prev?.lastSeenX??null,lastSeenY:prev?.lastSeenY??null,lostSinceTick:null}}
  distanceToTarget(hunter,targetId){const p=this.sim.player();return p&&p.id===targetId?Math.hypot(p.x-hunter.x,p.y-hunter.y):0}
  noteWound(hunter){const st=hunter?.playerHunt;if(!st)return null;const P=CFG.stalkerPursuit;st.wounds=(st.wounds||0)+1;st.stamina=(Number.isFinite(st.stamina)?st.stamina:P.stamina)-P.woundCost;return st}
  beginRecover(hunter,outcome){
    if(!hunter)return;const prev=hunter.playerHunt,targetId=prev?.targetId||this.sim.playerId,profile=stalkerProfileFor(hunter),aimX=prev?.aimX??null,aimY=prev?.aimY??null;
    hunter.playerHunt={targetId,phase:'recover',style:profile.id,role:'recover',startedTick:this.sim.tickCount,untilTick:this.sim.tickCount+Math.round(CFG.simHz*profile.recovery),lastOutcome:outcome||null,aimX,aimY,aimDirX:prev?.aimDirX??null,aimDirY:prev?.aimDirY??null,...this.carryPursuit(prev),recoverStartDistance:this.distanceToTarget(hunter,targetId)};hunter.intent='hunt-recover';hunter.target=null;
  }

  // Refresh the short list of Stalkers engaged with the active creature and let them decide
  // at tick rate. Uses the local spatial query, never a global scan.
  // New hunts only start in the ambient decision phase or when the player strikes, so the
  // local query runs only while something is engaged or a new hunt may have begun.
  markEngaged(){this._rescan=true}
  tickEngaged(){
    if(!this.engaged.length&&!this._rescan)return;this._rescan=false;
    const player=this.sim.player(),prev=this.engaged;
    for(let i=0;i<prev.length;i++)prev[i].pursuitEngaged=false;
    const next=this._engagedNext;next.length=0;
    // Real-time pursuit is for a manually controlled creature. Under AUTO the selected
    // creature moves on the ambient cadence, so its hunters do too.
    if(player&&this.sim.playerEnabled&&this.sim.isManualPlayer(player)){this._scanPlayerId=player.id;this.sim.forEachNearby(player,CFG.stalkerPursuit.engageRadius,this._collect);this._scanPlayerId=null}
    this._engagedNext=prev;prev.length=0;this.engaged=next;
    for(let i=0;i<next.length;i++){
      const h=next[i];h.pursuitEngaged=true;
      if(!ENCOUNTER_INTENTS.has(h.intent)||(h.playerAversion?.untilTick>this.sim.tickCount))continue;
      const d=this.decision(h,player);if(d){h.intent=d.intent;h.target=d.target}else{h.intent='explore';h.target=null}
    }
  }
  isEngagedMover(a){return !!(a?.pursuitEngaged&&ENCOUNTER_INTENTS.has(a.intent))}

  // Real-time movement for engaged Stalkers. Called every control step.
  moveEngaged(dt){
    const list=this.engaged;if(!list.length||!(dt>0))return;const player=this.sim.player(),P=CFG.stalkerPursuit;
    for(let i=0;i<list.length;i++){
      const h=list[i];if(!h.alive||!h.pursuitEngaged||!MOVING_INTENTS.has(h.intent))continue;
      const s=SPECIES[h.species],base=s.speed*(h.genes?.motion||1),st=h.playerHunt,laned=Number.isFinite(st?.aimDirX)&&Number.isFinite(st?.aimDirY);
      let dx=0,dy=0,step=0,sp=0;
      if(h.intent==='charge-player'&&laned){
        // A committed charge runs its locked straight lane at full charge speed. It does not
        // home and does not stop short at the marker, so walking straight away is not a dodge.
        sp=base*this.speedMultiplier(h);dx=st.aimDirX;dy=st.aimDirY;step=Math.min(Math.max(0,(st.laneLength||0)-(st.laneTravel||0)),sp*dt);
      }else if(h.intent==='hunt-windup'&&laned){
        // The tell creeps along the same lane, so stepping out of the line is what matters.
        sp=base*P.windupCreep;dx=st.aimDirX;dy=st.aimDirY;step=sp*dt;
        if(player&&Math.hypot(player.x-(h.x+dx*step),player.y-(h.y+dy*step))<1.05)step=0;
      }else{
        const t=h.target,mult=this.speedMultiplier(h);
        if(t&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&mult>0){
          dx=t.x-h.x;dy=t.y-h.y;const len=Math.hypot(dx,dy);
          if(len>.03){dx/=len;dy/=len;sp=base*mult;step=Math.min(len,sp*dt);
            // Outside a committed charge the hunter closes but does not stand on the player.
            if(t===player&&len-step<.95)step=Math.max(0,len-.95)}
        }
      }
      if(step>0){
        let nx=h.x+dx*step,ny=h.y+dy*step;
        if(!this.sim.canOccupy(h,nx,ny)){const steer=h.intent==='charge-player'?null:this.sim.steerAroundWater(h,dx,dy,sp,dt*CFG.simHz);if(steer){nx=steer.x;ny=steer.y;dx=steer.dx;dy=steer.dy}else{nx=h.x;ny=h.y;if(h.intent==='charge-player'&&st)st.laneTravel=st.laneLength}}
        const moved=Math.hypot(nx-h.x,ny-h.y);
        if(moved>0){h.x=nx;h.y=ny;h.energy-=.072*bodyMass(h)*moved/(h.genes?.metabolism||1);h.anim=((h.anim||0)+dt*8)%8;if(h.intent!=='hunt-windup')h.dir=dirIndex(dx,dy);if(h.intent==='charge-player'&&st)st.laneTravel=(st.laneTravel||0)+moved}
      }
      if(h.intent==='charge-player'&&!this.resolveCharge(h)&&h.playerHunt?.phase==='charge'&&player&&st.laneTravel>=st.laneLength-1e-6){
        // The lane is spent without contact: the overrun is the opening.
        this.noteOutcome(h,player,'evaded');this.beginRecover(h,'evaded');
      }
    }
  }
  noteTell(hunter,player,phase){this.sim.lastPlayerPredatorTell={tick:this.sim.tickCount,hunterId:hunter.id,targetId:player.id,phase,style:stalkerProfileFor(hunter).id,x:hunter.x,y:hunter.y,aimX:hunter.playerHunt?.aimX??null,aimY:hunter.playerHunt?.aimY??null}}
  noteOutcome(hunter,player,outcome){this.sim.habits?.noteDanger?.(player,outcome);this.sim.lastPlayerPredatorOutcome={tick:this.sim.tickCount,hunterId:hunter.id,targetId:player.id,outcome,style:stalkerProfileFor(hunter).id,x:hunter.x,y:hunter.y}}
}
function dirIndex(dx,dy){const a=Math.atan2(dy,dx),oct=Math.round(a/(Math.PI/4));return(oct+2+8)%8}
