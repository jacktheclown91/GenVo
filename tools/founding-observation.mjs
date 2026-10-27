// Passive diagnosis of the existing founding decision, not a founding authority.
// Wrappers record values already requested by the runtime; no extra food survey,
// movement, biological update, RNG draw or population assignment is performed.
import {AUTONOMOUS_POPULATIONS,autonomousPopulationsEnabled,populationIsSeparated} from '../src/ecology/autonomous-founding.js';
import {SPECIES} from '../src/organisms/species.js';
import {candidateContainsKey} from '../src/ecology/founding-candidate-contact.js';

export function installFoundingObservation(sim){
 const diagnostics={scope:'Actual daily founding inputs; observation only. Constants and decisions remain owned by population memory.',
  days:0,cohortDays:0,gateOrder:['members','adults','continuity','resources','recruits','litters','geography'],
  gateMasks:{},bestByPopulation:{},nearMisses:[]};
 if(!autonomousPopulationsEnabled(sim))return{diagnostics,remove(){}};
 const memory=sim.populationMemory,rules=AUTONOMOUS_POPULATIONS;
 const advance=memory.advanceDay,maintenance=memory.supportsMaintenance;
 let observedSupport=null;
 memory.supportsMaintenance=function(animal){
  const result=maintenance.call(this,animal);observedSupport?.set(animal.id,result);return result;
 };
 memory.advanceDay=function(){
  const already=this.lastDay===sim.day,prior=observedSupport;observedSupport=new Map();
  try{
   const result=advance.call(this);
   if(already)return result;
   diagnostics.days++;
   const byId=new Map(sim.animals.filter(a=>a.alive).map(a=>[a.id,a]));
   for(const record of this.natural.records.values()){
    if(record.supportHistory?.at(-1)?.day!==sim.day)continue;
    const members=[...record.memberIds].map(id=>byId.get(id)).filter(Boolean);
    const adults=members.filter(a=>a.age>=SPECIES[a.species].maturity);
    const supported=adults.filter(a=>observedSupport.get(a.id)).length;
    const recentSupport=record.supportHistory.filter(row=>row.day>sim.day-rules.residenceDays&&row.supported).length;
    const recruits=members.filter(a=>record.recruits.has(a.id));
    const litters=new Set(recruits.map(a=>{const b=this.natural.births.get(a.id);return `${b.tick}:${b.parents[0]}`}));
    const gates={members:members.length>=rules.minimumMembers,adults:adults.length>=rules.minimumAdults,
     continuity:record.continuityDays>=rules.residenceDays,resources:recentSupport>=rules.supportedDays&&supported>=rules.minimumAdults,
     recruits:recruits.length>=2,litters:litters.size>=rules.minimumLitters,geography:populationIsSeparated(this,record)};
    const passed=Object.values(gates).filter(Boolean).length;
    const mask=Object.values(gates).reduce((sum,yes,index)=>sum+(yes?2**index:0),0);
    diagnostics.cohortDays++;diagnostics.gateMasks[mask]=(diagnostics.gateMasks[mask]||0)+1;
    const previous=diagnostics.bestByPopulation[record.key];
    if(!previous||passed>previous.passed||passed===previous.passed&&
      (litters.size>previous.litters||litters.size===previous.litters&&recruits.length>previous.recruits)){
     const bornResidents=members.flatMap(a=>{
      const birth=this.natural.births.get(a.id);if(!birth)return[];
      const residence=record.members.get(a.id),refusals=[];
      if(birth.day<record.firstDay)refusals.push('born-before-cohort');
      if(residence.days<rules.recruitedDays)refusals.push('short-residence');
      if(Math.hypot(record.x-birth.x,record.y-birth.y)>rules.radius)refusals.push('birth-place-outside-current-anchor');
      if(!birth.residentKeys.some(key=>candidateContainsKey(record,key)))refusals.push('parents-not-resident-at-birth');
      if(!birth.parents.some(id=>(record.members.get(id)?.firstDay??Infinity)<birth.day))refusals.push('no-prior-parent-residence');
      return[{id:a.id,bornDay:birth.day,age:a.age,residentDays:residence.days,recruited:record.recruits.has(a.id),refusals}];
     });
     diagnostics.bestByPopulation[record.key]={key:record.key,species:record.species,day:sim.day,passed,gates,
      members:members.length,adults:adults.length,continuityDays:record.continuityDays,
      recentSupport,supportedAdults:supported,recruits:recruits.length,litters:litters.size,
      memberIds:members.map(a=>a.id),recruitIds:recruits.map(a=>a.id),bornResidents};
    }
    if(passed>=diagnostics.gateOrder.length-1)diagnostics.nearMisses.push({key:record.key,day:sim.day,passed,gates,
     members:members.length,adults:adults.length,recruits:recruits.length,litters:litters.size,
     continuityDays:record.continuityDays,recentSupport,supportedAdults:supported});
   }
   return result;
  }finally{observedSupport=prior}
 };
 return{diagnostics,remove(){delete memory.advanceDay;delete memory.supportsMaintenance}};
}
