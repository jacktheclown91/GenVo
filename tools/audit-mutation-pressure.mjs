import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const out=path.resolve('docs/living-planet-architecture/accessibility-experiment');fs.mkdirSync(out,{recursive:true});
const sim=new Simulation('MUTATION-PRESSURE-COUNTERFACTUAL',{player:false,bootstrap:false});
const mother=sim.spawnAnimal('genvo',32,32),father=sim.spawnAnimal('genvo',33,32);
mother.lineage=father.lineage=true;mother.sex='F';father.sex='M';
const before=createSimulationSnapshot(sim,{savedAt:'fixed',reason:'pressure-counterfactual'});
const branches=[];
for(const kind of ['none','wetness','predation','dryness']){
 const s=restoreSimulationSnapshot(structuredClone(before)),[m,f]=s.animals;
 // Controlled counterfactual diagnostic: vary ONLY the exposure readout.
 s.pressure.lifetimeSummary=()=>kind==='none'?[]:[{kind,score:100}];
 const rngBefore=s.rng.state;
 const [child]=s.spawnFundedOffspring(m,f,[m,f],{count:1,x:32,y:32,energyBudget:12,hydrationBudget:12});
 branches.push({kind,rngBefore,rngAfter:s.rng.state,child:{genes:child.genes,anatomy:child.anatomy,adaptations:child.adaptations,body:child.bodyPlan,parentIds:child.parentIds}});
}
assert.ok(branches.every(b=>b.rngBefore===branches[0].rngBefore));
const signature=b=>JSON.stringify(b.child),pressureChangesNewborn=branches.slice(1).some(b=>signature(b)!==signature(branches[0]));
const result={scope:'Counterfactual diagnostic through the real funded-birth authority. Synthetic exposure summaries and explicit lineage flags are fixtures, not an evolutionary demonstration.',requirement:'Same inherited parents and random state must not be instructed toward useful inherited changes by environmental pressure.',status:pressureChangesNewborn?'VIOLATED':'NOT DETECTED',pressureChangesNewborn,branches,otherKnownPath:{file:'src/lineage/proto-speciation.js',mechanism:'localCandidate selects trait from pressure differential; inheritedCandidate uses pressure support to rank and modify inherited expression.',status:'source audit; separate runtime counterfactual still required'}};
fs.writeFileSync(path.join(out,'pressure-counterfactual-current.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,branches:branches.map(b=>({kind:b.kind,anatomy:b.child.anatomy,adaptations:b.child.adaptations,bodyId:b.child.body.id,rngAfter:b.rngAfter}))}));
