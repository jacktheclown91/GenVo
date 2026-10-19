import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {PLANTS} from '../src/sim/config.js';
const frozen=fs.readFileSync(new URL('../docs/performance/crop-yield-before-scalar-cost.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(frozen).digest('hex'),'172702fcac5de1f3befa2b739e36886b6a639411099304763a8397742c857bd4');
const data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const rebase=(text,base,override={})=>text.replace(/from '([^']+)'/g,(_,name)=>'from '+JSON.stringify(override[name]||new URL(name,base).href));
const oldHandling=fs.readFileSync(new URL('../docs/performance/plant-handling-before-scalar-cost.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(oldHandling).digest('hex'),'a0be45c6a64c9cdadc2eabdd079965002b822f3cf4b4a1cf537a505cdee9874f');
const handlingUrl=data(rebase(oldHandling,new URL('../src/ecology/plant-handling.js',import.meta.url)));
const rebased=rebase(frozen,new URL('../src/ecology/dispersal.js',import.meta.url),{'./plant-handling.js':handlingUrl});
const {PlantDispersalController:Before}=await import('data:text/javascript;base64,'+Buffer.from(rebased).toString('base64'));
const current=new Simulation('SCALAR-CROP-PARITY',{player:false}),prior=new Simulation('SCALAR-CROP-PARITY',{player:false});
prior.dispersal.cropYield=Before.prototype.cropYield;
prior.dispersal.receiptFromTissues=Before.prototype.receiptFromTissues;
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'scalar-parity'}));
assert.deepEqual(snap(current),snap(prior));
// Whole-state parity includes actual births/deaths, stocks, genotype changes,
// actor reserves, resource receipts and RNG; not just the optimized scalar.
for(let day=0;day<4;day++){
 const d=current.day;while(current.day===d){current.update(null);prior.update(null)}
 assert.deepEqual(snap(current),snap(prior),'natural complete saved state at day '+current.day);
}
let comparisons=0;
const mouths=Object.keys(PARTS).filter(id=>PARTS[id].compatibleSocketTypes.includes('mouth'));
for(const kind of Object.keys(PLANTS))for(const total of [0,.000001,.04,0,.8,1,0,.2]){
 for(const sim of [current,prior]){
  sim.world.plants[kind][10]=total;
  if(sim.dispersal.seedReserve[kind])sim.dispersal.seedReserve[kind][10]=total*.2;
  if(sim.dispersal.coatReserve[kind])sim.dispersal.coatReserve[kind][10]=total*.3;
 }
 for(const partId of mouths)for(const energy of [0,.0001,.1,100]){
  const animal={energy,species:'genvo',bodyPlan:{nodes:[{socket:'mouth',partId}]}};
  assert.equal(current.dispersal.cropYield(animal,kind,10),prior.dispersal.cropYield(animal,kind,10),kind+' '+partId+' '+energy);
  comparisons++;
 }
}
console.log('Four natural days exact whole-save parity and '+comparisons+' stock/mouth/affordability checks against frozen pre-optimization source PASS');
