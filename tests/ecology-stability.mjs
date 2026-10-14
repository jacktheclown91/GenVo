import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';

// General natural worlds: no mandatory species survival, ratios or equilibrium.
// Mechanism-specific expectations belong to their controlled scenario tests.
for(const seed of ['GENVO8-TEST-A','GENVO8-TEST-C','GENVO8-TEST-E']){
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length;
  let peak=initial,lastDay=-1;
  while(sim.day<=640){
    const tick=sim.tickCount;sim.update(null);
    assert.ok(sim.tickCount>tick,'simulation must advance');
    if(sim.day!==lastDay){
      checkEcologicalIntegrity(sim,initial);lastDay=sim.day;
      peak=Math.max(peak,sim.animals.filter(a=>a.alive).length);
    }
  }
  console.log(JSON.stringify({seed,day:sim.day,population:sim.population(),peak,abovePerformanceExpectation:peak>CFG.performanceTarget,atEmergencyCeiling:peak>=CFG.maxAnimals,byCause:sim.stats.byCause,ecologicalReview:'required'}));
}
console.log('natural-world mechanical integrity: PASS; causal and runtime acceptance remain separate');
