import {Simulation} from '../src/sim/simulation.js';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
const seed=process.argv[2]||'NATURAL-ENGINEERS-A',limit=Number(process.argv[3]||130);
const sim=new Simulation(seed,{player:false});let previous=-1;
while(sim.day<=limit){sim.update(null);if(sim.day!==previous){previous=sim.day;
  if(sim.day%30===0){checkEcologicalIntegrity(sim,132);
    console.log('EU_DAY',seed,sim.day,'births',sim.stats.births,'conceptions',sim.regionalEcology.engineerBreedingHabitatEvidence().total.conceptions);
  }
}}
const {total,episodes}=sim.regionalEcology.engineerBreedingHabitatEvidence();
const near=episodes.filter(e=>e.siteNearBank),far=episodes.filter(e=>!e.siteNearBank&&e.siteBankSteps!==null),no=episodes.filter(e=>e.siteBankSteps===null);
const group=xs=>({conceptions:xs.length,delivered:xs.filter(e=>e.birthDay!==null).length,
  offspring:xs.reduce((n,e)=>n+e.offspringIds.length,0),
  offspringOutsideSite:xs.reduce((n,e)=>n+e.bornOutsideSiteRegion,0),
  gestationDays:xs.reduce((n,e)=>n+e.daysObserved,0),
  inSiteRegionDays:xs.reduce((n,e)=>n+e.daysInSiteRegion,0),
  belowCourtshipHydrationDays:xs.reduce((n,e)=>n+e.daysBelowCourtshipHydration,0),
  localFoodScoreMean:xs.reduce((n,e)=>n+e.siteFoodScore,0)/Math.max(1,xs.length),
  siteBankStepsMean:xs.reduce((n,e)=>n+e.siteBankSteps,0)/Math.max(1,xs.length)});
console.log('EU_HABITAT_JSON',JSON.stringify({seed,day:sim.day,worldBirths:sim.stats.births,total,groups:{near:group(near),far:group(far),noRoute:group(no)},episodes:episodes.map(e=>({siteRegion:e.siteRegion,siteBankSteps:e.siteBankSteps,siteFoodScore:e.siteFoodScore,siteDanger:e.siteDanger,day:e.conceptionDay,daysObserved:e.daysObserved,daysInSiteRegion:e.daysInSiteRegion,daysBelowCourtshipHydration:e.daysBelowCourtshipHydration,birthDay:e.birthDay,offspring:e.offspringIds.length,outside:e.bornOutsideSiteRegion}))}));
