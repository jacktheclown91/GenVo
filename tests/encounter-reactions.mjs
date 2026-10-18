import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {EncounterReactionPresentation,applyEncounterReaction,reactionAttention,braceSteadiness,REACTION_SECONDS,applyDefenseReaction,defenseShove,defenseOrgan} from '../src/render/encounter-reactions.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {syncAnatomy} from '../src/lineage/evolution.js';
import {canHunt,preyPreference} from '../src/ecology/functional-diet.js';
import {behaviorVisualState} from '../src/render/behavior.js';
import {visualLifeState} from '../src/render/life.js';

// Encounter reactions are read from what the combat authorities already resolved.
// Each case runs the real path (tryKill brace response, charge contact, player strike,
// drive-off) and then checks the body language, never a cosmetic stand-in.

function setup(seed){
  const sim=new Simulation(seed,{player:true});const p=sim.player(),h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
  assert.ok(p&&h);sim.endOpeningGrace('test');
  // Put the pair on open land next to each other.
  const w=sim.world;let spot=null;
  for(let y=12;y<CFG.worldSize-12&&!spot;y++)for(let x=12;x<CFG.worldSize-12&&!spot;x++){let ok=true;for(let oy=-3;oy<=3&&ok;oy++)for(let ox=-4;ox<=4;ox++)if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}if(ok)spot={x:x+.5,y:y+.5}}
  p.x=spot.x;p.y=spot.y;p.health=100;p.energy=200;h.x=p.x+.7;h.y=p.y;h.health=100;h.energy=120;sim.exertion.ensure(p);
  return{sim,p,h};
}
function withLegs(animal,partId){animal.bodyPlan={...animal.bodyPlan,nodes:animal.bodyPlan.nodes.map(n=>n.partId==='walking-leg'?{...n,partId}:n)};return animal}
function forced(sim,fn){const old=sim.rng.chance;sim.rng.chance=()=>true;try{return fn()}finally{sim.rng.chance=old}}
function poseFor(sim,a,reaction,action='idle'){const life=visualLifeState(sim,a,{action});const b=behaviorVisualState({bodyPlan:a.bodyPlan,id:a.id,action,life});return applyEncounterReaction(b,reaction)}

// 1. Brace receipts: frontal guard holds, rear hit buckles. Same incoming hunter.
{
  const {sim,p,h}=setup('GENVO8-REACT-BRACE');const view=new EncounterReactionPresentation();
  p.dir=2;p.bracing=true;forced(sim,()=>sim.tryKill(h,p));
  assert.equal(sim.lastPlayerBrace?.kind,'frontal','real brace response resolved a frontal guard');
  const rngBefore=sim.rng.state,healthBefore=p.health;
  const front=view.sample(sim,p,0);view.sample(sim,p,.1);
  assert.equal(sim.rng.state,rngBefore,'sampling reactions consumes no simulation RNG');
  assert.equal(p.health,healthBefore,'sampling reactions writes no physiology');
  assert.equal(front.kind,'brace-frontal');assert.ok(front.source&&Math.abs(front.source.x-h.x)<1e-9,'guard reacts toward the real attacker');
  const atPeak=view.sample(sim,p,.08);assert.ok(atPeak.strength>.9,'frontal impact lands sharply');
  assert.equal(view.sample(sim,p,REACTION_SECONDS.brace+.05),null,'brace receipt fades instead of persisting');
  const frontPose=poseFor(sim,p,atPeak);assert.equal(frontPose.guardPlanted,true,'frontal guard keeps feet planted');assert.ok(frontPose.bodyLean<0,'frontal guard is pushed back');

  const rear=setup('GENVO8-REACT-REAR');rear.p.dir=6;rear.p.bracing=true;forced(rear.sim,()=>rear.sim.tryKill(rear.h,rear.p));
  assert.equal(rear.sim.lastPlayerBrace?.kind,'rear','facing away resolves a rear hit');
  const rv=new EncounterReactionPresentation();rv.sample(rear.sim,rear.p,0);const rr=rv.sample(rear.sim,rear.p,.08);assert.equal(rr.kind,'brace-rear');
  const rearPose=poseFor(rear.sim,rear.p,rr);
  assert.ok(rearPose.bodyDrop>frontPose.bodyDrop+.5,'rear hit buckles the body far lower than a held guard');
  assert.ok(rearPose.limp>0&&!rearPose.guardPlanted,'rear hit breaks footing');
}

// 2. Contrasting legal anatomy: sturdy legs visibly hold a frontal brace; runner legs rock.
{
  const sturdy=setup('GENVO8-REACT-STURDY'),runner=setup('GENVO8-REACT-RUNNER');
  withLegs(sturdy.p,'sturdy-leg');withLegs(runner.p,'runner-leg');
  assert.ok(braceSteadiness(sturdy.p)>braceSteadiness(runner.p)+.2,'steadiness follows the canonical brace factor of each body');
  const rocks=[];
  for(const {sim,p,h} of [sturdy,runner]){p.dir=2;p.bracing=true;forced(sim,()=>sim.tryKill(h,p));assert.equal(sim.lastPlayerBrace?.kind,'frontal');const v=new EncounterReactionPresentation();v.sample(sim,p,0);rocks.push(poseFor(sim,p,v.sample(sim,p,.08)).bodyLean)}
  assert.ok(rocks[1]<rocks[0]-.25,'runner-legged body is thrown back further by the same braced hit');
}

// 3. Hunter recovery outcomes from real charge contact and real lane overrun.
{
  const {sim,p,h}=setup('GENVO8-REACT-STAGGER');p.dir=2;p.bracing=true;h.x=p.x+.6;
  h.playerHunt={targetId:p.id,phase:'charge',style:'rusher',startedTick:sim.tickCount,untilTick:sim.tickCount+8,lastOutcome:null,aimX:p.x,aimY:p.y,aimDirX:-1,aimDirY:0,laneLength:3,laneTravel:2.5};
  forced(sim,()=>sim.predator.resolveCharge(h));
  assert.equal(h.playerHunt?.lastOutcome,'braced','frontal brace stopped the real charge');
  const v=new EncounterReactionPresentation();v.sample(sim,h,0);const stag=v.sample(sim,h,.1);
  assert.equal(stag.kind,'stagger');assert.deepEqual(reactionAttention(stag),stag.source,'staggered hunter keeps its eyes on the creature that stopped it');
  const sp=poseFor(sim,h,stag,'idle');assert.ok(sp.bodyLean<-1&&sp.headDrop>.8&&sp.feelerPin>.8,'braced charge reads as a stagger, not idle');

  const ev=setup('GENVO8-REACT-OVERRUN');ev.h.x=ev.p.x-3.6;ev.h.genes.temperament=1.08;
  ev.h.playerHunt={targetId:ev.p.id,phase:'stalk',style:'rusher',startedTick:ev.sim.tickCount,untilTick:ev.sim.tickCount,lastOutcome:null,aimX:null,aimY:null};
  assert.equal(ev.sim.predator.decision(ev.h,ev.p).intent,'hunt-windup');ev.h.playerHunt.untilTick=ev.sim.tickCount;
  assert.equal(ev.sim.predator.decision(ev.h,ev.p).intent,'charge-player');ev.h.playerHunt.untilTick=ev.sim.tickCount;
  ev.sim.predator.decision(ev.h,ev.p);assert.equal(ev.h.playerHunt.lastOutcome,'evaded');
  const ov=new EncounterReactionPresentation();ov.sample(ev.sim,ev.h,0);const o=ov.sample(ev.sim,ev.h,.1);
  assert.equal(o.kind,'overrun');assert.ok(poseFor(ev.sim,ev.h,o).bodyLean>.9,'spent charge skids forward instead of reading as a stagger');
}

// 4. Wounds accumulate visibly; a driven-off hunter retreats cowed, a lost one disengages.
{
  const {sim,p,h}=setup('GENVO8-REACT-WOUNDS');h.genes.temperament=1.08;
  h.playerHunt={targetId:p.id,phase:'recover',style:'rusher',startedTick:sim.tickCount,untilTick:sim.tickCount+CFG.simHz,lastOutcome:'evaded',aimX:p.x,aimY:p.y,wounds:0,stamina:100};
  const v=new EncounterReactionPresentation();
  const clean=poseFor(sim,h,v.sample(sim,h,5));
  const first=forced(sim,()=>sim.playerStrike(h));assert.equal(first.ok,true);assert.equal(h.playerHunt?.wounds,1);
  const wounded=poseFor(sim,h,v.sample(sim,h,5));assert.ok(wounded.limp>clean.limp&&wounded.headDrop>clean.headDrop,'one real wound changes the hunter\'s carriage');
  const second=forced(sim,()=>sim.playerStrike(h));
  if(second.drivenOff){
    assert.equal(h.playerAversion?.reason,'driven-off','drive-off records why the hunter is leaving');assert.equal(h.playerAversion.wounds,2);
    const r=v.sample(sim,h,6);assert.equal(r.kind,'retreat-cowed');const rp=poseFor(sim,h,r,'flee');assert.ok(rp.tailTuck>0&&rp.limp>0,'beaten retreat tucks and limps');
    const glances=[0,.4,.8,1.2,1.6,2,2.4,2.8].map(t=>v.sample(sim,h,6+t).glance);assert.ok(glances.includes(true)&&glances.includes(false),'retreating hunter glances back intermittently');
  }else assert.fail('two clean wounds should drive the hunter off: '+JSON.stringify(second));

  const lost=setup('GENVO8-REACT-LOST');const out=lost.sim.predator.giveUp(lost.h,lost.p,'outrun',3);lost.h.intent=out.intent;lost.h.target=out.target;
  const lr=new EncounterReactionPresentation().sample(lost.sim,lost.h,0);assert.equal(lr.kind,'retreat-disengage');assert.equal(reactionAttention(lr),null,'disengaging hunter does not stare back');
  assert.ok(!poseFor(lost.sim,lost.h,lr,'flee').tailTuck,'disengaging hunter is not drawn as beaten');
}

// 5. Graded player wound posture from the authoritative injury level.
{
  const limps={};
  for(const level of ['sore','wounded','severe']){const {sim,p}=setup('GENVO8-REACT-INJURY-'+level);sim.injury.ensure(p);Object.assign(p.injuryCare,{active:true,level,remaining:2,initial:2,lastHitTick:-99});const life=visualLifeState(sim,p,{action:'move',moving:true});assert.equal(life.injuryLevel,level);limps[level]=behaviorVisualState({bodyPlan:p.bodyPlan,id:p.id,action:'move',moving:true,life}).limp}
  assert.ok(limps.sore<limps.wounded&&limps.wounded<limps.severe,'limp grows with real wound severity: '+JSON.stringify(limps));
}

// 6. Defensive anatomy on legal bodies answers the same hunter bite differently.
function mount(animal,extra,{swap=null}={}){
  let placements=animal.bodyPlan.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
  if(swap)placements=placements.map(p=>swap[p.socket]?{...p,partId:swap[p.socket]}:p);
  placements=placements.filter(p=>!extra.some(e=>e.socket===p.socket&&e.parent===p.parent));
  const plan=makePlan([...placements,...extra]);const v=validatePlan(plan);assert.ok(v.ok,'legal body: '+v.errors.join('; '));animal.bodyPlan=plan;syncAnatomy(animal);return animal;
}
const BODIES={
  plain:[],
  plated:[{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'armor-plate',parent:'root',socket:'flank.right'}],
  shell:[{partId:'shell-back',parent:'root',socket:'dorsal'}],
  club:[{partId:'club-tail',parent:'root',socket:'tail'}],
  horn:[{partId:'horn-crest',parent:'root',socket:'dorsal'}],
  spined:[{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'spine-cluster',parent:'root',socket:'flank.right'}],
};
function bitten(name,{dir=2,repel=false}={}){
  const w=setup('GENVO8-REACT-DEF-'+name);mount(w.p,BODIES[name]);
  // Paired flank plates are how the hardened-mantle adaptation is expressed on a GenVo body.
  if(name==='plated')w.p.adaptations=[...new Set([...(w.p.adaptations||[]),'hardened-mantle'])];w.p.dir=dir;w.p.bracing=false;
  // Force the bite to land; optionally refuse the separate repel roll so armour is seen alone.
  let n=0;const old=w.sim.rng.chance;w.sim.rng.chance=()=>repel||n++===0;try{w.sim.tryKill(w.h,w.p)}finally{w.sim.rng.chance=old}
  const v=new EncounterReactionPresentation(),rngBefore=w.sim.rng.state;v.sampleDefense(w.sim,w.p,0);v.sampleDefense(w.sim,w.h,0);
  const out={...w,receipt:w.sim.lastDefenseReceipt,player:v.sampleDefense(w.sim,w.p,.08),hunter:v.sampleDefense(w.sim,w.h,.08)};
  assert.equal(w.sim.rng.state,rngBefore,'defense sampling consumes no simulation RNG');return out;
}
{
  const plain=bitten('plain'),plated=bitten('plated'),shellFront=bitten('shell'),shellRear=bitten('shell',{dir:6});
  assert.equal(plain.receipt.hit,true);assert.equal(plain.player,null,'an unprotected body has no defensive answer to show');
  assert.ok(plated.receipt.armor>0,'mounted plates reduced the real bite');assert.equal(plated.player?.kind,'armor-absorb');assert.ok(plated.player.share>0);
  assert.ok(plated.receipt.damage<plain.receipt.damage,'plates matter in the authority, not only on screen');
  assert.ok(shellRear.receipt.shell>0,'a shell back turns a bite from behind');assert.equal(shellRear.player?.kind,'shell-turn');
  assert.notEqual(shellFront.player?.kind,'shell-turn','the same shell does not turn a frontal bite');
  const tuck=applyDefenseReaction(poseFor(shellRear.sim,shellRear.p,null),shellRear.player),plates=applyDefenseReaction(poseFor(plated.sim,plated.p,null),plated.player);
  assert.ok(tuck.headDrop>plates.headDrop+1&&tuck.stanceSpread<plates.stanceSpread,'shell body withdraws head and legs; plated body stands and absorbs');
}
{
  const club=bitten('club',{repel:true}),horn=bitten('horn',{repel:true}),spined=bitten('spined',{repel:true}),plain=bitten('plain',{repel:true});
  for(const [name,w,organ] of [['club',club,'club'],['horn',horn,'horn'],['spined',spined,'spines']]){
    assert.equal(w.receipt.repelled,true,name+' repel roll resolved in tryKill');assert.equal(w.h.playerAversion?.reason,'repelled');
    assert.equal(defenseOrgan(w.p),organ);assert.equal(w.player?.organ,organ,name+' shows the organ that repelled');
    assert.equal(w.hunter?.kind,'organ-recoil');assert.ok(defenseShove(w.hunter,w.h),'repelled hunter is thrown off the organ');
  }
  assert.equal(plain.receipt.repelled,false,'a body without repel organs cannot repel');assert.equal(plain.hunter,null);
  const tail=applyDefenseReaction(poseFor(club.sim,club.p,null),{...club.player,age:.1}),hornPose=applyDefenseReaction(poseFor(horn.sim,horn.p,null),horn.player);
  assert.ok(Math.abs(tail.tailSweep)>1,'club tail swings');assert.ok(hornPose.headReach>1,'horn crest tosses forward');
}

// 7. Prey the player bites or misses react; before this they had no impact record.
{
  const {sim,p}=setup('GENVO8-REACT-PREY');mount(p,[],{swap:{mouth:'tearing-jaw'}});
  const prey=sim.animals.find(o=>o.alive&&o.id!==p.id&&!canHunt(o)&&preyPreference(p,o)>0&&o.species==='mosskip');assert.ok(prey);
  prey.x=p.x+.6;prey.y=p.y;prey.health=400;
  let n=0;const old=sim.rng.chance;sim.rng.chance=()=>n++===0;sim.tryKill(p,prey);sim.rng.chance=old;
  assert.equal(sim.lastPlayerCombatImpact?.targetId,prey.id,'player bite on prey now records a presentation impact');assert.equal(sim.lastPlayerCombatImpact.kind,'hit');
  const v=new EncounterReactionPresentation();v.sampleDefense(sim,prey,0);const bit=v.sampleDefense(sim,prey,.08);
  assert.equal(bit?.kind,'prey-bitten');const s1=defenseShove(bit,prey);assert.ok(s1.x>0,'bitten prey is knocked away from the biter');
  sim.tickCount+=CFG.simHz*2;sim.rng.chance=()=>false;sim.tryKill(p,prey);sim.rng.chance=old;
  assert.equal(sim.lastPlayerCombatImpact.kind,'miss');v.sampleDefense(sim,prey,1);const dodge=v.sampleDefense(sim,prey,1.08);
  assert.equal(dodge?.kind,'prey-dodge');const s2=defenseShove(dodge,prey);assert.ok(Math.abs(s2.y)>Math.abs(s2.x),'dodging prey sidesteps across the line of attack');
}

// 8. Biting a spined hunter: its quills flare and the biter flinches; a smooth hunter does neither.
{
  const spiny=setup('GENVO8-REACT-SPINY'),smooth=setup('GENVO8-REACT-SMOOTH');
  mount(spiny.h,[{partId:'spine-cluster',parent:'root',socket:'flank.left'},{partId:'spine-cluster',parent:'root',socket:'flank.right'}]);
  for(const w of [spiny,smooth]){const old=w.sim.rng.chance;let n=0;w.sim.rng.chance=()=>n++===0;w.r=w.sim.playerStrike(w.h);w.sim.rng.chance=old;assert.equal(w.r.ok,true)}
  assert.equal(spiny.sim.lastPlayerCombatImpact.spines,true);assert.ok(spiny.p.health<smooth.p.health,'spines hurt the biter in the authority');
  const v=new EncounterReactionPresentation();for(const a of [spiny.h,spiny.p])v.sampleDefense(spiny.sim,a,0);
  assert.equal(v.sampleDefense(spiny.sim,spiny.h,.08)?.organ,'spines');assert.equal(v.sampleDefense(spiny.sim,spiny.p,.08)?.kind,'spine-prick');
  const sv=new EncounterReactionPresentation();assert.equal(sv.sampleDefense(smooth.sim,smooth.h,0),null);assert.equal(sv.sampleDefense(smooth.sim,smooth.p,0),null);
}

console.log('Encounter reactions (brace receipt, anatomy steadiness, stagger/overrun, wounds, cowed vs disengaged retreat, graded injury, armour/shell/organ defenses, prey bite/dodge, spines): PASS');
