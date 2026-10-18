import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// v1.28 decisions under pressure: breath, a dedicated attack, Brace, and real-time
// Stalker pursuit that tires and loses sight. Scenarios run the same control-step and
// ecology cadence as the browser build (64 Hz control, 8 Hz ecology ticks).

function arena(seed,{temperament=1,distance=6,cover=null}={}){
  const sim=new Simulation(seed,{player:true});sim.endOpeningGrace('test');
  const p=sim.player(),w=sim.world;let spot=null;
  outer:for(let y=20;y<108;y++)for(let x=20;x<100;x++){let ok=true;for(let oy=-8;oy<=8&&ok;oy++)for(let ox=-12;ox<=20;ox++)if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}if(ok){spot={x:x+.5,y:y+.5};break outer}}
  assert.ok(spot,'test arena found');p.x=spot.x;p.y=spot.y;
  for(let y=-10;y<=10;y++)for(let x=-14;x<=22;x++){const i=w.idx(spot.x+x,spot.y+y);for(const k of Object.keys(w.plants))w.plants[k][i]=Math.min(w.plants[k][i],.08)}
  if(cover)for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)w.plants.bramble[w.idx(spot.x+cover.x+x,spot.y+cover.y+y)]=.8;
  // Remove bystanders near the arena (Phase 3I: relocating them to a corner could leave them inside the
  // hunter's range, where under predation parity a hungry hunter may rightly prefer them to the player).
  {const keep=sim.animals.find(a=>a.species==='needlejaw'&&a.alive);sim.animals=sim.animals.filter(a=>a.id===p.id||a===keep||!(a.alive&&Math.hypot(a.x-p.x,a.y-p.y)<60))}
  const h=sim.animals.find(a=>a.species==='needlejaw'&&a.alive);
  h.x=p.x-distance;h.y=p.y;h.energy=60;h.health=100;h.genes.motion=1;h.genes.senses=1;h.genes.temperament=temperament;p.genes.motion=1;p.health=100;p.energy=110;p.dir=6;
  // The arena stands in for a player among its kin. Since Phase 3J the rare-prey capture penalty is off by
  // default (?rarityReview=0 restores it); the local GenVo count is stubbed so the test holds under either.
  {const lc=sim.localCount.bind(sim);sim.localCount=(a,species,r)=>species==='genvo'?Math.max(CFG.wildHunt.scarceCount,lc(a,species,r)):lc(a,species,r)}
  sim.rebuildSpatial();return{sim,p,h};
}
function run({sim,p,h},bot,seconds=25){
  let hits=0,lastDamageTick=-1;
  for(let s=0;s<CFG.controlHz*seconds;s++){
    if(!p.alive)return{ended:'dead',hits};
    const act=bot({t:s/CFG.controlHz,sim,p,h,status:sim.predator.playerStatus(p)})||{},input=act.input||{};
    if(act.attack)sim.playerCombat.startAttack();
    if(act.interact)sim.playerInteract();
    sim.playerControlStep(input,CFG.controlHz);if(s%8===7)sim.update(input,{externalPlayerControl:true});
    sim.playerCombat.consumeResult();
    if(sim.lastPlayerDamage&&sim.lastPlayerDamage.tick!==lastDamageTick){lastDamageTick=sim.lastPlayerDamage.tick;hits++}
    if(!h.playerHunt&&h.playerAversion?.untilTick>sim.tickCount&&s>CFG.controlHz)return{ended:'gave-up',outcome:sim.lastPlayerPredatorOutcome?.outcome,hits,health:p.health};
  }
  return{ended:p.alive?'timeout':'dead',hits,health:p.health};
}
const away=(p,h)=>{const dx=p.x-h.x,dy=p.y-h.y;return{right:dx>.3,left:dx<-.3,down:dy>.3,up:dy<-.3}};
const toward=(p,h)=>{const dx=h.x-p.x,dy=h.y-p.y;return{right:dx>.25,left:dx<-.25,down:dy>.25,up:dy<-.25}};
const laneOffset=(p,h)=>{const st=h.playerHunt;if(!Number.isFinite(st?.aimDirX))return 9;return Math.abs((p.x-h.x)*st.aimDirY-(p.y-h.y)*st.aimDirX)};
const dodge=(p,h)=>laneOffset(p,h)<1.4?{up:true}:{};
const committed=s=>s?.phase==='windup'||s?.phase==='charge';

// Breath: sprint spends it, walking refills it, running dry only removes the sprint.
{
  const {sim,p}=arena('GENVO8-V128-BREATH',{distance:40});
  const x0=p.x;for(let i=0;i<CFG.controlHz;i++)sim.playerControlStep({right:true},CFG.controlHz);
  const walkRate=p.x-x0;assert.ok(Math.abs(walkRate-SPECIES.genvo.speed)<.05,'walking moves at the normal walk speed');
  assert.equal(p.exertion,CFG.exertion.max,'walking does not spend breath');
  let x1=p.x;for(let i=0;i<CFG.controlHz;i++)sim.playerControlStep({right:true,sprint:true},CFG.controlHz);
  assert.ok(p.x-x1>walkRate*1.4,'sprint is materially faster than walking');assert.ok(p.exertion<CFG.exertion.max-15,'sprint spends breath');
  for(let i=0;i<CFG.controlHz*6&&!p.exertionWinded;i++)sim.playerControlStep({right:true,sprint:true},CFG.controlHz);
  assert.equal(p.exertionWinded,true,'a long sprint winds the creature');const hp=p.health;
  x1=p.x;for(let i=0;i<CFG.controlHz/2;i++)sim.playerControlStep({right:true,sprint:true},CFG.controlHz);
  assert.ok(Math.abs((p.x-x1)*2-walkRate)<.08,'winded sprint falls back to a full walk, not a collapse');
  assert.equal(p.health,hp,'exhaustion never damages health');
  for(let i=0;i<CFG.controlHz*3;i++)sim.playerControlStep({right:true},CFG.controlHz);
  assert.equal(p.exertionWinded,false,'walking recovers breath quickly');assert.ok(p.exertion>50);
  assert.equal(sim.exertion.status(p).winded,false);
}

// E is for using the world. It never attacks a Stalker or bites prey.
{
  const {sim,p,h}=arena('GENVO8-V128-E');h.x=p.x+.8;h.y=p.y;sim.rebuildSpatial();
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){const i=sim.world.idx(p.x+x,p.y+y);for(const k of Object.keys(sim.world.plants))sim.world.plants[k][i]=0;sim.world.carrion[i]=0}sim.foraging?.observeNearby?.(p);
  const before=h.health,r=sim.playerInteract();
  assert.notEqual(r.type,'fight');assert.equal(h.health,before,'E does not damage the Stalker');assert.match(r.message,/Space attacks/);
  assert.match(sim.interactionHint(),/^Space · .*J brace/,'the close-Stalker prompt points at the attack and brace keys');
}

// Attack: wind-up, then a resolved strike, then a recovery that blocks spamming.
{
  const {sim,p,h}=arena('GENVO8-V128-ATTACK');h.x=p.x+.9;h.y=p.y;
  const old=sim.rng.chance;sim.rng.chance=()=>true;
  const start=sim.playerCombat.startAttack();assert.equal(start.ok,true);assert.equal(h.health,100,'no damage during the wind-up');
  assert.equal(sim.playerCombat.startAttack().ok,false,'cannot queue a second attack during the wind-up');
  let r=null,steps=0;for(;steps<64&&!r;steps++){sim.playerControlStep({},CFG.controlHz);r=sim.playerCombat.consumeResult()}
  assert.equal(r?.type,'fight');assert.ok(h.health<100);assert.ok(steps>=Math.floor(CFG.attack.windup*CFG.controlHz)-1,'strike lands only after the wind-up');
  assert.equal(sim.playerCombat.status(p).attackPhase,'recover');assert.equal(sim.playerCombat.startAttack().ok,false,'recovery blocks spam');
  for(let i=0;i<CFG.controlHz;i++)sim.playerControlStep({},CFG.controlHz);
  p.exertion=0;p.exertionWinded=true;const slow=sim.playerCombat.startAttack();assert.equal(slow.slow,true,'a winded attack still works but winds up slower');
  sim.rng.chance=old;
}

// Brace: frontal hits are blunted, wrong-angle braces are not, and it cannot last forever.
{
  const hitWith=(dir,brace)=>{const {sim,p,h}=arena('GENVO8-V128-BRACE');h.x=p.x-.6;h.y=p.y;p.dir=dir;if(brace){sim.playerControlStep({brace:true},CFG.controlHz)}const old=sim.rng.chance;sim.rng.chance=()=>true;sim.tryKill(h,p);sim.rng.chance=old;return{damage:100-p.health,brace:sim.lastPlayerDamage.brace,sim,p,h}};
  const open=hitWith(6,false),front=hitWith(6,true),rear=hitWith(2,true);
  assert.equal(front.brace,'frontal');assert.ok(front.damage<open.damage*.45,'facing the attacker blunts the hit');
  assert.equal(rear.brace,'rear');assert.ok(rear.damage>=open.damage,'bracing the wrong way gives no protection');
  const {sim,p}=arena('GENVO8-V128-BRACE-DRAIN',{distance:40});const x0=p.x;
  for(let i=0;i<CFG.controlHz;i++)sim.playerControlStep({left:true,brace:true},CFG.controlHz);
  assert.ok(x0-p.x<SPECIES.genvo.speed*.5,'bracing slows movement');assert.ok(p.exertion<CFG.exertion.max-5,'bracing spends breath');
  let broke=false;for(let i=0;i<CFG.controlHz*15&&!broke;i++){sim.playerControlStep({brace:true},CFG.controlHz);if(!p.bracing)broke=true}
  assert.equal(broke,true,'a held brace eventually breaks: no permanent turtling');
  assert.equal(sim.playerCombat.status(p).braceLocked,true,'a broken guard cannot be raised again immediately');
}

// Real-time pursuit: faster than walking, slower than sprinting, and it tires.
{
  const env=arena('GENVO8-V128-CHASE',{distance:9.5});const {sim,p,h}=env;sim.predator.beginStalk(h,p,9.5);h.intent='stalk-player';
  for(let i=0;i<CFG.controlHz;i++){sim.playerControlStep({},CFG.controlHz);if(i%8===7)sim.update({},{externalPlayerControl:true})}
  assert.equal(h.playerHunt?.pursuit,'chase');assert.equal(h.intent,'chase-player');
  const hx=h.x,px=p.x;for(let i=0;i<CFG.controlHz;i++){sim.playerControlStep({right:true},CFG.controlHz);if(i%8===7)sim.update({right:true},{externalPlayerControl:true})}
  const hunterRate=h.x-hx,walkRate=p.x-px;
  assert.ok(hunterRate>walkRate+.3,'an engaged Stalker outpaces a walking GenVo8');
  assert.ok(hunterRate<SPECIES.genvo.speed*1.55,'but is slower than a sprint');
  assert.ok(Math.abs(hunterRate-SPECIES.needlejaw.speed)<.3,'it moves at its real listed speed during a chase');
  assert.ok(h.playerHunt.stamina<CFG.stalkerPursuit.stamina,'chasing spends pursuit stamina');
}

// Each response wins in some circumstance, and the old Shift+E habit loses.
{
  const flee=run(arena('GENVO8-V128-FLEE',{temperament:1}),({p,h,status})=>({input:committed(status)?dodge(p,h):away(p,h)}));
  assert.equal(flee.ended,'gave-up','flee: reading the lane and walking off breaks the hunt');assert.equal(flee.hits,0);
  const sprint=run(arena('GENVO8-V128-SPRINT',{temperament:1.08}),({p,h})=>({input:{...away(p,h),sprint:true}}),12);
  assert.equal(sprint.hits,0,'flee: sprinting early from range is never caught');
  const fight=run(arena('GENVO8-V128-FIGHT',{temperament:1}),({p,h,status})=>{const d=Math.hypot(h.x-p.x,h.y-p.y);if(committed(status))return{input:dodge(p,h)};if(status?.phase==='recover')return{input:d>1.3?{...toward(p,h),sprint:true}:{},attack:d<1.6};return{input:{}}});
  assert.equal(fight.ended,'gave-up');assert.equal(fight.outcome,'driven-off','fight: punishing openings drives the Stalker off');assert.equal(fight.hits,0);
  const brace=run(arena('GENVO8-V128-BRACE-WIN',{temperament:1.08}),({p,h,status})=>{const d=Math.hypot(h.x-p.x,h.y-p.y);if(status?.phase==='recover'&&d<1.6)return{input:{},attack:true};return{input:{brace:committed(status)}}});
  assert.equal(brace.ended,'gave-up','brace: standing ground against a fast Rusher works');assert.equal(brace.outcome,'driven-off');assert.ok(brace.health>70,'braced hits are survivable');
  const shiftArena=arena('GENVO8-V128-SHIFTE',{temperament:1.08}),stalkerHealth=shiftArena.h.health;
  const shiftE=run(shiftArena,({p,h,t})=>({input:{...toward(p,h),sprint:true},interact:Math.floor(t*8)%2===0}));
  // The rule, not one run's outcome: E never strikes. (Pursuit stamina may now make the Stalker give up.)
  assert.equal(shiftArena.h.health,stalkerHealth,'Shift+E no longer fights: pressing E never wounds the Stalker');
  assert.ok(shiftE.hits>0&&shiftE.outcome!=='driven-off','pressing E in danger neither protects nor drives the Stalker off: '+JSON.stringify(shiftE));
  // Doing nothing is not a strategy. Under parity a contact bite lands about 39% of the time and a hunter
  // may tire and break off, so one arena can survive by luck; across independent arenas standing still is
  // bitten repeatedly and often killed, unlike the responses tested above (Phase 3J: no single-seed outcome).
  const stills=['A','B','C','D','E','F'].map(k=>run(arena('GENVO8-V128-STILL-'+k,{temperament:1}),()=>({input:{}}),25));
  const bitten=stills.filter(r=>r.hits>0||r.ended==='dead').length,dead=stills.filter(r=>r.ended==='dead').length;
  assert.ok(bitten>=4&&dead>=1,'doing nothing is not a strategy: '+JSON.stringify(stills.map(r=>r.ended+':'+r.hits)));
}

// Cover: slipping quietly into dense plants breaks sight; sprinting in does not.
{
  const quiet=arena('GENVO8-V128-COVER',{cover:{x:5,y:0},distance:5});quiet.sim.predator.beginStalk(quiet.h,quiet.p,5);quiet.h.intent='stalk-player';const qx=quiet.p.x;
  const hid=run(quiet,({p})=>({input:p.x<qx+6.2?{right:true}:{}}),20);
  assert.equal(hid.ended,'gave-up');assert.equal(hid.outcome,'lost','a quiet creature in dense plants is lost');
  const loud=arena('GENVO8-V128-COVER',{cover:{x:5,y:0},distance:5});loud.sim.predator.beginStalk(loud.h,loud.p,5);loud.h.intent='stalk-player';const lx=loud.p.x;
  const seen=run(loud,({p})=>({input:p.x<lx+6.2?{right:true,sprint:true}:{}}),20);
  assert.ok(seen.hits>0,'sprinting into cover is noisy and the Stalker keeps contact');
}

// Saves: v1.27 schema 1 saves migrate, and new stance state round-trips.
{
  const {sim,p,h}=arena('GENVO8-V128-SAVE');sim.predator.beginStalk(h,p,6);p.exertion=42;
  const snap=structuredClone(createSimulationSnapshot(sim));assert.equal(snap.schema,SAVE_SCHEMA);assert.ok(SAVE_SCHEMA>=2);
  const restored=restoreSimulationSnapshot(snap);assert.equal(restored.player().exertion,42);
  assert.ok(Array.isArray(restored.predator.engaged)&&typeof restored.predator._collect==='function','runtime pursuit scratch survives restore');
  const old=structuredClone(createSimulationSnapshot(sim));old.schema=1;
  for(const a of old.animals){delete a.exertion;delete a.exertionWinded;if(a.playerHunt){delete a.playerHunt.stamina;delete a.playerHunt.wounds}}delete old.controllers.exertion;delete old.controllers.playerCombat;old.controllers.predator={};
  // v1.39.0 (creator decision 2026-10-09): saves start fresh; an older save is refused with a clear message.
  assert.throws(()=>restoreSimulationSnapshot(old),/predates GenVo's modular creature bodies/,'older saves are refused, not migrated');
}

// Performance floor: engaged pursuit is a local query, not a world scan.
{
  const {sim,p,h}=arena('GENVO8-V128-PERF');sim.predator.beginStalk(h,p,6);h.intent='stalk-player';
  const far=sim.animals.find(a=>a.species==='needlejaw'&&a.alive&&a!==h);far.x=p.x+60>CFG.worldSize-3?p.x-60:p.x+60;far.playerHunt={...h.playerHunt};sim.rebuildSpatial();
  sim.update({},{externalPlayerControl:true});
  assert.ok(sim.predator.engaged.includes(h));assert.ok(!sim.predator.engaged.includes(far),'only nearby hunters are engaged');
}
console.log('decisions under pressure ok');

// AUTO keeps the selected creature and its hunters on the same ambient cadence.
{
  const {sim,p,h}=arena('GENVO8-V128-AUTO');sim.predator.beginStalk(h,p,6);h.intent='stalk-player';sim.setPlayerAutonomy(true);
  sim.update(null,{externalPlayerControl:true});
  assert.equal(sim.predator.engaged.length,0,'no real-time pursuit against an automated creature');assert.ok(!h.pursuitEngaged);
  sim.setPlayerAutonomy(false);sim.predator.markEngaged();sim.update(null,{externalPlayerControl:true});
  assert.ok(sim.predator.engaged.includes(h),'manual control restores real-time pursuit');
}
console.log('auto cadence ok');
