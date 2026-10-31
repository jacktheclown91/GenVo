// Usage: node tools/probe-population-clocks.mjs <6s|30s|v1|v1f|v1fm|v1f5|v1fm5|v1fw|v1fmw> [days=360] [seed=GENVO8-TEST-A]
// v1: 30-second days with real daily needs (ecology/metabolism-policy.js); v1f: v1 plus food properties;
// v1fm: v1f plus water from prey and carrion; v1f5 and v1fm5: the same with a 5-day water reserve (comparison only).
// A trailing w adds winter water (breaking thin ice and eating snow): v1fw, v1fmw.
// Suffixes: +e adds escape landing, +t tissue energy (+G applies the physical growth and repair cost), -B the reference-body metabolism (fasting-1);
// +r perennial regrowth (-R without the root reserve, -S without seed rain); -h, -u and -s switch off the hungry-search, urgent-water and
// herd-allowance corrections.
// Long-run population record for one day clock: alive per species every 30 days, births, deaths
// by cause, and plant cover, with the player's creature on AUTO. Run once per clock on the same
// seed and compare. Measurement only.
import {Simulation} from '../../src/sim/simulation.js';
import {CFG} from '../../src/sim/config.js';
const arg=process.argv[2]||'6s',clock=arg.match(/^[a-z0-9]+/)[0],days=Number(process.argv[3]||360),seed=process.argv[4]||'GENVO8-TEST-A';
const s=new Simulation(seed,{player:true,dayClock:clock!=='6s',metabolism:clock.startsWith('v1')&&(arg.includes('-B')?'fasting-1':true),foodProperties:clock.startsWith('v1f'),tissueWater:clock.startsWith('v1fm'),winterWater:clock.endsWith('w'),escapeLanding:arg.includes('+e'),tissueEnergy:arg.includes('+t'),perennialRegrowth:arg.includes('+r'),worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);s.correctionExperiment={hungrySearch:!arg.includes('-h'),urgentWater:!arg.includes('-u'),socialAllowance:!arg.includes('-s'),tissueGrowth:arg.includes('+G'),rootReserve:!arg.includes('-R'),seedRain:!arg.includes('-S')};if(clock.endsWith('5'))s.metabolismExperiment={waterDays:5};
const deaths={},seen=new Set(s.animals.map(a=>a.id)),kill=s.kill.bind(s);let births=0;s.kill=(a,c)=>{if(a?.alive)deaths[c]=(deaths[c]||0)+1;return kill(a,c)};
const plants=()=>{let t=0;for(const k of Object.keys(s.world.plants))for(const v of s.world.plants[k])t+=v;return +t.toFixed(0)};
const census=()=>{const c={};for(const a of s.animals)if(a.alive&&!a.player)c[a.species]=(c[a.species]||0)+1;return c};
const rows=[{day:s.day,alive:census(),plants:plants()}],t0=Date.now();
for(let d=1;d<=days;d++){for(let t=0;t<CFG.dayTicks;t++)s.update(null);for(const a of s.animals)if(!seen.has(a.id)){seen.add(a.id);births++}if(d%30===0)rows.push({day:s.day,alive:census(),plants:plants(),births,deaths:{...deaths},predationKills:s.stats.byCause?.predation||0,tissueWater:s.stats.tissueWater?{...s.stats.tissueWater}:null,winterWater:s.stats.winterWater?{...s.stats.winterWater}:null,carrionWaterStanding:s.world.carrionWater?+s.world.carrionWater.reduce((x,y)=>x+y,0).toFixed(1):null})}
console.log(JSON.stringify({clock:arg,seed,days,seconds:Math.round((Date.now()-t0)/1000),rows},null,0));
