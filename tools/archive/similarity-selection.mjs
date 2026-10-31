// Similarity-preference selection (Phase 3I Milestone 3, natural observation; no edits). Records each
// birth's inherited similarity allele and generation, and each adult's lifetime offspring by allele band,
// to see whether extreme preferences arise and persist through actual reproductive success.
// Usage: node tools/similarity-selection.mjs <seed> [days=720]
import {Simulation} from '../../src/sim/simulation.js';import {SPECIES} from '../../src/organisms/species.js';import {matePreferencesFor} from '../../src/reproduction/mate-preferences.js';
const [seed='SIMSEL-A',daysArg='720']=process.argv.slice(2),sim=new Simulation(seed,{player:false});
const allele=a=>matePreferencesFor(sim.seed,a).similarity??0,offspring=new Map(),born=[],adults=new Map();
const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const k=sb(m,...x);for(const c of k){born.push({species:c.species,gen:c.generation||0,allele:allele(c),day:sim.day});for(const id of c.parentIds||[])offspring.set(id,(offspring.get(id)||0)+1)}return k};
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0)sim.update(null);if(d%10===0)for(const a of sim.animals)if(a.alive&&a.age>=SPECIES[a.species].maturity&&!adults.has(a.id))adults.set(a.id,{species:a.species,allele:allele(a)})}
const band=v=>v<=-.3?'strong-contrast':v<-.1?'contrast':v<=.1?'neutral':v<.3?'similar':'strong-similar';const bands={};
for(const [id,a] of adults){const b=bands[band(a.allele)]??={adults:0,offspring:0};b.adults++;b.offspring+=offspring.get(id)||0}
for(const b of Object.values(bands))b.perAdult=+(b.offspring/b.adults).toFixed(2);
const byGen={};for(const b of born){const g=byGen[b.gen]??={n:0,sum:0,extreme:0};g.n++;g.sum+=b.allele;if(Math.abs(b.allele)>=.3)g.extreme++}
for(const g of Object.values(byGen)){g.mean=+(g.sum/g.n).toFixed(3);g.extremeShare=+(g.extreme/g.n).toFixed(2);delete g.sum;delete g.extreme}
console.log(JSON.stringify({seed,days:sim.day,births:born.length,adultsObserved:adults.size,successByBand:bands,allelesByGeneration:byGen}));
