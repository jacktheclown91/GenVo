// EV: passive, tile-distance family evidence independent of arbitrary 16x16
// regions. A border crossing is not itself proof of habitat abandonment.
// These observations do not affect decisions, movement, mating or resources.
export const ENGINEER_FAMILY_SETTLEMENT=Object.freeze({siteRadius:6,motherRadius:4,followDays:7,minPairedSiteDays:5});
const distance=(x,y,p)=>Math.hypot(x-p.x,y-p.y);
function episodes(controller){return [...controller.records.values()].flatMap(r=>r.engineerBreedingHabitat?.episodes||[]);}
function findEpisode(controller,mother,child){
  return episodes(controller).findLast(e=>e.motherId===mother.id&&
    e.conceptionDay===mother.pregnant?.startedDay&&e.fatherId===child.parentIds?.[1]);
}
export function noteEngineerFamilySettlementBirth(controller,child,mother,day){
  if(!child?.alive||!mother?.pregnant||!child.parentIds?.includes(mother.id))return false;
  const e=findEpisode(controller,mother,child);if(!e)return false;
  e.familySettlement??={offspring:[]};
  if(e.familySettlement.offspring.some(c=>c.id===child.id))return false;
  const birthDistance=distance(child.x,child.y,e.site);
  const outsideRegion=controller.keyAt(child.x,child.y)!==e.siteRegion;
  e.familySettlement.offspring.push({id:child.id,birthDay:day,birthRegion:controller.keyAt(child.x,child.y),
    birth:{x:child.x,y:child.y},birthDistance,birthMotherDistance:distance(child.x,child.y,mother),
    outsideConceptionRegion:outsideRegion,
    // These classifications can coexist with a border crossing. Neither
    // implies successful settlement or a new colony.
    nearbyBorderCrossing:outsideRegion&&birthDistance<=ENGINEER_FAMILY_SETTLEMENT.siteRadius,
    farWithinRegion:!outsideRegion&&birthDistance>ENGINEER_FAMILY_SETTLEMENT.siteRadius,
    sampledDays:0,daysNearSite:0,daysNearMother:0,pairedSiteDays:0,
    lastObservedDay:null,deathDay:null,survivedSevenDays:false,pairedSiteRetention:false});
  return true;
}
export function noteEngineerFamilySettlementDeath(controller,animal,day){
  for(const e of episodes(controller))for(const c of e.familySettlement?.offspring||[])
    if(c.id===animal.id&&c.deathDay===null)c.deathDay=day;
}
export function observeEngineerFamilySettlement(controller,day){
  const living=new Map(controller.sim.animals.filter(a=>a.alive).map(a=>[a.id,a]));
  for(const e of episodes(controller))for(const c of e.familySettlement?.offspring||[]){
    if(c.deathDay!==null||day<=c.birthDay||day>c.birthDay+ENGINEER_FAMILY_SETTLEMENT.followDays||c.lastObservedDay===day)continue;
    c.lastObservedDay=day;
    const child=living.get(c.id);if(!child)continue;
    c.sampledDays++;
    const mother=living.get(e.motherId),childNear=distance(child.x,child.y,e.site)<=ENGINEER_FAMILY_SETTLEMENT.siteRadius;
    if(childNear)c.daysNearSite++;
    if(mother&&distance(child.x,child.y,mother)<=ENGINEER_FAMILY_SETTLEMENT.motherRadius)c.daysNearMother++;
    if(childNear&&mother&&distance(mother.x,mother.y,e.site)<=ENGINEER_FAMILY_SETTLEMENT.siteRadius&&
       distance(child.x,child.y,mother)<=ENGINEER_FAMILY_SETTLEMENT.motherRadius)c.pairedSiteDays++;
    if(day-c.birthDay===ENGINEER_FAMILY_SETTLEMENT.followDays){
      c.survivedSevenDays=true;
      c.pairedSiteRetention=c.pairedSiteDays>=ENGINEER_FAMILY_SETTLEMENT.minPairedSiteDays;
    }
  }
}
export function engineerFamilySettlementEvidence(controller){
  const all=episodes(controller).flatMap(e=>(e.familySettlement?.offspring||[]).map(c=>({
    ...c,birth:{...c.birth},conceptionSite:{...e.site},conceptionRegion:e.siteRegion,
    motherId:e.motherId,fatherId:e.fatherId,species:e.species,conceptionDay:e.conceptionDay
  })));
  const total={offspring:all.length,bornOutsideRegion:0,nearbyBorderCrossings:0,farWithinRegion:0,
    farOutsideRegion:0,bornNearSite:0,survivedSevenDays:0,pairedSiteRetention:0,followupPending:0};
  for(const c of all){
    if(c.outsideConceptionRegion)total.bornOutsideRegion++;
    if(c.nearbyBorderCrossing)total.nearbyBorderCrossings++;
    if(c.farWithinRegion)total.farWithinRegion++;
    if(c.outsideConceptionRegion&&!c.nearbyBorderCrossing)total.farOutsideRegion++;
    if(c.birthDistance<=ENGINEER_FAMILY_SETTLEMENT.siteRadius)total.bornNearSite++;
    if(c.survivedSevenDays)total.survivedSevenDays++;
    if(c.pairedSiteRetention)total.pairedSiteRetention++;
    if(!c.survivedSevenDays&&c.deathDay===null)total.followupPending++;
  }
  return {total,offspring:all};
}
