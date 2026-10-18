// Stalker hunting budget (Phase 3J Step 3, diagnostic; read-only hooks). Per Stalker-day: contact bites,
if(process.env.NOMOSS==='1'){const m=await import('../src/sim/simulation.js');const P=m.Simulation.prototype,f=P.coverAt;P.coverAt=function(a){if(!a)return 0;const w=this.world,i=w.idx(a.x,a.y);return Math.min(1,(w.plants.bramble?.[i]||0)*.82+(w.plants.marshroot?.[i]||0)*.72+(w.plants.thistlepod?.[i]||0)*.45)}}
import {HUNT_COMMITMENT as __HC} from '../src/ecology/hunt-commitment.js';if(process.env.COMMIT==='0')__HC.enabled=false;
// hits, kills, energy gained from hunting, share of time hunting, and basal upkeep. Usage:
//   node tools/stalker-hunting-budget.mjs <seed> [days=240]
import {REFUGE_PARITY} from '../src/ecology/refuges.js';if(process.env.REFUGE==='0')REFUGE_PARITY.enabled=false;
const {Simulation}=await import('../src/sim/simulation.js');import {SPECIES} from '../src/organisms/species.js';import {CFG} from '../src/sim/config.js';
const [seed='NJ-A',daysArg='240']=process.argv.slice(2),sim=new Simulation(seed,{player:false}),S=SPECIES.needlejaw;
const R={stalkerDays:0,contacts:0,hits:0,kills:0,energyFromHunting:0,huntTicks:0,ticks:0,byPrey:{},chances:[]};
const tk=sim.tryKill.bind(sim);sim.tryKill=(a,b,o)=>{if(a.species!=='needlejaw')return tk(a,b,o);const e=a.energy,alive=b.alive;let p=null;const ch=sim.rng.chance;sim.rng.chance=x=>{p??=x;return ch.call(sim.rng,x)};const hit=tk(a,b,o);sim.rng.chance=ch;R.contacts++;if(p!=null)R.chances.push(p);if(hit)R.hits++;if(alive&&!b.alive)R.kills++;R.energyFromHunting+=Math.max(0,a.energy-e);const k=R.byPrey[b.species]??={contacts:0,kills:0};k.contacts++;if(alive&&!b.alive)k.kills++;return hit};
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0){sim.update(null);for(const a of sim.animals)if(a.alive&&a.species==='needlejaw'&&a.age>=S.maturity){R.ticks++;if(/hunt|stalk|chase|charge/.test(a.intent||''))R.huntTicks++}}
  R.stalkerDays+=sim.animals.filter(a=>a.alive&&a.species==='needlejaw'&&a.age>=S.maturity).length}
const per=v=>+(v/Math.max(1,R.stalkerDays)).toFixed(3),c=R.chances.sort((a,b)=>a-b);
console.log(JSON.stringify({seed,stalkerDays:R.stalkerDays,contactsPerDay:per(R.contacts),hitsPerDay:per(R.hits),killsPerDay:per(R.kills),huntingEnergyPerDay:per(R.energyFromHunting),basalUpkeepPerDay:+(S.baseMetabolism*S.mass*CFG.dayTicks/CFG.lifeStride).toFixed(3),huntingTimeShare:+(R.huntTicks/Math.max(1,R.ticks)).toFixed(3),medianCaptureChance:c.length?+c[c.length>>1].toFixed(2):null,byPrey:R.byPrey}));
