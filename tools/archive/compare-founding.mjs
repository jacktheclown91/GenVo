// Founding comparison (Phase 3I Milestone 2, diagnostic): renewable-food founding vs configured founding
// (?resourceFounding=0), same seed, no player. Records population by species every 60 days, births by
// species and Stalker (needlejaw) same-species mating attempts. Usage:
//   node tools/compare-founding.mjs <seed> [days=360] [renewable|configured]
import {RESOURCE_FOUNDING} from '../../src/ecology/resource-founding.js';
const [seed='FOUND-A',daysArg='360',variant='renewable']=process.argv.slice(2);RESOURCE_FOUNDING.enabled=variant==='renewable';
const {Simulation}=await import('../../src/sim/simulation.js');const {checkEcologicalIntegrity}=await import('../ecological-integrity.mjs');
const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length,births={},timeline=[];let nj=0,checks=0;
const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const k=sb(m,...x);if(k.length)births[m.species]=(births[m.species]||0)+k.length;return k};
const tm=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{if(a.species==='needlejaw'&&b.species==='needlejaw')nj++;return tm(a,b)};
const pop=()=>{const p={};for(const a of sim.animals)if(a.alive)p[a.species]=(p[a.species]||0)+1;return p};
for(let d=0;d<=Number(daysArg);d++){if(d%60===0)timeline.push({day:sim.day,...pop()});const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
console.log(JSON.stringify({seed,variant,founding:sim.foundingReport,timeline,births,needlejawSameAttempts:nj,checks}));
