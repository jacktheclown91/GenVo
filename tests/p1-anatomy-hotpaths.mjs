import assert from 'node:assert/strict';
import {optionalLossChoices} from '../src/lineage/optional-loss.js';
import {mutatePlan} from '../src/lineage/body-inheritance.js';
import {wildStartPlan} from '../src/organisms/wild-bodies.js';
import {RNG} from '../src/core/rng.js';
import {thermalCoverFactor,inclineGrip} from '../src/lineage/terrain-cover-physiology.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {createHash} from 'node:crypto';

const p=wildStartPlan('mosskip');
const before=p.nodes.map(n=>({...n})),ident=JSON.stringify(p);
const first=optionalLossChoices(p),again=optionalLossChoices(p);
assert.equal(first,again,'identical immutable plan returns precisely the same prevalidated removal choices');
assert.notEqual(optionalLossChoices(p,{asymmetric:true}),first,'asymmetric removals use a distinct cached choice order');
assert.deepEqual(p.nodes,before,'planning optional losses does not mutate the living plan');
assert.equal(JSON.stringify(p),ident);
const equivalent=wildStartPlan('mosskip');
assert.notEqual(optionalLossChoices(equivalent),first,'memoization never aliases different actor plan instances');
const body=founderPlan();
const fit=id=>({bodyPlan:makePlan([...body.nodes.filter(n=>n.socket!=='dorsal').map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId:id,parent:'root',socket:'dorsal'}])});
for(const [id,cold,hot]of [['filament-tuft',.78,1.04],['fur-mantle',.48,1.24],['feather-mantle',.55,1.12],['proto-wing',.83,1.13]]){
 const actor=fit(id);
 for(let n=0;n<100;n++){
  assert.equal(thermalCoverFactor(actor,.2,.55),cold);
  assert.equal(thermalCoverFactor(actor,.7,.55),hot);
  assert.equal(thermalCoverFactor(actor,.2,.55,{wet:true}),cold+(1-cold)*(1-({ 'filament-tuft':.85,'fur-mantle':.55,'feather-mantle':.82,'proto-wing':.74}[id])));
 }
}
const g=inclineGrip({bodyPlan:body},3),g2=inclineGrip({bodyPlan:body},3);
assert.equal(g,g2,'ordinary leg bodies reuse non-climbing immutable result rather than allocate per update');
const outputs=[];
for(const species of ['mosskip','needlejaw','genvo']){
 const rng=new RNG('P1-MUTATION-IDENTITY-'+species),input=species==='genvo'?body:wildStartPlan(species);
 let plan=input;
 for(let k=0;k<550;k++){
  const reports=[];
  plan=mutatePlan(rng,plan,{onMutation:e=>reports.push(e)});
  outputs.push({species,step:k,id:plan.id,record:reports[0]||null,rng:rng.state});
 }
}
const sha=createHash('sha256').update(JSON.stringify(outputs)).digest('hex');
console.log('MUTATION_PARITY_SHA '+sha);
console.log('P1 deterministic ancestry, optional loss, original thermal/grip values and full selected mutation operator receipts PASS');
