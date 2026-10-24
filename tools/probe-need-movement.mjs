// Usage: node tools/probe-need-movement.mjs [days=6] [seed=GENVO8-TEST-A] [rules=recorded|v1] [old]
// v1 adds real needs and food properties on both clocks; old switches off the herd-allowance correction on the
// 30-second day.
// Wildlife ground covered per animal-day under each day clock, split by whether the animal had a
// pressing need when it moved (low food or water, danger, mating, hunting, care of young) and by
// intent. Measurement only.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
const days=Number(process.argv[2]||6),seed=process.argv[3]||'GENVO8-TEST-A',v1=process.argv[4]==='v1',old=process.argv[5]==='old';
const NEED=new Set(['feed','drink','to-water','learn-water','learn-food','hunt','escape','refuge','shelter','group-alarm','wary','mate','mob','guard','guardian-hold','provision-food','provision-home','stalk-player','chase-player','charge-player','hunt-windup','search-player','migrate','stranger-avoid','stranger-posture','dig','shelter-feed','stealth-forage']);
for(const dayClock of [false,true]){
 const s=new Simulation(seed,{player:true,dayClock,metabolism:v1,foodProperties:v1,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);if(old)s.correctionExperiment={socialAllowance:false};for(let t=0;t<CFG.dayTicks*2;t++)s.update(null);
 const need={},free={},pos=new Map();let n=0;
 for(let t=0;t<CFG.dayTicks*days;t++){for(const a of s.animals)if(a.alive)pos.set(a.id,[a.x,a.y,a.intent,a.energy/SPECIES[a.species].maxEnergy,a.hydration/SPECIES[a.species].maxHydration]);s.update(null);
  for(const a of s.animals){const p=pos.get(a.id);if(!a.alive||!p||a.player)continue;const d=Math.hypot(a.x-p[0],a.y-p[1]);if(d>3||!d)continue;const pressing=NEED.has(p[2])||p[3]<.6||p[4]<.5;(pressing?need:free)[p[2]]=((pressing?need:free)[p[2]]||0)+d}}
 n=s.animals.filter(a=>a.alive&&!a.player).length;const sum=o=>Object.values(o).reduce((x,y)=>x+y,0)/n/days;
 console.log(dayClock?'30s':'6s ',`tiles/animal-day ${(sum(need)+sum(free)).toFixed(1)}: with need ${sum(need).toFixed(1)}, without ${sum(free).toFixed(1)}`);
 console.log('   without need:',Object.entries(free).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`${k} ${(v/n/days).toFixed(2)}`).join(', '));
 console.log('   with need:',Object.entries(need).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k} ${(v/n/days).toFixed(2)}`).join(', '));
}
