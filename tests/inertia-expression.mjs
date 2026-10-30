import assert from 'node:assert/strict';
import {InertiaExpression,applyInertiaExpression} from '../src/render/inertia-expression.js';
import {planMotion,commitMotion,INERTIA} from '../src/organisms/motion.js';
import {studyCreatures} from '../tools/art-resolution/specimens.mjs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
let cases=0;
for(const animal of studyCreatures())for(let dir=0;dir<8;dir++){
 const a={...animal,player:true,dir},sim={world:{},inertiaRules:INERTIA.policy},angle=(dir-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),tracker=new InertiaExpression();
 commitMotion(a,planMotion(a,fx*2.15,fy*2.15,.1));const before=JSON.stringify(a),start=tracker.sample(sim,a,0,{dir});assert.ok(start.lean>.6&&Math.abs(start.sway)<1e-10);assert.equal(JSON.stringify(a),before);
 commitMotion(a,planMotion(a,0,0,.05));let braking;for(let t=.05;t<=.3;t+=.05)braking=tracker.sample(sim,a,t,{dir});assert.ok(braking.lean<0&&braking.drop>0,'braking shifts support backward and yields the body');
 const paused={...sim,paused:true};assert.deepEqual(tracker.sample(paused,a,.4,{dir}),braking,'pause freezes exact posture');
 a.motion={schema:1,vx:fx*2.15,vy:fy*2.15,ax:0,ay:0};commitMotion(a,planMotion(a,-fy*2.15,fx*2.15,.1));const turn=new InertiaExpression().sample(sim,a,0,{dir});assert.ok(turn.sway>0&&turn.twist<0&&turn.tail<0,'head/tail follow-through opposes the actual turn load');
 a.motion={schema:1,vx:fx*2.15,vy:fy*2.15,ax:0,ay:0};let settle;for(let t=.45;t<1.5;t+=.05)settle=tracker.sample(sim,a,t,{dir});assert.equal(settle,null,'constant velocity carries no persistent invented acceleration pose');
 assert.equal(tracker.sample(sim,a,2,{dir,blocked:true}),null);for(const action of ['eat','court','climb','dig','fly','glide','swim'])assert.equal(tracker.sample(sim,a,2,{action}),null);
 assert.equal(tracker.sample({world:sim.world},a,2,{dir}),null,'old kinematic worlds stay on their exact current paint path');cases++;
}
const a={...studyCreatures()[0],motion:{schema:1,vx:1,vy:0,ax:5,ay:3}},sim={world:{},inertiaRules:INERTIA.policy},tracker=new InertiaExpression({maxStates:16});for(let id=0;id<100;id++)tracker.sample(sim,{...a,id},0);assert.equal(tracker.states.size,16);tracker.prune(3);assert.equal(tracker.states.size,0);
const behavior={bodyLean:.2,bodySway:0,tailSweep:1};applyInertiaExpression(behavior,{lean:.5,sway:.2,twist:-.1,roll:.1,tail:-.2,drop:.15});assert.equal(behavior.bodyLean,.7);assert.equal(behavior.tailSweep,.8);assert.ok(!('stanceSpread' in behavior),'no foot geometry parameter is changed');
const real=new Simulation('INERTIA-PAINT-READS',{player:true,metabolism:true,inertia:true}),snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(real,{savedAt:'inertia-paint'}))),before=snapshot();for(const actor of real.animals)tracker.sample(real,actor,0);assert.equal(snapshot(),before);
console.log('Inertia expression PASS: '+cases+' real-body/facing cases, canonical acceleration/braking/turn signs, settle, action priorities, pause, legacy identity, bounded history and full biological parity.');
