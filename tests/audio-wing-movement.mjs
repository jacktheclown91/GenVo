import assert from 'node:assert/strict';
import {WingMovementTracker} from '../src/audio/wing-movement.js';
import {aerialCycle,aerialPose} from '../src/render/aerial-presentation.js';
import {starterPlan,attachPart} from '../tools/creature-lab/assembly-model.js';
import {AudioDirector} from '../src/audio/audio.js';
import {acousticDimensions} from '../src/audio/movement-contact.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const plan=attachPart(starterPlan('light-torso'),'root','dorsal','flight-wing'),p={id:1,species:'genvo',alive:true,age:32,x:0,y:0,airborne:true,bodyPlan:plan},sim={world:{},animals:[p],player:()=>p},tracker=new WingMovementTracker();
assert.deepEqual(tracker.sample(sim,0),[]);let count=0;
for(let t=.04;t<4;t+=.04){const beats=tracker.sample(sim,t);count+=beats.length;if(beats.length){const phase=((aerialCycle(p.id,t)%8)+8)%8;assert.ok(phase>=1.6&&phase<2.1,'stroke onset follows the shared painted power cycle');assert.ok(aerialPose({phase}).flightSpread>.4)}}assert.ok(count>=4&&count<=5);
for(const key of ['perched','underground','climb','caveTransit','burrowWork','hidden']){p[key]=true;assert.deepEqual(tracker.sample(sim,4.1),[]);delete p[key]}
for(const mode of ['glide','jump']){p.aerialMode=mode;for(let t=5;t<6;t+=.05)assert.deepEqual(tracker.sample(sim,t),[])}delete p.aerialMode;
p.airborne=false;assert.deepEqual(tracker.sample(sim,6),[]);p.airborne=true;assert.deepEqual(tracker.sample(sim,6.1),[]);assert.deepEqual(tracker.sample(sim,100),[],'long interruptions prime instead of replaying stale strokes');
sim.paused=true;assert.deepEqual(tracker.sample(sim,101),[]);sim.paused=false;assert.deepEqual(tracker.sample(sim,102),[]);
p.bodyPlan=starterPlan();for(let t=102;t<103;t+=.05)assert.deepEqual(tracker.sample(sim,t),[],'airborne state alone cannot grant wing anatomy');p.bodyPlan=plan;
sim.animals=Array.from({length:100},(_,i)=>({...p,id:100+i,x:1+i*.01}));sim.animals.push(p);for(let t=104;t<106;t+=.04){assert.ok(tracker.sample(sim,t).length<=2);assert.ok(tracker.states.size<=6)}
const real=new Simulation('WING-AUDIO-READS',{player:true}),snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(real,{savedAt:'wing-audio'}))),before=snapshot();for(let t=0;t<2;t+=.04)tracker.sample(real,t);assert.equal(snapshot(),before);
const audio=new AudioDirector(null);assert.equal(audio.playWingStroke(acousticDimensions(p)),false);const route={},routes=[];audio.ctx={currentTime:1};audio.unlocked=true;audio.noise=(...args)=>routes.push(args.at(-1));assert.equal(audio.playWingStroke(acousticDimensions(p),route),true);assert.deepEqual(routes,[route,route]);
console.log('Wing audio PASS: painted power-cycle timing, no glide/jump/display/absent-anatomy sound, interruption/identity gating, bounded crowds, spatial layers and exact biological state.');
