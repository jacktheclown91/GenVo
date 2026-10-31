// Weather statistics (roadmap stage W). Runs only Simulation.phaseClimate, with the day and season advanced exactly
// as the simulation does, for <years> years on each seed, old rule (WEATHERPATTERNS=0) or persistent weather.
// Reports per season: mean daily rain, daily rain relative to the seasonal normal (CV, lag-1 autocorrelation),
// share of ecology steps and of days with heavy rain (rain >= 0.72, the "heavy rain" storm label) and rough rain
// (>= 0.58), wet spells (days at >= 1.25x normal), dry spells (<= 0.6x normal), and droughts: runs where the
// trailing 16-day (half-year) mean is <= 0.7x normal.
// Usage: node tools/weather-stats.mjs [years=200] [seeds=SELECT-A,SELECT-C,W-1,W-2]   env WEATHERPATTERNS=0
import {WEATHER_PATTERNS} from '../../src/ecology/weather.js';if(process.env.WEATHERPATTERNS==='0')WEATHER_PATTERNS.enabled=false;
// Parameter sweeps: FAST, SLOW (spreads), PF, PS (persistences) override WEATHER_PATTERNS for this run only.
for(const [env,key] of [['FAST','fastSpread'],['SLOW','slowSpread'],['PF','fastPersistence'],['PS','slowPersistence']])if(process.env[env])WEATHER_PATTERNS[key]=+process.env[env];
const {Simulation}=await import('../../src/sim/simulation.js');const {CFG}=await import('../../src/sim/config.js');
const [yearsArg='200',seedsArg='SELECT-A,SELECT-C,W-1,W-2']=process.argv.slice(2),years=+yearsArg,seeds=seedsArg.split(','),base=[.58,.35,.46,.26];
const r3=v=>+(+v).toFixed(3);const runs=(flags)=>{const out=[];let n=0;for(const f of flags){if(f)n++;else if(n){out.push(n);n=0}}if(n)out.push(n);return out};
const spell=(flags,years)=>{const r=runs(flags);return{perYear:r3(r.length/years),meanDays:r.length?r3(r.reduce((a,b)=>a+b,0)/r.length):0,maxDays:r.length?Math.max(...r):0}};
const all={days:[],season:[],ticksHeavy:0,ticksRough:0,ticks:0};
for(const seed of seeds){const sim=new Simulation(seed,{player:false,bootstrap:false});
  for(let d=0;d<years*4*CFG.seasonDays;d++){let sum=0,heavy=0;for(let t=0;t<CFG.dayTicks;t++){sim.phaseClimate();const r=sim.climate.rain;sum+=r;if(r>=.72){heavy=1;all.ticksHeavy++}if(r>=.58)all.ticksRough++;all.ticks++;sim.tickCount++}
    all.days.push({seed,season:sim.seasonIndex,rain:sum/CFG.dayTicks,rel:sum/CFG.dayTicks/base[sim.seasonIndex],heavy});
    sim.day++;if((sim.day-1)%CFG.seasonDays===0){sim.seasonIndex=(sim.seasonIndex+1)%4;if(sim.seasonIndex===0)sim.year++}}}
const totalYears=years*seeds.length,bySeason={};
for(let s=0;s<4;s++){const D=all.days.filter(d=>d.season===s),rel=D.map(d=>d.rel),m=rel.reduce((a,b)=>a+b,0)/rel.length,sd=Math.sqrt(rel.reduce((a,b)=>a+(b-m)**2,0)/rel.length);
  bySeason[CFG.seasons[s]]={meanRain:r3(D.reduce((a,d)=>a+d.rain,0)/D.length),normal:base[s],relMean:r3(m),relCV:r3(sd/m),heavyRainDayShare:r3(D.filter(d=>d.heavy).length/D.length),dailyMeanHeavyShare:r3(D.filter(d=>d.rain>=.72).length/D.length)}}
// Autocorrelation and spells along each seed's continuous day sequence.
let ac=0,acn=0;const wet=[],dry=[],drought=[],storm=[];
for(const seed of seeds){const D=all.days.filter(d=>d.seed===seed);for(let i=1;i<D.length;i++){ac+=(D[i].rel-1)*(D[i-1].rel-1);acn++}
  const varr=D.reduce((a,d)=>a+(d.rel-1)**2,0)/D.length;if(seed===seeds[0])all.var=varr;
  wet.push(...D.map(d=>d.rel>=1.25),false);dry.push(...D.map(d=>d.rel<=.6),false);storm.push(...D.map(d=>d.rain>=.72),false);
  let acc=[];drought.push(...D.map(d=>{acc.push(d.rel);if(acc.length>16)acc.shift();return acc.length===16&&acc.reduce((a,b)=>a+b,0)/16<=.7}),false)}
console.log(JSON.stringify({weatherPatterns:WEATHER_PATTERNS.enabled,params:{...WEATHER_PATTERNS},seeds,years,lag1Autocorrelation:r3(ac/acn/all.var),bySeason,
  stepShareHeavyRain:r3(all.ticksHeavy/all.ticks),stepShareRoughRain:r3(all.ticksRough/all.ticks),
  stormDays:spell(storm,totalYears),wetSpells:spell(wet,totalYears),drySpells:spell(dry,totalYears),droughts:spell(drought,totalYears)},null,1));
