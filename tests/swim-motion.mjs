import assert from 'node:assert/strict';
import {SwimMotionPresentation,applySwimMotion} from '../src/render/swim-motion.js';
import {INERTIA,planMotion,commitMotion} from '../src/organisms/motion.js';
import {swimmingLimb} from '../src/render/swimming-limbs.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {starterPlan} from '../tools/creature-lab/assembly-model.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const world={water:new Uint8Array([1]),idx:()=>0},sim={world,inertiaRules:INERTIA.policy,tickCount:0};
let cases=0;
for(const rootId of ['small-torso','long-torso','dome-torso'])for(const size of [.5,1,2])for(let dir=0;dir<8;dir++){
 const base=starterPlan(rootId),bodyPlan=makePlan(base.nodes.map((n,i)=>n.socket?.startsWith('limb.')?{...n,partId:i%3===0?'walking-leg':'webbed-leg'}:n));
 const a={id:cases+1,alive:true,player:true,species:'genvo',bodyPlan,dir,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]}},angle=(dir-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle);
 commitMotion(a,planMotion(a,fx*1.4,fy*1.4,1,{swimming:true}));
 const options={action:'swim',moving:true},straight=new SwimMotionPresentation();assert.equal(straight.sample(sim,a,0,options),null);
 commitMotion(a,planMotion(a,-fy*1.4,fx*1.4,.08,{swimming:true}));
 const saved=JSON.stringify(a),tracker=new SwimMotionPresentation(),turn=tracker.sample(sim,a,0,options);
 assert.ok(turn.steer>0&&turn.steer<=1&&turn.brake>=0&&turn.brake<=1);
 const behavior={};applySwimMotion(behavior,turn);const slots=assemblyFor(a).legSlots;
 for(let phase=0;phase<8;phase+=.5){const pose=genvoVisualPose({dir,frame:phase,action:'swim',moving:true,behavior,legSlots:slots});assert.equal(pose.legs.length,slots.length);assert.ok(pose.legs.every(l=>!l.planted&&Number.isFinite(l.foot.x)&&Number.isFinite(l.knee.y)))}
 assert.deepEqual(tracker.sample({...sim,paused:true},a,.1,options),turn,'paused posture remains exact');
 commitMotion(a,planMotion(a,0,0,.03,{swimming:true}));const braking=new SwimMotionPresentation().sample(sim,a,0,options);assert.ok(braking.brake>.9);
 assert.equal(tracker.sample(sim,a,.2,{...options,moving:false}),null);assert.equal(tracker.states.size,0);
 for(const extra of [{action:'move'},{action:'eat'},{blocked:true}])assert.equal(tracker.sample(sim,a,.3,{...options,...extra}),null);
 assert.equal(tracker.sample({world,tickCount:0},a,0,options),null,'legacy worlds retain existing strokes');
 const still={...a,motion:{schema:1,vx:0,vy:0,ax:0,ay:0}};assert.equal(tracker.sample(sim,still,0,options),null);
 assert.equal(JSON.stringify({...a,motion:JSON.parse(saved).motion}),saved,'sampling and pose articulation change no organism field');cases++;
}
const props={phase:0,moving:true,partId:'webbed-leg',front:0,root:{x:0,y:0},forward:{x:1,y:0},perp:{x:0,y:1}};
const stroke=(side,steer,phase=0,brake=0)=>swimmingLimb({...props,side,steer,phase,brake,radial:{x:0,y:side}});
assert.ok(Math.abs(stroke(-1,1).foot.x)>Math.abs(stroke(1,1).foot.x),'outer bank rows farther during the real turn');
for(let phase=0;phase<8;phase+=.01){
 const a=stroke(1,1,phase),b=stroke(-1,-1,phase);assert.ok(Math.abs(a.foot.x-b.foot.x)<1e-9&&Math.abs(a.foot.y+b.foot.y)<1e-9,'opposite turns mirror across the body');
}
for(const steer of [-1,0,1])for(const brake of [0,.5,1])for(const boundary of [0,8*.44-1.2,8]){const a=stroke(1,steer,boundary-1e-5,brake),b=stroke(1,steer,boundary+1e-5,brake);assert.ok(Math.hypot(a.foot.x-b.foot.x,a.foot.y-b.foot.y)<1e-3)}
const actor={id:1,alive:true,bodyPlan:starterPlan(),motion:{schema:1,vx:1,vy:0,ax:0,ay:3}},tracker=new SwimMotionPresentation({maxStates:8});for(let id=0;id<30;id++)tracker.sample(sim,{...actor,id},0,{action:'swim',moving:true});assert.equal(tracker.states.size,8);tracker.prune(3);assert.equal(tracker.states.size,0);
const settling=new SwimMotionPresentation();assert.ok(settling.sample(sim,actor,0,{action:'swim',moving:true}));const cruising={...actor,motion:{schema:1,vx:1,vy:0,ax:0,ay:0}};let settled;for(let t=.05;t<1;t+=.05)settled=settling.sample(sim,cruising,t,{action:'swim',moving:true});assert.equal(settled,null,'constant travel sheds the previous turn pose rather than rowing unevenly forever');
const real=new Simulation('SWIM-MOTION-READS',{player:true,metabolism:true,inertia:true}),snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(real,{savedAt:'swim-motion'}))),before=snapshot();for(const a of real.animals)tracker.sample(real,a,0,{action:'swim',moving:true});assert.equal(snapshot(),before);
// Positive controlled read as well as neutral reads must preserve the whole graph.
const wet=real.player();real.world.water[real.world.idx(wet.x,wet.y)]=1;commitMotion(wet,planMotion(wet,1.4,0,1,{swimming:true}));commitMotion(wet,planMotion(wet,0,1.4,.08,{swimming:true}));const activeBefore=snapshot();assert.ok(tracker.sample(real,wet,0,{action:'swim',moving:true}));assert.equal(snapshot(),activeBefore);
console.log('Swim motion PASS: '+cases+' body/size/facing cases, committed turn/braking signals, differential/mirrored continuous strokes, pause/stop/action/legacy gates, bounded history and full biological graph purity.');
