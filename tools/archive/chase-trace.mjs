// Chase-episode trace (decision-coordination audit; read-only hooks, no world edits). A chase starts when a
// Stalker (needlejaw) takes intent 'hunt' on a living animal and ends when its intent or target changes.
// Per episode, tick by tick: hunter-prey distance, distance each covered (speed), whether the prey was
// fleeing (escape / group-alarm / refuge / shelter), whether the prey was in water, the hunter's next intent
// and, if the hunter turned to 'escape', which animal it was fleeing. Usage:
//   node tools/chase-trace.mjs <seed> [days=150] [player=0]
import {Simulation} from '../../src/sim/simulation.js';import {SPECIES} from '../../src/organisms/species.js';import {CFG} from '../../src/sim/config.js';
const [seed='NJ-A',daysArg='150',playerArg='0']=process.argv.slice(2),sim=new Simulation(seed,{player:playerArg==='1'});
if(playerArg==='1'){sim.endOpeningGrace?.('audit');sim.setPlayerAutonomy(true)}
const FLEE=new Set(['escape','group-alarm','refuge','shelter','mob']),open=new Map(),done=[];
const tk=sim.tryKill.bind(sim);sim.tryKill=(a,b,o)=>{const e=open.get(a.id);if(e&&e.targetId===b.id)e.contacts++;return tk(a,b,o)};
const pos=new Map();
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0){
  for(const a of sim.animals)if(a.alive)pos.set(a.id,{x:a.x,y:a.y});
  sim.update(null);
  for(const h of sim.animals){if(h.species!=='needlejaw'||h.age<SPECIES.needlejaw.maturity)continue;const e=open.get(h.id);
    const hunting=h.alive&&h.intent==='hunt'&&h.target?.species&&h.target.alive;
    if(e){const t=sim.animals.find(x=>x.id===e.targetId);
      if(t&&h.alive){const ph=pos.get(h.id),pt=pos.get(t.id);const dist=Math.hypot(t.x-h.x,t.y-h.y);e.minDist=Math.min(e.minDist,dist);e.ticks++;
        if(ph)e.hunterMoved+=Math.hypot(h.x-ph.x,h.y-ph.y);if(pt)e.preyMoved+=Math.hypot(t.x-pt.x,t.y-pt.y);if(FLEE.has(t.intent))e.preyFleeTicks++;if(sim.world.water[sim.world.idx(t.x,t.y)])e.preyWaterTicks++;
        const st=sim.activity.movementBudget(h).stride;if(st>1)e.strideTicks++;e.lastDist=dist}
      if(!hunting||h.target.id!==e.targetId){
        e.end=e.contacts?'contact':!t?.alive?'target-died':!h.alive?'hunter-died':'released';e.next=h.alive?h.intent:'dead';
        if(e.next==='escape'||e.next==='group-alarm'){const threat=sim.findNearest(h,b=>sim.isPredatorTo(b,h),12);e.fledFrom=threat?(threat.species===h.species?'other Stalker':threat.species):'(none within 12)'}
        if(e.end==='released'&&t?.alive)e.preyHiddenNow=!!sim.preyHiddenFrom(t,h,Math.hypot(t.x-h.x,t.y-h.y)),e.sameLand=sim.world.sameLand(h.x,h.y,t.x,t.y);
        e.hunterEnergyEnd=+(h.energy/SPECIES.needlejaw.maxEnergy).toFixed(2);done.push(e);open.delete(h.id)}}
    if(hunting&&!open.has(h.id))open.set(h.id,{targetId:h.target.id,prey:h.target.species,startDist:Math.hypot(h.target.x-h.x,h.target.y-h.y),minDist:Infinity,lastDist:null,ticks:0,contacts:0,hunterMoved:0,preyMoved:0,preyFleeTicks:0,preyWaterTicks:0,strideTicks:0,startEnergy:+(h.energy/SPECIES.needlejaw.maxEnergy).toFixed(2)})}}}
const n=done.length,mean=f=>n?+(done.reduce((s,e)=>s+f(e),0)/n).toFixed(3):null,count=f=>done.filter(f).length;
const byNext={};for(const e of done)if(e.end==='released'){const k=e.next+(e.fledFrom?' from '+e.fledFrom:'');byNext[k]=(byNext[k]||0)+1}
const sec=CFG.simHz;
const summary={seed,chases:n,ends:{contact:count(e=>e.end==='contact'),targetDied:count(e=>e.end==='target-died'),released:count(e=>e.end==='released')},
  meanTicks:mean(e=>e.ticks),meanStartDist:mean(e=>e.startDist),meanMinDist:mean(e=>Number.isFinite(e.minDist)?e.minDist:e.startDist),reachedContactRange:count(e=>e.minDist<=.85),
  hunterSpeedTilesPerSec:mean(e=>e.ticks?e.hunterMoved/e.ticks*sec:0),preySpeedTilesPerSec:mean(e=>e.ticks?e.preyMoved/e.ticks*sec:0),
  preyFledShare:mean(e=>e.ticks?e.preyFleeTicks/e.ticks:0),preyInWaterShare:mean(e=>e.ticks?e.preyWaterTicks/e.ticks:0),strideShare:mean(e=>e.ticks?e.strideTicks/e.ticks:0),
  releasedWhilePreyHidden:count(e=>e.preyHiddenNow),releasedAcrossWater:count(e=>e.sameLand===false),releasedNext:Object.fromEntries(Object.entries(byNext).sort((a,b)=>b[1]-a[1]).slice(0,10)),
  startEnergyMedian:(()=>{const v=done.map(e=>e.startEnergy).sort((a,b)=>a-b);return v[v.length>>1]})()};
console.log(JSON.stringify(summary));
if(process.env.SAMPLES)console.log(JSON.stringify(done.slice(0,Number(process.env.SAMPLES))));
