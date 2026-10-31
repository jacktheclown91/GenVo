// Usage: node tools/probe-day-clock.mjs [days=30] [seed=GENVO8-TEST-A]
// Day-clock parity evidence (sim/day-clock.js): the same seed under the recorded 6-second day and
// the 30-second day. Per-day biology (resting costs, ageing, births, deaths, plant cover) should
// keep its daily rates; real-time movement covers about five times more ground per day.
import {Simulation} from '../../src/sim/simulation.js';
import {CFG} from '../../src/sim/config.js';
import {SPECIES} from '../../src/organisms/species.js';
const days=Number(process.argv[2]||30),seed=process.argv[3]||'GENVO8-TEST-A';
const IDLE={up:false,down:false,left:false,right:false,sprint:false,brace:false};
const plants=s=>{let t=0;for(const k of Object.keys(s.world.plants))for(const v of s.world.plants[k])t+=v;return t};
const out={};
for(const dayClock of [false,true]){
 // Resting budget: an idle adult, no food or water.
 const r=new Simulation(seed,{player:true,dayClock,worldGenerator:'planetary/1'}),p=r.player(),S=SPECIES[p.species];
 for(let t=0;t<CFG.dayTicks;t++)r.update(IDLE);const e0=p.energy,w0=p.hydration,a0=p.age;for(let t=0;t<CFG.dayTicks*4;t++)r.update(IDLE);
 const rest={energyPerDay:+((e0-p.energy)/4).toFixed(3),waterPerDay:+((w0-p.hydration)/4).toFixed(3),agePerDay:+((p.age-a0)/4).toFixed(3),dayTicks:CFG.dayTicks,bioStride:CFG.bioStride};
 // Walking range: one day holding a direction, turning every two seconds.
 const m=new Simulation(seed,{player:true,dayClock,worldGenerator:'planetary/1'}),q=m.player();let dist=0,steps=0,dir=0;const dirs=['right','down','left','up'],ratio=CFG.controlHz/CFG.simHz;
 for(let t=0;t<CFG.dayTicks;t++){for(let k=0;k<ratio;k++){const input={...IDLE,[dirs[dir%4]]:true},x=q.x,y=q.y;m.playerControlStep(input,CFG.controlHz);dist+=Math.hypot(q.x-x,q.y-y);if(++steps%(CFG.controlHz*2)===0)dir++}m.update(IDLE)}
 // Population over `days` days with the player on AUTO.
 const w=new Simulation(seed,{player:true,dayClock,worldGenerator:'planetary/1'});w.setPlayerAutonomy(true);let births=0,deaths={};const ids=new Set(w.animals.map(a=>a.id));const kill=w.kill.bind(w);w.kill=(a,c)=>{if(a?.alive)deaths[c]=(deaths[c]||0)+1;return kill(a,c)};
 const plants0=plants(w),t0=Date.now();
 for(let t=0;t<CFG.dayTicks*days;t++){w.update(null);if(t%CFG.dayTicks===0)for(const a of w.animals)if(!ids.has(a.id)){ids.add(a.id);births++}}
 out[dayClock?'30s':'6s']={rest,walkTilesPerDay:+dist.toFixed(1),population:{days,day:w.day,alive:w.animals.filter(a=>a.alive).length,births,deaths,plantCoverChange:+(plants(w)/plants0).toFixed(3),seconds:+((Date.now()-t0)/1000).toFixed(0)}};
}
console.log(JSON.stringify(out,null,1));
