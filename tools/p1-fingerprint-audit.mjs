// P1 parity-gate audit: is a pinned, UNCHANGED GenVo mutation trace
// repeatable across separate Node processes using canonical JSON AND V8?
// This is diagnostic; it cannot certify an optimization or change test budgets.
import {RNG} from '../src/core/rng.js';
import {mutatePlan,founderPlan} from '../src/lineage/body-inheritance.js';
import {wildStartPlan} from '../src/organisms/wild-bodies.js';
import {createHash} from 'node:crypto';
import {serialize} from 'node:v8';
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const species of ['genvo','mosskip','needlejaw']){
 const rng=new RNG('P1-MUTATION-IDENTITY-'+species),results=[];
 let plan=species==='genvo'?founderPlan():wildStartPlan(species);
 for(let i=0;i<550;i++){
   let receipt=null;
   plan=mutatePlan(rng,plan,{onMutation:r=>receipt=r});
   results.push({partPlan:plan.id,operator:receipt,rng:rng.state});
 }
 const json=JSON.stringify(results),v8=serialize(results),operatorSequence=results.map(r=>[r.partPlan,r.operator?.choice??null,r.operator?.options??null,r.operator?.accepted??null,r.rng]);
 console.log(species+' json='+hash(json)+' v8='+hash(v8)+' ops='+hash(JSON.stringify(operatorSequence)));
 // A small unambiguous anchor for discovering genuine first-step differences.
 console.log(species+' first='+JSON.stringify(operatorSequence.slice(0,8))+' last='+JSON.stringify(operatorSequence.slice(-4)));
}
