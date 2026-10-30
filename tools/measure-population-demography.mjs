// Population demography field (stabilization P0, October 30): runs a new-game world with
// the current new-game rule stack and records, per species and period, where the breeding
// pipeline narrows. Observation only; nothing is tuned or forced.
//   adults and juveniles by sex, ages against maturity and lifespan;
//   adult females that are free to breed (not carrying, cooldown spent), those the
//     breeding-support gate allows, and those with a reachable compatible mate;
//   mating attempts, accepted courtships and conceptions (from tryMate receipts);
//   births, deaths by cause and life stage, and juvenile survival to maturity.
// Usage: node --max-old-space-size=8192 tools/measure-population-demography.mjs SEED DAYS PERIOD OUTPUT.json
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const [seed='DEMOGRAPHY-1',daysArg='365',periodArg='30',out]=process.argv.slice(2),days=Number(daysArg),period=Number(periodArg);
if(!(days>0&&days<=1000&&period>0))throw Error('Supply 1..1000 days and a positive period');
const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,courtshipSimilarity:true,dayClock:true,metabolism:true,
 foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,tissueEnergy:true,perennialRegrowth:true,regionalFounding:'regional-founding-templates/3',
 bodySize:'body-size/2',inertia:true,structuralSupport:true,aridPhysiology:true,climateWater:true,diurnal:true,autonomousEvolution:true,grazingNutrients:true,breedingSupport:'breeding-support/2',starterPartner:'same-land-partner/1',
 // GENVO_UNDERGROUND_FEEDING=0 measures the world without underground-feeding/1 for comparison.
 undergroundFeeding:process.env.GENVO_UNDERGROUND_FEEDING==='0'?false:'wild-underground-feeding/1'});
sim.setPlayerAutonomy(true);
const blank=()=>({attempts:0,accepted:0,conceived:0,births:0,deaths:{},juvenileDeaths:{},oldDeaths:{}});
let tally={};const bucket=s=>tally[s]||=blank();
const born=new Map(),cohort={};// id -> {species, day}; species -> {born, matured, diedYoung}
const stage=a=>{const s=SPECIES[a.species];return a.age<s.maturity?'juvenile':a.age>=.8*s.lifespan?'old':'adult'};
const kill=sim.kill.bind(sim);
sim.kill=(a,cause)=>{if(a.alive&&SPECIES[a.species]&&!a.player){const t=bucket(a.species),st=stage(a),key=st==='juvenile'?'juvenileDeaths':st==='old'?'oldDeaths':'deaths';t[key][cause]=(t[key][cause]||0)+1;
  const b=born.get(a.id);if(b&&st==='juvenile')(cohort[a.species]||={born:0,matured:0,diedYoung:0}).diedYoung++;born.delete(a.id)}return kill(a,cause)};
const tryMate=sim.tryMate.bind(sim);
sim.tryMate=(a,b)=>{const before=a.lastReproductiveAttempt;const r=tryMate(a,b);const after=a.lastReproductiveAttempt;
  if(a.species&&SPECIES[a.species]){const t=bucket(a.species);t.attempts++;if(after&&after!==before){if(after.accepted)t.accepted++;if(after.conceived)t.conceived++}}return r};
const spawn=sim.spawnFundedOffspring.bind(sim);
sim.spawnFundedOffspring=(...args)=>{const children=spawn(...args);for(const c of children||[]){if(!SPECIES[c.species])continue;bucket(c.species).births++;born.set(c.id,{species:c.species,day:sim.day});(cohort[c.species]||={born:0,matured:0,diedYoung:0}).born++}return children};
function census(){
 const rows={};
 for(const a of sim.animals){if(!a.alive||a.player||!SPECIES[a.species])continue;const s=SPECIES[a.species],r=rows[a.species]||={juveniles:0,adultsF:0,adultsM:0,old:0,ages:[],freeFemales:0,allowedFemales:0,matedReachable:0,pregnant:0};
  const st=stage(a);r.ages.push(a.age);if(st==='juvenile'){r.juveniles++;const b=born.get(a.id);continue}
  if(st==='old')r.old++;a.sex==='F'?r.adultsF++:r.adultsM++;
  if(a.sex==='F'){if(a.pregnant){r.pregnant++;continue}if(a.reproCooldown>0)continue;r.freeFemales++;
   if(!sim.carrying.breedingState(a).allowed)continue;r.allowedFemales++;if(sim.autonomousMateTarget(a,{far:true}))r.matedReachable++}}
 for(const [id,b] of born){const a=sim.animals.find(x=>x.id===id);if(a?.alive&&a.age>=SPECIES[a.species].maturity){(cohort[b.species]||={born:0,matured:0,diedYoung:0}).matured++;born.delete(id)}}
 for(const r of Object.values(rows)){r.ages.sort((x,y)=>x-y);r.medianAge=r.ages.length?Math.round(r.ages[r.ages.length>>1]):null;delete r.ages}
 return rows;
}
const result={schema:'genvo.population-demography/1',seed,days,period,species:Object.fromEntries(Object.entries(SPECIES).map(([k,s])=>[k,{maturity:s.maturity,lifespan:s.lifespan,litter:s.litter,gestation:s.gestation}])),start:census(),periods:[]};
const started=Date.now();
for(let d=1;d<=days;d++){
 const day=sim.day;while(sim.day===day)sim.update(null);
 if(d%period===0||d===days){result.periods.push({day:sim.day,temp:+sim.climate.temp.toFixed(2),census:census(),flows:tally,seconds:Math.round((Date.now()-started)/1000)});
  console.log(JSON.stringify({day:sim.day,alive:sim.animals.filter(a=>a.alive&&!a.player).length,births:Object.values(tally).reduce((s,t)=>s+t.births,0),conceived:Object.values(tally).reduce((s,t)=>s+t.conceived,0),attempts:Object.values(tally).reduce((s,t)=>s+t.attempts,0)}));tally={}}
}
result.juvenileCohorts=cohort;result.seconds=Math.round((Date.now()-started)/1000);
if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));
