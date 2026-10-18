// Persistent weather rules (roadmap stage W, src/ecology/weather.js): rain keeps its seasonal mean (no added
// water), days are autocorrelated, wet and dry spells, storms and multi-season droughts emerge as runs of the
// process, the weather is reproducible for a seed and different between seeds, and ?weatherPatterns=0 restores the
// previous per-step rain exactly.
import assert from 'node:assert/strict';
import {WEATHER_PATTERNS,createWeatherState,advanceWeatherTo} from '../src/ecology/weather.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {RNG} from '../src/core/rng.js';
// Long-run factor statistics over 1,000 years of days on each of three seeds.
const runs=flags=>{const out=[];let n=0;for(const f of flags){if(f)n++;else if(n){out.push(n);n=0}}if(n)out.push(n);return out};
let sum=0,count=0,ac=0,v=0;const drought=[],wet=[],dry=[];
for(const seed of ['WX-1','WX-2','WX-3']){const st=createWeatherState(seed),f=[];for(let d=0;d<CFG.seasonDays*4*1000;d++){advanceWeatherTo(st,d);f.push(st.factor)}
  for(let i=0;i<f.length;i++){sum+=f[i];count++;v+=(f[i]-1)**2;if(i)ac+=(f[i]-1)*(f[i-1]-1)}
  let acc=[];for(const x of f){acc.push(x);if(acc.length>16)acc.shift();drought.push(acc.length===16&&acc.reduce((a,b)=>a+b,0)/16<=.7);wet.push(x>=1.25);dry.push(x<=.6)}drought.push(false);wet.push(false);dry.push(false)}
assert.ok(Math.abs(sum/count-1)<.03,`long-run mean rain factor is 1, nothing added (${sum/count})`);
assert.ok(ac/v>.5,`daily weather is persistent (lag-1 autocorrelation ${ac/v})`);
const D=runs(drought),W=runs(wet),Y=runs(dry);
assert.ok(D.length>=5&&Math.max(...D)>=CFG.seasonDays*2,`multi-season droughts occur (${D.length}, longest ${Math.max(...D)} days)`);
assert.ok(W.length>50&&Y.length>50&&Math.max(...W)>3&&Math.max(...Y)>3,'wet and dry spells occur and last several days');
// Reproducible per seed, different between seeds.
const day=(seed,n)=>{const st=createWeatherState(seed);advanceWeatherTo(st,n);return st};
assert.deepEqual(day('WX-1',300),day('WX-1',300));assert.notEqual(day('WX-1',300).factor,day('WX-2',300).factor);
// In the simulation: constant within a day, storms (rain >= 0.72, the heavy-rain label) occur over a few years.
{const sim=new Simulation('WX-SIM',{player:false,bootstrap:false});let storms=0,changesWithinDay=0;
  for(let d=0;d<CFG.seasonDays*4*12;d++){let first=null;for(let t=0;t<CFG.dayTicks;t++){sim.phaseClimate();if(first===null)first=sim.climate.rain;else if(sim.climate.rain!==first)changesWithinDay++;sim.tickCount++}
    if(first>=.72)storms++;assert.ok(Number.isFinite(sim.climate.temp)&&sim.climate.rain>=0);
    sim.day++;if((sim.day-1)%CFG.seasonDays===0){sim.seasonIndex=(sim.seasonIndex+1)%4;if(sim.seasonIndex===0)sim.year++}}
  assert.equal(changesWithinDay,0,'rain is a daily weather state');assert.ok(storms>0,'storms occur within 12 years');}
// Switch off: the previous rule, value for value.
WEATHER_PATTERNS.enabled=false;try{const sim=new Simulation('WX-OLD',{player:false,bootstrap:false}),shadow=new RNG('WX-OLD');shadow.state=sim.rng.state;
  for(let t=0;t<200;t++){sim.phaseClimate();const expected=[.58,.35,.46,.26][sim.seasonIndex]*(.75+.5*shadow.next());assert.equal(sim.climate.rain,expected);assert.deepEqual(Object.keys(sim.climate),['temp','rain'])}}
finally{WEATHER_PATTERNS.enabled=true}
console.log('weather-patterns: ok');
