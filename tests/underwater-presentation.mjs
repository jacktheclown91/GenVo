import assert from 'node:assert/strict';
import {underwaterView,submergedActorOpacity,showDiveSurfaceCue,drawUnderwaterView} from '../src/render/underwater-presentation.js';
import {DIVING} from '../src/lineage/diving.js';
import {SURFACE_ICE} from '../src/world/surface-ice.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';

const actor={x:.5,y:.5,diveDepth:.45},surface={...actor,diveDepth:0};
const world={idx:()=>0,isPlayable:()=>true,water:new Uint8Array([1]),environment:{schema:3,volume:new Float64Array([1]),icePolicy:SURFACE_ICE.policy,ice:new Float64Array([0]),iceBroken:new Uint8Array([0])}};
const sim={world,divingRules:DIVING.policy,player:()=>actor};
const before=JSON.stringify({actor,world});
assert.equal(underwaterView(sim).depth,.45);
assert.equal(submergedActorOpacity(actor,actor),.96);
assert.equal(submergedActorOpacity(surface,actor),.55,'surface observer preserves preceding submerged opacity');
assert.equal(submergedActorOpacity(actor,surface),1,'surface creature is not made transparent');
assert.ok(submergedActorOpacity(actor,{...actor,diveDepth:.8})<.96);
assert.equal(submergedActorOpacity(actor,{...actor,diveDepth:2}),.55);
assert.equal(showDiveSurfaceCue(actor,actor),false,'no surface ellipse around an underwater neighbour');
assert.equal(showDiveSurfaceCue(surface,actor),true,'surface retains existing location cue');
assert.equal(showDiveSurfaceCue(surface,surface),false);
const states=[],ops=[],ctx={fillStyle:'old',globalAlpha:.7,save(){states.push([this.fillStyle,this.globalAlpha])},restore(){[this.fillStyle,this.globalAlpha]=states.pop()},fillRect(...rect){ops.push({rect,color:this.fillStyle,alpha:this.globalAlpha})}};
assert.equal(drawUnderwaterView({sim,ctx,w:1200,h:800}),true);
assert.equal(ops.length,2);
assert.equal(ctx.fillStyle,'old');
assert.equal(ctx.globalAlpha,.7);
assert.equal(JSON.stringify({actor,world}),before,'presentation never changes depth or water');
const shallow=underwaterView(sim).strength;
actor.diveDepth=.8;
assert.ok(underwaterView(sim).strength>shallow);
world.environment.ice[0]=.1;
assert.equal(underwaterView(sim).covered,true);
world.environment.iceBroken[0]=1;
assert.equal(underwaterView(sim).covered,false);
for(const observer of [surface,{...actor,underground:true}]){
  assert.equal(underwaterView({...sim,player:()=>observer}),null);
}
assert.equal(underwaterView({...sim,divingRules:undefined}),null,'old worlds receive no new viewing mode');
world.environment.volume[0]=0;world.environment.ice[0]=0;
assert.equal(underwaterView(sim),null,'no invented liquid column');
const real=new Simulation('UNDERWATER-PRESENTATION-READS',{player:true,worldGenerator:'planetary/1'});
const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(real,{savedAt:'underwater-view'})));
const saved=snapshot();
underwaterView(real);drawUnderwaterView({sim:real,ctx,w:1200,h:800});
for(const animal of real.animals){submergedActorOpacity(real.player(),animal);showDiveSurfaceCue(real.player(),animal)}
assert.equal(snapshot(),saved,'complete actual saved graph remains exact');
console.log('Underwater presentation PASS: depth/ice/legacy/zero-water exclusions, same-depth readability, surface cues preserved, canvas state restored and complete simulation graph exact.');
