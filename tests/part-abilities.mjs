import {provideRootFood} from './helpers/finite-root-food.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {createDraft,place,replaceRoot} from '../src/lineage/evolution-draft.js';
import {planFor,applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {adaptationEffects} from '../src/lineage/evolution.js';
import {threatSenseEffect} from '../src/lineage/effects.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {partEffectFactors,PART_ABILITY,WAVE1} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Evolution Expansion Phase D (GDD v1, section 14): parts drive actions, with costs; no part,
// no action; autonomous creatures follow the same rules; state survives save and reload.

const ALL=Object.keys(PARTS);
export function design(animal,edits){
  // Designs start from the old eight-legged body, now a mid-developed creature (v1.39.0).
  const d=createDraft({base:bodyPlanFromLegacy(animal),ancestry:ALL,budget:99});
  for(const e of edits){const r=e.root?replaceRoot(d,e.root):place(d,e.part,e.parent||'root',e.socket);assert.equal(r.ok,true,`${JSON.stringify(e)}: ${r.reason}`)}
  applyLineageTarget(animal,d.plan);return animal;
}
export const BUILDS={
  runner:[{part:'spring-leg',socket:'limb.3'},{part:'spring-leg',socket:'limb.4'},{part:'spring-leg',socket:'limb.5'}],
  digger:[{root:'reinforced-torso'},{part:'armor-plate',socket:'flank.left'},{part:'armor-plate',socket:'flank.right'},{part:'digging-forelimb',socket:'limb.0'},{part:'digging-forelimb',socket:'limb.1'},{part:'digging-forelimb',socket:'limb.7'}],
  venom:[{part:'venom-gland',socket:'flank.left'},{part:'wide-field-eye',socket:'eye.left'},{part:'wide-field-eye',socket:'eye.right'}],
  claw:[{part:'claw',parent:'root/limb.2',socket:'spur'}],
  paddle:[{part:'paddle-tail',socket:'tail'}]
};
function fresh(seed){const sim=new Simulation(seed,{player:true});sim.endOpeningGrace?.('test');return sim}
const near=(a,b)=>Math.abs(a-b)<1e-9;

// Non-GenVo8 species have no body plan; the GenVo8 founder body is neutral (v1.39.0).
{const sim=fresh('GENVO8-PARTS-NONE'),p=sim.player(),pf=partEffectFactors(p);for(const k of ['sprintSpeed','damageTaken','metabolism','waterUse','playerStrike','carryCapacity','threatSense','landSpeed','forage'])assert.equal(pf[k],1,k);
 const fx=adaptationEffects(p);// Wild species start from their own body plan, which plays like the original creature (v1.45.0).
 for(const a of sim.animals.filter(a=>a.species!=='genvo')){const f=partEffectFactors(a);assert.ok(a.bodyPlan);assert.equal(f.landSpeed,1);assert.equal(f.metabolism,1);assert.equal(f.huntBonus,0)}
 // No part, no action: a plain body cannot dig, poison or see farther.
 assert.equal(sim.partAbilities.canDigAt(p),false);assert.equal(sim.partAbilities.dig(p).ok,false);assert.equal(sim.partAbilities.venomDoses(p),0);
 assert.equal(sim.partAbilities.envenom(p,sim.animals.find(a=>a.id!==p.id)),false);assert.ok(fx.sprintSpeed>0)}

// Digging forelimb: E digs roots on open ground, once per patch until it regrows; slower sprint; thinner cover hides.
{const sim=fresh('GENVO8-PARTS-DIG'),p=design(sim.player(),BUILDS.digger),plain=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
 const pf=partEffectFactors(p);assert.ok(pf.dig);assert.ok(near(pf.sprintSpeed,PART_ABILITY.dig.sprint*PART_ABILITY.torso.sprint));
 for(const kind of Object.keys(sim.world.plants))sim.world.plants[kind].fill(0);
 // A dry spot: no water under the creature.
 const w=sim.world;let dryFound=false;for(let i=w.len>>1;i<w.len;i++){const x=i%w.n+.5,y=Math.floor(i/w.n)+.5;if(sim.canOccupy(p,x,y)&&!w.isDrinkable(x,y)&&!sim.nearestPlayerCombatTarget({...p,x,y},3)&&x>4&&y>4){p.x=x;p.y=y;dryFound=true;break}}assert.ok(dryFound,'digging test must actually place the actor on dry reachable ground');
 for(const a of sim.animals)if(a.id!==p.id&&Math.hypot(a.x-p.x,a.y-p.y)<3)a.x+=8;
 provideRootFood(sim,p);p.energy=40;assert.match(sim.interactionHint(),/Eat/,'ordinary represented food keeps its normal default hint');const available=sim.interactionOptions();assert.ok(available.some(o=>o.id==='dig'&&o.enabled)||sim.partAbilities.digAvailability(p).enabled,'finite digging remains explicitly available');if(available.filter(o=>o.enabled).length>1){const pending=sim.playerInteract();assert.equal(pending.type,'interaction-choice');assert.equal(p.energy,40,'choice does not dig eagerly')}const r=sim.playerInteract({kind:'ground',i:w.idx(p.x,p.y),x:p.x,y:p.y},'dig');assert.equal(r.type,'dig',r.message);assert.equal(r.ok,true);assert.ok(p.energy>40);
 sim.tickCount+=CFG.simHz*2;const again=sim.partAbilities.dig(p);assert.equal(again.ok,false,'the same patch is dug out');
 assert.equal(sim.partAbilities.coverNeeded(p,.36),PART_ABILITY.dig.coverHide);assert.equal(sim.partAbilities.coverNeeded(plain,.36),.36);
 // Damage: the reinforced torso reduces any attacker's hit.
 assert.ok(near(partEffectFactors(p).damageTaken,PART_ABILITY.torso.damageTaken))}

// Claw: shorter wind-up, weaker hit, less carried; hunts land slightly more often.
{const sim=fresh('GENVO8-PARTS-CLAW'),p=sim.player(),base=adaptationEffects(p);design(p,BUILDS.claw);const fx=adaptationEffects(p);
 assert.ok(near(fx.playerStrike,base.playerStrike*PART_ABILITY.claw.strike));assert.ok(near(fx.carryCapacity,base.carryCapacity*PART_ABILITY.claw.carry));
 p.exertion=100;p.exertionWinded=false;const r=sim.playerCombat.startAttack();assert.equal(r.ok,true);
 assert.ok(near(p.attackAction.until-p.attackAction.startedAt,CFG.attack.windup*PART_ABILITY.claw.windup))}

// Venom: a landed bite poisons (slow, damage over time, a hunter breaks off), 3 doses a day.
{const sim=fresh('GENVO8-PARTS-VENOM'),p=design(sim.player(),BUILDS.venom);const hunter=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter);
 assert.equal(sim.partAbilities.venomDoses(p),3);assert.equal(sim.partAbilities.envenom(p,hunter),true);assert.equal(sim.partAbilities.slowFactor(hunter),PART_ABILITY.venom.slow);
 assert.equal(hunter.playerAversion.targetId,p.id,'a poisoned hunter breaks off');assert.ok(Math.abs(sim.predator.speedMultiplier(hunter)-PART_ABILITY.venom.slow*sim.predator.intentSpeed(hunter))<1e-9);
 const hp=hunter.health;for(let i=0;i<CFG.simHz;i++)sim.partAbilities.tick();assert.ok(hunter.health<hp,'poison damages over time');
 sim.partAbilities.envenom(p,hunter);sim.partAbilities.envenom(p,hunter);assert.equal(sim.partAbilities.venomDoses(p),0);assert.equal(sim.partAbilities.envenom(p,hunter),false,'out of doses');
 sim.day++;assert.equal(sim.partAbilities.venomDoses(p),3,'doses refill each day');
 // Costs: more food (and water for the wide-field eye).
 const plainSim=fresh('GENVO8-PARTS-VENOM'),q=plainSim.player();assert.ok(adaptationEffects(p).metabolism>adaptationEffects(q).metabolism);assert.ok(adaptationEffects(p).waterUse>adaptationEffects(q).waterUse);
 // Wide-field eye: threats noticed farther, and a rear attack is met like a side attack while bracing.
 assert.ok(threatSenseEffect(sim,p)>threatSenseEffect(plainSim,q));p.bracing=true;q.bracing=true;
 const dir=[0,1,2,3,4,5,6,7].find(d=>{q.dir=d;return plainSim.playerCombat.braceResponse(q,{x:q.x-3,y:q.y})?.kind==='rear'});assert.ok(dir!==undefined);p.dir=dir;
 assert.equal(sim.playerCombat.braceResponse(p,{x:p.x-3,y:p.y}).kind,'side','a wide-field eye meets a rear attack like a side attack')}

// Paddle tail: swims faster and cheaper only for a body that already swims; never grants swimming.
{const sim=fresh('GENVO8-PARTS-PADDLE'),w=sim.world;let wi=-1,li=-1;for(let i=0;i<w.len&&(wi<0||li<0);i++){if(w.water[i]&&wi<0)wi=i;if(!w.water[i]&&li<0)li=i}
 const at=i=>({x:i%CFG.worldSize+.5,y:Math.floor(i/CFG.worldSize)+.5});const water=at(wi),land=at(li);
 const p=design(sim.player(),BUILDS.paddle);assert.equal(movementProfile(p,w,{fromX:water.x,fromY:water.y,toX:water.x,toY:water.y}).allowed,false,'a paddle tail alone does not swim');
 assert.ok(near(movementProfile(p,w,{fromX:land.x,fromY:land.y,toX:land.x,toY:land.y}).speed,WAVE1.legSpeed[8]*PART_ABILITY.paddle.land),'an eight-legged body with a paddle tail');
 p.adaptations=[...p.adaptations,'webbed-limbs'];const m=movementProfile(p,w,{fromX:water.x,fromY:water.y,toX:water.x,toY:water.y});assert.equal(m.allowed,true);assert.ok(near(m.speed,.66*PART_ABILITY.paddle.swimSpeed));assert.ok(near(m.energy,1.48*PART_ABILITY.paddle.swimEnergy))}

// Autonomous creatures follow the same rules: a hungry wild digger with no food digs; a plain one cannot.
{const sim=fresh('GENVO8-PARTS-AI');for(const field of Object.values(sim.world.plants))field.fill(0);for(const field of Object.values(sim.world.freshwaterFood))field.fill(0);sim.world.carrion.fill(0);
 const wild=sim.animals.filter(a=>a.alive&&a.species==='genvo'&&!a.player&&!a.lineage).slice(0,2);assert.equal(wild.length,2);const [dg,plain]=wild;design(dg,BUILDS.digger);
 let dry=null;for(let i=sim.world.len>>1;i<sim.world.len&&!dry;i++){const x=i%sim.world.n+.5,y=Math.floor(i/sim.world.n)+.5;if(sim.canOccupy(dg,x,y)&&!sim.world.isDrinkable(x,y)&&!sim.nearestPlayerCombatTarget({...dg,x,y},7))dry={x,y}}assert.ok(dry,'wild digging fixture requires safe dry soil');for(const a of wild)Object.assign(a,dry);assert.equal(sim.partAbilities.digAvailability(dg).enabled,false);provideRootFood(sim,dg);assert.ok(sim.partAbilities.digAvailability(dg).enabled);
 for(const a of wild){a.energy=SPECIES.genvo.maxEnergy*.4;a.hydration=SPECIES.genvo.maxHydration;a.pregnant=null}
 sim.phaseDecision(null);assert.equal(dg.intent,'dig');assert.notEqual(plain.intent,'dig');const e0=dg.energy;sim.resolveInteraction(dg);assert.ok(dg.energy>e0,'the wild digger fed itself')}

// Save and reload keep dug ground, poison and venom doses.
{const sim=fresh('GENVO8-PARTS-SAVE'),p=design(sim.player(),[...BUILDS.digger.slice(3),...BUILDS.venom]);const w=sim.world;if(w.water[w.idx(p.x,p.y)])p.x+=2;
 sim.partAbilities.dig(p);const hunter=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter);sim.partAbilities.envenom(p,hunter);
 const r=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim))),p2=r.player(),h2=r.animals.find(a=>a.id===hunter.id);
 assert.deepEqual(r.partAbilities.dug,sim.partAbilities.dug);assert.deepEqual(r.partAbilities.poisoned,[hunter.id]);assert.equal(r.partAbilities.slowFactor(h2),PART_ABILITY.venom.slow);assert.equal(r.partAbilities.venomDoses(p2),2);
 assert.deepEqual(partEffectFactors(p2),partEffectFactors(p))}
console.log('part abilities ok');
