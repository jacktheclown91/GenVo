import {SPECIES} from '../organisms/species.js';
import {hasPart} from '../lineage/part-abilities.js';

// EU: receipts for *actual* pairings and gestations. Migration's 'water'
// score measures habitat moisture; here bank steps measure physical access to
// genuinely drinkable water separately. Observation never redirects animals.
export const ENGINEER_BREEDING_HABITAT=Object.freeze({maxEpisodesPerRegion:32,bankNearSteps:3,siteRadius:2.6});

function qualified(mother,father){
  return !!mother?.alive&&!!father?.alive&&mother.species===father.species&&
    SPECIES[mother.species]?.social?.mode==='colony'&&
    !mother.player&&!mother.lineage&&!father.player&&!father.lineage&&
    (hasPart(mother,'digging-forelimb')||hasPart(father,'digging-forelimb'));
}
function bankSteps(world,x,y){
  if(world.isDrinkable(x,y))return 0;
  const distance=world.waterDistance[world.idx(x,y)];
  return Number.isFinite(distance)&&distance<65535?distance:null;
}
function episodes(controller){
  return [...controller.records.values()].flatMap(region=>region.engineerBreedingHabitat?.episodes||[]);
}
export function noteEngineerBreedingHabitatConception(controller,mother,father,day){
  if(!qualified(mother,father)||!mother.pregnant||mother.pregnant.startedDay!==day)return false;
  const key=controller.keyAt(mother.x,mother.y);
  if(controller.keyAt(father.x,father.y)!==key)return false;
  const region=controller.ensure(key),record=region.engineerBreedingHabitat??={episodes:[]};
  if(record.episodes.some(e=>e.motherId===mother.id&&e.conceptionDay===day))return false;
  const site={x:mother.x,y:mother.y},quality=controller.sim.migration.habitatQuality(mother,site.x,site.y);
  const steps=bankSteps(controller.sim.world,site.x,site.y),s=SPECIES[mother.species];
  record.episodes.push({motherId:mother.id,fatherId:father.id,species:mother.species,
    conceptionDay:day,siteRegion:key,site,siteBankSteps:steps,
    siteNearBank:steps!==null&&steps<=ENGINEER_BREEDING_HABITAT.bankNearSteps,
    siteFoodScore:quality.food,siteMoistureScore:quality.water,
    siteDanger:quality.danger,siteHabitatScore:quality.score,
    conceptionHydration:mother.hydration/s.maxHydration,
    gestationDays:mother.pregnant.totalDays,
    daysObserved:0,daysInSiteRegion:0,daysNearSite:0,
    daysBelowCourtshipHydration:0,daysNearBank:0,daysOnDrinkableGround:0,
    daysWithFoodHabitat:.0,birthDay:null,birthRegion:null,
    offspringIds:[],bornOutsideSiteRegion:0,gestationEndedWithoutBirth:false});
  if(record.episodes.length>ENGINEER_BREEDING_HABITAT.maxEpisodesPerRegion)
    record.episodes.splice(0,record.episodes.length-ENGINEER_BREEDING_HABITAT.maxEpisodesPerRegion);
  return true;
}
export function observeEngineerBreedingHabitat(controller,day){
  const pregnant=new Map(controller.sim.animals.filter(a=>a.alive&&a.pregnant).map(a=>[a.id,a]));
  for(const e of episodes(controller)){
    if(e.birthDay!==null||e.gestationEndedWithoutBirth||day<e.conceptionDay)continue;
    const mother=pregnant.get(e.motherId);
    if(!mother||mother.pregnant?.startedDay!==e.conceptionDay){
      e.gestationEndedWithoutBirth=true;continue;
    }
    // Idempotence across repeated observation calls on the same day.
    if(e.lastObservedDay===day)continue;
    e.lastObservedDay=day;e.daysObserved++;
    if(controller.keyAt(mother.x,mother.y)===e.siteRegion)e.daysInSiteRegion++;
    if(Math.hypot(mother.x-e.site.x,mother.y-e.site.y)<=ENGINEER_BREEDING_HABITAT.siteRadius)e.daysNearSite++;
    const s=SPECIES[mother.species],steps=bankSteps(controller.sim.world,mother.x,mother.y);
    if(mother.hydration/s.maxHydration<.65)e.daysBelowCourtshipHydration++;
    if(steps!==null&&steps<=ENGINEER_BREEDING_HABITAT.bankNearSteps)e.daysNearBank++;
    if(controller.sim.world.isDrinkable(mother.x,mother.y))e.daysOnDrinkableGround++;
    // Only a sampled, contemporaneous forage score; no virtual food supply.
    if(controller.sim.migration.habitatQuality(mother,mother.x,mother.y).food>=.1)e.daysWithFoodHabitat++;
  }
}
export function noteEngineerBreedingHabitatBirth(controller,child,mother,day){
  if(!mother?.pregnant||!child?.parentIds?.includes(mother.id))return false;
  const e=episodes(controller).find(p=>p.motherId===mother.id&&p.conceptionDay===mother.pregnant.startedDay&&p.fatherId===child.parentIds[1]);
  if(!e||e.offspringIds.includes(child.id))return false;
  const birthRegion=controller.keyAt(child.x,child.y);
  e.birthDay=day;e.birthRegion=birthRegion;
  e.offspringIds.push(child.id);
  if(birthRegion!==e.siteRegion)e.bornOutsideSiteRegion++;
  return true;
}
export function engineerBreedingHabitatEvidence(controller){
  const found=episodes(controller);
  const total={conceptions:found.length,nearBankConceptions:0,farBankConceptions:0,
    noBankConceptions:0,delivered:0,offspring:0,offspringOutsideSite:0,
    gestationObservationDays:0,daysInSiteRegion:0,daysNearSite:0,
    daysBelowCourtshipHydration:0,daysNearBank:0,daysOnDrinkableGround:0};
  for(const e of found){
    if(e.siteBankSteps===null)total.noBankConceptions++;
    else if(e.siteNearBank)total.nearBankConceptions++;
    else total.farBankConceptions++;
    if(e.birthDay!==null)total.delivered++;
    total.offspring+=e.offspringIds.length;total.offspringOutsideSite+=e.bornOutsideSiteRegion;
    total.gestationObservationDays+=e.daysObserved;
    for(const k of ['daysInSiteRegion','daysNearSite','daysBelowCourtshipHydration','daysNearBank','daysOnDrinkableGround'])total[k]+=e[k];
  }
  return {total,episodes:found.map(e=>({...e,site:{...e.site},offspringIds:[...e.offspringIds]}))};
}
