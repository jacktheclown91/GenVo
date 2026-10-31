// Soil-water probe (roadmap stage W). Same seed with all animals removed: every <step> days, land moisture
// (mean, 10th/50th/90th percentile, share >= 0.72 which counts as drinkable ground), mean groundwater, mean
// moisture by distance band from open water, the day's climate, and standing plant biomass by kind.
// Usage: node tools/soil-water-probe.mjs <seed> [days=720] [step=16]   env SOILWATER=0 restores the old rule,
// ANIMALS=1 keeps the animals, WEATHERPATTERNS=0 restores the old per-step rain, DROUGHT=<startDay>:<length> sets rain to 0 for that window (drought test only).
import {SOIL_WATER} from '../../src/ecology/soil-water.js';if(process.env.SOILWATER==='0')SOIL_WATER.enabled=false;
// WEATHERPATTERNS=0 restores the previous per-step rain (persistent weather off).
import {WEATHER_PATTERNS} from '../../src/ecology/weather.js';if(process.env.WEATHERPATTERNS==='0')WEATHER_PATTERNS.enabled=false;
const {Simulation}=await import('../../src/sim/simulation.js');
const [seed='SELECT-A',daysArg='720',stepArg='16']=process.argv.slice(2),days=+daysArg,step=+stepArg;
const sim=new Simulation(seed,{player:false}),w=sim.world;if(process.env.ANIMALS!=='1'){sim.animals=[];sim.rebuildSpatial()}
const [dStart,dLen]=(process.env.DROUGHT||'').split(':').map(Number);
if(dLen){const pc=sim.phaseClimate.bind(sim);sim.phaseClimate=()=>{pc();if(sim.day>=dStart&&sim.day<dStart+dLen)sim.climate={...sim.climate,rain:0}}}
const land=[];for(let i=0;i<w.len;i++)if(!w.water[i])land.push(i);
const band=i=>{const d=w.waterDistance[i];return w.drinkable[i]?'shore':d<=3?'near':d<=10?'mid':'far'};
const rows=[];const r3=v=>+v.toFixed(3);
const snap=()=>{const m=land.map(i=>w.moisture[i]).sort((a,b)=>a-b),q=p=>r3(m[Math.min(m.length-1,Math.floor(p*m.length))]);
  const bands={};for(const i of land){const b=bands[band(i)]??=[0,0];b[0]+=w.moisture[i];b[1]++}
  const plants={};for(const [k,f] of Object.entries(w.plants)){let t=0;for(const i of land)t+=f[i];plants[k]=Math.round(t)}
  const plantBands={};for(const [k,f] of Object.entries(w.plants)){const o=plantBands[k]={};for(const i of land){const b=o[band(i)]??=[0,0];b[0]+=f[i];b[1]++}for(const [bk,v] of Object.entries(o))o[bk]=r3(v[0]/v[1])}
  const g=w.soilWater?.groundwater;rows.push({day:sim.day,season:sim.season,rain:r3(sim.climate?.rain??0),temp:r3(sim.climate?.temp??0),mean:r3(m.reduce((a,b)=>a+b,0)/m.length),p10:q(.1),p50:q(.5),p90:q(.9),wet72:r3(m.filter(v=>v>=.72).length/m.length),
    groundwater:g?r3(land.reduce((a,i)=>a+g[i],0)/land.length):null,bands:Object.fromEntries(Object.entries(bands).map(([k,b])=>[k,r3(b[0]/b[1])])),plants,plantBands,animals:sim.animals.filter(a=>a.alive).length})};
const budget=[];const r4=v=>+v.toFixed(4);
for(let d=0;d<days;d++){if(d%step===0)snap();const d0=sim.day;while(sim.day===d0)sim.update(null);const L=w.soilWater?.lastDay;
  if(L&&L.day!==budget.at(-1)?.day)budget.push({day:L.day,rain:r4(L.climateRain),weather:sim.weatherPattern?r4(sim.weatherPattern.factor):null,moisture:r4(L.meanMoisture),inputs:+L.inputs.toFixed(2),runoff:+L.runoff.toFixed(2),evaporation:+L.evaporation.toFixed(2),uptake:+L.uptake.toFixed(2),deepDrainage:+L.deepDrainage.toFixed(2),lateral:+L.lateral.toFixed(2),storageChange:+L.storageChange.toFixed(2),closure:L.closure})}
snap();console.log(JSON.stringify({seed,soilWater:SOIL_WATER.enabled,weatherPatterns:WEATHER_PATTERNS.enabled,drought:dLen?{start:dStart,length:dLen}:null,totals:w.soilWater?.totals??null,maxAbsClosure:budget.reduce((m,d)=>Math.max(m,Math.abs(d.closure)),0),budget,rows}));
