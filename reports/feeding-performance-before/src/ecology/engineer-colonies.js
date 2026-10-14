import {copyEngineerBreedingOpportunity} from './engineer-breeding-opportunities.js';
// Passive genetic evidence for breeding AFTER a genuine regional reoccupation.
// Requires actual mating in the region, a real birth there, and identified
// descendants remaining there for consecutive days. Never breeds, relocates,
// feeds, or counts an animal on behalf of the simulation. Read-only to ecology.
export const ENGINEER_COLONY=Object.freeze({juvenileResidenceDays:5,conceptionLimit:24,birthLimit:24,conceptionAgeLimit:35});

export function activeEngineerColony(region,day){
  const latest=region.engineerSuccession?.events?.at(-1);
  return latest?.type==='reoccupation'&&latest.day<=day?latest:null;
}

function studyFor(event){
  return event.breeding??=( {
    founderId:event.individualId,founderGeneration:event.generation,
    relatedIds:[event.individualId],conceptions:[],births:[],
    observedMatings:0,localBirths:0,confirmedRecruits:0,multigenerationRecruits:0,
    establishedDay:null
  });
}

export function noteEngineerConception(region,mother,father,day){
  const event=activeEngineerColony(region,day);if(!event)return false;
  const study=studyFor(event);
  // A breeding observation is evidence of RETURNING family propagation, not
  // arbitrary mating somewhere in the region after any animal returned.
  if(!study.relatedIds.includes(mother.id)&&!study.relatedIds.includes(father.id))return false;
  if(mother.species!==event.species||father.species!==event.species)return false;
  const conception={motherId:mother.id,fatherId:father.id,day};
  study.conceptions.push(conception);study.observedMatings++;
  if(study.conceptions.length>ENGINEER_COLONY.conceptionLimit)study.conceptions.shift();
  return true;
}

export function noteEngineerColonyBirth(region,child,day){
  const event=activeEngineerColony(region,day);if(!event||!Array.isArray(child.parentIds)||child.species!==event.species)return false;
  const study=studyFor(event),[motherId,fatherId]=child.parentIds;
  // Births in the region following a mating elsewhere are not local breeding.
  const conception=study.conceptions.findLast(c=>c.motherId===motherId&&c.fatherId===fatherId&&c.day<=day&&day-c.day<=ENGINEER_COLONY.conceptionAgeLimit);
  if(!conception||study.births.some(b=>b.id===child.id))return false;
  const nextGenerationParent=study.births.some(b=>b.recruited&&child.parentIds.includes(b.id));
  study.births.push({id:child.id,generation:child.generation,parentIds:[...child.parentIds],conceptionDay:conception.day,day,
    continuousSamples:0,lastSampleDay:null,recruited:false,secondGeneration:nextGenerationParent});
  study.localBirths++;
  if(!study.relatedIds.includes(child.id))study.relatedIds.push(child.id);
  // Bound the ancestry and receipts, retaining a modest genealogy window.
  if(study.births.length>ENGINEER_COLONY.birthLimit)study.births.shift();
  if(study.relatedIds.length>ENGINEER_COLONY.birthLimit*2)study.relatedIds.splice(1,study.relatedIds.length-ENGINEER_COLONY.birthLimit*2);
  return true;
}

export function observeEngineerColony(region,occupants,day){
  const event=activeEngineerColony(region,day);if(!event||!event.breeding)return;
  const study=event.breeding,present=new Set(occupants.map(a=>a.id));
  for(const child of study.births){
    if(child.recruited)continue;
    if(!present.has(child.id)){child.continuousSamples=0;child.lastSampleDay=day;continue;}
    child.continuousSamples=child.lastSampleDay===day-1?child.continuousSamples+1:1;
    child.lastSampleDay=day;
    if(child.continuousSamples<ENGINEER_COLONY.juvenileResidenceDays)continue;
    child.recruited=true;child.recruitedDay=day;study.confirmedRecruits++;
    if(child.secondGeneration)study.multigenerationRecruits++;
  }
  // At least two locally conceived, born, surviving engineer descendants,
  // including a locally recruited parent of a subsequent recruited child,
  // with living representatives. A single successful litter cannot qualify.
  if(study.establishedDay===null&&study.multigenerationRecruits>0&&
    study.births.filter(b=>b.recruited&&present.has(b.id)).length>=2)study.establishedDay=day;
  study.conceptions=study.conceptions.filter(c=>day-c.day<=ENGINEER_COLONY.conceptionAgeLimit);
}

export function engineerColonyEvidence(region){
  return(region?.engineerSuccession?.events||[]).filter(e=>e.type==='reoccupation').map(e=>({
    day:e.day,founderId:e.individualId,source:e.source,fromRegion:e.fromRegion,
    opportunity:copyEngineerBreedingOpportunity(e),
    ...(e.breeding?{
      observedMatings:e.breeding.observedMatings,localBirths:e.breeding.localBirths,
      recruited:e.breeding.confirmedRecruits,multigenerationRecruits:e.breeding.multigenerationRecruits,
      establishedDay:e.breeding.establishedDay,
      births:e.breeding.births.map(b=>({...b,parentIds:[...b.parentIds]}))
    }:{observedMatings:0,localBirths:0,recruited:0,multigenerationRecruits:0,establishedDay:null,births:[]})
  }));
}
