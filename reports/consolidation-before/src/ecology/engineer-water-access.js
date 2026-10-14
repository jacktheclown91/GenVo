import {SPECIES} from '../organisms/species.js';
import {hasPart} from '../lineage/part-abilities.js';

// ET: passive water-access and family-retention observations. The distance is
// the world's precomputed bank-step distance (not a promise that the animal
// reaches or uses the bank). Real drinks are credited only after hydration rose.
export const ENGINEER_WATER_ACCESS=Object.freeze({historyLimit:24,hydrationNeed:.65,nearBankSteps:3});

export function isObservedEngineer(animal){
  return !!animal?.alive&&!animal.player&&!animal.lineage&&
    SPECIES[animal.species]?.social?.mode==='colony'&&hasPart(animal,'digging-forelimb');
}

function empty(){return {samples:0,belowCourtshipWater:0,belowUrgentWater:0,readyToCourt:0,
  onDrinkableTile:0,nearBank:0,farBank:0,noBankRoute:0,drinkIntent:0,
  activeBreedingSite:0,outsideSiteRegion:0,drinkActions:0,waterGained:0,
  drinkActionsAwayFromSite:0,routeStepSum:0,routeStepSamples:0};}

export function observeEngineerWaterAccess(controller,day){
  const world=controller.sim.world,byRegion=new Map();
  for(const a of controller.sim.animals){
    if(!isObservedEngineer(a)||a.age<SPECIES[a.species].maturity)continue;
    const key=controller.keyAt(a.x,a.y),s=SPECIES[a.species];
    let obs=byRegion.get(key);if(!obs){obs=empty();byRegion.set(key,obs);}
    const hydration=a.hydration/s.maxHydration,energy=a.energy/s.maxEnergy;
    const onWater=world.isDrinkable(a.x,a.y),rawSteps=onWater?0:world.waterDistance[world.idx(a.x,a.y)];
    const reachable=Number.isFinite(rawSteps)&&rawSteps<65535;
    obs.samples++;
    if(hydration<ENGINEER_WATER_ACCESS.hydrationNeed)obs.belowCourtshipWater++;
    if(hydration<.28)obs.belowUrgentWater++;
    if(!a.infected&&a.health>=65&&a.reproCooldown<=0&&!a.pregnant&&
      hydration>=ENGINEER_WATER_ACCESS.hydrationNeed&&energy>(s.reproduction?.energy??.72))obs.readyToCourt++;
    if(onWater)obs.onDrinkableTile++;
    if(!reachable)obs.noBankRoute++;
    else{obs.routeStepSum+=rawSteps;obs.routeStepSamples++;
      if(rawSteps<=ENGINEER_WATER_ACCESS.nearBankSteps)obs.nearBank++;
      else obs.farBank++;}
    if(a.intent==='drink')obs.drinkIntent++;
    if(a.breedingSite&&day<=a.breedingSite.untilDay){obs.activeBreedingSite++;
      if(controller.keyAt(a.breedingSite.x,a.breedingSite.y)!==key)obs.outsideSiteRegion++;}
  }
  for(const [key,obs] of byRegion){
    const region=controller.ensure(key),record=region.engineerWaterAccess??={total:empty(),daily:[]};
    for(const [k,value] of Object.entries(obs))record.total[k]=(record.total[k]||0)+value;
    record.daily.push({day,...obs});
    if(record.daily.length>ENGINEER_WATER_ACCESS.historyLimit)record.daily.splice(0,record.daily.length-ENGINEER_WATER_ACCESS.historyLimit);
  }
}

export function noteEngineerActualDrink(controller,a,gained){
  if(!isObservedEngineer(a)||!(gained>0))return false;
  const region=controller.ensure(controller.keyAt(a.x,a.y));
  const rec=region.engineerWaterAccess??={total:empty(),daily:[]};
  rec.total.drinkActions=(rec.total.drinkActions||0)+1;
  rec.total.waterGained=(rec.total.waterGained||0)+gained;
  if(a.breedingSite&&controller.sim.day<=a.breedingSite.untilDay&&
    controller.keyAt(a.x,a.y)!==controller.keyAt(a.breedingSite.x,a.breedingSite.y))
    rec.total.drinkActionsAwayFromSite=(rec.total.drinkActionsAwayFromSite||0)+1;
  // Actual sips are deliberately not attributed to a day unless sampled;
  // the total is an event counter independent of the observation cadence.
  return true;
}

export function engineerWaterAccessEvidence(controller){
  const regions=[...controller.records.values()].filter(r=>r.engineerWaterAccess)
    .map(r=>({region:r.key,total:{...r.engineerWaterAccess.total},
      daily:r.engineerWaterAccess.daily.map(day=>({...day}))}));
  const total=empty();for(const r of regions)for(const [k,value] of Object.entries(r.total))total[k]+=value;
  return {total,regions};
}
