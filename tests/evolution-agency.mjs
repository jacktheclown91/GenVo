import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {ADAPTATIONS,adaptationEffects,hasAdaptation} from '../src/lineage/evolution.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
// v1.31 retired the handoff draft by default. These checks cover the legacy draft path that
// still resolves choices pending in older saves, so they enable it explicitly.
CFG.evolution.handoffDraft=true;

const sim=new Simulation('GENVO8-EVOLUTION',{player:true});
const founder=sim.player();
sim.endOpeningGrace('test');
// Manufacture a mature descendant without disturbing the ecology contract.
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id);
const child=sim.spawnAnimal('genvo',founder.x+.5,founder.y,[founder,mate]);child.lineage=true;child.age=SPECIES.genvo.maturity+2;sim.lineage.register(child,[founder.id,mate.id]);
sim.pressure.ensure(founder).exposure.predation=8;sim.pressure.ensure(founder).peak.predation=.9;
assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
const offer=sim.evolution.offerFor(child);assert.ok(offer);assert.equal(offer.offers.length,3);assert.ok(offer.offers.some(o=>['hardened-mantle','barbed-limbs','bitter-slime','spring-tendons'].includes(o.id)),'predator pressure offers a defensive/escape adaptation');
const pick=offer.offers[0].id;assert.ok(sim.evolution.choose(pick));assert.ok(hasAdaptation(child,pick));assert.ok(sim.lineage.records.get(child.id).adaptations.includes(pick),'chosen adaptation is stored in lineage record');
mate.adaptations=[...new Set([...(mate.adaptations||[]),pick])];const grand=sim.spawnAnimal('genvo',child.x+.5,child.y,[child,mate]);assert.ok(grand.adaptations.includes(pick),'a major adaptation carried by both parents reaches every child (v1.31: one parent passes it to most, not all)');

// Everyone can fight back against a Stalker, even without an adaptation.
const fightSim=new Simulation('GENVO8-DESPERATE-BITE',{player:true});const p=fightSim.player();fightSim.endOpeningGrace('test');p.adaptations=[];let stalk=fightSim.animals.find(a=>a.alive&&a.species==='needlejaw');stalk.x=p.x+.6;stalk.y=p.y;stalk.health=100;const old=fightSim.rng.chance;fightSim.rng.chance=()=>true;assert.notEqual(fightSim.playerInteract().type,'fight','E no longer attacks a Stalker');assert.equal(fightSim.playerCombat.startAttack().ok,true);let bite=null;for(let i=0;i<64&&!bite;i++){fightSim.playerControlStep({},64);bite=fightSim.playerCombat.consumeResult()}fightSim.rng.chance=old;assert.equal(bite?.type,'fight','the dedicated attack resolves against the Stalker after its wind-up');assert.ok(bite.ok&&stalk.health<100&&stalk.health>70,'founder bite damages Stalker but is futile');

// Barbs make that same action substantially stronger and can repel.
p.adaptations=['barbed-limbs'];stalk.health=100;stalk.x=p.x+.6;const old2=fightSim.rng.chance;fightSim.rng.chance=()=>true;const barb=fightSim.playerStrike(stalk);fightSim.rng.chance=old2;assert.ok(barb.damage>bite.damage*2,'barbed limbs significantly improve defensive strike');assert.equal(barb.repelled,true);assert.ok(stalk.playerAversion?.untilTick>fightSim.tickCount);

// Hardened mantle and bitter slime affect incoming predator contact.
// Phase 3I predation parity: the player takes the wildlife bite, so the mantle is judged against the same bite unprotected.
p.adaptations=[];p.health=100;stalk.health=100;stalk.x=p.x+.5;stalk.y=p.y;stalk.playerAversion=null;const old3b=fightSim.rng.chance;fightSim.rng.chance=()=>true;fightSim.tryKill(stalk,p);fightSim.rng.chance=old3b;const unprotected=100-p.health;p.alive=true;
p.adaptations=['hardened-mantle','bitter-slime'];p.health=100;stalk.health=100;stalk.x=p.x+.5;stalk.y=p.y;const old3=fightSim.rng.chance;fightSim.rng.chance=()=>true;fightSim.tryKill(stalk,p);fightSim.rng.chance=old3;assert.ok(unprotected>0&&100-p.health<unprotected*.8,'hardened mantle reduces Stalker damage');assert.ok(stalk.playerAversion?.untilTick>fightSim.tickCount,'bitter slime creates predator aversion');

const fx=adaptationEffects({adaptations:['water-sacs','efficient-gut','fast-healing','spring-tendons']});assert.ok(fx.waterUse<1&&fx.foodGain>1&&fx.healing>1&&fx.sprintSpeed>1);

// Alarm pulse is an active family-defense verb.
const alarmSim=new Simulation('GENVO8-ALARM',{player:true});const ap=alarmSim.player();alarmSim.endOpeningGrace('test');ap.adaptations=['alarm-pulse'];const kin=alarmSim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==ap.id);kin.lineage=true;kin.x=ap.x+1;kin.y=ap.y;const hunter=alarmSim.animals.find(a=>a.alive&&a.species==='needlejaw');hunter.x=ap.x+3;hunter.y=ap.y;alarmSim.rebuildSpatial();const pulse=alarmSim.playerAlarm();assert.equal(pulse.ok,true);assert.ok(kin.playerThreat?.untilTick>alarmSim.tickCount);assert.ok(ap.alarmCooldownUntil>alarmSim.tickCount);

// v0.52 strategic branches add new verbs.
const stealthSim=new Simulation('GENVO8-CAMO',{player:true}),cp=stealthSim.player();stealthSim.endOpeningGrace('test');cp.adaptations=['camouflage-mantle'];let ci=stealthSim.world.idx(cp.x,cp.y);stealthSim.world.plants.bramble[ci]=1;assert.equal(stealthSim.playerHide().ok,true);assert.equal(cp.hidden,true);const cs=stealthSim.animals.find(a=>a.alive&&a.species==='needlejaw');cs.x=cp.x+5;cs.y=cp.y;assert.equal(stealthSim.camouflageConceals(cp,cs,5),true);stealthSim.phasePlayerMovement({right:true});assert.equal(cp.hidden,false,'moving breaks camouflage');

const jawSim=new Simulation('GENVO8-JAW',{player:true}),jp=jawSim.player();jawSim.endOpeningGrace('test');const js=jawSim.animals.find(a=>a.alive&&a.species==='needlejaw');js.x=jp.x+.6;js.y=jp.y;const jawChance=jawSim.rng.chance;jawSim.rng.chance=()=>true;jp.adaptations=[];js.health=100;const normal=jawSim.playerStrike(js);jp.adaptations=['heavy-jaw'];js.health=100;const heavy=jawSim.playerStrike(js);jawSim.rng.chance=jawChance;assert.ok(heavy.damage>normal.damage*1.5,'heavy jaw materially strengthens direct combat');

const mobSim=new Simulation('GENVO8-MOB',{player:true}),mp=mobSim.player();mobSim.endOpeningGrace('test');mp.adaptations=['mobbing-instinct'];const mk=mobSim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==mp.id);mk.lineage=true;mk.age=SPECIES.genvo.maturity+3;mk.x=mp.x+1;mk.y=mp.y;const mh=mobSim.animals.find(a=>a.alive&&a.species==='needlejaw');mh.x=mp.x;mh.y=mp.y;mobSim.rebuildSpatial();const rally=mobSim.playerAlarm();assert.equal(rally.ok,true);assert.ok(rally.rallied>=1&&mk.familyRally?.targetId===mh.id,'mobbing rallies mature relatives');

const carrySim=new Simulation('GENVO8-CARRY',{player:true}),gp=carrySim.player();carrySim.endOpeningGrace('test');gp.adaptations=['grasping-limbs'];const gi=carrySim.world.idx(gp.x,gp.y);carrySim.world.plants.bramble[gi]=1;const picked=carrySim.playerCarry();assert.equal(picked.ok,true);assert.ok(gp.carryingFood,'graspers pick up one food load');carrySim.shelter.shelters.push({id:99,ownerId:gp.id,x:gp.x,y:gp.y,integrity:100,foodStore:0,capacity:28,constructedDay:1,constructedYear:1,lastUsedTick:0});const deposited=carrySim.playerCarry();assert.equal(deposited.ok,true);assert.ok(carrySim.shelter.shelters[0].foodStore>0&&!gp.carryingFood,'carried food can be deposited at shelter');

assert.equal(Object.keys(ADAPTATIONS).length,17,'major adaptations continue expanding beyond the original eight without making eight a content cap');
console.log('evolutionary agency checks: PASS');
