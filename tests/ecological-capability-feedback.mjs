import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan,recombineBodyPlans} from '../src/lineage/body-inheritance.js';
import {RNG} from '../src/core/rng.js';
import {JUMP} from '../src/lineage/jumping.js';
import {VISION} from '../src/lineage/vision.js';
import {inheritedCapabilityChanges} from '../src/ui/inherited-capabilities.js';
import {EffectFeedbackController} from '../src/ui/effect-feedback.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('ECOLOGICAL-CAPABILITY-FEEDBACK',{player:true});
const parent=sim.player();
const context={jumpingRules:JUMP.policy,visionRules:VISION.policy};
assert.deepEqual(inheritedCapabilityChanges(context,parent,parent),[],'Successful unchanged bodies need no upgrade message');
// Controlled parental bodies, canonical recombination. This proves inherited
// routes and their explanations, not naturally selected or paid-field emergence.
const variants=[
  founderPlan().nodes.map(n=>({...n,partId:n.partId==='walking-leg'?'webbed-leg':n.partId})),
  founderPlan().nodes.map(n=>({...n,partId:n.partId==='walking-leg'?'spring-leg':n.partId})),
  [...founderPlan().nodes,{partId:'fur-mantle',parent:'root',socket:'dorsal'}],
  founderPlan().nodes.map(n=>({...n,partId:n.partId==='grazing-mouth'?'tearing-jaw':n.partId})),
  founderPlan().nodes.map(n=>({...n,partId:n.partId==='simple-eye'?'telescopic-eye':n.partId}))
];
const inherited=[];
for(let i=0;i<variants.length;i++){
  const body=makePlan(variants[i]);
  assert.ok(validatePlan(body).ok,validatePlan(body).errors.join('; '));
  const plan=recombineBodyPlans(new RNG('CAPABILITY-'+i),body,body);
  assert.ok(validatePlan(plan).ok,validatePlan(plan).errors.join('; '));
  const child={...parent,id:10000+i,bodyPlan:plan};
  const text=inheritedCapabilityChanges(context,parent,child).join(' ');
  assert.ok(text.length,'Canonical recombination carries a meaningful capability difference');
  inherited.push(text);
}
assert.match(inherited[0],/swimming/);assert.match(inherited[1],/jumping/);
assert.match(inherited[2],/less heat loss.*more heat strain/,'Insulation is a tradeoff');
assert.match(inherited[3],/cannot use/,'Mouth change can lose a feeding strategy');
assert.match(inherited[4],/eyes/);
const oneLeg={...parent,bodyPlan:makePlan(founderPlan().nodes.map((n,i)=>({...n,partId:i===1?'spring-leg':n.partId})))};
assert.ok(!inheritedCapabilityChanges(context,parent,oneLeg).some(t=>t.includes('jumping')),'A single spring leg is not a jump ability');
assert.ok(!inheritedCapabilityChanges({},parent,{...parent,bodyPlan:makePlan(variants[1])}).some(t=>t.includes('jumping')),'Historical rules cannot promise new movement');
// Presentation must preserve the entire real simulation, not just RNG.
const before=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'feedback'}));
for(let i=0;i<10;i++)inheritedCapabilityChanges(context,parent,parent);
assert.deepEqual(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'feedback'}),before);
const feedback=new EffectFeedbackController(sim);
sim.exposure.snapshot=()=>null;sim.stalkerTerritory.playerStatus=()=>null;
const index=sim.world.idx(parent.x,parent.y);sim.world.temperature[index]=-.1;
const cold=feedback.observe();assert.match(cold?.message||'',/Cold is adding/);
assert.equal(feedback.observe(),null,'No redundant repeated alert');
const observed=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'climate-feedback'}));
new EffectFeedbackController(sim).observe();
assert.deepEqual(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'climate-feedback'}),observed,'Climate explanation is read-only');
sim.uiTutorialRules='test-onboarding';sim.uiTutorialStage='step-food';
assert.equal(new EffectFeedbackController(sim).observe(),null,'The survival lesson keeps its single primary instruction');
sim.uiTutorialStage='done';
assert.match(new EffectFeedbackController(sim).observe()?.message||'',/Cold is adding/);
sim.world.temperature[index]=1.2;
assert.match(feedback.observe()?.message||'',/Heat is adding/);
assert.equal(feedback.observe(),null,'Heat cooldown also suppresses redundant alerts');
sim.stalkerTerritory.playerStatus=()=>({known:true,inside:true,siteId:42});
assert.match(new EffectFeedbackController(sim).observe()?.message||'',/Known Stalker territory/,'Observed danger keeps priority over habitat advice');


console.log('Ecological capability feedback PASS: canonical inherited movement, mouth, thermal tradeoffs and eyes; stable/partial/historical negatives, exact read-only state, actual cold and cooldown.');
