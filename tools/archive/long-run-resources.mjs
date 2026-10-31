// Long-run resource probe (Phase 3K; read-only hooks). Every 60 days: total standing plant biomass by kind
// (sum over playable land cells), population by species, mean adult energy fraction, births, and deaths by
// cause in that window. For telling bottom-up (food) declines from top-down (predation) ones.
// Usage: node tools/long-run-resources.mjs <seed> [days=720]   env MOVEMENT=0 disables movement parity.
import {MOVEMENT_PARITY} from '../../src/ecology/movement-parity.js';if(process.env.MOVEMENT==='0')MOVEMENT_PARITY.enabled=false;
// STAGES=0, PREYRISK=0, APPRAISAL=0 switch off staged perception, prey bite-back and behaviour-based threat appraisal.
import {THREAT_STAGES} from '../../src/ecology/threat-perception.js';import {PREY_RISK} from '../../src/ecology/prey-risk.js';import {THREAT_APPRAISAL} from '../../src/ecology/threat-appraisal.js';
if(process.env.STAGES==='0')THREAT_STAGES.enabled=false;if(process.env.PREYRISK==='0')PREY_RISK.enabled=false;if(process.env.APPRAISAL==='0')THREAT_APPRAISAL.enabled=false;
// SOILWATER=0 restores the previous soil-moisture rule (roadmap stage W).
import {SOIL_WATER} from '../../src/ecology/soil-water.js';if(process.env.SOILWATER==='0')SOIL_WATER.enabled=false;
// WEATHERPATTERNS=0 restores the previous per-step rain (persistent weather off).
import {WEATHER_PATTERNS} from '../../src/ecology/weather.js';if(process.env.WEATHERPATTERNS==='0')WEATHER_PATTERNS.enabled=false;
const {Simulation}=await import('../../src/sim/simulation.js');const {SPECIES}=await import('../../src/organisms/species.js');
const [seed='SELECT-A',daysArg='720']=process.argv.slice(2),sim=new Simulation(seed,{player:false}),w=sim.world,days=Number(daysArg);
let deaths={},births={};const inc=(o,k)=>{o[k]=(o[k]||0)+1};
const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive)inc(deaths,a.species+':'+c);return kl(a,c)};
const sp=sim.spawnAnimal.bind(sim);sim.spawnAnimal=(s,x,y,p)=>{const c=sp(s,x,y,p);if(p&&c)inc(births,s);return c};
// NOANIMALS=1: the same world with every animal removed (abiotic plant dynamics only).
if(process.env.NOANIMALS==='1'){sim.animals=[];sim.rebuildSpatial()}
const rows=[];
const snap=()=>{const plants={};for(const [k,f] of Object.entries(w.plants)){let t=0;for(let i=0;i<f.length;i++)t+=f[i];plants[k]=Math.round(t)}
  const pop={},en={};for(const a of sim.animals){if(!a.alive)continue;inc(pop,a.species);if(a.age>=SPECIES[a.species].maturity){const e=en[a.species]??={s:0,n:0};e.s+=a.energy/SPECIES[a.species].maxEnergy;e.n++}}
  let ms=0,mc=0;for(let i=0;i<w.len;i++)if(!w.water[i]){ms+=w.moisture[i];mc++}
  rows.push({day:sim.day,moisture:+(ms/mc).toFixed(3),plants,pop,adultEnergy:Object.fromEntries(Object.entries(en).map(([k,e])=>[k,+(e.s/e.n).toFixed(2)])),births,deaths});deaths={};births={}};
for(let d=0;d<days;d++){if(d%60===0)snap();const d0=sim.day;while(sim.day===d0)sim.update(null)}
snap();console.log(JSON.stringify({seed,movementParity:MOVEMENT_PARITY.enabled,stages:THREAT_STAGES.enabled,preyRisk:PREY_RISK.enabled,appraisal:THREAT_APPRAISAL.enabled,soilWater:SOIL_WATER.enabled,weatherPatterns:WEATHER_PATTERNS.enabled,rows}));
