// Movement dynamics baseline for the inertia design (docs/INERTIA-DESIGN-2026-10-28.md).
// Runs a new-game world (planetary, current opt-ins) and reports, per moving body-tick:
// heading changes, reversals and whether a land reversal sits within one step of the
// body's own target (overshoot), observed speeds, distance per moving step, and hunt
// attempts, kills and chase durations. Observation only; nothing is tuned.
// Usage: node tools/measure-movement-dynamics.mjs [seed] [days] [--inertia]
import {Simulation} from '../../src/sim/simulation.js';
import {CFG} from '../../src/sim/config.js';

const args=process.argv.slice(2).filter(a=>!a.startsWith('--')),inertia=process.argv.includes('--inertia');
const seed=args[0]||'INERTIA-MEASURE',days=Number(args[1]||15);
if(!(days>0&&days<=200))throw Error('Supply 1..200 days');
const sim=new Simulation(seed,{player:true,autonomousPopulations:true,courtshipSimilarity:true,regionalFounding:'regional-founding-templates/2',
 dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,tissueEnergy:true,perennialRegrowth:true,
 bodySize:true,inertia,worldGenerator:'planetary/1',regionalFrontier:true});
sim.setPlayerAutonomy?.(true);
const last=new Map(),turn={steps:0,over30:0,over90:0,over150:0},speeds=[],intents={},land={reversals:0,withinOneStep:0};
let attempts=0,kills=0,distance=0,moving=0;const chases=new Map(),chaseTicks=[];
const tryKill=sim.tryKill.bind(sim);sim.tryKill=(p,q)=>{attempts++;const r=tryKill(p,q);if(!q.alive)kills++;return r};
const started=Date.now(),end=sim.day+days;
while(sim.day<end){
 sim.update(null);
 for(const a of sim.animals){
  if(!a.alive)continue;const p=last.get(a.id);last.set(a.id,{x:a.x,y:a.y,vx:p?a.x-p.x:0,vy:p?a.y-p.y:0});if(!p)continue;
  const vx=a.x-p.x,vy=a.y-p.y,v=Math.hypot(vx,vy);if(!(v>1e-4))continue;
  moving++;distance+=v;speeds.push(v*CFG.simHz);
  const pv=Math.hypot(p.vx,p.vy);
  if(pv>1e-4){
   const cos=Math.max(-1,Math.min(1,(vx*p.vx+vy*p.vy)/(v*pv))),angle=Math.acos(cos)*180/Math.PI,k=a.intent||'none';
   turn.steps++;if(angle>30)turn.over30++;if(angle>90)turn.over90++;if(angle>150)turn.over150++;
   intents[k]??={steps:0,over90:0};intents[k].steps++;if(angle>90)intents[k].over90++;
   if(angle>150&&!sim.world.water[sim.world.idx(a.x,a.y)]){land.reversals++;const t=a.target;if(Number.isFinite(t?.x)&&Math.hypot(t.x-p.x,t.y-p.y)<=pv*1.05)land.withinOneStep++}
  }
  if(a.intent==='hunt'&&a.target?.alive)chases.set(a.id,(chases.get(a.id)||0)+1);else if(chases.has(a.id)){chaseTicks.push(chases.get(a.id));chases.delete(a.id)}
 }
}
speeds.sort((x,y)=>x-y);chaseTicks.sort((x,y)=>x-y);
const q=f=>speeds.length?+speeds[Math.floor(f*(speeds.length-1))].toFixed(2):0,share=(n,d)=>d?+(n/d).toFixed(3):0;
console.log(JSON.stringify({schema:'genvo.movement-dynamics/1',seed,days,inertia,simHz:CFG.simHz,seconds:Math.round((Date.now()-started)/1000),
 turning:{steps:turn.steps,over30:share(turn.over30,turn.steps),over90:share(turn.over90,turn.steps),over150:share(turn.over150,turn.steps)},
 landReversals:{...land,overshootShare:share(land.withinOneStep,land.reversals),perMovingStep:share(land.reversals,moving)},
 speedTilesPerSecond:{p50:q(.5),p90:q(.9),p99:q(.99)},tilesPerMovingStep:share(distance,moving),
 reversalByIntent:Object.fromEntries(Object.entries(intents).filter(([,v])=>v.steps>=500).map(([k,v])=>[k,share(v.over90,v.steps)])),
 hunts:{attempts,kills,chases:chaseTicks.length,medianChaseTicks:chaseTicks[Math.floor(chaseTicks.length/2)]||0}},null,1));
