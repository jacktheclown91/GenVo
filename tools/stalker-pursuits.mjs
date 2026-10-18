// Stalker pursuit episodes (Phase 3J Step 3, diagnostic; read-only). A pursuit starts when a Stalker takes
import {HUNT_COMMITMENT as __HC} from '../src/ecology/hunt-commitment.js';if(process.env.COMMIT==='0')__HC.enabled=false;
// a 'hunt' intent on a living target and ends when its intent or target changes. Records how it ended:
// contact (a bite was attempted), target died, target out of sight/hidden, or abandoned while near/far, with
// start/end distance and duration. Usage: node tools/stalker-pursuits.mjs <seed> [days=180]
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';
const [seed='NJ-A',daysArg='180']=process.argv.slice(2),sim=new Simulation(seed,{player:false});
const open=new Map(),done=[],contacted=new Set();
const tk=sim.tryKill.bind(sim);sim.tryKill=(a,b,o)=>{if(a.species==='needlejaw'){const e=open.get(a.id);if(e&&e.targetId===b.id)e.contact=true}return tk(a,b,o)};
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0){sim.update(null);
  for(const a of sim.animals){if(a.species!=='needlejaw')continue;const e=open.get(a.id),hunting=a.alive&&a.intent==='hunt'&&a.target?.alive!=null&&a.target?.species;
    if(e&&(!hunting||a.target.id!==e.targetId)){const t=sim.animals.find(x=>x.id===e.targetId);const dist=t&&a.alive?Math.hypot(t.x-a.x,t.y-a.y):null;
      e.end=e.contact?'contact':!t?.alive?'target-died':(a.alive&&t&&sim.preyHiddenFrom(t,a,dist))?'target-hidden':dist!=null&&dist<2?'abandoned-near':'abandoned-far';e.endDist=dist;e.ticks=sim.tickCount-e.start;e.nextIntent=a.intent;e.hunterE=+(a.energy/SPECIES.needlejaw.maxEnergy).toFixed(2);done.push(e);open.delete(a.id)}
    if(hunting&&!open.has(a.id))open.set(a.id,{targetId:a.target.id,prey:a.target.species,start:sim.tickCount,startDist:Math.hypot(a.target.x-a.x,a.target.y-a.y),contact:false})}}}
const by={};for(const e of done){const k=by[e.end]??={n:0,startDist:0,ticks:0,next:{}};k.n++;k.startDist+=e.startDist;k.ticks+=e.ticks;k.next[e.nextIntent]=(k.next[e.nextIntent]||0)+1}
for(const k of Object.values(by)){k.meanStartDist=+(k.startDist/k.n).toFixed(1);k.meanTicks=+(k.ticks/k.n).toFixed(1);delete k.startDist;delete k.ticks;k.next=Object.fromEntries(Object.entries(k.next).sort((a,b)=>b[1]-a[1]).slice(0,4))}
console.log(JSON.stringify({seed,pursuits:done.length,byEnd:by}));
