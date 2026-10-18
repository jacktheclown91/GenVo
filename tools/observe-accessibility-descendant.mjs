import fs from 'node:fs';
import {serialize,deserialize} from 'node:v8';
import {restoreSimulationSnapshot,createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {SPECIES} from '../src/organisms/species.js';
import {canSwim} from '../src/lineage/lifestyle.js';
import {webbedLegCount} from '../src/lineage/aquatic.js';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
import {placeSupportedBreedingPair} from '../tests/helpers/breeding-pair.js';
const out='docs/living-planet-architecture/accessibility-experiment';
const sim=restoreSimulationSnapshot(deserialize(fs.readFileSync(`${out}/candidate-birth.snapshot.bin`)));
const extended=process.argv.includes('--extend-growth-window');
const prior=extended&&fs.existsSync(`${out}/descendant-results.json`)?JSON.parse(fs.readFileSync(`${out}/descendant-results.json`)):null;
if(prior)fs.copyFileSync(`${out}/descendant-results.json`,`${out}/descendant-results-first-window.json`);
const candidateId=4,candidate=sim.animals.find(a=>a.id===candidateId),initialBody=JSON.stringify(candidate.bodyPlan),initialGenes=JSON.stringify(candidate.genes),rows=[],attempts=[];let initialPopulation=2;
const read=()=>({day:sim.day,tick:sim.tickCount,candidate:{alive:candidate.alive,age:candidate.age,sex:candidate.sex,health:candidate.health,energy:candidate.energy,hydration:candidate.hydration,x:candidate.x,y:candidate.y,swims:canSwim(candidate),webbedLegs:webbedLegCount(candidate),pregnant:!!candidate.pregnant,growthPaid:candidate.growthPaid??0,growthDelayDays:candidate.growthDelayDays??0},integrity:checkEcologicalIntegrity(sim,initialPopulation)});
rows.push(read());
const maturityDeadline=sim.day+SPECIES.genvo.maturity+2+(extended?8:0);
while(candidate.alive&&candidate.age<SPECIES.genvo.maturity&&sim.day<maturityDeadline){const day=sim.day;sim.update(null);if(sim.day!==day){rows.push(read());if(rows.length%8===0)console.log(JSON.stringify(rows.at(-1).candidate))}}
const reachedMaturity=candidate.alive&&candidate.age>=SPECIES.genvo.maturity;
let immigrant=null,placement=null,placementFailure=null,pregnancy=null,children=[];
if(reachedMaturity){
 fs.writeFileSync(`${out}/candidate-mature.snapshot.bin`,serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'accessibility-maturity'})));
 // One explicitly staged unrelated simple adult immigrant: no edited candidate,
 // no fabricated ancestors, no replenishment of existing organisms or resources.
 const adult=sim.spawnAnimal('genvo',candidate.x+1,candidate.y);initialPopulation++;
 Object.assign(adult,{sex:candidate.sex==='F'?'M':'F',age:SPECIES.genvo.maturity+2});
 immigrant={id:adult.id,sex:adult.sex,age:adult.age,genes:structuredClone(adult.genes),body:structuredClone(adult.bodyPlan),energy:adult.energy,hydration:adult.hydration,parentIds:adult.parentIds};
 try{placement=placeSupportedBreedingPair(sim,candidate,adult,{developDays:0})}catch(error){placementFailure=error.message}
 if(!placementFailure){
  // A single disclosed mate encounter; no repeated forced acceptance or cooldown reset.
  const available=sim.conceptionAvailability(candidate,adult),conceived=sim.tryMate(candidate,adult);
  const mother=candidate.sex==='F'?candidate:adult;
  pregnancy=structuredClone(mother.pregnant);attempts.push({day:sim.day,available,conceived,refusal:candidate.lastCourtshipRefusal??null,pregnancy});
  if(conceived){const deadline=sim.day+SPECIES.genvo.gestation+1;
   while(sim.day<deadline&&mother.alive){const day=sim.day;sim.update(null);
    for(const a of sim.animals)if(a.parentIds?.includes(candidate.id)&&a.parentIds?.includes(adult.id)&&!children.some(b=>b.id===a.id)){children.push({id:a.id,day:sim.day,parentIds:a.parentIds,genes:structuredClone(a.genes),body:structuredClone(a.bodyPlan),webbedLegs:webbedLegCount(a),swims:canSwim(a),age:a.age,energy:a.energy,hydration:a.hydration});fs.writeFileSync(`${out}/descendant-birth.snapshot.bin`,serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'accessibility-descendant-birth'})))}
    if(sim.day!==day)rows.push(read());
   }
  }
 }
}
fs.writeFileSync(`${out}/descendant-final.snapshot.bin`,serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'accessibility-descendant-final'})));
const final=read(),report={scope:'Follow the original archived newborn under ordinary simulation to maturity, without body/genome/age/reserve edits or food injection. If mature, stage one disclosed unrelated simple adult immigrant and one supported encounter, preserving mate acceptance, compatibility, gestation and costs. Not an autonomous founding-world frequency trial or player/shared-rule acceptance.',candidateId,extendedGrowthWindow:extended,priorWindow:prior?{status:prior.status,day:prior.final.day,age:prior.final.candidate.age}:null,reachedMaturity,unchangedCandidateBody:JSON.stringify(candidate.bodyPlan)===initialBody,unchangedCandidateGenes:JSON.stringify(candidate.genes)===initialGenes,immigrant,placement,placementFailure,attempts,children,rows,final,status:!reachedMaturity?'MATURITY NOT REACHED':children.length?'ACTUAL DESCENDANT BIRTH':'MATURE; REPRODUCTION NOT PROVEN'};
fs.writeFileSync(`${out}/descendant-results.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,day:sim.day,candidate:final.candidate,children:children.map(c=>({id:c.id,swims:c.swims,webbedLegs:c.webbedLegs})),placementFailure,attempts:attempts.map(a=>({conceived:a.conceived,available:a.available.enabled,refusal:a.refusal?.reason}))}));
