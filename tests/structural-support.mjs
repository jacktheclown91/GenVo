// structural-support/1 (morphology S3): limb stress from the anatomy's own load
// over its load-bearing leg tissue, times inherited size and growth. Overloaded
// bodies lose sprint, acceleration and economy continuously; impacts injure by
// stress; stronger support anatomy improves the outcome (Scenario B); anatomies
// that cannot carry themselves are refused with an explanation; worlds without
// the rule are unchanged.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {createDraft,draftProblems} from '../src/lineage/evolution-draft.js';
import {STRUCTURAL_SUPPORT,planSupport,stressIndex,structuralLimits,structuralSpeed,structuralProblem,structuralViability} from '../src/organisms/structural-support.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const close=(x,y,label,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
const sized=(a,s)=>{a.bodySize={schema:1,alleles:[Math.log(s),Math.log(s)]};return a};
const withLegs=(plan,partId)=>makePlan(plan.nodes.map(n=>({partId:/^root\/limb\.\d+$/.test(n.id)?partId:n.partId,parent:n.parent,socket:n.socket})),{headMode:plan.headMode});
const rules={structuralSupportRules:STRUCTURAL_SUPPORT.policy};

// 1. The founder anatomy at reference size is the unit; heavier bodies and lighter legs raise stress.
const founder=founderPlan();
{
 const s=planSupport(founder);assert.equal(s.legs,4);close(s.anatomicalStress,1,'founder anatomy is the unit');
 const sturdy=planSupport(withLegs(founder,'sturdy-leg')),runner=planSupport(withLegs(founder,'runner-leg'));
 assert.ok(sturdy.anatomicalStress<1&&runner.anatomicalStress>1,'more leg tissue carries the same body at lower stress');
 // Every anatomy currently living in a new world sits inside the comfortable range at reference size.
 const sim=new Simulation('STRUCTURE-SURVEY',{player:true,dayClock:true,metabolism:true});
 const stresses=sim.animals.filter(a=>a.bodyPlan).map(a=>planSupport(a.bodyPlan).anatomicalStress);
 assert.ok(Math.max(...stresses)<=STRUCTURAL_SUPPORT.comfort+.05&&Math.min(...stresses)>.8,`existing anatomies ${Math.min(...stresses).toFixed(2)}-${Math.max(...stresses).toFixed(2)}`);
}
// 2. Stress grows with inherited size and growth; limits follow the safety-factor anchors.
{
 const a={species:'genvo',bodyPlan:founder};
 close(stressIndex(a),1,'reference adult');close(stressIndex(sized({...a},2)),2,'2x body');close(stressIndex(a,.5),.5,'half-grown juvenile');
 const at=sigma=>structuralLimits(rules,sized({species:'genvo',bodyPlan:founder},sigma));
 assert.deepEqual({...at(1.5),stress:0,impact:0},{stress:0,acceleration:1,walk:1,sprint:1,cost:1,impact:0},'comfortable bodies are unaffected');
 const two=at(2);close(two.acceleration,.75,'accel at sigma 2');close(two.sprint,2/3,'sprint gain at sigma 2');close(two.walk,1,'walk at sigma 2');close(two.cost,4/3,'cost at sigma 2');close(two.impact,2,'impact at sigma 2');
 const heavy=structuralLimits(rules,sized({species:'genvo',bodyPlan:founder},2),{growth:1.75});
 close(heavy.stress,3.5,'beyond yield');assert.equal(heavy.sprint,0,'no sprint beyond yield');close(heavy.walk,3/3.5,'walking slows beyond yield');
 close(structuralSpeed(two,1.55),(1+.55*2/3)/1.55,'sprint speed keeps two thirds of its gain');
 assert.equal(structuralSpeed(structuralLimits(null,a),1.55),1,'no rule: no change');
 const swim=structuralLimits(rules,sized({species:'genvo',bodyPlan:founder},2),{swimming:true});assert.equal(swim.sprint,1,'water carries the body');close(swim.impact,2,'impacts still scale');
}
// 3. Scenario B in the world: a 2x founder sprints slower and less economically than a reference
// body; replacing its legs with sturdier legs restores most of the sprint.
{
 const sim=new Simulation('STRUCTURE-WORLD',{player:true,dayClock:true,metabolism:true,bodySize:true,structuralSupport:true}),w=sim.world;
 assert.equal(sim.structuralSupportRules,STRUCTURAL_SUPPORT.policy);
 w.water.fill(0);w.buildLandRegions();w.buildHydrology();const p=sim.player();sim.animals=[p];sim.rebuildSpatial();
 const sprint=(scale,plan)=>{Object.assign(p,{x:30.5,y:30.5,energy:80,health:100,age:SPECIES[p.species].maturity,bodyPlan:plan,exertion:100,exertionWinded:false});sized(p,scale);const e=p.energy;sim.phasePlayerMovement({right:true,sprint:true});return{d:p.x-30.5,cost:e-p.energy}};
 const ref=sprint(1,founder),big=sprint(2,founder),braced=sprint(2,withLegs(founder,'sturdy-leg'));
 assert.ok(ref.d>0);
 close(sprint(1,founder).d,ref.d,'deterministic step');
 assert.ok(big.d<ref.d,'an overloaded 2x body sprints slower than a reference body');
 assert.ok(braced.d>big.d&&braced.d<=ref.d+1e-9,'sturdier legs restore most of the sprint (compatible support improves the outcome)');
 const v=structuralViability(sim,sized({species:'genvo',bodyPlan:founder},2));
 assert.equal(v.state,'strained');assert.ok(v.reasons.some(r=>/Sprint limited/.test(r))&&v.reasons.some(r=>/Accelerates/.test(r)),'explained');
 assert.equal(structuralViability(sim,sized({species:'genvo',bodyPlan:founder},1)).state,'sound');
 // Saves keep the rule; an unknown rule is refused.
 const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'structure'}));
 assert.equal(restoreSimulationSnapshot(structuredClone(snap)).structuralSupportRules,STRUCTURAL_SUPPORT.policy);
 snap.core.structuralSupportRules='structural-support/9';assert.throws(()=>restoreSimulationSnapshot(snap),/structural support/);
 assert.throws(()=>new Simulation('STRUCTURE-BAD',{player:true,structuralSupport:'x'}),/Unknown structural support/);
}
// 4. Impacts: a fall from a failing climb injures in proportion to stress.
{
 const sim=new Simulation('STRUCTURE-FALL',{player:true,dayClock:true,metabolism:true,bodySize:true,structuralSupport:true}),a=sim.animals.find(x=>x.alive&&!x.player);
 const {stepClimb}=await import('../src/lineage/climbing.js');
 const hurt=(scale,plan)=>{Object.assign(a,{health:100,perched:true,age:SPECIES[a.species].maturity,bodyPlan:plan,climb:{schema:1,height:2,target:3,x:a.x,y:a.y,elapsed:0}});sized(a,scale);const r=stepClimb(sim,a,.1);return r?.type==='climb-fall'?r.damage:null};
 const one=hurt(1,founder),two=hurt(2,founder),light=hurt(1,withLegs(founder,'runner-leg'));
 assert.ok(one>0);close(two,one*2,'twice the stress, twice the injury');close(light/one,planSupport(withLegs(founder,'runner-leg')).anatomicalStress,'lighter legs land harder');
}
// 5. Development: an anatomy beyond yield is refused, with an explanation, only in worlds with the rule.
{
 const plan={nodes:[{id:'root',partId:'barrel-torso'},...[1,3,5,7].map(i=>({id:`root/limb.${i}`,partId:'runner-leg'})),...Array.from({length:14},(_,i)=>({id:`root/flank.${i}`,partId:'armor-plate'}))]};
 assert.match(structuralProblem(plan),/could not bear its own movement/);assert.equal(structuralProblem(founder),null);
 // The heaviest anatomy the registry can build today (all sockets loaded on a barrel or long torso) stays below yield at reference size.
 const heaviest=Math.max(...Object.values(PARTS).filter(p=>p.tags.includes('torso')).map(t=>{let body=t.mass+4*.35;for(const s of t.providedSockets){if(s.type==='limb')continue;const m=Math.max(0,...Object.values(PARTS).filter(p=>p.compatibleSocketTypes.includes(s.type)&&!p.tags.includes('exclusive')).map(p=>p.mass));body+=m}return body/1.4/(5/1.6)}));
 assert.ok(heaviest<STRUCTURAL_SUPPORT.yield,`heaviest reachable anatomy ${heaviest.toFixed(2)} stays below yield`);
 const d=createDraft({base:founder,ancestry:Object.keys(PARTS),budget:Infinity,structural:true}),plain=createDraft({base:founder,ancestry:Object.keys(PARTS),budget:Infinity});
 assert.deepEqual(draftProblems(d),draftProblems(plain),'viable anatomies are unaffected');assert.ok(validatePlan(founder).ok);
}
// 6. Worlds without the rule are unchanged.
{
 const sim=new Simulation('STRUCTURE-PLAIN',{player:true,dayClock:true,metabolism:true,bodySize:true});assert.equal(sim.structuralSupportRules,undefined);
 const a=sized(sim.animals.find(x=>x.alive),2);const lim=sim.supportFor(a);assert.equal(lim.sprint,1);assert.equal(lim.cost,1);assert.equal(sim.impactScale(a),2,'S2 inherited-scale impacts remain');
}
console.log('Structural support /1 PASS: founder anatomy as unit, leg tissue carries load, stress x size x growth, continuous sprint/acceleration/economy limits from safety-factor anchors, Scenario B (2x body slower, sturdier legs restore), falls by stress, explained refusal beyond yield, existing anatomies comfortable, unchanged without the rule');
