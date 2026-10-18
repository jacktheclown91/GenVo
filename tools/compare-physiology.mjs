// Shared physiology impact on wild ecology (Phase 3J Step 1, diagnostic): same seed, no player,
// ?physiologyParity on vs off. Records population every 60 days, births by species, share of time
// drinking and feeding, and median energy/hydration. Usage: node tools/compare-physiology.mjs <seed> [days] [shared|old]
import {PHYSIOLOGY_PARITY} from '../src/ecology/physiology.js';
const [seed='PHYS-A',daysArg='360',variant='shared']=process.argv.slice(2);PHYSIOLOGY_PARITY.enabled=variant!=='old';if(variant==='wildbite')PHYSIOLOGY_PARITY.mealBite='wild';if(variant==='nofoodwater')PHYSIOLOGY_PARITY.foodWater=false;if(variant==='wildmeal'){PHYSIOLOGY_PARITY.mealBite='wild';PHYSIOLOGY_PARITY.foodWater=false}
const {Simulation}=await import('../src/sim/simulation.js');const {SPECIES}=await import('../src/organisms/species.js');const {checkEcologicalIntegrity}=await import('./ecological-integrity.mjs');
const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length,births={},timeline=[],intents={},E=[],H=[];let checks=0;
const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const k=sb(m,...x);if(k.length)births[m.species]=(births[m.species]||0)+k.length;return k};
const pop=()=>{const p={};for(const a of sim.animals)if(a.alive)p[a.species]=(p[a.species]||0)+1;return p};
for(let d=0;d<=Number(daysArg);d++){if(d%60===0)timeline.push({day:sim.day,...pop()});const d0=sim.day;let t=0;while(sim.day===d0){sim.update(null);if(++t%8===0)for(const a of sim.animals)if(a.alive){intents[a.intent]=(intents[a.intent]||0)+1}}
  if(d%10===0)for(const a of sim.animals)if(a.alive){const s=SPECIES[a.species];E.push(a.energy/s.maxEnergy);H.push(a.hydration/s.maxHydration)}if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
const tot=Object.values(intents).reduce((a,b)=>a+b,0),med=v=>{v.sort((a,b)=>a-b);return +v[v.length>>1].toFixed(2)};
console.log(JSON.stringify({seed,variant,timeline,births,drinkShare:+(intents.drink/tot).toFixed(3),feedShare:+(intents.feed/tot).toFixed(3),energyMedian:med(E),hydrationMedian:med(H),checks}));
