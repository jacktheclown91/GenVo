// Threat-appraisal impact (decision-coordination audit): same seed, no player, ?threatAppraisal on vs off.
// Population by species every 60 days, predation kills by prey species, and extinctions.
// Usage: node tools/compare-threat-appraisal.mjs <seed> [days=360] [appraisal|presence]
import {THREAT_APPRAISAL} from '../../src/ecology/threat-appraisal.js';
const [seed='THREAT-A',daysArg='360',variant='appraisal']=process.argv.slice(2);THREAT_APPRAISAL.enabled=variant==='appraisal';
const {Simulation}=await import('../../src/sim/simulation.js');const {checkEcologicalIntegrity}=await import('../ecological-integrity.mjs');
const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length,kills={},timeline=[];let checks=0;
const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&c==='predation')kills[a.species]=(kills[a.species]||0)+1;return kl(a,c)};
const pop=()=>{const p={};for(const a of sim.animals)if(a.alive)p[a.species]=(p[a.species]||0)+1;return p};
for(let d=0;d<=Number(daysArg);d++){if(d%60===0)timeline.push({day:sim.day,...pop()});const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
const start=timeline[0],end=timeline.at(-1),extinct=Object.keys(start).filter(k=>k!=='day'&&start[k]>0&&!end[k]);
console.log(JSON.stringify({seed,variant,timeline,kills,extinct,checks}));
