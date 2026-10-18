// This pure observation is deliberately copied unchanged to the pinned E5
// checkout by CI to compare original versus optimized implementation.
import {RNG} from '../src/core/rng.js';
import {mutatePlan,founderPlan} from '../src/lineage/body-inheritance.js';
import {wildStartPlan} from '../src/organisms/wild-bodies.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {createHash} from 'node:crypto';
import {serialize} from 'node:v8';

const hash=v=>createHash('sha256').update(serialize(v)).digest('hex');
for(const species of ['genvo','mosskip','needlejaw']){
 const rng=new RNG('P1-MUTATION-IDENTITY-'+species);
 let plan=species==='genvo'?founderPlan():wildStartPlan(species);
 const receipt=[];
 for(let i=0;i<550;i++){
  const operations=[];
  plan=mutatePlan(rng,plan,{onMutation:e=>operations.push(e)});
  receipt.push({partPlan:plan.id,operator:operations[0]??null,rng:rng.state});
 }
 console.log('MUTATION '+species+' '+hash(receipt));
}
for(const seed of ['P1-WORLD-REGRESSION-A','P1-WORLD-REGRESSION-B']){
 const s=new Simulation(seed,{player:false});
 for(let i=0;i<168;i++)s.update(null);
 console.log('WORLD '+seed+' '+hash(structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'p1-parity'}))));
}
