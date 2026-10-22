// Read-only daily life trace of every individual of chosen species in a natural
// planetary world: energetics, water, maturity, medium, behaviour, breeding
// gate, mate access, prey access and reachable food. Diagnostic only; it
// calls existing read-side queries and never edits organisms or stocks.
// Usage: node tools/trace-species-life.mjs <seed> <days> <out.ndjson> <species,...> [vision|control]
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {canHunt,preyPreference} from '../src/ecology/functional-diet.js';
import {FRESHWATER_FOOD,freshwaterField,freshwaterPreference} from '../src/ecology/freshwater-food.js';
import {isWaterDweller} from '../src/lineage/aquatic.js';
const [seed,daysArg,out,list,arm='vision']=process.argv.slice(2);
const days=Number(daysArg),targets=new Set(list.split(','));
const sim=new Simulation(seed,{player:false,worldGenerator:'planetary/1',anatomicalVision:arm==='vision'});
fs.writeFileSync(out,'',{flag:'wx'});const write=r=>fs.appendFileSync(out,JSON.stringify(r)+'\n');
const deaths=[];const kill=sim.kill;sim.kill=function(a,cause){const was=a?.alive;const r=kill.call(this,a,cause);if(was&&!a.alive&&targets.has(a.species))deaths.push({day:sim.day,id:a.id,species:a.species,cause,age:+a.age.toFixed(1),energy:+(a.energy/SPECIES[a.species].maxEnergy).toFixed(3),sex:a.sex});return r};
const w=sim.world,prevEnergy=new Map(),intents=new Map();
const foodNear=(a,r=5)=>{let total=0;const kinds=Object.keys(FRESHWATER_FOOD).map(k=>[k,freshwaterPreference(a,k)]).filter(([,p])=>p>0);
 for(let y=Math.floor(a.y-r);y<=a.y+r;y++)for(let x=Math.floor(a.x-r);x<=a.x+r;x++){if(!w.isPlayable(x+.5,y+.5)||Math.hypot(x+.5-a.x,y+.5-a.y)>r)continue;const i=w.idx(x+.5,y+.5);if(!w.water[i])continue;for(const [k,p] of kinds)total+=(freshwaterField(w,k)?.[i]||0)*FRESHWATER_FOOD[k].nutrition*p}
 return +total.toFixed(2)};
write({type:'start',seed,arm,species:[...targets],founders:sim.animals.filter(a=>targets.has(a.species)).map(a=>({id:a.id,species:a.species,sex:a.sex,age:+a.age.toFixed(1),inWater:!!w.water[w.idx(a.x,a.y)],waterDweller:isWaterDweller(a),hunter:canHunt(a)}))});
for(let d=1;d<=days;d++){
 // Behaviour mix over the day, sampled every tick.
 for(let i=0;i<CFG.dayTicks;i++){sim.update(null);for(const a of sim.animals)if(a.alive&&targets.has(a.species)){const m=intents.get(a.id)||{};m[a.intent||'none']=(m[a.intent||'none']||0)+1;intents.set(a.id,m)}}
 const live=sim.animals.filter(a=>a.alive);
 for(const a of live){if(!targets.has(a.species))continue;const s=SPECIES[a.species],r=s.reproduction||{};
  let b=null;try{b=sim.carrying.breedingState(a)}catch(e){b={error:String(e.message).slice(0,80)}}
  const mates=live.filter(o=>o!==a&&o.species===a.species&&o.sex!==a.sex&&o.age>=SPECIES[o.species].maturity),mateD=mates.length?Math.min(...mates.map(o=>Math.hypot(o.x-a.x,o.y-a.y))):null;
  const preyR=r.preyRadius||12,prey=canHunt(a)?live.filter(o=>o!==a&&preyPreference(a,o)>0&&Math.hypot(o.x-a.x,o.y-a.y)<=preyR).length:null;
  const e=a.energy/s.maxEnergy,prev=prevEnergy.get(a.id);prevEnergy.set(a.id,e);
  write({type:'life',day:sim.day,id:a.id,species:a.species,sex:a.sex,age:+a.age.toFixed(1),mature:a.age>=s.maturity,energy:+e.toFixed(3),energyDelta:prev===undefined?null:+(e-prev).toFixed(3),hydration:+(a.hydration/s.maxHydration).toFixed(3),
   inWater:!!w.water[w.idx(a.x,a.y)],x:+a.x.toFixed(1),y:+a.y.toFixed(1),intents:intents.get(a.id)||{},pregnant:!!a.pregnant,
   breeding:b&&{allowed:b.allowed,resource:+(b.resource??0).toFixed(3),resourceValue:+(b.resourceValue??0).toFixed(2),crowd:+(b.crowd??0).toFixed(2),ratio:+(b.ratio??0).toFixed(2),error:b.error},
   mates:mates.length,nearestMate:mateD===null?null:+mateD.toFixed(1),preyInRadius:prey,freshwaterFoodNear:foodNear(a)})}
 intents.clear();
 for(const x of deaths.splice(0))write({type:'death',...x});
 const counts={};for(const a of live)if(targets.has(a.species))counts[a.species]=(counts[a.species]||0)+1;
 write({type:'census',day:sim.day,counts,population:live.length});
 if(![...targets].some(t=>counts[t]))break;
}
sim.kill=kill;delete sim.kill;
