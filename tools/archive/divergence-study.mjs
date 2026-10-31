#!/usr/bin/env node
// Descriptive cross-seed research. No universal species survival, colony, or equilibrium target.
import fs from 'node:fs';
import {Simulation} from '../../src/sim/simulation.js';
import {checkEcologicalIntegrity} from '../ecological-integrity.mjs';
const seeds=Number(process.argv[2]||3),days=Number(process.argv[3]||30),out=process.argv[4]||null;
if(!Number.isInteger(seeds)||seeds<1||seeds>32||!Number.isInteger(days)||days<1||days>3000)throw Error('Usage: node tools/divergence-study.mjs [worlds 1..32] [days 1..3000] [output.json]');
const result={schema:'genvo8.divergence-study/1',horizonDays:days,rule:'Descriptive; no required survivor, mate, work or colony outcome',worlds:[]};
for(let i=0;i<seeds;i++){
 const seed=`GENVO8-VARIATION-${String(i+1).padStart(2,'0')}`,sim=new Simulation(seed,{player:false});
 const populationAtStart=sim.animals.filter(a=>a.alive).length;
 let previous=-1,peakLiving=populationAtStart;
 while(sim.day<=days){sim.update(null);if(sim.day!==previous){previous=sim.day;if(sim.day%8===0)checkEcologicalIntegrity(sim,populationAtStart);peakLiving=Math.max(peakLiving,sim.animals.filter(a=>a.alive).length)}}
 const ending=checkEcologicalIntegrity(sim,populationAtStart);
 result.worlds.push({seed,day:sim.day,initialLiving:populationAtStart,peakLiving,finalPopulation:ending.population,births:ending.births,deaths:ending.deaths,resourceTotals:ending.resources});
 console.error(`${seed}: day ${sim.day}, ${Object.values(ending.population).reduce((a,b)=>a+b,0)} living, births ${ending.births}, deaths ${ending.deaths}`);
}
if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
