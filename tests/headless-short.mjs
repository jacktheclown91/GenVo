import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
// General natural worlds have no mandatory survival or predetermined ratios.
// The unchanged five seeds and320-day horizon are mechanical regression scenarios.
const seeds=['GENVO8-TEST-A','GENVO8-TEST-B','GENVO8-TEST-C','GENVO8-TEST-D','GENVO8-TEST-E'];
for(const seed of seeds){
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length;
  let lastDay=-1,peak=initial;
  while(sim.day<=320){
    const tick=sim.tickCount;sim.update(null);assert.ok(sim.tickCount>tick,'simulation must advance');
    const alive=sim.animals.filter(a=>a.alive).length;
    assert.ok(alive<=CFG.maxAnimals+8,'population ceiling violated');peak=Math.max(peak,alive);
    if(sim.day!==lastDay){const receipt=checkEcologicalIntegrity(sim,initial);lastDay=sim.day;console.log(JSON.stringify({seed,...receipt,peak,causes:sim.stats.byCause,ecologicalReview:'required'}));}
  }
}
console.log('short natural-world mechanical integrity: PASS; causal and runtime acceptance remain separate');
