import assert from 'node:assert/strict';
import {FrameStepper} from '../src/sim/frame-stepper.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {processingCapacity,processingCapacityMessage,setProcessingLoad} from '../src/sim/processing-capacity.js';

const direct=new Simulation('FRAME-PACING-PARITY',{player:true}),paced=new Simulation('FRAME-PACING-PARITY',{player:true});
const controls={right:true};let clock=0,controlCount=0,ecologyCount=0;
const stepper=new FrameStepper({controlHz:CFG.controlHz,simHz:CFG.simHz,budgetMs:2,clock:()=>clock});
const control=hz=>{clock+=1;controlCount++;paced.playerControlStep(controls,hz)};
const ecology=()=>{clock+=8;ecologyCount++;paced.update(controls,{externalPlayerControl:true})};
const first=stepper.advance(3,1,control,ecology);
assert.ok(first.budgetLimited);assert.equal(first.steps,2);assert.equal(first.pendingSeconds,3-2/CFG.controlHz);
assert.ok(stepper.presentationAhead<=1/CFG.controlHz,'queued time must not extrapolate the rendered player arbitrarily far');
setProcessingLoad(paced,first);assert.match(processingCapacityMessage(processingCapacity(paced)),/queued/);
const pending=stepper.pendingSeconds,phase=stepper.substep;
stepper.advance(20,4,control,ecology,{paused:true});
assert.equal(stepper.pendingSeconds,pending,'pause admits no new wall time');assert.equal(stepper.substep,phase);
let frames=1;while(stepper.pendingSeconds>=stepper.stepSeconds){stepper.advance(0,1,control,ecology);assert.ok(++frames<200)}
assert.equal(controlCount,3*CFG.controlHz);assert.equal(ecologyCount,3*CFG.simHz);
for(let i=0;i<3*CFG.controlHz;i++){direct.playerControlStep(controls,CFG.controlHz);if((i+1)%(CFG.controlHz/CFG.simHz)===0)direct.update(controls,{externalPlayerControl:true})}
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'pacing-test'}));
assert.deepEqual(snapshot(paced),snapshot(direct),'yielding changes neither biology, movement, RNG, resources nor history for identical inputs');
stepper.advance(.125,4,control,ecology);const target=controlCount+Math.round(stepper.pendingSeconds*CFG.controlHz);
while(stepper.pendingSeconds>=stepper.stepSeconds)stepper.advance(0,1,control,ecology);
assert.equal(controlCount,target,'speed multiplication retains all scheduled steps');
stepper.reset();assert.equal(stepper.pendingSeconds,0);assert.equal(stepper.substep,0);
assert.throws(()=>stepper.advance(NaN,1,control,ecology));
console.log('frame pacing: budget yield, queued steps, pause/reset, speed, bounded presentation and exact biological parity PASS');
