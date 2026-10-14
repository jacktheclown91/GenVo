import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
const sim=new Simulation('GENVO8-TEST-C',{player:false});
const deaths={}; const births={};
const origKill=sim.kill.bind(sim); sim.kill=(a,c)=>{(deaths[a.species]??={})[c]=(deaths[a.species]?.[c]||0)+1; return origKill(a,c)};
const origBirth=sim.giveBirth.bind(sim); sim.giveBirth=(m)=>{const kids=origBirth(m); births[m.species]=(births[m.species]||0)+kids.length; return kids};
function stat(sp){const arr=sim.animals.filter(a=>a.alive&&a.species===sp),s=SPECIES[sp];const adults=arr.filter(a=>a.age>=s.maturity);const females=adults.filter(a=>a.sex==='F'),males=adults.filter(a=>a.sex==='M');const ready=adults.filter(a=>a.reproCooldown<=0&&a.energy/s.maxEnergy>(s.reproduction?.energy??.72));const avg=(f)=>arr.length?arr.reduce((z,a)=>z+f(a),0)/arr.length:0;return{n:arr.length,adults:adults.length,f:females.length,m:males.length,ready:ready.length,age:+avg(a=>a.age).toFixed(1),e:+avg(a=>a.energy/s.maxEnergy).toFixed(2),h:+avg(a=>a.hydration/s.maxHydration).toFixed(2),drive:+avg(a=>a.reproDrive||0).toFixed(2)}}
for(;sim.day<=640;sim.update(null)){if(sim.tickCount%48===0 && ((sim.day-1)%32===0 || sim.day>560&& (sim.day-1)%8===0)){console.log(JSON.stringify({day:sim.day,year:sim.year,root:stat('rootling'),gen:stat('genvo'),pred:stat('needlejaw'),moss:stat('mosskip')}))}}
console.log('births',births); console.log('deaths',deaths); console.log('final',sim.population());
