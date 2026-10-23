import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {FrameStepper} from '../src/sim/frame-stepper.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Day-boundary slicing (creator direction 2026-10-22): the browser may run one
// tick across frames. Pauses read and write nothing, so any schedule of pauses
// gives exactly the world of the atomic tick.
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'t',reason:'sliced'}));
const world=()=>{const s=new Simulation('PLANET-OBS-3',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});s.setPlayerAutonomy(true);return s};
const atomic=world(),sliced=world();let most=0;
for(let t=0;t<CFG.dayTicks*3;t++){
 atomic.update(null);
 let pauses=0;if(!sliced.beginTick(null,{},-Infinity))while(++pauses&&!sliced.continueTick(-Infinity))assert.equal(sliced.tickInProgress,true);
 assert.equal(sliced.tickInProgress,false);most=Math.max(most,pauses);
}
assert.ok(most>20,'the day-boundary tick pauses many times');
assert.deepEqual(snap(sliced),snap(atomic),'fully fragmented ticks equal atomic ticks over three days');

// A save taken mid-tick completes the tick first; update() does too.
const a=world(),b=world();for(let t=0;t<CFG.dayTicks-1;t++){a.update(null);b.update(null)}
assert.equal(b.beginTick(null,{},-Infinity),false,'the day-boundary tick pauses');assert.equal(b.tickInProgress,true);
a.update(null);const saved=snap(b);assert.equal(b.tickInProgress,false);assert.deepEqual(saved,snap(a),'a mid-tick save records the completed tick');
assert.deepEqual(snap(restoreSimulationSnapshot(structuredClone(saved))),saved);
const c=world(),d=world();for(let t=0;t<CFG.dayTicks-1;t++){c.update(null);d.update(null)}
d.beginTick(null,{},-Infinity);d.update(null);c.update(null);c.update(null);assert.deepEqual(snap(d),snap(c),'update() completes a pending tick before its own');
assert.ok(!Object.keys(d).some(k=>/tick(steps|pending)/i.test(k)),'the pending tick is never instance state');

// The stepper resumes a pending tick before anything else, holds control steps
// meanwhile and keeps the unsliced order of control steps and ticks.
{const log=[];let pending=0;const stepper=new FrameStepper({controlHz:8,simHz:8,budgetMs:1e9,sliceMs:5,clock:()=>0});
 const control=()=>log.push('c'),eco=()=>{log.push('tick');pending=2;return false},resume=()=>{log.push('resume');return--pending===0};
 let r=stepper.advance(.5,1,control,eco,{resume});assert.deepEqual(log,['c','tick']);assert.equal(r.tickPending,true);assert.equal(r.steps,1);
 r=stepper.advance(.5,1,control,eco,{resume});assert.deepEqual(log,['c','tick','resume']);assert.equal(r.steps,0,'no control step while a tick is pending');
 r=stepper.advance(0,1,control,()=>{log.push('tick2');return true},{resume});assert.deepEqual(log.slice(3),['resume','c','tick2','c','tick2','c','tick2','c','tick2','c','tick2','c','tick2','c','tick2']);
 assert.equal(r.tickPending,false);
 const paused=new FrameStepper({controlHz:8,simHz:8,clock:()=>0});paused.tickPending=true;let resumed=0;paused.advance(.1,1,()=>{},()=>true,{paused:true,resume:()=>{resumed++;return true}});assert.equal(resumed,1,'a started tick completes even while paused');}
console.log('Sliced ticks PASS: any pause schedule equals the atomic tick, mid-tick saves and update() complete it first, it never enters saves, and the stepper keeps order and holds control steps.');
