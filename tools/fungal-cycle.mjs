// Fungal resource cycle trace (Phase 3J Step 5, diagnostic; read-only). Daily world totals of plant litter,
// carrion, rotcap standing stock, fungal growth (organicResources.totals.fungalGrowth), rotcap eaten by
// animals, and the decomposition bottleneck: how much of the litter/carrion present could be processed under
// the per-cell daily cap versus how much exists. Also mirelick-reachable rotcap per mirelick.
// Usage: node tools/fungal-cycle.mjs <seed> [days=240]
import {Simulation} from '../src/sim/simulation.js';
const [seed='FUNGI-A',daysArg='240']=process.argv.slice(2),sim=new Simulation(seed,{player:false}),w=sim.world;
let eaten=0;const nc=sim.history.notePlantConsumption.bind(sim.history);sim.history.notePlantConsumption=(kind,x,y,got)=>{if(kind==='rotcap')eaten+=got;return nc(kind,x,y,got)};
const sum=a=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i];return s};
const rows=[];let lastGrowth=w.organicResources.totals.fungalGrowth||0,lastEaten=0,lastLitter=sum(sim.dispersal.litter);
for(let d=0;d<=Number(daysArg);d++){
  if(d%20===0){let litterLand=0,cap=0,land=0,rot=0;for(let i=0;i<w.len;i++){if(w.water[i])continue;land++;const L=sim.dispersal.litter[i],C=w.carrion[i];litterLand+=L;rot+=w.rotcap[i];const perField=.012+.025*w.moisture[i]+.018*w.rotcap[i];cap+=Math.min(L,perField)+Math.min(C,perField)}
    const growth=(w.organicResources.totals.fungalGrowth||0)-lastGrowth,mire=sim.animals.filter(a=>a.alive&&a.species==='mirelick').length;
    rows.push({day:sim.day,litterOnLand:+litterLand.toFixed(1),litterPerCell:+(litterLand/land).toFixed(4),carrion:+sum(w.carrion).toFixed(2),processableToday:+cap.toFixed(2),rotcap:+rot.toFixed(1),rotcapPerCell:+(rot/land).toFixed(4),fungalGrowthPer20d:+growth.toFixed(2),rotcapEatenPer20d:+(eaten-lastEaten).toFixed(2),mirelick:mire});
    lastGrowth=w.organicResources.totals.fungalGrowth||0;lastEaten=eaten}
  const d0=sim.day;while(sim.day===d0)sim.update(null);
}
console.log(JSON.stringify({seed,rows}));
