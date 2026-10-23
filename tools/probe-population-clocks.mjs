// Usage: node tools/probe-population-clocks.mjs <6s|30s|v1|v1f> [days=360] [seed=GENVO8-TEST-A]
// v1: 30-second days with real daily needs (ecology/metabolism-policy.js); v1f: v1 plus food properties.
// Long-run population record for one day clock: alive per species every 30 days, births, deaths
// by cause, and plant cover, with the player's creature on AUTO. Run once per clock on the same
// seed and compare. Measurement only.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
const clock=process.argv[2]||'6s',days=Number(process.argv[3]||360),seed=process.argv[4]||'GENVO8-TEST-A';
const s=new Simulation(seed,{player:true,dayClock:clock!=='6s',metabolism:clock==='v1'||clock==='v1f',foodProperties:clock==='v1f',worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const deaths={},seen=new Set(s.animals.map(a=>a.id)),kill=s.kill.bind(s);let births=0;s.kill=(a,c)=>{if(a?.alive)deaths[c]=(deaths[c]||0)+1;return kill(a,c)};
const plants=()=>{let t=0;for(const k of Object.keys(s.world.plants))for(const v of s.world.plants[k])t+=v;return +t.toFixed(0)};
const census=()=>{const c={};for(const a of s.animals)if(a.alive&&!a.player)c[a.species]=(c[a.species]||0)+1;return c};
const rows=[{day:s.day,alive:census(),plants:plants()}],t0=Date.now();
for(let d=1;d<=days;d++){for(let t=0;t<CFG.dayTicks;t++)s.update(null);for(const a of s.animals)if(!seen.has(a.id)){seen.add(a.id);births++}if(d%30===0)rows.push({day:s.day,alive:census(),plants:plants(),births,deaths:{...deaths}})}
console.log(JSON.stringify({clock,seed,days,seconds:Math.round((Date.now()-t0)/1000),rows},null,0));
