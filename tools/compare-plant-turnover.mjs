// Plant turnover candidate impact (Phase 3J Step 5, diagnostic): same seed, no player, turnover on vs off.
// Rotcap per land cell, mirelick funnel essentials (births, alive, energy), all populations, plant stocks.
// Usage: node tools/compare-plant-turnover.mjs <seed> [days=360] [on|off]
import {PLANT_TURNOVER} from '../src/ecology/plant-resources.js';
const [seed='TURN-A',daysArg='360',variant='on']=process.argv.slice(2);PLANT_TURNOVER.enabled=variant!=='off';if(process.env.TURN_RATE)PLANT_TURNOVER.rate=1/Number(process.env.TURN_RATE);
const {Simulation}=await import('../src/sim/simulation.js');const {SPECIES}=await import('../src/organisms/species.js');const {PLANTS}=await import('../src/sim/config.js');const {checkEcologicalIntegrity}=await import('./ecological-integrity.mjs');
const sim=new Simulation(seed,{player:false}),w=sim.world,initial=sim.animals.filter(a=>a.alive).length,births={},timeline=[];let checks=0,mireMeals=0;
const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const k=sb(m,...x);if(k.length)births[m.species]=(births[m.species]||0)+k.length;return k};
const snap=()=>{const p={};for(const a of sim.animals)if(a.alive)p[a.species]=(p[a.species]||0)+1;let land=0;const stock={};for(const k of Object.keys(PLANTS))stock[k]=0;for(let i=0;i<w.len;i++){if(w.water[i])continue;land++;for(const k of Object.keys(PLANTS))stock[k]+=w.plants[k][i]}
  const mire=sim.animals.filter(a=>a.alive&&a.species==='mirelick');const mE=mire.map(a=>a.energy/SPECIES.mirelick.maxEnergy).sort((a,b)=>a-b);
  return{day:sim.day,...p,perCell:Object.fromEntries(Object.entries(stock).map(([k,v])=>[k,+(v/land).toFixed(3)])),mirelickEnergyMedian:mE.length?+mE[mE.length>>1].toFixed(2):null}};
for(let d=0;d<=Number(daysArg);d++){if(d%60===0)timeline.push(snap());const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
console.log(JSON.stringify({seed,variant,timeline,births,litterSenesced:+(w.plantResources.totals.senescence||0).toFixed(1),fungalGrowth:+w.organicResources.totals.fungalGrowth.toFixed(1),checks}));
