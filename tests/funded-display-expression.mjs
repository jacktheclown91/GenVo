import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {performCourtship} from '../src/reproduction/courtship-performance.js';
import {EncounterPresentation} from '../src/render/encounter-expression.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('FUNDED-DORSAL-DISPLAY'),a=sim.player(),b=sim.animals.find(x=>x.id!==a.id&&x.species===a.species);
applyLineageTarget(a,makePlan([...founderPlan().nodes,{partId:'signal-crest',parent:'root',socket:'dorsal'}]));
for(const x of [a,b])Object.assign(x,{age:40,energy:90,hydration:100,health:100,pregnant:null,reproCooldown:0,infected:false,parentIds:[],intent:'idle',target:null});
b.x=a.x+.7;b.y=a.y;b.sex=a.sex==='M'?'F':'M';
a.intent='mate';a.target=b;a.queuedCourtshipSequence=['flare'];sim.rebuildSpatial();
assert.equal(performCourtship(sim,a,b),false,'The controller starts a paid performance before returning completion');assert.deepEqual(a.courtshipPerformance.sequence,['flare']);assert.ok(a.courtshipPerformance.energySpent>0);
const spent=a.energy,before=createSimulationSnapshot(sim),presentation=new EncounterPresentation();
const original=Object.getOwnPropertyDescriptor(b,'matePreferences');Object.defineProperty(b,'matePreferences',{configurable:true,get(){throw Error('Presentation may not read hidden preferences')}});
presentation.beginFrame(sim,0);assert.equal(presentation.sample(sim,a).crestSpread,0);
let previous=0;
for(let now=50;now<=600;now+=50){presentation.beginFrame(sim,now);const pose=presentation.sample(sim,a);assert.equal(pose.move,'flare');assert.ok(pose.crestSpread>0&&pose.crestSpread<=.7);previous=pose.crestSpread;}
sim.paused=true;presentation.beginFrame(sim,1200);assert.equal(presentation.sample(sim,a).crestSpread,previous,'Paused opening holds exactly');sim.paused=false;
if(original)Object.defineProperty(b,'matePreferences',original);else delete b.matePreferences;
const after=createSimulationSnapshot(sim);after.savedAt=before.savedAt;after.meta.savedAt=before.meta.savedAt;assert.deepEqual(after,before,'Presentation leaves biology, reserves, preferences and RNG unchanged');
sim.reproduction.cancelCourtship();assert.equal(a.energy,spent,'Stopping does not refund paid display');
for(let now=1250;now<=2400;now+=50){presentation.beginFrame(sim,now);const pose=presentation.sample(sim,a);assert.equal(pose.move,null);assert.ok(pose.crestSpread<=previous,'Interrupted display must only settle, never restart');previous=pose.crestSpread;}
assert.equal(previous,0);assert.equal(a.energy,spent);
console.log('Actual funded flare eases open, pauses exactly, settles on cancellation; hidden preferences, save state, costs and RNG preserved PASS');
