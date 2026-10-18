// Movement-parity ecology comparison (Phase 3K Priority 2; read-only hooks, no world edits). Same seed, no
// player, ?movementParity on vs off. Everything the creator asked to compare, from one run:
//   - population by species every 60 days, extinctions;
//   - predator/prey contact (tryKill calls by hunter and prey species), kills, deaths by cause;
//   - Stalker (needlejaw) hunting budget per adult-day: contacts, kills, energy gained from hunting, share of
//     ticks hunting, against basal upkeep;
//   - water trips (adult non-hunters taking 'drink' away from water): completed share, by species;
//   - mating: tryMate attempts and births by species; offspring born in the run that reached maturity (late births have
//     had less time, so compare variants, not absolute shares);
//   - adult condition: mean energy fraction sampled daily; starvation and dehydration deaths;
//   - movement: mean path length per adult-day and mean 10-day net displacement per adult (dispersal).
// Usage: node tools/compare-movement-parity.mjs <seed> [days=360] [on|off]
import {MOVEMENT_PARITY} from '../src/ecology/movement-parity.js';
import {THREAT_STAGES} from '../src/ecology/threat-perception.js';import {PREY_RISK} from '../src/ecology/prey-risk.js';
// Env STAGES=0 / PREYRISK=0 switch off staged threat perception / prey bite-back (Phase 3K Priorities 3-4).
if(process.env.STAGES==='0')THREAT_STAGES.enabled=false;if(process.env.PREYRISK==='0')PREY_RISK.enabled=false;
// SOILWATER=0 restores the previous soil-moisture rule (roadmap stage W).
import {SOIL_WATER} from '../src/ecology/soil-water.js';if(process.env.SOILWATER==='0')SOIL_WATER.enabled=false;
// WEATHERPATTERNS=0 restores the previous per-step rain (persistent weather off).
import {WEATHER_PATTERNS} from '../src/ecology/weather.js';if(process.env.WEATHERPATTERNS==='0')WEATHER_PATTERNS.enabled=false;
const [seed='THREAT-A',daysArg='360',variant='on']=process.argv.slice(2);MOVEMENT_PARITY.enabled=variant!=='off';
const {Simulation}=await import('../src/sim/simulation.js');const {SPECIES}=await import('../src/organisms/species.js');const {CFG}=await import('../src/sim/config.js');
const sim=new Simulation(seed,{player:false}),w=sim.world,days=Number(daysArg),adult=a=>a.age>=SPECIES[a.species].maturity;
const inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n};
const R={timeline:[],contacts:{},kills:{},deaths:{},births:{},mateAttempts:{},stalker:{adultDays:0,contacts:0,kills:0,energy:0,huntTicks:0,ticks:0},
  drink:{},energy:{},path:{},disp:{},born:new Map(),matured:{},bornCount:{}};
// Contact and Stalker hunting income.
const tk=sim.tryKill.bind(sim);sim.tryKill=(a,b,o)=>{const e=a.energy,alive=b.alive;const hit=tk(a,b,o);inc(R.contacts,a.species+'>'+b.species);
  if(alive&&!b.alive)inc(R.kills,a.species+'>'+b.species);if(a.species==='needlejaw'){R.stalker.contacts++;if(alive&&!b.alive)R.stalker.kills++;R.stalker.energy+=Math.max(0,a.energy-e)}return hit};
const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive){inc(R.deaths,a.species+':'+c);const b=R.born.get(a.id);if(b&&adult(a))b.matured=true}return kl(a,c)};
const tm=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{inc(R.mateAttempts,a.species);return tm(a,b)};
const sp=sim.spawnAnimal.bind(sim);sim.spawnAnimal=(species,x,y,parents)=>{const c=sp(species,x,y,parents);if(parents&&c){inc(R.births,species);R.born.set(c.id,{species,matured:false,a:c})}return c};
const pop=()=>{const p={};for(const a of sim.animals)if(a.alive)inc(p,a.species);return p};
const anchor=new Map(),openDrink=new Map();
for(let d=0;d<days;d++){if(d%60===0)R.timeline.push({day:sim.day,...pop()});const d0=sim.day;
  while(sim.day===d0){const pos=new Map();for(const a of sim.animals)if(a.alive)pos.set(a.id,[a.x,a.y]);
    sim.update(null);
    for(const a of sim.animals){if(!a.alive||!adult(a))continue;const p=pos.get(a.id);if(p)inc(R.path,a.species,Math.hypot(a.x-p[0],a.y-p[1]));
      if(a.species==='needlejaw'){R.stalker.ticks++;if(/hunt|stalk|chase|charge/.test(a.intent||''))R.stalker.huntTicks++}}
    if(sim.tickCount%CFG.lifeStride!==0)continue;
    for(const a of sim.animals){const s=SPECIES[a.species];if(!adult(a)||s.hunter)continue;const e=openDrink.get(a.id),drinking=a.alive&&a.intent==='drink'&&a.target;
      if(e){if(a.alive&&w.isDrinkable(a.x,a.y)&&a.hydration>e.h+.5){inc(R.drink,a.species+':drank');openDrink.delete(a.id);continue}e.h=a.hydration;if(!drinking){inc(R.drink,a.species+':abandoned');openDrink.delete(a.id);continue}}
      if(drinking&&!openDrink.has(a.id)&&!w.isDrinkable(a.x,a.y))openDrink.set(a.id,{h:a.hydration})}}
  for(const a of sim.animals){if(!a.alive)continue;const b=R.born.get(a.id);if(b&&adult(a))b.matured=true;if(!adult(a))continue;const s=SPECIES[a.species];
    const e=R.energy[a.species]??={sum:0,n:0};e.sum+=a.energy/s.maxEnergy;e.n++;if(a.species==='needlejaw')R.stalker.adultDays++;
    if(d%10===0){const an=anchor.get(a.id);if(an){const r=R.disp[a.species]??={sum:0,n:0};r.sum+=Math.hypot(a.x-an[0],a.y-an[1]);r.n++}anchor.set(a.id,[a.x,a.y])}}}
R.timeline.push({day:sim.day,...pop()});
const start=R.timeline[0],end=R.timeline.at(-1),extinct=Object.keys(start).filter(k=>k!=='day'&&start[k]>0&&!end[k]);
const r2=v=>+v.toFixed(2),St=R.stalker,S=SPECIES.needlejaw;
const species=[...new Set(Object.keys(start).filter(k=>k!=='day'))];
const per={};for(const k of species){const e=R.energy[k],drank=R.drink[k+':drank']||0,ab=R.drink[k+':abandoned']||0,born=[...R.born.values()].filter(b=>b.species===k);
  per[k]={meanAdultEnergy:e?r2(e.sum/e.n):null,pathTilesPerAdultDay:e?r2((R.path[k]||0)/e.n):null,tenDayDisplacement:R.disp[k]?r2(R.disp[k].sum/R.disp[k].n):null,
    drinkTrips:drank+ab,drankShare:drank+ab?r2(drank/(drank+ab)):null,mateAttempts:R.mateAttempts[k]||0,births:R.births[k]||0,offspringMatured:born.filter(b=>b.matured).length,
    deaths:Object.fromEntries(Object.entries(R.deaths).filter(([c])=>c.startsWith(k+':')).map(([c,n])=>[c.slice(k.length+1),n]))}}
console.log(JSON.stringify({seed,variant,stages:THREAT_STAGES.enabled,preyRisk:PREY_RISK.enabled,soilWater:SOIL_WATER.enabled,weatherPatterns:WEATHER_PATTERNS.enabled,threatStages:sim.stats.threatStages||null,biteBacks:sim.stats.preyRisk||null,days,timeline:R.timeline,extinct,contacts:R.contacts,kills:R.kills,
  stalker:{adultDays:St.adultDays,contactsPerDay:r2(St.contacts/Math.max(1,St.adultDays)),killsPerDay:+(St.kills/Math.max(1,St.adultDays)).toFixed(3),huntingEnergyPerDay:r2(St.energy/Math.max(1,St.adultDays)),
    basalUpkeepPerDay:r2(S.baseMetabolism*S.mass*CFG.dayTicks/CFG.lifeStride),huntingTimeShare:+(St.huntTicks/Math.max(1,St.ticks)).toFixed(3)},species:per}));
