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
// V8's binary serializer is not a canonical cross-process value hash:
// repeated, pinned E5 GenVo traces produced varying binary fingerprints even
// when every operator, plan, RNG state and complete JSON receipt was identical.
// Encode ALL enumerable receipt fields, including undefined and nonfinite
// numbers, in a deterministic tagged structure instead. Unsupported values
// fail closed; no part choice, RNG or biological outcome is omitted.
function canonicalValue(v,seen=new Set()){
 if(v===undefined)return['undefined'];
 if(v===null)return['null'];
 if(typeof v==='string')return['string',v];
 if(typeof v==='boolean')return['boolean',v];
 if(typeof v==='number')return['number',Object.is(v,-0)?'-0':String(v)];
 if(typeof v==='bigint')return['bigint',String(v)];
 if(typeof v!=='object')throw Error('Unsupported mutation receipt type '+typeof v);
 if(seen.has(v))throw Error('Mutation receipt must be acyclic');
 seen.add(v);
 let out;
 if(Array.isArray(v)){
  out=['array',Array.from({length:v.length},(_,i)=>i in v?canonicalValue(v[i],seen):['hole'])];
 }else{
  if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)
    throw Error('Unsupported mutation receipt object prototype');
  if(Object.getOwnPropertySymbols(v).length)throw Error('Unsupported symbol receipt keys');
  const keys=Object.keys(v).sort();
  out=['object',keys.map(k=>[k,canonicalValue(v[k],seen)])];
 }
 seen.delete(v);return out;
}
const mutationHash=v=>createHash('sha256').update(JSON.stringify(canonicalValue(v))).digest('hex');
for(const species of ['genvo','mosskip','needlejaw']){
 const rng=new RNG('P1-MUTATION-IDENTITY-'+species);
 let plan=species==='genvo'?founderPlan():wildStartPlan(species);
 const receipt=[];
 for(let i=0;i<550;i++){
  const operations=[];
  plan=mutatePlan(rng,plan,{onMutation:e=>operations.push(e)});
  receipt.push({partPlan:plan.id,operator:operations[0]??null,rng:rng.state});
 }
 console.log('MUTATION '+species+' '+mutationHash(receipt));
}
for(const seed of ['P1-WORLD-REGRESSION-A','P1-WORLD-REGRESSION-B']){
 const s=new Simulation(seed,{player:false});
 for(let i=0;i<168;i++)s.update(null);
 console.log('WORLD '+seed+' '+hash(structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'p1-parity'}))));
}
