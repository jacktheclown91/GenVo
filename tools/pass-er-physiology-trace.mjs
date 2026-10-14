import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
const seed=process.argv[2]||'EK-NATURAL-WORK-INTERRUPTION';
const end=Number(process.argv[3]||168);
const sim=new Simulation(seed,{player:false});
const realDig=sim.partAbilities.dig.bind(sim.partAbilities);
let completed=0, prevented=0, attemptedAfter=0, returned=0, last=0;
let samples=[];
sim.partAbilities.dig=a=>{if(sim.day>=61&&sim.day<=128){prevented++;return{ok:false,type:'dig',quiet:true,message:'Study pause'}};if(sim.day>128)attemptedAfter++;const result=realDig(a);if(result.ok){completed++;if(sim.day>128)returned++}return result};
const average=(a,f)=>a.length?(a.reduce((n,x)=>n+f(x),0)/a.length):null;
while(sim.day<=end){sim.update(null);if(sim.day===last)continue;last=sim.day;
 if(last===30||last===60||last===90||last===120||last===129||last===140||last===150||last===168){const animals=sim.animals.filter(a=>a.alive&&hasPart(a,'digging-forelimb'));
 const digs=animals.filter(a=>sim.partAbilities.canDigAt(a));const healthy=animals.filter(a=>a.health>=65&&!a.infected);const hungry=animals.filter(a=>a.energy/SPECIES[a.species].maxEnergy<.72);const thirsty=animals.filter(a=>a.hydration/SPECIES[a.species].maxHydration<.58);const reported={day:last,alive:animals.length,canDig:digs.length,healthy:healthy.length,hungry:hungry.length,thirsty:thirsty.length,meanEnergy:average(animals,a=>a.energy/SPECIES[a.species].maxEnergy)?.toFixed(3),meanWater:average(animals,a=>a.hydration/SPECIES[a.species].maxHydration)?.toFixed(3),meanHealth:average(animals,a=>a.health)?.toFixed(1),infected:animals.filter(a=>a.infected).length,priority:Object.fromEntries([...new Set(animals.map(a=>a.intent))].map(i=>[i,animals.filter(a=>a.intent===i).length])),completed,prevented,attemptedAfter,returned};samples.push(reported);console.error('checkpoint',JSON.stringify(reported))}
}
console.log(JSON.stringify({seed,samples,total:{completed,prevented,attemptedAfter,returned}},null,2));
