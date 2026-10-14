import assert from 'node:assert/strict';
import {PARTS} from '../src/lineage/part-registry.js';
import {founderPlan,recombineBodyPlans,reconcileTraits,inheritBody} from '../src/lineage/body-inheritance.js';
import {attachHeadPlan,detachHeadPlan} from '../src/lineage/head-plan.js';
import {validatePlan,serializePlan,deserializePlan} from '../src/lineage/body-plan.js';
import {createDraft,place,remove,undo,draftCost} from '../src/lineage/evolution-draft.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {mouthOf} from '../src/ecology/functional-diet.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {drawGenvoSprite,genvoAnchors} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {RNG} from '../src/core/rng.js';
import {attachPart,removePart} from '../tools/creature-lab/assembly-model.js';
const legacy=founderPlan(),oldJSON=serializePlan(legacy),headed=attachHeadPlan(legacy),headless=detachHeadPlan(headed).plan;
assert.equal(legacy.id,'bp0-4134709b','existing founder graph identity is unchanged');assert.ok(validatePlan(headed).ok);assert.ok(validatePlan(headless).ok);assert.equal(headless.headMode,'torso');assert.equal(serializePlan(legacy),oldJSON,'compatibility cannot rewrite saved body graphs');
const creature=bodyPlan=>({id:1,species:'genvo',dir:3,bodyPlan,genes:{body:1,motion:1,senses:1},adaptations:[],anatomy:{}});
assert.equal(mouthOf(creature(headed)),mouthOf(creature(legacy)));assert.deepEqual(partEffectFactors(creature(headed)),partEffectFactors(creature(legacy)),'neutral head reparenting preserves functional coefficients');
for(const plan of [legacy,headed,headless])assert.deepEqual(deserializePlan(serializePlan(plan)),plan);
assert.equal(assemblyFor(creature(legacy)).implicitHead,true);assert.equal(assemblyFor(creature(headless)).implicitHead,false);assert.equal(assemblyFor(creature(headed)).head,'head-base');
const d=createDraft({base:legacy,budget:0});assert.ok(place(d,'head-base','root','head').ok);assert.equal(draftCost(d),0);assert.equal(d.plan.nodes.filter(n=>n.parent==='root/head').length,3);assert.ok(remove(d,'root/head').ok);assert.equal(d.plan.headMode,'torso');assert.equal(draftCost(d),0);undo(d);assert.equal(d.plan.id,headed.id);
assert.equal(attachPart(legacy,'root','head','head-base').id,headed.id);assert.equal(removePart(headed,'root/head').headMode,'torso');
const crowded=createDraft({base:headed,budget:8});place(crowded,'simple-eye','root/head','eye.left.2');const before=crowded.plan;assert.equal(remove(crowded,'root/head').ok,false);assert.strictEqual(crowded.plan,before,'failed detach cannot discard unsupported organs');
const bad=structuredClone(headed);bad.nodes.push({...legacy.nodes.find(n=>n.socket==='mouth')});assert.equal(validatePlan(bad).ok,false,'cannot keep ambiguous torso/head mouths');
for(let seed=0;seed<64;seed++)for(const second of [legacy,headless,reconcileTraits(headed,['heavy-jaw'])]){
 const child=recombineBodyPlans(new RNG('HEAD-'+seed),headed,second);assert.ok(validatePlan(child).ok);assert.ok(child.nodes.some(n=>n.socket==='mouth'));assert.ok(child.nodes.some(n=>n.socket?.startsWith('eye')));
}
const adapted=reconcileTraits(headed,['heavy-jaw']);assert.equal(adapted.nodes.find(n=>n.socket==='mouth').parent,'root/head');assert.equal(adapted.nodes.find(n=>n.socket==='mouth').partId,'tearing-jaw');
for(let dir=0;dir<8;dir++){
 const a=creature(headed),ph=phenotypeFor(a),anchors=genvoAnchors({animal:a,phenotype:ph,pose:{dir}}).anchors;
 assert.equal(anchors.filter(x=>x.parent==='root/head').length,5);assert.ok(!anchors.some(x=>x.parent==='root'&&(x.type==='mouth'||x.type==='eye')));assert.ok(anchors.every(x=>Number.isFinite(x.x+x.y)));
 const calls=[],ctx=new Proxy({drawImage(){}},{get:(t,k)=>t[k]??(()=>{})});
 drawGenvoSprite(ctx,{animal:a,phenotype:ph,scale:2,palette:{body:'#699a81',shade:'#34554e',light:'#a4c7a5'},pose:{dir},authoredParts:{'head-base':{drawHead(c,args){calls.push(args);return true}}}});assert.equal(calls.length,1);assert.ok(calls[0].width>0);
}
const sim=new Simulation('MODULAR-HEAD',{player:true});sim.player().bodyPlan=headed;
const partner=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.player);partner.bodyPlan=headed;sim.bodyVariationChance=0;
const child=sim.spawnAnimal('genvo',sim.player().x,sim.player().y,[sim.player(),partner]);assert.ok(inheritBody(sim,child,sim.player(),partner));assert.ok(validatePlan(child.bodyPlan).ok);assert.equal(child.bodyPlan.nodes.find(n=>n.socket==='mouth').parent,'root/head');
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));assert.equal(restored.player().bodyPlan.id,headed.id);assert.ok(validatePlan(restored.player().bodyPlan).ok);
console.log('Head graph ownership, neutral capabilities, attach/remove/undo, lab parity, 192 inheritance crosses, eight directions and save compatibility PASS');


