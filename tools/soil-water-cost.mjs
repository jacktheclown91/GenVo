// Soil-water and weather cost (roadmap stage W). (1) The daily soil step alone on the same restored world state,
// switch on and off, ms per game day. (2) The observer-play 4x large-population measurement (tests/observer-play.mjs)
// with the switches on and off, alternated, median of <reps>. Usage: node tools/soil-water-cost.mjs [reps=7]
import {SOIL_WATER,advanceSoilDay} from '../src/ecology/soil-water.js';import {WEATHER_PATTERNS} from '../src/ecology/weather.js';
import {Simulation} from '../src/sim/simulation.js';import {CFG} from '../src/sim/config.js';import {ObserverController} from '../src/ui/observer.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const reps=+(process.argv[2]||7),med=a=>[...a].sort((x,y)=>x-y)[a.length>>1],r2=v=>+v.toFixed(2);
// (1) Daily soil step on one restored state.
const base=new Simulation('SOIL-COST',{player:false});for(let d=0;d<5;d++){const d0=base.day;while(base.day===d0)base.update(null)}const snap=createSimulationSnapshot(base,{savedAt:'x'});
const soil={};for(const on of [true,false]){SOIL_WATER.enabled=on;const t=[];for(let k=0;k<reps;k++){const s=restoreSimulationSnapshot(structuredClone(snap));s.tickCount=Math.ceil(s.tickCount/CFG.dayTicks)*CFG.dayTicks;
  const t0=performance.now();for(let d=0;d<20;d++){s.phaseSoil();s.tickCount+=CFG.dayTicks}t.push((performance.now()-t0)/20)}soil[on?'on':'off']=r2(med(t))}
SOIL_WATER.enabled=true;
// (2) observer-play measurement.
function play(sim,obs,seconds){const steps=Math.round(CFG.controlHz*seconds*obs.speed),ratio=Math.round(CFG.controlHz/CFG.simHz);for(let i=0;i<steps;i++){sim.playerControlStep(null,CFG.controlHz);if(i%ratio===ratio-1)sim.update(null,{externalPlayerControl:true});if(i%32===31)obs.observe()}}
function observer(){const sim=new Simulation('GENVO8-OBSERVER-PERF',{player:true});sim.endOpeningGrace('test');
  while(sim.animals.filter(a=>a.alive).length<CFG.performanceTarget){const k=['mosskip','rootling','genvo','mosskip'][sim.animals.length%4];sim.spawnAnimal(k)}
  const obs=new ObserverController(()=>sim);obs.setSpeed(4);for(let i=0;i<40;i++)sim.update(null,{externalPlayerControl:true});const t0=performance.now();play(sim,obs,2);return(performance.now()-t0)/2}
const obs={on:[],off:[]};for(let k=0;k<reps;k++)for(const on of [true,false]){SOIL_WATER.enabled=WEATHER_PATTERNS.enabled=on;obs[on?'on':'off'].push(observer())}
console.log(JSON.stringify({soilStepMsPerDay:soil,observerPlayMsPerRealSecond:{on:r2(med(obs.on)),off:r2(med(obs.off)),onAll:obs.on.map(r2),offAll:obs.off.map(r2)}}));
