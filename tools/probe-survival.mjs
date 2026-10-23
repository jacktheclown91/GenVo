// Usage: node tools/probe-survival.mjs [mode=auto|idle] [days=128] [seeds=PLANET-OBS-3,PLANET-OBS-2,GENVO8-TEST-A]
// Survival evidence for the GenVo v1 survival rebalance (Phase 1). Runs real worlds with the
// player's creature either on AUTO (passive survival) or with no input at all (idle), and records
// per day what it cost to stay alive: energy, water and health minima, distance walked, damage
// taken, and every death of the controlled creature with its cause (sim.kill is observed, not
// changed). Measurement only.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
const mode=process.argv[2]||'auto',days=Number(process.argv[3]||128),seeds=(process.argv[4]||'PLANET-OBS-3,PLANET-OBS-2,GENVO8-TEST-A').split(',');
// Idle sends an input object with nothing pressed, as the browser does every frame; null input
// would let the decision step treat the creature as autonomous.
const IDLE=Object.freeze({up:false,down:false,left:false,right:false,sprint:false,brace:false});
const q=(l,p)=>{const s=[...l].sort((a,b)=>a-b);return s.length?+s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(2):null};
const out=[];
for(const seed of seeds){
 const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true});sim.setPlayerAutonomy(mode==='auto');
 const deaths=[],kill=sim.kill.bind(sim);sim.kill=(a,cause)=>{if(a?.alive&&(a.player||a.id===sim.playerId))deaths.push({day:sim.day,id:a.id,cause,age:+(a.age||0).toFixed(1),generation:a.generation||1,energy:+(a.energy/SPECIES[a.species].maxEnergy).toFixed(2),water:+(a.hydration/SPECIES[a.species].maxHydration).toFixed(2)});return kill(a,cause)};
 const daily=[];let last=null,ended=null;
 for(let d=0;d<days;d++){const row={day:sim.day,season:sim.season,minE:1,minW:1,minH:100,dist:0,damage:0,playerId:sim.player()?.id??null};
  for(let t=0;t<CFG.dayTicks;t++){const p=sim.player();if(!p?.alive){ended={day:sim.day,reason:'no controlled creature'};break}
   const s=SPECIES[p.species],before={x:p.x,y:p.y,h:p.health,id:p.id};sim.update(mode==='idle'?IDLE:null);const a=sim.player();if(!a)continue;
   if(a.id===before.id){row.dist+=Math.hypot(a.x-before.x,a.y-before.y);row.damage+=Math.max(0,before.h-a.health)}
   row.minE=Math.min(row.minE,a.energy/s.maxEnergy);row.minW=Math.min(row.minW,a.hydration/s.maxHydration);row.minH=Math.min(row.minH,a.health)}
  for(const k of ['minE','minW','dist','damage'])row[k]=+row[k].toFixed(2);row.minH=+row.minH.toFixed(0);daily.push(row);if(ended)break}
 const alive=daily.filter(r=>r.playerId!=null),lineage=sim.animals.filter(a=>a.alive&&a.lineage).length;
 out.push({seed,mode,daysRun:daily.length,ended,deaths,controlledCreatures:new Set(daily.map(r=>r.playerId)).size,lineageAlive:lineage,
  energyMin:{p05:q(alive.map(r=>r.minE),.05),p50:q(alive.map(r=>r.minE),.5)},waterMin:{p05:q(alive.map(r=>r.minW),.05),p50:q(alive.map(r=>r.minW),.5)},healthMin:{p05:q(alive.map(r=>r.minH),.05),p50:q(alive.map(r=>r.minH),.5)},
  tilesPerDay:{p50:q(alive.map(r=>r.dist),.5),p90:q(alive.map(r=>r.dist),.9)},daysWithDamage:alive.filter(r=>r.damage>0).length,
  bySeason:Object.fromEntries(['SPRING','SUMMER','AUTUMN','WINTER'].map(s=>{const l=alive.filter(r=>r.season===s);return[s,{days:l.length,minE:q(l.map(r=>r.minE),.1),minW:q(l.map(r=>r.minW),.1),tiles:q(l.map(r=>r.dist),.5)}]}))});
 console.error(`${seed} ${mode}: ${daily.length} days, deaths ${deaths.length}`);
}
console.log(JSON.stringify(out,null,1));
