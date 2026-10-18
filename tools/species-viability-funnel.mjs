// Species viability funnel (Phase 3I Milestone 2, diagnostic; read-only hooks, no edits to the world).
import {HUNT_COMMITMENT as __HC} from '../src/ecology/hunt-commitment.js';if(process.env.COMMIT==='0')__HC.enabled=false;
// Follows every adult of the named species each day and records where replacement is lost:
//   energy vs breeding gate -> habitat food support (breedingState) -> recovery (cooldown) -> ready
//   -> a ready opposite-sex partner of its species within mate range -> attempts -> conceptions -> births
//   -> juveniles reaching maturity; plus deaths by cause and age, meal intake vs upkeep, time by intent,
//   and the preferred foods available within reach. Usage:
//   node tools/species-viability-funnel.mjs <species> <seed> [days=300] [player=0]
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {PLANTS,CFG} from '../src/sim/config.js';
import {breedingEnergyGate} from '../src/ecology/breeding-calibration.js';import {TROPHIC_RECOGNITION} from '../src/reproduction/trophic-recognition.js';if(process.env.TROPHIC==='0')TROPHIC_RECOGNITION.enabled=false;import {DEMAND_REVIEW} from '../src/ecology/demand-review.js';if(process.env.DEMAND==='1')DEMAND_REVIEW.enabled=true;
const [species='mirelick',seed='FUNNEL-A',daysArg='300',playerArg='0']=process.argv.slice(2),days=Number(daysArg),S=SPECIES[species];
const sim=new Simulation(seed,{player:playerArg==='1'});if(playerArg==='1'){sim.endOpeningGrace?.('diagnostic');sim.setPlayerAutonomy(true)}
const gate=breedingEnergyGate(species),R={variant:DEMAND_REVIEW.enabled?'demand':'current',species,seed,days,founders:0,adultDays:0,energyAboveGate:0,habitatAllowed:0,cooldownClear:0,ready:0,readyWithPartner:0,pregnantDays:0,attempts:{same:0,cross:0},conceptions:{same:0,cross:0},refusals:{},births:0,matured:0,deaths:{},deathAge:{juvenile:0,adult:0},intakePerAdultDay:0,upkeepPerAdultDay:0,intents:{},energySamples:[],foodWithin8:{},mateDistance:[]};
const tm=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{const mine=a.species===species||b.species===species;if(!mine)return tm(a,b);const cross=a.species!==b.species,f=a.sex==='F'?a:b,was=!!f.pregnant;R.attempts[cross?'cross':'same']++;const r=tm(a,b);if(!was&&f.pregnant)R.conceptions[cross?'cross':'same']++;else{const why=(a.lastCourtshipRefusal?.tick===sim.tickCount?a.lastCourtshipRefusal.reason:null)||'no-conception';R.refusals[why]=(R.refusals[why]||0)+1}return r};
const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const k=sb(m,...x);if(m.species===species)R.births+=k.length;return k};
const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&a.species===species){R.deaths[c]=(R.deaths[c]||0)+1;R.deathAge[a.age<S.maturity?'juvenile':'adult']++}return kl(a,c)};
let intake=0;const ri=sim.resolveInteraction.bind(sim);sim.resolveInteraction=a=>{if(a.species!==species)return ri(a);const e=a.energy;const r=ri(a);if(a.energy>e)intake+=a.energy-e;return r};
const wasAdult=new Set();R.founders=sim.animals.filter(a=>a.alive&&a.species===species).length;
for(let d=0;d<days;d++){const d0=sim.day;let t=0;
  while(sim.day===d0){sim.update(null);if(++t%4===0)for(const a of sim.animals)if(a.alive&&a.species===species&&a.age>=S.maturity)R.intents[a.intent]=(R.intents[a.intent]||0)+1}
  const adults=sim.animals.filter(a=>a.alive&&a.species===species&&a.age>=S.maturity);
  for(const a of sim.animals)if(a.alive&&a.species===species&&a.age>=S.maturity&&!wasAdult.has(a.id)){wasAdult.add(a.id);if(a.parentIds?.length)R.matured++}
  const readyOf=a=>a.energy/S.maxEnergy>=gate&&(a.reproCooldown||0)<=0&&!a.pregnant&&sim.carrying.breedingState(a).allowed;
  const ready=new Set(adults.filter(readyOf));
  for(const a of adults){let nd=Infinity;for(const b of adults)if(b!==a&&b.sex!==a.sex)nd=Math.min(nd,Math.hypot(b.x-a.x,b.y-a.y));if(Number.isFinite(nd))R.mateDistance.push(nd);R.adultDays++;const e=a.energy/S.maxEnergy;R.energySamples.push(e);if(e>=gate)R.energyAboveGate++;if(sim.carrying.breedingState(a).allowed)R.habitatAllowed++;if((a.reproCooldown||0)<=0)R.cooldownClear++;if(a.pregnant)R.pregnantDays++;
    if(ready.has(a)){R.ready++;if(adults.some(b=>b!==a&&b.sex!==a.sex&&ready.has(b)&&Math.hypot(b.x-a.x,b.y-a.y)<=Math.max(12,24*a.genes.senses)))R.readyWithPartner++}}
  if(d%30===0&&adults.length){const a=adults[0],w=sim.world;for(const [k,pref] of Object.entries(S.diets||{})){if(!PLANTS[k]&&k!=='carrion')continue;let sum=0;for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const px=a.x+x,py=a.y+y;if(!w.isPlayable(px,py))continue;const i=w.idx(px,py);sum+=k==='carrion'?w.carrion[i]:(w.plants[k]?.[i]||0)}(R.foodWithin8[k]??=[]).push(+(sum*pref).toFixed(1))}}
  if(!adults.length&&!sim.animals.some(a=>a.alive&&a.species===species))break;
}
R.intakePerAdultDay=+(intake/Math.max(1,R.adultDays)).toFixed(2);R.upkeepPerAdultDay=+(S.baseMetabolism*8).toFixed(2);
{const m=R.mateDistance.sort((a,b)=>a-b);R.mateDistance=m.length?{p25:+m[m.length>>2].toFixed(1),median:+m[m.length>>1].toFixed(1),p75:+m[(m.length*3)>>2].toFixed(1)}:null}const v=R.energySamples.sort((a,b)=>a-b);R.energyMedian=v.length?+v[v.length>>1].toFixed(2):null;delete R.energySamples;
const pct=k=>R.adultDays?+(R[k]/R.adultDays*100).toFixed(1):0;R.shares={energyAboveGate:pct('energyAboveGate'),habitatAllowed:pct('habitatAllowed'),cooldownClear:pct('cooldownClear'),ready:pct('ready'),readyWithPartner:pct('readyWithPartner'),pregnant:pct('pregnantDays')};
const it=Object.values(R.intents).reduce((a,b)=>a+b,0)||1;R.intents=Object.fromEntries(Object.entries(R.intents).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,n])=>[k,+(n/it*100).toFixed(1)]));
R.alive=sim.animals.filter(a=>a.alive&&a.species===species).length;R.dayReached=sim.day;R.gate=gate;
console.log(JSON.stringify(R));
