import {Simulation} from '../../src/sim/simulation.js';
import {checkEcologicalIntegrity} from '../ecological-integrity.mjs';
const seed=process.argv[2]||'NATURAL-ENGINEERS-A',limit=Number(process.argv[3]||130);
const sim=new Simulation(seed,{player:false});let previous=0;
while(sim.day<=limit){sim.update(null);if(sim.day!==previous){previous=sim.day;
 if(sim.day%30===0){checkEcologicalIntegrity(sim,132);console.log('EV_DAY',seed,sim.day,'worldBirths',sim.stats.births,'settlementBirths',sim.regionalEcology.engineerFamilySettlementEvidence().total.offspring);}
}}
const {total,offspring}=sim.regionalEcology.engineerFamilySettlementEvidence();
checkEcologicalIntegrity(sim,132);
console.log('EV_SETTLEMENT_JSON',JSON.stringify({seed,day:sim.day,worldBirths:sim.stats.births,worldDeaths:sim.stats.deaths,total,
  crossRegionNearSample:offspring.filter(c=>c.nearbyBorderCrossing).slice(0,5).map(c=>({birthDistance:c.birthDistance,birthDay:c.birthDay,nearSiteDays:c.daysNearSite,pairedSiteDays:c.pairedSiteDays,survivedSevenDays:c.survivedSevenDays})),
  farWithinSample:offspring.filter(c=>c.farWithinRegion).slice(0,5).map(c=>({birthDistance:c.birthDistance,birthDay:c.birthDay})),
  completedCohorts:offspring.filter(c=>c.survivedSevenDays||c.deathDay!==null).length}));
