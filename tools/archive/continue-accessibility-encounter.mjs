import fs from 'node:fs';
import {serialize,deserialize} from 'node:v8';
import {restoreSimulationSnapshot,createSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {checkEcologicalIntegrity} from '../ecological-integrity.mjs';
import {placeSupportedBreedingPair} from '../../tests/helpers/breeding-pair.js';
import {canSwim} from '../../src/lineage/lifestyle.js';
import {webbedLegCount} from '../../src/lineage/aquatic.js';
import {SPECIES} from '../../src/organisms/species.js';
const out='docs/living-planet-architecture/accessibility-experiment',prior=JSON.parse(fs.readFileSync(`${out}/descendant-results.json`));
const sim=restoreSimulationSnapshot(deserialize(fs.readFileSync(`${out}/descendant-final.snapshot.bin`)));
const candidate=sim.animals.find(a=>a.id===4),mate=sim.animals.find(a=>a.id===prior.immigrant.id),body=JSON.stringify(candidate.bodyPlan),genes=JSON.stringify(candidate.genes);
const rows=[],children=[];let attempt=null,placement=null,placementFailure=null;
const read=()=>({day:sim.day,tick:sim.tickCount,candidate:{alive:candidate.alive,age:candidate.age,energy:candidate.energy,hydration:candidate.hydration,health:candidate.health,growthPaid:candidate.growthPaid,growthDelayDays:candidate.growthDelayDays,reproCooldown:candidate.reproCooldown,pregnant:!!candidate.pregnant},mate:{alive:mate.alive,reproCooldown:mate.reproCooldown,energy:mate.energy},integrity:checkEcologicalIntegrity(sim,3)});
rows.push(read());const readyDeadline=sim.day+20;
while(candidate.alive&&mate.alive&&(candidate.reproCooldown>0||mate.reproCooldown>0)&&sim.day<readyDeadline){const day=sim.day;sim.update(null);if(sim.day!==day)rows.push(read())}
if(candidate.alive&&mate.alive&&candidate.reproCooldown<=0&&mate.reproCooldown<=0){
 try{placement=placeSupportedBreedingPair(sim,candidate,mate,{developDays:0})}catch(error){placementFailure=error.message}
 if(!placementFailure){const available=sim.conceptionAvailability(candidate,mate),conceived=sim.tryMate(candidate,mate);attempt={day:sim.day,available,conceived,refusal:structuredClone(candidate.lastCourtshipRefusal??null),pregnancy:structuredClone(candidate.pregnant)};
  if(conceived){const deadline=sim.day+SPECIES.genvo.gestation+1;
   while(candidate.alive&&sim.day<deadline){const day=sim.day;sim.update(null);
    for(const a of sim.animals)if(a.parentIds?.includes(candidate.id)&&a.parentIds?.includes(mate.id)&&!children.some(b=>b.id===a.id)){children.push({id:a.id,day:sim.day,parentIds:a.parentIds,body:structuredClone(a.bodyPlan),genes:structuredClone(a.genes),age:a.age,energy:a.energy,hydration:a.hydration,swims:canSwim(a),webbedLegs:webbedLegCount(a)});fs.writeFileSync(`${out}/descendant-birth.snapshot.bin`,serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'actual-descendant-birth'})))}
    if(sim.day!==day)rows.push(read());
   }
  }
 }
}
const final=read(),report={scope:'Continue the saved living maturity experiment; allow the same immigrant to recover naturally before one new supported encounter. No cooldown, reserves, age, anatomy or genotype reset. Ordinary mate choice, compatibility and gestation remain authoritative.',priorAttempt:prior.attempts.at(-1),initialDay:rows[0].day,readyDeadline,placement,placementFailure,attempt,children,rows,final,unchangedCandidateBody:JSON.stringify(candidate.bodyPlan)===body,unchangedCandidateGenes:JSON.stringify(candidate.genes)===genes,status:children.length?'ACTUAL DESCENDANT BIRTH':'REPRODUCTION NOT PROVEN'};
fs.writeFileSync(`${out}/encounter-continuation.json`,JSON.stringify(report,null,2));fs.writeFileSync(`${out}/encounter-final.snapshot.bin`,serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'accessibility-encounter-final'})));
console.log(JSON.stringify({status:report.status,initialDay:report.initialDay,finalDay:sim.day,attempt,children:children.map(c=>({id:c.id,swims:c.swims,webbedLegs:c.webbedLegs})),finalCandidate:final.candidate}));
