import {SPECIES} from '../organisms/species.js';
import {hasPart} from '../lineage/part-abilities.js';

// ES: bounded, passive conception-to-recruitment evidence. Stored on the
// existing RegionalEcology region record in which conception really happened.
// No RNG, movement, reproduction, resource or carrying-pressure effects.
export const ENGINEER_LIFE_HISTORY=Object.freeze({limit:32,juvenileDays:7});

function findPregnancy(controller,motherId,conceptionDay){
  for(const region of controller.records.values()){
    const pregnancy=region.engineerLifeHistory?.pregnancies?.findLast(p=>
      p.motherId===motherId&&p.conceptionDay===conceptionDay);
    if(pregnancy)return pregnancy;
  }
  return null;
}

export function noteEngineerLifeConception(controller,mother,father,day){
  if(!mother?.alive||!father?.alive||mother.species!==father.species||
    !hasPart(mother,'digging-forelimb')&&!hasPart(father,'digging-forelimb')||
    !mother.pregnant||mother.pregnant.startedDay!==day)return false;
  const region=controller.ensure(controller.keyAt(mother.x,mother.y));
  const history=region.engineerLifeHistory??={pregnancies:[]};
  if(history.pregnancies.some(p=>p.motherId===mother.id&&p.conceptionDay===day))return false;
  history.pregnancies.push({motherId:mother.id,fatherId:father.id,species:mother.species,
    motherGeneration:mother.generation,conceptionDay:day,conceptionRegion:region.key,
    conceivedAt:{x:mother.x,y:mother.y},gestationDays:mother.pregnant.totalDays,
    status:'gestating',birthDay:null,birthRegion:null,offspring:[],maternalDeathCause:null});
  if(history.pregnancies.length>ENGINEER_LIFE_HISTORY.limit)history.pregnancies.splice(0,history.pregnancies.length-ENGINEER_LIFE_HISTORY.limit);
  return true;
}

export function noteEngineerLifeBirth(controller,child,mother,day){
  if(!mother?.pregnant||!child?.parentIds?.includes(mother.id))return false;
  const pregnancy=findPregnancy(controller,mother.id,mother.pregnant.startedDay);
  if(!pregnancy||pregnancy.fatherId!==child.parentIds[1]||pregnancy.offspring.some(c=>c.id===child.id))return false;
  const region=controller.keyAt(child.x,child.y);
  pregnancy.birthDay=day;pregnancy.birthRegion=region;pregnancy.status='delivered';
  pregnancy.offspring.push({id:child.id,generation:child.generation,birthDay:day,
    birthRegion:region,age:0,lastSeenDay:day,survivedSevenDays:false,reachedMaturity:false,
    deathDay:null,deathCause:null});
  return true;
}

export function noteEngineerLifeDeath(controller,animal,cause,day){
  // Death of a mother interrupts a genuine ongoing gestation; no virtual birth.
  if(animal.pregnant){const p=findPregnancy(controller,animal.id,animal.pregnant.startedDay);
    if(p&&p.status==='gestating'){p.status='maternal-death';p.maternalDeathCause=cause;p.endDay=day;}}
  for(const region of controller.records.values())for(const p of region.engineerLifeHistory?.pregnancies||[])
    for(const child of p.offspring)if(child.id===animal.id&&child.deathDay===null){
      child.deathDay=day;child.deathCause=cause;
    }
}

export function observeEngineerLifeHistory(controller,day){
  if(!controller.records.size)return;
  const living=new Map(controller.sim.animals.filter(a=>a.alive).map(a=>[a.id,a]));
  for(const region of controller.records.values())for(const p of region.engineerLifeHistory?.pregnancies||[]){
    // A pregnancy can also end without producing a child due to an older save
    // or another real interruption; do not invent outcomes when no evidence.
    for(const child of p.offspring){const animal=living.get(child.id);
      if(!animal||child.deathDay!==null)continue;
      child.age=animal.age;child.lastSeenDay=day;
      if(day-child.birthDay>=ENGINEER_LIFE_HISTORY.juvenileDays)child.survivedSevenDays=true;
      if(animal.age>=SPECIES[animal.species].maturity)child.reachedMaturity=true;
    }
  }
}

export function engineerLifeHistoryEvidence(controller){
  const all=[...controller.records.values()].flatMap(r=>r.engineerLifeHistory?.pregnancies||[]);
  const born=all.flatMap(p=>p.offspring);
  return {conceptions:all.length,delivered:all.filter(p=>p.status==='delivered').length,
    gestating:all.filter(p=>p.status==='gestating').length,
    maternalDeaths:all.filter(p=>p.status==='maternal-death').length,
    births:born.length,birthsOutsideConceptionRegion:all.reduce((n,p)=>n+p.offspring.filter(c=>c.birthRegion!==p.conceptionRegion).length,0),
    survivedSevenDays:born.filter(c=>c.survivedSevenDays).length,
    reachedMaturity:born.filter(c=>c.reachedMaturity).length,
    offspringDeaths:born.filter(c=>c.deathDay!==null).length,
    byRegion:all.map(p=>({...p,conceivedAt:{...p.conceivedAt},offspring:p.offspring.map(c=>({...c}))}))};
}
