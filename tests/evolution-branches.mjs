import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {ADAPTATIONS,adaptationEffects} from '../src/lineage/evolution.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
// v1.31 retired the handoff draft by default. These checks cover the legacy draft path that
// still resolves choices pending in older saves, so they enable it explicitly.
CFG.evolution.handoffDraft=true;

assert.equal(Object.keys(ADAPTATIONS).length,17,'adaptation registry includes the aquatic lifestyle branch');
for(const [id,req] of [['adaptive-chromatophores','camouflage-mantle'],['crushing-jaw','heavy-jaw'],['coordinated-defense','mobbing-instinct'],['provisioning-pouches','grasping-limbs']]){
  assert.deepEqual(ADAPTATIONS[id].requires,[req],`${id} has a real branch prerequisite`);
  assert.equal(ADAPTATIONS[id].tier,2,`${id} is marked as a second-stage adaptation`);
}

// A second-stage offer is impossible before its prerequisite, then becomes eligible after inheritance.
const offerSim=new Simulation('GENVO8-BRANCH-OFFER',{player:true}),of=offerSim.player(),om=offerSim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==of.id);
of.adaptations=[];offerSim.pressure.ensure(of).exposure.predation=14;offerSim.pressure.ensure(of).peak.predation=1;
let child=offerSim.spawnAnimal('genvo',of.x+.5,of.y,[of,om]);child.lineage=true;child.age=SPECIES.genvo.maturity+1;offerSim.lineage.register(child,[of.id,om.id]);
offerSim.evolution.onHandoff(of,child,{manual:true});assert.ok(!offerSim.evolution.offerFor(child).offers.some(o=>o.tier===2),'tier-two mutation is not offered without prerequisite');

offerSim.evolution.pending=null;of.adaptations=['heavy-jaw'];om.adaptations=['heavy-jaw'];const child2=offerSim.spawnAnimal('genvo',of.x+.8,of.y,[of,om]);child2.lineage=true;child2.age=SPECIES.genvo.maturity+1;offerSim.lineage.register(child2,[of.id,om.id]);offerSim.evolution.onHandoff(of,child2,{manual:true});assert.ok(offerSim.evolution.offerFor(child2).offers.some(o=>o.id==='crushing-jaw'),'heavy-jaw lineage can progress to crushing-jaw under predation pressure');

// Adaptive chromatophores preserve concealment during cautious covered movement, but not sprinting.
const stealth=new Simulation('GENVO8-BRANCH-STEALTH',{player:true}),sp=stealth.player();stealth.endOpeningGrace('test');sp.adaptations=['camouflage-mantle','adaptive-chromatophores'];
for(let ox=-2;ox<=2;ox++)for(let oy=-2;oy<=2;oy++)stealth.world.plants.bramble[stealth.world.idx(sp.x+ox,sp.y+oy)]=1;
assert.equal(stealth.playerHide().ok,true);assert.equal(sp.hidden,true);stealth.phasePlayerMovement({right:true});assert.equal(sp.hidden,true,'adaptive chromatophores keep concealment during cautious covered movement');stealth.phasePlayerMovement({right:true,sprint:true});assert.equal(sp.hidden,false,'sprinting still breaks advanced camouflage');

// Crushing jaw is a true follow-on combat specialization.
const fight=new Simulation('GENVO8-BRANCH-JAW',{player:true}),fp=fight.player();fight.endOpeningGrace('test');const fs=fight.animals.find(a=>a.alive&&a.species==='needlejaw');fs.x=fp.x+.6;fs.y=fp.y;const oldChance=fight.rng.chance;fight.rng.chance=()=>true;
fp.adaptations=['heavy-jaw'];fs.health=100;const heavy=fight.playerStrike(fs);fp.adaptations=['heavy-jaw','crushing-jaw'];fs.health=100;const crush=fight.playerStrike(fs);fight.rng.chance=oldChance;assert.ok(crush.damage>heavy.damage*1.6,'crushing jaw materially upgrades heavy jaw damage');assert.equal(crush.repelled,true,'crushing jaw can stagger a Stalker');

// Coordinated defense marks the rally and makes relatives harder to hurt while braced.
const mob=new Simulation('GENVO8-BRANCH-MOB',{player:true}),mp=mob.player();mob.endOpeningGrace('test');mp.adaptations=['mobbing-instinct','coordinated-defense'];const kin=mob.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==mp.id);kin.lineage=true;kin.age=SPECIES.genvo.maturity+4;kin.x=mp.x+1;kin.y=mp.y;const hunter=mob.animals.find(a=>a.alive&&a.species==='needlejaw');hunter.x=mp.x;hunter.y=mp.y;mob.rebuildSpatial();const rally=mob.playerAlarm();assert.ok(rally.ok&&kin.familyRally?.coordinated,'second-stage social branch creates a coordinated rally');
kin.health=100;const hitChance=mob.rng.chance;mob.rng.chance=()=>true;mob.tryKill(hunter,kin);const coordinatedHealth=kin.health;kin.health=100;kin.familyRally={targetId:hunter.id,untilTick:mob.tickCount+100,coordinated:false};mob.tryKill(hunter,kin);mob.rng.chance=hitChance;assert.ok(coordinatedHealth>kin.health,'coordinated relatives take less predator damage while braced');

// Provisioning pouches double a carried food load relative to graspers.
const carry=new Simulation('GENVO8-BRANCH-CARRY',{player:true}),cp=carry.player();carry.endOpeningGrace('test');const ci=carry.world.idx(cp.x,cp.y);carry.world.plants.bramble[ci]=1;
cp.adaptations=['grasping-limbs'];let r=carry.playerCarry();const baseLoad=cp.carryingFood.biomass;carry.playerCarry();carry.world.plants.bramble[ci]=1;cp.adaptations=['grasping-limbs','provisioning-pouches'];r=carry.playerCarry();assert.ok(r.ok&&cp.carryingFood.biomass>=baseLoad*1.9,'provisioning pouches carry roughly double the biomass');

const fx=adaptationEffects({adaptations:['camouflage-mantle','adaptive-chromatophores','heavy-jaw','crushing-jaw','mobbing-instinct','coordinated-defense','grasping-limbs','provisioning-pouches']});
assert.ok(fx.adaptiveCamouflage&&fx.coordinatedDefense&&fx.provisioning&&fx.carryCapacity===2&&fx.playerStrike>2.5,'branch effects expose upgraded mechanics');
console.log('evolution branch-depth checks: PASS');
