import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {serialize,deserialize} from 'node:v8';
import {createHash} from 'node:crypto';
import {restoreSimulationSnapshot,createSimulationSnapshot} from '../../../src/persistence/save-manager.js';
import {SPECIES} from '../../../src/organisms/species.js';
import {canSwim} from '../../../src/lineage/lifestyle.js';
import {webbedLegCount} from '../../../src/lineage/aquatic.js';
import {checkEcologicalIntegrity} from '../../../tools/ecological-integrity.mjs';
import {placeSupportedBreedingPair} from '../../../tests/helpers/breeding-pair.js';
const base='docs/living-planet-architecture/head-structure-implementation/birth-audit',out='docs/living-planet-architecture/head-structure-implementation/descendants';
if(fs.existsSync(out))throw Error('Descendant output exists; preserve evidence rather than overwrite.');fs.mkdirSync(out,{recursive:true});
const input=fs.readFileSync('docs/living-planet-architecture/head-structure-implementation/maturity/final.snapshot.bin'),audit=JSON.parse(fs.readFileSync(path.join(base,'results.json'),'utf8')),sim=restoreSimulationSnapshot(deserialize(input)),candidate=sim.animals.find(a=>a.id===audit.first.childId),spec=SPECIES.genvo;
assert.ok(candidate?.alive&&candidate.age>=spec.maturity);
const unchanged={body:JSON.stringify(candidate.bodyPlan),genes:JSON.stringify(candidate.genes),anatomy:JSON.stringify(candidate.anatomy)};
// One disclosed adult immigrant fixture: default simple founder anatomy/genes/resources;
// only adult age and complementary sex are staged. Candidate reserves stay untouched.
const mate=sim.spawnAnimal('genvo',candidate.x+1,candidate.y);Object.assign(mate,{sex:candidate.sex==='F'?'M':'F',age:spec.maturity+2});
const carrier=candidate.sex==='F'?candidate:mate,targetFather=carrier===mate?candidate:mate;
const immigrant=structuredClone(mate),rows=[],children=[];let placement=null,readyPlacement=null,placementFailure=null,attempt=null;
const read=()=>({day:sim.day,tick:sim.tickCount,gestation:{carrierId:carrier.id,pregnant:!!carrier.pregnant,fatherId:carrier.pregnant?.fatherId},candidate:{id:candidate.id,alive:candidate.alive,age:candidate.age,health:candidate.health,energy:candidate.energy,hydration:candidate.hydration,reproCooldown:candidate.reproCooldown,pregnant:!!candidate.pregnant,growthPaid:candidate.growthPaid,growthDelayDays:candidate.growthDelayDays},mate:{id:mate.id,alive:mate.alive,age:mate.age,health:mate.health,energy:mate.energy,hydration:mate.hydration,reproCooldown:mate.reproCooldown},integrity:checkEcologicalIntegrity(sim,3)});
rows.push(read());
try{placement=placeSupportedBreedingPair(sim,candidate,mate,{developDays:0})}catch(e){placementFailure=e.message}
const readyDeadline=sim.day+20;
if(!placementFailure){while(candidate.alive&&mate.alive&&!carrier.pregnant&&(candidate.reproCooldown>0||mate.reproCooldown>0)&&sim.day<readyDeadline){const day=sim.day;sim.update(null);if(sim.day!==day)rows.push(read())}
 if(candidate.alive&&mate.alive&&(carrier.pregnant?.fatherId===targetFather.id||candidate.reproCooldown<=0&&mate.reproCooldown<=0)){
  try{readyPlacement=carrier.pregnant?{scope:'Already accepted autonomously during natural readiness; no new placement'}:placeSupportedBreedingPair(sim,candidate,mate,{developDays:0})}catch(e){placementFailure=e.message}
  if(!placementFailure){const before=read(),already=carrier.pregnant?.fatherId===targetFather.id,availability=already?null:sim.conceptionAvailability(candidate,mate),conceived=already||!!sim.tryMate(candidate,mate);attempt={day:sim.day,source:already?'autonomous-during-readiness':'one-staged-encounter',before,after:read(),availability,conceived,refusal:structuredClone(candidate.lastCourtshipRefusal??null),pregnancy:structuredClone(carrier.pregnant)};
   if(conceived){const deadline=sim.day+spec.gestation+2;
    while(carrier.alive&&sim.day<deadline){const day=sim.day;sim.update(null);
     for(const child of sim.animals)if(child.parentIds?.includes(candidate.id)&&child.parentIds?.includes(mate.id)&&!children.some(c=>c.id===child.id)){assert.ok(child.grandparentIds.includes(audit.first.motherId)&&child.grandparentIds.includes(audit.first.fatherId));children.push({id:child.id,day:sim.day,age:child.age,generation:child.generation,parentIds:[...child.parentIds],grandparentIds:[...child.grandparentIds],body:structuredClone(child.bodyPlan),variation:structuredClone(child.bodyVariation),genes:structuredClone(child.genes),anatomy:structuredClone(child.anatomy),adaptations:[...child.adaptations],legacyWaterPhysiology:[...(child.legacyWaterPhysiology||[])],swims:canSwim(child),webbedLegs:webbedLegCount(child),energy:child.energy,hydration:child.hydration});}
     if(children.length){fs.writeFileSync(path.join(out,'birth.snapshot.bin'),serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'current-policy-descendant-birth'})));break}
     if(sim.day!==day){rows.push(read());if(rows.length%8===0)console.log(JSON.stringify(rows.at(-1).candidate))}
    }
   }
  }
 }
}
const final=read(),snap=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'current-policy-descendants'}),state=snap(sim);fs.writeFileSync(path.join(out,'final.snapshot.bin'),serialize(state));
const restored=restoreSimulationSnapshot(structuredClone(state));assert.deepEqual(snap(restored),state);for(let i=0;i<12;i++){sim.update(null);restored.update(null)}assert.deepEqual(snap(restored),snap(sim));
assert.equal(JSON.stringify(candidate.bodyPlan),unchanged.body);assert.equal(JSON.stringify(candidate.genes),unchanged.genes);assert.equal(JSON.stringify(candidate.anatomy),unchanged.anatomy);
const report={schema:'genvo.accessibility-descendants/1',scope:'Follow the actual head-conversion offspring after unassisted ordinary paid maturation from its original birth location. One unrelated simple adult mate and one supported encounter after natural cooldown; a conception already accepted autonomously during readiness is retained rather than retried. Pregnancy carrier is resolved by sex, not presumed to be the candidate. Mate/candidate placement is staged; no food, candidate age/genome/body/reserve edits, cooldown reset, forced consent, repeated acceptance attempts or mutation boost. Not an autonomous ecosystem frequency or player-guided trial.',input:{sha256:createHash('sha256').update(input).digest('hex'),seed:sim.seed,candidateId:candidate.id,birthRules:state.core.birthRules,ecologyRules:state.core.ecologyRules},immigrant,placement,readyPlacement,placementFailure,readyDeadline,attempt,children,rows,final,unchangedCandidateBody:true,unchangedCandidateGenes:true,unchangedCandidateAnatomy:true,exactSaveAndTwelveUpdateResume:true,status:children.length?'ACTUAL CURRENT-POLICY DESCENDANT BIRTH':'REPRODUCTION NOT PROVEN'};
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,attempt:attempt&&{day:attempt.day,conceived:attempt.conceived,availability:attempt.availability,refusal:attempt.refusal},placementFailure,children:children.map(c=>({id:c.id,headed:c.body.nodes.some(n=>n.socket==='head')})),final:final.candidate}));
