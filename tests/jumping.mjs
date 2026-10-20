import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {RNG} from '../src/core/rng.js';
import {founderPlan,mutatePlan,recombineBodyPlans} from '../src/lineage/body-inheritance.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {JUMP,springLegs,jumpKinematics,jumpAvailability,launchJump,stepJump,restoreJumpingRules} from '../src/lineage/jumping.js';
import {advanceFlight} from '../src/lineage/flight.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {cueForResult} from '../src/audio/model.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {genvoVisualPose} from '../src/render/genvo.js';

const d=createDraft({base:founderPlan(),ancestry:[],budget:8});
for(const socket of ['limb.3','limb.5'])assert.ok(place(d,'spring-leg','root',socket).ok);
const body=d.plan;assert.ok(validatePlan(body).ok);assert.equal(springLegs({bodyPlan:body}),2);
assert.equal(springLegs({bodyPlan:recombineBodyPlans(new RNG('JUMP-HEREDITY'),body,body)}),2);
let mutation=false;for(let i=0;i<500&&!mutation;i++)mutation=springLegs({bodyPlan:mutatePlan(new RNG('JUMP-MUTATE-'+i),founderPlan())})>=2;
assert.ok(mutation,'the actual normal mutation operator can produce launch anatomy');
const legSlots=assemblyFor({bodyPlan:body}).legSlots,
 folded=genvoVisualPose({action:'jump',moving:true,frame:1,legSlots}),
 foldedLater=genvoVisualPose({action:'jump',moving:true,frame:6,legSlots}),
 standing=genvoVisualPose({action:'idle',moving:false,legSlots});
assert.deepEqual(folded.legs,foldedLater.legs,'jump limbs do not walk in midair');
assert.ok(folded.legs.every(l=>!l.planted),'airborne feet cannot be planted contacts');
assert.ok(folded.legs.reduce((n,l)=>n+Math.hypot(l.foot.x,l.foot.y),0)<standing.legs.reduce((n,l)=>n+Math.hypot(l.foot.x,l.foot.y),0),'real mounted legs tuck inside the standing footprint');

const sim=new Simulation('JUMP-INTEGRATION'),p=sim.player(),w=sim.world;
p.bodyPlan=body;p.age=SPECIES[p.species].maturity+1;p.energy=90;p.health=100;p.exertion=100;p.dir=2;
let spot=null;
for(let y=8;y<w.n-8&&!spot;y++)for(let x=8;x<w.n-12;x++){
 if(Array.from({length:10},(_,k)=>w.water[w.idx(x+k,y)]).some(Boolean))continue;
 const elevations=Array.from({length:10},(_,k)=>w.terrain.elevation[w.idx(x+k,y)]);
 if(Math.max(...elevations)-Math.min(...elevations)<.04){spot={x:x+.5,y:y+.5};break;}
}
assert.ok(spot);Object.assign(p,spot);
const before=structuredClone(p),rng=sim.rng.state;
assert.ok(sim.jumpStatus().enabled);assert.deepEqual(p,before,'availability is read-only');assert.equal(sim.rng.state,rng);
assert.equal(jumpAvailability(sim,{...p,bodyPlan:founderPlan()}).enabled,false);
assert.equal(jumpAvailability(sim,{...p,exertion:0}).enabled,false);
assert.equal(jumpAvailability(sim,{...p,energy:0}).enabled,false);
const launch=sim.playerJump();assert.ok(launch.ok);assert.equal(p.aerialMode,'jump');assert.ok(p.energy<before.energy);assert.equal(p.exertion,100-JUMP.breath);
assert.equal(sim.playerJump().ok,false,'cannot stack jump impulses in midair');
assert.equal(sim.playerToggleFlight().ok,false);assert.equal(sim.playerToggleGlide().ok,false);
assert.equal(sim.playerCombat.braceAvailability().enabled,false);assert.equal(sim.resourceAvailability('drink').enabled,false);
assert.equal(advanceFlight(p,w,1),null,'ballistic movement does not require wings');
const footprint=sim.history.traffic.slice();sim.playerControlStep({});
assert.ok(p.x>before.x&&p.jump.altitude>0);assert.deepEqual(sim.history.traffic,footprint,'no midair footprints');
assert.equal(sim.playerInputActive({}),true,'external control owns the unsteered arc');
const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed'})),restored=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(restored.player(),p);assert.equal(restored.jumpingRules,JUMP.policy);
sim.playerControlStep({});restored.playerControlStep({});assert.deepEqual(restored.player(),p,'exact midair continuation');
const corrupt=structuredClone(saved);corrupt.animals.find(a=>a.id===p.id).jump.vx=Infinity;
assert.throws(()=>restoreSimulationSnapshot(corrupt),/jump state/);
const unknown=structuredClone(saved);unknown.core.jumpingRules='future';assert.throws(()=>restoreSimulationSnapshot(unknown),/jumping rules/);
assert.throws(()=>restoreJumpingRules({planetaryTravel:{sessions:[{snapshot:{core:{jumpingRules:'future'}}}]}},{jumpingRules:JUMP.policy}),/regional jumping rules/);
const legacy=structuredClone(saved);delete legacy.core.jumpingRules;
for(const a of legacy.animals){delete a.jump;delete a.aerialMode;a.airborne=false;}
const historical=restoreSimulationSnapshot(legacy);assert.equal(historical.jumpingRules,undefined);assert.equal(historical.jumpStatus().enabled,false);
let steps=0;while(p.airborne&&steps++<300)sim.playerControlStep({});
assert.ok(!p.airborne&&steps<300);assert.ok(p.jumpReadyTick>sim.tickCount);assert.equal(sim.playerJump().ok,false,'landing recovery cannot be bypassed');

// Kernel cadence and finite water/terrain landings use explicit flat fixtures.
const flat={water:new Uint8Array(400),terrain:{elevation:new Float32Array(400)},idx:(x,y)=>Math.floor(y)*20+Math.floor(x),isPlayable:(x,y)=>x>=0&&y>=0&&x<20&&y<20};
const actor=structuredClone(saved.animals.find(a=>a.id===p.id));actor.x=5.5;actor.y=5.5;actor.jump.altitude=.03;actor.jump.elapsed=0;actor.jump.verticalVelocity=jumpKinematics(actor).lift;
const coarse=structuredClone(actor),fine=structuredClone(actor);
for(let i=0;i<4;i++)stepJump(coarse,flat,1/8);for(let i=0;i<32;i++)stepJump(fine,flat,1/64);
for(const k of ['x','y'])assert.ok(Math.abs(coarse[k]-fine[k])<1e-10,k+' cadence parity');
assert.ok(Math.abs(coarse.jump.altitude-fine.jump.altitude)<1e-10,'analytic arc is cadence independent');
const wild=structuredClone(actor);wild.id=sim.nextId++;wild.player=false;wild.intent='idle';sim.animals=[wild];sim.playerId=null;
const direct=structuredClone(wild);sim.phaseMovement();stepJump(direct,w,1/8,{tick:sim.tickCount,swimmer:sim.canSwim(wild)});
for(const k of ['x','y','jump','airborne','health'])assert.deepEqual(wild[k],direct[k],k+' shared wildlife physics');
flat.water.fill(1);const wet=structuredClone(actor);wet.jump.altitude=.01;wet.jump.verticalVelocity=-1;stepJump(wet,flat,.125);assert.ok(!wet.airborne&&wet.health===actor.health-JUMP.waterDamage,'unsupported water landing injures without rescue');
flat.water.fill(0);const cliff=structuredClone(actor);flat.terrain.elevation.fill(1);stepJump(cliff,flat,.125);assert.ok(!cliff.airborne&&cliff.health<actor.health,'jump cannot pass through rising terrain');

// A modern target-bound pounce uses the same arc and lands before biting.
const hunt=new Simulation('JUMP-POUNCE'),hunter=hunt.player(),hw=hunt.world;
hunter.bodyPlan=makePlan(body.nodes.map(n=>n.socket==='mouth'?{...n,partId:'tearing-jaw'}:n));hunter.age=40;hunter.energy=100;hunter.exertion=100;hunter.health=100;hunter.dir=2;
let origin=null;for(let y=8;y<hw.n-8&&!origin;y++)for(let x=8;x<hw.n-10;x++)if([0,1,2,3,4,5,6].every(k=>!hw.water[hw.idx(x+k,y)])){origin={x:x+.5,y:y+.5};break;}
assert.ok(origin);Object.assign(hunter,origin);
// Explicit flat terrain fixture isolates the strike from landscape selection;
// browser evidence separately uses unmodified generated terrain.
for(let k=0;k<7;k++)hw.terrain.elevation[hw.idx(origin.x+k,origin.y)]=.3;
const target=hunt.animals.find(a=>a.species==='mosskip');target.x=hunter.x+2.2;target.y=hunter.y;
let bites=0;hunt.tryKill=(a,b)=>{assert.equal(b.id,target.id);assert.equal(a.airborne,false,'bite happens after landing');bites++;return true};
assert.equal(hunt.playerCombat.startAttack({pounce:true,targetId:target.id}).type,'pounce-start');
let sawAir=false,checkedPounceSave=false;for(let i=0;i<200&&!bites;i++){
 hunt.playerControlStep({});sawAir||=hunter.aerialMode==='jump';
 if(sawAir&&!checkedPounceSave){
  const fork=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(hunt,{savedAt:'pounce'})));
  fork.playerControlStep({});hunt.playerControlStep({});assert.deepEqual(fork.player(),hunter,'modern pounce clock and arc continue exactly through save');checkedPounceSave=true;
 }
}
assert.ok(sawAir&&checkedPounceSave&&bites===1);assert.ok(hunter.energy<100,'pounce pays actual launch food energy');
assert.equal(cueForResult({ok:true,type:'jump'}),'jump');assert.equal(cueForResult({ok:true,type:'jump-land'}),'land');assert.equal(cueForResult({ok:false,type:'jump-land',water:true}),'splash');
console.log('Jumping PASS: inherited spring anatomy, funded analytic arc, player/wild cadence, airborne restrictions, modern pounce, real landing costs/recovery, exact saves, corrupt/legacy guards, ground contact and audio cues.');
