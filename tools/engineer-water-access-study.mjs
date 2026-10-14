import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
const seed=process.argv[2]||'NATURAL-ENGINEERS-A',limit=Number(process.argv[3]||90);
const sim=new Simulation(seed,{player:false});let day=-1;const snapshots=[];
while(sim.day<=limit){sim.update(null);if(sim.day!==day){day=sim.day;if(day%30===0){
  checkEcologicalIntegrity(sim,132);
  const adult=sim.animals.filter(a=>a.alive&&a.species==='rootling'&&a.age>=SPECIES.rootling.maturity&&hasPart(a,'digging-forelimb'));
  const hydrated=adult.filter(a=>a.hydration/SPECIES.rootling.maxHydration>=.65);
  const near=adult.filter(a=>sim.world.isDrinkable(a.x,a.y)||sim.world.waterDistance[sim.world.idx(a.x,a.y)]<=3);
  const site=adult.filter(a=>a.breedingSite&&day<=a.breedingSite.untilDay);
  snapshots.push({day,adult:adult.length,hydrated:hydrated.length,nearBank:near.length,withSite:site.length,avgHydration:adult.reduce((t,a)=>t+a.hydration/SPECIES.rootling.maxHydration,0)/Math.max(1,adult.length),births:sim.stats.births});
  console.log('water-study',seed,'day',day,JSON.stringify(snapshots.at(-1)));
}}}
const total=sim.regionalEcology.engineerWaterAccessEvidence().total;
const life=sim.regionalEcology.engineerLifeHistoryEvidence();
const result={seed,days:limit,counts:{alive:sim.animals.filter(a=>a.alive).length,births:sim.stats.births},snapshots,total,lifeHistory:{conceptions:life.conceptions,births:life.births,birthsOutsideConceptionRegion:life.birthsOutsideConceptionRegion,survivedSevenDays:life.survivedSevenDays}};
console.log('ET_WATER_STUDY_JSON',JSON.stringify(result));
