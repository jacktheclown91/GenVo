import assert from 'node:assert/strict';
import {optionalLossChoices,removeOptionalSubtrees} from '../src/lineage/optional-loss.js';
import {founderPlan,mutatePlan,inheritBody,BODY_VARIATION} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {ASYMMETRIC_SHARE} from '../src/lineage/developmental-symmetry.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {BIRTH_RULES,birthRuleMigrationMessage} from '../src/lineage/birth-rules.js';
const founder=founderPlan(),original=JSON.stringify(founder);
assert.equal(BODY_VARIATION.mutationChance,.25);assert.equal(ASYMMETRIC_SHARE,.05);
assert.equal(removeOptionalSubtrees(founder,['root']),null);assert.equal(removeOptionalSubtrees(founder,['missing']),null);assert.equal(removeOptionalSubtrees(founder,['root/mouth']),null);assert.equal(removeOptionalSubtrees(founder,['root/limb.1']),null);
assert.equal(optionalLossChoices(founder).length,0,'paired loss cannot remove both required eyes or four-leg support');
const asym=optionalLossChoices(founder,{asymmetric:true});assert.equal(asym.length,2);assert.ok(asym.every(c=>c.removed.length===1&&c.removed[0].socket.startsWith('eye')));assert.equal(JSON.stringify(founder),original);
const extra=makePlan([...founder.nodes.map(n=>({partId:n.parent?n.partId:'soft-torso',parent:n.parent,socket:n.socket})),...[2,6].flatMap(i=>[{partId:'walking-leg',parent:'root',socket:`limb.${i}`},{partId:'barb',parent:`root/limb.${i}`,socket:'spur'}])]);
assert.ok(validatePlan(extra).ok,'the six-leg optional-spur fixture must itself have compatible sockets');
const paired=optionalLossChoices(extra),loss=paired.find(c=>c.targets.includes('root/limb.2'));assert.ok(loss);assert.deepEqual(loss.targets,['root/limb.2','root/limb.6']);assert.equal(loss.removed.length,4);assert.equal(loss.plan.nodes.length,founder.nodes.length);assert.ok(validatePlan(loss.plan).ok);assert.ok(!loss.plan.nodes.some(n=>n.partId==='barb'));
assert.ok(optionalLossChoices(extra,{asymmetric:true}).some(c=>c.targets.length===1&&c.targets[0]==='root/limb.2'&&c.removed.length===2));
const d=createDraft({base:founder,ancestry:[],budget:Infinity});assert.ok(place(d,'head-base','root','head').ok);assert.equal(removeOptionalSubtrees(d.plan,['root/head']),null,'head removal cannot silently reattach its required face subtree');
let bound=0;mutatePlan({chance:()=>false,int:(_min,max)=>{bound=max;return 0}},extra);let choice=null;
for(let i=0;i<=bound;i++){let event;mutatePlan({chance:()=>false,int:()=>i},extra,{onMutation:e=>{event=e}});if(event.operator==='delete'&&event.targets.includes('root/limb.2'))choice=i}
assert.notEqual(choice,null);const sim=new Simulation('OPTIONAL-LOSS-UNIT',{player:false,bootstrap:false}),parents=[sim.spawnAnimal('genvo'),sim.spawnAnimal('genvo')];for(const p of parents)applyLineageTarget(p,extra);assert.ok(parents.every(p=>p.adaptations.includes('barbed-limbs')));
const before=structuredClone(parents),child=sim.spawnAnimal('genvo',30,30,parents),draws=[];
assert.ok(inheritBody({rng:{chance:p=>{draws.push(p);return p===.25},int:()=>choice}},child,...parents));assert.equal(child.bodyVariation.operator,'delete');assert.equal(child.bodyVariation.removed.length,4);assert.equal(child.bodyPlan.nodes.length,8);assert.ok(!child.bodyPlan.nodes.some(n=>n.partId==='barb'));assert.ok(!child.adaptations.includes('barbed-limbs'),'reconciliation cannot recreate the deleted support or its unsupported trait');assert.deepEqual(parents,before);assert.deepEqual(draws,[.25,.05]);
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'optional-loss'})),old=snap(sim);delete old.core.birthRules.bodyVariation;const migrated=restoreSimulationSnapshot(structuredClone(old));assert.deepEqual(migrated.animals,old.animals);assert.deepEqual(snap(migrated).world,old.world);assert.equal(migrated.rng.state,old.rngState);assert.ok(birthRuleMigrationMessage(migrated));assert.equal(migrated.birthRules.bodyVariation,BIRTH_RULES.bodyVariation);
const state=snap(migrated),again=restoreSimulationSnapshot(structuredClone(state));assert.deepEqual(snap(again),state);for(let i=0;i<12;i++){migrated.update(null);again.update(null)}assert.deepEqual(snap(again),snap(migrated));const bad=structuredClone(old);bad.core.birthRules.bodyVariation='unknown';assert.throws(()=>restoreSimulationSnapshot(bad),/birth rules/);
console.log('optional organ loss: atomic paired/asymmetric subtree removal, retained viability, no organ re-creation, unchanged parents/event chance and explicit exact-save migration PASS');

// All sixteen asymmetric flank occupancy combinations: socket ordinals must
// never couple different organs or split an existing same-part pair.
const occupants=[[],['armor-plate'],['storage-sac'],['armor-plate','storage-sac']];
for(const left of occupants)for(const right of occupants){
 const body=makePlan([...founder.nodes.map(n=>({partId:n.parent?n.partId:'soft-torso',parent:n.parent,socket:n.socket})),...left.map(partId=>({partId,parent:'root',socket:'flank.left'})),...right.map(partId=>({partId,parent:'root',socket:'flank.right'}))]);
 assert.ok(validatePlan(body).ok);const saved=JSON.stringify(body);
 const choices=optionalLossChoices(body).filter(c=>c.removed.some(n=>n.socket.startsWith('flank')));
 assert.equal(choices.length,new Set([...left,...right]).size);
 for(const type of new Set([...left,...right])){
  const candidate=choices.find(c=>c.removed.some(n=>n.partId===type));assert.ok(candidate);
  assert.ok(candidate.removed.every(n=>n.partId===type),'different multi-socket organs must not be mirror partners');
  assert.equal(candidate.removed.length,Number(left.includes(type))+Number(right.includes(type)));
  assert.ok(validatePlan(candidate.plan).ok);
 }
 const oneSided=optionalLossChoices(body,{asymmetric:true}).filter(c=>c.removed.some(n=>n.socket.startsWith('flank')));
 assert.equal(oneSided.length,left.length+right.length);assert.ok(oneSided.every(c=>c.removed.length===1));
 assert.equal(JSON.stringify(body),saved);
}
// A single-capacity limb pair remains a pair even after one side specializes.
const differing=makePlan(extra.nodes.map(n=>({partId:n.id==='root/limb.6'?'webbed-leg':n.partId,parent:n.parent,socket:n.socket})));
assert.ok(validatePlan(differing).ok);assert.deepEqual(optionalLossChoices(differing).find(c=>c.targets.includes('root/limb.2')).targets,['root/limb.2','root/limb.6']);
const v1=snap(sim);v1.core.birthRules.bodyVariation='neutral-optional-loss/1';
const repaired=restoreSimulationSnapshot(structuredClone(v1));assert.equal(repaired.birthRules.bodyVariation,BIRTH_RULES.bodyVariation);
assert.deepEqual(repaired.animals,v1.animals);assert.deepEqual(snap(repaired).world,v1.world);assert.equal(repaired.rng.state,v1.rngState);
assert.ok(birthRuleMigrationMessage(repaired));assert.equal(repaired.birthRuleMigrations.at(-1).from.bodyVariation,'neutral-optional-loss/1');
const v2=snap(repaired);assert.deepEqual(snap(restoreSimulationSnapshot(structuredClone(v2))),v2);
