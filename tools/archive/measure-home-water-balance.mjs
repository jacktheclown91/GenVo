// Read-only long-run water state of an ordinary home valley (native AUTO): groundwater,
// surface water, drinkable shore, soil moisture, plants, animals and the soil-water ledger.
// Usage: node --max-old-space-size=8192 tools/measure-home-water-balance.mjs REPO_ROOT SEED DAYS OUTPUT.json
import {pathToFileURL} from 'node:url';import fs from 'node:fs';
const [repo,seed,days,out]=process.argv.slice(2);const load=f=>import(pathToFileURL(`${repo}/src/${f}`).href);
const {Simulation}=await load('sim/simulation.js');const {PLANTS}=await load('sim/config.js');
const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,courtshipSimilarity:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,tissueEnergy:true,perennialRegrowth:true});
sim.setPlayerAutonomy(true);const rows=[];const day=()=>{const d=sim.day;while(sim.day===d)sim.update(null)};
for(let k=1;k<=Number(days);k++){day();if(k%10===0){const w=sim.world,soil=w.soilWater;let gw=0,water=0,drink=0,moist=0,plants=0;for(let i=0;i<w.len;i++){gw+=soil.groundwater[i];if(w.water[i])water++;if(w.drinkable[i])drink++;moist+=w.moisture[i]}
 for(const kind of Object.keys(PLANTS))for(const v of w.plants[kind]||[])plants+=v;
 const t=soil.totals;rows.push({day:sim.day,season:sim.season,groundwater:Math.round(gw),water,drinkableShore:drink,meanMoisture:+(moist/w.len).toFixed(3),plants:Math.round(plants),animals:sim.animals.filter(a=>a.alive).length,deaths:{...sim.stats.byCause},rain:Math.round(t.rain+t.snowfall),evaporation:Math.round(t.evaporation),capillary:Math.round(t.capillary),percolation:Math.round(t.percolation),springs:Math.round(t.springDischarge||0)});
 console.log(JSON.stringify(rows.at(-1)));fs.writeFileSync(out,JSON.stringify(rows,null,1))}}
