// Paired comparison of the breeding calibration candidate (src/ecology/breeding-calibration.js):
// the same seed runs with the current defaults and with the review candidate, unstaged, and reports
// per-species births/deaths/populations plus mechanical integrity. Outcomes are observations only.
// Usage: node tools/compare-breeding-calibration.mjs <seed> [years=3] [out.json]
import fs from 'node:fs';
import {Simulation} from '../../src/sim/simulation.js';
import {BREEDING_REVIEW} from '../../src/ecology/breeding-calibration.js';
import {checkEcologicalIntegrity} from '../ecological-integrity.mjs';
const seed=process.argv[2]||'BREED-CMP-A',years=Number(process.argv[3]||3),out=process.argv[4];
function run(enabled){
 BREEDING_REVIEW.enabled=enabled;const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length,births={},deaths={},start={};
 for(const a of sim.animals)start[a.species]=(start[a.species]||0)+1;
 const ob=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...r)=>{const c=ob(m,...r);births[m.species]=(births[m.species]||0)+c.length;return c};
 const ok=sim.kill.bind(sim);sim.kill=(a,cause)=>{if(a.alive)deaths[a.species]=(deaths[a.species]||0)+1;return ok(a,cause)};
 let integrityChecks=0,lastDay=sim.day;const t0=Date.now();
 while(sim.year<=years){sim.update(null);if(sim.day!==lastDay){lastDay=sim.day;if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);integrityChecks++}}}
 const end={};for(const a of sim.animals)if(a.alive)end[a.species]=(end[a.species]||0)+1;
 return{enabled,start,births,deaths,end,integrityChecks,seconds:+((Date.now()-t0)/1000).toFixed(0)};
}
const result={seed,years,current:run(false),candidate:run(true)};BREEDING_REVIEW.enabled=false;
if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));console.log(JSON.stringify(result));
