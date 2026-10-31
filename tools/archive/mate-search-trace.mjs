// Mate-search episode trace (decision-coordination audit; read-only hooks). An episode starts when an
// adult of the named species takes intent 'mate' on a living partner and ends when its intent or target
// changes. Records start distance, closest approach, duration in ecology steps, whether a mating attempt
// happened, the next intent and the seeker's energy against its breeding gate at the end. Usage:
//   node tools/mate-search-trace.mjs <species> <seed> [days=200]
import {Simulation} from '../../src/sim/simulation.js';import {SPECIES} from '../../src/organisms/species.js';import {CFG} from '../../src/sim/config.js';import {breedingEnergyGate} from '../../src/ecology/breeding-calibration.js';
const [species='needlejaw',seed='NJ-A',daysArg='200']=process.argv.slice(2),sim=new Simulation(seed,{player:false}),S=SPECIES[species],gate=breedingEnergyGate(species);
const open=new Map(),done=[];
const tm=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{for(const x of [a,b]){const e=open.get(x.id);if(e&&(e.partnerId===a.id||e.partnerId===b.id))e.attempted=true}return tm(a,b)};
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0){sim.update(null);if(sim.tickCount%CFG.lifeStride!==0)continue;
  for(const a of sim.animals){if(a.species!==species||a.age<S.maturity)continue;const e=open.get(a.id),seeking=a.alive&&a.intent==='mate'&&a.target?.alive&&a.target.species;
    if(e){const t=sim.animals.find(x=>x.id===e.partnerId);if(t&&a.alive){const dist=Math.hypot(t.x-a.x,t.y-a.y);e.minDist=Math.min(e.minDist,dist);e.steps++}
      if(!seeking||a.target.id!==e.partnerId){e.next=a.alive?a.intent:'dead';if(e.next==='escape'&&a.alive){const thr=sim.findNearest(a,b=>sim.isPredatorTo(b,a)&&Math.hypot(b.x-a.x,b.y-a.y)<12,12);e.fledFromPartner=!!thr&&thr.id===e.partnerId;e.fledFrom=thr?(thr.id===e.partnerId?'the partner ('+thr.intent+(thr.target?.id===a.id?' at me':'')+', d'+Math.hypot(thr.x-a.x,thr.y-a.y).toFixed(1)+')':thr.species):null;}e.energyEnd=+(a.energy/S.maxEnergy).toFixed(2);e.belowGate=a.energy/S.maxEnergy<gate;e.partnerReady=!!(t?.alive&&(t.reproCooldown||0)<=0&&!t.pregnant&&t.energy/SPECIES[t.species].maxEnergy>=breedingEnergyGate(t.species));done.push(e);open.delete(a.id)}}
    if(seeking&&!open.has(a.id))open.set(a.id,{partnerId:a.target.id,partnerSpecies:a.target.species,startDist:Math.hypot(a.target.x-a.x,a.target.y-a.y),minDist:Infinity,steps:0,attempted:false,energyStart:+(a.energy/S.maxEnergy).toFixed(2)})}}}
const n=done.length,q=(f,p=.5)=>{const v=done.map(f).filter(Number.isFinite).sort((a,b)=>a-b);return v.length?+v[Math.floor(p*(v.length-1))].toFixed(2):null};
const next={};for(const e of done)if(!e.attempted)next[e.next]=(next[e.next]||0)+1;
console.log(JSON.stringify({species,seed,episodes:n,attempted:done.filter(e=>e.attempted).length,sameSpeciesPartner:done.filter(e=>e.partnerSpecies===species).length,
  startDist:{p25:q(e=>e.startDist,.25),median:q(e=>e.startDist),p75:q(e=>e.startDist,.75)},stepsMedian:q(e=>e.steps),closedMedian:q(e=>e.startDist-(Number.isFinite(e.minDist)?e.minDist:e.startDist)),
  endedBelowGate:done.filter(e=>!e.attempted&&e.belowGate).length,partnerNoLongerReady:done.filter(e=>!e.attempted&&!e.partnerReady).length,nextIntentWithoutAttempt:next,escapes:done.filter(e=>e.next==='escape').length,escapesFromPartner:done.filter(e=>e.fledFromPartner).length,escapeFrom:done.filter(e=>e.fledFrom).reduce((o,e)=>(o[e.fledFrom]=(o[e.fledFrom]||0)+1,o),{})}));
