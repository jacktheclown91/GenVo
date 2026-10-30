import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {thermalExpressionSignal,ThermalPresentation,applyThermalExpression} from '../src/render/thermal-expression.js';
import {thermalSiteDemand} from '../src/ecology/thermal-refuge.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {starterPlan,attachPart} from '../tools/creature-lab/assembly-model.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {behaviorVisualState} from '../src/render/behavior.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';

const sim=new Simulation('THERMAL-PRESENTATION'),a=sim.player();
// Explicit physical fixture only; native observation uses untouched weather/cells.
sim.world.temperature.fill(-.25);a.genes.climate=1;
const snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'thermal-readonly'}))),before=snap(),rng=sim.rng.state;
sim.exposure.snapshot=()=>{throw Error('Rendering cannot initialize weather state');};sim.exposure.state=sim.exposure.snapshot;
const signal=thermalExpressionSignal(sim,a);assert.equal(signal.kind,'cold');assert.equal(signal.thermal,thermalSiteDemand(sim,a).thermal);
const tracker=new ThermalPresentation(),cold=tracker.sample(sim,a,.31);assert.ok(cold.bodyDrop>0);assert.equal(cold.bodySway,0,'no thermogenic shiver without actual heat-producing anatomy');
const actor={...a,bodyPlan:makePlan([...a.bodyPlan.nodes,{id:'heat',partId:'endothermic-core',parent:'root',socket:'flank.right'},{id:'coat',partId:'fur-mantle',parent:'root',socket:'dorsal'}])};
assert.equal(thermalExpressionSignal(sim,actor).thermogenic,true);const shivers=Array.from({length:120},(_,i)=>tracker.sample(sim,actor,i/60)?.bodySway||0);assert.ok(shivers.some(v=>v>.01)&&shivers.some(v=>v<-.01));assert.ok(shivers.every(v=>Math.abs(v)<=.22));
assert.deepEqual(tracker.sample(sim,actor,.9),tracker.sample(sim,actor,.9),'frozen presentation time preserves the exact pose');
for(const key of ['torpor','bracing','attackAction','courtshipPerformance','airborne','climb','caveTransit','burrowWork','perched','underground'])assert.equal(new ThermalPresentation().sample(sim,{...a,[key]:true},1),null,key+' keeps priority or unsupported geometry');
for(const action of ['eat','crack','court','fly','glide','jump','climb','dig','flee','stalk','hunt','drink'])assert.equal(tracker.sample(sim,a,1,{action}),null);
assert.equal(tracker.sample(sim,a,1,{blocked:true}),null);
const walk=tracker.sample(sim,actor,.31,{action:'forage',moving:true});assert.equal(walk.bodySway,0,'working locomotion never shivers');assert.ok(walk.bodyDrop<cold.bodyDrop);
const slots=[2,6,10,14].map(slot=>({slot,reach:1,gait:{stride:1,lift:1}}));let contacts=0;
for(let dir=0;dir<8;dir++)for(let i=0;i<120;i++){
 const behavior=behaviorVisualState({action:'idle',phase:0}),base=genvoVisualPose({dir,legSlots:slots,behavior:structuredClone(behavior)});applyThermalExpression(behavior,tracker.sample(sim,actor,i/60));const altered=genvoVisualPose({dir,legSlots:slots,behavior});
 assert.deepEqual(altered.legs,base.legs,'thermal posture leaves support geometry exact');assert.equal(altered.bodyW,base.bodyW);assert.equal(altered.bodyH,base.bodyH);contacts+=altered.legs.length;
}
assert.equal(snap(),before);assert.equal(sim.rng.state,rng,'no simulation RNG or controller state changes');
sim.world.temperature.fill(1.2);sim.tickCount++;assert.equal(tracker.sample(sim,a,2).kind,'heat');assert.equal(tracker.sample(sim,a,2).bodySway,0);
const comfortable={...a,genes:{...a.genes,climate:1.2/.55}};assert.equal(thermalExpressionSignal(sim,comfortable),null,'inherited comfort can remove the actual demand');
sim.world.temperature.fill(.55);sim.tickCount++;assert.equal(tracker.sample(sim,a,3),null,'no invented thermal expression in comfort');
const plan=attachPart(starterPlan('small-torso'),'root','dorsal','fur-mantle'),bare={...a,bodyPlan:starterPlan('small-torso')};sim.world.temperature.fill(.1);const furred={...a,bodyPlan:plan};assert.ok(thermalSiteDemand(sim,furred).thermal<thermalSiteDemand(sim,bare).thermal,'actual covering changes thermal presentation strength');
console.log('Thermal expression PASS: canonical demand, real thermogenic anatomy, heat/cold/comfort, inherited insulation, action priority, frozen clock, '+contacts+' exact support contacts, unchanged full snapshot/RNG and no exposure-state calls.');

assert.ok(tracker.sample(sim,bare,4,{action:'move',moving:false}),'ordinary player intent maps to move even while stationary');
const scope=new ThermalPresentation();assert.ok(scope.sample(sim,bare,4));bare.perched=true;assert.equal(scope.sample(sim,bare,4),null,'scope changes invalidate cached surface presentation immediately');
