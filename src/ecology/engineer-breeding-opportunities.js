// Passive, bounded observations of mating opportunity following a confirmed
// regional engineer return. This neither changes wildlife decisions nor
// counts an opportunity as a mating, birth or sustainable colony.
import {SPECIES} from '../organisms/species.js';

const empty=()=>({observations:0,founderAliveDays:0,founderResidentDays:0,
  founderPhysiologicallyReadyDays:0,mateResidentDays:0,mateReadyResidentDays:0,
  mutuallyReadyResidentDays:0,founderMatePursuitDays:0,lastObservationDay:null});

const physicallyReady=(a,s)=>a.age>=s.maturity && a.reproCooldown<=0 &&
  !a.pregnant && !a.infected && a.health>=55 &&
  a.energy/s.maxEnergy>(s.reproduction?.energy??.72);

export function observeEngineerBreedingOpportunity(region,sim,day){
  const event=region?.engineerSuccession?.events?.at(-1);
  if(event?.type!=='reoccupation'||event.day>day)return false;
  const o=event.opportunity??=(empty());
  if(o.lastObservationDay===day)return false;
  o.lastObservationDay=day;o.observations++;
  const founder=sim.animals.find(a=>a.alive&&a.id===event.individualId);
  if(!founder)return true;
  o.founderAliveDays++;
  if(sim.regionalEcology.keyAt(founder.x,founder.y)!==region.key)return true;
  o.founderResidentDays++;
  if(founder.intent==='mate')o.founderMatePursuitDays++;
  const s=SPECIES[event.species];if(!s)return true;
  const ready=physicallyReady(founder,s);
  if(ready)o.founderPhysiologicallyReadyDays++;
  let mateSeen=false,mateReady=false;
  for(const a of sim.animals){
    if(!a.alive||a.id===founder.id||a.species!==event.species||a.sex===founder.sex||
      a.age<s.maturity||sim.regionalEcology.keyAt(a.x,a.y)!==region.key||
      sim.recovery.kinship(founder,a)!=='none')continue;
    mateSeen=true;
    if(physicallyReady(a,s)){mateReady=true;break;}
  }
  if(mateSeen)o.mateResidentDays++;
  if(mateReady)o.mateReadyResidentDays++;
  if(ready&&mateReady)o.mutuallyReadyResidentDays++;
  return true;
}

export function copyEngineerBreedingOpportunity(event){
  return event?.opportunity?{...event.opportunity}:empty();
}
